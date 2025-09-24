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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Svg, Path } from 'react-native-svg';
import { BackgroundGradient } from '../components';
import { toast } from 'sonner-native';
import { useSession, authClient } from '@/lib/auth-client';
import { getBackendBaseURL } from '@/config/network';
import { questionnaireAPI } from '../services/api';
import * as Haptics from 'expo-haptics';

const DefaultProfileIcon = () => (
  <Svg width="167" height="167" viewBox="0 0 167 167" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M83.5208 0.108276C37.4958 0.108276 0.1875 37.4166 0.1875 83.4416C0.1875 129.467 37.4958 166.775 83.5208 166.775C129.546 166.775 166.854 129.467 166.854 83.4416C166.854 37.4166 129.546 0.108276 83.5208 0.108276ZM54.3542 62.6083C54.3542 58.7781 55.1086 54.9853 56.5743 51.4467C58.0401 47.908 60.1885 44.6927 62.8969 41.9843C65.6053 39.2759 68.8206 37.1276 72.3592 35.6618C75.8979 34.196 79.6906 33.4416 83.5208 33.4416C87.351 33.4416 91.1438 34.196 94.6824 35.6618C98.2211 37.1276 101.436 39.2759 104.145 41.9843C106.853 44.6927 109.002 47.908 110.467 51.4467C111.933 54.9853 112.687 58.7781 112.687 62.6083C112.687 70.3438 109.615 77.7624 104.145 83.2322C98.675 88.702 91.2563 91.7749 83.5208 91.7749C75.7853 91.7749 68.3667 88.702 62.8969 83.2322C57.4271 77.7624 54.3542 70.3438 54.3542 62.6083ZM135.671 124.975C129.431 132.82 121.5 139.154 112.47 143.506C103.44 147.858 93.5446 150.115 83.5208 150.108C73.4971 150.115 63.6012 147.858 54.5714 143.506C45.5416 139.154 37.6109 132.82 31.3708 124.975C44.8792 115.283 63.3125 108.442 83.5208 108.442C103.729 108.442 122.162 115.283 135.671 124.975Z"
      fill="#6C7278"
    />
  </Svg>
);

const ProfilePictureScreen = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  // Image upload functions
  const uploadProfileImage = async (imageUri: string) => {
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
      
      const response = await authClient.$fetch(`${backendUrl}/api/player/profile/upload-image`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Upload response:', response);
      
      // Handle different possible response structures
      let imageUrl = null;
      
      if (response && (response as any).data) {
        const responseData = (response as any).data;
        // Try different possible paths for the image URL
        imageUrl = responseData.imageUrl || responseData.image || responseData.url || responseData.data?.imageUrl || responseData.data?.image;
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
      toast.error('Error', {
        description: 'Failed to upload profile picture. Please try again.',
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const pickImage = async () => {
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

      // Show action sheet
      Alert.alert(
        'Select Profile Picture',
        'Choose how you want to select your profile picture',
        [
          {
            text: 'Camera',
            onPress: () => openCamera(),
          },
          {
            text: 'Photo Library',
            onPress: () => openImageLibrary(),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>DEUCE</Text>
      </View>

      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>One final step...</Text>
        <Text style={styles.subtitle}>
          Don&apos;t be shy!
        </Text>
        <Text style={styles.description}>
          We recommend uploading a picture of you so other players can see you.
        </Text>
      </View>

      {/* Profile Image */}
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

      {/* Upload/Change Button */}
      <TouchableOpacity 
        style={[styles.uploadButton, isUploadingImage && styles.uploadButtonDisabled]} 
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          pickImage();
        }}
        disabled={isUploadingImage}
      >
        <Text style={styles.uploadButtonText}>
          {isUploadingImage ? 'Uploading...' : (profileImage ? 'Change' : 'Upload')}
        </Text>
      </TouchableOpacity>

      {/* League Now Button */}
      <TouchableOpacity style={styles.button} onPress={handleComplete}>
        <Text style={styles.buttonText}>League Now!</Text>
      </TouchableOpacity>

      {/* Skip Link */}
      <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 40,
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C7278',
    lineHeight: 20,
    letterSpacing: -0.01,
    fontFamily: 'Inter',
    textAlign: 'left',
    marginBottom: 20,
  },
  description: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6C7278',
    lineHeight: 20,
    letterSpacing: -0.01,
    fontFamily: 'Inter',
    textAlign: 'left',
  },
  imageContainer: {
    width: 167,
    height: 167,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 167,
    height: 167,
    borderRadius: 83.5,
  },
  uploadingContainer: {
    width: 167,
    height: 167,
    borderRadius: 83.5,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    height: 40,
    backgroundColor: '#6E6E6E',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
    marginTop: 10,
    marginBottom: 30,
    minWidth: 258,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 24,
  },
  button: {
    position: 'absolute',
    bottom: 100,
    left: 71,
    right: 71,
    height: 40,
    backgroundColor: '#FE9F4D',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 24,
  },
  skipButton: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6C7278',
    textDecorationLine: 'underline',
    lineHeight: 20,
    letterSpacing: -0.01,
  },
});

export default ProfilePictureScreen;