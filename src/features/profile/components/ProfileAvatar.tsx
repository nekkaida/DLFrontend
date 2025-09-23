import React from 'react';
import { View, Pressable, Image } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { EditIcon } from './EditIcon';
import * as Haptics from 'expo-haptics';

interface ProfileAvatarProps {
  styles: any; // Preserving exact styles from parent
  profileImage?: string; // User's profile image URI
  onEditPress: () => void;
}

/**
 * ProfileAvatar - Extracted avatar component with edit icon
 *
 * CRITICAL: This component preserves the exact positioning from profile.tsx
 * The marginTop: -200 and edit icon positioning are maintained through styles
 */
// Default avatar SVG component
const DefaultAvatarIcon = () => (
  <Svg width="60" height="60" viewBox="0 0 24 24">
    <Path
      fill="#FFFFFF"
      fillRule="evenodd"
      d="M8 7a4 4 0 1 1 8 0a4 4 0 0 1-8 0m0 6a5 5 0 0 0-5 5a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3a5 5 0 0 0-5-5z"
      clipRule="evenodd"
    />
  </Svg>
);

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  styles,
  profileImage,
  onEditPress,
}) => {
  return (
    <View style={styles.avatarContainer}>
      <View style={styles.avatar}>
        {profileImage ? (
          <Image
            source={{ uri: profileImage }}
            style={styles.avatarImage}
            onError={() => {
              // If image fails to load, fallback will be handled by parent component
              console.warn('Failed to load profile image:', profileImage);
            }}
          />
        ) : (
          <DefaultAvatarIcon />
        )}
      </View>
      <Pressable
        style={styles.editIcon}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onEditPress();
        }}
        accessible={true}
        accessibilityLabel="Edit profile"
        accessibilityRole="button"
      >
        <EditIcon color="#6de9a0" />
      </Pressable>
    </View>
  );
};