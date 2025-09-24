import React from 'react';
import { View, Text, Pressable } from 'react-native';

interface ProfileSportsProps {
  styles: any; // Preserving exact styles from parent
  userData: any;
  activeTab: string;
  onTabPress: (sport: string) => void;
}

/**
 * ProfileSports - Sports tabs section component
 *
 * CRITICAL: This component preserves exact styling from profile.tsx
 */
export const ProfileSports: React.FC<ProfileSportsProps> = ({
  styles,
  userData,
  activeTab,
  onTabPress,
}) => {
  return (
    <>
      {/* Sports Header with Tabs */}
      <View style={styles.section}>
        <View style={styles.sportsHeader}>
          <Text style={styles.sectionTitle}>Sports</Text>
          <View style={styles.tabs}>
            {userData.sports?.map((sport: string) => (
              <Pressable
                key={sport}
                style={[
                  styles.tab,
                  activeTab === sport && styles.tabActive
                ]}
                onPress={() => onTabPress(sport)}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === sport && styles.tabTextActive
                ]}>
                  {sport}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* Skill Level */}
      <View style={styles.skillLevelSection}>
        <View style={styles.skillContainer}>
          <Text style={styles.skillLabel}>Skill Level</Text>
          <Text style={styles.skillValue}>{userData.skillLevel}</Text>
        </View>
      </View>
    </>
  );
};