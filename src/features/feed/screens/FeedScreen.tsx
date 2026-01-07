// src/features/feed/screens/FeedScreen.tsx

import React, { useEffect, useCallback, useRef, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Text } from 'react-native';
import { router } from 'expo-router';
import BottomSheet from '@gorhom/bottom-sheet';
import { getSportColors, SportType } from '@/constants/SportsColor';
import { useSession } from '@/lib/auth-client';
import { useFeedPosts, usePostActions } from '../hooks';
import {
  FeedHeader,
  FeedPostCard,
  CommentsSheet,
  SportFilterSheet,
  LikersSheet,
  PostOptionsSheet,
  EditCaptionSheet,
} from '../components';
import { feedTheme } from '../theme';
import { FeedPost } from '../types';

interface FeedScreenProps {
  sport?: string;
}

export default function FeedScreen({ sport = 'default' }: FeedScreenProps) {
  // Session and post actions
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const { deletePost, editCaption, isEditing } = usePostActions();

  // Existing state
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const commentsSheetRef = useRef<BottomSheet>(null);
  const sportFilterRef = useRef<BottomSheet>(null);
  const [selectedLikerPostId, setSelectedLikerPostId] = useState<string | null>(null);
  const [selectedLikerCount, setSelectedLikerCount] = useState(0);
  const likersSheetRef = useRef<BottomSheet>(null);

  // Post options state
  const [selectedOptionsPostId, setSelectedOptionsPostId] = useState<string | null>(null);
  const [selectedOptionsPost, setSelectedOptionsPost] = useState<FeedPost | null>(null);
  const postOptionsRef = useRef<BottomSheet>(null);

  // Edit caption state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState<string>('');
  const editCaptionRef = useRef<BottomSheet>(null);

  const [selectedSportFilter, setSelectedSportFilter] = useState<string | undefined>(sport);

  const handleFilterPress = useCallback(() => {
    sportFilterRef.current?.snapToIndex(0);
  }, []);

  const handleSportSelect = useCallback((sportValue: string | undefined) => {
    setSelectedSportFilter(sportValue);
    sportFilterRef.current?.close();
  }, []);

  const handleCloseFilter = useCallback(() => {
    // Filter closed
  }, []);

  const {
    posts,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    fetchPosts,
    loadMorePosts,
    updatePostLocally,
    removePostLocally,
  } = useFeedPosts({ sport: selectedSportFilter, limit: 10 });

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
    router.push(`/player-profile/${authorId}` as any);
  }, []);

  const handleLikeCountPress = useCallback((postId: string, likeCount: number) => {
    setSelectedLikerPostId(postId);
    setSelectedLikerCount(likeCount);
    likersSheetRef.current?.snapToIndex(0);
  }, []);

  const handleCloseLikers = useCallback(() => {
    setSelectedLikerPostId(null);
  }, []);

  // Post options handlers
  const handleOptionsPress = useCallback((post: FeedPost) => {
    setSelectedOptionsPostId(post.id);
    setSelectedOptionsPost(post);
    postOptionsRef.current?.snapToIndex(0);
  }, []);

  const handleCloseOptions = useCallback(() => {
    setSelectedOptionsPostId(null);
    setSelectedOptionsPost(null);
  }, []);

  const handleEditPress = useCallback(() => {
    if (selectedOptionsPost) {
      setEditingPostId(selectedOptionsPost.id);
      setEditingCaption(selectedOptionsPost.caption || '');
      postOptionsRef.current?.close();
      // Small delay to allow options sheet to close before opening edit sheet
      setTimeout(() => {
        editCaptionRef.current?.snapToIndex(0);
      }, 100);
    }
  }, [selectedOptionsPost]);

  const handleDeletePress = useCallback(async () => {
    if (selectedOptionsPostId) {
      const success = await deletePost(selectedOptionsPostId);
      if (success) {
        // Remove the deleted post from local state
        removePostLocally(selectedOptionsPostId);
        postOptionsRef.current?.close();
      }
    }
  }, [selectedOptionsPostId, deletePost, removePostLocally]);

  const handleCloseEdit = useCallback(() => {
    setEditingPostId(null);
    setEditingCaption('');
  }, []);

  const handleSaveCaption = useCallback(async (postId: string, newCaption: string) => {
    const success = await editCaption(postId, newCaption);
    if (success) {
      updatePostLocally(postId, { caption: newCaption });
      editCaptionRef.current?.close();
    }
  }, [editCaption, updatePostLocally]);

  const renderPost = useCallback(({ item }: { item: FeedPost }) => {
    const isOwnPost = currentUserId === item.authorId;
    return (
      <FeedPostCard
        post={item}
        sportColors={sportColors}
        isGameScoreSport={isGameScoreSport}
        onLikeUpdate={handleLikeUpdate}
        onCommentPress={handleCommentPress}
        onAuthorPress={handleAuthorPress}
        onLikeCountPress={handleLikeCountPress}
        onOptionsPress={handleOptionsPress}
        showOptionsButton={isOwnPost}
      />
    );
  }, [sportColors, isGameScoreSport, handleLikeUpdate, handleCommentPress, handleAuthorPress, handleLikeCountPress, handleOptionsPress, currentUserId]);

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
        selectedSport={selectedSportFilter}
        onFilterPress={handleFilterPress}
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

      {/* Sport Filter Bottom Sheet */}
      <SportFilterSheet
        bottomSheetRef={sportFilterRef}
        selectedSport={selectedSportFilter}
        onSelect={handleSportSelect}
        onClose={handleCloseFilter}
      />

      {/* Likers Bottom Sheet */}
      <LikersSheet
        postId={selectedLikerPostId}
        likeCount={selectedLikerCount}
        bottomSheetRef={likersSheetRef}
        onClose={handleCloseLikers}
        onUserPress={handleAuthorPress}
      />

      {/* Post Options Bottom Sheet */}
      <PostOptionsSheet
        bottomSheetRef={postOptionsRef}
        isOwnPost={selectedOptionsPost?.authorId === currentUserId}
        onClose={handleCloseOptions}
        onEdit={handleEditPress}
        onDelete={handleDeletePress}
      />

      {/* Edit Caption Bottom Sheet */}
      <EditCaptionSheet
        postId={editingPostId}
        initialCaption={editingCaption}
        bottomSheetRef={editCaptionRef}
        onClose={handleCloseEdit}
        onSave={handleSaveCaption}
        isSaving={isEditing}
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
