import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { scale, verticalScale, moderateScale } from '@/core/utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MatchCardSkeletonProps {
  count?: number;
}

const ShimmerPlaceholder: React.FC<{
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}> = ({ width, height, borderRadius = moderateScale(4), style }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  return (
    <View
      style={[
        {
          width: typeof width === 'number' ? width : undefined,
          height,
          borderRadius,
          backgroundColor: '#E5E7EB',
          overflow: 'hidden',
        },
        typeof width === 'string' && { flex: 1 },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255, 255, 255, 0.4)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

const SingleCardSkeleton: React.FC = () => {
  return (
    <View style={styles.matchCard}>
      {/* Top Section - Player avatars and badge */}
      <View style={styles.cardTopSection}>
        <View style={styles.playersRow}>
          {/* Player 1 */}
          <View style={styles.playerColumn}>
            <ShimmerPlaceholder width={scale(56)} height={scale(56)} borderRadius={moderateScale(28)} />
            <ShimmerPlaceholder width={scale(50)} height={verticalScale(12)} borderRadius={moderateScale(6)} style={{ marginTop: verticalScale(6) }} />
          </View>
          {/* Player 2 */}
          <View style={styles.playerColumn}>
            <ShimmerPlaceholder width={scale(56)} height={scale(56)} borderRadius={moderateScale(28)} />
            <ShimmerPlaceholder width={scale(50)} height={verticalScale(12)} borderRadius={moderateScale(6)} style={{ marginTop: verticalScale(6) }} />
          </View>
        </View>
        {/* Badge */}
        <ShimmerPlaceholder width={scale(70)} height={verticalScale(28)} borderRadius={moderateScale(12)} />
      </View>

      {/* Divider */}
      <View style={styles.cardDivider} />

      {/* Info Section */}
      <View style={styles.cardInfoSection}>
        {/* Title */}
        <ShimmerPlaceholder width={scale(180)} height={verticalScale(18)} borderRadius={moderateScale(6)} />

        {/* Time row */}
        <View style={styles.infoRow}>
          <ShimmerPlaceholder width={scale(16)} height={scale(16)} borderRadius={moderateScale(8)} />
          <ShimmerPlaceholder width={'100%'} height={verticalScale(14)} borderRadius={moderateScale(6)} style={{ marginLeft: scale(8), maxWidth: scale(200) }} />
        </View>

        {/* Location row */}
        <View style={styles.infoRow}>
          <ShimmerPlaceholder width={scale(16)} height={scale(16)} borderRadius={moderateScale(8)} />
          <ShimmerPlaceholder width={'100%'} height={verticalScale(14)} borderRadius={moderateScale(6)} style={{ marginLeft: scale(8), maxWidth: scale(150) }} />
        </View>

        {/* Fee row */}
        <View style={styles.infoRow}>
          <ShimmerPlaceholder width={scale(16)} height={scale(16)} borderRadius={moderateScale(8)} />
          <ShimmerPlaceholder width={'100%'} height={verticalScale(14)} borderRadius={moderateScale(6)} style={{ marginLeft: scale(8), maxWidth: scale(180) }} />
        </View>

        {/* Footer with status */}
        <View style={styles.footerRow}>
          <View style={{ flex: 1 }} />
          <ShimmerPlaceholder width={scale(90)} height={verticalScale(28)} borderRadius={moderateScale(14)} />
        </View>
      </View>
    </View>
  );
};

export const MatchCardSkeleton: React.FC<MatchCardSkeletonProps> = ({ count = 3 }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <SingleCardSkeleton key={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(12),
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: scale(16),
    marginBottom: verticalScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.12,
    shadowRadius: moderateScale(2),
    elevation: 4,
  },
  cardTopSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scale(12),
    flex: 1,
  },
  playerColumn: {
    alignItems: 'center',
  },
  cardDivider: {
    height: verticalScale(1),
    backgroundColor: '#E5E7EB',
    marginVertical: verticalScale(16),
  },
  cardInfoSection: {
    gap: verticalScale(10),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(8),
  },
});

export default MatchCardSkeleton;
