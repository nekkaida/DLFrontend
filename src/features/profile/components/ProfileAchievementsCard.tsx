import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '@core/theme/theme';
import { AchievementIcon } from './AchievementIcon';

interface Achievement {
  id: string;
  title: string;
  icon: string;
  unlockedAt?: string;
}

interface ProfileAchievementsCardProps {
  achievements: Achievement[];
  onPress?: () => void;
}

export const ProfileAchievementsCard: React.FC<ProfileAchievementsCardProps> = ({
  achievements,
  onPress,
}) => {
  const hasAchievements = achievements && achievements.length > 0;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Achievements</Text>
      <Pressable
        style={styles.achievementContainer}
        onPress={() => {
          if (hasAchievements && onPress) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress();
          }
        }}
        disabled={!hasAchievements || !onPress}
      >
        <View style={styles.achievementsContent}>
          {hasAchievements ? (
            achievements.slice(0, 2).map((achievement) => (
              <View key={achievement.id} style={styles.achievementItem}>
                <AchievementIcon iconName={achievement.icon} />
                <View style={styles.achievementTextContainer}>
                  <Text style={styles.achievementText}>{achievement.title}</Text>
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
              <Text style={styles.noAchievementsSubtext}>Keep playing to unlock achievements!</Text>
            </View>
          )}
        </View>
        {hasAchievements && (
          <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} style={styles.achievementChevron} />
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  achievementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  achievementsContent: {
    flex: 1,
    gap: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  achievementTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  achievementText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  achievementYear: {
    fontSize: 12,
    color: '#999',
  },
  achievementChevron: {
    marginLeft: 8,
  },
  noAchievementsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  noAchievementsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  noAchievementsSubtext: {
    fontSize: 12,
    color: '#999',
  },
});
