import React from 'react';
import { View, Text, Pressable } from 'react-native';
import type { ProfileSportTabsProps } from '../types/ProfileTypes';

/**
 * ProfileSportTabs - Safe wrapper component for sport tabs section
 *
 * CRITICAL: This component preserves the exact styling and behavior from
 * the original profile.tsx implementation. Styles are passed in from parent
 * to maintain the complex positioning calculations.
 */
interface Props extends ProfileSportTabsProps {
  styles: any; // Exact styles from parent component
}

export const ProfileSportTabs: React.FC<Props> = ({
  sports,
  activeTab,
  onTabPress,
  styles
}) => {
  return (
    <View style={styles.sportsHeader}>
      <Text style={styles.sectionTitle}>Sports</Text>
      <View style={styles.tabs}>
        {sports?.map((sport) => (
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
  );
};