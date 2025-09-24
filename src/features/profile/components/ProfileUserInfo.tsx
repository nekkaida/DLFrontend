import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SPORT_COLORS } from '../constants/ProfileConstants';

interface ProfileUserInfoProps {
  styles: any; // Preserving exact styles from parent
  userData: any;
}

/**
 * ProfileUserInfo - User information section including name, bio, pills, and sports
 *
 * CRITICAL: This component preserves exact styling and spacing from profile.tsx
 */
export const ProfileUserInfo: React.FC<ProfileUserInfoProps> = ({
  styles,
  userData,
}) => {
  return (
    <>
      {/* Name and Username */}
      <View style={styles.nameContainer}>
        <Text style={styles.name}>{userData.name}</Text>
      </View>
      <Text style={styles.username}>@{userData.username}</Text>
      <Text style={styles.bio}>{userData.bio}</Text>

      {/* Action Icons */}
      <View style={styles.actionIconsContainer}>
        <Pressable style={[styles.actionIcon, styles.addFriendIcon]}>
          <Ionicons name="person-add" size={16} color="#20659d" />
        </Pressable>
        <Pressable style={styles.actionIcon}>
          <Ionicons name="chatbubble" size={16} color="#4B5563" />
        </Pressable>
      </View>

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
        {userData.sports?.map((sport: string) => {
          const isActive = userData.activeSports?.includes(sport);

          return (
            <Pressable
              key={sport}
              style={[
                styles.sportPill,
                {
                  backgroundColor: SPORT_COLORS[sport as keyof typeof SPORT_COLORS],
                  opacity: isActive ? 1 : 0.6,
                }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                // Handle sport selection
              }}
            >
              <Text style={[
                styles.sportPillText,
                isActive && styles.sportPillTextActive
              ]}>
                {sport}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
};