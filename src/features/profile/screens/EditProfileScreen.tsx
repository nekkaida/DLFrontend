import { getBackendBaseURL } from '@/config/network';
import { authClient, useSession } from '@/lib/auth-client';
import { theme } from '@core/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  ImageStyle,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { toast } from 'sonner-native';

// Import shared profile image upload hook and CircularImageCropper
import { useProfileImageUpload } from '@/src/shared/hooks/useProfileImageUpload';
import { CircularImageCropper } from '@/src/features/onboarding/components';

// BackgroundGradient Component (consistent with profile and settings)
const BackgroundGradient = () => {
  return (
    <LinearGradient
      colors={['#FE9F4D', '#FFF5EE', '#FFFFFF']}
      locations={[0, 0.4, 1.0]}
      style={styles.backgroundGradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    />
  );
};

interface FormData {
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  location: string;
  bio: string;
  profilePicture: string;
  dateOfBirth: string;
}

interface ProfileData {
  name: string;
  username: string;
  email: string;
  phoneNumber: string | null;
  area: string | null;
  bio: string | null;
  image: string | null;
  dateOfBirth: string | null;
}

interface ProfileApiResponse {
  data: {
    success: boolean;
    data: ProfileData;
    message?: string;
  };
}

interface ProfileUpdateResponse {
  success: boolean;
  data: ProfileData;
  message?: string;
}

export default function EditProfileScreen() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    username: '',
    email: '',
    phoneNumber: '',
    location: '',
    bio: '',
    profilePicture: '',
    dateOfBirth: '',
  });

  // Store original data to detect changes
  const [originalData, setOriginalData] = useState<FormData | null>(null);

  // Entry animation values
  const headerEntryOpacity = useRef(new Animated.Value(0)).current;
  const headerEntryTranslateY = useRef(new Animated.Value(-20)).current;
  const contentEntryOpacity = useRef(new Animated.Value(0)).current;
  const contentEntryTranslateY = useRef(new Animated.Value(30)).current;
  const hasPlayedEntryAnimation = useRef(false);
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const entryAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const isSavingRef = useRef(false);
  const isMountedRef = useRef(true);
  const saveAbortRef = useRef<AbortController | null>(null);

  // Use shared profile image upload hook
  const {
    profileImage,
    isUploadingImage,
    showCropper,
    selectedImageUri,
    setProfileImage,
    pickImageFromLibrary,
    openCamera,
    handleCropComplete,
    handleCropCancel,
    handleEditImage,
  } = useProfileImageUpload({
    userId: session?.user?.id,
    onUploadSuccess: (imageUrl) => {
      // Update form data with new image URL
      updateField('profilePicture', imageUrl);
    },
  });

  // Helper function to safely parse date of birth with edge case handling
  const parseDateOfBirth = (dob: string | null): string => {
    if (!dob) return '';
    try {
      const date = new Date(dob);
      if (isNaN(date.getTime())) return '';
      return dob.split('T')[0];
    } catch {
      return '';
    }
  };

  // Fetch current profile data with AbortController for cleanup
  useEffect(() => {
    // Cancel any existing request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const fetchProfileData = async () => {
      if (!session?.user?.id) {
        setIsDataLoading(false);
        return;
      }

      try {
        const backendUrl = getBackendBaseURL();
        const response = await authClient.$fetch(`${backendUrl}/api/player/profile/me`, {
          method: 'GET',
          signal,
        }) as ProfileApiResponse;

        // Check if request was aborted
        if (signal.aborted) return;

        if (response && response.data && response.data.data) {
          const profileData = response.data.data;
          const loadedData: FormData = {
            fullName: profileData.name || '',
            username: profileData.username || '',
            email: profileData.email || '',
            phoneNumber: profileData.phoneNumber || '',
            location: profileData.area || '',
            bio: profileData.bio || '',
            profilePicture: profileData.image || '',
            dateOfBirth: parseDateOfBirth(profileData.dateOfBirth),
          };
          setFormData(loadedData);
          // Store original data to detect changes later
          setOriginalData(loadedData);
          // Also set the profile image in the shared hook for edit functionality
          if (profileData.image) {
            setProfileImage(profileData.image);
          }
        }
      } catch (error: any) {
        // Ignore abort errors
        if (error?.name === 'AbortError') return;
        console.error('Error fetching profile data:', error);
        toast.error('Error', {
          description: 'Failed to load profile data. Please try again.',
        });
      } finally {
        if (!signal.aborted) {
          setIsDataLoading(false);

          // Trigger entry animation after data loads
          if (!hasPlayedEntryAnimation.current) {
            hasPlayedEntryAnimation.current = true;
            const animation = Animated.stagger(80, [
              Animated.parallel([
                Animated.spring(headerEntryOpacity, {
                  toValue: 1,
                  tension: 50,
                  friction: 8,
                  useNativeDriver: true,
                }),
                Animated.spring(headerEntryTranslateY, {
                  toValue: 0,
                  tension: 50,
                  friction: 8,
                  useNativeDriver: true,
                }),
              ]),
              Animated.parallel([
                Animated.spring(contentEntryOpacity, {
                  toValue: 1,
                  tension: 50,
                  friction: 8,
                  useNativeDriver: true,
                }),
                Animated.spring(contentEntryTranslateY, {
                  toValue: 0,
                  tension: 50,
                  friction: 8,
                  useNativeDriver: true,
                }),
              ]),
            ]);
            entryAnimationRef.current = animation;
            animation.start();
          }
        }
      }
    };

    fetchProfileData();

    // Cleanup: abort request and stop animation on unmount
    return () => {
      abortControllerRef.current?.abort();
      entryAnimationRef.current?.stop();
    };
  }, [session?.user?.id, setProfileImage, headerEntryOpacity, headerEntryTranslateY, contentEntryOpacity, contentEntryTranslateY]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  // Track mounted state for async callbacks
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      saveAbortRef.current?.abort();
    };
  }, []);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Show action sheet for choosing camera or library
  const handleImagePicker = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            openCamera();
          } else if (buttonIndex === 2) {
            pickImageFromLibrary();
          }
        }
      );
    } else {
      // Android: Use Alert
      Alert.alert(
        'Profile Picture',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: () => openCamera() },
          { text: 'Choose from Library', onPress: () => pickImageFromLibrary() },
        ],
        { cancelable: true }
      );
    }
  };

  const handleSave = async () => {
    // Prevent double-submit with synchronous ref check
    if (isSavingRef.current || isLoading) return;
    isSavingRef.current = true;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!session?.user?.id) {
      toast.error('Error', {
        description: 'You must be logged in to update your profile',
      });
      return;
    }

    // Basic validation
    if (!formData.fullName.trim() || !formData.username.trim() || !formData.email.trim()) {
      toast.error('Error', {
        description: 'Please fill in all required fields (Name, Username, Email)',
      });
      return;
    }

    // Username format validation
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(formData.username.trim())) {
      toast.error('Validation Error', {
        description: 'Username can only contain letters, numbers, and underscores',
      });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast.error('Validation Error', {
        description: 'Please enter a valid email address',
      });
      return;
    }

    // Phone number format validation (if provided)
    if (formData.phoneNumber.trim()) {
      const phoneRegex = /^\+?[0-9\s\-()]+$/;
      if (!phoneRegex.test(formData.phoneNumber.trim())) {
        toast.error('Validation Error', {
          description: 'Please enter a valid phone number',
        });
        return;
      }
    }

    // Check if any data has been changed
    if (originalData) {
      const hasChanges =
        formData.fullName.trim() !== originalData.fullName ||
        formData.username.trim() !== originalData.username ||
        formData.email.trim() !== originalData.email ||
        formData.phoneNumber.trim() !== originalData.phoneNumber ||
        formData.location.trim() !== originalData.location ||
        formData.bio.trim() !== originalData.bio ||
        formData.profilePicture !== originalData.profilePicture;

      if (!hasChanges) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        toast.warning('No Changes', {
          description: 'No data has been modified. Make some changes before saving.',
        });
        return;
      }
    }

    setIsLoading(true);

    // Create abort controller for this save request
    saveAbortRef.current = new AbortController();

    try {
      const backendUrl = getBackendBaseURL();
      const response = await authClient.$fetch(`${backendUrl}/api/player/profile/me`, {
        method: 'PUT',
        body: JSON.stringify({
          name: formData.fullName.trim(),
          username: formData.username.trim(),
          email: formData.email.trim(),
          location: formData.location.trim(),
          image: formData.profilePicture || null,
          phoneNumber: formData.phoneNumber.trim() || null,
          bio: formData.bio.trim(),
          dateOfBirth: formData.dateOfBirth || null,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        signal: saveAbortRef.current.signal,
      }) as { data?: ProfileUpdateResponse } | ProfileUpdateResponse;

      // authClient.$fetch wraps the response: { data: { success, data, message } }
      const apiResponse = response?.data || response;

      if (apiResponse && apiResponse.success && apiResponse.data) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        toast.success('Profile Updated', {
          description: 'Your profile has been successfully updated.',
        });

        // Navigate back after a short delay to let user see the toast
        navigationTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            router.back();
          }
        }, 1500);
      } else {
        // Check if it's a successful HTTP response but with success: false
        const errorMessage = (apiResponse?.message || 'Failed to update profile') as string;
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      // Ignore abort errors (user navigated away)
      if (error?.name === 'AbortError') {
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('Error updating profile:', error);

      // Revert profile picture to original if save failed
      // This prevents UI showing an image that isn't actually saved
      if (originalData && formData.profilePicture !== originalData.profilePicture) {
        updateField('profilePicture', originalData.profilePicture);
        setProfileImage(originalData.profilePicture || null);
        toast.warning('Image Reverted', {
          description: 'Your new profile picture was not saved. Please try again.',
        });
      }

      const errorMessage = (error instanceof Error ? error.message : 'Failed to update profile. Please try again.');
      toast.error('Error', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
      isSavingRef.current = false;
    }
  };

  // Field-specific max lengths
  const fieldMaxLengths: Record<keyof FormData, number> = {
    fullName: 100,
    username: 30,
    email: 254,
    phoneNumber: 20,
    location: 100,
    bio: 500,
    profilePicture: 2000,
    dateOfBirth: 10,
  };

  const renderInput = (
    label: string,
    field: keyof FormData,
    placeholder: string,
    _multiline: boolean = false,
    keyboardType: 'default' | 'email-address' | 'phone-pad' = 'default',
    disabled: boolean = false
  ) => (
    <View style={styles.inputContent}>
      <Text style={[styles.inputLabel, disabled && styles.inputLabelDisabled]}>{label}</Text>
      <TextInput
        style={[styles.input, disabled && styles.inputDisabled]}
        value={formData[field]}
        onChangeText={(text) => updateField(field, text)}
        placeholder={placeholder}
        placeholderTextColor={disabled ? theme.colors.neutral.gray[300] : theme.colors.neutral.gray[400]}
        keyboardType={keyboardType}
        autoCapitalize={field === 'email' ? 'none' : 'words'}
        autoCorrect={field !== 'email' && field !== 'username'}
        editable={!disabled}
        maxLength={fieldMaxLengths[field]}
        accessible={true}
        accessibilityLabel={`${label} input field`}
        accessibilityHint={disabled ? 'This field cannot be edited' : `Enter your ${label.toLowerCase()}`}
      />
    </View>
  );

  // Show loading screen while fetching data
  if (isDataLoading) {
    return (
      <View style={styles.container}>
        <BackgroundGradient />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackgroundGradient />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View
          style={{
            opacity: headerEntryOpacity,
            transform: [{ translateY: headerEntryTranslateY }],
          }}
        >
          <View style={styles.header}>
          <Pressable
            style={styles.headerButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            accessible={true}
            accessibilityLabel="Cancel"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>

          <Text style={styles.headerTitle}>Edit Profile</Text>

          <Pressable
            style={[styles.headerButton, isLoading && styles.headerButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
            accessible={true}
            accessibilityLabel="Save changes"
            accessibilityRole="button"
          >
            {isLoading ? (
              <Text style={[styles.headerButtonText, styles.headerButtonTextDisabled]}>
                Saving...
              </Text>
            ) : (
              <Text style={styles.headerButtonText}>Save</Text>
            )}
          </Pressable>
          </View>
        </Animated.View>

        <Animated.View
          style={{
            flex: 1,
            opacity: contentEntryOpacity,
            transform: [{ translateY: contentEntryTranslateY }],
          }}
        >
          <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Profile Picture Section - Following profile.tsx style */}
            <View style={styles.profileSection}>
              <View style={styles.profileImageContainer}>
                <View style={styles.profileImageWrapper}>
                  {isUploadingImage ? (
                    <View style={styles.uploadingImageContainer}>
                      <ActivityIndicator size="large" color={theme.colors.primary} />
                    </View>
                  ) : formData.profilePicture ? (
                    <Image
                      source={{ uri: formData.profilePicture, cache: 'reload' }}
                      style={styles.profileImage}
                    />
                  ) : (
                    <View style={styles.defaultProfileImage}>
                      <Svg width="60" height="60" viewBox="0 0 24 24">
                        <Path
                          fill="#FFFFFF"
                          fillRule="evenodd"
                          d="M8 7a4 4 0 1 1 8 0a4 4 0 0 1-8 0m0 6a5 5 0 0 0-5 5a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3a5 5 0 0 0-5-5z"
                          clipRule="evenodd"
                        />
                      </Svg>
                    </View>
                  )}
                </View>
                <Pressable
                  style={[styles.editImageButton, isUploadingImage && styles.editImageButtonDisabled]}
                  onPress={handleImagePicker}
                  disabled={isUploadingImage}
                  accessible={true}
                  accessibilityLabel="Change profile picture"
                  accessibilityRole="button"
                >
                  <Ionicons name="camera" size={18} color={theme.colors.neutral.white} />
                </Pressable>
              </View>

              {/* Name section like profile */}
              <View style={styles.nameSection}>
                <Text style={styles.profileName}>{formData.fullName}</Text>
                <Text style={styles.profileUsername}>@{formData.username}</Text>
              </View>
            </View>

            {/* Form Fields - Unified card design */}
            <View style={styles.formSection}>
              <Text style={styles.mainSectionTitle}>Edit Information</Text>

              <View style={styles.inputCard}>
                {renderInput('Full Name', 'fullName', 'Enter your full name', false, 'default', isLoading)}
              </View>

              <View style={styles.inputCard}>
                {renderInput('Username', 'username', 'Enter your username', false, 'default', isLoading)}
              </View>

              <View style={styles.inputCard}>
                {renderInput('Email', 'email', 'Enter your email address', false, 'email-address', isLoading)}
              </View>

              <View style={styles.inputCard}>
                {renderInput('Phone Number', 'phoneNumber', 'Enter your phone number', false, 'phone-pad', isLoading)}
              </View>

              <View style={styles.inputCard}>
                {renderInput('Location', 'location', 'Enter your location', false, 'default', isLoading)}
              </View>

              <View style={styles.inputCard}>
                {renderInput('Birthday', 'dateOfBirth', 'Birthday cannot be changed', false, 'default', true)}
              </View>

              <View style={styles.bioCard}>
                <Text style={styles.bioLabel}>Bio</Text>
                <TextInput
                  style={styles.bioInput}
                  value={formData.bio}
                  onChangeText={(text) => updateField('bio', text)}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor={theme.colors.neutral.gray[400]}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  editable={!isLoading}
                  maxLength={500}
                />
                <Text style={styles.charCounter}>{formData.bio.length}/500</Text>
              </View>

            </View>
          </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </SafeAreaView>

      {/* Circular Image Cropper Modal */}
      {selectedImageUri && (
        <CircularImageCropper
          visible={showCropper}
          imageUri={selectedImageUri}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%', // Match profile page
    zIndex: 0,
  } as ViewStyle,
  safeArea: {
    flex: 1,
    zIndex: 1,
  } as ViewStyle,
  keyboardAvoid: {
    flex: 1,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: 'transparent',
  } as ViewStyle,
  headerButton: {
    minWidth: 60,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  headerButtonDisabled: {
    opacity: 0.5,
  } as ViewStyle,
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.heavy as any,
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.primary,
  } as TextStyle,
  headerButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.primary,
  } as TextStyle,
  headerButtonTextDisabled: {
    opacity: 0.7,
  } as TextStyle,
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  } as ViewStyle,
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  } as ViewStyle,
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    backgroundColor: 'transparent',
  } as ViewStyle,
  nameSection: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  } as ViewStyle,
  profileName: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.heavy as any,
    color: theme.colors.neutral.gray[700],
    marginBottom: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily.primary,
    textAlign: 'center',
  } as TextStyle,
  profileUsername: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.neutral.gray[600],
    fontFamily: theme.typography.fontFamily.primary,
    textAlign: 'center',
  } as TextStyle,
  profileImageContainer: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  } as ViewStyle,
  profileImageWrapper: {
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.neutral.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  } as ViewStyle,
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: theme.colors.neutral.white,
  } as ImageStyle,
  defaultProfileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: theme.colors.neutral.white,
    backgroundColor: '#e7e7e7',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.neutral.white,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.neutral.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  } as ViewStyle,
  editImageButtonDisabled: {
    opacity: 0.5,
  } as ViewStyle,
  uploadingImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: theme.colors.neutral.white,
    backgroundColor: 'rgba(235, 235, 235, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  formSection: {
    paddingHorizontal: theme.spacing.lg,
  } as ViewStyle,
  mainSectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.heavy as any,
    color: theme.colors.neutral.gray[700],
    marginBottom: theme.spacing.lg,
    fontFamily: theme.typography.fontFamily.primary,
  } as TextStyle,
  inputCard: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.neutral.gray[100],
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.neutral.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  } as ViewStyle,
  inputContent: {
    // Content wrapper for each input
  } as ViewStyle,
  inputLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.neutral.gray[500],
    fontFamily: theme.typography.fontFamily.primary,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as TextStyle,
  input: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.primary,
    color: theme.colors.neutral.gray[700],
    fontWeight: theme.typography.fontWeight.semibold as any,
    padding: 0,
  } as TextStyle,
  inputDisabled: {
    color: theme.colors.neutral.gray[400],
    fontWeight: theme.typography.fontWeight.regular as any,
  } as TextStyle,
  inputLabelDisabled: {
    color: theme.colors.neutral.gray[400],
  } as TextStyle,
  bioCard: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.neutral.gray[100],
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.neutral.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  } as ViewStyle,
  bioLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.neutral.gray[500],
    fontFamily: theme.typography.fontFamily.primary,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as TextStyle,
  bioInput: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.neutral.gray[600],
    textAlign: 'left',
    lineHeight: theme.typography.lineHeight.relaxed,
    fontFamily: theme.typography.fontFamily.primary,
    fontStyle: 'italic',
    minHeight: 60,
  } as TextStyle,
  charCounter: {
    fontSize: 12,
    color: theme.colors.neutral.gray[400],
    textAlign: 'right',
    marginTop: 4,
    fontFamily: theme.typography.fontFamily.primary,
  } as TextStyle,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  } as ViewStyle,
  loadingText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.neutral.white,
    fontFamily: theme.typography.fontFamily.primary,
    marginTop: theme.spacing.md,
  } as TextStyle,
});
