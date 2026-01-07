// src/features/feed/components/AuthorHeader.tsx

import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { PostAuthor } from '../types';
import { feedTheme } from '../theme';
import { processDisplayName } from '../utils/formatters';

interface AuthorHeaderProps {
  author: PostAuthor;
  createdAt: string;
  updatedAt?: string;
  onAuthorPress?: (authorId: string) => void;
  showOptionsButton?: boolean;
  onOptionsPress?: () => void;
}

export const AuthorHeader: React.FC<AuthorHeaderProps> = ({
  author,
  createdAt,
  updatedAt,
  onAuthorPress,
  showOptionsButton = false,
  onOptionsPress,
}) => {
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: false });

  // Check if post was edited (updatedAt > createdAt)
  const isEdited = updatedAt && new Date(updatedAt) > new Date(createdAt);

  const renderAvatar = () => {
    // Use actual name for initial if available, otherwise "D" for Deleted
    const avatarInitial = author.name?.trim()
      ? author.name.charAt(0).toUpperCase()
      : 'D';

    if (author.image) {
      return (
        <Image
          source={{ uri: author.image }}
          style={styles.avatar}
        />
      );
    }
    return (
      <View style={[styles.avatar, styles.avatarPlaceholder]}>
        <Text style={styles.avatarText}>
          {avatarInitial}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.authorTouchable}
        onPress={() => onAuthorPress?.(author.id)}
        activeOpacity={0.7}
      >
        {renderAvatar()}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {processDisplayName(author.name, 20)}
            </Text>
            <Text style={styles.dot}> . </Text>
            <Text style={styles.timestamp}>{timeAgo}</Text>
            {isEdited && (
              <>
                <Text style={styles.dot}> . </Text>
                <Text style={styles.editedIndicator}>(edited)</Text>
              </>
            )}
          </View>
          {author.username && author.name && (
            <Text style={styles.username}>@{author.username}</Text>
          )}
        </View>
      </TouchableOpacity>
      {showOptionsButton && (
        <TouchableOpacity
          style={styles.optionsButton}
          onPress={onOptionsPress}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={feedTheme.colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: feedTheme.spacing.cardPadding,
    paddingVertical: 10,
  },
  authorTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: feedTheme.spacing.avatarSize,
    height: feedTheme.spacing.avatarSize,
    borderRadius: feedTheme.spacing.avatarBorderRadius,
  },
  avatarPlaceholder: {
    backgroundColor: feedTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  info: {
    marginLeft: 10,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    ...feedTheme.typography.authorName,
    color: feedTheme.colors.textPrimary,
  },
  dot: {
    color: feedTheme.colors.textTertiary,
    fontSize: 12,
  },
  timestamp: {
    ...feedTheme.typography.timestamp,
  },
  editedIndicator: {
    fontSize: 12,
    fontStyle: 'italic',
    color: feedTheme.colors.textTertiary,
  },
  username: {
    ...feedTheme.typography.authorUsername,
    marginTop: 1,
  },
  optionsButton: {
    padding: 4,
    marginLeft: 8,
  },
});
