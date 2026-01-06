// src/features/feed/components/FeedHeader.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { feedTheme } from '../theme';

interface FeedHeaderProps {
  selectedSport?: string;
  onFilterPress?: () => void;
  onFriendListPress: () => void;
}

export const FeedHeader: React.FC<FeedHeaderProps> = ({
  selectedSport,
  onFilterPress,
  onFriendListPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Feed</Text>
        <TouchableOpacity
          style={styles.friendListButton}
          onPress={onFriendListPress}
          activeOpacity={0.7}
        >
          <Ionicons name="people-outline" size={24} color={feedTheme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Sport Filter (optional) */}
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
  friendListButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: feedTheme.colors.border,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: feedTheme.colors.border,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  filterText: {
    ...feedTheme.typography.filterText,
    color: feedTheme.colors.textSecondary,
    marginRight: 4,
  },
});
