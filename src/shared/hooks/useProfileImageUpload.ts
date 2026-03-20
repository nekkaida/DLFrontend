import { getBackendBaseURL } from '@/config/network';
import { authClient } from '@/lib/auth-client';
import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import ExpoImageCropTool from 'expo-image-crop-tool';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
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
  isPickerActive: boolean;

  // Actions
  setProfileImage: (uri: string | null) => void;
  uploadProfileImage: (imageUri: string, retryCount?: number) => Promise<string | null>;
  pickImageFromLibrary: () => Promise<void>;
  openCamera: () => Promise<void>;
  handleEditImage: () => Promise<void>;
  resetState: () => void;
}

const MAX_RETRIES = 2;
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Shared hook for profile image upload functionality.
 * Used by ProfilePictureScreen (onboarding), ProfileScreen, and edit-profile.
 *
 * Features:
 * - Native circular cropper via expo-image-crop-tool
 * - EXIF orientation normalization via expo-image-manipulator
 * - FormData multipart upload with MIME type detection
 * - Platform-specific URI handling (iOS file:// prefix removal)
 * - Retry logic with exponential backoff (2 retries)
 * - 500x500 JPEG output
 */
export function useProfileImageUpload(options: UseProfileImageUploadOptions = {}): UseProfileImageUploadReturn {
  const { userId, onUploadSuccess, onUploadError } = options;

  // State
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [originalLocalImage, setOriginalLocalImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isPickerActive, setIsPickerActive] = useState(false);

  /**
   * Open native circular cropper, resize to 500x500, and upload.
   * Returns the uploaded URL on success, null on cancellation/failure.
   */
  const cropAndUpload = useCallback(async (imageUri: string): Promise<string | null> => {
    try {
      // Open native cropper with circular mask
      const cropResult = await ExpoImageCropTool.openCropperAsync({
        imageUri,
        shape: 'circle',
        aspectRatio: 1,
        format: 'jpeg',
        compressImageQuality: 0.9,
      });

      // Resize to 500x500 for consistent profile pictures
      let finalUri = cropResult.path;
      try {
        const resized = await manipulateAsync(
          cropResult.path,
          [{ resize: { width: 500, height: 500 } }],
          { compress: 0.9, format: SaveFormat.JPEG }
        );
        finalUri = resized.uri;
      } catch (resizeError) {
        console.warn('[useProfileImageUpload] Resize failed, using cropped image as-is:', resizeError);
      }

      // Upload
      const url = await uploadProfileImage(finalUri);
      return url;
    } catch (error: any) {
      // User cancelled the cropper — not an error
      if (error?.message?.includes('cancel') || error?.code === 'ERR_CANCELED') {
        return null;
      }
      console.error('[useProfileImageUpload] Crop failed:', error);
      toast.error('Failed to crop image. Please try again.');
      return null;
    }
  }, [uploadProfileImage]);

  /**
   * Upload profile image to backend with retry logic.
   * Returns the uploaded image URL on success, null on failure.
   */
  const uploadProfileImage = useCallback(async (imageUri: string, retryCount = 0): Promise<string | null> => {
    console.log('[useProfileImageUpload] uploadProfileImage called:', { imageUri, retryCount });
    try {
      setIsUploadingImage(true);

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

      console.log('[useProfileImageUpload] Uploading file:', { uri: imageUri, mimeType });

      // Get decoded cookies for authentication
      const cookies = authClient.getCookie();
      let decodedCookies = '';
      if (cookies) {
        const rawCookies = cookies.replace(/^;\s*/, '');
        decodedCookies = rawCookies.split('; ').map(cookie => {
          const eqIndex = cookie.indexOf('=');
          if (eqIndex === -1) return cookie;
          const name = cookie.substring(0, eqIndex);
          const value = cookie.substring(eqIndex + 1);
          try {
            return `${name}=${decodeURIComponent(value)}`;
          } catch {
            return cookie;
          }
        }).join('; ');
      }

      console.log('[useProfileImageUpload] Cookie length:', decodedCookies.length);

      // Use expo-file-system uploadAsync which has native-level support
      const backendUrl = getBackendBaseURL();
      const uploadResult = await FileSystem.uploadAsync(
        `${backendUrl}/api/player/profile/upload-image`,
        imageUri,
        {
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: 'image',
          mimeType,
          headers: {
            'Cookie': decodedCookies,
          },
        }
      );

      console.log('[useProfileImageUpload] Upload response status:', uploadResult.status);

      if (uploadResult.status < 200 || uploadResult.status >= 300) {
        try {
          const errorData = JSON.parse(uploadResult.body);
          throw new Error(errorData.error || errorData.message || `Upload failed with status ${uploadResult.status}`);
        } catch (e: any) {
          if (e.message?.includes('Upload failed')) throw e;
          throw new Error(`Upload failed with status ${uploadResult.status}`);
        }
      }

      const result = JSON.parse(uploadResult.body);

      let imageUrl: string | null = null;
      if (result?.success && result?.data) {
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
    } catch (error: any) {
      const errorMessage = error.message || 'Upload failed';
      console.error('[useProfileImageUpload] Upload error:', errorMessage);

      // Retry logic for network errors
      if (retryCount < MAX_RETRIES && error.message?.includes('Network')) {
        console.log('[useProfileImageUpload] Retrying due to network error...');
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        setIsUploadingImage(false);
        return uploadProfileImage(imageUri, retryCount + 1);
      }

      toast.error('Error', {
        description: errorMessage || 'Failed to upload profile picture. Please try again.',
      });

      onUploadError?.(new Error(errorMessage || 'Upload failed'));
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  }, [userId, onUploadSuccess, onUploadError]);

  /**
   * Open image library picker, then native circular cropper, then upload.
   */
  const pickImageFromLibrary = useCallback(async () => {
    if (isPickerActive) return;
    setIsPickerActive(true);

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your photo library to upload a profile picture.',
          [{ text: 'OK' }]
        );
        return;
      }

      // No native editing — we use expo-image-crop-tool instead
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1.0,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        // Check file size — fileSize may be undefined on Android, fall back to FileSystem
        let size = asset.fileSize;
        if (!size) {
          try {
            const info = await FileSystem.getInfoAsync(asset.uri);
            if (info.exists && 'size' in info) size = info.size;
          } catch { /* ignore — proceed without size check */ }
        }
        if (size && size > MAX_FILE_SIZE_BYTES) {
          Alert.alert(
            'Image Too Large',
            `Please select an image smaller than ${MAX_FILE_SIZE_MB}MB.`,
            [{ text: 'OK' }]
          );
          return;
        }

        // Normalize EXIF rotation
        const normalized = await manipulateAsync(
          asset.uri,
          [],
          { compress: 1, format: SaveFormat.JPEG }
        );

        setOriginalLocalImage(normalized.uri);

        // Open native circular cropper → resize → upload
        await cropAndUpload(normalized.uri);
      }
    } catch {
      toast.error('Error', {
        description: 'Failed to open photo library. Please try again.',
      });
    } finally {
      setIsPickerActive(false);
    }
  }, [isPickerActive, cropAndUpload]);

  /**
   * Open camera to take photo, then native circular cropper, then upload.
   */
  const openCamera = useCallback(async () => {
    if (isPickerActive) return;
    setIsPickerActive(true);

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

      // No native editing — we use expo-image-crop-tool instead
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1.0,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        // Check file size — fileSize may be undefined on Android, fall back to FileSystem
        let size = asset.fileSize;
        if (!size) {
          try {
            const info = await FileSystem.getInfoAsync(asset.uri);
            if (info.exists && 'size' in info) size = info.size;
          } catch { /* ignore — proceed without size check */ }
        }
        if (size && size > MAX_FILE_SIZE_BYTES) {
          Alert.alert(
            'Image Too Large',
            `Please select an image smaller than ${MAX_FILE_SIZE_MB}MB.`,
            [{ text: 'OK' }]
          );
          return;
        }

        // Normalize EXIF rotation
        const normalized = await manipulateAsync(
          asset.uri,
          [],
          { compress: 1, format: SaveFormat.JPEG }
        );

        setOriginalLocalImage(normalized.uri);

        // Open native circular cropper → resize → upload
        await cropAndUpload(normalized.uri);
      }
    } catch {
      toast.error('Error', {
        description: 'Failed to open camera. Please try again.',
      });
    } finally {
      setIsPickerActive(false);
    }
  }, [isPickerActive, cropAndUpload]);

  /**
   * Handle edit button (pen icon) — reopen native cropper with original image.
   */
  const handleEditImage = useCallback(async () => {
    if (!profileImage || isPickerActive) return;
    setIsPickerActive(true);

    try {
      if (originalLocalImage) {
        await cropAndUpload(originalLocalImage);
      } else {
        toast.info('Replace Image', {
          description: 'To change your photo, please upload or take a new one.',
        });
      }
    } finally {
      setIsPickerActive(false);
    }
  }, [profileImage, originalLocalImage, cropAndUpload, isPickerActive]);

  /**
   * Reset all state to initial values.
   */
  const resetState = useCallback(() => {
    setProfileImage(null);
    setOriginalLocalImage(null);
    setIsUploadingImage(false);
  }, []);

  return {
    profileImage,
    originalLocalImage,
    isUploadingImage,
    isPickerActive,
    setProfileImage,
    uploadProfileImage,
    pickImageFromLibrary,
    openCamera,
    handleEditImage,
    resetState,
  };
}
