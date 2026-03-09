import { getBackendBaseURL } from '@/config/network';
import { authClient } from '@/lib/auth-client';
import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import { Alert, Image } from 'react-native';
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
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

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
  const [isPickerActive, setIsPickerActive] = useState(false);
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
      // This bypasses all JavaScript networking limitations with cookies
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
      console.log('[useProfileImageUpload] Upload response body:', uploadResult.body);

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
      console.log('[useProfileImageUpload] Upload result:', result);

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
    } catch (error: any) {
      const errorMessage = error.message || 'Upload failed';
      console.error('[useProfileImageUpload] Upload error:', errorMessage);
      console.error('[useProfileImageUpload] Error details:', {
        message: errorMessage,
        imageUri,
        retryCount,
      });

      // Retry logic for network errors
      if (retryCount < MAX_RETRIES && error.message?.includes('Network')) {
        console.log('[useProfileImageUpload] Retrying due to network error...');
        // Wait a bit before retrying (exponential backoff)
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
   * Open image library picker with built-in square crop.
   */
  const pickImageFromLibrary = useCallback(async () => {
    if (isPickerActive) return; // Prevent multiple pickers
    setIsPickerActive(true);

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
        // Check file size before processing
        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE_BYTES) {
          Alert.alert(
            'Image Too Large',
            `Please select an image smaller than ${MAX_FILE_SIZE_MB}MB.`,
            [{ text: 'OK' }]
          );
          return;
        }

        // Normalize EXIF rotation BEFORE showing cropper
        // This ensures the displayed image matches what will be cropped
        const normalized = await manipulateAsync(
          asset.uri,
          [],
          { compress: 1, format: SaveFormat.JPEG }
        );

        setOriginalLocalImage(normalized.uri); // Save original for re-cropping
        setSelectedImageUri(normalized.uri);
        setShowCropper(true);
      }
    } catch {
      toast.error('Error', {
        description: 'Failed to open photo library. Please try again.',
      });
    } finally {
      setIsPickerActive(false);
    }
  }, [isPickerActive]);

  /**
   * Open camera to take photo with built-in square crop.
   */
  const openCamera = useCallback(async () => {
    if (isPickerActive) return; // Prevent multiple pickers
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

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true, // Enable native editing with square crop
        aspect: [1, 1], // Square aspect ratio for circular display
        quality: 1.0,
      });

      if (!result.canceled && result.assets[0]) {
        // Check file size before processing
        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE_BYTES) {
          Alert.alert(
            'Image Too Large',
            `Please select an image smaller than ${MAX_FILE_SIZE_MB}MB.`,
            [{ text: 'OK' }]
          );
          return;
        }

        // Normalize EXIF rotation BEFORE showing cropper
        // This ensures the displayed image matches what will be cropped
        const normalized = await manipulateAsync(
          asset.uri,
          [],
          { compress: 1, format: SaveFormat.JPEG }
        );

        setOriginalLocalImage(normalized.uri); // Save original for re-cropping
        setSelectedImageUri(normalized.uri);
        setShowCropper(true);
      }
    } catch {
      toast.error('Error', {
        description: 'Failed to open camera. Please try again.',
      });
    } finally {
      setIsPickerActive(false);
    }
  }, [isPickerActive]);

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
    isPickerActive,
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
