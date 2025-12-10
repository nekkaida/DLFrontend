import React from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { User } from '../types';

interface GroupAvatarStackProps {
  participants: User[];
  sportColor: string;
  size?: number;
}

// Generate a consistent color from a string (for fallback avatars)
const getColorFromString = (str: string): string => {
  const colors = [
    '#863A73', // Purple
    '#65B741', // Green
    '#3B82F6', // Blue
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#6366F1', // Indigo
    '#F97316', // Orange
  ];

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

const SingleAvatar: React.FC<{
  participant: User;
  size: number;
  sportColor: string;
  style?: any;
}> = ({ participant, size, sportColor, style }) => {
  const avatarUrl = participant.avatar || (participant as any)?.image;
  const initial = participant.name?.charAt(0)?.toUpperCase() || '?';
  const bgColor = avatarUrl ? undefined : getColorFromString(participant.id || participant.name || '');

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: '#FFFFFF',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: '100%', height: '100%' }}
        />
      ) : (
        <View
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: bgColor || sportColor,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: size * 0.4,
              fontWeight: '600',
            }}
          >
            {initial}
          </Text>
        </View>
      )}
    </View>
  );
};

export const GroupAvatarStack: React.FC<GroupAvatarStackProps> = ({
  participants,
  sportColor,
  size = 40,
}) => {
  const count = participants.length;
  const displayParticipants = participants.slice(0, 3);
  const remainingCount = count > 3 ? count - 3 : 0;

  // Size scaling based on CSS: Avatar 1 (32px), Avatar 2 (22px smallest), Avatar 3 (34px biggest)
  // Ratio from CSS: size1=32/34=0.94, size2=22/34=0.65, size3=34/34=1.0
  const size3 = size;              // Avatar 3: biggest (34px ratio, front, most visible)
  const size1 = size * 0.94;       // Avatar 1: medium (32px ratio)
  const size2 = size * 0.65;       // Avatar 2: smallest (22px ratio)
  const badgeSize = size * 0.7;    // Badge (24px ratio)

  if (count === 0) {
    return null;
  }

  // For solo and duo, use sizes matching the header (56px for groupAvatarCircle)
  const soloSize = 56; // Full size avatar matching groupAvatarCircle
  const duoAvatarSize = 42; // Size for each avatar in duo

  // Single participant - just show one avatar at full size (centered)
  if (count === 1) {
    return (
      <SingleAvatar
        participant={displayParticipants[0]}
        size={soloSize}
        sportColor={sportColor}
      />
    );
  }

  // Two participants - Venn diagram style (two overlapping circles)
  if (count === 2) {
    const overlap = duoAvatarSize * 0.35; // How much they overlap
    const containerWidth = duoAvatarSize * 2 - overlap;
    const containerHeight = duoAvatarSize;

    return (
      <View style={[styles.container, { width: containerWidth, height: containerHeight }]}>
        {/* Avatar 1 - left side, back layer */}
        <SingleAvatar
          participant={displayParticipants[0]}
          size={duoAvatarSize}
          sportColor={sportColor}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1,
          }}
        />
        {/* Avatar 2 - right side, front layer */}
        <SingleAvatar
          participant={displayParticipants[1]}
          size={duoAvatarSize}
          sportColor={sportColor}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            zIndex: 2,
          }}
        />
      </View>
    );
  }

  // Three or more participants
  // CSS positions (scaled from 52x67 container with base size 34):
  // Avatar 1: left:1, top:0 (32px) - top-left, back
  // Avatar 3: left:19, top:16 (34px) - middle-right, biggest, front
  // Avatar 2: left:3, top:27 (22px) - bottom-left, smallest, middle
  // Badge: left:14, top:43 (24px)

  // Scale factor: size / 34 (base size in CSS)
  const scale = size / 34;
  const containerWidth = 52 * scale;
  const containerHeight = 67 * scale;

  return (
    <View style={[styles.container, { width: containerWidth, height: containerHeight }]}>
      {/* Avatar 1 - medium, top-left, back layer (CSS: left:1, top:0, 32px) */}
      <SingleAvatar
        participant={displayParticipants[0]}
        size={size1}
        sportColor={sportColor}
        style={{
          position: 'absolute',
          top: 0,
          left: 1 * scale,
          zIndex: 1,
        }}
      />
      {/* Avatar 2 - smallest, bottom-left, middle layer (CSS: left:3, top:27, 22px) */}
      <SingleAvatar
        participant={displayParticipants[1]}
        size={size2}
        sportColor={sportColor}
        style={{
          position: 'absolute',
          top: 27 * scale,
          left: 3 * scale,
          zIndex: 2,
        }}
      />
      {/* Avatar 3 - biggest, middle-right, front layer (CSS: left:19, top:16, 34px) */}
      <SingleAvatar
        participant={displayParticipants[2]}
        size={size3}
        sportColor={sportColor}
        style={{
          position: 'absolute',
          top: 16 * scale,
          left: 19 * scale,
          zIndex: 3,
        }}
      />

      {/* Badge showing remaining count (CSS: left:14, top:43, 24px) */}
      {remainingCount > 0 && (
        <View
          style={[
            styles.badge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              top: 43 * scale,
              left: 14 * scale,
              zIndex: 4,
            },
          ]}
        >
          <Text style={[styles.badgeText, { fontSize: badgeSize * 0.42 }]}>
            {remainingCount}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  badgeText: {
    fontWeight: '700',
    color: '#374151',
  },
});
