import { theme } from '@core/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState, useRef, useEffect } from 'react';
import ChatBubbleIcon from '@/assets/icons/profile/chat-bubble.svg';
import { Animated, ActivityIndicator, Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
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
  isFriend?: boolean;
  isPendingRequest?: boolean;
  onAddFriend?: () => void;
  onChat?: () => void;
  onShare?: () => void;
  onSportPress?: (sport: string) => void;
  onRemoveSport?: (sport: string) => void;
  onAddSport?: () => void;
  isOwnProfile?: boolean;
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
  isFriend = false,
  isPendingRequest = false,
  onAddFriend,
  onChat,
  onShare,
  onSportPress,
  onRemoveSport,
  onAddSport,
  isOwnProfile = false,
  isLoadingChat = false,
}) => {
  const { width } = useWindowDimensions();
  const avatarSize = Math.max(84, Math.min(108, width * 0.25));
  const rightColumnWidth = avatarSize + 12;
  const baseNameSize = Math.max(18, Math.min(24, width * 0.06));
  const nameSize = name.length > 18 ? Math.max(15, baseNameSize - 6)
    : name.length > 12 ? Math.max(16, baseNameSize - 3)
    : name.length > 6 ? Math.max(17, baseNameSize - 1)
    : baseNameSize;
  const baseUsernameSize = Math.max(11, Math.min(14, width * 0.034));
  const usernameSize = username.length > 24 ? Math.max(9, baseUsernameSize - 3)
    : username.length > 18 ? Math.max(10, baseUsernameSize - 2)
    : username.length > 14 ? Math.max(11, baseUsernameSize - 1)
    : baseUsernameSize;
  const bioSize = Math.max(13, Math.min(15, width * 0.036));
  const locationSize = Math.max(12, Math.min(15, width * 0.036));
  const pillFontSize = Math.max(11, Math.min(13, width * 0.031));
  const sportHeaderSize = Math.max(15, Math.min(17, width * 0.042));
  const genderIconSize = Math.max(18, Math.min(22, width * 0.055));
  const cardHorizontalPadding = Math.max(14, Math.min(20, width * 0.045));
  const cardVerticalPadding = Math.max(10, Math.min(16, width * 0.03));
  const sportsGap = Math.max(8, Math.min(12, width * 0.025));

  const [isEditing, setIsEditing] = useState(false);
  const jiggleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let anim: { start: () => void; stop: () => void } | null = null;
    if (isEditing) {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(jiggleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
          Animated.timing(jiggleAnim, { toValue: -1, duration: 80, useNativeDriver: true }),
          Animated.timing(jiggleAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
        ])
      );
      anim.start();
    } else {
      jiggleAnim.setValue(0);
    }
    return () => { anim?.stop(); };
  }, [isEditing, jiggleAnim]);

  const jiggleRotate = jiggleAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-2deg', '2deg'],
  });

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

          {/* Action Buttons */}
          {showActionButtons && (
            <View style={styles.actionButtonsRow}>
              {onAddFriend && (
                isFriend ? (
                  <Pressable
                    style={styles.friendButton}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onAddFriend();
                    }}
                  >
                    <Ionicons name="checkmark" size={14} color="#f97316" />
                    <Text style={styles.friendButtonText}>Friend</Text>
                  </Pressable>
                ) : isPendingRequest ? (
                  <Pressable style={styles.pendingButton} disabled>
                    <Text style={styles.pendingButtonText}>Pending</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={styles.addFriendButton}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onAddFriend();
                    }}
                  >
                    <Text style={styles.addFriendButtonText}>Add friend</Text>
                  </Pressable>
                )
              )}
              {onChat && (
                <Pressable
                  style={styles.circleActionButton}
                  onPress={() => {
                    if (!isLoadingChat) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onChat();
                    }
                  }}
                  disabled={isLoadingChat}
                >
                  {isLoadingChat ? (
                    <ActivityIndicator size="small" color="#6b7280" />
                  ) : (
                    <ChatBubbleIcon width={18} height={18} fill="#6b7280" />
                  )}
                </Pressable>
              )}
              {/* Future Implementation */}
              {/* {onShare && (
                <Pressable
                  style={styles.circleActionButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onShare();
                  }}
                >
                  <Ionicons name="share-outline" size={18} color="#6b7280" />
                </Pressable>
              )} */}
            </View>
          )}
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

          <Text style={[styles.username, { fontSize: usernameSize }]} numberOfLines={1} ellipsizeMode="tail">@{username}</Text>
        </View>
      </View>

      <View style={styles.sportsHeaderRow}>
        <Text style={[styles.sportsTitle, { fontSize: sportHeaderSize }]}>Sports</Text>
        {isOwnProfile && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsEditing((e) => !e);
            }}
            hitSlop={8}
          >
            <Text style={[styles.sportsEdit, { fontSize: sportHeaderSize }]}>
              {isEditing ? 'Done' : 'Edit'}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={[styles.sportsPills, { gap: sportsGap }]}>
        {(isEditing ? sports : sports.slice(0, 3)).map((sport) => {
          const isActive = activeSports.length === 0 || activeSports.includes(sport);
          const config = getProfileSportConfig(sport);
          const iconColor = isActive ? '#FFFFFF' : config.color;
          const Icon = config.Icon;

          return (
            <Animated.View
              key={sport}
              style={[
                styles.sportPillWrapper,
                isEditing && { transform: [{ rotate: jiggleRotate }] },
              ]}
            >
              <Pressable
                style={[
                  styles.sportPill,
                  {
                    borderColor: config.color,
                    backgroundColor: isActive ? config.color : '#FFFFFF',
                  },
                ]}
                onPress={() => {
                  if (!isEditing) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onSportPress?.(sport);
                  }
                }}
              >
                <Icon width={14} height={14} fill={iconColor} color={iconColor} />
                <Text style={[styles.sportPillText, { fontSize: pillFontSize, color: iconColor }]}>
                  {sport}
                </Text>
              </Pressable>
              {isEditing && (
                <Pressable
                  style={styles.sportPillRemoveBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onRemoveSport?.(sport);
                  }}
                  hitSlop={6}
                  accessibilityLabel={`Remove ${sport}`}
                >
                  <Ionicons name="close-circle" size={18} color="#1f2937" />
                </Pressable>
              )}
            </Animated.View>
          );
        })}

        {/* Add Sport pill — edit mode only */}
        {isEditing && (
          <Pressable
            style={styles.addSportPill}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onAddSport?.();
            }}
            accessibilityLabel="Add sport"
          >
            <Ionicons name="add" size={14} color={theme.colors.neutral.gray[500]} />
            <Text style={[styles.addSportText, { fontSize: pillFontSize }]}>Add Sport</Text>
          </Pressable>
        )}

        {/* Overflow count — view mode only */}
        {!isEditing && sports.length > 3 && (
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
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: theme.spacing.md,
  },
  addFriendButton: {
    width: 100,
    backgroundColor: '#f97316',
    borderRadius: 90,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFriendButtonText: {
    color: '#ffffff',
    fontWeight: '600' as any,
    fontFamily: theme.typography.fontFamily.primary,
    fontSize: 14,
  },
  friendButton: {
    width: 100,
    backgroundColor: '#ffffff',
    borderRadius: 90,
    borderWidth: 1.5,
    borderColor: '#f97316',
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  friendButtonText: {
    color: '#f97316',
    fontWeight: '600' as any,
    fontFamily: theme.typography.fontFamily.primary,
    fontSize: 14,
  },
  pendingButton: {
    width: 100,
    backgroundColor: '#f3f4f6',
    borderRadius: 90,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingButtonText: {
    color: '#9ca3af',
    fontWeight: '600' as any,
    fontFamily: theme.typography.fontFamily.primary,
    fontSize: 14,
  },
  circleActionButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EBF3FB',
    alignItems: 'center',
    justifyContent: 'center',
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
  sportPillWrapper: {
    position: 'relative',
  },
  sportPillRemoveBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 10,
    backgroundColor: '#ffffff',
    borderRadius: 9,
  },
  addSportPill: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.5,
    borderStyle: 'dashed' as const,
    borderColor: theme.colors.neutral.gray[300],
    backgroundColor: 'transparent',
  },
  addSportText: {
    color: theme.colors.neutral.gray[500],
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: '500' as any,
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
