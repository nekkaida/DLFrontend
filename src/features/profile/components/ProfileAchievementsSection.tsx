import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@core/theme/theme';
import { AchievementIcon } from './AchievementIcon';
import type { ProfileAchievementsProps } from '../types/ProfileTypes';

/**
 * ProfileAchievementsSection - Safe wrapper component for achievements section
 *
 * CRITICAL: This component preserves the exact styling and behavior from
 * the original profile.tsx implementation. Styles are passed in from parent
 * to maintain the complex positioning calculations.
 */
interface Props extends ProfileAchievementsProps {
  styles: any; // Exact styles from parent component
}

export const ProfileAchievementsSection: React.FC<Props> = ({
  achievements,
  styles
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Achievements</Text>
      <Pressable style={styles.achievementContainer}>
        <View style={styles.achievementsContent}>
          {achievements && achievements.length > 0 ? (
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
        {achievements && achievements.length > 0 && (
          <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} style={styles.achievementChevron} />
        )}
      </Pressable>
    </View>
  );
};