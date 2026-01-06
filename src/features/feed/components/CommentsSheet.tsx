// src/features/feed/components/CommentsSheet.tsx

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { useComments } from '../hooks';
import { PostComment } from '../types';
import { feedTheme } from '../theme';

interface CommentsSheetProps {
  postId: string | null;
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  onClose: () => void;
  onCommentCountChange: (postId: string, count: number) => void;
}

export const CommentsSheet: React.FC<CommentsSheetProps> = ({
  postId,
  bottomSheetRef,
  onClose,
  onCommentCountChange,
}) => {
  const [inputText, setInputText] = useState('');
  const { comments, isLoading, isSubmitting, fetchComments, addComment, deleteComment } =
    useComments(postId || '');

  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId, fetchComments]);

  const handleSubmit = useCallback(async () => {
    if (!inputText.trim() || !postId) return;

    const newComment = await addComment(inputText.trim());
    if (newComment) {
      setInputText('');
      onCommentCountChange(postId, comments.length + 1);
    }
  }, [inputText, postId, addComment, comments.length, onCommentCountChange]);

  const handleDelete = useCallback(async (commentId: string) => {
    if (!postId) return;

    const success = await deleteComment(commentId);
    if (success) {
      onCommentCountChange(postId, comments.length - 1);
    }
  }, [postId, deleteComment, comments.length, onCommentCountChange]);

  const renderComment = useCallback(({ item }: { item: PostComment }) => (
    <View style={styles.commentItem}>
      {item.user.image ? (
        <Image source={{ uri: item.user.image }} style={styles.commentAvatar} />
      ) : (
        <View style={[styles.commentAvatar, styles.commentAvatarPlaceholder]}>
          <Text style={styles.commentAvatarText}>
            {item.user.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor}>{item.user.name}</Text>
          <Text style={styles.commentTime}>
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: false })}
          </Text>
        </View>
        <Text style={styles.commentText}>{item.text}</Text>
      </View>
    </View>
  ), []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={['60%', '90%']}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetView style={styles.container}>
        <Text style={styles.title}>Comments</Text>

        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {isLoading ? 'Loading comments...' : 'No comments yet. Be the first!'}
            </Text>
          }
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={100}
        >
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Add a comment..."
              placeholderTextColor={feedTheme.colors.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleSubmit}
              disabled={!inputText.trim() || isSubmitting}
            >
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim() ? feedTheme.colors.primary : feedTheme.colors.textTertiary}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: feedTheme.spacing.screenPadding,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: feedTheme.colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  commentAvatarPlaceholder: {
    backgroundColor: feedTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  commentContent: {
    flex: 1,
    marginLeft: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: feedTheme.colors.textPrimary,
  },
  commentTime: {
    fontSize: 11,
    color: feedTheme.colors.textTertiary,
    marginLeft: 8,
  },
  commentText: {
    fontSize: 14,
    color: feedTheme.colors.textPrimary,
    lineHeight: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: feedTheme.colors.textSecondary,
    marginTop: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: feedTheme.colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: feedTheme.colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: feedTheme.colors.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    padding: 10,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
