import { getBackendBaseURL } from '@/config/network';
import { authClient, useSession } from '@/lib/auth-client';
import { ChatService } from '@/src/features/chat/services/ChatService';
import { useChatStore } from '@/src/features/chat/stores/ChatStore';
import { MatchHistoryButton, PlayerDivisionStandings, ProfileAchievementsCard, ProfileDMRCard, ProfileHeaderWithCurve, ProfileInfoCard, ProfileLeagueStatsCard, ProfilePictureSection, ProfileSkillLevelCard, ProfileSportsSection } from '@/src/features/profile/components';
import { useProfileHandlers } from '@/src/features/profile/hooks/useProfileHandlers';
import { useProfileState } from '@/src/features/profile/hooks/useProfileState';
import { ProfileDataTransformer } from '@/src/features/profile/services/ProfileDataTransformer';
import type { UserData } from '@/src/features/profile/types';
import { theme } from '@core/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { toast } from 'sonner-native';

const { width } = Dimensions.get('window');

export default function PlayerProfileScreen() {
  const { id, seasonId, seasonName } = useLocalSearchParams();
  const { data: session } = useSession();
  const [profileData, setProfileData] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [leagueStatsData, setLeagueStatsData] = useState<{
    wins: number;
    losses: number;
    matchesPlayed: number;
  }>({ wins: 0, losses: 0, matchesPlayed: 0 });

  // Chat store
  const { threads, setCurrentThread, loadThreads } = useChatStore();

  // Check if viewing in pairing context
  const isPairingContext = !!seasonId;

  // Profile state management
  const {
    activeTab,
    selectedMatch,
    selectedGameType,
    gameTypeOptions,
    setActiveTab,
    setSelectedGame,
    setSelectedGameType,
  } = useProfileState();
  
  const hasInitializedSport = useRef(false);

  // Entry animation values (matching ProfileScreen.tsx pattern)
  const profilePictureEntryOpacity = useRef(new Animated.Value(0)).current;
  const profilePictureEntryTranslateY = useRef(new Animated.Value(-20)).current;
  const infoCardEntryOpacity = useRef(new Animated.Value(0)).current;
  const infoCardEntryTranslateY = useRef(new Animated.Value(30)).current;
  const achievementsEntryOpacity = useRef(new Animated.Value(0)).current;
  const achievementsEntryTranslateY = useRef(new Animated.Value(30)).current;
  const statsEntryOpacity = useRef(new Animated.Value(0)).current;
  const statsEntryTranslateY = useRef(new Animated.Value(30)).current;
  const hasPlayedEntryAnimation = useRef(false);

  // Profile handlers
  const {
    handleGameTypeSelect,
    handleTabPress,
    handleGamePointPress,
  } = useProfileHandlers({
    setSelectedGameType,
    setActiveTab,
    setSelectedGame,
    setModalVisible: () => {}, // No-op since we don't use modal in friend profiles
  });

  const fetchPlayerProfile = useCallback(async (signal?: AbortSignal) => {
    try {
      if (!session?.user?.id || !id) {
        console.log('PlayerProfile: No session or player ID');
        return;
      }

      setIsLoading(true);
      setHasError(false);
      const backendUrl = getBackendBaseURL();

      const authResponse = await authClient.$fetch(`${backendUrl}/api/player/profile/public/${id}`, {
        method: 'GET',
        signal,
      });

      // Check if aborted before updating state
      if (signal?.aborted) return;

      if (authResponse && (authResponse as any).data) {
        const playerData = (authResponse as any).data.data || (authResponse as any).data;
        setProfileData(playerData);

        // Fetch achievements if available
        // TODO: Add achievements endpoint when available
        setAchievements([]);
      }
    } catch (error) {
      // Don't show error toast if request was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('PlayerProfile: Error fetching profile:', error);
      if (!signal?.aborted) {
        setHasError(true);
        toast.error('Error', {
          description: 'Failed to load player profile. Please try again.',
        });
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
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

  const handleChat = async () => {
    // Double-tap guard - prevent multiple chat creation requests
    if (isLoadingChat) return;

    if (!session?.user?.id || !id) {
      toast.error('Error', {
        description: 'Unable to start chat. Please try again.',
      });
      return;
    }

    try {
      setIsLoadingChat(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Check if thread already exists
      const existingThread = threads.find(thread => 
        thread.type === 'direct' && 
        thread.participants.some(p => p.id === id) &&
        thread.participants.some(p => p.id === session.user.id)
      );

      if (existingThread) {
        console.log('PlayerProfile: Found existing thread:', existingThread.id);
        setCurrentThread(existingThread);
      } else {
        console.log('PlayerProfile: No existing thread, creating new one');
        const newThread = await ChatService.createThread(
          session.user.id,
          [id as string],
          false
        );
        
        console.log('PlayerProfile: Created new thread:', newThread.id);
        await loadThreads(session.user.id);
        setCurrentThread(newThread);
      }
      
      // Navigate to dashboard with chat view
      router.push({
        pathname: '/user-dashboard',
        params: { view: 'chat' }
      });
      
    } catch (error) {
      console.error('PlayerProfile: Error handling chat:', error);
      toast.error('Error', {
        description: 'Failed to open chat. Please try again.',
      });
    } finally {
      setIsLoadingChat(false);
    }
  };

  useEffect(() => {
    const abortController = new AbortController();

    if (session?.user?.id && id) {
      // Reset hasInitializedSport when player ID changes
      hasInitializedSport.current = false;
      fetchPlayerProfile(abortController.signal);
    }

    return () => {
      abortController.abort();
    };
  }, [session?.user?.id, id, fetchPlayerProfile]);

  // Entry animation effect (matching ProfileScreen.tsx pattern)
  useEffect(() => {
    if (!isLoading && profileData && !hasPlayedEntryAnimation.current) {
      hasPlayedEntryAnimation.current = true;
      Animated.stagger(80, [
        // Profile picture slides down (from -20 to 0)
        Animated.parallel([
          Animated.spring(profilePictureEntryOpacity, {
            toValue: 1,
            tension: 50,
            friction: 8,
            useNativeDriver: false,
          }),
          Animated.spring(profilePictureEntryTranslateY, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: false,
          }),
        ]),
        // Info card slides up (from +30 to 0)
        Animated.parallel([
          Animated.spring(infoCardEntryOpacity, {
            toValue: 1,
            tension: 50,
            friction: 8,
            useNativeDriver: false,
          }),
          Animated.spring(infoCardEntryTranslateY, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: false,
          }),
        ]),
        // Achievements section slides up
        Animated.parallel([
          Animated.spring(achievementsEntryOpacity, {
            toValue: 1,
            tension: 50,
            friction: 8,
            useNativeDriver: false,
          }),
          Animated.spring(achievementsEntryTranslateY, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: false,
          }),
        ]),
        // Stats section slides up
        Animated.parallel([
          Animated.spring(statsEntryOpacity, {
            toValue: 1,
            tension: 50,
            friction: 8,
            useNativeDriver: false,
          }),
          Animated.spring(statsEntryTranslateY, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: false,
          }),
        ]),
      ]).start();
    }
  }, [
    isLoading,
    profileData,
    profilePictureEntryOpacity,
    profilePictureEntryTranslateY,
    infoCardEntryOpacity,
    infoCardEntryTranslateY,
    achievementsEntryOpacity,
    achievementsEntryTranslateY,
    statsEntryOpacity,
    statsEntryTranslateY,
  ]);

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
        selfAssessedSkillLevels: {},
        skillRatings: {},
        sports: [],
        activeSports: [],
        achievements: [],
        leagueStats: {},
      };

  // Helper function to get rating values from skillRatings
  const getRatingForType = (sport: string, type: 'singles' | 'doubles') => {
    const normalizedSport = sport.toLowerCase();
    const rating = profileData?.skillRatings?.[normalizedSport]?.[type];
    // Ratings are stored divided by 1000 in the database, multiply by 1000 to display
    if (rating !== undefined && rating !== null) {
      return Math.round(rating * 1000);
    }
    return 0;
  };

  // Calculate win rate from league stats
  const calculateWinRate = () => {
    if (leagueStatsData.matchesPlayed === 0) return 0;
    return Math.round((leagueStatsData.wins / leagueStatsData.matchesPlayed) * 100);
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
      ratingBefore: currentRating || 1400,
      opponent: 'No matches played',
      result: 'W' as const,
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
      status: 'upcoming' as const
    }];
  };

  const mockEloData = createEloData();

  // Auto-select first available sport when profile data loads
  useEffect(() => {
    if (!hasInitializedSport.current && userData?.sports && userData.sports.length > 0 && userData.sports[0] !== 'No sports yet') {
      const firstSport = userData.sports[0];
      // Only update if the current activeTab is the default 'Tennis' or not in the sports list
      if (activeTab === 'Tennis' || !userData.sports.includes(activeTab)) {
        setActiveTab(firstSport);
        hasInitializedSport.current = true;
      }
    }
  }, [userData?.sports, activeTab, setActiveTab]);

  const handleRetry = useCallback(() => {
    const abortController = new AbortController();
    fetchPlayerProfile(abortController.signal);
  }, [fetchPlayerProfile]);

  if (isLoading && !profileData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (hasError && !profileData) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.colors.neutral.gray[400]} />
        <Text style={styles.errorText}>Failed to load profile</Text>
        <Pressable style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Tap to Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Refresh Indicator Overlay - visible above header */}
      {refreshing && (
        <View style={styles.refreshOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="transparent"
            colors={["transparent"]}
            progressBackgroundColor="transparent"
          />
        }
      >
        {/* Header with Curve */}
        <ProfileHeaderWithCurve
          onBack={() => router.back()}
          showSettings={false}
        />

        {/* Content */}
        <View style={styles.whiteBackground}>
          {/* Profile Picture */}
          <Animated.View
            style={{
              opacity: profilePictureEntryOpacity,
              transform: [{ translateY: profilePictureEntryTranslateY }],
            }}
          >
            <ProfilePictureSection
              imageUri={profileData?.image}
              isUploading={false}
              isEditable={false}
            />
          </Animated.View>

          {/* Profile Info */}
          <Animated.View
            style={{
              opacity: infoCardEntryOpacity,
              transform: [{ translateY: infoCardEntryTranslateY }],
            }}
          >
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
              isLoadingChat={isLoadingChat}
            />
          </Animated.View>

          {/* Achievements */}
          <Animated.View
            style={{
              opacity: achievementsEntryOpacity,
              transform: [{ translateY: achievementsEntryTranslateY }],
            }}
          >
            <ProfileAchievementsCard
              achievements={userData.achievements || []}
            />
          </Animated.View>

          {/* Stats Section */}
          <Animated.View
            style={{
              opacity: statsEntryOpacity,
              transform: [{ translateY: statsEntryTranslateY }],
            }}
          >
            {/* Sports */}
            <ProfileSportsSection
              sports={userData.sports || []}
              activeTab={activeTab}
              onTabPress={handleTabPress}
            />

            {/* Skill Level */}
            <ProfileSkillLevelCard
              skillLevel={userData.skillLevel}
              selfAssessedSkillLevels={userData.selfAssessedSkillLevels}
              activeSport={activeTab}
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
              selectedMatch={selectedMatch}
              profileData={profileData}
            />

            {/* Match History Button */}
            <MatchHistoryButton
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toast('Match history coming soon!');
              }}
            />

            {/* Division Standings - Shows player's current divisions */}
            {id && (
              <PlayerDivisionStandings
                userId={id as string}
                showOnlyCurrentDivisions={false}
                sportFilter={activeTab}
                gameTypeFilter={selectedGameType}
                onStatsCalculated={setLeagueStatsData}
              />
            )}

            {/* League Stats Section */}
            <ProfileLeagueStatsCard
              activeTab={activeTab}
              selectedGameType={selectedGameType}
              gameTypeOptions={gameTypeOptions}
              onGameTypeSelect={handleGameTypeSelect}
              winRate={calculateWinRate()}
              wins={leagueStatsData.wins}
              losses={leagueStatsData.losses}
            />
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  scrollView: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.neutral.gray[600],
    fontFamily: theme.typography.fontFamily.primary,
    marginTop: theme.spacing.md,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.neutral.gray[600],
    fontFamily: theme.typography.fontFamily.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.spacing.md,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: '600',
  },
  refreshOverlay: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  whiteBackground: {
    backgroundColor: '#ffffff',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing['2xl'],
    minHeight: '100%',
  },
});
