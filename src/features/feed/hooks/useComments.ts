// src/features/feed/hooks/useComments.ts

import { useState, useCallback } from 'react';
import axiosInstance from '@/lib/endpoints';
import { PostComment } from '../types';
import { toast } from 'sonner-native';

export const useComments = (postId: string) => {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = useCallback(async (limit = 50, offset = 0) => {
    try {
      setIsLoading(true);

      const response = await axiosInstance.get(
        `/api/feed/posts/${postId}/comments?limit=${limit}&offset=${offset}`
      );

      if (response.data?.data) {
        if (offset === 0) {
          setComments(response.data.data);
        } else {
          setComments(prev => [...prev, ...response.data.data]);
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

      const response = await axiosInstance.post(
        `/api/feed/posts/${postId}/comments`,
        { text }
      );

      if (response.data?.data) {
        const newComment: PostComment = response.data.data;
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
      await axiosInstance.delete(`/api/feed/comments/${commentId}`);

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
