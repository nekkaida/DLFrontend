import React from 'react';
import { ScrollView, Text, View, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, Image, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SportSwitcher } from '@/shared/components/ui/SportSwitcher';
import { getBackendBaseURL } from '@/src/config/network';
import { authClient } from '@/lib/auth-client';
import { useSession } from '@/lib/auth-client';
import * as Haptics from 'expo-haptics';
import { SeasonService, Season } from '@/src/features/dashboard-user/services/SeasonService';
import { LeagueService } from '@/src/features/leagues/services/LeagueService';
import { PaymentOptionsBottomSheet } from '../components';
import { toast } from 'sonner-native';
import LeagueInfoIcon from '@/assets/icons/league-info.svg';
import InfoIcon1 from '@/assets/icons/info-icon-1.svg';
import InfoIcon2 from '@/assets/icons/info-icon-2.svg';
import InfoIcon3 from '@/assets/icons/info-icon-3.svg';
import InfoIcon4 from '@/assets/icons/info-icon-4.svg';
import InfoIcon5 from '@/assets/icons/info-icon-5.svg';
import InfoIcon6 from '@/assets/icons/info-icon-6.svg';
import BackButtonIcon from '@/assets/icons/back-button.svg';

const { width } = Dimensions.get('window');

const isSmallScreen = width < 375;
const isTablet = width > 768;

interface SeasonDetailsScreenProps {
  seasonId: string;
  seasonName?: string;
  leagueId?: string;
  sport?: 'pickleball' | 'tennis';
}

export default function SeasonDetailsScreen({
  seasonId,
  seasonName = 'Season',
  leagueId,
  sport = 'pickleball'
}: SeasonDetailsScreenProps) {
  const { data: session } = useSession();
  const [season, setSeason] = React.useState<Season | null>(null);
  const [league, setLeague] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [profileData, setProfileData] = React.useState<any>(null);
  const [selectedSport, setSelectedSport] = React.useState<'pickleball' | 'tennis' | 'padel'>('pickleball');
  const [showPaymentOptions, setShowPaymentOptions] = React.useState(false);
  const insets = useSafeAreaInsets();
  const STATUS_BAR_HEIGHT = insets.top;

  const userId = session?.user?.id;

  React.useEffect(() => {
    fetchSeasonData();
  }, [seasonId]);

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

  React.useEffect(() => {
    setSelectedSport(sport);
  }, [sport]);

  const fetchSeasonData = async () => {
    if (!seasonId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const allSeasons = await SeasonService.fetchAllSeasons();
      const foundSeason = allSeasons.find(s => s.id === seasonId);

      if (foundSeason) {
        setSeason(foundSeason);
        
        // Fetch league data if leagueId is available
        if (leagueId) {
          try {
            const leagueData = await LeagueService.fetchLeagueById(leagueId);
            setLeague(leagueData);
          } catch (err) {
            console.error('Error fetching league data:', err);
          }
        }
      } else {
        setError('Season not found');
      }
    } catch (err) {
      console.error('Error fetching season data:', err);
      setError('Failed to load season details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterPress = () => {
    if (!season) return;
    console.log('Register button pressed for season:', season.id);
    
    // Check if this is a doubles season by checking category name
    // Categories like "Men's Doubles", "Women's Doubles", "Mixed Doubles" should go to team pairing
    const isDoublesSeason = season.categories?.some(cat => 
      cat.name?.toLowerCase().includes('doubles') || 
      cat.matchFormat?.toLowerCase().includes('doubles') || 
      (cat as any).game_type === 'DOUBLES'
    );
    
    console.log('Is doubles season?', isDoublesSeason, 'Categories:', season.categories?.map(c => c.name));
    
    if (isDoublesSeason) {
      // Navigate to doubles team pairing screen
      router.push({
        pathname: '/user-dashboard/doubles-team-pairing' as any,
        params: {
          seasonId: season.id,
          seasonName: season.name,
          leagueId: leagueId || '',
          sport: sport || 'pickleball'
        }
      });
    } else {
      // Show payment options for singles
      setShowPaymentOptions(true);
    }
  };

  const handleClosePaymentOptions = () => {
    setShowPaymentOptions(false);
  };

  const handlePayNow = () => {
    if (!season) return;
    console.log('Pay Now pressed for season:', season.id);
    toast.info('Payment gateway coming soon!');
  };

  const handlePayLater = async () => {
    if (!userId || !season) {
      toast.error('You must be logged in to register');
      return;
    }

    try {
      console.log('Registering user for season (Pay Later):', season.id);
      const success = await SeasonService.registerForSeason(season.id, userId);

      if (success) {
        console.log('User registered successfully');
        toast.success('Registered successfully!');
        fetchSeasonData(); // Refresh data
      } else {
        console.warn('Registration failed');
        toast.error('Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Error registering:', err);
      toast.error('An error occurred while registering.');
    }
  };

  const handleViewStandingsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('View Standings button pressed');
    toast.info('Standings feature coming soon!');
  };

  const handleJoinWaitlistPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Join Waitlist button pressed');
    toast.info('Waitlist feature coming soon!');
  };

  const formatSeasonDate = (date: string | Date | undefined): string => {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getSportConfig = () => {
    if (sport === 'tennis') {
      return {
        gradient: ['#B3CFBC', '#FFFFFF'] as const,
        color: '#008000',
        name: 'Tennis'
      };
    }
    return {
      gradient: ['#B98FAF', '#FFFFFF'] as const,
      color: '#863A73',
      name: 'Pickleball'
    };
  };

  const sportConfig = getSportConfig();

  // Button configuration based on user registration status
  const getButtonConfig = () => {
    if (!season || !userId) {
      return {
        text: 'Loading...',
        color: '#B2B2B2',
        onPress: () => {},
        disabled: true
      };
    }

    const isUserRegistered = season.memberships?.some((m: any) => m.userId === userId);

    if (isUserRegistered) {
      return {
        text: 'View Leaderboard',
        color: '#FEA04D',
        onPress: handleViewStandingsPress,
        disabled: false
      };
    }

    if (season.status === 'ACTIVE') {
      return {
        text: 'Join Season',
        color: '#FEA04D',
        onPress: handleRegisterPress,
        disabled: false
      };
    }

    if (season.status === 'UPCOMING') {
      return {
        text: 'Join Waitlist',
        color: '#000000',
        onPress: handleJoinWaitlistPress,
        disabled: false
      };
    }

    return {
      text: 'View Standings',
      color: '#B2B2B2',
      onPress: handleViewStandingsPress,
      disabled: false
    };
  };

  const buttonConfig = getButtonConfig();

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
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
          onSportChange={setSelectedSport}
        />
        
        <View style={styles.headerRight} />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.contentBox}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={sportConfig.color} />
            <Text style={styles.loadingText}>Loading season details...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchSeasonData}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.gradientHeaderContainer}>
              <LinearGradient
                colors={['#A04DFE', '#602E98']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.seasonHeaderGradient}
              >
                <View style={styles.seasonHeaderContent}>
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
                      <Text style={styles.leagueName} numberOfLines={2}>{league?.name || 'League'}</Text>
                    </View>
                  </View>
                  <View style={styles.bannerContainer}>
                    <View style={styles.nameBanner}>
                      <Text style={styles.seasonName}>
                        {season?.categories?.[0]?.name ? `${season.categories[0].name} | ` : ''}
                        <Text style={styles.seasonNameHighlight}>{season?.name || seasonName}</Text>
                      </Text>
                    </View>
                    <View style={styles.playerCountContainer}>
                      <View style={styles.statusCircle} />
                      <Text style={styles.playerCount}>
                        {`${season?._count?.memberships || season?.memberships?.length || 0} players`}
                      </Text>
                    </View>
                    
                    {season?.memberships && season.memberships.length > 0 && (
                      <View style={styles.profilePicturesContainer}>
                        {season.memberships.slice(0, 6).map((membership: any) => (
                          <View key={membership.id} style={styles.memberProfilePicture}>
                            {membership.user?.image ? (
                              <Image
                                source={{ uri: membership.user.image }}
                                style={styles.memberProfileImage}
                              />
                            ) : (
                              <View style={styles.defaultMemberProfileImage}>
                                <Text style={styles.defaultMemberProfileText}>
                                  {membership.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </Text>
                              </View>
                            )}
                          </View>
                        ))}
                        {season._count?.memberships && season._count.memberships > 6 && (
                          <View style={styles.remainingCount}>
                            <Text style={styles.remainingCountText}>
                              +{season._count.memberships - 6}
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
              
              <View style={styles.seasonInfoCard}>
                <View style={styles.seasonInfoContent}>
                  <LeagueInfoIcon width={43} height={43} style={styles.seasonInfoIcon} />
                  <View style={styles.seasonInfoTextContainer}>
                    <Text style={styles.seasonInfoTitle}>Season Details</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Players Registered: </Text>
                      <Text style={styles.detailValue}>{season?._count?.memberships || season?.memberships?.length || 0}</Text>
                    </View>
                    
                    {season?.startDate && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Start date: </Text>
                        <Text style={styles.detailValue}>{formatSeasonDate(season.startDate)}</Text>
                      </View>
                    )}
                    
                    {season?.endDate && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>End date: </Text>
                        <Text style={styles.detailValue}>{formatSeasonDate(season.endDate)}</Text>
                      </View>
                    )}
                    
                    {season?.regiDeadline && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Last registration: </Text>
                        <Text style={styles.detailValue}>{formatSeasonDate(season.regiDeadline)}</Text>
                      </View>
                    )}
                    
                    {season?.paymentRequired && season?.entryFee !== undefined && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Entry fee: </Text>
                        <Text style={styles.detailValue}>
                          RM{typeof season.entryFee === 'string' ? parseFloat(season.entryFee).toFixed(2) : season.entryFee.toFixed(2)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.howItWorksCard}>
                <View style={styles.howItWorksContent}>
                  <Text style={styles.howItWorksTitle}>How <Text style={styles.howItWorksTitleItalic}>DEUCE</Text> League Works?</Text>
                  <Text style={styles.howItWorksDescription}>
                    Friendly yet competitive, our Flex League gives every player real match play – on your schedule, at your pace.
                  </Text>
                  <Text style={styles.howItWorksSubheading}>Here's how it goes:</Text>
                  
                  <View style={styles.infoItem}>
                    <InfoIcon1 width={43} height={43} />
                    <View style={styles.infoItemTextContainer}>
                      <Text style={styles.infoItemTitle}>You're in Control</Text>
                      <Text style={styles.infoItemDescription}>Players are responsible for scheduling their own matches and booking courts. 
                        Coordinate with opponents easily through in-app chat.</Text>
                    </View>
                  </View>

                  <View style={styles.infoItem}>
                    <InfoIcon2 width={43} height={43} />
                    <View style={styles.infoItemTextContainer}>
                      <Text style={styles.infoItemTitle}>Court Fees</Text>
                      <Text style={styles.infoItemDescription}>Court rental fees aren’t included in registration – just split the cost for each match with your opponent.</Text>
                    </View>
                  </View>

                  <View style={styles.infoItem}>
                    <InfoIcon3 width={43} height={43} />
                    <View style={styles.infoItemTextContainer}>
                      <Text style={styles.infoItemTitle}>Fair Play</Text>
                      <Text style={styles.infoItemDescription}>All matches are self-umpired. We count on you to keep things respectful, fair, and fun for everyone.</Text>
                    </View>
                  </View>

                  <View style={styles.infoItem}>
                    <InfoIcon4 width={43} height={43} />
                    <View style={styles.infoItemTextContainer}>
                      <Text style={styles.infoItemTitle}>League Goal</Text>
                      <Text style={styles.infoItemDescription}>The season lasts 8 weeks – aim to play at least 7 matches to stay in the race for the top spot.</Text>
                    </View>
                  </View>

                  <View style={styles.infoItem}>
                    <InfoIcon5 width={43} height={43} />
                    <View style={styles.infoItemTextContainer}>
                      <Text style={styles.infoItemTitle}>Track Your Progress</Text>
                      <Text style={styles.infoItemDescription}>Your <Text style={styles.infoItemDescriptionItalic}>DEUCE</Text> Match Rating (DMR) updates in real time as you report scores. A performance chart helps you track your DMR journey.</Text>
                    </View>
                  </View>

                  <View style={styles.infoItem}>
                    <InfoIcon6 width={43} height={43} />
                    <View style={styles.infoItemTextContainer}>
                      <Text style={styles.infoItemTitle}>Prizes for Winners</Text>
                      <Text style={styles.infoItemDescription}>Bragging rights are great – but league champions also earn prizes.</Text>
                    </View>
                  </View>

                  <View style={styles.infoItem}>
                    <View style={styles.infoItemTextContainer}>
                      <Text style={styles.endTitle}>Ready to hit the Court?</Text>
                      <Text style={styles.endDescription}>Let's get started.</Text>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>
          </>
        )}
        </View>
      </View>
      
      {/* Sticky Button */}
      {!isLoading && !error && season && (
        <View style={[styles.stickyButtonContainer, { paddingBottom: insets.bottom }]}>
          <TouchableOpacity
            style={[styles.stickyButton, { backgroundColor: buttonConfig.color }]}
            onPress={buttonConfig.onPress}
            disabled={buttonConfig.disabled}
            activeOpacity={0.8}
          >
            <Text style={styles.stickyButtonText}>{buttonConfig.text}</Text>
          </TouchableOpacity>
        </View>
      )}

      <PaymentOptionsBottomSheet
        visible={showPaymentOptions}
        onClose={handleClosePaymentOptions}
        season={season}
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
  contentContainer: {
    flex: 1,
    zIndex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: isSmallScreen ? 16 : isTablet ? 32 : 20,
    paddingBottom: 100,
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
  seasonHeaderGradient: {
    borderRadius: 0,
    padding: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  seasonHeaderContent: {
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
  bannerContainer: {
    alignItems: 'center',
    width: '100%',
  },
  nameBanner: {
    backgroundColor: '#331850',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 0,
    width: Dimensions.get('window').width,
    marginHorizontal: -20,
    marginBottom: 20,
    alignItems: 'center',
  },
  leagueName: {
    fontSize: isSmallScreen ? 18 : isTablet ? 22 : 20,
    fontWeight: '700',
    color: '#FDFDFD',
    textAlign: 'center',
  },
  seasonName: {
    fontSize: isSmallScreen ? 14 : isTablet ? 16 : 15,
    fontWeight: '600',
    color: '#FEA04D',
    textAlign: 'center',
  },
  seasonNameHighlight: {
    fontSize: isSmallScreen ? 14 : isTablet ? 16 : 15,
    fontWeight: '600',
    color: '#FEA04D',
    textAlign: 'center',
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
  seasonInfoCard: {
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
  seasonInfoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  seasonInfoIcon: {
    flexShrink: 0,
  },
  seasonInfoTextContainer: {
    flex: 1,
  },
  seasonInfoTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '600',
    color: '#1A1C1E',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  detailLabel: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#747477',
  },
  detailValue: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#1A1C1E',
    fontWeight: '600',
  },
  howItWorksCard: {
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
  howItWorksContent: {
    gap: 16,
  },
  howItWorksTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '600',
    color: '#212427',
  },
  howItWorksTitleItalic: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '600',
    color: '#212427',
    fontStyle: 'italic',
  },
  howItWorksDescription: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#555555',
    lineHeight: 20,
  },
  howItWorksSubheading: {
    fontSize: isSmallScreen ? 14 : 15,
    fontWeight: '600',
    color: '#A04DFE',
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 12,
  },
  infoItemTextContainer: {
    flex: 1,
  },
  infoItemTitle: {
    fontSize: isSmallScreen ? 14 : 15,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 4,
  },
  infoItemDescription: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#747477',
    lineHeight: 20,
  },
  infoItemDescriptionItalic: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#747477',
    fontStyle: 'italic',
  },
  endTitle: {
    fontSize: isSmallScreen ? 13 : 14,
    fontWeight: '600',
    color: '#555555',
    textAlign: 'center',
    marginBottom: 6,
  },
  endDescription: {
    fontWeight: '600',
    fontSize: isSmallScreen ? 13 : 14,
    color: '#FEA04D',
    textAlign: 'center',
  },
  endButton: {
    backgroundColor: '#FEA04D',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
  contentBox: {
    flex: 1,
    backgroundColor: '#F6FAFC',
    borderWidth: 1,
    borderColor: '#D5D5D5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  stickyButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: isSmallScreen ? 16 : isTablet ? 24 : 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  stickyButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2B2929',
  },
});
