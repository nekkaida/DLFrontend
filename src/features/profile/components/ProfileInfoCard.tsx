import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '@core/theme/theme';

const SPORT_COLORS = {
  Tennis: '#A2E047',
  Pickleball: '#A04DFE',
  Padel: '#4DABFE',
} as const;

interface ProfileInfoCardProps {
  name: string;
  username: string;
  bio: string;
  location: string;
  gender?: string;
  sports?: string[];
  activeSports?: string[];
  showActionButtons?: boolean;
  onAddFriend?: () => void;
  onChat?: () => void;
  onSportPress?: (sport: string) => void;
}

export const ProfileInfoCard: React.FC<ProfileInfoCardProps> = ({
  name,
  username,
  bio,
  location,
  gender,
  sports = [],
  activeSports = [],
  showActionButtons = false,
  onAddFriend,
  onChat,
  onSportPress,
}) => {
  return (
    <View style={styles.profileInfoCard}>
      {/* Name and Gender Row */}
      <View style={styles.nameRow}>
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{name}</Text>
          {gender && gender !== 'Gender not set' && (
            <Ionicons
              name={gender.toLowerCase() === 'male' ? 'male' : 'female'}
              size={16}
              color={gender.toLowerCase() === 'male' ? '#4A90E2' : '#E91E63'}
              style={styles.genderIcon}
            />
          )}
        </View>
        {showActionButtons && (
          <View style={styles.actionIconsRow}>
            {onAddFriend && (
              <Pressable
                style={[styles.actionIcon, styles.addFriendIcon]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onAddFriend();
                }}
              >
                <Ionicons name="person-add" size={14} color="#20659d" />
              </Pressable>
            )}
            {onChat && (
              <Pressable
                style={styles.actionIcon}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onChat();
                }}
              >
                <Ionicons name="chatbubble" size={14} color={theme.colors.neutral.gray[600]} />
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Username */}
      <Text style={styles.username}>@{username}</Text>

      {/* Bio */}
      <Text style={styles.bio}>{bio}</Text>

      {/* Location and Sports Row */}
      <View style={styles.locationSportsRow}>
        <View style={styles.locationContainer}>
          <Ionicons name="location-sharp" size={14} color="#6de9a0" />
          <Text style={styles.locationText}>{location}</Text>
        </View>

        <View style={styles.sportsContainer}>
          <Text style={styles.sportsLabel}>Sports</Text>
          <View style={styles.sportsPills}>
            {sports.slice(0, 3).map((sport) => {
              const isActive = activeSports.includes(sport);

              return (
                <Pressable
                  key={sport}
                  style={[
                    styles.sportPill,
                    {
                      backgroundColor: SPORT_COLORS[sport as keyof typeof SPORT_COLORS] || '#6de9a0',
                      opacity: isActive ? 1 : 0.7,
                    }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onSportPress?.(sport);
                  }}
                >
                  <Text style={styles.sportPillText}>
                    {sport}
                  </Text>
                </Pressable>
              );
            })}
            {sports.length > 3 && (
              <Text style={styles.moreSportsText}>+{sports.length - 3}</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  profileInfoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  genderIcon: {
    marginTop: 2,
  },
  actionIconsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addFriendIcon: {
    backgroundColor: '#e3f2fd',
  },
  username: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  locationSportsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
  },
  sportsContainer: {
    flex: 1,
  },
  sportsLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sportsPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  sportPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sportPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  moreSportsText: {
    fontSize: 11,
    color: '#999',
    paddingVertical: 4,
  },
});
