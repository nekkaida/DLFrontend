// src/features/feed/hooks/useComments.ts

import { useState, useCallback } from 'react';
import { authClient } from '@/lib/auth-client';
import { getBackendBaseURL } from '@/config/network';
import { PostComment } from '../types';
import { toast } from 'sonner-native';

export const useComments = (postId: string) => {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = useCallback(async (limit = 50, offset = 0) => {
    try {
      setIsLoading(true);

      const backendUrl = getBackendBaseURL();
      const response = await authClient.$fetch(
        `${backendUrl}/api/feed/posts/${postId}/comments?limit=${limit}&offset=${offset}`,
        { method: 'GET' }
      );

      const responseData = (response as any).data || response;

      if (responseData?.data) {
        if (offset === 0) {
          setComments(responseData.data);
        } else {
          setComments(prev => [...prev, ...responseData.data]);
        }
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  const addComment = useCallback(async (text: string): Promise<PostComment | null> => {
    try {
      setIsSubmitting(true);

      const backendUrl = getBackendBaseURL();
      const response = await authClient.$fetch(
        `${backendUrl}/api/feed/posts/${postId}/comments`,
        {
          method: 'POST',
          body: { text },
        }
      );

      const responseData = (response as any).data || response;

      if (responseData?.data) {
        const newComment: PostComment = responseData.data;
        setComments(prev => [newComment, ...prev]);
        return newComment;
      }
      return null;
    } catch (err) {
      console.error('Error adding comment:', err);
      toast.error('Failed to add comment');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [postId]);

  const deleteComment = useCallback(async (commentId: string): Promise<boolean> => {
    try {
      const backendUrl = getBackendBaseURL();
      await authClient.$fetch(
        `${backendUrl}/api/feed/comments/${commentId}`,
        { method: 'DELETE' }
      );

      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
      return true;
    } catch (err) {
      console.error('Error deleting comment:', err);
      toast.error('Failed to delete comment');
      return false;
    }
  }, []);

  return {
    comments,
    isLoading,
    isSubmitting,
    fetchComments,
    addComment,
    deleteComment,
  };
};
