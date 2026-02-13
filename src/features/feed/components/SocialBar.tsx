// src/features/feed/components/SocialBar.tsx

import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { feedTheme } from "../theme";
import { Ionicons } from "@expo/vector-icons";

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
  currentUserId?: string;
  postAuthorId: string;
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
  currentUserId,
  postAuthorId,
}) => {
  // Check if current user is the post creator
  const isPostCreator = currentUserId === postAuthorId;

  // Like button is always orange when liked, regardless of post ownership
  const likeIconColor = isLiked ? "#f5821e" : feedTheme.colors.textPrimary;

  return (
    <View style={styles.container}>
      {/* Stats Row */}
      {/* <View style={styles.statsRow}>
        {likeCount > 0 && isPostCreator && (
          <TouchableOpacity
            onPress={onLikeCountPress}
            disabled={likeCount === 0}
            activeOpacity={0.7}
          >
            <Text style={styles.statsText}>
              {likeCount} {likeCount === 1 ? "like" : "likes"}
            </Text>
          </TouchableOpacity>
        )}
        {likeCount > 0 && commentCount > 0 && isPostCreator && (
          <Text style={styles.statsDot}> · </Text>
        )}
        {commentCount > 0 && (
          <TouchableOpacity
            onPress={onCommentCountPress ?? onCommentPress}
            activeOpacity={0.7}
          >
            <Text style={styles.statsText}>
              {commentCount} {commentCount === 1 ? "comment" : "comments"}
            </Text>
          </TouchableOpacity>
        )}
      </View> */}

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onLikePress}
          disabled={isLiking}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isLiked ? "thumbs-up" : "thumbs-up-outline"} 
            size={20} 
            color={likeIconColor}
            style={{ opacity: isLiked ? 1 : 0.7 }}
          />
          <Text style={[styles.actionText, { color: likeIconColor }]}>
            {isLiked ? 'Liked' : 'Like'}
          </Text>
          <Text style={[styles.actionText, styles.countText, { color: likeIconColor }]}>
            {likeCount > 0 ? likeCount : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={onCommentPress}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="chatbubble-ellipses-outline" 
            size={20} 
            color={feedTheme.colors.textPrimary}
          />
          <Text style={styles.actionText}>Comment</Text>
          <Text style={[styles.actionText, styles.countText]}>
            {commentCount > 0 ? commentCount : ''}
          </Text>
        </TouchableOpacity>

        {showShareButton && (
          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton]}
            onPress={onSharePress}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="share-outline" 
              size={20} 
              color={feedTheme.colors.textPrimary}
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
    flexDirection: "row",
    alignItems: "center",
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
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    // borderTopWidth: 1,
    // borderTopColor: feedTheme.colors.border,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 16,
    minHeight: 40,
    gap: 6,
  },
  shareButton: {
    marginLeft: "auto",
    marginRight: 0,
  },
  actionText: {
    ...feedTheme.typography.socialCount,
    color: feedTheme.colors.textSecondary,
    lineHeight: 20,
  },
  countText: {
    fontWeight: '600',
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  shareIcon: {
    width: 30,
    height: 30,
    marginRight: 6,
  },
});
