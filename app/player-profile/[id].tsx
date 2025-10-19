import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSession, authClient } from '@/lib/auth-client';
import { getBackendBaseURL } from '@/config/network';
import { toast } from 'sonner-native';
import { theme } from '@core/theme/theme';
import { ProfileHeaderWithCurve, ProfilePictureSection, ProfileInfoCard, ProfileAchievementsCard } from '@/src/features/profile/components';
import { ProfileDataTransformer } from '@/src/features/profile/services/ProfileDataTransformer';
import type { UserData } from '@/src/features/profile/types';

const { width } = Dimensions.get('window');

export default function PlayerProfileScreen() {
  const { id, seasonId, seasonName } = useLocalSearchParams();
  const { data: session } = useSession();
  const [profileData, setProfileData] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Check if viewing in pairing context
  const isPairingContext = !!seasonId;

  const fetchPlayerProfile = useCallback(async () => {
    try {
      if (!session?.user?.id || !id) {
        console.log('PlayerProfile: No session or player ID');
        return;
      }

      setIsLoading(true);
      const backendUrl = getBackendBaseURL();
      console.log('PlayerProfile: Fetching profile from:', `${backendUrl}/api/player/profile/public/${id}`);

      const authResponse = await authClient.$fetch(`${backendUrl}/api/player/profile/public/${id}`, {
        method: 'GET',
      });

      console.log('PlayerProfile: API response:', authResponse);

      if (authResponse && (authResponse as any).data) {
        const playerData = (authResponse as any).data.data || (authResponse as any).data;
        console.log('PlayerProfile: Setting profile data:', playerData);
        setProfileData(playerData);

        // Fetch achievements if available
        // TODO: Add achievements endpoint when available
        setAchievements([]);
      }
    } catch (error) {
      console.error('PlayerProfile: Error fetching profile:', error);
      toast.error('Error', {
        description: 'Failed to load player profile. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPlayerProfile();
    setRefreshing(false);
  }, [fetchPlayerProfile]);

  const handleAddFriend = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Add friend:', profileData?.name);
    toast('Add friend feature coming soon!');
  };

  const handleChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Chat with player:', profileData?.name);
    toast('Chat feature coming soon!');
  };

  useEffect(() => {
    if (session?.user?.id && id) {
      fetchPlayerProfile();
    }
  }, [session?.user?.id, id, fetchPlayerProfile]);

  // Transform profile data to userData format
  const userData: UserData = profileData
    ? ProfileDataTransformer.transformProfileToUserData(profileData, achievements)
    : {
        name: 'Loading...',
        username: 'loading',
        bio: 'Loading...',
        location: 'Loading...',
        gender: 'Loading...',
        skillLevel: 'Loading...',
        skillRatings: {},
        sports: [],
        activeSports: [],
        profileImage: undefined,
        achievements: [],
      };

  if (isLoading && !profileData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6de9a0"
            colors={["#6de9a0"]}
            progressBackgroundColor="#ffffff"
          />
        }
      >
        {/* Orange Header Background with Curved Bottom */}
        <ProfileHeaderWithCurve
          onBack={() => router.back()}
          showSettings={false}
        />

        {/* White Background */}
        <View style={styles.whiteBackground}>
          {/* Profile Picture Section */}
          <ProfilePictureSection
            imageUri={profileData?.image}
            isUploading={false}
            isEditable={false}
          />

          {/* Profile Info Card */}
          <ProfileInfoCard
            name={userData.name}
            username={userData.username}
            bio={userData.bio}
            location={userData.location}
            gender={userData.gender}
            sports={userData.sports || []}
            activeSports={userData.activeSports || []}
            showActionButtons={true}
            onAddFriend={handleAddFriend}
            onChat={handleChat}
          />

          {/* Achievements */}
          <ProfileAchievementsCard
            achievements={userData.achievements || []}
          />

          {/* TODO: Add rest of profile sections (Sports, DMR, League Stats, etc.) */}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.gray[50],
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.gray[50],
  },
  whiteBackground: {
    backgroundColor: theme.colors.neutral.gray[50],
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    marginTop: -1,
  },
});
