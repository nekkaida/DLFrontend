import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { theme } from '@core/theme/theme';
import { AchievementBadge } from './AchievementBadge';
import type { AchievementData } from './AchievementCard';

const TIER_COLORS: Record<string, string> = {
  BRONZE: '#CD7F32',
  SILVER: '#C0C0C0',
  GOLD: '#FFD700',
  PLATINUM: '#FE9F4D',
};

interface AchievementUnlockSheetProps {
  achievements: AchievementData[];
  visible: boolean;
  onDismiss: () => void;
}

export const AchievementUnlockSheet: React.FC<AchievementUnlockSheetProps> = ({
  achievements,
  visible,
  onDismiss,
}) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const snapPoints = useMemo(() => ['50%'], []);

  // Scale animation for badge
  const badgeScale = useSharedValue(0.3);

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  // Play entrance animation and haptic
  const playEntrance = useCallback(() => {
    badgeScale.value = 0.3;
    badgeScale.value = withSpring(1, {
      damping: 8,
      stiffness: 120,
      mass: 0.5,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [badgeScale]);

  // Open / close sheet based on visible prop
  useEffect(() => {
    if (visible && achievements.length > 0) {
      bottomSheetRef.current?.snapToIndex(0);
      playEntrance();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible, achievements.length, currentIndex, playEntrance]);

  const handleDismiss = useCallback(() => {
    if (currentIndex < achievements.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onDismiss();
    }
  }, [currentIndex, achievements.length, onDismiss]);

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        handleDismiss();
      }
    },
    [handleDismiss]
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  if (!achievements.length) return null;

  const current = achievements[currentIndex];
  if (!current) return null;

  const tierColor = TIER_COLORS[current.tier] || TIER_COLORS.BRONZE;
  const isMultiple = achievements.length > 1;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      onChange={handleSheetChange}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.content}>
        {/* Indicator for multiple achievements */}
        {isMultiple && (
          <Text style={styles.indicator}>
            {currentIndex + 1} of {achievements.length}
          </Text>
        )}

        {/* Header */}
        <Text style={styles.header}>Achievement Unlocked</Text>

        {/* Badge with scale animation */}
        <Animated.View style={[styles.badgeWrapper, badgeAnimatedStyle]}>
          <AchievementBadge
            icon={current.icon}
            tier={current.tier}
            size="lg"
            isLocked={false}
          />
        </Animated.View>

        {/* Title */}
        <Text style={styles.title}>{current.title}</Text>

        {/* Description */}
        <Text style={styles.description}>{current.description}</Text>

        {/* Tier pill */}
        <View style={[styles.tierPill, { backgroundColor: tierColor + '20' }]}>
          <Text style={[styles.tierText, { color: tierColor }]}>
            {current.tier}
          </Text>
        </View>

        {/* Points */}
        {current.points > 0 && (
          <Text style={styles.points}>+{current.points} pts</Text>
        )}

        {/* Dismiss button */}
        <Pressable
          style={({ pressed }) => [
            styles.dismissButton,
            pressed && styles.dismissButtonPressed,
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            handleDismiss();
          }}
        >
          <Text style={styles.dismissButtonText}>
            {isMultiple && currentIndex < achievements.length - 1
              ? 'Next'
              : 'Awesome'}
          </Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    backgroundColor: '#E5E7EB',
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 34,
  },
  indicator: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: theme.typography.fontFamily.primary,
    marginBottom: 4,
  },
  header: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    fontFamily: theme.typography.fontFamily.primary,
    marginBottom: 16,
  },
  badgeWrapper: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.primary,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.primary,
    marginBottom: 12,
  },
  tierPill: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: theme.typography.fontFamily.primary,
    letterSpacing: 0.5,
  },
  points: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FE9F4D',
    fontFamily: theme.typography.fontFamily.primary,
    marginBottom: 16,
  },
  dismissButton: {
    backgroundColor: '#FE9F4D',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  dismissButtonPressed: {
    opacity: 0.85,
  },
  dismissButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.primary,
  },
});
