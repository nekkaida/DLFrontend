// src/features/feed/hooks/useLikes.ts

import { useState, useCallback } from 'react';
import axiosInstance from '@/lib/endpoints';
import { PostLiker, LikeToggleResponse } from '../types';
import * as Haptics from 'expo-haptics';

export const useLikes = () => {
  const [isLiking, setIsLiking] = useState<string | null>(null);

  const toggleLike = useCallback(async (
    postId: string,
    onSuccess?: (result: LikeToggleResponse) => void
  ) => {
    try {
      setIsLiking(postId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const response = await axiosInstance.post(`/api/feed/posts/${postId}/like`);

      if (response.data?.data) {
        const result: LikeToggleResponse = response.data.data;
        onSuccess?.(result);
        return result;
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      throw err;
    } finally {
      setIsLiking(null);
    }
  }, []);

  const fetchLikers = useCallback(async (postId: string, limit = 50): Promise<PostLiker[]> => {
    try {
      const response = await axiosInstance.get(`/api/feed/posts/${postId}/likers?limit=${limit}`);
      return response.data?.data || [];
    } catch (err) {
      console.error('Error fetching likers:', err);
      return [];
    }
  }, []);

  return {
    isLiking,
    toggleLike,
    fetchLikers,
  };
};
