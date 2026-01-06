// src/features/feed/components/FeedPostCard.tsx

import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Share, Dimensions } from 'react-native';
import { MatchResultCard } from '@/features/standings/components';
import { SportColors, MatchResult } from '@/features/standings/types';
import { FeedPost } from '../types';
import { feedTheme } from '../theme';
import { AuthorHeader } from './AuthorHeader';
import { SocialBar } from './SocialBar';
import { useLikes } from '../hooks';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - (feedTheme.spacing.screenPadding * 2) - (feedTheme.spacing.cardPadding * 2);

interface FeedPostCardProps {
  post: FeedPost;
  sportColors: SportColors;
  isGameScoreSport: boolean;
  onLikeUpdate: (postId: string, liked: boolean, likeCount: number) => void;
  onCommentPress: (postId: string) => void;
  onAuthorPress?: (authorId: string) => void;
}

export const FeedPostCard: React.FC<FeedPostCardProps> = ({
  post,
  sportColors,
  isGameScoreSport,
  onLikeUpdate,
  onCommentPress,
  onAuthorPress,
}) => {
  const { isLiking, toggleLike } = useLikes();

  // Convert FeedMatch to MatchResult format for MatchResultCard
  const matchForCard: MatchResult = useMemo(() => ({
    id: post.match.id,
    matchType: post.match.matchType,
    matchDate: post.match.matchDate,
    team1Score: post.match.team1Score,
    team2Score: post.match.team2Score,
    outcome: post.match.outcome,
    setScores: post.match.setScores,
    gameScores: post.match.gameScores,
    team1Players: post.match.team1Players,
    team2Players: post.match.team2Players,
    isWalkover: post.match.isWalkover,
    venue: post.match.venue,
  }), [post.match]);

  const handleLikePress = useCallback(async () => {
    try {
      const result = await toggleLike(post.id);
      if (result) {
        onLikeUpdate(post.id, result.liked, result.likeCount);
      }
    } catch (err) {
      // Error already logged in hook
    }
  }, [post.id, toggleLike, onLikeUpdate]);

  const handleCommentPress = useCallback(() => {
    onCommentPress(post.id);
  }, [post.id, onCommentPress]);

  const handleSharePress = useCallback(async () => {
    try {
      await Share.share({
        message: `Check out this match result on DEUCE League!`,
        // Add deep link URL when available
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  }, []);

  const handleAuthorPress = useCallback(() => {
    onAuthorPress?.(post.author.id);
  }, [post.author.id, onAuthorPress]);

  return (
    <View style={styles.container}>
      {/* Author Header */}
      <AuthorHeader
        author={post.author}
        createdAt={post.createdAt}
        onAuthorPress={handleAuthorPress}
      />

      {/* Caption */}
      {post.caption && (
        <Text style={styles.caption}>{post.caption}</Text>
      )}

      {/* Match Scorecard */}
      <View style={styles.scorecardContainer}>
        <MatchResultCard
          match={matchForCard}
          index={0}
          totalResults={1}
          sportColors={sportColors}
          isPickleball={isGameScoreSport}
          cardWidth={CARD_WIDTH}
          cardGap={0}
          expandedComments={new Set()}
          onToggleComments={() => {}}
        />
      </View>

      {/* Social Bar */}
      <SocialBar
        likeCount={post.likeCount}
        commentCount={post.commentCount}
        isLiked={post.isLikedByUser}
        isLiking={isLiking === post.id}
        onLikePress={handleLikePress}
        onCommentPress={handleCommentPress}
        onSharePress={handleSharePress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: feedTheme.colors.cardBackground,
    borderRadius: feedTheme.spacing.cardBorderRadius,
    marginBottom: feedTheme.spacing.sectionGap,
    ...feedTheme.shadows.card,
  },
  caption: {
    ...feedTheme.typography.caption,
    color: feedTheme.colors.textPrimary,
    paddingHorizontal: feedTheme.spacing.cardPadding,
    paddingBottom: 10,
  },
  scorecardContainer: {
    paddingHorizontal: feedTheme.spacing.cardPadding,
    paddingBottom: 10,
  },
});
