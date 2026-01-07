// src/features/feed/hooks/usePostActions.ts

import { useState, useCallback } from 'react';
import { authClient } from '@/lib/auth-client';
import { getBackendBaseURL } from '@/config/network';
import * as Haptics from 'expo-haptics';

export const usePostActions = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const editCaption = useCallback(async (postId: string, caption: string): Promise<boolean> => {
    try {
      setIsEditing(true);
      const backendUrl = getBackendBaseURL();
      await authClient.$fetch(
        `${backendUrl}/api/feed/posts/${postId}`,
        {
          method: 'PATCH',
          body: { caption },
        }
      );
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
      const backendUrl = getBackendBaseURL();
      await authClient.$fetch(
        `${backendUrl}/api/feed/posts/${postId}`,
        { method: 'DELETE' }
      );
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
