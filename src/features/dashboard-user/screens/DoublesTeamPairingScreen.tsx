import React from 'react';
import { ScrollView, Text, View, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, Image, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SportSwitcher } from '@/shared/components/ui/SportSwitcher';
import { authClient } from '@/lib/auth-client';
import { useSession } from '@/lib/auth-client';
import * as Haptics from 'expo-haptics';
import { getBackendBaseURL } from '@/src/config/network';
import { SeasonService, Season } from '@/src/features/dashboard-user/services/SeasonService';
import { LeagueService } from '@/src/features/leagues/services/LeagueService';
import { PaymentOptionsBottomSheet, InvitePartnerBottomSheet } from '../components';
import { toast } from 'sonner-native';
import { SocketService } from '@/lib/socket-service';
import BackButtonIcon from '@/assets/icons/back-button.svg';
import TeamPlusIcon from '@/assets/icons/teamp_plus.svg';
import TeamUpBulbIcon from '@/assets/icons/teamup_bulb.svg';

const { width } = Dimensions.get('window');

const isSmallScreen = width < 375;
const isTablet = width > 768;

interface DoublesTeamPairingScreenProps {
  seasonId: string;
  seasonName?: string;
  leagueId?: string;
  sport?: 'pickleball' | 'tennis';
}

interface Player {
  id: string;
  name: string;
  username?: string;
  displayUsername?: string;
  image: string | null;
  skillRatings?: any;
}

export default function DoublesTeamPairingScreen({
  seasonId,
  seasonName = 'Season',
  leagueId,
  sport = 'pickleball'
}: DoublesTeamPairingScreenProps) {
  const { data: session } = useSession();
  const [season, setSeason] = React.useState<Season | null>(null);
  const [league, setLeague] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [profileData, setProfileData] = React.useState<any>(null);
  const [selectedPartner, setSelectedPartner] = React.useState<Player | null>(null);
  const [selectedSport, setSelectedSport] = React.useState<'pickleball' | 'tennis' | 'padel'>('pickleball');
  const [showInvitePartnerSheet, setShowInvitePartnerSheet] = React.useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = React.useState(false);

  // Season invitation/partnership state
  const [invitationStatus, setInvitationStatus] = React.useState<'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'declined' | 'expired'>('none');
  const [partnershipStatus, setPartnershipStatus] = React.useState<'none' | 'active'>('none');
  const [currentInvitation, setCurrentInvitation] = React.useState<any>(null);
  const [currentPartnership, setCurrentPartnership] = React.useState<any>(null);
  const [isPairingLoading, setIsPairingLoading] = React.useState(false);

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

  // Debug: Log state changes
  React.useEffect(() => {
    console.log('🔍 DoublesTeamPairing State:', {
      invitationStatus,
      partnershipStatus,
      selectedPartner: selectedPartner?.name || 'none',
      isPairingLoading,
      disabled: invitationStatus !== 'none' || partnershipStatus === 'active'
    });
  }, [invitationStatus, partnershipStatus, selectedPartner, isPairingLoading]);

  // Check pairing status when screen loads
  React.useEffect(() => {
    if (seasonId && userId) {
      checkPairingStatus();
    }
  }, [seasonId, userId]);

  // Setup Socket.IO listeners for real-time updates
  React.useEffect(() => {
    const socketService = SocketService.getInstance();

    // Handler for when user receives a new season invitation
    const handleInvitationReceived = (data: any) => {
      console.log('DoublesTeamPairing: Received invitation:', data);
      if (data.season?.id === seasonId) {
        toast.info('New season invitation!', {
          description: `${data.sender?.name} invited you to join this season.`,
        });
        checkPairingStatus(); // Refresh status
      }
    };

    // Handler for when sent invitation is accepted
    const handleInvitationAccepted = (data: any) => {
      console.log('DoublesTeamPairing: Invitation accepted:', data);
      if (data.partnership?.season?.id === seasonId) {
        toast.success('Invitation accepted!', {
          description: `${data.acceptedBy?.name} accepted your invitation.`,
        });
        checkPairingStatus(); // Refresh status
      }
    };

    // Handler for partnership creation
    const handlePartnershipCreated = (data: any) => {
      console.log('DoublesTeamPairing: Partnership created:', data);
      if (data.partnership?.season?.id === seasonId) {
        toast.success('Partnership created!', {
          description: 'You can now register your team.',
        });
        checkPairingStatus(); // Refresh status
      }
    };

    // Register listeners
    socketService.on('season_invitation_received', handleInvitationReceived);
    socketService.on('season_invitation_accepted', handleInvitationAccepted);
    socketService.on('partnership_created', handlePartnershipCreated);

    // Cleanup listeners on unmount
    return () => {
      socketService.off('season_invitation_received', handleInvitationReceived);
      socketService.off('season_invitation_accepted', handleInvitationAccepted);
      socketService.off('partnership_created', handlePartnershipCreated);
    };
  }, [seasonId]);

  const checkPairingStatus = async () => {
    if (!seasonId || !userId) return;

    try {
      setIsPairingLoading(true);
      const backendUrl = getBackendBaseURL();

      // Check for active partnership
      const partnershipResponse = await authClient.$fetch(
        `${backendUrl}/api/pairing/partnership/active/${seasonId}`,
        { method: 'GET' }
      );

      const partnershipData = (partnershipResponse as any)?.data?.data || (partnershipResponse as any)?.data;
      console.log('🔎 Partnership response:', { partnershipData, hasData: !!partnershipData });

      if (partnershipData && partnershipData.id) {
        // Active partnership exists
        setPartnershipStatus('active');
        setCurrentPartnership(partnershipData);
        setInvitationStatus('accepted');

        // Set partner based on role
        const partner = partnershipData.captainId === userId
          ? partnershipData.partner
          : partnershipData.captain;
        setSelectedPartner(partner);
        return;
      }

      // No partnership, check for pending invitation
      const invitationResponse = await authClient.$fetch(
        `${backendUrl}/api/pairing/season/invitation/pending/${seasonId}`,
        { method: 'GET' }
      );

      const invitationData = (invitationResponse as any)?.data?.data || (invitationResponse as any)?.data;
      console.log('🔎 Invitation response:', { invitationData, hasData: !!invitationData });

      if (invitationData && invitationData.id) {
        setCurrentInvitation(invitationData);

        // Determine invitation status based on direction
        if (invitationData.direction === 'sent') {
          setInvitationStatus('pending_sent');
          setSelectedPartner(invitationData.recipient);
        } else {
          setInvitationStatus('pending_received');
          setSelectedPartner(invitationData.sender);
        }
      } else {
        // No invitation or partnership
        setInvitationStatus('none');
        setPartnershipStatus('none');
      }
    } catch (error) {
      console.error('Error checking pairing status:', error);
    } finally {
      setIsPairingLoading(false);
    }
  };

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

  const handleInvitePartner = () => {
    console.log('🎯 Invite Partner tapped!', { invitationStatus, partnershipStatus });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Small delay to prevent immediate backdrop tap
    setTimeout(() => {
      setShowInvitePartnerSheet(true);
    }, 100);
  };

  const handlePartnerSelected = async (player: Player) => {
    console.log('🎯 handlePartnerSelected called with player:', player.name, 'userId:', userId, 'seasonId:', seasonId);

    if (!userId || !seasonId) {
      console.log('❌ Missing userId or seasonId, aborting');
      return;
    }

    try {
      console.log('✅ Setting selected partner:', player.name);
      setSelectedPartner(player);

      // Send season invitation
      const backendUrl = getBackendBaseURL();
      const invitationPayload = {
        recipientId: player.id,
        seasonId: seasonId,
        message: null
      };
      console.log('📤 Sending invitation with payload:', invitationPayload);

      const response = await authClient.$fetch(
        `${backendUrl}/api/pairing/season/invitation`,
        {
          method: 'POST',
          body: invitationPayload
        }
      );

      console.log('✅ Invitation API response:', response);
      const responseData = (response as any)?.data || response;
      if (responseData) {
        toast.success('Invitation sent!', {
          description: `Season invitation sent to ${player.name}.`,
        });

        // Refresh pairing status to show pending state
        await checkPairingStatus();
      }
    } catch (error) {
      console.error('Error sending season invitation:', error);
      toast.error('Failed to send invitation');
      setSelectedPartner(null);
    }
  };

  const handleRegisterTeam = () => {
    if (!selectedPartner) {
      toast.error('Please select a partner first');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowPaymentOptions(true);
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
    if (!userId || !season || !selectedPartner) {
      toast.error('Missing required information');
      return;
    }

    try {
      console.log('Registering team for season (Pay Later):', season.id);
      // TODO: Update this to register the team with both players
      const success = await SeasonService.registerForSeason(season.id, userId);

      if (success) {
        console.log('Team registered successfully');
        toast.success('Team registered successfully!');
        fetchSeasonData(); // Refresh data
      } else {
        console.warn('Registration failed');
        toast.error('Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Error registering team:', err);
      toast.error('An error occurred while registering.');
    }
  };

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

  const getDoublesDMR = () => {
    if (!profileData?.skillRatings) return 'N/A';
    const sportKeys = Object.keys(profileData.skillRatings);
    if (sportKeys.length === 0) return 'N/A';

    const firstSport = profileData.skillRatings[sportKeys[0]];
    const doublesRating = firstSport?.doubles;

    if (doublesRating) {
      return Math.round(doublesRating * 1000).toString();
    }

    return 'N/A';
  };

  const getTeamDMR = () => {
    // Only calculate Team DMR when partnership is ACTIVE
    if (!selectedPartner || partnershipStatus !== 'active') {
      return '-';
    }

    // Get current user's DMR
    const userDMR = getDoublesDMR();
    if (userDMR === 'N/A') return 'N/A';

    // Get partner's DMR
    const partnerSkillRatings = selectedPartner?.skillRatings;
    if (!partnerSkillRatings) return 'N/A';

    const sportKeys = Object.keys(partnerSkillRatings);
    if (sportKeys.length === 0) return 'N/A';

    const firstSport = partnerSkillRatings[sportKeys[0]];
    const partnerDoublesRating = firstSport?.doubles;

    if (!partnerDoublesRating) return 'N/A';

    const partnerDMR = Math.round(partnerDoublesRating * 1000);

    // Calculate Team DMR (average of both players)
    const teamDMR = Math.round((parseInt(userDMR) + partnerDMR) / 2);
    return teamDMR.toString();
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
            <ActivityIndicator size="large" color="#A04DFE" />
            <Text style={styles.loadingText}>Loading...</Text>
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
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.back();
                }}
              >
                <BackButtonIcon width={12} height={19} />
              </TouchableOpacity>
              <LinearGradient
                colors={['#A04DFE', '#602E98']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.seasonHeaderGradient}
                pointerEvents="none"
              >
                  <View style={styles.seasonHeaderContent}>
                  <View style={styles.topRow}>
                    <View style={styles.backButtonContainer}>
                      <View />
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
                  </View>
                </View>
              </LinearGradient>
            </View>

            <ScrollView
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              onTouchStart={() => console.log('📜 ScrollView touch detected')}
            >
              <View style={styles.teamUpCard}>
                <Text style={styles.teamUpTitle}>Team up!</Text>
                <View style={styles.descriptionContainer}>
                  <TeamUpBulbIcon width={43} height={43} />
                  <Text style={styles.teamUpDescription}>
                    Only one player needs to register and pay the entry fee for your team. The player who sends the invite (Team Captain) completes the registration.
                  </Text>
                </View>

                <View
                  style={styles.playerPairContainer}
                  onLayout={(event) => {
                    const { x, y, width, height } = event.nativeEvent.layout;
                    console.log('📦 playerPairContainer layout:', { x, y, width, height });
                  }}
                >
                  {/* Current Player */}
                  <View style={styles.playerCard}>
                    {profileData?.image || session?.user?.image ? (
                      <Image
                        source={{ uri: profileData?.image || session?.user?.image }}
                        style={styles.playerAvatar}
                      />
                    ) : (
                      <View style={styles.defaultAvatar}>
                        <Text style={styles.defaultAvatarText}>
                          {(profileData?.name || session?.user?.name)?.charAt(0)?.toUpperCase() || 'U'}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.playerName} numberOfLines={1}>
                      {profileData?.name || session?.user?.name || 'You'}
                    </Text>
                    <Text style={styles.playerDMR}>DMR: {getDoublesDMR()}</Text>

                    {/* Show role label during pending invitations */}
                    {invitationStatus === 'pending_sent' && (
                      <Text style={styles.roleLabel}>Team Captain</Text>
                    )}
                    {invitationStatus === 'pending_received' && (
                      <Text style={styles.roleLabel}>Team Member</Text>
                    )}
                  </View>

                  {/* Plus Icon */}
                  <View style={styles.plusContainer}>
                    <TeamPlusIcon width={34} height={34} />
                  </View>

                  {/* Partner Placeholder or Selected Partner */}
                  <TouchableOpacity
                    style={styles.partnerCard}
                    onPress={() => {
                      console.log('👆 Partner card tapped!', {
                        disabled: invitationStatus !== 'none' || partnershipStatus === 'active',
                        invitationStatus,
                        partnershipStatus
                      });
                      handleInvitePartner();
                    }}
                    onPressIn={() => console.log('🖐️ TouchableOpacity PressIn detected')}
                    onPressOut={() => console.log('🖐️ TouchableOpacity PressOut detected')}
                    onLayout={(event) => {
                      const { x, y, width, height } = event.nativeEvent.layout;
                      console.log('📐 Partner card layout:', { x, y, width, height });
                    }}
                    activeOpacity={0.7}
                    disabled={invitationStatus !== 'none' || partnershipStatus === 'active'}
                  >
                    {selectedPartner ? (
                      <>
                        <View
                          style={[
                            invitationStatus === 'pending_sent' && styles.pendingAvatarContainer,
                            invitationStatus === 'pending_received' && styles.pendingAvatarContainer,
                            { opacity: invitationStatus === 'pending_sent' || invitationStatus === 'pending_received' ? 0.5 : 1 }
                          ]}
                        >
                          {selectedPartner.image ? (
                            <Image
                              source={{ uri: selectedPartner.image }}
                              style={styles.playerAvatar}
                            />
                          ) : (
                            <View style={styles.defaultAvatar}>
                              <Text style={styles.defaultAvatarText}>
                                {selectedPartner.name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.playerName,
                            { opacity: invitationStatus === 'pending_sent' || invitationStatus === 'pending_received' ? 0.6 : 1 }
                          ]}
                          numberOfLines={1}
                        >
                          {selectedPartner.name}
                        </Text>

                        {/* Show "Pending..." during pending states, DMR when active */}
                        {(invitationStatus === 'pending_sent' || invitationStatus === 'pending_received') && (
                          <Text style={[styles.playerDMR, { opacity: 0.6 }]}>Pending...</Text>
                        )}

                        {partnershipStatus === 'active' && (
                          <>
                            <Text style={styles.playerDMR}>
                              DMR: {(() => {
                                const partnerSkillRatings = selectedPartner?.skillRatings;
                                if (!partnerSkillRatings) return 'N/A';
                                const sportKeys = Object.keys(partnerSkillRatings);
                                if (sportKeys.length === 0) return 'N/A';
                                const firstSport = partnerSkillRatings[sportKeys[0]];
                                const partnerDoublesRating = firstSport?.doubles;
                                if (!partnerDoublesRating) return 'N/A';
                                return Math.round(partnerDoublesRating * 1000).toString();
                              })()}
                            </Text>
                            <TouchableOpacity style={styles.unlinkButton} onPress={() => {
                              // TODO: Implement unlink functionality
                              console.log('Unlink partner');
                            }}>
                              <Text style={styles.unlinkButtonText}>Unlink</Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <View style={styles.placeholderCircle}>
                          <Ionicons name="person-outline" size={32} color="#BABABA" />
                        </View>
                        <Text style={styles.inviteText}>Tap to invite partner</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.teamDMRChipContainer}>
                  <LinearGradient
                    colors={['#A04DFE', '#602E98']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.teamDMRChip}
                  >
                    <Text style={styles.teamDMRText}>Team DMR: {getTeamDMR()}</Text>
                  </LinearGradient>
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
            style={[
              styles.stickyButton,
              {
                backgroundColor:
                  partnershipStatus === 'active'
                    ? '#FEA04D'
                    : invitationStatus === 'pending_sent' || invitationStatus === 'pending_received'
                    ? '#B2B2B2'
                    : selectedPartner
                    ? '#B2B2B2'
                    : '#B2B2B2',
              },
            ]}
            onPress={handleRegisterTeam}
            disabled={partnershipStatus !== 'active'}
            activeOpacity={0.8}
          >
            <Text style={styles.stickyButtonText}>
              {partnershipStatus === 'active'
                ? 'Register Team'
                : invitationStatus === 'pending_sent'
                ? 'Waiting for Partner'
                : invitationStatus === 'pending_received'
                ? 'Accept in Invitations Tab'
                : 'Select Partner First'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <InvitePartnerBottomSheet
        visible={showInvitePartnerSheet}
        onClose={() => setShowInvitePartnerSheet(false)}
        seasonId={seasonId}
        onPlayerSelect={handlePartnerSelected}
      />

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
  headerRight: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
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
  gradientHeaderContainer: {
    width: '100%',
    marginBottom: -40,
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
    paddingBottom: 56,
  },
  seasonHeaderContent: {
    gap: 12,
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
    alignItems: 'center',
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
  backButton: {
    position: 'absolute',
    top: 24,
    left: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  leagueNameContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 52,
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
  contentBox: {
    flex: 1,
    backgroundColor: '#F6FAFC',
    borderWidth: 1,
    borderColor: '#D5D5D5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  teamUpCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: isSmallScreen ? 20 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  teamUpTitle: {
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: '700',
    color: '#1D1D1F',
    textAlign: 'center',
    marginBottom: 12,
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 24,
  },
  teamUpDescription: {
    flex: 1,
    fontSize: isSmallScreen ? 13 : 14,
    color: '#86868B',
    textAlign: 'left',
    lineHeight: 16,
  },
  playerPairContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  playerCard: {
    flex: 1,
    alignItems: 'center',
    minHeight: 180,
    justifyContent: 'flex-start',
  },
  partnerCard: {
    flex: 1,
    alignItems: 'center',
    minHeight: 180,
    justifyContent: 'flex-start',
  },
  pendingAvatarContainer: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#FFA500',
    borderRadius: 35,
    padding: 2,
  },
  playerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  defaultAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6de9a0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 'bold',
  },
  placeholderCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#BABABA',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  playerName: {
    fontSize: isSmallScreen ? 13 : 14,
    fontWeight: '600',
    color: '#1D1D1F',
    marginTop: 12,
    textAlign: 'center',
  },
  playerDMR: {
    fontSize: isSmallScreen ? 11 : 12,
    color: '#86868B',
    marginTop: 4,
  },
  inviteText: {
    fontSize: isSmallScreen ? 13 : 14,
    fontWeight: '600',
    color: '#BABABA',
    marginTop: 8,
    textAlign: 'center',
  },
  partnerLabel: {
    fontSize: isSmallScreen ? 11 : 12,
    color: '#86868B',
    marginTop: 4,
  },
  roleLabel: {
    fontSize: isSmallScreen ? 10 : 11,
    color: '#A04DFE',
    marginTop: 6,
    fontWeight: '600',
  },
  unlinkButton: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF3B30',
    borderRadius: 6,
  },
  unlinkButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  statusLabel: {
    fontSize: isSmallScreen ? 11 : 12,
    color: '#FFA500',
    marginTop: 4,
    fontWeight: '600',
  },
  statusLabelReceived: {
    fontSize: isSmallScreen ? 11 : 12,
    color: '#A04DFE',
    marginTop: 4,
    fontWeight: '600',
  },
  plusContainer: {
    width: 56,
    height: 70,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 0,
  },
  teamDMRChipContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 28,
  },
  teamDMRChip: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  teamDMRText: {
    color: '#FDFDFD',
    fontSize: 13,
    fontWeight: '600',
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
