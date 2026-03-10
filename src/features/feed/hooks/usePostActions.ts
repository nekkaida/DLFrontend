// src/features/feed/hooks/usePostActions.ts

import { useState, useCallback } from 'react';
import axiosInstance from '@/lib/endpoints';
import * as Haptics from 'expo-haptics';

export const usePostActions = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const editCaption = useCallback(async (postId: string, caption: string): Promise<boolean> => {
    try {
      setIsEditing(true);
      await axiosInstance.patch(`/api/feed/posts/${postId}`, { caption });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch (err) {
      console.error('Error editing caption:', err);
      return false;
    } finally {
      setIsEditing(false);
    }
  }, []);

  const deletePost = useCallback(async (postId: string): Promise<boolean> => {
    try {
      setIsDeleting(true);
      await axiosInstance.delete(`/api/feed/posts/${postId}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch (err) {
      console.error('Error deleting post:', err);
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return {
    isDeleting,
    isEditing,
    deletePost,
    editCaption,
  };
};
