import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';

// Championship color palette
const COLORS = {
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  avatarBackground: 'rgba(255,255,255,0.1)',
};

// Avatar gradient colors based on name hash
const AVATAR_GRADIENTS: readonly [string, string][] = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#a8edea', '#fed6e3'],
  ['#ff9a9e', '#fecfef'],
  ['#ffecd2', '#fcb69f'],
  ['#6366F1', '#8B5CF6'],
  ['#EC4899', '#F43F5E'],
];

interface PlayerAvatarProps {
  image?: string | null;
  name: string;
  size?: number;
  showBorder?: boolean;
  borderColor?: string;
  style?: ViewStyle;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  image,
  name,
  size = 28,
  showBorder = false,
  borderColor = '#FFFFFF',
  style,
}) => {
  const initial = name?.charAt(0)?.toUpperCase() || '?';
  const fontSize = size * 0.42;

  // Get consistent gradient based on name
  const getGradientColors = (): readonly [string, string] => {
    const hash = name.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
  };

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    overflow: 'hidden',
    ...(showBorder && {
      borderWidth: 2.5,
      borderColor,
    }),
    ...style,
  };

  if (image) {
    return (
      <View style={containerStyle}>
        <Image source={{ uri: image }} style={styles.image} />
      </View>
    );
  }

  const gradientColors = getGradientColors();

  return (
    <View style={containerStyle}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <Text style={[styles.initialText, { fontSize }]}>{initial}</Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
  gradientContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialText: {
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
});

export default PlayerAvatar;
