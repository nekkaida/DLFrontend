import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { scale, verticalScale, moderateScale } from '@/core/utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const isSmallScreen = SCREEN_WIDTH < 375;
const isTablet = SCREEN_WIDTH > 768;

interface SeasonCardSkeletonProps {
  sport?: 'pickleball' | 'tennis' | 'padel';
  count?: number;
}

const ShimmerPlaceholder: React.FC<{
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
  backgroundColor?: string;
}> = ({ width, height, borderRadius = moderateScale(4), style, backgroundColor = '#E5E7EB' }) => {
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
          backgroundColor,
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

const getSeasonCardGradientColors = (sport: 'pickleball' | 'tennis' | 'padel'): [string, string] => {
  switch (sport) {
    case 'tennis':
      return ['#A2E047', '#FEA04D'];
    case 'padel':
      return ['#4DABFE', '#FEA04D'];
    case 'pickleball':
    default:
      return ['#A04DFE', '#FEA04D'];
  }
};

const SingleSeasonCardSkeleton: React.FC<{ sport: 'pickleball' | 'tennis' | 'padel' }> = ({ sport }) => {
  return (
    <LinearGradient
      colors={getSeasonCardGradientColors(sport)}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.seasonCardWrapper}
    >
      <View style={styles.seasonCard}>
        {/* Header - Season title + category chip */}
        <View style={styles.seasonCardHeader}>
          <ShimmerPlaceholder width={scale(180)} height={verticalScale(20)} borderRadius={moderateScale(6)} />
          <ShimmerPlaceholder width={scale(80)} height={verticalScale(28)} borderRadius={moderateScale(10)} />
        </View>

        {/* Date row */}
        <View style={styles.dateRow}>
          <ShimmerPlaceholder width={SCREEN_WIDTH - scale(100)} height={verticalScale(14)} borderRadius={moderateScale(6)} />
        </View>

        {/* Player count */}
        <View style={styles.seasonPlayerCountContainer}>
          <ShimmerPlaceholder width={scale(8)} height={scale(8)} borderRadius={moderateScale(4)} />
          <ShimmerPlaceholder width={scale(80)} height={verticalScale(14)} borderRadius={moderateScale(6)} style={{ marginLeft: scale(8) }} />
        </View>

        {/* Profile pictures */}
        <View style={styles.seasonProfilePicturesContainer}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <ShimmerPlaceholder
              key={i}
              width={scale(28)}
              height={scale(28)}
              borderRadius={moderateScale(14)}
              style={i > 0 ? { marginLeft: scale(-8) } : undefined}
            />
          ))}
        </View>

        {/* Registration deadline */}
        <View style={styles.detailRow}>
          <ShimmerPlaceholder width={scale(200)} height={verticalScale(14)} borderRadius={moderateScale(6)} />
        </View>

        {/* Entry fee */}
        <View style={styles.entryFeeContainer}>
          <ShimmerPlaceholder width={scale(150)} height={verticalScale(14)} borderRadius={moderateScale(6)} />
        </View>

        {/* Button */}
        <View style={styles.buttonRow}>
          <ShimmerPlaceholder width={scale(140)} height={verticalScale(44)} borderRadius={moderateScale(12)} />
        </View>
      </View>
    </LinearGradient>
  );
};

export const SeasonCardSkeleton: React.FC<SeasonCardSkeletonProps> = ({ sport = 'pickleball', count = 2 }) => {
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <ShimmerPlaceholder width={scale(130)} height={verticalScale(18)} borderRadius={moderateScale(6)} />
      </View>
      {Array.from({ length: count }).map((_, index) => (
        <SingleSeasonCardSkeleton key={index} sport={sport} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: verticalScale(24),
  },
  sectionHeader: {
    marginBottom: verticalScale(12),
  },
  seasonCardWrapper: {
    borderRadius: moderateScale(16),
    padding: scale(2),
    marginBottom: verticalScale(12),
  },
  seasonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    padding: isSmallScreen ? scale(16) : scale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(1) },
    shadowOpacity: 0.05,
    shadowRadius: moderateScale(4),
    elevation: 2,
  },
  seasonCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  dateRow: {
    marginTop: verticalScale(8),
    marginBottom: verticalScale(8),
  },
  seasonPlayerCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(8),
  },
  seasonProfilePicturesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: verticalScale(12),
  },
  detailRow: {
    marginBottom: verticalScale(12),
  },
  entryFeeContainer: {
    marginBottom: verticalScale(12),
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SeasonCardSkeleton;
