import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '@core/theme/theme';
import { AchievementBadge } from './AchievementBadge';

export interface AchievementData {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  tier: string;
  scope: string;
  threshold: number;
  sportFilter: string | null;
  gameTypeFilter: string | null;
  sortOrder: number;
  isHidden: boolean;
  points: number;
  progress: number;
  isCompleted: boolean;
  unlockedAt: string | null;
}

interface AchievementCardProps {
  achievement: AchievementData;
  onPress?: () => void;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  onPress,
}) => {
  const isUnlocked = achievement.isCompleted;
  const showProgress =
    !isUnlocked && achievement.threshold > 1 && achievement.progress > 0;
  const progressPercent = showProgress
    ? Math.min((achievement.progress / achievement.threshold) * 100, 100)
    : 0;

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.badgeContainer}>
        <AchievementBadge
          icon={achievement.icon}
          tier={achievement.tier}
          size="md"
          isLocked={!isUnlocked}
        />
      </View>

      {isUnlocked ? (
        <>
          <Text style={styles.titleUnlocked} numberOfLines={2}>
            {achievement.title}
          </Text>
          <Text style={styles.unlockDate}>
            {formatDate(achievement.unlockedAt)}
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.titleLocked} numberOfLines={2}>
            {achievement.isHidden ? '???' : achievement.title}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {achievement.isHidden ? '???' : achievement.description}
          </Text>
          {showProgress && (
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progressPercent}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {achievement.progress}/{achievement.threshold}
              </Text>
            </View>
          )}
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    flex: 1,
    margin: 4,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  badgeContainer: {
    marginBottom: 8,
  },
  titleUnlocked: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.primary,
  },
  unlockDate: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 2,
    fontFamily: theme.typography.fontFamily.primary,
  },
  titleLocked: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.primary,
  },
  description: {
    fontSize: 11,
    color: '#C0C0C0',
    textAlign: 'center',
    marginTop: 2,
    fontFamily: theme.typography.fontFamily.primary,
  },
  progressContainer: {
    width: '100%',
    marginTop: 8,
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FE9F4D',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    fontFamily: theme.typography.fontFamily.primary,
  },
});
