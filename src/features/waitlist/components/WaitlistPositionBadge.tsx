import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';

// Sport-specific color configurations
const SPORT_COLORS = {
  pickleball: {
    primary: '#A04DFE',
    secondary: '#7B2FD4',
    glow: 'rgba(160, 77, 254, 0.5)',
    gradient: ['#A04DFE', '#7B2FD4'] as const,
    ring: 'rgba(160, 77, 254, 0.3)',
  },
  tennis: {
    primary: '#7CB342',
    secondary: '#558B2F',
    glow: 'rgba(124, 179, 66, 0.5)',
    gradient: ['#7CB342', '#558B2F'] as const,
    ring: 'rgba(124, 179, 66, 0.3)',
  },
  padel: {
    primary: '#42A5F5',
    secondary: '#1E88E5',
    glow: 'rgba(66, 165, 245, 0.5)',
    gradient: ['#42A5F5', '#1E88E5'] as const,
    ring: 'rgba(66, 165, 245, 0.3)',
  },
};

type BadgeSize = 'small' | 'medium' | 'large';
type BadgeVariant = 'default' | 'compact' | 'inline';

interface WaitlistPositionBadgeProps {
  position: number;
  sport?: 'pickleball' | 'tennis' | 'padel';
  size?: BadgeSize;
  variant?: BadgeVariant;
  showPulse?: boolean;
  showLabel?: boolean;
  style?: ViewStyle;
}

const SIZE_CONFIG = {
  small: {
    badgeSize: 36,
    fontSize: 14,
    labelSize: 8,
    ringSize: 48,
    ringWidth: 2,
  },
  medium: {
    badgeSize: 48,
    fontSize: 18,
    labelSize: 9,
    ringSize: 64,
    ringWidth: 2,
  },
  large: {
    badgeSize: 64,
    fontSize: 24,
    labelSize: 10,
    ringSize: 84,
    ringWidth: 3,
  },
};

export const WaitlistPositionBadge: React.FC<WaitlistPositionBadgeProps> = ({
  position,
  sport = 'pickleball',
  size = 'medium',
  variant = 'default',
  showPulse = true,
  showLabel = true,
  style,
}) => {
  const colors = SPORT_COLORS[sport];
  const sizeConfig = SIZE_CONFIG[size];

  // Animation values
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);
  const ringRotate = useSharedValue(0);
  const badgeScale = useSharedValue(0);
  const glowIntensity = useSharedValue(0.5);

  useEffect(() => {
    // Entrance animation
    badgeScale.value = withSpring(1, {
      damping: 12,
      stiffness: 100,
      mass: 0.8,
    });

    if (showPulse) {
      // Continuous pulse animation (heartbeat effect)
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 600, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.in(Easing.ease) })
        ),
        -1,
        false
      );

      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 600 }),
          withTiming(0.3, { duration: 600 })
        ),
        -1,
        false
      );

      // Rotating ring
      ringRotate.value = withRepeat(
        withTiming(360, { duration: 8000, easing: Easing.linear }),
        -1,
        false
      );

      // Glow breathing
      glowIntensity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1500 }),
          withTiming(0.4, { duration: 1500 })
        ),
        -1,
        false
      );
    }
  }, [showPulse]);

  // Animated styles
  const pulseRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const rotatingRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotate.value}deg` }],
  }));

  const badgeEntranceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowIntensity.value,
    transform: [
      { scale: interpolate(glowIntensity.value, [0.4, 0.8], [1, 1.1], Extrapolation.CLAMP) },
    ],
  }));

  // Compact variant (just the number in a pill)
  if (variant === 'compact') {
    return (
      <Animated.View style={[styles.compactContainer, badgeEntranceStyle, style]}>
        <LinearGradient
          colors={colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.compactBadge}
        >
          <Text style={styles.compactText}>#{position}</Text>
        </LinearGradient>
      </Animated.View>
    );
  }

  // Inline variant (horizontal with label)
  if (variant === 'inline') {
    return (
      <Animated.View style={[styles.inlineContainer, badgeEntranceStyle, style]}>
        <View style={[styles.inlineDot, { backgroundColor: colors.primary }]} />
        <Text style={[styles.inlineLabel, { color: colors.primary }]}>
          #{position} on waitlist
        </Text>
      </Animated.View>
    );
  }

  // Default variant (circular badge with animations)
  return (
    <View style={[styles.container, style]}>
      {/* Outer glow effect */}
      {showPulse && (
        <Animated.View
          style={[
            styles.glowOuter,
            glowStyle,
            {
              width: sizeConfig.ringSize + 20,
              height: sizeConfig.ringSize + 20,
              borderRadius: (sizeConfig.ringSize + 20) / 2,
              backgroundColor: colors.glow,
            },
          ]}
        />
      )}

      {/* Pulse ring */}
      {showPulse && (
        <Animated.View
          style={[
            styles.pulseRing,
            pulseRingStyle,
            {
              width: sizeConfig.ringSize,
              height: sizeConfig.ringSize,
              borderRadius: sizeConfig.ringSize / 2,
              borderColor: colors.ring,
              borderWidth: sizeConfig.ringWidth,
            },
          ]}
        />
      )}

      {/* Rotating dashed ring */}
      {showPulse && (
        <Animated.View
          style={[
            styles.rotatingRing,
            rotatingRingStyle,
            {
              width: sizeConfig.ringSize - 8,
              height: sizeConfig.ringSize - 8,
              borderRadius: (sizeConfig.ringSize - 8) / 2,
            },
          ]}
        >
          {/* Dashed segments */}
          {[...Array(8)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.dashSegment,
                {
                  backgroundColor: colors.primary,
                  transform: [{ rotate: `${i * 45}deg` }],
                },
              ]}
            />
          ))}
        </Animated.View>
      )}

      {/* Main badge */}
      <Animated.View style={badgeEntranceStyle}>
        <LinearGradient
          colors={colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.badge,
            {
              width: sizeConfig.badgeSize,
              height: sizeConfig.badgeSize,
              borderRadius: sizeConfig.badgeSize / 2,
            },
          ]}
        >
          {showLabel && (
            <Text
              style={[
                styles.label,
                { fontSize: sizeConfig.labelSize },
              ]}
            >
              QUEUE
            </Text>
          )}
          <Text
            style={[
              styles.position,
              { fontSize: sizeConfig.fontSize },
            ]}
          >
            #{position}
          </Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOuter: {
    position: 'absolute',
    opacity: 0.3,
  },
  pulseRing: {
    position: 'absolute',
  },
  rotatingRing: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashSegment: {
    position: 'absolute',
    width: 3,
    height: 8,
    borderRadius: 1.5,
    opacity: 0.4,
    top: 0,
    transformOrigin: 'center center',
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  label: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 1,
  },
  position: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  // Compact variant styles
  compactContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  compactBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  compactText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Inline variant styles
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inlineLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default WaitlistPositionBadge;
