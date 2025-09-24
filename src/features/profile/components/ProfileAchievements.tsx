import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AchievementIcon } from './AchievementIcon';

interface ProfileAchievementsProps {
  styles: any; // Preserving exact styles from parent
  userData: any;
}

/**
 * ProfileAchievements - Achievements section component
 *
 * CRITICAL: This component preserves exact styling from profile.tsx
 */
export const ProfileAchievements: React.FC<ProfileAchievementsProps> = ({
  styles,
  userData,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Achievements</Text>
      <Pressable style={styles.achievementContainer}>
        <View style={styles.achievementsContent}>
          {userData.achievements && userData.achievements.length > 0 ? (
            userData.achievements.slice(0, 2).map((achievement: any) => (
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
              <Ionicons name="trophy-outline" size={32} color="#9CA3AF" />
              <Text style={styles.noAchievementsText}>No achievements yet</Text>
              <Text style={styles.noAchievementsSubtext}>Keep playing to unlock achievements!</Text>
            </View>
          )}
        </View>
        {userData.achievements && userData.achievements.length > 0 && (
          <Ionicons name="chevron-forward" size={20} color="#FE9F4D" style={styles.achievementChevron} />
        )}
      </Pressable>
    </View>
  );
};