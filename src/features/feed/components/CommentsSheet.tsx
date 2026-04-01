// src/features/feed/components/CommentsSheet.tsx

import { useSession } from "@/lib/auth-client";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { formatDistanceToNow } from "date-fns";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useComments } from "../hooks";
import { feedTheme } from "../theme";
import { PostComment } from "../types";
import { processDisplayName } from "../utils/formatters";

interface CommentsSheetProps {
  postId: string | null;
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  onClose: () => void;
  onCommentCountChange: (postId: string, count: number) => void;
}

export const CommentsSheet: React.FC<CommentsSheetProps> = ({
  postId,
  bottomSheetRef,
  onClose,
  onCommentCountChange,
}) => {
  const [inputText, setInputText] = useState("");
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const {
    comments,
    isLoading,
    isSubmitting,
    fetchComments,
    addComment,
    deleteComment,
  } = useComments(postId || "");
  const swipeableRefs = useRef<Map<string, Swipeable | null>>(new Map());

  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId, fetchComments]);

  const handleSubmit = useCallback(async () => {
    if (!inputText.trim() || !postId) return;

    const newComment = await addComment(inputText.trim());
    if (newComment) {
      setInputText("");
      onCommentCountChange(postId, comments.length + 1);
    }
  }, [inputText, postId, addComment, comments.length, onCommentCountChange]);

  const handleDelete = useCallback(
    async (commentId: string) => {
      if (!postId) return;

      // Close the swipeable before deleting
      const swipeableRef = swipeableRefs.current.get(commentId);
      if (swipeableRef) {
        swipeableRef.close();
      }

      const success = await deleteComment(commentId);
      if (success) {
        onCommentCountChange(postId, comments.length - 1);
      }
    },
    [postId, deleteComment, comments.length, onCommentCountChange],
  );

  const renderRightActions = useCallback(
    (commentId: string) =>
      (
        _progress: Animated.AnimatedInterpolation<number>,
        _dragX: Animated.AnimatedInterpolation<number>,
      ) => (
        <TouchableOpacity
          style={styles.deleteAction}
          onPress={() => handleDelete(commentId)}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
          <Text style={styles.deleteActionText}>Delete</Text>
        </TouchableOpacity>
      ),
    [handleDelete],
  );

  const renderCommentContent = useCallback(
    (item: PostComment) => (
      <View style={styles.commentItem}>
        {item.user.image ? (
          <Image
            source={{ uri: item.user.image }}
            style={styles.commentAvatar}
          />
        ) : (
          <View style={[styles.commentAvatar, styles.commentAvatarPlaceholder]}>
            <Text style={styles.commentAvatarText}>
              {item.user.name?.trim()
                ? item.user.name.charAt(0).toUpperCase()
                : "D"}
            </Text>
          </View>
        )}
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentAuthor} numberOfLines={1}>
              {processDisplayName(item.user.name, 20)}
            </Text>
            <Text style={styles.commentTime}>
              {formatDistanceToNow(new Date(item.createdAt), {
                addSuffix: false,
              })}
            </Text>
          </View>
          <Text style={styles.commentText}>{item.text}</Text>
        </View>
      </View>
    ),
    [],
  );

  const renderComment = useCallback(
    ({ item }: { item: PostComment }) => {
      const isOwnComment = item.user.id === currentUserId;

      if (isOwnComment) {
        return (
          <Swipeable
            ref={(ref) => {
              if (ref) {
                swipeableRefs.current.set(item.id, ref);
              } else {
                swipeableRefs.current.delete(item.id);
              }
            }}
            renderRightActions={renderRightActions(item.id)}
            rightThreshold={40}
            overshootRight={false}
          >
            {renderCommentContent(item)}
          </Swipeable>
        );
      }

      return renderCommentContent(item);
    },
    [currentUserId, renderRightActions, renderCommentContent],
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={["55%", "90%"]}
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      <BottomSheetView style={styles.sheetRoot}>
        <BottomSheetView style={styles.container}>
          <Text style={styles.title}>Comments</Text>
        </BottomSheetView>

        <BottomSheetFlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item : any) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {isLoading ? "Loading comments..." : "Be the first to comment!"}
            </Text>
          }
        />

        <BottomSheetView style={styles.inputContainer}>
          <BottomSheetTextInput
            style={styles.input}
            placeholder="Add a comment..."
            placeholderTextColor={feedTheme.colors.textTertiary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={200}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!inputText.trim() || isSubmitting}
          >
            <Ionicons
              name="send"
              size={20}
              color={
                inputText.trim()
                  ? feedTheme.colors.primary
                  : feedTheme.colors.textTertiary
              }
            />
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  sheetRoot: {
    flex: 1,
  },
  container: {
    paddingHorizontal: feedTheme.spacing.screenPadding,
    paddingTop: 4,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: feedTheme.colors.textPrimary,
    marginBottom: 16,
    textAlign: "center",
  },
  list: {
    flex: 1,
    paddingHorizontal: feedTheme.spacing.screenPadding,
  },
  listContent: {
    paddingBottom: 16,
  },
  commentItem: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  commentAvatarPlaceholder: {
    backgroundColor: feedTheme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  commentAvatarText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  commentContent: {
    flex: 1,
    marginLeft: 10,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: "600",
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
    textAlign: "center",
    color: feedTheme.colors.textSecondary,
    marginTop: 40,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingVertical: 12,
    paddingHorizontal: feedTheme.spacing.screenPadding,
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
  deleteAction: {
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    marginBottom: 16,
    borderRadius: 8,
  },
  deleteActionText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
});
