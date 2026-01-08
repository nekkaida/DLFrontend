// src/features/feed/hooks/useSharePost.ts

import { useState, useCallback } from 'react';
import { View, Platform, Alert, Linking } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import { toast } from 'sonner-native';

// Deep link configuration
const WEB_BASE_URL = 'https://deuceleague.com';
const APP_SCHEME = 'deuceleague';

/**
 * Opens the device Settings app for this application.
 * iOS: Opens app-specific settings page
 * Android: Opens app settings in system settings
 */
const openSettings = async (): Promise<void> => {
  try {
    if (Platform.OS === 'ios') {
      await Linking.openURL('app-settings:');
    } else {
      await Linking.openSettings();
    }
  } catch (err) {
    console.error('Failed to open settings:', err);
  }
};

export type ShareStyle = 'transparent' | 'standard';

interface CaptureOptions {
  style?: ShareStyle;
}

interface UseSharePostReturn {
  isCapturing: boolean;
  isSaving: boolean;
  captureAndShare: (viewRef: React.RefObject<View | null>, options?: CaptureOptions) => Promise<boolean>;
  captureAndSave: (viewRef: React.RefObject<View | null>, options?: CaptureOptions) => Promise<boolean>;
  shareToInstagram: (viewRef: React.RefObject<View | null>, options?: CaptureOptions) => Promise<boolean>;
  shareLink: (postId: string) => Promise<boolean>;
}

export const useSharePost = (): UseSharePostReturn => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Get capture configuration based on style
   *
   * Style affects the background rendering:
   * - 'transparent': Transparent background for Instagram story overlays
   * - 'standard': Solid background for regular sharing
   *
   * Note: The actual background styling is handled by the view component being captured.
   * The view should conditionally render transparent/solid background based on a style prop.
   */
  const getCaptureConfig = useCallback((style: ShareStyle = 'transparent') => {
    return {
      format: 'png' as const,
      quality: 1,
      result: 'tmpfile' as const,
      width: 1080,
      height: 1080,
    };
  }, []);

  /**
   * Capture a view as an image and open the native share sheet
   */
  const captureAndShare = useCallback(async (
    viewRef: React.RefObject<View | null>,
    options?: CaptureOptions
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
      const uri = await captureRef(viewRef, getCaptureConfig(options?.style));

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
  }, [getCaptureConfig]);

  /**
   * Capture a view as an image and save it to the camera roll
   */
  const captureAndSave = useCallback(async (
    viewRef: React.RefObject<View | null>,
    options?: CaptureOptions
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
          'Please grant photo library access to save images.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: openSettings },
          ]
        );
        return false;
      }

      // Capture the view as a PNG image (1080x1080 for optimal social sharing)
      const uri = await captureRef(viewRef, getCaptureConfig(options?.style));

      // Save to camera roll
      await MediaLibrary.saveToLibraryAsync(uri);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success('Saved to Camera Roll');
      return true;
    } catch (err) {
      console.error('Error capturing and saving post:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error('Failed to save. Please try again.');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [getCaptureConfig]);

  /**
   * Share image directly to Instagram Stories
   */
  const shareToInstagram = useCallback(async (
    viewRef: React.RefObject<View | null>,
    options?: CaptureOptions
  ): Promise<boolean> => {
    if (!viewRef.current) {
      console.error('View ref is not available for capture');
      return false;
    }

    // Instagram sharing only works on iOS and Android
    if (Platform.OS === 'web') {
      Alert.alert('Unavailable', 'Instagram sharing is not available on web.');
      return false;
    }

    try {
      setIsCapturing(true);

      // Request media library permissions first (needed for saving temp file)
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant photo library access to share to Instagram.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: openSettings },
          ]
        );
        return false;
      }

      // Capture the view as a PNG image
      const uri = await captureRef(viewRef, getCaptureConfig(options?.style));

      // Save to camera roll first (Instagram reads from there)
      const asset = await MediaLibrary.createAssetAsync(uri);

      // Try to open Instagram Stories with the image
      // Instagram URL scheme for stories: instagram-stories://share
      const instagramStoriesUrl = Platform.select({
        ios: `instagram-stories://share?source_application=com.deuceleague.app&backgroundImage=${encodeURIComponent(asset.uri)}`,
        android: `instagram-stories://share`,
      });

      if (instagramStoriesUrl) {
        const canOpen = await Linking.canOpenURL('instagram://');
        if (canOpen) {
          // For Android, we need to use a different approach
          if (Platform.OS === 'android') {
            // Android uses intent system - open share sheet with Instagram filter
            const { Share } = await import('react-native');
            await Share.share({
              message: 'Check out my Deuce League score!',
              url: asset.uri,
            });
          } else {
            // iOS can use the stories URL scheme
            await Linking.openURL(instagramStoriesUrl);
          }
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return true;
        } else {
          Alert.alert(
            'Instagram Not Installed',
            'Please install Instagram to share directly to your story.',
            [{ text: 'OK' }]
          );
          return false;
        }
      }

      return false;
    } catch (err) {
      console.error('Error sharing to Instagram:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error('Failed to share to Instagram. Please try again.');
      return false;
    } finally {
      setIsCapturing(false);
    }
  }, [getCaptureConfig]);

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
    shareToInstagram,
    shareLink,
  };
};
