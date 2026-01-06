// src/features/feed/hooks/useLikes.ts

import { useState, useCallback } from 'react';
import { authClient } from '@/lib/auth-client';
import { getBackendBaseURL } from '@/config/network';
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

      const backendUrl = getBackendBaseURL();
      const response = await authClient.$fetch(
        `${backendUrl}/api/feed/posts/${postId}/like`,
        { method: 'POST' }
      );

      const responseData = (response as any).data || response;

      if (responseData?.data) {
        const result: LikeToggleResponse = responseData.data;
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
      const backendUrl = getBackendBaseURL();
      const response = await authClient.$fetch(
        `${backendUrl}/api/feed/posts/${postId}/likers?limit=${limit}`,
        { method: 'GET' }
      );

      const responseData = (response as any).data || response;
      return responseData?.data || [];
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
