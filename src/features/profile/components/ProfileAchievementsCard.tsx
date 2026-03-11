import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { theme } from '@core/theme/theme';
import { AchievementBadge } from '@/src/features/achievements/components/AchievementBadge';

interface Achievement {
  id: string;
  title: string;
  icon: string;
  tier?: string;
  points?: number;
  isCompleted?: boolean;
  unlockedAt?: string;
}

interface ProfileAchievementsCardProps {
  achievements: Achievement[];
  completedCount?: number;
  totalCount?: number;
  onPress?: () => void;
}

export const ProfileAchievementsCard: React.FC<ProfileAchievementsCardProps> = ({
  achievements,
  completedCount,
  totalCount,
  onPress,
}) => {
  const router = useRouter();
  const { width } = useWindowDimensions();

  // Badge dimensions derived from screen width for responsiveness
  // ~13% of screen width per badge, ~3.5% gap — gives ~4.5 visible badges at rest
  const BADGE_SIZE = Math.round(width * 0.13);
  const BADGE_GAP = Math.round(width * 0.035);

  // Sort completed achievements by tier then points and show them all
  const tierRank: Record<string, number> = { PLATINUM: 4, GOLD: 3, SILVER: 2, BRONZE: 1, NONE: 0 };
  const unlockedBadges = achievements && achievements.length > 0
    ? [...achievements]
        .filter((a) => a.isCompleted || a.unlockedAt)
        .sort((a, b) => {
          const tierDiff = (tierRank[b.tier || 'NONE'] ?? 0) - (tierRank[a.tier || 'NONE'] ?? 0);
          if (tierDiff !== 0) return tierDiff;
          return (b.points ?? 0) - (a.points ?? 0);
        })
    : [];

  const displayCount = completedCount ?? unlockedBadges.length;

  const handleViewAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) {
      onPress();
    } else {
      router.navigate('/achievements' as any);
    }
  };

  return (
    <View style={styles.section}>
      {/* Header row: badge count + trophy | View all */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.badgeCount}>{displayCount}</Text>
          <Text style={styles.badgesLabel}>Badges</Text>
        </View>
        <Pressable onPress={handleViewAll} hitSlop={8}>
          <Text style={styles.viewAllText}>View all</Text>
        </Pressable>
      </View>

      {/* Horizontal badge scroll — 4 full + 5th half-visible */}
      {unlockedBadges.length > 0 ? (
        <View style={styles.scrollClip}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.badgeRow, { gap: BADGE_GAP, paddingRight: BADGE_SIZE }]}
            scrollEventThrottle={16}
          >
            {unlockedBadges.map((badge) => (
              <Pressable
                key={badge.id}
                style={{ width: BADGE_SIZE, height: BADGE_SIZE, alignItems: 'center', justifyContent: 'center' }}
                onPress={handleViewAll}
              >
                <AchievementBadge
                  icon={badge.icon}
                  tier={badge.tier || 'BRONZE'}
                  size="md"
                  isLocked={false}
                />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="trophy-outline" size={28} color={theme.colors.neutral.gray[300]} />
          <Text style={styles.emptyText}>No badges yet — play matches to earn them</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    boxShadow: '0px 12px 24px rgba(0, 0, 0, 0.10)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeCount: {
    fontSize: 28,
    fontWeight: '800' as any,
    color: '#1D1D1F',
    fontFamily: theme.typography.fontFamily.primary,
    letterSpacing: -0.3,
  },
  badgesLabel: {
    fontSize: 18,
    fontWeight: '200' as any,
    color: '#1D1D1F',
    fontFamily: theme.typography.fontFamily.primary,
    letterSpacing: -0.3,
  },
  trophyIcon: {
    marginLeft: 2,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600' as any,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.primary,
  },
  // Full-width clip — overflow hidden so the 5th badge appears half-visible
  scrollClip: {
    width: '100%',
    overflow: 'hidden',
  },
  badgeRow: {
    flexDirection: 'row',
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.neutral.gray[400],
    fontFamily: theme.typography.fontFamily.primary,
    flex: 1,
  },
});
