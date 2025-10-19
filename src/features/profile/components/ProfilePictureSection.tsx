import React from 'react';
import { View, Pressable, StyleSheet, Image, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '@core/theme/theme';

interface ProfilePictureSectionProps {
  imageUri: string | null | undefined;
  isUploading?: boolean;
  onPickImage?: () => void;
  isEditable?: boolean;
}

export const ProfilePictureSection: React.FC<ProfilePictureSectionProps> = ({
  imageUri,
  isUploading = false,
  onPickImage,
  isEditable = true,
}) => {
  return (
    <View style={styles.profileSection}>
      <View style={styles.profileImageContainer}>
        <View style={styles.profileImageWrapper}>
          {isUploading ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color="#6de9a0" />
            </View>
          ) : imageUri ? (
            <Image
              key={imageUri} // Force re-render when image URL changes
              source={{ uri: imageUri }}
              style={styles.profileImage}
              onError={() => {
                console.log('Profile image failed to load:', imageUri);
              }}
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
        {isEditable && onPickImage && (
          <Pressable
            style={styles.editImageButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onPickImage();
            }}
            accessible={true}
            accessibilityLabel="Change profile picture"
            accessibilityRole="button"
            disabled={isUploading}
          >
            <Ionicons name="camera" size={18} color={theme.colors.neutral.white} />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  profileSection: {
    alignItems: 'center',
    marginTop: -60,
    marginBottom: 16,
    zIndex: 2,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#6de9a0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  uploadingContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 60,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  defaultProfileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    backgroundColor: '#6de9a0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6de9a0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});
