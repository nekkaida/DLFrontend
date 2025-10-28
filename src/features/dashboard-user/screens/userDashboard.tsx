import React, { useEffect } from 'react';
import { ScrollView, Text, View, StyleSheet, Dimensions, Platform, Image, TouchableOpacity, RefreshControl, StatusBar, BackHandler, Animated, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useDashboard } from '../DashboardContext';
import { NavBar } from '@/shared/components/layout';
import { useSession, authClient } from '@/lib/auth-client';
import { getBackendBaseURL } from '@/config/network';
import * as Haptics from 'expo-haptics';
import CommunityScreen from '@/features/community/screens/CommunityScreen';
import { SportSwitcher } from '@/shared/components/ui/SportSwitcher';
import { useLeagues, LeagueCard } from '@/src/features/leagues';
import LocationIcon from '@/assets/icons/location-purple.svg';
import SearchIcon from '@/assets/icons/search-icon.svg';


const SPORT_CONFIG = {
  pickleball: {
    color: '#A04DFE',
    gradientColors: ['#B98FAF', '#FFFFFF'],
    apiType: 'PICKLEBALL' as const,
    displayName: 'Pickleball'
  },
  tennis: {
    color: '#A2E047',
    gradientColors: ['#A2E047', '#FFFFFF'],
    apiType: 'TENNIS' as const,
    displayName: 'Tennis'
  },
  padel: {
    color: '#4DABFE',
    gradientColors: ['#4DABFE', '#FFFFFF'],
    apiType: 'PADDLE' as const,
    displayName: 'Padel'
  }
} as const;

const { width, height } = Dimensions.get('window');

// Responsive design helpers
const isSmallScreen = width < 375;
const isLargeScreen = width > 414;
const isTablet = width > 768;

export default function DashboardScreen() {
  const { userName } = useDashboard();
  const { data: session } = useSession();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = React.useState(2);
  const [currentView, setCurrentView] = React.useState<'dashboard' | 'connect' | 'friendly' | 'myGames' | 'chat'>('dashboard');
  const [refreshing, setRefreshing] = React.useState(false);
  const [profileData, setProfileData] = React.useState<any>(null);
  const [selectedSport, setSelectedSport] = React.useState<'pickleball' | 'tennis' | 'padel'>('pickleball');
  const [locationFilterOpen, setLocationFilterOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const scrollY = React.useRef(new Animated.Value(0)).current;
  // Use safe area insets for proper status bar handling across platforms
  const STATUS_BAR_HEIGHT = insets.top;

  // Helper function to get user's selected sports
  const getUserSelectedSports = () => {
    if (!profileData?.sports) return [];
    
    // Convert to lowercase to match our config keys
    const sports = profileData.sports.map((sport: string) => sport.toLowerCase());
    
    // Define the order of sports (priority)
    const preferredOrder = ['pickleball', 'tennis', 'padel'];
    
    // Filter to only include sports that are configured and sort by order
    const configuredSports = sports.filter((sport: string) => sport in SPORT_CONFIG);
    
    // Sort by preferred order
    return configuredSports.sort((a: string, b: string) => {
      const indexA = preferredOrder.indexOf(a);
      const indexB = preferredOrder.indexOf(b);
      
      // If both sports are in the preferred order, sort by their position
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      // If only one sport is in the preferred order, prioritize it
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      // If neither sport is in the preferred order, maintain original order
      return 0;
    });
  };

  // Set default selected sport when profile data loads
  React.useEffect(() => {
    if (profileData?.sports && profileData.sports.length > 0) {
      const availableSports = getUserSelectedSports();
      if (availableSports.length > 0 && !availableSports.includes(selectedSport)) {
        setSelectedSport(availableSports[0] as 'pickleball' | 'tennis' | 'padel');
      }
    }
  }, [profileData?.sports]);

  // Get current sport configuration
  const currentSportConfig = SPORT_CONFIG[selectedSport];
  
  // Fetch leagues data for current sport
  const { leagues, isLoading, error, refetch, joinLeague } = useLeagues({
    sportType: currentSportConfig?.apiType,
    autoFetch: true
  });

  const handleJoinLeague = async (leagueId: string) => {
    const success = await joinLeague(leagueId);
    if (success) {
      console.log('Successfully joined league:', leagueId);
      // Navigate to league details screen with league information
      const league = leagues.find(l => l.id === leagueId);
      router.push({
        pathname: '/user-dashboard/league-details',
        params: { 
          leagueId: leagueId,
          leagueName: league?.name || 'League',
          sport: selectedSport
        }
      });
    } else {
      console.log('Failed to join league:', leagueId);
    }
  };

  console.log(`DashboardScreen: Current activeTab is ${activeTab}`);
  
  // Debug logging for safe area insets in parent component
  useEffect(() => {
    console.log('=== Dashboard Safe Area Debug Info ===');
    console.log(`Platform: ${Platform.OS}`);
    console.log(`Screen dimensions:`, {
      width: width,
      height: height
    });
    console.log(`Safe area insets:`, {
      top: insets.top,
      bottom: insets.bottom,
      left: insets.left,
      right: insets.right
    });
    console.log(`Available content height: ${height - insets.top - insets.bottom}px`);
    console.log(`NavBar will be positioned at bottom: ${height - insets.bottom}px`);
    console.log(`Content should end at: ${height - insets.bottom - 83}px (NavBar height: 83px)`);
    console.log('====================================');
  }, [insets, width, height]);

  // Debug logging for screen dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      console.log('=== Screen Dimension Change Debug ===');
      console.log(`New screen dimensions:`, {
        width: window.width,
        height: window.height
      });
      console.log(`Safe area insets (unchanged):`, {
        top: insets.top,
        bottom: insets.bottom,
        left: insets.left,
        right: insets.right
      });
      console.log(`New available content height: ${window.height - insets.top - insets.bottom}px`);
      console.log(`New NavBar position: bottom ${window.height - insets.bottom}px`);
      console.log('====================================');
    });

    return () => subscription?.remove();
  }, [insets]);

  // Basic session protection only - let login.tsx handle onboarding flow
  useEffect(() => {
    if (!session?.user?.id) {
      console.log('DashboardScreen: No session, redirecting to login');
      router.replace('/login');
      return;
    }

    // DON'T redirect unverified users - they might be on verifyEmail page
    // Let the natural flow handle email verification
    if (!session.user.emailVerified) {
      console.log('DashboardScreen: Email not verified, but allowing access (user might be verifying)');
      return;
    }

    console.log('DashboardScreen: User has valid session, allowing access');
  }, [session]);

  // Disable Android hardware back when not on main dashboard view
  useEffect(() => {
    const onBackPress = () => {
      if (currentView !== 'dashboard') {
        
        return true;
      }
      return false;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [currentView]);

  // Fetch profile data when component mounts
  useEffect(() => {
    if (session?.user?.id) {
      fetchProfileData();
    }
  }, [session?.user?.id]);

  const handleTabPress = (tabIndex: number) => {
    console.log(`DashboardScreen: Setting activeTab to ${tabIndex}`);
    setActiveTab(tabIndex);
    console.log(`Tab ${tabIndex} pressed - ${['Connect', 'Friendly', 'Leagues', 'My Games', 'Chat'][tabIndex]}`);

    // Absolute in-app view switching per tab
    if (tabIndex === 0) {
      setCurrentView('connect');
    } else if (tabIndex === 1) {
      setCurrentView('friendly');
    } else if (tabIndex === 2) {
      setCurrentView('dashboard');
    } else if (tabIndex === 3) {
      setCurrentView('myGames');
    } else if (tabIndex === 4) {
      setCurrentView('chat');
    }
  };

  const fetchProfileData = async () => {
    try {
      if (!session?.user?.id) {
        console.log('DashboardScreen: No session user ID available for profile data');
        return;
      }
      
      const backendUrl = getBackendBaseURL();
      console.log('DashboardScreen: Fetching profile data from:', `${backendUrl}/api/player/profile/me`);
      
      const authResponse = await authClient.$fetch(`${backendUrl}/api/player/profile/me`, {
        method: 'GET',
      });
      
      console.log('DashboardScreen: Profile API response:', authResponse);
      
      if (authResponse && (authResponse as any).data && (authResponse as any).data.data) {
        console.log('DashboardScreen: Setting profile data:', (authResponse as any).data.data);
        setProfileData((authResponse as any).data.data);
      } else if (authResponse && (authResponse as any).data) {
        console.log('DashboardScreen: Setting profile data (direct):', (authResponse as any).data);
        setProfileData((authResponse as any).data);
      } else {
        console.error('DashboardScreen: No profile data received from authClient');
      }
    } catch (error) {
      console.error('DashboardScreen: Error fetching profile data:', error);
    }
  };

  const onRefresh = React.useCallback(async () => {
    console.log('DashboardScreen: Refreshing dashboard data...');
    setRefreshing(true);
    
    try {
      // Add haptic feedback for refresh
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Fetch fresh profile data and leagues
      await Promise.all([
        fetchProfileData(),
        refetch()
      ]);
      
      console.log('DashboardScreen: Dashboard data refreshed successfully');
      
    } catch (error) {
      console.error('DashboardScreen: Error refreshing dashboard data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [session?.user?.id, refetch]);


  // use this for swtiching between tabs
  if (currentView === 'connect') {
    return (
      <CommunityScreen onTabPress={handleTabPress} />
    );
  }

  // later delete this
  if (currentView === 'friendly' || currentView === 'myGames' || currentView === 'chat') {
    const title = currentView === 'friendly' ? 'Friendly' : currentView === 'myGames' ? 'My Games' : 'Chat';
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        
        <View style={[styles.headerContainer, { paddingTop: STATUS_BAR_HEIGHT }]}>
          {/* Profile picture moved to left */}
          <TouchableOpacity 
            style={styles.profilePicture}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/profile');
            }}
          >
            {(profileData?.image || session?.user?.image) ? (
              <Image 
                source={{ uri: profileData?.image || session?.user?.image }}
                style={styles.profileImage}
                onError={() => {
                  console.log('Profile image failed to load:', profileData?.image || session?.user?.image);
                }}
              />
            ) : (
              <View style={styles.defaultAvatarContainer}>
                <Text style={styles.defaultAvatarText}>
                  {(profileData?.name || session?.user?.name)?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          
          {/* Sports switcher in center */}
          <SportSwitcher
            currentSport={selectedSport}
            availableSports={getUserSelectedSports()}
            onSportChange={setSelectedSport}
          />
          
          {/* Empty space on right for balance */}
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.contentContainer}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1C1E' }}>{title}</Text>
            <Text style={{ marginTop: 8, color: '#6B7280' }}>Content coming soon</Text>
          </View>
        </View>
        <NavBar activeTab={activeTab} onTabPress={handleTabPress} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={[styles.headerContainer, { paddingTop: STATUS_BAR_HEIGHT }]}>
        {/* Profile picture moved to left */}
        <TouchableOpacity 
          style={styles.profilePicture}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/profile');
          }}
        >
          {(profileData?.image || session?.user?.image) ? (
            <Image 
              source={{ uri: profileData?.image || session?.user?.image }}
              style={styles.profileImage}
              onError={() => {
                console.log('Profile image failed to load:', profileData?.image || session?.user?.image);
              }}
            />
          ) : (
            <View style={styles.defaultAvatarContainer}>
              <Text style={styles.defaultAvatarText}>
                {(profileData?.name || session?.user?.name)?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        
        {/* Sports switcher in center */}
        <SportSwitcher
          currentSport={selectedSport}
          availableSports={getUserSelectedSports()}
          onSportChange={setSelectedSport}
        />
        
        {/* Empty space on right for balance */}
        <View style={styles.headerRight} />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.contentBox}>
          <Animated.ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
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
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
          >
          
          {/* Recommended League Header with filter */}
          <View style={styles.recommendedHeaderRow}>
            <Text style={styles.recommendedLeagueText}>Recommended league</Text>
            <View style={styles.locationRow}>
              <LocationIcon width={11} height={10} style={styles.locationIcon} />
              <Text style={styles.locationFilterText}>Based on your location</Text>
            </View>
          </View>

          {/* Featured League Card */}
          {isLoading ? (
            <View style={styles.featuredSkeleton} />
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to load leagues</Text>
              <TouchableOpacity style={styles.retryButton} onPress={refetch}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : leagues.length > 0 ? (
            <Animated.View style={[styles.parallaxWrapper, {
              transform: [
                { translateY: scrollY.interpolate({ inputRange: [-100, 0, 200], outputRange: [-30, 0, 20], extrapolate: 'clamp' }) },
                { scale: scrollY.interpolate({ inputRange: [-100, 0], outputRange: [1.05, 1], extrapolate: 'clamp' }) }
              ]
            }]}>
              <LeagueCard 
                league={leagues[0]} 
                variant="featured"
                onJoinPress={handleJoinLeague}
              />
            </Animated.View>
          ) : (
            <View style={styles.noLeaguesContainer}>
              <Text style={styles.noLeaguesText}>No {currentSportConfig?.displayName.toLowerCase()} leagues available</Text>
              <Text style={styles.noLeaguesSubtext}>Check back later for new leagues!</Text>
            </View>
          )}

          {/* Other leagues near you */}
          {leagues.length > 1 && (
            <>
              <View style={styles.otherLeaguesHeaderRow}>
                <Text style={styles.sectionTitle}>Other leagues near you</Text>
                <Text style={styles.arrowText}>→</Text>
              </View>

              {/* Search field */}
              <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                  <SearchIcon width={20} height={20} style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search leagues..."
                    placeholderTextColor="#BABABA"
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                  />
                </View>
              </View>

              {(() => {
                const filteredLeagues = leagues.slice(1).filter((league) => {
                  if (!searchTerm.trim()) return true;
                  const search = searchTerm.toLowerCase();
                  return (
                    league.name?.toLowerCase().includes(search) ||
                    league.location?.toLowerCase().includes(search)
                  );
                });

                // If there arei 2 leagues, display them side by side
                if (filteredLeagues.length === 2) {
                  return (
                    <View style={styles.sideBySideContainer}>
                      <View style={styles.halfWidthCard}>
                        <LeagueCard
                          league={filteredLeagues[0]}
                          variant="regular"
                          size="large"
                          onJoinPress={handleJoinLeague}
                        />
                      </View>
                      <View style={styles.halfWidthCard}>
                        <LeagueCard
                          league={filteredLeagues[1]}
                          variant="regular"
                          size="large"
                          onJoinPress={handleJoinLeague}
                        />
                      </View>
                    </View>
                  );
                }

                // Otherwise, display vertically
                return filteredLeagues.map((league) => (
                  <LeagueCard
                    key={league.id}
                    league={league}
                    variant="regular"
                    onJoinPress={handleJoinLeague}
                  />
                ));
              })()}
            </>
          )}

          </Animated.ScrollView>
        </View>
      </View>
      <NavBar activeTab={activeTab} onTabPress={handleTabPress} />
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
    height: height * 0.35,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    zIndex: 1,
  },
  contentBox: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#D5D5D5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    // marginTop: 0,
    overflow: 'hidden',
  },
  headerSection: {
    paddingHorizontal: isSmallScreen ? 16 : isTablet ? 32 : 24,
    paddingTop: Platform.OS === 'ios' ? 16 : 20,
    paddingBottom: isSmallScreen ? 20 : 30,
    backgroundColor: '#FFFFFF',
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
  profilePicture: {
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
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: isSmallScreen ? 16 : isTablet ? 32 : 20,
    paddingBottom: 120,
  },
  sportSelectionText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    lineHeight: isSmallScreen ? 20 : isTablet ? 24 : 22,
    color: '#1A1C1E',
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 24,
    color: '#FF6B35',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 12,
    color: '#999999',
  },
  quickActionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  recentActivityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 16 : isTablet ? 20 : 18,
    color: '#333333',
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 2,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  placeholderText: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  tabIndicator: {
    backgroundColor: '#F8F0F5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#863A73',
  },
  tabIndicatorText: {
    fontSize: 14,
    color: '#863A73',
    fontWeight: '600',
    textAlign: 'center',
  },
  newsSection: {
    marginBottom: 20,
  },
  newsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: isSmallScreen ? 16 : isTablet ? 24 : 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  newsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  newsIconContainer: {
    marginRight: 16,
  },
  newsIconText: {
    fontSize: 24,
  },
  newsInfo: {
    flex: 1,
  },
  newsTitle: {
    fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 4,
  },
  newsSubtitle: {
    fontSize: isSmallScreen ? 12 : isTablet ? 16 : 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  newsTime: {
    alignItems: 'flex-end',
  },
  newsTimeText: {
    fontSize: isSmallScreen ? 10 : isTablet ? 14 : 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  newsPlaceholder: {
    fontSize: isSmallScreen ? 12 : isTablet ? 16 : 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  recommendedHeaderRow: {
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 20,
  },
  recommendedLeagueText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    lineHeight: isSmallScreen ? 20 : isTablet ? 24 : 22,
    color: '#1A1C1E',
    textAlign: 'center',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationIcon: {
    marginRight: 6,
  },
  locationFilterText: {
    fontSize: isSmallScreen ? 10 : isTablet ? 14 : 12,
    color: '#A04DFE',
    textAlign: 'center',
    fontWeight: '500',

  },
  otherLeaguesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BABABA',
    paddingHorizontal: 16,
    paddingVertical: 0,
    height: 48,
    minHeight: 48,
    maxHeight: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16, 
    color: '#1F2937',
    paddingVertical: 12,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  arrowText: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  parallaxWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  featuredSkeleton: {
    height: 180,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginBottom: 20,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  noLeaguesContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  noLeaguesText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  noLeaguesSubtext: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
  },
  sideBySideContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfWidthCard: {
    flex: 1,
  },
});