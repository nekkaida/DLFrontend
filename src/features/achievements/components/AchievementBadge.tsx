import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TIER_COLORS: Record<string, string> = {
  BRONZE: '#CD7F32',
  SILVER: '#C0C0C0',
  GOLD: '#FFD700',
  PLATINUM: '#FE9F4D',
};

const SIZE_MAP = {
  sm: 32,
  md: 48,
  lg: 80,
};

interface AchievementBadgeProps {
  icon: string;
  tier: string;
  size?: 'sm' | 'md' | 'lg';
  isLocked?: boolean;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  icon,
  tier,
  size = 'md',
  isLocked = false,
}) => {
  const dimension = SIZE_MAP[size];
  const borderWidth = size === 'lg' ? 3 : size === 'md' ? 2.5 : 2;
  const iconSize = Math.round(dimension * 0.45);
  const lockSize = Math.round(dimension * 0.3);
  const lockOffset = Math.round(dimension * -0.05);

  const borderColor = isLocked ? '#D1D5DB' : (TIER_COLORS[tier] || TIER_COLORS.BRONZE);
  const bgColor = isLocked ? '#E5E7EB' : '#1C1C1E';
  const iconColor = isLocked ? '#9CA3AF' : '#FFFFFF';

  return (
    <View style={[styles.container, { width: dimension, height: dimension }]}>
      <View
        style={[
          styles.circle,
          {
            width: dimension,
            height: dimension,
            borderRadius: dimension / 2,
            borderWidth,
            borderColor,
            backgroundColor: bgColor,
          },
        ]}
      >
        <Ionicons name={icon as any} size={iconSize} color={iconColor} />
      </View>
      {isLocked && (
        <View
          style={[
            styles.lockOverlay,
            {
              width: lockSize,
              height: lockSize,
              borderRadius: lockSize / 2,
              bottom: lockOffset,
              right: lockOffset,
            },
          ]}
        >
          <Ionicons
            name="lock-closed"
            size={Math.round(lockSize * 0.6)}
            color="#6B7280"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'visible',
  },
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockOverlay: {
    position: 'absolute',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
