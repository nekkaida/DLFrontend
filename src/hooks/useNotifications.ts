import { useSession } from '@/lib/auth-client'; // Assuming this is where you get the session
import { notificationService } from '@/src/services/notificationService';
import {
    Notification,
    NotificationFilter
} from '@/src/shared/types/notification';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archiveNotification: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  isConnected: boolean;
}

export function useNotifications(
  initialFilter: NotificationFilter = {}
): UseNotificationsReturn {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  
  const filterRef = useRef(initialFilter);

  // Fetch notifications
  const fetchNotifications = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!userId) return;

    try {
      if (page === 1) setLoading(true);
      setError(null);

      const result = await notificationService.getUserNotifications({
        ...filterRef.current,
        page,
        limit: 20,
      }, userId);

      if (append) {
        setNotifications(prev => [...prev, ...result.notifications]);
      } else {
        setNotifications(result.notifications);
      }

      setHasMore(result.pagination.hasMore);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;

    try {
      const count = await notificationService.getUnreadCount(userId);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [userId]);

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    if (!userId) return;

    try {
      await notificationService.markAsRead(id, userId);
      
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  }, [userId]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      await notificationService.markAllAsRead(userId);
      
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
      throw err;
    }
  }, [userId]);

  // Archive notification
  const archiveNotification = useCallback(async (id: string) => {
    if (!userId) return;

    try {
      await notificationService.archiveNotification(id, userId);

      setNotifications(prev => prev.filter(n => n.id !== id));

      const notification = notifications.find(n => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error archiving notification:', err);
      throw err;
    }
  }, [notifications, userId]);

  // Refresh notifications
  const refresh = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    await Promise.all([
      fetchNotifications(1, false),
      fetchUnreadCount(),
    ]);
  }, [fetchNotifications, fetchUnreadCount, userId]);

  // Load more notifications
  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      await fetchNotifications(currentPage + 1, true);
    }
  }, [loading, hasMore, currentPage, fetchNotifications]);

  // Initial fetch
  useEffect(() => {
    if (!userId) return;
    fetchNotifications(1, false);
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount, userId]);

  return {
    notifications,
    unreadCount,
    loading,
    refreshing,
    error,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    refresh,
    loadMore,
    hasMore,
    isConnected,
  };
}
