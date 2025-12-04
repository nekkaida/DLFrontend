import { useNotifications } from '@/src/hooks/useNotifications';
import {
    Notification,
    NOTIFICATION_CATEGORIES,
    NotificationCategory
} from '@/src/shared/types/notification';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Modal,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface NotificationDrawerProps {
  visible: boolean;
  onClose: () => void;
}

// Helper to get icon name for category
const getNotificationIcon = (category: NotificationCategory): keyof typeof Ionicons.glyphMap => {
  const config = NOTIFICATION_CATEGORIES.find(c => c.value === category);
  return (config?.icon as keyof typeof Ionicons.glyphMap) || 'notifications-outline';
};

// Helper to get color for category
const getNotificationColor = (category: NotificationCategory): string => {
  const config = NOTIFICATION_CATEGORIES.find(c => c.value === category);
  return config?.color || '#6B7280';
};

// Notification Item Component
const NotificationItem = React.memo(({ 
  notification, 
  onMarkAsRead,
  onDelete,
}: { 
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const iconColor = getNotificationColor(notification.category);
  const [showActions, setShowActions] = useState(false);

  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !notification.read && styles.notificationItemUnread
      ]}
      activeOpacity={0.95}
      onPress={() => setShowActions(!showActions)}
      onLongPress={() => setShowActions(true)}
    >
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: iconColor }]}>
        <Ionicons
          name={getNotificationIcon(notification.category)}
          size={24}
          color="#FFFFFF"
        />
      </View>

      {/* Content */}
      <View style={styles.notificationContent}>
        <View style={styles.notificationTextContainer}>
          {notification.title && (
            <Text style={styles.notificationTitle} numberOfLines={2}>
              {notification.title}
            </Text>
          )}
          <Text style={styles.notificationMessage} numberOfLines={3}>
            {notification.message}
          </Text>
          
          <Text style={styles.notificationTime}>
            {notification.createdAt && !isNaN(new Date(notification.createdAt).getTime())
              ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
              : 'Recently'}
          </Text>
        </View>

        {/* Unread indicator dot */}
        {!notification.read && (
          <View style={styles.unreadIndicator} />
        )}
      </View>

      {/* Action buttons - shown on press */}
      {showActions && (
        <View style={styles.actionOverlay}>
          <View style={styles.actionButtons}>
            {!notification.read && (
              <TouchableOpacity
                onPress={() => {
                  onMarkAsRead(notification.id);
                  setShowActions(false);
                }}
                style={[styles.actionButton, styles.actionButtonPrimary]}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.actionButtonTextPrimary}>Mark as read</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              onPress={() => {
                onDelete(notification.id);
                setShowActions(false);
              }}
              style={[styles.actionButton, styles.actionButtonSecondary]}
              activeOpacity={0.8}
            >
              <Ionicons name="trash" size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonTextPrimary}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
});

NotificationItem.displayName = 'NotificationItem';

export default function NotificationDrawer({ visible, onClose }: NotificationDrawerProps) {
  const {
    notifications,
    unreadCount,
    loading,
    refreshing,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
    loadMore,
    hasMore,
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Filter by read status
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(n => n.category === categoryFilter);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n =>
        n.message.toLowerCase().includes(query) ||
        n.title?.toLowerCase().includes(query) ||
        n.category.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [notifications, filter, categoryFilter, searchQuery]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setCategoryFilter('all');
    setFilter('all');
  }, []);

  const handleMarkAsRead = useCallback((id: string) => {
    markAsRead(id).catch(err => console.error('Failed to mark as read:', err));
  }, [markAsRead]);

    const handleDelete = useCallback(
    (id: string) => {
        deleteNotification(id).catch(err => console.error('Failed to delete notification:', err));
    },
    [deleteNotification]
    );

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead().catch(err => console.error('Failed to mark all as read:', err));
  }, [markAllAsRead]);

  const renderNotificationItem = useCallback(({ item }: { item: Notification }) => (
    <NotificationItem
      notification={item}
      onMarkAsRead={handleMarkAsRead}
      onDelete={handleDelete}
    />
  ), [handleMarkAsRead, handleDelete]);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.iconContainer, { backgroundColor: '#F0F2F5', width: 80, height: 80, borderRadius: 40 }]}>
        <Ionicons name="notifications-off-outline" size={40} color="#65676B" />
      </View>
      <Text style={styles.emptyTitle}>
        {filter === 'unread' ? 'No new notifications' : 'No notifications yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'unread' 
          ? "You're all caught up! Check back later for new updates." 
          : "When you get notifications, they'll show up here."}
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <View style={styles.drawerContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>

            <View style={styles.headerRight}>
              {unreadCount > 0 && (
                <TouchableOpacity
                  onPress={handleMarkAllAsRead}
                  style={styles.headerButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="checkmark-done" size={20} color="#050505" />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                onPress={refresh}
                style={styles.headerButton}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Ionicons 
                  name="refresh" 
                  size={20} 
                  color="#050505"
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                style={styles.headerButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#050505" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Filters */}
          <View style={styles.filtersContainer}>
            {/* Quick filter buttons */}
            <View style={styles.quickFilters}>
              <TouchableOpacity
                onPress={() => setFilter('all')}
                style={[
                  styles.filterButton,
                  filter === 'all' && styles.filterButtonActive
                ]}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.filterButtonText,
                  filter === 'all' && styles.filterButtonTextActive
                ]}>
                  All
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFilter('unread')}
                style={[
                  styles.filterButton,
                  filter === 'unread' && styles.filterButtonActive
                ]}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.filterButtonText,
                  filter === 'unread' && styles.filterButtonTextActive
                ]}>
                  Unread
                </Text>
                {unreadCount > 0 && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Search and category filter */}
            <View style={styles.searchRow}>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={16} color="#9CA3AF" style={styles.searchIcon} />
                <TextInput
                  placeholder="Search..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={styles.searchInput}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <TouchableOpacity
                onPress={() => {
                  // Cycle through categories
                  const currentIndex = categoryFilter === 'all' 
                    ? -1 
                    : NOTIFICATION_CATEGORIES.findIndex(c => c.value === categoryFilter);
                  const nextIndex = (currentIndex + 1) % (NOTIFICATION_CATEGORIES.length + 1);
                  setCategoryFilter(
                    nextIndex === 0 ? 'all' : NOTIFICATION_CATEGORIES[nextIndex - 1].value
                  );
                }}
                style={styles.categoryButton}
                activeOpacity={0.7}
              >
                <Ionicons name="filter" size={16} color="#6B7280" />
                <Text style={styles.categoryButtonText}>
                  {categoryFilter === 'all' ? 'All' : categoryFilter}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Clear filters */}
            {(searchQuery || categoryFilter !== 'all' || filter !== 'all') && (
              <TouchableOpacity
                onPress={clearFilters}
                style={styles.clearFiltersButton}
                activeOpacity={0.7}
              >
                <Text style={styles.clearFiltersText}>Clear filters</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Notification List */}
          <FlatList
            data={filteredNotifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item, index) => item.id || `notification-${index}`}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={loading ? null : renderEmpty}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refresh}
                tintColor="#A04DFE"
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loading && notifications.length > 0 ? (
                <View style={styles.loadingFooter}>
                  <ActivityIndicator size="small" color="#A04DFE" />
                </View>
              ) : null
            }
          />

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
                {filter === 'unread' && unreadCount > 0 && ` • ${unreadCount} unread`}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  drawerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.9,
    height: height * 0.9,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#050505',
    letterSpacing: -0.3,
  },
  headerBadge: {
    backgroundColor: '#A04DFE',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 24,
    alignItems: 'center',
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
  },
  rotating: {
    transform: [{ rotate: '360deg' }],
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
    gap: 12,
  },
  quickFilters: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F0F2F5',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#A04DFE',
  },
  filterButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#050505',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  filterBadge: {
    backgroundColor: '#A04DFE',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#050505',
    padding: 0,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    gap: 6,
    height: 40,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#050505',
    textTransform: 'capitalize',
  },
  clearFiltersButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A04DFE',
  },
  listContent: {
    flexGrow: 1,
    backgroundColor: '#F0F2F5',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 1,
    position: 'relative',
  },
  notificationItemUnread: {
    backgroundColor: '#F3E8FF',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationContent: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  notificationTextContainer: {
    flex: 1,
    paddingRight: 8,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#050505',
    lineHeight: 20,
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 15,
    color: '#65676B',
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 13,
    color: '#A04DFE',
    fontWeight: '500',
    marginTop: 4,
  },
  unreadIndicator: {
    position: 'absolute',
    right: 0,
    top: '50%',
    marginTop: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#A04DFE',
  },
  actionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: '#A04DFE',
  },
  actionButtonSecondary: {
    backgroundColor: '#E11D48',
  },
  actionButtonTextPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
    backgroundColor: '#F0F2F5',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#050505',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#65676B',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingFooter: {
    paddingVertical: 24,
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
    backgroundColor: '#FFFFFF',
  },
  footerText: {
    fontSize: 13,
    color: '#65676B',
    textAlign: 'center',
    fontWeight: '500',
  },
});
