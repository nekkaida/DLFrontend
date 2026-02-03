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
  onCreatePostPress?: () => void;
  onUserFilterToggle?: () => void;
}

export const FeedHeader: React.FC<FeedHeaderProps> = ({
  selectedSport,
  userFilter = 'all',
  onFilterPress,
  onFriendListPress,
  onCreatePostPress,
  onUserFilterToggle,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Activity</Text>
        <View style={styles.headerButtons}>
          {onCreatePostPress && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={onCreatePostPress}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={26} color={feedTheme.colors.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={onFriendListPress}
            activeOpacity={0.7}
          >
            <Ionicons name="people" size={26} color={feedTheme.colors.textPrimary} />
          </TouchableOpacity>
        </View>
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...feedTheme.typography.feedTitle,
    color: feedTheme.colors.textPrimary,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
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
