// src/features/feed/components/AuthorHeader.tsx

import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { PostAuthor } from '../types';
import { feedTheme } from '../theme';

interface AuthorHeaderProps {
  author: PostAuthor;
  createdAt: string;
  onAuthorPress?: (authorId: string) => void;
}

export const AuthorHeader: React.FC<AuthorHeaderProps> = ({
  author,
  createdAt,
  onAuthorPress,
}) => {
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: false });

  const renderAvatar = () => {
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
          {author.name.charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onAuthorPress?.(author.id)}
      activeOpacity={0.7}
    >
      {renderAvatar()}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{author.name}</Text>
          <Text style={styles.dot}> · </Text>
          <Text style={styles.timestamp}>{timeAgo}</Text>
        </View>
        {author.username && (
          <Text style={styles.username}>@{author.username}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: feedTheme.spacing.cardPadding,
    paddingVertical: 10,
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
  username: {
    ...feedTheme.typography.authorUsername,
    marginTop: 1,
  },
});
