import { getBackendBaseURL } from '@/config/network';
import { authClient } from '@/lib/auth-client';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import { Alert, Image, Platform } from 'react-native';
import { toast } from 'sonner-native';

interface UseProfileImageUploadOptions {
  userId?: string;
  onUploadSuccess?: (imageUrl: string) => void;
  onUploadError?: (error: Error) => void;
}

interface UseProfileImageUploadReturn {
  // State
  profileImage: string | null;
  originalLocalImage: string | null;
  isUploadingImage: boolean;
  showCropper: boolean;
  selectedImageUri: string | null;

  // Actions
  setProfileImage: (uri: string | null) => void;
  uploadProfileImage: (imageUri: string, retryCount?: number) => Promise<string | null>;
  pickImageFromLibrary: () => Promise<void>;
  openCamera: () => Promise<void>;
  handleCropComplete: (croppedUri: string) => Promise<void>;
  handleCropCancel: () => void;
  handleEditImage: () => void;
  resetState: () => void;
}

const MAX_RETRIES = 2;

/**
 * Shared hook for profile image upload functionality.
 * Used by ProfilePictureScreen (onboarding), ProfileScreen, and edit-profile.
 *
 * Features:
 * - CircularImageCropper integration
 * - EXIF orientation normalization via expo-image-manipulator
 * - FormData multipart upload with MIME type detection
 * - Platform-specific URI handling (iOS file:// prefix removal)
 * - Retry logic with exponential backoff (2 retries)
 * - 500x500 PNG output from cropper
 */
export function useProfileImageUpload(options: UseProfileImageUploadOptions = {}): UseProfileImageUploadReturn {
  const { userId, onUploadSuccess, onUploadError } = options;

  // State
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [originalLocalImage, setOriginalLocalImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  /**
   * Normalize image orientation using EXIF data.
   * This ensures the displayed image matches what will be cropped.
   */
  const normalizeImageOrientation = useCallback(async (imageUri: string): Promise<string> => {
    try {
      return new Promise((resolve) => {
        Image.getSize(imageUri, async () => {
          // Use manipulateAsync with no operations to normalize EXIF orientation
          const normalized = await manipulateAsync(
            imageUri,
            [], // No operations, just normalize
            { compress: 1.0, format: SaveFormat.JPEG }
          );

          resolve(normalized.uri);
        }, () => {
          resolve(imageUri);
        });
      });
    } catch {
      return imageUri;
    }
  }, []);

  /**
   * Upload profile image to backend with retry logic.
   * Returns the uploaded image URL on success, null on failure.
   */
  const uploadProfileImage = useCallback(async (imageUri: string, retryCount = 0): Promise<string | null> => {
    console.log('[useProfileImageUpload] uploadProfileImage called:', { imageUri, retryCount });
    try {
      setIsUploadingImage(true);

      const backendUrl = getBackendBaseURL();
      console.log('[useProfileImageUpload] Backend URL:', backendUrl);
      const formData = new FormData();

      // Get file extension from URI
      const fileExtension = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeTypes: { [key: string]: string } = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
      };
      const mimeType = mimeTypes[fileExtension] || 'image/jpeg';

      // Create file object for upload with correct extension
      // React Native FormData expects: { uri, type, name }
      // iOS requires file:// prefix removal, Android doesn't
      const normalizedUri = Platform.OS === 'ios' && imageUri.startsWith('file://')
        ? imageUri.replace('file://', '')
        : imageUri;

      const file = {
        uri: normalizedUri,
        type: mimeType,
        name: `profile-${Date.now()}.${fileExtension}`,
      };

      console.log('[useProfileImageUpload] File object:', file);

      // TypeScript doesn't know about React Native's FormData format
      // In RN, FormData.append accepts { uri, type, name } objects
      formData.append('image', file as any);

      // Get session token for authentication
      const sessionData = await authClient.getSession();
      const token = sessionData?.data?.session?.token;
      const currentUserId = userId || sessionData?.data?.user?.id;

      if (!token && !currentUserId) {
        throw new Error('No authentication token available. Please sign in again.');
      }

      // Use fetch directly for FormData (authClient.$fetch may not handle multipart correctly)
      const headers: Record<string, string> = {};

      // Add authorization token if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Add user ID header for mobile compatibility
      if (currentUserId) {
        headers['x-user-id'] = currentUserId;
      }

      console.log('[useProfileImageUpload] Sending upload request...');
      const response = await fetch(`${backendUrl}/api/player/profile/upload-image`, {
        method: 'POST',
        body: formData,
        headers,
      });

      console.log('[useProfileImageUpload] Response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = `Upload failed with status ${response.status}`;
        try {
          const errorText = await response.text();
          const errorJson = errorText ? JSON.parse(errorText) : null;
          errorMessage = errorJson?.message || errorJson?.error || errorText || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = `Upload failed: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      // Backend returns: { success: true, data: { user: {...}, imageUrl: "url" }, message: "..." }
      let imageUrl: string | null = null;

      if (result?.success && result?.data) {
        // Backend structure: result.data.imageUrl
        imageUrl = result.data.imageUrl || null;
      }

      if (!imageUrl) {
        throw new Error('Upload successful but no image URL received from server');
      }

      // Update local state with new image URL
      setProfileImage(imageUrl);

      toast.success('Success', {
        description: 'Profile picture updated successfully!',
      });

      onUploadSuccess?.(imageUrl);
      return imageUrl;
    } catch (error) {
      console.error('[useProfileImageUpload] Upload error:', error);
      console.error('[useProfileImageUpload] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        imageUri,
        retryCount,
      });

      // Retry logic for network errors
      if (retryCount < MAX_RETRIES && error instanceof Error && error.message.includes('Network request failed')) {
        console.log('[useProfileImageUpload] Retrying due to network error...');
        // Wait a bit before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        setIsUploadingImage(false);
        return uploadProfileImage(imageUri, retryCount + 1);
      }

      toast.error('Error', {
        description: 'Failed to upload profile picture. Please try again.',
      });

      onUploadError?.(error instanceof Error ? error : new Error('Upload failed'));
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  }, [userId, onUploadSuccess, onUploadError]);

  /**
   * Open image library picker with built-in square crop.
   */
  const pickImageFromLibrary = useCallback(async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your photo library to upload a profile picture.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true, // Enable native editing with square crop
        aspect: [1, 1], // Square aspect ratio for circular display
        quality: 1.0,
      });

      if (!result.canceled && result.assets[0]) {
        // Show preview with circular mask
        setOriginalLocalImage(result.assets[0].uri);
        setSelectedImageUri(result.assets[0].uri);
        setShowCropper(true);
      }
    } catch {
      toast.error('Error', {
        description: 'Failed to open photo library. Please try again.',
      });
    }
  }, []);

  /**
   * Open camera to take photo with built-in square crop.
   */
  const openCamera = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your camera to take a profile picture.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true, // Enable native editing with square crop
        aspect: [1, 1], // Square aspect ratio for circular display
        quality: 1.0,
      });

      if (!result.canceled && result.assets[0]) {
        // Show preview with circular mask
        setOriginalLocalImage(result.assets[0].uri);
        setSelectedImageUri(result.assets[0].uri);
        setShowCropper(true);
      }
    } catch {
      toast.error('Error', {
        description: 'Failed to open camera. Please try again.',
      });
    }
  }, []);

  /**
   * Handle crop completion - resize and upload the cropped image.
   */
  const handleCropComplete = useCallback(async (croppedUri: string) => {
    console.log('[useProfileImageUpload] handleCropComplete called with URI:', croppedUri);
    setShowCropper(false);
    setSelectedImageUri(null);
    
    // Resize to 500x500 for consistent profile pictures
    try {
      const resized = await manipulateAsync(
        croppedUri,
        [{ resize: { width: 500, height: 500 } }],
        { compress: 0.9, format: SaveFormat.JPEG }
      );
      await uploadProfileImage(resized.uri);
    } catch (error) {
      console.error('[useProfileImageUpload] Error resizing image:', error);
      // Fallback to uploading original cropped image
      await uploadProfileImage(croppedUri);
    }
  }, [uploadProfileImage]);

  /**
   * Handle crop cancellation.
   */
  const handleCropCancel = useCallback(() => {
    setShowCropper(false);
    setSelectedImageUri(null);
  }, []);

  /**
   * Handle edit button click - reopen cropper with original image.
   */
  const handleEditImage = useCallback(() => {
    if (!profileImage) return;

    // Use the original local image for re-cropping, not the uploaded URL
    if (originalLocalImage) {
      setSelectedImageUri(originalLocalImage);
      setShowCropper(true);
    } else {
      toast.info('Replace Image', {
        description: 'To change your photo, please upload or take a new one.',
      });
    }
  }, [profileImage, originalLocalImage]);

  /**
   * Reset all state to initial values.
   */
  const resetState = useCallback(() => {
    setProfileImage(null);
    setOriginalLocalImage(null);
    setIsUploadingImage(false);
    setShowCropper(false);
    setSelectedImageUri(null);
  }, []);

  return {
    // State
    profileImage,
    originalLocalImage,
    isUploadingImage,
    showCropper,
    selectedImageUri,

    // Actions
    setProfileImage,
    uploadProfileImage,
    pickImageFromLibrary,
    openCamera,
    handleCropComplete,
    handleCropCancel,
    handleEditImage,
    resetState,
  };
}
