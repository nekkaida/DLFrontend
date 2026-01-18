import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { scale, verticalScale, moderateScale } from '@/core/utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Grid item width calculation (2 columns with 12px gap, 20px padding on each side)
const GRID_GAP = scale(12);
const HORIZONTAL_PADDING = scale(20);
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - (HORIZONTAL_PADDING * 2) - GRID_GAP) / 2;

interface LeagueCardSkeletonProps {
  variant?: 'featured' | 'grid';
  gridCount?: number;
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
          colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

const FeaturedCardSkeleton: React.FC = () => {
  return (
    <View style={styles.featuredCard}>
      <LinearGradient
        colors={['#C4B5DC', '#D4D4D4']}
        style={styles.featuredGradient}
      >
        <View style={styles.featuredContent}>
          {/* Header */}
          <View style={styles.featuredHeader}>
            <View style={styles.featuredTitleSection}>
              <ShimmerPlaceholder
                width={scale(180)}
                height={verticalScale(20)}
                borderRadius={moderateScale(6)}
                backgroundColor="rgba(255,255,255,0.3)"
              />
              {/* Category chips */}
              <View style={styles.categoryChips}>
                <ShimmerPlaceholder
                  width={scale(80)}
                  height={verticalScale(24)}
                  borderRadius={moderateScale(12)}
                  backgroundColor="rgba(0,0,0,0.2)"
                />
                <ShimmerPlaceholder
                  width={scale(70)}
                  height={verticalScale(24)}
                  borderRadius={moderateScale(12)}
                  backgroundColor="rgba(0,0,0,0.2)"
                />
              </View>
            </View>
          </View>

          {/* Profile pictures */}
          <View style={styles.profileSection}>
            <View style={styles.profileRow}>
              {[0, 1, 2, 3, 4].map((i) => (
                <ShimmerPlaceholder
                  key={i}
                  width={scale(36)}
                  height={scale(36)}
                  borderRadius={moderateScale(18)}
                  backgroundColor="rgba(255,255,255,0.4)"
                  style={i > 0 ? { marginLeft: scale(-10) } : undefined}
                />
              ))}
            </View>
          </View>

          {/* Bottom stats */}
          <View style={styles.featuredBottom}>
            <View style={styles.statsRow}>
              <ShimmerPlaceholder
                width={scale(8)}
                height={scale(8)}
                borderRadius={moderateScale(4)}
                backgroundColor="rgba(255,255,255,0.5)"
              />
              <ShimmerPlaceholder
                width={scale(80)}
                height={verticalScale(14)}
                borderRadius={moderateScale(6)}
                backgroundColor="rgba(255,255,255,0.3)"
                style={{ marginLeft: scale(8) }}
              />
            </View>
            <ShimmerPlaceholder
              width={scale(100)}
              height={verticalScale(12)}
              borderRadius={moderateScale(6)}
              backgroundColor="rgba(255,255,255,0.3)"
            />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const GridCardSkeleton: React.FC = () => {
  return (
    <View style={styles.gridCard}>
      <LinearGradient
        colors={['#C4B5DC', '#D4D4D4']}
        style={styles.gridGradient}
      >
        <View style={styles.gridContent}>
          {/* Header with title and season badge */}
          <View style={styles.gridHeader}>
            <ShimmerPlaceholder
              width={scale(90)}
              height={verticalScale(16)}
              borderRadius={moderateScale(6)}
              backgroundColor="rgba(255,255,255,0.3)"
            />
            <ShimmerPlaceholder
              width={scale(40)}
              height={verticalScale(22)}
              borderRadius={moderateScale(12)}
              backgroundColor="rgba(0,0,0,0.2)"
            />
          </View>

          {/* Player count */}
          <View style={styles.playerCount}>
            <ShimmerPlaceholder
              width={scale(8)}
              height={scale(8)}
              borderRadius={moderateScale(4)}
              backgroundColor="rgba(255,255,255,0.5)"
            />
            <ShimmerPlaceholder
              width={scale(60)}
              height={verticalScale(12)}
              borderRadius={moderateScale(6)}
              backgroundColor="rgba(255,255,255,0.3)"
              style={{ marginLeft: scale(8) }}
            />
          </View>

          {/* Profile pictures */}
          <View style={styles.gridProfileRow}>
            {[0, 1, 2].map((i) => (
              <ShimmerPlaceholder
                key={i}
                width={scale(32)}
                height={scale(32)}
                borderRadius={moderateScale(16)}
                backgroundColor="rgba(255,255,255,0.4)"
                style={i > 0 ? { marginLeft: scale(-8) } : undefined}
              />
            ))}
          </View>

          {/* Registration text */}
          <ShimmerPlaceholder
            width={scale(90)}
            height={verticalScale(12)}
            borderRadius={moderateScale(6)}
            backgroundColor="rgba(255,255,255,0.3)"
          />
        </View>
      </LinearGradient>
    </View>
  );
};

export const LeagueCardSkeleton: React.FC<LeagueCardSkeletonProps> = ({
  variant = 'featured',
  gridCount = 4
}) => {
  if (variant === 'featured') {
    return <FeaturedCardSkeleton />;
  }

  return (
    <View style={styles.gridWrapper}>
      {Array.from({ length: gridCount }).map((_, index) => (
        <GridCardSkeleton key={index} />
      ))}
    </View>
  );
};

export const LeagueSkeletonLoader: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Featured card skeleton */}
      <FeaturedCardSkeleton />

      {/* Section header skeleton */}
      <View style={styles.sectionHeader}>
        <ShimmerPlaceholder width={scale(150)} height={verticalScale(18)} borderRadius={moderateScale(6)} />
        <ShimmerPlaceholder width={scale(20)} height={verticalScale(18)} borderRadius={moderateScale(6)} />
      </View>

      {/* Search bar skeleton */}
      <View style={styles.searchSkeleton}>
        <ShimmerPlaceholder width={'100%'} height={verticalScale(44)} borderRadius={moderateScale(12)} style={{ flex: 1 }} />
      </View>

      {/* Grid skeleton */}
      <View style={styles.gridWrapper}>
        {[0, 1, 2, 3].map((index) => (
          <GridCardSkeleton key={index} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  featuredCard: {
    marginBottom: verticalScale(20),
    borderRadius: moderateScale(16),
    overflow: 'hidden',
  },
  featuredGradient: {
    width: '100%',
    height: verticalScale(200),
    borderRadius: moderateScale(16),
  },
  featuredContent: {
    padding: scale(16),
    flex: 1,
    justifyContent: 'space-between',
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(8),
  },
  featuredTitleSection: {
    flex: 1,
  },
  categoryChips: {
    flexDirection: 'row',
    gap: scale(6),
    marginTop: verticalScale(10),
  },
  profileSection: {
    marginBottom: verticalScale(12),
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  searchSkeleton: {
    marginBottom: verticalScale(16),
  },
  gridWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: GRID_ITEM_WIDTH,
    marginBottom: verticalScale(12),
    borderRadius: moderateScale(16),
    overflow: 'hidden',
  },
  gridGradient: {
    width: '100%',
    minHeight: verticalScale(160),
    borderRadius: moderateScale(16),
  },
  gridContent: {
    padding: scale(14),
    flex: 1,
    justifyContent: 'space-between',
  },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(6),
  },
  playerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  gridProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
});

export default LeagueCardSkeleton;
