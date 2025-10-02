import React, { useState } from 'react';
import { useRouter } from 'expo-router';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Svg, Path, G, Circle, Rect, Defs, ClipPath } from 'react-native-svg';
import { BackgroundGradient } from '../components';
import { toast } from 'sonner-native';
import { useSession, authClient } from '@/lib/auth-client';
import { getBackendBaseURL } from '@/config/network';
import { questionnaireAPI } from '../services/api';
import * as Haptics from 'expo-haptics';

const DefaultProfileIcon = () => (
  <Svg width="296" height="296" viewBox="0 0 296 296" fill="none">
    <G clipPath="url(#clip0_1283_2316)">
      <Rect width="311" height="311" fill="#EBEBEB" fillOpacity="0.32" />
      <Circle cx="145" cy="148" r="138" fill="#EBEBEB" />
      <Path
        d="M145 155.083C161.972 155.083 177.406 159.999 188.761 166.926C194.427 170.383 199.273 174.463 202.772 178.897C206.214 183.254 208.75 188.467 208.75 194.041C208.75 200.027 205.839 204.744 201.645 208.109C197.679 211.296 192.444 213.407 186.884 214.881C175.706 217.834 160.789 218.833 145 218.833C129.211 218.833 114.294 217.841 103.116 214.881C97.5558 213.407 92.3212 211.296 88.3546 208.109C84.1542 204.737 81.25 200.027 81.25 194.041C81.25 188.467 83.7858 183.254 87.2283 178.89C90.7275 174.463 95.5654 170.39 101.239 166.919C112.594 160.006 128.035 155.083 145 155.083ZM145 77.1665C154.393 77.1665 163.401 80.8979 170.043 87.5398C176.685 94.1817 180.417 103.19 180.417 112.583C180.417 121.976 176.685 130.985 170.043 137.627C163.401 144.268 154.393 148 145 148C135.607 148 126.599 144.268 119.957 137.627C113.315 130.985 109.583 121.976 109.583 112.583C109.583 103.19 113.315 94.1817 119.957 87.5398C126.599 80.8979 135.607 77.1665 145 77.1665Z"
        fill="#555555"
      />
    </G>
    <Defs>
      <ClipPath id="clip0_1283_2316">
        <Rect width="296" height="296" fill="white" />
      </ClipPath>
    </Defs>
  </Svg>
);

const ProfilePictureScreen = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  // Image upload functions
  const uploadProfileImage = async (imageUri: string, retryCount = 0) => {
    const MAX_RETRIES = 2;

    try {
      setIsUploadingImage(true);

      const backendUrl = getBackendBaseURL();
      const formData = new FormData();

      // Create file object for upload
      const file = {
        uri: imageUri,
        type: 'image/jpeg',
        name: `profile-${Date.now()}.jpg`,
      } as any;

      formData.append('image', file);

      console.log('Uploading profile image:', imageUri);
      console.log('Backend URL:', backendUrl);
      console.log('Attempt:', retryCount + 1);

      const response = await authClient.$fetch(`${backendUrl}/api/player/profile/upload-image`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let the browser set it with proper boundary
      });

      console.log('Upload response:', response);

      // Handle different possible response structures
      let imageUrl = null;

      if (response && (response as any).data) {
        const responseData = (response as any).data;
        // Try different possible paths for the image URL
        // Check nested data.data.imageUrl first (current backend structure)
        imageUrl = responseData.data?.imageUrl || responseData.imageUrl || responseData.image || responseData.url || responseData.data?.image;
      }

      if (imageUrl) {
        console.log('Image URL received:', imageUrl);

        // Update local state with new image URL
        setProfileImage(imageUrl);

        toast.success('Success', {
          description: 'Profile picture updated successfully!',
        });
      } else {
        console.error('No image URL found in response:', response);
        toast.error('Error', {
          description: 'Upload successful but no image URL received.',
        });
      }
    } catch (error) {
      console.error('Error uploading profile image:', error);

      // Retry logic for network errors
      if (retryCount < MAX_RETRIES && error instanceof Error && error.message.includes('Network request failed')) {
        console.log(`Retrying upload (attempt ${retryCount + 2} of ${MAX_RETRIES + 1})...`);
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        setIsUploadingImage(false);
        return uploadProfileImage(imageUri, retryCount + 1);
      }

      toast.error('Error', {
        description: 'Failed to upload profile picture. Please try again.',
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const pickImageFromLibrary = async () => {
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

      await openImageLibrary();
    } catch (error) {
      console.error('Error picking image:', error);
      toast.error('Error', {
        description: 'Failed to open image picker. Please try again.',
      });
    }
  };

  const openCamera = async () => {
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
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      toast.error('Error', {
        description: 'Failed to open camera. Please try again.',
      });
    }
  };

  const openImageLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error opening image library:', error);
      toast.error('Error', {
        description: 'Failed to open photo library. Please try again.',
      });
    }
  };

  const handleComplete = async () => {
    try {
      // Mark onboarding as completed
      if (session?.user?.id) {
        console.log('ProfilePictureScreen: Calling completeOnboarding API...');
        const result = await questionnaireAPI.completeOnboarding(session.user.id);
        console.log('ProfilePictureScreen: Onboarding completion result:', result);
        console.log('ProfilePictureScreen: Onboarding marked as completed');
        
        // Wait longer for the backend to process the completion and database to update
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log('ProfilePictureScreen: Waited for backend processing');
      }
      
      // Save profile data and navigate to main app
      toast.success('Success!', {
        description: 'Onboarding completed! Welcome to DeuceLeague!',
      });
      
      console.log('ProfilePictureScreen: Navigating to dashboard...');
      
      // Force clear any cached navigation state and navigate
      router.replace('/user-dashboard');
    } catch (error) {
      console.error('ProfilePictureScreen: Error completing onboarding:', error);
      // Still navigate even if completion fails
      console.log('ProfilePictureScreen: Navigating to dashboard despite error...');
      router.push('/user-dashboard');
    }
  };

  const handleSkip = async () => {
    try {
      // Mark onboarding as completed
      if (session?.user?.id) {
        console.log('ProfilePictureScreen: Calling completeOnboarding API (skip)...');
        const result = await questionnaireAPI.completeOnboarding(session.user.id);
        console.log('ProfilePictureScreen: Onboarding completion result (skip):', result);
        console.log('ProfilePictureScreen: Onboarding marked as completed (skip)');
        
        // Wait longer for the backend to process the completion and database to update
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log('ProfilePictureScreen: Waited for backend processing (skip)');
      }
      
      // Skip photo and navigate to main app
      toast.success('Success!', {
        description: 'Onboarding completed! Welcome to DeuceLeague!',
      });
      
      console.log('ProfilePictureScreen: Navigating to dashboard (skip)...');
      
      // Force clear any cached navigation state and navigate
      router.replace('/user-dashboard');
    } catch (error) {
      console.error('ProfilePictureScreen: Error completing onboarding (skip):', error);
      // Still navigate even if completion fails
      console.log('ProfilePictureScreen: Navigating to dashboard despite error (skip)...');
      router.push('/user-dashboard');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <BackgroundGradient />

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <Path
            d="M22.5 27L13.5 18L22.5 9"
            stroke="#000000"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>

      {/* Logo */}
      <View style={styles.logoContainer}>
        <Svg width="35" height="37" viewBox="0 0 67 71" fill="none">
          <Defs>
            <ClipPath id="clip0_1273_1964_profile">
              <Rect width="67" height="71" fill="white"/>
            </ClipPath>
          </Defs>
          <G clipPath="url(#clip0_1273_1964_profile)">
            <Path d="M66.9952 35.2153C66.9769 35.9135 66.9083 36.6208 66.7848 37.3281C64.9275 48.0714 50.9017 59.5725 19.7851 70.9404C18.9983 71.2252 18.2846 70.5086 18.4676 69.6911C23.399 47.3457 22.7586 14.6934 18.1382 1.29534C17.8729 0.537481 18.646 -0.19282 19.4145 0.0506138C47.9694 9.11738 67.3521 21.482 66.9952 35.2153Z" fill="#44A7DE"/>
            <Path d="M20.6226 35.2153V37.3282H21.1303V35.2153H20.6226Z" stroke="#ED2124" strokeMiterlimit="10"/>
            <Path d="M22.3879 8.15321C21.6972 7.8271 20.9973 7.50558 20.2836 7.18866C14.5973 4.6303 8.22489 2.24649 1.31263 0.0509927C0.548666 -0.192441 -0.1787 0.519488 0.0363074 1.29572C6.46823 24.6929 7.2139 47.4425 0.365681 69.6914C0.118651 70.4906 0.900912 71.2255 1.68317 70.9408C8.74182 68.3595 14.9267 65.7735 20.2836 63.1876C21.0018 62.8477 21.7017 62.4987 22.3879 62.1542C39.2088 53.7029 47.3059 45.3067 48.6875 37.3285C48.811 36.6212 48.8796 35.9138 48.8979 35.2157C49.1587 25.2211 38.9664 15.9523 22.3879 8.15321ZM22.3879 46.8408C21.9808 47.0108 21.5599 47.1761 21.1299 47.3461V37.3285H20.6221V35.2157H21.1299V24.8812C21.5599 25.0879 21.9762 25.2946 22.3879 25.5013C28.7878 28.7119 33.0377 31.9454 34.0349 35.2157C34.25 35.9184 34.3186 36.6212 34.2179 37.3285C33.7879 40.461 30.1694 43.6348 22.3879 46.8408Z" fill="#195E9A"/>
            <Path d="M34.0349 35.2148C34.2499 35.9176 34.3185 36.6203 34.2179 37.3277H20.6221V35.2148H34.0349Z" fill="white"/>
            <Path d="M66.9952 35.2148C66.9769 35.913 66.9082 36.6203 66.7847 37.3277H48.6875C48.811 36.6203 48.8796 35.913 48.8979 35.2148H66.9952Z" fill="white"/>
            <Path d="M22.388 8.15254V62.1535C21.7018 62.498 21.0019 62.8471 20.2837 63.187V7.18799C20.9973 7.50491 21.6973 7.82643 22.388 8.15254Z" fill="white"/>
          </G>
        </Svg>
      </View>

      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>One final step...</Text>
        <Text style={styles.subtitle}>Don&apos;t be shy!</Text>
        <Text style={styles.description}>
          Upload or take a profile picture to help other players recognise and connect with you.
        </Text>
      </View>

      {/* Profile Image Container */}
      <View style={styles.imageOuterContainer}>
        <View style={styles.imageContainer}>
          {isUploadingImage ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color="#FE9F4D" />
            </View>
          ) : profileImage ? (
            <Image
              source={{ uri: profileImage }}
              style={styles.profileImage}
              onError={() => {
                console.log('Profile image failed to load:', profileImage);
              }}
            />
          ) : (
            <DefaultProfileIcon />
          )}
        </View>
      </View>

      {/* Upload Photo Button */}
      <TouchableOpacity
        style={[styles.uploadButton, isUploadingImage && styles.uploadButtonDisabled]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          pickImageFromLibrary();
        }}
        disabled={isUploadingImage}
      >
        <Text style={styles.uploadButtonText}>Upload a photo</Text>
      </TouchableOpacity>

      {/* Take Photo Button */}
      <TouchableOpacity
        style={[styles.takePhotoButton, isUploadingImage && styles.uploadButtonDisabled]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          openCamera();
        }}
        disabled={isUploadingImage}
      >
        <Text style={styles.takePhotoButtonText}>Take a photo</Text>
      </TouchableOpacity>

      {/* Skip for now */}
      <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>

      {/* All set? text with yes icon */}
      <View style={styles.allSetContainer}>
        <TouchableOpacity onPress={handleComplete} style={styles.allSetButton}>
          <Text style={styles.allSetText}>All set?</Text>
        </TouchableOpacity>
        <Image
          source={require('../../../../assets/images/yes.png')}
          style={styles.yesIcon}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 62,
    left: 19,
    width: 36,
    height: 36,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    fontSize: 24,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#FE9F4D',
  },
  headerContainer: {
    paddingHorizontal: 37,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 40,
    marginBottom: 0,
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FEA04D',
    lineHeight: 34,
    letterSpacing: -0.01,
    fontFamily: 'Inter',
    marginBottom: 3,
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    color: '#BABABA',
    lineHeight: 20,
    letterSpacing: -0.01,
    fontFamily: 'Inter',
  },
  imageOuterContainer: {
    width: 296,
    height: 296,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  imageContainer: {
    width: 276,
    height: 276,
    borderRadius: 138,
    backgroundColor: '#EBEBEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 276,
    height: 276,
    borderRadius: 138,
  },
  uploadingContainer: {
    width: 276,
    height: 276,
    borderRadius: 138,
    backgroundColor: 'rgba(235, 235, 235, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    height: 40,
    backgroundColor: '#FE9F4D',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 71,
    marginBottom: 8,
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 24,
    fontFamily: 'Inter',
  },
  takePhotoButton: {
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FE9F4D',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 71,
    marginBottom: 16,
  },
  takePhotoButtonText: {
    color: '#FE9F4D',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 24,
    fontFamily: 'Inter',
  },
  skipButton: {
    marginBottom: 44,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FE8E2B',
    lineHeight: 24,
    fontFamily: 'Inter',
  },
  allSetContainer: {
    position: 'absolute',
    bottom: Dimensions.get('window').height * 0.02, // 2% from bottom for responsiveness
    right: Dimensions.get('window').width * 0.05, // 5% from right for responsiveness
    flexDirection: 'row',
    alignItems: 'center',
  },
  allSetButton: {
    marginRight: 8,
  },
  allSetText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#404040',
    lineHeight: 28,
    letterSpacing: -0.01,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  yesIcon: {
    width: 72,
    height: 72,
    transform: [{ rotate: '7.09deg' }],
  },
});

export default ProfilePictureScreen;