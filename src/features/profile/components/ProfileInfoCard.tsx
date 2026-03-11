import { theme } from '@core/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { getProfileSportConfig } from '../utils/profileSportUi';

interface ProfileInfoCardProps {
  name: string;
  username: string;
  bio: string;
  location: string;
  friendsCount?: number;
  onFriendsPress?: () => void;
  imageUri?: string | null;
  isUploadingImage?: boolean;
  onPickImage?: () => void;
  isEditableImage?: boolean;
  gender?: string;
  sports?: string[];
  activeSports?: string[];
  showActionButtons?: boolean;
  onAddFriend?: () => void;
  onChat?: () => void;
  onSportPress?: (sport: string) => void;
  isLoadingChat?: boolean;
}

export const ProfileInfoCard: React.FC<ProfileInfoCardProps> = ({
  name,
  username,
  bio,
  location,
  friendsCount = 0,
  onFriendsPress,
  imageUri,
  isUploadingImage = false,
  onPickImage,
  isEditableImage = false,
  gender,
  sports = [],
  activeSports = [],
  showActionButtons = false,
  onAddFriend,
  onChat,
  onSportPress,
  isLoadingChat = false,
}) => {
  const { width } = useWindowDimensions();
  const avatarSize = Math.max(84, Math.min(108, width * 0.25));
  const rightColumnWidth = avatarSize + 12;
  const nameSize = Math.max(28, Math.min(40, width * 0.09));
  const usernameSize = Math.max(14, Math.min(18, width * 0.042));
  const bioSize = Math.max(13, Math.min(15, width * 0.036));
  const locationSize = Math.max(12, Math.min(15, width * 0.036));
  const pillFontSize = Math.max(11, Math.min(13, width * 0.031));
  const sportHeaderSize = Math.max(15, Math.min(17, width * 0.042));
  const genderIconSize = Math.max(18, Math.min(22, width * 0.055));
  const cardHorizontalPadding = Math.max(14, Math.min(20, width * 0.045));
  const cardVerticalPadding = Math.max(10, Math.min(16, width * 0.03));
  const sportsGap = Math.max(8, Math.min(12, width * 0.025));

  return (
    <View style={[styles.profileInfoCard, { paddingHorizontal: cardHorizontalPadding, paddingVertical: cardVerticalPadding }]}>
      <View style={styles.topRow}>
        <View style={styles.leftColumn}>
          {/* Name and Gender Row */}
          <View style={styles.nameRow}>
            <View style={styles.nameContainer}>
              <Text style={[styles.name, { fontSize: nameSize }]}>{name}</Text>
              {gender && gender !== 'Gender not set' && (
                <Ionicons
                  name={gender.toLowerCase() === 'male' ? 'male' : 'female'}
                  size={genderIconSize}
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
                      if (!isLoadingChat) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onChat();
                      }
                    }}
                    disabled={isLoadingChat}
                  >
                    {isLoadingChat ? (
                      <ActivityIndicator size="small" color={theme.colors.neutral.gray[600]} />
                    ) : (
                      <Ionicons name="chatbubble" size={14} color={theme.colors.neutral.gray[600]} />
                    )}
                  </Pressable>
                )}
              </View>
            )}
          </View>

          <Pressable
            style={styles.friendsPill}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onFriendsPress?.();
            }}
            disabled={!onFriendsPress}
          >
            <Text style={styles.friendsPillText}>Friends {friendsCount}</Text>
          </Pressable>

          {/* Bio */}
          <Text style={[styles.bio, { fontSize: bioSize, lineHeight: bioSize + 6 }]}>{bio}</Text>

          {/* Location */}
          <View style={styles.locationContainer}>
            <Ionicons name="location-sharp" size={14} color="#9ca3af" />
            <Text style={[styles.locationText, { fontSize: locationSize }]}>{location}</Text>
          </View>
        </View>

        <View style={[styles.rightColumn, { width: rightColumnWidth }]}>
          <Pressable
            style={[styles.avatarPressable, { width: avatarSize, height: avatarSize }]}
            onPress={() => {
              if (isEditableImage && onPickImage && !isUploadingImage) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onPickImage();
              }
            }}
            disabled={!isEditableImage || !onPickImage || isUploadingImage}
          >
            {isUploadingImage ? (
              <View style={[styles.avatarLoading, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : imageUri ? (
              <Image source={{ uri: imageUri }} style={[styles.avatarImage, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]} />
            ) : (
              <View style={[styles.defaultAvatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
                <Svg width="48" height="48" viewBox="0 0 24 24">
                  <Path
                    fill="#9ca3af"
                    fillRule="evenodd"
                    d="M8 7a4 4 0 1 1 8 0a4 4 0 0 1-8 0m0 6a5 5 0 0 0-5 5a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3a5 5 0 0 0-5-5z"
                    clipRule="evenodd"
                  />
                </Svg>
              </View>
            )}
            {/* {isEditableImage && onPickImage && (
              <View style={styles.cameraBadge}>
                <Ionicons name="pencil" size={12} color="#fff" />
              </View>
            )} */}
          </Pressable>

          <Text style={[styles.username, { fontSize: usernameSize }]}>@{username}</Text>
        </View>
      </View>

      <View style={styles.sportsHeaderRow}>
        <Text style={[styles.sportsTitle, { fontSize: sportHeaderSize }]}>Sports</Text>
        <Text style={[styles.sportsEdit, { fontSize: sportHeaderSize }]}>Edit</Text>
      </View>

      <View style={[styles.sportsPills, { gap: sportsGap }] }>
        {sports.slice(0, 3).map((sport) => {
          const isActive = activeSports.length === 0 || activeSports.includes(sport);
          const config = getProfileSportConfig(sport);
          const iconColor = isActive ? '#FFFFFF' : config.color;
          const Icon = config.Icon;

          return (
            <Pressable
              key={sport}
              style={[
                styles.sportPill,
                {
                  borderColor: config.color,
                  backgroundColor: isActive ? config.color : '#FFFFFF',
                }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSportPress?.(sport);
              }}
            >
              <Icon width={14} height={14} fill={iconColor} color={iconColor} />
              <Text style={[styles.sportPillText, { fontSize: pillFontSize, color: iconColor }]}>
                {sport}
              </Text>
            </Pressable>
          );
        })}
        {sports.length > 3 && (
          <Text style={[styles.moreSportsText, { fontSize: pillFontSize }]}>+{sports.length - 3}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  profileInfoCard: {
    backgroundColor: '#ffffff',
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  leftColumn: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  rightColumn: {
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    flex: 1,
  },
  name: {
    fontWeight: '700' as any,
    color: '#1a1a1a',
    fontFamily: theme.typography.fontFamily.primary,
    letterSpacing: -0.3,
  },
  genderIcon: {
    marginLeft: theme.spacing.xs,
  },
  actionIconsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionIcon: {
    padding: theme.spacing.sm,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  addFriendIcon: {
    borderColor: '#20659d',
    backgroundColor: '#f0f8ff',
  },
  username: {
    color: '#9ca3af',
    marginTop: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: '500' as any,
  },
  bio: {
    color: '#374151',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: '400' as any,
  },
  friendsPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: '#f9fafb',
    marginBottom: theme.spacing.md,
  },
  friendsPillText: {
    color: '#4b5563',
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: '500' as any,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  locationText: {
    color: '#9ca3af',
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: '400' as any,
  },
  sportsHeaderRow: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sportsTitle: {
    fontWeight: '500' as any,
    color: '#1f2937',
    fontFamily: theme.typography.fontFamily.primary,
  },
  sportsEdit: {
    fontWeight: '500' as any,
    color: '#f97316',
    fontFamily: theme.typography.fontFamily.primary,
  },
  sportsPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  sportPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  sportPillText: {
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: '600' as any,
  },
  moreSportsText: {
    color: theme.colors.neutral.gray[500],
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: '500' as any,
    marginLeft: theme.spacing.xs,
    alignSelf: 'center',
  },
  avatarPressable: {
    position: 'relative',
  },
  avatarImage: {
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  defaultAvatar: {
    backgroundColor: '#e5e7eb',
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLoading: {
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
});
