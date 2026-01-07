// src/features/feed/components/SocialBar.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { feedTheme } from '../theme';

interface SocialBarProps {
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isLiking?: boolean;
  onLikePress: () => void;
  onCommentPress: () => void;
  onSharePress: () => void;
  onLikeCountPress?: () => void;
  onCommentCountPress?: () => void;
  showShareButton?: boolean;
}

export const SocialBar: React.FC<SocialBarProps> = ({
  likeCount,
  commentCount,
  isLiked,
  isLiking,
  onLikePress,
  onCommentPress,
  onSharePress,
  onLikeCountPress,
  onCommentCountPress,
  showShareButton = true,
}) => {
  return (
    <View style={styles.container}>
      {/* Stats Row */}
      <View style={styles.statsRow}>
        {likeCount > 0 && (
          <TouchableOpacity
            onPress={onLikeCountPress}
            disabled={likeCount === 0}
            activeOpacity={0.7}
          >
            <Text style={styles.statsText}>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</Text>
          </TouchableOpacity>
        )}
        {likeCount > 0 && commentCount > 0 && (
          <Text style={styles.statsDot}> · </Text>
        )}
        {commentCount > 0 && (
          <TouchableOpacity
            onPress={onCommentCountPress ?? onCommentPress}
            activeOpacity={0.7}
          >
            <Text style={styles.statsText}>{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onLikePress}
          disabled={isLiking}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={22}
            color={isLiked ? feedTheme.colors.likePink : feedTheme.colors.textSecondary}
          />
          <Text style={[
            styles.actionText,
            isLiked && { color: feedTheme.colors.likePink }
          ]}>
            Like
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={onCommentPress}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={feedTheme.colors.textSecondary}
          />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>

        {showShareButton && (
          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton]}
            onPress={onSharePress}
            activeOpacity={0.7}
          >
            <Ionicons
              name="share-outline"
              size={22}
              color={feedTheme.colors.textSecondary}
            />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: feedTheme.spacing.cardPadding,
    paddingBottom: feedTheme.spacing.cardPadding,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statsText: {
    ...feedTheme.typography.socialCount,
    color: feedTheme.colors.textSecondary,
  },
  statsDot: {
    color: feedTheme.colors.textTertiary,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: feedTheme.colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 16,
  },
  shareButton: {
    marginLeft: 'auto',
    marginRight: 0,
  },
  actionText: {
    ...feedTheme.typography.socialCount,
    color: feedTheme.colors.textSecondary,
    marginLeft: 6,
  },
});
