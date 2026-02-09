// src/features/feed/components/FeedHeader.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { feedTheme } from '../theme';

interface FeedHeaderProps {
  selectedSport?: string;
  userFilter?: 'all' | 'friends';
  onFilterPress?: () => void;
  onFriendListPress: () => void;
  onUserFilterToggle?: () => void;
  activeTab: 'activity' | 'friends';
  onTabChange: (tab: 'activity' | 'friends') => void;
}

export const FeedHeader: React.FC<FeedHeaderProps> = ({
  selectedSport,
  userFilter = 'all',
  onFilterPress,
  onFriendListPress,
  onUserFilterToggle,
  activeTab,
  onTabChange,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'activity' && styles.tabActive]}
          onPress={() => onTabChange('activity')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'activity' && styles.tabTextActive]}>
            Activity
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
          onPress={() => onTabChange('friends')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
            Friends
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filters Row */}
      <View style={styles.filtersRow}>
        {/* Sport Filter */}
        {onFilterPress && (
          <TouchableOpacity
            style={styles.filterButton}
            onPress={onFilterPress}
            activeOpacity={0.7}
          >
            <Text style={styles.filterText}>
              {selectedSport ? selectedSport.charAt(0).toUpperCase() + selectedSport.slice(1) : 'All Sports'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={feedTheme.colors.textSecondary} />
          </TouchableOpacity>
        )}

        {/* User Filter Toggle */}
        {onUserFilterToggle && (
          <TouchableOpacity
            style={[styles.filterButton, userFilter === 'friends' && styles.filterButtonActive]}
            onPress={onUserFilterToggle}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={userFilter === 'friends' ? 'people' : 'globe-outline'} 
              size={16} 
              color={userFilter === 'friends' ? feedTheme.colors.primary : feedTheme.colors.textSecondary} 
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.filterText, userFilter === 'friends' && styles.filterTextActive]}>
              {userFilter === 'friends' ? 'Friends' : 'All Users'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: feedTheme.spacing.screenPadding,
    paddingTop: 12,
    paddingBottom: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  tab: {
    paddingVertical: 8,
    paddingBottom: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: feedTheme.colors.primary,
  },
  tabText: {
    fontSize: 20,
    fontWeight: '600',
    color: feedTheme.colors.textSecondary,
  },
  tabTextActive: {
    color: feedTheme.colors.textPrimary,
    fontWeight: '700',
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: feedTheme.colors.border,
    borderRadius: 20,
  },
  filterButtonActive: {
    backgroundColor: feedTheme.colors.primary + '15',
    borderWidth: 1,
    borderColor: feedTheme.colors.primary,
  },
  filterText: {
    ...feedTheme.typography.filterText,
    color: feedTheme.colors.textPrimary,
    marginRight: 4,
  },
  filterTextActive: {
    color: feedTheme.colors.primary,
    fontWeight: '600',
  },
});
