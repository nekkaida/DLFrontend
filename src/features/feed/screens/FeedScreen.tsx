// src/features/feed/screens/FeedScreen.tsx

import React, { useEffect, useCallback, useRef, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Text } from 'react-native';
import { router } from 'expo-router';
import BottomSheet from '@gorhom/bottom-sheet';
import { getSportColors, SportType } from '@/constants/SportsColor';
import { useFeedPosts } from '../hooks';
import { FeedHeader, FeedPostCard, CommentsSheet } from '../components';
import { feedTheme } from '../theme';
import { FeedPost } from '../types';

interface FeedScreenProps {
  sport?: string;
}

export default function FeedScreen({ sport = 'default' }: FeedScreenProps) {
  const {
    posts,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    fetchPosts,
    loadMorePosts,
    updatePostLocally,
  } = useFeedPosts({ sport, limit: 10 });

  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const commentsSheetRef = useRef<BottomSheet>(null);

  // Get sport colors using the utility function (convert to uppercase for SportType)
  const sportType = sport?.toUpperCase() as SportType;
  const sportColors = getSportColors(sportType);
  // Game score sports use gameScores array instead of setScores
  const isGameScoreSport = sport !== 'tennis' && sport !== 'padel';

  // Fetch posts on mount
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleFriendListPress = useCallback(() => {
    router.push('/user-dashboard/friend-list');
  }, []);

  const handleLikeUpdate = useCallback((postId: string, liked: boolean, likeCount: number) => {
    updatePostLocally(postId, { isLikedByUser: liked, likeCount });
  }, [updatePostLocally]);

  const handleCommentPress = useCallback((postId: string) => {
    setSelectedPostId(postId);
    commentsSheetRef.current?.snapToIndex(0);
  }, []);

  const handleCommentCountChange = useCallback((postId: string, count: number) => {
    updatePostLocally(postId, { commentCount: count });
  }, [updatePostLocally]);

  const handleCloseComments = useCallback(() => {
    setSelectedPostId(null);
  }, []);

  const handleAuthorPress = useCallback((authorId: string) => {
    router.push(`/profile/${authorId}`);
  }, []);

  const renderPost = useCallback(({ item }: { item: FeedPost }) => (
    <FeedPostCard
      post={item}
      sportColors={sportColors}
      isGameScoreSport={isGameScoreSport}
      onLikeUpdate={handleLikeUpdate}
      onCommentPress={handleCommentPress}
      onAuthorPress={handleAuthorPress}
    />
  ), [sportColors, isGameScoreSport, handleLikeUpdate, handleCommentPress, handleAuthorPress]);

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={feedTheme.colors.primary} />
      </View>
    );
  }, [isLoadingMore]);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No posts yet</Text>
        <Text style={styles.emptySubtitle}>
          Match results from you and other players will appear here
        </Text>
      </View>
    );
  }, [isLoading]);

  return (
    <View style={styles.container}>
      <FeedHeader
        selectedSport={sport}
        onFriendListPress={handleFriendListPress}
      />

      {isLoading && posts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={feedTheme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading && posts.length > 0}
              onRefresh={fetchPosts}
              tintColor={feedTheme.colors.primary}
            />
          }
          onEndReached={loadMorePosts}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
        />
      )}

      {/* Comments Bottom Sheet */}
      <CommentsSheet
        postId={selectedPostId}
        bottomSheetRef={commentsSheetRef}
        onClose={handleCloseComments}
        onCommentCountChange={handleCommentCountChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: feedTheme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: feedTheme.spacing.screenPadding,
    paddingBottom: 100,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: feedTheme.colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: feedTheme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
