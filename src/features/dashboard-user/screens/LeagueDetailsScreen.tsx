import React from 'react';
import { ScrollView, Text, View, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, Alert, Image, StatusBar, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { NavBar } from '@/shared/components/layout';
import { SportSwitcher } from '@/shared/components/ui/SportSwitcher';
import { useDashboard } from '../DashboardContext';
import { getBackendBaseURL } from '@/src/config/network';
import { authClient } from '@/lib/auth-client';
import * as Haptics from 'expo-haptics';
import { CategoryService, Category } from '@/src/features/dashboard-user/services/CategoryService';
import { SeasonService, Season } from '@/src/features/dashboard-user/services/SeasonService';
import { LeagueService } from '@/src/features/leagues/services/LeagueService';
import { useSession } from '@/lib/auth-client';
import { questionnaireAPI } from '@/src/features/onboarding/services/api';
import { PaymentOptionsBottomSheet } from '../components';
import { useActivePartnership } from '@/features/pairing/hooks';
import { toast } from 'sonner-native';
import LeagueInfoIcon from '@/assets/icons/league-info.svg';
import BackButtonIcon from '@/assets/icons/back-button.svg';

const { width } = Dimensions.get('window');

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
  const [league, setLeague] = React.useState<any>(null);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [seasons, setSeasons] = React.useState<Season[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [userGender, setUserGender] = React.useState<string | null | undefined>(undefined);
  const [showPaymentOptions, setShowPaymentOptions] = React.useState(false);
  const [selectedSeason, setSelectedSeason] = React.useState<Season | null>(null);
  const [profileData, setProfileData] = React.useState<any>(null);
  const [selectedSport, setSelectedSport] = React.useState<'pickleball' | 'tennis' | 'padel'>('pickleball');
  const insets = useSafeAreaInsets();
  const STATUS_BAR_HEIGHT = insets.top;

  const userId = session?.user?.id;

  // Set selected sport based on route param
  React.useEffect(() => {
    setSelectedSport(sport);
  }, [sport]);

  // Fetch user gender
  React.useEffect(() => {
    const fetchUserGender = async () => {
      if (!userId) {
        // If no userId, explicitly set to null so fetchAllData can proceed
        setUserGender(null);
        return;
      }

      try {
        const { user } = await questionnaireAPI.getUserProfile(userId);
        setUserGender(user.gender?.toUpperCase() || null);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Set to null on error so fetchAllData can still proceed
        setUserGender(null);
      }
    };

    fetchUserGender();
  }, [userId]);

  // Fetch all data on mount
  React.useEffect(() => {
    if (leagueId && userGender !== undefined) {
      fetchAllData();
    }
  }, [leagueId, userGender]);

  // Set default selected category when categories are loaded
  React.useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  const fetchAllData = async () => {
    if (!leagueId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch league, categories, and seasons in parallel
      const [leagueData, categoriesData, seasonsData] = await Promise.all([
        LeagueService.fetchLeagueById(leagueId),
        CategoryService.fetchLeagueCategories(leagueId),
        SeasonService.fetchAllSeasons()
      ]);

      console.log('Fetched league data:', leagueData);
      console.log('Fetched categories:', categoriesData);
      console.log('Fetched seasons:', seasonsData);

      // Use categories from API call, or fallback to league data categories if API call failed/returned empty
      let allCategories: Category[] = categoriesData || [];
      if (allCategories.length === 0 && leagueData?.categories && Array.isArray(leagueData.categories)) {
        // Convert league data categories to Category format
        allCategories = leagueData.categories
          .filter((cat: any) => cat.isActive !== false)
          .map((cat: any) => ({
            id: cat.id,
            name: cat.name || '',
            genderRestriction: cat.genderRestriction || 'OPEN',
            game_type: cat.game_type,
            gender_category: cat.gender_category,
            isActive: cat.isActive !== false,
            categoryOrder: cat.categoryOrder || 0,
            matchFormat: cat.matchFormat,
            createdAt: cat.createdAt,
            updatedAt: cat.updatedAt,
            leagues: [],
            seasons: []
          })) as Category[];
      }

      // Filter categories by user gender (same logic as LeagueCategoryScreen)
      // userGender is guaranteed to not be undefined at this point due to useEffect guard
      const effectiveUserGender: string | null = userGender === undefined ? null : userGender;
      const genderFiltered = filterCategoriesByGender(allCategories, effectiveUserGender);
      
      if (genderFiltered.length === 0 && allCategories.length > 0) {
        // If gender filtering removed all categories, show all active categories as fallback
        setCategories(allCategories.filter((cat: any) => cat.isActive !== false));
      } else {
        setCategories(genderFiltered);
      }

      // Filter seasons to only those belonging to this league
      const leagueSeasons = seasonsData.filter(season =>
        season.leagues?.some(l => l.id === leagueId)
      );
      setSeasons(leagueSeasons);

      // Set default selected category from filtered categories
      const finalCategories = genderFiltered.length === 0 && allCategories.length > 0 
        ? allCategories.filter((cat: any) => cat.isActive !== false)
        : genderFiltered;
      
      if (finalCategories.length > 0) {
        setSelectedCategoryId(finalCategories[0].id);
      } else {
        setSelectedCategoryId(null);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load league details');
    } finally {
      setIsLoading(false);
    }
  };

  const filterCategoriesByGender = (categories: Category[], userGender: string | null): Category[] => {
    if (!userGender) {
      // If no user gender, show only MIXED/OPEN categories
      return categories.filter(category => {
        const genderCategory = category.gender_category?.toUpperCase();
        const genderRestriction = category.genderRestriction?.toUpperCase();
        const categoryGender = genderCategory || genderRestriction;
        return categoryGender === 'MIXED' || categoryGender === 'OPEN';
      });
    }

    const normalizedUserGender = userGender.toUpperCase();
    
    return categories.filter(category => {
      const genderCategory = category.gender_category?.toUpperCase();
      const genderRestriction = category.genderRestriction?.toUpperCase();
      const categoryGender = genderCategory || genderRestriction;
      const categoryName = category.name?.toLowerCase() || '';

      // Show if MIXED/OPEN (open to all)
      if (categoryGender === 'MIXED' || categoryGender === 'OPEN') {
        return true;
      }

      // Parse category name for gender patterns (handle both "Men's" and "Male's" naming)
      const isMenCategory = categoryName.includes("men's") || categoryName.includes("men ") || 
                            categoryName.includes("male's") || categoryName.includes("male ");
      const isWomenCategory = categoryName.includes("women's") || categoryName.includes("women ") || 
                             categoryName.includes("female's") || categoryName.includes("female ");
      const isMixedCategory = categoryName.includes("mixed");

      // If category name indicates mixed, show for all
      if (isMixedCategory) {
        return true;
      }

      // Check if category matches user's gender from name patterns
      if (normalizedUserGender === 'MALE' && isMenCategory) {
        return true;
      }
      if (normalizedUserGender === 'FEMALE' && isWomenCategory) {
        return true;
      }

      // Also check gender fields for exact match
      if (categoryGender === normalizedUserGender) {
        return true;
      }
      
      // Handle case where category uses MEN/WOMEN but user is MALE/FEMALE (or vice versa)
      if ((normalizedUserGender === 'MALE' && (categoryGender === 'MEN' || categoryGender === 'MALE')) ||
          (normalizedUserGender === 'FEMALE' && (categoryGender === 'WOMEN' || categoryGender === 'FEMALE'))) {
        return true;
      }

      return false;
    });
  };

  const handleTabPress = (tabIndex: number) => {
    setActiveTab(tabIndex);
  };

  const handleCategoryPress = (categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategoryId(categoryId);
  };

  const handleRegisterPress = (season: Season) => {
    // Check if this is a doubles season by checking category name
    const isDoublesSeason = season.categories?.some(cat => 
      cat.name?.toLowerCase().includes('doubles') || 
      cat.matchFormat?.toLowerCase().includes('doubles') || 
      (cat as any).game_type === 'DOUBLES'
    );
    
    if (isDoublesSeason) {
      // Navigate to doubles team pairing screen
      router.push({
        pathname: '/user-dashboard/doubles-team-pairing' as any,
        params: {
          seasonId: season.id,
          seasonName: season.name,
          leagueId: leagueId,
          sport: sport
        }
      });
    } else {
      // Show payment options for singles
      setSelectedSeason(season);
      setShowPaymentOptions(true);
    }
  };

  const handleJoinWaitlistPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Join Waitlist button pressed');
    toast.info('Waitlist feature coming soon!');
  };

  const handleViewStandingsPress = (season: Season) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('View Standings button pressed');
    toast.info('Standings feature coming soon!');
  };

  const handleClosePaymentOptions = () => {
    setShowPaymentOptions(false);
    setSelectedSeason(null);
  };

  const handlePayNow = (season: Season) => {
    console.log('Pay Now pressed for season:', season.id);
    toast.info('Payment gateway coming soon!');
  };

  const handlePayLater = async (season: Season) => {
    if (!userId) {
      toast.error('You must be logged in to register');
      return;
    }

    try {
      console.log('Registering user for season (Pay Later):', season.id);
      const success = await SeasonService.registerForSeason(season.id, userId);

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

  // Get filtered seasons for selected category
  const getFilteredSeasons = () => {
    if (!selectedCategoryId) {
      return seasons;
    }
    
    const filtered = seasons.filter(season => {
      // If season has no categories, skip it (unless we want to show all seasons without categories)
      if (!season.categories || !Array.isArray(season.categories) || season.categories.length === 0) {
        return false;
      }
      
      // Check if any category matches
      const seasonCategoryIds = season.categories.map(c => c?.id).filter(Boolean);
      const matches = seasonCategoryIds.includes(selectedCategoryId);
      
      return matches;
    });
    
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
    const isUserRegistered = season.memberships?.some((m: any) => m.userId === userId);

    const getButtonConfig = () => {
      if (isUserRegistered) {
        return {
          text: 'View Leaderboard',
          color: '#FEA04D',
          onPress: () => handleViewStandingsPress(season)
        };
      }

      if (season.status === 'ACTIVE') {
        return {
          text: 'Join Season',
          color: '#FEA04D',
          onPress: () => handleRegisterPress(season)
        };
      }

      if (season.status === 'UPCOMING') {
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

    // Get category for this season
    const seasonCategory = season.categories && season.categories.length > 0 
      ? season.categories[0] 
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
            <View style={styles.seasonProfilePicturesContainer}>
              {season.memberships.slice(0, 6).map((membership) => {
                if (!membership.user) return null;
                return (
                  <View key={membership.id} style={styles.seasonMemberProfilePicture}>
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
                <View style={styles.seasonRemainingCount}>
                  <Text style={styles.seasonRemainingCountText}>
                    +{season._count.memberships - 6}
                  </Text>
                </View>
              )}
            </View>
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
            <TouchableOpacity
              style={[styles.registerButton, { backgroundColor: buttonConfig.color }]}
              onPress={buttonConfig.onPress}
              activeOpacity={0.8}
            >
              <Text style={styles.registerButtonText}>{buttonConfig.text}</Text>
            </TouchableOpacity>
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
      color: '#863A73',
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

  // Helper function to get user's selected sports
  const getUserSelectedSports = () => {
    if (!profileData?.sports) return [];
    const sports = profileData.sports.map((sport: string) => sport.toLowerCase());
    const preferredOrder = ['pickleball', 'tennis', 'padel'];
    const configuredSports = sports.filter((sport: string) => ['pickleball', 'tennis', 'padel'].includes(sport));
    return configuredSports.sort((a: string, b: string) => {
      const indexA = preferredOrder.indexOf(a);
      const indexB = preferredOrder.indexOf(b);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return 0;
    });
  };

  // Fetch profile data for sports list
  React.useEffect(() => {
    const fetchProfileData = async () => {
      if (!session?.user?.id) return;
      try {
        const backendUrl = getBackendBaseURL();
        const authResponse = await authClient.$fetch(`${backendUrl}/api/player/profile/me`, {
          method: 'GET',
        });
        if (authResponse && (authResponse as any).data && (authResponse as any).data.data) {
          setProfileData((authResponse as any).data.data);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    };
    fetchProfileData();
  }, [session?.user?.id]);

  // Set selected sport based on route param
  React.useEffect(() => {
    setSelectedSport(sport);
  }, [sport]);

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
        {isLoading ? (
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
            <View style={styles.gradientHeaderContainer}>
              <LinearGradient
                colors={getHeaderGradientColors(sport)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.leagueHeaderGradient}
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
                  <View style={styles.leagueNameContainer}>
                    <Text style={styles.leagueName} numberOfLines={2}>{league?.name || leagueName}</Text>
                  </View>
                </View>
                <View style={styles.leagueInfoContainer}>
                  <View style={styles.playerCountContainer}>
                    <View style={styles.statusCircle} />
                    <Text style={styles.playerCount}>
                      {league?.totalSeasonMemberships || 0} players
                    </Text>
                  </View>
                  
                  {/* Profile pictures */}
                  {league?.memberships && league.memberships.length > 0 && (
                    <View style={styles.profilePicturesContainer}>
                      {league.memberships.slice(0, 6).map((membership: any) => (
                        <View key={membership.id} style={styles.memberProfilePicture}>
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
                      ))}
                      {league._count?.memberships && league._count.memberships > 6 && (
                        <View style={styles.remainingCount}>
                          <Text style={styles.remainingCountText}>
                            +{league._count.memberships - 6}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
              </LinearGradient>
            </View>

            <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.scrollTopSpacer} />
            {/* League Info Card */}
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

            {/* Category Filter Buttons */}
            {categories.length > 0 ? (
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
            ) : (
              <View style={styles.categoriesContainer}>
                <Text style={styles.emptyCategoryText}>
                  No categories available for this league
                </Text>
              </View>
            )}

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

            {/* No Seasons Message */}
            {currentSeasons.length === 0 && upcomingSeasons.length === 0 && pastSeasons.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No seasons available for this category</Text>
              </View>
            )}
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
  },
  leagueNameContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 52, // Offset to balance the back button width + gap
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
    gap: 4,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  memberProfileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  defaultMemberProfileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6de9a0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultMemberProfileText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  remainingCount: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyCategoryText: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 16,
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
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  seasonMemberProfileImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  defaultSeasonMemberProfileImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6de9a0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultSeasonMemberProfileText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  seasonRemainingCount: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
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
    position: 'relative',
    justifyContent: 'center',
  },
  registerButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  registrationOpenText: {
    fontSize: 12,
    fontWeight: '400',
    fontStyle: 'italic',
    color: '#34C759',
    position: 'absolute',
    right: 0,
    textAlign: 'center',
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