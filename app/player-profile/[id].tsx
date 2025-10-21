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
import { ProfileHeaderWithCurve, ProfilePictureSection, ProfileInfoCard, ProfileAchievementsCard, ProfileSportsSection, ProfileSkillLevelCard, ProfileDMRCard, ProfileLeagueStatsCard, MatchHistoryButton, MatchDetailsModal } from '@/src/features/profile/components';
import { useProfileState } from '@/src/features/profile/hooks/useProfileState';
import { useProfileHandlers } from '@/src/features/profile/hooks/useProfileHandlers';
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

  // Profile state management
  const {
    activeTab,
    selectedGame,
    modalVisible,
    selectedGameType,
    setActiveTab,
    setSelectedGame,
    setModalVisible,
    setSelectedGameType,
  } = useProfileState();

  // Profile handlers
  const {
    handleGameTypeSelect,
    handleTabPress,
    handleGamePointPress,
    handleModalClose,
  } = useProfileHandlers({
    setSelectedGameType,
    setActiveTab,
    setSelectedGame,
    setModalVisible,
  });

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

  // Helper function to get rating values from skillRatings
  const getRatingForType = (sport: string, type: 'singles' | 'doubles') => {
    if (userData?.skillRatings && userData.skillRatings[sport.toLowerCase()]) {
      const rating = userData.skillRatings[sport.toLowerCase()];

      // Check for specific singles/doubles rating first
      if (type === 'singles' && rating.singles) {
        return Math.round(rating.singles * 1000); // Convert to display format
      } else if (type === 'doubles' && rating.doubles) {
        return Math.round(rating.doubles * 1000); // Convert to display format
      } else if (rating.rating) {
        // Fallback to general rating if specific type not available
        return Math.round(rating.rating * 1000);
      }
    }
    return 0; // Default to 0 if no rating available
  };

  const gameTypeOptions = ['Singles', 'Doubles']; // Static options

  // Calculate win rate from match history - placeholder until match system is implemented
  const calculateWinRate = () => {
    if (userData.name === 'Loading...') return 0; // Still loading

    // Check if user has match data
    const hasMatches = profileData?.totalMatches && profileData.totalMatches > 0;
    if (hasMatches) {
      // TODO: Calculate actual win rate from match history when matches exist
      return 0; // For now, return 0 until we have match data
    }
    return 0; // No matches yet
  };

  // Create ELO data based on actual rating values only
  const createEloData = () => {
    const currentSport = activeTab || userData.sports?.[0] || 'pickleball';
    const currentGameType = selectedGameType.toLowerCase();
    const currentRating = getRatingForType(currentSport, currentGameType as 'singles' | 'doubles');

    // Return single point with current rating if no matches played
    return [{
      date: 'Current Rating',
      time: '',
      rating: currentRating || 1400, // Use actual rating or default
      opponent: 'No matches played',
      result: '-' as any,
      score: '-',
      ratingChange: 0,
      league: `${currentSport} ${currentGameType}`,
      player1: userData.name || 'Player',
      player2: 'No opponent',
      scores: {
        set1: { player1: null, player2: null },
        set2: { player1: null, player2: null },
        set3: { player1: null, player2: null }
      },
      status: 'pending'
    }];
  };

  const mockEloData = createEloData();

  // Update activeTab to player's first sport when userData is loaded
  useEffect(() => {
    if (userData?.sports && userData.sports.length > 0 && userData.sports[0] !== 'No sports yet' && !activeTab) {
      setActiveTab(userData.sports[0]);
    }
  }, [userData?.sports, activeTab, setActiveTab]);

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

          {/* Sports */}
          <ProfileSportsSection
            sports={userData.sports || []}
            activeTab={activeTab}
            onTabPress={handleTabPress}
          />

          {/* Skill Level */}
          <ProfileSkillLevelCard
            skillLevel={userData.skillLevel}
          />

          {/* DMR */}
          <ProfileDMRCard
            activeTab={activeTab}
            selectedGameType={selectedGameType}
            gameTypeOptions={gameTypeOptions}
            onGameTypeSelect={handleGameTypeSelect}
            getRatingForType={getRatingForType}
            eloData={mockEloData}
            onPointPress={handleGamePointPress}
          />

          {/* Match History Button */}
          <MatchHistoryButton
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toast('Match history coming soon!');
            }}
          />

          {/* League Stats Section */}
          <ProfileLeagueStatsCard
            activeTab={activeTab}
            selectedGameType={selectedGameType}
            gameTypeOptions={gameTypeOptions}
            onGameTypeSelect={handleGameTypeSelect}
            winRate={calculateWinRate()}
          />
        </View>
      </ScrollView>

      {/* Match Details Modal */}
      {modalVisible && selectedGame && (
        <MatchDetailsModal
          match={selectedGame}
          onClose={handleModalClose}
        />
      )}
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
