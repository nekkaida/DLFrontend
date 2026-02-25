import BackButtonIcon from '@/assets/icons/back-button.svg';
import LeagueInfoIcon from '@/assets/icons/league-info.svg';
import { ManageTeamButton } from '@/features/pairing/components';
import { useActivePartnership } from '@/features/pairing/hooks';
import { useSession } from '@/lib/auth-client';
import { NavBar } from '@/shared/components/layout';
import { SportSwitcher } from '@/shared/components/ui/SportSwitcher';
import { SeasonCardSkeleton } from '@/src/components/SeasonCardSkeleton';
import { Category, CategoryService } from '@/src/features/dashboard-user/services/CategoryService';
import { Season, SeasonService } from '@/src/features/dashboard-user/services/SeasonService';
import { useUserPartnerships } from '@/src/features/pairing/hooks/useUserPartnerships';
import { FiuuPaymentService } from '@/src/features/payments/services/FiuuPaymentService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Dimensions, Image, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';
import { PaymentOptionsBottomSheet } from '../components';
import { useLeagueData } from '../hooks/useLeagueData';
import { useSeasonSelection } from '../hooks/useSeasonSelection';
import { useUserProfile } from '../hooks/useUserProfile';
import { normalizeCategoriesFromSeason } from '../utils/categoryNormalization';
import { checkQuestionnaireStatus, getSeasonSport } from '../utils/questionnaireCheck';

const { width } = Dimensions.get('window');

const LEAGUE_SEASONS_CACHE_KEY_PREFIX = 'league_seasons_summary_';

const isSmallScreen = width < 375;
const isTablet = width > 768;

interface LeagueDetailsScreenProps {
  leagueId: string;
  leagueName?: string;
  sport?: 'pickleball' | 'tennis' | 'padel';
}

export default function LeagueDetailsScreen({
  leagueId,
  leagueName = 'League',
  sport = 'pickleball'
}: LeagueDetailsScreenProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = React.useState(2);
  const [showPaymentOptions, setShowPaymentOptions] = React.useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = React.useState(false);
  const [selectedSport, setSelectedSport] = React.useState<'pickleball' | 'tennis' | 'padel'>('pickleball');
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [showSeasonsSkeleton, setShowSeasonsSkeleton] = React.useState(false);
  const hasInitializedSeasonsRef = React.useRef(false);
  const isManualRefreshRef = React.useRef(false);
  const insets = useSafeAreaInsets();
  const STATUS_BAR_HEIGHT = insets.top;

  const userId = session?.user?.id;

  // Use custom hook for user profile and gender management
  const { profileData, userGender, fetchProfileData, fetchUserGender } = useUserProfile(userId);

  // Helper function to check if a category is visible - all categories are now visible to all users
  const isCategoryVisibleToUser = React.useCallback((category: any): boolean => {
    return category !== null && category !== undefined;
  }, []);

  // Helper function to check if user can JOIN a category based on gender restrictions
  const canUserJoinCategory = React.useCallback((category: any): boolean => {
    if (!category) return false;

    const genderCategory = category.gender_category?.toUpperCase() || category.genderCategory?.toUpperCase();
    const genderRestriction = category.genderRestriction?.toUpperCase();
    const categoryGender = genderCategory || genderRestriction;
    const isDoubles = CategoryService.getEffectiveGameType(category, 'SINGLES') === 'DOUBLES';

    // If user gender is not yet loaded, allow joining (will be validated on backend)
    if (!userGender) {
      return true;
    }

    const normalizedUserGender = userGender.toUpperCase();

    // OPEN categories allow all genders - check this FIRST
    if (categoryGender === 'OPEN') {
      return true;
    }

    if (normalizedUserGender === 'FEMALE') {
      if (categoryGender === 'FEMALE' || categoryGender === 'WOMEN') return true;
      if (categoryGender === 'MIXED' && isDoubles) return true;
      return false;
    }

    if (normalizedUserGender === 'MALE') {
      if (categoryGender === 'MALE' || categoryGender === 'MEN') return true;
      if (categoryGender === 'MIXED' && isDoubles) return true;
      return false;
    }

    return false;
  }, [userGender]);

  // Use custom hook for league data management
  const { league, seasons, categories, isLoading, error, fetchAllData } = useLeagueData(
    leagueId,
    userGender,
    isCategoryVisibleToUser
  );

  // Use custom hook for season selection management
  const { selectedCategoryId, setSelectedCategoryId, selectedSeason, setSelectedSeason } = useSeasonSelection(categories);

  // Use custom hook for user partnerships management
  const { partnerships, loading: partnershipsLoading } = useUserPartnerships(userId);

  // Animated scroll value for collapsing header (using reanimated for native thread performance)
  const scrollY = useSharedValue(0);

  // Entry animation values (using reanimated for consistency)
  const headerEntryOpacity = useSharedValue(0);
  const headerEntryTranslateY = useSharedValue(-20);
  const infoCardEntryOpacity = useSharedValue(0);
  const infoCardEntryTranslateY = useSharedValue(30);
  const categoriesEntryOpacity = useSharedValue(0);
  const categoriesEntryTranslateY = useSharedValue(30);
  const seasonsEntryOpacity = useSharedValue(0);
  const seasonsEntryTranslateY = useSharedValue(30);

  // Reset entry animations to hidden state when loading starts or when navigating to different league/sport
  // This ensures animations play fresh each time data loads
  React.useEffect(() => {
    if (isLoading) {
      headerEntryOpacity.value = 0;
      headerEntryTranslateY.value = -20;
      infoCardEntryOpacity.value = 0;
      infoCardEntryTranslateY.value = 30;
      categoriesEntryOpacity.value = 0;
      categoriesEntryTranslateY.value = 30;
      seasonsEntryOpacity.value = 0;
      seasonsEntryTranslateY.value = 30;
    }
  }, [isLoading]);

  // Constants for header animation
  const TOP_HEADER_HEIGHT = STATUS_BAR_HEIGHT + (isSmallScreen ? 36 : isTablet ? 44 : 40);
  const HEADER_MAX_HEIGHT = 180; // Full header height
  const HEADER_MIN_HEIGHT = 80; // Collapsed header height
  const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
  const COLLAPSE_START_THRESHOLD = 40; // Start collapsing after scrolling 50px
  const COLLAPSE_END_THRESHOLD = COLLAPSE_START_THRESHOLD + HEADER_SCROLL_DISTANCE; // End of collapse range
  
  // Set selected sport based on route param
  React.useEffect(() => {
    setSelectedSport(sport);
  }, [sport]);

  React.useEffect(() => {
    if (!showPaymentOptions) {
      setIsProcessingPayment(false);
    }
  }, [showPaymentOptions]);

  // Fetch all data on mount - trigger when dependencies change
  React.useEffect(() => {
    if (leagueId && userGender !== undefined) {
      fetchAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagueId, userGender]); // fetchAllData omitted to break circular dependency

  const filterCategoriesByGender = (categories: Category[], userGender: string | null): Category[] => {
    return categories.filter(category => isCategoryVisibleToUser(category));
  };

  // Smart skeleton: Update cache with current seasons summary
  const updateSeasonsCache = React.useCallback(async () => {
    if (!leagueId || seasons.length === 0) return;

    try {
      const cacheKey = `${LEAGUE_SEASONS_CACHE_KEY_PREFIX}${leagueId}`;
      const newSummary = {
        count: seasons.length,
        seasonIds: seasons.map(s => s.id).sort().join(','),
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(newSummary));
    } catch (error) {
      console.error('Error updating seasons cache:', error);
    }
  }, [leagueId, seasons]);

  // Smart skeleton: Control skeleton display based on loading state and cache
  React.useEffect(() => {
    let isMounted = true;

    const handleSkeletonDisplay = async () => {
      try {
        // Skip skeleton logic during manual refresh
        if (isManualRefreshRef.current) return;

        // Only trigger skeleton on first load when we haven't initialized yet
        if (isLoading && !hasInitializedSeasonsRef.current) {
          // First load ever - check if we have cached data
          const cacheKey = `${LEAGUE_SEASONS_CACHE_KEY_PREFIX}${leagueId}`;
          const cachedSummaryStr = await AsyncStorage.getItem(cacheKey);

          if (!isMounted) return;

          if (!cachedSummaryStr) {
            // No cache = truly first time, show skeleton
            setShowSeasonsSkeleton(true);
          }

          hasInitializedSeasonsRef.current = true;
        } else if (!isLoading && seasons.length > 0) {
          if (!isMounted) return;
          // Data loaded - hide skeleton and update cache
          setShowSeasonsSkeleton(false);
          await updateSeasonsCache();
        } else if (!isLoading && seasons.length === 0 && !error) {
          if (!isMounted) return;
          // No seasons but no error - hide skeleton
          setShowSeasonsSkeleton(false);
        }
      } catch (error) {
        console.error('Error in skeleton display logic:', error);
        if (isMounted) {
          setShowSeasonsSkeleton(false); // Fail gracefully
        }
      }
    };

    handleSkeletonDisplay();

    return () => {
      isMounted = false;
    };
  }, [isLoading, seasons, leagueId, error, updateSeasonsCache]);

  // Entry animations - trigger staggered fade-in and slide-up when content loads
  // Using reanimated for smooth native thread animations
  // Runs whenever data becomes ready - animations will only visually play if values aren't already at target
  React.useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    if (!isLoading && !error && league) {
      const springConfig = { damping: 15, stiffness: 100, mass: 0.8 };
      const staggerDelay = 80;

      // Header animation (immediate)
      headerEntryOpacity.value = withSpring(1, springConfig);
      headerEntryTranslateY.value = withSpring(0, springConfig);

      // Info card animation (delayed by 80ms)
      timeouts.push(setTimeout(() => {
        infoCardEntryOpacity.value = withSpring(1, springConfig);
        infoCardEntryTranslateY.value = withSpring(0, springConfig);
      }, staggerDelay));

      // Categories animation (delayed by 160ms)
      timeouts.push(setTimeout(() => {
        categoriesEntryOpacity.value = withSpring(1, springConfig);
        categoriesEntryTranslateY.value = withSpring(0, springConfig);
      }, staggerDelay * 2));

      // Seasons animation (delayed by 240ms)
      timeouts.push(setTimeout(() => {
        seasonsEntryOpacity.value = withSpring(1, springConfig);
        seasonsEntryTranslateY.value = withSpring(0, springConfig);
      }, staggerDelay * 3));
    }

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [isLoading, error, league]);

  const handleTabPress = (tabIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tabIndex);
    
    // Navigate based on tab index
    // Tab indices: 0=Connect, 1=Friendly, 2=Leagues, 3=My Games, 4=Chat
    if (tabIndex === 0) {
      // Navigate to Connect
      router.push({
        pathname: '/user-dashboard' as any,
        params: { view: 'connect', sport: selectedSport }
      });
    } else if (tabIndex === 1) {
      // Navigate to Friendly
      router.push({
        pathname: '/user-dashboard' as any,
        params: { view: 'friendly', sport: selectedSport }
      });
    } else if (tabIndex === 2) {
      // Navigate to Leagues (main dashboard)
      router.push({
        pathname: '/user-dashboard' as any,
        params: { view: 'dashboard', sport: selectedSport }
      });
    } else if (tabIndex === 3) {
      // Navigate to My Games
      router.push({
        pathname: '/user-dashboard' as any,
        params: { view: 'myGames', sport: selectedSport }
      });
    } else if (tabIndex === 4) {
      // Navigate to Chat
      router.push({
        pathname: '/user-dashboard' as any,
        params: { view: 'chat', sport: selectedSport }
      });
    }
  };

  const handleCategoryPress = (categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategoryId(categoryId);
  };

  const handleRegisterPress = (season: Season) => {
    // Determine the season's sport type
    const seasonSport = getSeasonSport(season) || sport || 'pickleball';
    
    // Check if user has completed questionnaire for this sport
    if (profileData) {
      const questionnaireStatus = checkQuestionnaireStatus(profileData, seasonSport);
      
      if (!questionnaireStatus.hasSelectedSport || !questionnaireStatus.hasCompletedQuestionnaire) {
        // User hasn't selected/completed questionnaire for this sport
        // Navigate to complete questionnaire screen
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({
          pathname: '/user-dashboard/complete-questionnaire' as any,
          params: {
            sport: seasonSport,
            seasonId: season.id,
            leagueId: leagueId || '',
            returnPath: 'league-details'
          }
        });
        return;
      }
    }
    
    // Check if this is a doubles season by checking category name
    const normalizedCategories = normalizeCategoriesFromSeason(season);
    const isDoublesSeason = normalizedCategories.some(cat => 
      cat?.name?.toLowerCase().includes('doubles') || 
      cat?.matchFormat?.toLowerCase().includes('doubles') || 
      (cat as any)?.game_type === 'DOUBLES'
    );
    
    if (isDoublesSeason) {
      // Navigate to doubles team pairing screen
      router.push({
        pathname: '/user-dashboard/doubles-team-pairing' as any,
        params: {
          seasonId: season.id,
          seasonName: season.name,
          leagueId: leagueId,
          sport: seasonSport
        }
      });
    } else {
      // Check if payment is required for this season
      const isFreeEntry = !season.paymentRequired || !season.entryFee || season.entryFee === 0;

      if (isFreeEntry) {
        // Free season - register directly without payment flow
        handlePayLater(season);
      } else {
        // Paid season - show payment options
        setSelectedSeason(season);
        setShowPaymentOptions(true);
      }
    }
  };

  const handleJoinWaitlistPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Join Waitlist button pressed');
    toast.info('Waitlist feature coming soon!');
  };

  // Helper to convert Date | string | undefined to string for router params
  const dateToParamString = (date: string | Date | undefined): string | undefined => {
    if (!date) return undefined;
    return typeof date === 'string' ? date : date.toISOString();
  };

  const handleViewStandingsPress = (season: Season) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Get category info for display
    const normalizedCategories = normalizeCategoriesFromSeason(season);
    const seasonCategory = normalizedCategories && normalizedCategories.length > 0 
      ? normalizedCategories[0] 
      : null;
    const categoryDisplayName = seasonCategory ? seasonCategory.name || '' : '';
    
    router.push({
      pathname: '/standings' as any,
      params: {
        seasonId: season.id,
        seasonName: season.name,
        leagueId: leagueId,
        leagueName: league?.name || leagueName,
        categoryName: categoryDisplayName,
        sportType: selectedSport?.toUpperCase() || 'PICKLEBALL',
        startDate: dateToParamString(season.startDate),
        endDate: dateToParamString(season.endDate),
      }
    });
  };

  const handleClosePaymentOptions = () => {
    setShowPaymentOptions(false);
    setSelectedSeason(null);
  };

  const handlePayNow = async (season: Season) => {
    if (!userId) {
      toast.error('You must be logged in to continue');
      return;
    }

    if (isProcessingPayment) return;

    try {
      setIsProcessingPayment(true);
      console.log('Starting FIUU payment for season:', season.id);
      const checkout = await FiuuPaymentService.createCheckout(season.id, userId);
      const payload = encodeURIComponent(JSON.stringify({
        ...checkout,
        returnTo: {
          pathname: '/user-dashboard/league-details',
          params: {
            leagueId: leagueId,
            leagueName: league?.name || leagueName,
            sport: sport || 'pickleball'
          },
          dismissCount: 1 // Go back 1 screen: fiuu-checkout -> league-details
        }
      }));

      // Close payment options sheet before navigating
      setShowPaymentOptions(false);

      router.push({
        pathname: '/payments/fiuu-checkout',
        params: { payload },
      });
    } catch (error: any) {
      console.error('Error launching FIUU payment:', error);
      const message = error?.message || 'Unable to start payment. Please try again.';
      toast.error(message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePayLater = async (season: Season) => {
    if (!userId) {
      toast.error('You must be logged in to register');
      return;
    }

    if (!SeasonService.isRegistrationOpen(season)) {
      toast.error('Registration deadline has passed for this season');
      return;
    }

    try {
      console.log('Registering user for season (Pay Later):', season.id);
      const success = await SeasonService.registerForSeason(season.id, userId, true);

      if (success) {
        console.log('User registered successfully');
        toast.success('Registered successfully!');
        fetchAllData(); // Refresh data
      } else {
        console.warn('Registration failed');
        toast.error('Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Error registering:', err);
      toast.error('An error occurred while registering.');
    }
  };

  // Get filtered seasons for selected category (no longer filtered by gender - all users see all seasons)
  const getFilteredSeasons = () => {

    let filtered = seasons;

    // Only filter out seasons with no categories
    filtered = filtered.filter(season => {
      const normalizedCategories = normalizeCategoriesFromSeason(season);
      const hasCategories = normalizedCategories && normalizedCategories.length > 0;
      
      if (!hasCategories) {
        console.log(`   Filtering out season ${season.id} (${season.name}) - no categories`);
      }
      
      return hasCategories;
    });
    
    // Filter by selected category if one is selected
    if (selectedCategoryId) {
      filtered = filtered.filter(season => {
        const normalizedCategories = normalizeCategoriesFromSeason(season);
        const seasonCategoryIds = normalizedCategories.map(c => c?.id).filter(Boolean);
        const matches = seasonCategoryIds.includes(selectedCategoryId);
        
        // console.log(`   Season ${season.name} categories:`, seasonCategoryIds, 'matches selected:', matches);
        
        return matches;
      });
    }    
    return filtered;
  };

  // Get current selected category
  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
  const isDoublesCategory = selectedCategory
    ? CategoryService.getEffectiveGameType(selectedCategory, 'SINGLES') === 'DOUBLES'
    : false;

  const { partnership } = useActivePartnership(
    isDoublesCategory && selectedSeason ? selectedSeason.id : null,
    userId
  );

  // Group seasons by status
  const groupedSeasons = SeasonService.groupSeasonsByStatus(getFilteredSeasons());
  const currentSeasons = groupedSeasons.active;
  const upcomingSeasons = groupedSeasons.upcoming;
  const pastSeasons = groupedSeasons.finished;

  const formatSeasonDate = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const renderSeasonCard = (season: Season) => {
    const userMembership = season.memberships?.find((m: any) => m.userId === userId);
    const isUserRegistered = !!userMembership;

    const getButtonConfig = () => {
      // For doubles seasons, check if user needs to complete team registration/payment
      // Handle both singular and plural category fields
      const normalizedCategories = normalizeCategoriesFromSeason(season);
      const isDoublesSeason = normalizedCategories.some(cat =>
        cat?.name?.toLowerCase().includes('doubles') ||
        cat?.matchFormat?.toLowerCase().includes('doubles') ||
        (cat as any)?.game_type === 'DOUBLES'
      );

      // Check if user can join this season based on gender restrictions
      const canJoin = normalizedCategories.some(cat => canUserJoinCategory(cat));

      // If doubles season and membership is PENDING (not paid), show Register Team
      if (isDoublesSeason && userMembership && userMembership.status === 'PENDING') {
        return {
          text: 'Register Team',
          color: '#FEA04D',
          onPress: () => handleRegisterPress(season)
        };
      }

      // If doubles season and membership was REMOVED (player left), they must re-register and pay again
      if (isDoublesSeason && userMembership && userMembership.status === 'REMOVED') {
        return {
          text: 'Join Season',
          color: '#FEA04D',
          onPress: () => handleRegisterPress(season)
        };
      }

      if (isUserRegistered) {
        // Check if user has been assigned to a division
        const isUserAssignedToDivision = !!(userMembership && userMembership.divisionId);
        
        if (!isUserAssignedToDivision) {
          return {
            text: 'Awaiting division assignment by admin',
            color: '#FEA04D',
            onPress: () => toast.info('Please wait for admin to assign you to a division before viewing the leaderboard.')
          };
        }
        
        return {
          text: 'View Leaderboard',
          color: '#FEA04D',
          onPress: () => handleViewStandingsPress(season)
        };
      }

      if (season.status === 'ACTIVE') {
        // Check gender restriction - show "View Only" if user cannot join
        if (!canJoin) {
          return {
            text: 'View Only',
            color: '#B2B2B2',
            onPress: () => toast.info('This season is restricted to a different gender')
          };
        }
        return {
          text: 'Join Season',
          color: '#FEA04D',
          onPress: () => handleRegisterPress(season)
        };
      }

      if (season.status === 'UPCOMING') {
        // Check gender restriction for waitlist too
        if (!canJoin) {
          return {
            text: 'View Only',
            color: '#B2B2B2',
            onPress: () => toast.info('This season is restricted to a different gender')
          };
        }
        return {
          text: 'Join Waitlist',
          color: '#F2F2F2',
          onPress: handleJoinWaitlistPress
        };
      }

      return {
        text: 'View Standings',
        color: '#B2B2B2',
        onPress: () => handleViewStandingsPress(season)
      };
    };

    const buttonConfig = getButtonConfig();

    // Get category for this season - handle both singular and plural
    const normalizedCategories = normalizeCategoriesFromSeason(season);

    // Check if user has partnership for this season
    const hasPartnership = partnerships.has(season.id);
    const partnership = partnerships.get(season.id);

    // Determine if this is a doubles season
    const isDoublesSeason = normalizedCategories.some(cat =>
      cat?.name?.toLowerCase().includes('doubles') ||
      cat?.matchFormat?.toLowerCase().includes('doubles') ||
      (cat as any)?.game_type === 'DOUBLES'
    );

    // Show manage team button for doubles seasons with active partnership
    const showManageTeam = isDoublesSeason && hasPartnership && isUserRegistered;
    const seasonCategory = normalizedCategories && normalizedCategories.length > 0 
      ? normalizedCategories[0] 
      : null;
    const categoryDisplayName = seasonCategory 
      ? seasonCategory.name || ''
      : '';

    return (
      <TouchableOpacity
        key={season.id}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({
            pathname: '/user-dashboard/season-details' as any,
            params: {
              seasonId: season.id,
              seasonName: season.name,
              leagueId: leagueId,
              sport: sport
            }
          });
        }}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={getSeasonCardGradientColors(sport)}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.seasonCardWrapper}
        >
          <View style={styles.seasonCard}>
            <View style={styles.seasonCardHeader}>
            <Text style={styles.seasonTitle}>{season.name}</Text>
          {categoryDisplayName && (
            <LinearGradient
              colors={getCategoryChipGradientColors(sport)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.categoryChip}
            >
              <Text style={styles.categoryChipText}>{categoryDisplayName}</Text>
            </LinearGradient>
          )}
          </View>

          {/* Date row - moved below header */}
          {season.startDate && season.endDate && (
            <View style={styles.dateRow}>
              <Text style={styles.dateText}>
                Start date: <Text style={styles.dateTextBold}>{formatSeasonDate(season.startDate)}</Text> End date: <Text style={styles.dateTextBold}>{formatSeasonDate(season.endDate)}</Text>
              </Text>
            </View>
          )}

          <View style={styles.seasonPlayerCountContainer}>
            <View style={styles.statusCircle} />
            <Text style={styles.seasonPlayerCount}>
              {season._count?.memberships || season.registeredUserCount || 0} players
            </Text>
          </View>
          
          {/* Profile pictures */}
          {season.memberships && season.memberships.length > 0 && (
            <TouchableOpacity
              style={styles.seasonProfilePicturesContainer}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({
                  pathname: '/user-dashboard/players-list',
                  params: {
                    contextType: 'season',
                    contextId: season.id,
                    contextName: season.name,
                    sport: sport,
                    totalPlayers: season._count?.memberships || season.registeredUserCount || 0,
                  }
                });
              }}
              activeOpacity={0.7}
            >
              {season.memberships.slice(0, 6).map((membership, index: number) => {
                if (!membership.user) return null;
                return (
                  <View key={membership.id} style={[styles.seasonMemberProfilePicture, index > 0 && styles.seasonMemberProfilePictureOverlap]}>
                    {membership.user.image ? (
                      <Image
                        source={{ uri: membership.user.image }}
                        style={styles.seasonMemberProfileImage}
                      />
                    ) : (
                      <View style={styles.defaultSeasonMemberProfileImage}>
                        <Text style={styles.defaultSeasonMemberProfileText}>
                          {membership.user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
              {season._count?.memberships && season._count.memberships > 6 && (
                <View style={[styles.seasonRemainingCount, styles.seasonMemberProfilePictureOverlap]}>
                  <Text style={styles.seasonRemainingCountText}>
                    +{season._count.memberships - 6}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {season.regiDeadline && (
            <View style={styles.seasonDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailText}>
                  Last registration: {formatSeasonDate(season.regiDeadline)}
                </Text>
              </View>
            </View>
          )}

          {season.paymentRequired && (
            <View style={styles.entryFeeContainer}>
            <Text style={styles.entryFeeText}>
              Entry fee: <Text style={styles.entryFeeAmount}>RM{typeof season.entryFee === 'string' ? parseFloat(season.entryFee).toFixed(2) : season.entryFee.toFixed(2)}</Text>
            </Text>
            </View>
          )}

          <View style={styles.buttonRow}>
            <View style={styles.seasonCardButtons}>
              <TouchableOpacity
                style={[
                  styles.registerButton,
                  styles.primaryButton,
                  { backgroundColor: buttonConfig.color }
                ]}
                onPress={buttonConfig.onPress}
                activeOpacity={0.8}
              >
                <Text style={styles.registerButtonText}>{buttonConfig.text}</Text>
              </TouchableOpacity>

              {showManageTeam && partnership && (
                <ManageTeamButton
                  seasonId={season.id}
                  partnershipId={partnership.id}
                />
              )}
            </View>
            {season.status === 'ACTIVE' && !isUserRegistered && (
              <Text style={styles.registrationOpenText}>
                Registration{'\n'}open
              </Text>
            )}
          </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const getSportConfig = () => {
    if (selectedSport === 'tennis') {
      return {
        gradient: ['#B3CFBC', '#FFFFFF'] as const,
        color: '#008000',
        name: 'Tennis'
      };
    }
    if (selectedSport === 'padel') {
      return {
        gradient: ['#4DABFE', '#FFFFFF'] as const,
        color: '#4DABFE',
        name: 'Padel'
      };
    }
    return {
      gradient: ['#B98FAF', '#FFFFFF'] as const,
      color: '#A04DFE',
      name: 'Pickleball'
    };
  };

  const sportConfig = getSportConfig();

  const getHeaderGradientColors = (sport: 'pickleball' | 'tennis' | 'padel'): [string, string] => {
    switch (sport) {
      case 'tennis':
        return ['#A2E047', '#587A27'];
      case 'padel':
        return ['#4DABFE', '#2E6698'];
      case 'pickleball':
      default:
        return ['#A04DFE', '#602E98'];
    }
  };

  const getSeasonCardGradientColors = (sport: 'pickleball' | 'tennis' | 'padel'): [string, string] => {
    switch (sport) {
      case 'tennis':
        return ['#A2E047', '#FEA04D'];
      case 'padel':
        return ['#4DABFE', '#FEA04D'];
      case 'pickleball':
      default:
        return ['#A04DFE', '#FEA04D'];
    }
  };

  const getCategoryChipGradientColors = (sport: 'pickleball' | 'tennis' | 'padel'): [string, string] => {
    switch (sport) {
      case 'tennis':
        return ['#A2E047', '#729E32'];
      case 'padel':
        return ['#4DABFE', '#377FBF'];
      case 'pickleball':
      default:
        return ['#A04DFE', '#602E98'];
    }
  };

  // Helper function to get available sports for SportSwitcher
  const getUserSelectedSports = () => {
    return ["pickleball", "tennis", "padel"];
  };

  // Refresh profile data when screen comes into focus (e.g., after completing questionnaire)
  useFocusEffect(
    React.useCallback(() => {
      const refreshData = async () => {
        // Fetch profile data first (which also updates gender)
        await fetchProfileData();
        // Then refresh league/season data to show updated membership status
        if (leagueId) {
          await fetchAllData();
        }
      };
      refreshData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchProfileData, leagueId, fetchAllData])
  );

  // Set selected sport based on route param
  React.useEffect(() => {
    setSelectedSport(sport);
  }, [sport]);

  // Pull-to-refresh handler - never show skeleton on manual refresh
  const onRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    isManualRefreshRef.current = true; // Flag manual refresh to skip skeleton logic
    setShowSeasonsSkeleton(false); // Never show skeleton on manual refresh
    try {
      // Fetch profile data first (which also updates gender), then fetch league data
      // This ensures categories are properly filtered with the correct gender
      await fetchProfileData();
      await fetchAllData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
      isManualRefreshRef.current = false; // Clear manual refresh flag
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProfileData, fetchAllData]);

  // Animated styles for collapsing header using reanimated (runs on native UI thread)
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, COLLAPSE_START_THRESHOLD, COLLAPSE_END_THRESHOLD],
      [HEADER_MAX_HEIGHT, HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
      Extrapolation.CLAMP
    );
    return { height };
  });

  const leagueNameAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, COLLAPSE_START_THRESHOLD, COLLAPSE_START_THRESHOLD + (HEADER_SCROLL_DISTANCE * 0.7)],
      [1, 1, 0],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      scrollY.value,
      [0, COLLAPSE_START_THRESHOLD, COLLAPSE_START_THRESHOLD + (HEADER_SCROLL_DISTANCE * 0.7)],
      [1, 1, 0.8],
      Extrapolation.CLAMP
    );
    return { opacity, transform: [{ scale }] };
  });

  const infoContainerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, COLLAPSE_START_THRESHOLD, COLLAPSE_START_THRESHOLD + (HEADER_SCROLL_DISTANCE * 0.5)],
      [1, 1, 0],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [0, COLLAPSE_START_THRESHOLD, COLLAPSE_START_THRESHOLD + (HEADER_SCROLL_DISTANCE * 0.5)],
      [0, 0, -20],
      Extrapolation.CLAMP
    );
    return { opacity, transform: [{ translateY }] };
  });

  const collapsedLeagueNameAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, COLLAPSE_START_THRESHOLD + (HEADER_SCROLL_DISTANCE * 0.7), COLLAPSE_END_THRESHOLD],
      [0, 0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const collapsedPlayerCountAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, COLLAPSE_START_THRESHOLD + (HEADER_SCROLL_DISTANCE * 0.5), COLLAPSE_END_THRESHOLD],
      [0, 0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  // Entry animation styles using reanimated
  const headerEntryAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: headerEntryOpacity.value,
      transform: [{ translateY: headerEntryTranslateY.value }],
    };
  });

  const infoCardEntryAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: infoCardEntryOpacity.value,
      transform: [{ translateY: infoCardEntryTranslateY.value }],
    };
  });

  const categoriesEntryAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: categoriesEntryOpacity.value,
      transform: [{ translateY: categoriesEntryTranslateY.value }],
    };
  });

  const seasonsEntryAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: seasonsEntryOpacity.value,
      transform: [{ translateY: seasonsEntryTranslateY.value }],
    };
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header with profile picture, sport switcher */}
      <View style={[styles.headerContainer, { paddingTop: STATUS_BAR_HEIGHT }]}>
        <TouchableOpacity 
          style={styles.headerProfilePicture}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/profile');
          }}
        >
            {(profileData?.image || session?.user?.image) ? (
              <Image 
                source={{ uri: profileData?.image || session?.user?.image }}
                style={styles.headerProfileImage}
            />
          ) : (
            <View style={styles.defaultHeaderAvatarContainer}>
              <Text style={styles.defaultHeaderAvatarText}>
                {(profileData?.name || session?.user?.name)?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        
        <SportSwitcher
          currentSport={selectedSport}
          availableSports={getUserSelectedSports()}
          onSportChange={(newSport) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({
              pathname: '/user-dashboard' as any,
              params: { sport: newSport }
            });
          }}
        />
        
        <View style={styles.headerRight} />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.contentBox}>
        {isLoading && userGender === undefined ? (
          // Only show full-page spinner when BOTH loading AND no gender
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={sportConfig.color} />
            <Text style={styles.loadingText}>Loading league details...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchAllData}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Animated.View
              style={[
                styles.gradientHeaderContainer,
                headerAnimatedStyle,
                headerEntryAnimatedStyle,
              ]}
            >
              <LinearGradient
                colors={getHeaderGradientColors(sport)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.leagueHeaderGradient, { flex: 1 }]}
              >
                <View style={styles.leagueHeaderContent}>
                  <View style={styles.topRow}>
                    <View style={styles.backButtonContainer}>
                      <TouchableOpacity 
                        style={styles.backButtonIcon}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          router.back();
                        }}
                      >
                        <BackButtonIcon width={12} height={19} />
                      </TouchableOpacity>
                    </View>
                    <Animated.View
                      style={[
                        styles.leagueNameContainer,
                        leagueNameAnimatedStyle,
                      ]}
                    >
                      <Text style={styles.leagueName} numberOfLines={2}>{league?.name || leagueName}</Text>
                    </Animated.View>
                    {/* Collapsed header content */}
                    <Animated.View
                      style={[
                        styles.collapsedHeaderContent,
                        collapsedLeagueNameAnimatedStyle,
                      ]}
                    >
                      <Text style={styles.collapsedLeagueName} numberOfLines={1}>
                        {league?.name || leagueName}
                      </Text>
                      <Animated.View
                        style={[
                          styles.collapsedPlayerCountContainer,
                          collapsedPlayerCountAnimatedStyle,
                        ]}
                      >
                        <View style={styles.statusCircle} />
                        <Text style={styles.collapsedPlayerCount}>
                          {league?.totalSeasonMemberships || 0} players
                        </Text>
                      </Animated.View>
                    </Animated.View>
                  </View>
                  <Animated.View
                    style={[
                      styles.leagueInfoContainer,
                      infoContainerAnimatedStyle,
                    ]}
                  >
                    <View style={styles.playerCountContainer}>
                      <View style={styles.statusCircle} />
                      <Text style={styles.playerCount}>
                        {league?.totalSeasonMemberships || 0} players
                      </Text>
                    </View>
                    
                    {/* Profile pictures */}
                    {league?.memberships && league.memberships.length > 0 && (
                      <TouchableOpacity
                        style={styles.profilePicturesContainer}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          router.push({
                            pathname: '/user-dashboard/players-list',
                            params: {
                              contextType: 'league',
                              contextId: leagueId,
                              contextName: league?.name || leagueName,
                              sport: sport,
                              totalPlayers: league?.totalSeasonMemberships || league?._count?.memberships || 0,
                            }
                          });
                        }}
                        activeOpacity={0.7}
                      >
                        {league.memberships.slice(0, 6).map((membership: any, index: number) => {
                          if (!membership.user) return null;
                          return (
                            <View key={membership.id} style={[styles.memberProfilePicture, index > 0 && styles.memberProfilePictureOverlap]}>
                              {membership.user.image ? (
                                <Image
                                  source={{ uri: membership.user.image }}
                                  style={styles.memberProfileImage}
                                />
                              ) : (
                                <View style={styles.defaultMemberProfileImage}>
                                  <Text style={styles.defaultMemberProfileText}>
                                    {membership.user.name?.charAt(0)?.toUpperCase() || 'U'}
                                  </Text>
                                </View>
                              )}
                            </View>
                          );
                        })}
                        {league._count?.memberships && league._count.memberships > 6 && (
                          <View style={[styles.remainingCount, styles.memberProfilePictureOverlap]}>
                            <Text style={styles.remainingCountText}>
                              +{league._count.memberships - 6}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    )}
                  </Animated.View>
                </View>
              </LinearGradient>
            </Animated.View>

            <ScrollView
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={onRefresh}
                  tintColor={sportConfig.color}
                  colors={[sportConfig.color]}
                />
              }
            >
            <View style={styles.scrollTopSpacer} />
            {/* League Info Card */}
            <Animated.View style={infoCardEntryAnimatedStyle}>
              <View style={styles.leagueInfoCard}>
                <View style={styles.leagueInfoContent}>
                  <LeagueInfoIcon width={43} height={43} style={styles.leagueInfoIcon} />
                  <View style={styles.leagueInfoTextContainer}>
                    <Text style={styles.leagueInfoTitle}>League Info</Text>
                    <Text style={styles.leagueInfoText}>
                      {league?.description || 'This is a friendly, competitive flex league. Join a league to meet new players in your area, stay active, and level up your game. All adult players are welcome to join!'}
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Category Filter Buttons */}
            {categories.length > 0 && (
              <Animated.View style={categoriesEntryAnimatedStyle}>
                <View style={styles.categoriesContainer}>
                  <View style={styles.categoryButtons}>
                    {categories.map((category) => {
                      const displayName = CategoryService.getCategoryDisplayName(
                        category,
                        CategoryService.getEffectiveGameType(category, 'SINGLES')
                      );
                      const isSelected = selectedCategoryId === category.id;

                      return (
                        <TouchableOpacity
                          key={category.id}
                          style={[styles.categoryButton, isSelected && styles.categoryButtonSelected]}
                          onPress={() => {
                            handleCategoryPress(category.id);
                          }}
                          activeOpacity={0.7}
                        >
                          {isSelected && (
                            <Text style={styles.tickIcon}>✓</Text>
                          )}
                          <Text style={[styles.categoryButtonText, isSelected && styles.categoryButtonTextSelected]}>
                            {displayName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </Animated.View>
            )}

            {/* Season Cards Section - Show skeleton OR content */}
            <Animated.View style={seasonsEntryAnimatedStyle}>
              {showSeasonsSkeleton ? (
                <SeasonCardSkeleton sport={sport} count={2} />
              ) : (
                <>
                  {/* Current Seasons Section */}
                  {currentSeasons.length > 0 && (
                    <View style={styles.seasonsSection}>
                      <Text style={styles.sectionTitle}>Current Season</Text>
                      {currentSeasons.map(renderSeasonCard)}
                    </View>
                  )}

                  {/* Upcoming Seasons Section */}
                  {upcomingSeasons.length > 0 && (
                    <View style={styles.seasonsSection}>
                      <Text style={styles.sectionTitle}>Upcoming Season</Text>
                      {upcomingSeasons.map(renderSeasonCard)}
                    </View>
                  )}

                  {/* Past Seasons Section */}
                  {pastSeasons.length > 0 && (
                    <View style={styles.seasonsSection}>
                      <Text style={styles.sectionTitle}>Past Season</Text>
                      {pastSeasons.map(renderSeasonCard)}
                    </View>
                  )}

                  {/* Empty State - Show when no categories or no seasons */}
                  {categories.length === 0 || (currentSeasons.length === 0 && upcomingSeasons.length === 0 && pastSeasons.length === 0) ? (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>
                        {categories.length === 0
                          ? 'There are currently no seasons available for this league.'
                          : selectedCategoryId
                            ? 'There are currently no seasons available for this category.'
                            : 'There are currently no seasons available for this league.'}
                      </Text>
                    </View>
                  ) : null}
                </>
              )}
            </Animated.View>
            </ScrollView>
          </>
        )}
        </View>
      </View>
      
      <NavBar activeTab={activeTab} onTabPress={handleTabPress} sport={selectedSport} />

      <PaymentOptionsBottomSheet
        visible={showPaymentOptions}
        onClose={handleClosePaymentOptions}
        season={selectedSeason}
        onPayNow={handlePayNow}
        onPayLater={handlePayLater}
        isProcessingPayment={isProcessingPayment}
        sport={sport}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  contentContainer: {
    flex: 1,
    zIndex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: isSmallScreen ? 16 : isTablet ? 32 : 20,
    paddingBottom: 120,
  },
  scrollTopSpacer: {
    height: 20,
  },
  gradientHeaderContainer: {
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  leagueHeaderGradient: {
    borderRadius: 0,
    padding: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  leagueHeaderContent: {
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 2,
    gap: 12,
  },
  backButtonContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonIcon: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  leagueNameContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 52, // Offset to balance the back button width + gap
  },
  collapsedHeaderContent: {
    position: 'absolute',
    left: 52, // Start after back button
    right: 0,
    alignItems: 'flex-start',
    justifyContent: 'center',
    top: 0,
    bottom: 0,
    paddingLeft: 12,
  },
  leagueInfoContainer: {
    alignItems: 'center',
    width: '100%',
  },
  leagueName: {
    fontSize: isSmallScreen ? 18 : isTablet ? 22 : 20,
    fontWeight: '700',
    color: '#FDFDFD',
    textAlign: 'center',
    marginBottom: 8,
  },
  collapsedLeagueName: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '700',
    color: '#FDFDFD',
    textAlign: 'left',
    marginBottom: 4,
  },
  collapsedPlayerCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 24,
  },
  collapsedPlayerCount: {
    fontSize: isSmallScreen ? 12 : 13,
    color: '#FDFDFD',
    fontWeight: '600',
  },
  playerCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statusCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6EC531',
    marginRight: 8,
  },
  playerCount: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#FDFDFD',
    fontWeight: '600',
    textAlign: 'center',
  },
  profilePicturesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  // Header profile picture
  headerProfilePicture: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerProfileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  defaultHeaderAvatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6de9a0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultHeaderAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  // Member profile pictures in gradient header
  memberProfilePicture: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  memberProfilePictureOverlap: {
    marginLeft: -10,
  },
  memberProfileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  defaultMemberProfileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6de9a0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultMemberProfileText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  remainingCount: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  remainingCountText: {
    color: '#1C1A1A',
    fontSize: 11,
    fontWeight: '700',
  },
  leagueInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: isSmallScreen ? 16 : 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  leagueInfoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  leagueInfoIcon: {
    flexShrink: 0,
  },
  leagueInfoTextContainer: {
    flex: 1,
  },
  leagueInfoTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '600',
    color: '#1A1C1E',
    marginBottom: 8,
  },
  leagueInfoText: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#747477',
    lineHeight: 20,
  },
  categoriesContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 16 : isTablet ? 20 : 18,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 12,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAEAEA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryButtonSelected: {
    backgroundColor: '#2C2C2C',
  },
  categoryButtonText: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#606060',
    fontWeight: '400',
  },
  categoryButtonTextSelected: {
    color: '#F5F5F5',
    fontWeight: '600',
  },
  tickIcon: {
    fontSize: 14,
    color: '#FEA04D',
    fontWeight: 'bold',
    marginRight: 6,
  },
  seasonsSection: {
    marginBottom: 24,
  },
  seasonCardWrapper: {
    borderRadius: 16,
    padding: 2,
    marginBottom: 12,
  },
  seasonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: isSmallScreen ? 16 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  seasonCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seasonTitle: {
    flex: 1,
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  categoryChip: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryChipText: {
    fontSize: isSmallScreen ? 12 : 13,
    fontWeight: '600',
    color: '#F9F9F9',
  },
  dateRow: {
    marginTop: 8,
    marginBottom: 8,
  },
  dateText: {
    fontSize: isSmallScreen ? 12 : 13,
    fontWeight: '500',
    color: '#2B2929',
  },
  dateTextBold: {
    fontWeight: '700',
  },
  seasonPlayerCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  seasonPlayerCount: {
    fontSize: isSmallScreen ? 13 : 14,
    fontWeight: '400',
    color: '#1A1C1E',
  },
  seasonProfilePicturesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  // Smaller profile pictures for season cards
  seasonMemberProfilePicture: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  seasonMemberProfilePictureOverlap: {
    marginLeft: -8,
  },
  seasonMemberProfileImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  defaultSeasonMemberProfileImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6de9a0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultSeasonMemberProfileText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  seasonRemainingCount: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  seasonRemainingCountText: {
    color: '#1C1A1A',
    fontSize: 9,
    fontWeight: '700',
  },
  seasonDetails: {
    marginBottom: 12,
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#2B2929',
  },
  entryFeeContainer: {
    marginBottom: 12,
  },
  entryFeeText: {
    fontSize: 14,
    color: '#2B2929',
  },
  entryFeeAmount: {
    color: '#2B2929',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  registerButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  seasonCardButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
  },
  manageTeamButton: {
    flex: 0.85,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FEA04D',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  manageTeamButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#FEA04D',
  },
  registrationOpenText: {
    fontSize: 12,
    fontWeight: '400',
    fontStyle: 'italic',
    color: '#34C759',
    textAlign: 'center',
    position: 'absolute',
    right: 0,
  },
  registerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2B2929',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: isSmallScreen ? 16 : isTablet ? 24 : 20,
    paddingVertical: isSmallScreen ? 4 : isTablet ? 8 : 6,
    minHeight: isSmallScreen ? 36 : isTablet ? 44 : 40,
  },
  headerRight: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultAvatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6de9a0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  contentBox: {
    flex: 1,
    backgroundColor: '#F6FAFC',
    borderWidth: 1,
    borderColor: '#D5D5D5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    // marginTop: 0,
    overflow: 'hidden',
  },
});
