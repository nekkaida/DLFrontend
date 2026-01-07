// src/features/feed/hooks/useSharePost.ts

import { useState, useCallback } from 'react';
import { View, Platform, Alert } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';

// Deep link configuration
const WEB_BASE_URL = 'https://deuceleague.com';
const APP_SCHEME = 'deuceleague';

interface UseSharePostReturn {
  isCapturing: boolean;
  isSaving: boolean;
  captureAndShare: (viewRef: React.RefObject<View>) => Promise<boolean>;
  captureAndSave: (viewRef: React.RefObject<View>) => Promise<boolean>;
  shareLink: (postId: string) => Promise<boolean>;
}

export const useSharePost = (): UseSharePostReturn => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Capture a view as an image and open the native share sheet
   */
  const captureAndShare = useCallback(async (
    viewRef: React.RefObject<View>
  ): Promise<boolean> => {
    if (!viewRef.current) {
      console.error('View ref is not available for capture');
      return false;
    }

    try {
      setIsCapturing(true);

      // Check if sharing is available on this device
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing Unavailable', 'Sharing is not available on this device.');
        return false;
      }

      // Capture the view as a PNG image (1080x1080 for optimal social sharing)
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
        width: 1080,
        height: 1080,
      });

      // Open native share sheet
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share Post',
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch (err) {
      console.error('Error capturing and sharing post:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  /**
   * Capture a view as an image and save it to the camera roll
   */
  const captureAndSave = useCallback(async (
    viewRef: React.RefObject<View>
  ): Promise<boolean> => {
    if (!viewRef.current) {
      console.error('View ref is not available for capture');
      return false;
    }

    try {
      setIsSaving(true);

      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant media library access to save images.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // Capture the view as a PNG image (1080x1080 for optimal social sharing)
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
        width: 1080,
        height: 1080,
      });

      // Save to camera roll
      await MediaLibrary.saveToLibraryAsync(uri);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Post saved to your camera roll.');
      return true;
    } catch (err) {
      console.error('Error capturing and saving post:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to save the post. Please try again.');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  /**
   * Share a deep link to a specific post
   */
  const shareLink = useCallback(async (postId: string): Promise<boolean> => {
    try {
      setIsCapturing(true);

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing Unavailable', 'Sharing is not available on this device.');
        return false;
      }

      // Create deep link URL
      // Use web URL for universal sharing (works in browsers and can redirect to app)
      const shareUrl = `${WEB_BASE_URL}/post/${postId}`;

      // On some platforms, we can share text/URLs directly
      // expo-sharing primarily handles files, so we use a workaround
      if (Platform.OS === 'web') {
        // Web can use navigator.share if available
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({
            title: 'Deuce League Post',
            text: 'Check out this post on Deuce League!',
            url: shareUrl,
          });
        } else {
          // Fallback: copy to clipboard
          await navigator.clipboard.writeText(shareUrl);
          Alert.alert('Link Copied', 'Post link has been copied to clipboard.');
        }
      } else {
        // For native platforms, we need to use a different approach
        // expo-sharing doesn't support sharing plain text/URLs directly
        // We can use Linking or a native share module
        const { Share } = await import('react-native');
        await Share.share({
          message: `Check out this post on Deuce League! ${shareUrl}`,
          url: shareUrl, // iOS only
          title: 'Deuce League Post',
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch (err) {
      // User cancelled sharing is not an error
      if ((err as any)?.message?.includes('cancelled')) {
        return false;
      }
      console.error('Error sharing post link:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  return {
    isCapturing,
    isSaving,
    captureAndShare,
    captureAndSave,
    shareLink,
  };
};
