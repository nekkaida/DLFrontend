// src/features/feed/components/AuthorHeader.tsx

import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PostAuthor } from '../types';
import { feedTheme } from '../theme';
import { processDisplayName, formatPostTime } from '../utils/formatters';
import TennisIcon from "@/assets/icons/sports/Tennis.svg";
import PickleballIcon from "@/assets/icons/sports/Pickleball.svg";
import PaddleIcon from "@/assets/icons/sports/Paddle.svg";

interface AuthorHeaderProps {
  author: PostAuthor;
  createdAt: string;
  updatedAt?: string;
  sportType?: string;
  sportColor?: string;
  onAuthorPress?: (authorId: string) => void;
  showOptionsButton?: boolean;
  onOptionsPress?: () => void;
}

// Map sport types to their icons
const getSportIcon = (
  sportType: string | undefined,
  color: string,
  size: number = 20,
) => {
  const normalizedType = sportType?.toUpperCase() || "TENNIS";

  switch (normalizedType) {
    case "PICKLEBALL":
      return <PickleballIcon width={size} height={size} fill={color} />;
    case "PADEL":
      return <PaddleIcon width={size} height={size} fill={color} />;
    case "TENNIS":
    default:
      return <TennisIcon width={size} height={size} fill={color} />;
  }
};

export const AuthorHeader: React.FC<AuthorHeaderProps> = ({
  author,
  createdAt,
  updatedAt,
  sportType,
  sportColor = feedTheme.colors.primary,
  onAuthorPress,
  showOptionsButton = false,
  onOptionsPress,
}) => {
  const timeAgo = formatPostTime(createdAt);

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
          <Text style={styles.name} numberOfLines={1}>
            {processDisplayName(author.name, 20)}
          </Text>
          <View style={styles.timeRow}>
            {sportType && (
              <View style={styles.sportIconContainer}>
                {getSportIcon(sportType, sportColor, 18)}
              </View>
            )}
            <Text style={styles.timestamp}>{timeAgo}</Text>
          </View>
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
  name: {
    ...feedTheme.typography.authorName,
    color: feedTheme.colors.textPrimary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  sportIconContainer: {
    marginRight: 6,
  },
  timestamp: {
    ...feedTheme.typography.timestamp,
  },
  optionsButton: {
    padding: 4,
    marginLeft: 8,
  },
});
