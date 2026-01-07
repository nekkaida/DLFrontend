// src/features/feed/components/FeedPostCard.tsx

import React, { useCallback, useMemo, useState, forwardRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Pressable } from 'react-native';
import { MatchResultCard } from '@/features/standings/components';
import { SportColors, MatchResult } from '@/features/standings/types';
import { FeedPost } from '../types';
import { feedTheme } from '../theme';
import { AuthorHeader } from './AuthorHeader';
import { SocialBar } from './SocialBar';
import { useLikes } from '../hooks';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - (feedTheme.spacing.screenPadding * 2) - (feedTheme.spacing.cardPadding * 2);
const CAPTION_TRUNCATE_LENGTH = 125;

interface FeedPostCardProps {
  post: FeedPost;
  sportColors: SportColors;
  isGameScoreSport: boolean;
  onLikeUpdate: (postId: string, liked: boolean, likeCount: number) => void;
  onCommentPress: (postId: string) => void;
  onAuthorPress?: (authorId: string) => void;
  onLikeCountPress: (postId: string, likeCount: number) => void;
  onOptionsPress?: (post: FeedPost) => void;
  onSharePress?: (post: FeedPost) => void;
  onMatchPress?: (matchId: string) => void;
  showOptionsButton?: boolean;
}

export const FeedPostCard = forwardRef<View, FeedPostCardProps>(({
  post,
  sportColors,
  isGameScoreSport,
  onLikeUpdate,
  onCommentPress,
  onAuthorPress,
  onLikeCountPress,
  onOptionsPress,
  onSharePress,
  onMatchPress,
  showOptionsButton = false,
}, ref) => {
  const { isLiking, toggleLike } = useLikes();
  const [captionExpanded, setCaptionExpanded] = useState(false);

  // Caption truncation logic
  const shouldTruncate = post.caption && post.caption.length > CAPTION_TRUNCATE_LENGTH;
  const displayCaption = shouldTruncate && !captionExpanded
    ? post.caption!.slice(0, CAPTION_TRUNCATE_LENGTH)
    : post.caption;

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

  const handleSharePress = useCallback(() => {
    onSharePress?.(post);
  }, [post, onSharePress]);

  const handleAuthorPress = useCallback(() => {
    onAuthorPress?.(post.author.id);
  }, [post.author.id, onAuthorPress]);

  const handleLikeCountPress = useCallback(() => {
    onLikeCountPress(post.id, post.likeCount);
  }, [post.id, post.likeCount, onLikeCountPress]);

  const handleOptionsPress = useCallback(() => {
    onOptionsPress?.(post);
  }, [post, onOptionsPress]);

  const handleMatchPress = useCallback(() => {
    onMatchPress?.(post.matchId);
  }, [post.matchId, onMatchPress]);

  return (
    <View ref={ref} style={styles.container} collapsable={false}>
      {/* Author Header */}
      <AuthorHeader
        author={post.author}
        createdAt={post.createdAt}
        updatedAt={post.updatedAt}
        onAuthorPress={handleAuthorPress}
        showOptionsButton={showOptionsButton}
        onOptionsPress={handleOptionsPress}
      />

      {/* Caption */}
      {post.caption && (
        <TouchableOpacity
          onPress={() => shouldTruncate && setCaptionExpanded(!captionExpanded)}
          activeOpacity={shouldTruncate ? 0.7 : 1}
          style={styles.captionContainer}
        >
          <Text style={styles.caption}>
            {displayCaption}
            {shouldTruncate && !captionExpanded && (
              <Text style={styles.moreText}>...more</Text>
            )}
          </Text>
        </TouchableOpacity>
      )}

      {/* Match Scorecard - Tappable to navigate to match detail */}
      <Pressable
        onPress={handleMatchPress}
        style={({ pressed }) => [
          styles.scorecardContainer,
          pressed && styles.scorecardPressed,
        ]}
      >
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
      </Pressable>

      {/* Social Bar */}
      <SocialBar
        likeCount={post.likeCount}
        commentCount={post.commentCount}
        isLiked={post.isLikedByUser}
        isLiking={isLiking === post.id}
        onLikePress={handleLikePress}
        onCommentPress={handleCommentPress}
        onSharePress={handleSharePress}
        onLikeCountPress={handleLikeCountPress}
        showShareButton={showOptionsButton}
      />
    </View>
  );
});

FeedPostCard.displayName = 'FeedPostCard';

const styles = StyleSheet.create({
  container: {
    backgroundColor: feedTheme.colors.cardBackground,
    borderRadius: feedTheme.spacing.cardBorderRadius,
    marginBottom: feedTheme.spacing.sectionGap,
    ...feedTheme.shadows.card,
  },
  captionContainer: {
    paddingHorizontal: feedTheme.spacing.cardPadding,
    paddingBottom: 10,
  },
  caption: {
    ...feedTheme.typography.caption,
    color: feedTheme.colors.textPrimary,
  },
  moreText: {
    color: feedTheme.colors.textSecondary,
  },
  scorecardContainer: {
    paddingHorizontal: feedTheme.spacing.cardPadding,
    paddingBottom: 10,
  },
  scorecardPressed: {
    opacity: 0.7,
  },
});
