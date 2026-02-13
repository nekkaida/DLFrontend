import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
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
  const hasAchievements = achievements && achievements.length > 0;

  // Get the 3 most recently unlocked achievements
  const recentAchievements = hasAchievements
    ? [...achievements]
        .filter((a) => a.isCompleted || a.unlockedAt)
        .sort((a, b) => {
          const dateA = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
          const dateB = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 3)
    : [];

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) {
      onPress();
    } else {
      router.navigate('/achievements' as any);
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        {completedCount !== undefined && totalCount !== undefined && totalCount > 0 && (
          <Text style={styles.countBadge}>
            {completedCount}/{totalCount}
          </Text>
        )}
      </View>
      <Pressable
        style={styles.achievementContainer}
        onPress={handlePress}
      >
        <View style={styles.achievementsContent}>
          {recentAchievements.length > 0 ? (
            recentAchievements.map((achievement) => (
              <View key={achievement.id} style={styles.achievementItem}>
                <AchievementBadge
                  icon={achievement.icon}
                  tier={achievement.tier || 'BRONZE'}
                  size="sm"
                  isLocked={false}
                />
                <View style={styles.achievementTextContainer}>
                  <Text style={styles.achievementText} numberOfLines={2}>
                    {achievement.title}
                  </Text>
                  {achievement.unlockedAt && (
                    <Text style={styles.achievementYear}>
                      ({new Date(achievement.unlockedAt).getFullYear()})
                    </Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noAchievementsContainer}>
              <Ionicons name="trophy-outline" size={32} color={theme.colors.neutral.gray[400]} />
              <Text style={styles.noAchievementsText}>No achievements yet</Text>
              <Text style={styles.noAchievementsSubtext}>Play matches to earn achievements</Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} style={styles.achievementChevron} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as any,
    color: '#111827',
    fontFamily: theme.typography.fontFamily.primary,
    letterSpacing: -0.3,
  },
  countBadge: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600' as any,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.primary,
  },
  achievementContainer: {
    backgroundColor: '#ffffff',
    padding: theme.spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: theme.colors.neutral.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  achievementsContent: {
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  achievementItem: {
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
  },
  achievementTextContainer: {
    marginTop: theme.spacing.xs,
    alignItems: 'center',
  },
  achievementText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.neutral.gray[600],
    fontFamily: theme.typography.fontFamily.primary,
    textAlign: 'center',
  },
  achievementYear: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.neutral.gray[400],
    fontFamily: theme.typography.fontFamily.primary,
  },
  achievementChevron: {
    marginLeft: theme.spacing.sm,
  },
  noAchievementsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
  },
  noAchievementsText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.neutral.gray[600],
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: '500' as const,
    marginTop: theme.spacing.sm,
  },
  noAchievementsSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.neutral.gray[400],
    fontFamily: theme.typography.fontFamily.primary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
});
