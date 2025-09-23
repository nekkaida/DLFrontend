import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPORT_COLORS } from '../constants/ProfileConstants';
import type { UserData } from '../types';

/**
 * ProfileInfoPills - Safe wrapper component for info pills section
 *
 * CRITICAL: This component preserves the exact styling and behavior from
 * the original profile.tsx implementation. Styles are passed in from parent
 * to maintain the complex positioning calculations.
 */
interface Props {
  userData: UserData;
  styles: any; // Exact styles from parent component
}

export const ProfileInfoPills: React.FC<Props> = ({
  userData,
  styles
}) => {
  return (
    <>
      {/* Info Pills */}
      <View style={styles.infoPills}>
        <View style={styles.pill}>
          <Ionicons name="location-sharp" size={14} color="#ffffff" />
          <Text style={styles.pillText}>{userData.location}</Text>
        </View>
        <View style={styles.pill}>
          <Ionicons name="male" size={14} color="#ffffff" />
          <Text style={styles.pillText}>{userData.gender}</Text>
        </View>
      </View>

      {/* Sports Pills */}
      <View style={styles.sportsPills}>
        {userData.sports?.map((sport) => {
          const isActive = userData.activeSports?.includes(sport);
          return (
            <View
              key={sport}
              style={[
                styles.sportPill,
                {
                  backgroundColor: SPORT_COLORS[sport as keyof typeof SPORT_COLORS],
                  opacity: isActive ? 1 : 0.6
                }
              ]}
            >
              <Text style={[
                styles.sportPillText,
                isActive && styles.sportPillTextActive
              ]}>
                {sport}
              </Text>
            </View>
          );
        })}
      </View>
    </>
  );
};