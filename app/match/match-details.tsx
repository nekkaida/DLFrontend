import PickleballIcon from '@/assets/images/045-PICKLEBALL.svg';
import PadelIcon from '@/assets/images/padel-icon.svg';
import TennisIcon from '@/assets/images/tennis-icon.svg';
import { getBackendBaseURL } from '@/config/network';
import { getSportColors, SportType } from '@/constants/SportsColor';
import { useSession } from '@/lib/auth-client';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

interface ParticipantWithDetails {
  userId: string;
  name?: string;
  image?: string;
  role?: string;
  team?: string;
}

export default function JoinMatchScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [participantsWithDetails, setParticipantsWithDetails] = useState<ParticipantWithDetails[]>([]);
  const [partnerInfo, setPartnerInfo] = useState<{
    hasPartner: boolean;
    partnerName?: string;
    partnerImage?: string;
    partnerId?: string;
  }>({ hasPartner: false });

  // Parse params
  const matchId = params.matchId as string;
  const matchType = (params.matchType as string) || 'SINGLES';
  const date = params.date as string;
  const time = params.time as string;
  const location = params.location as string;
  const sportType = params.sportType as string;
  const leagueName = params.leagueName as string;
  const season = params.season as string;
  const division = params.division as string;
  const courtBooked = params.courtBooked === 'true';
  const fee = params.fee as string;
  const description = params.description as string;
  const duration = params.duration as string;
  const divisionId = params.divisionId as string;
  const seasonId = params.seasonId as string;
  const participants = params.participants ? JSON.parse(params.participants as string) : [];

  const sportColors = getSportColors(sportType as SportType);
  const themeColor = sportColors.background;

  // Get sport-specific icon
  const getSportIcon = () => {
    const sport = sportType?.toUpperCase();
    if (sport?.includes('TENNIS')) return TennisIcon;
    if (sport?.includes('PADEL')) return PadelIcon; 
    if (sport?.includes('PICKLEBALL')) return PickleballIcon;
    return TennisIcon;
  };

  const SportIcon = getSportIcon();

  // Fetch participant details
  useEffect(() => {
    if (participants.length > 0 && participantsWithDetails.length === 0) {
      fetchParticipantDetails();
    }
  }, []);

  // Fetch partnership info for doubles
  useEffect(() => {
    if (matchType === 'DOUBLES' && session?.user?.id && seasonId) {
      fetchPartnershipInfo();
    }
  }, [matchType, session?.user?.id, seasonId]);

  const fetchParticipantDetails = async () => {
    try {
      const backendUrl = getBackendBaseURL();
      
      // Fetch details for each participant
      const detailsPromises = participants.map(async (p: any) => {
        try {
          const response = await fetch(`${backendUrl}/api/player/${p.userId}`, {
            headers: {
              'x-user-id': session?.user?.id || '',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            const player = data.data || data;
            return {
              userId: p.userId,
              name: player.name,
              image: player.image,
              role: p.role,
              team: p.team,
            };
          }
        } catch (error) {
        }
        
        return {
          userId: p.userId,
          name: 'Unknown Player',
          image: null,
          role: p.role,
          team: p.team,
        };
      });
      
      const details = await Promise.all(detailsPromises);
      setParticipantsWithDetails(details);
    } catch (error) {
    }
  };

  const fetchPartnershipInfo = async () => {
    try {
      const backendUrl = getBackendBaseURL();
      const response = await fetch(
        `${backendUrl}/api/pairing/partnership/active/${seasonId}`,
        {
          headers: {
            'x-user-id': session?.user?.id || '',
          },
        }
      );

      console.log('Partnership response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Partnership data received:', JSON.stringify(data, null, 2));
        
        // Handle different response structures
        const partnership = data.partnership || data.data || data;
        
        if (partnership && (partnership.captainId || partnership.captain)) {
          const currentUserId = session?.user?.id;
          const captainId = partnership.captainId || partnership.captain?.id;
          const partnerId = partnership.partnerId || partnership.partner?.id;
          const isUserCaptain = captainId === currentUserId;
          const isUserPartner = partnerId === currentUserId;

          console.log('Current user ID:', currentUserId);
          console.log('Captain ID:', captainId);
          console.log('Partner ID:', partnerId);
          console.log('Is user captain?', isUserCaptain);
          console.log('Is user partner?', isUserPartner);

          // Any partner can join - invitation will be sent to the other
          if (isUserCaptain || isUserPartner) {
            const otherUser = isUserCaptain ? partnership.partner : partnership.captain;
            setPartnerInfo({
              hasPartner: true,
              partnerName: otherUser?.name || 'Partner',
              partnerImage: otherUser?.image,
              partnerId: otherUser?.id,
            });
          } else {
            console.log('User is neither captain nor partner');
            setPartnerInfo({
              hasPartner: false,
            });
          }
        } else {
          console.log('No valid partnership data found in response');
          setPartnerInfo({
            hasPartner: false,
          });
        }
      } else {
        console.log('Partnership fetch failed with status:', response.status);
        const errorText = await response.text();
        console.log('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching partnership:', error);
    }
  };

  const pairSlots = matchType === 'DOUBLES' ? 2 - Math.ceil(participants.length / 2) : 0;

  const handleJoinMatch = async () => {
    if (!session?.user?.id || !matchId) {
      toast.error('Unable to join match');
      return;
    }

    setLoading(true);
    try {
      const backendUrl = getBackendBaseURL();
      const payload: any = { asPartner: false };

      if (matchType === 'DOUBLES' && partnerInfo.partnerId) {
        payload.partnerId = partnerInfo.partnerId;
      }

      const response = await fetch(`${backendUrl}/api/match/${matchId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': session.user.id,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error?.includes('already a participant')) {
          toast.info('You are already in this match');
          router.back();
          return;
        }
        throw new Error(errorData.error || 'Failed to join match');
      }

      toast.success('Successfully joined match!');
      router.back();
    } catch (error: any) {
      console.error('Error joining match:', error);
      toast.error(error.message || 'Failed to join match');
    } finally {
      setLoading(false);
    }
  };

  const canJoin = matchType === 'SINGLES' || (matchType === 'DOUBLES' && partnerInfo.hasPartner);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={themeColor} />
      
      {/* Custom Header */}
      <View style={[styles.header, { backgroundColor: themeColor, paddingTop: insets.top }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.leagueBadge}>
            <Text style={styles.leagueBadgeText}>LEAGUE</Text>
          </View>
        </View>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{matchType === 'DOUBLES' ? 'Doubles' : 'Singles'} League Match</Text>
          <Text style={styles.headerLeagueName}>{leagueName || 'League Match'}</Text>
          <Text style={styles.headerSeason}>{season || 'Season 1'} - {division || 'Division 1'}</Text>
        </View>

        <View style={styles.headerIcon}>
          <SportIcon width={80} height={80} fill="#FFFFFF" />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Participants Section */}
        <View style={styles.participantsSection}>
          <View style={styles.playersRow}>
            {matchType === 'DOUBLES' ? (
              <>
                {/* Team 1 - Left Side */}
                <View style={styles.teamSection}>
                  <View style={styles.teamPlayers}>
                    <View style={styles.doublesPlayerContainer}>
                      <View style={styles.playerAvatar}>
                        {participantsWithDetails[0] ? (
                          participantsWithDetails[0].image ? (
                            <Image source={{ uri: participantsWithDetails[0].image }} style={styles.avatarImage} />
                          ) : (
                            <View style={styles.defaultAvatar}>
                              <Text style={styles.defaultAvatarText}>
                                {participantsWithDetails[0].name?.charAt(0)?.toUpperCase() || '?'}
                              </Text>
                            </View>
                          )
                        ) : (
                          <View style={styles.emptySlot}>
                            <Ionicons name="person-outline" size={24} color="#9CA3AF" />
                          </View>
                        )}
                      </View>
                      <Text style={styles.playerName} numberOfLines={1}>
                        {participantsWithDetails[0]?.name || 'Open slot'}
                      </Text>
                    </View>
                    <View style={styles.doublesPlayerContainer}>
                      <View style={styles.playerAvatar}>
                        {participantsWithDetails[1] ? (
                          participantsWithDetails[1].image ? (
                            <Image source={{ uri: participantsWithDetails[1].image }} style={styles.avatarImage} />
                          ) : (
                            <View style={styles.defaultAvatar}>
                              <Text style={styles.defaultAvatarText}>
                                {participantsWithDetails[1].name?.charAt(0)?.toUpperCase() || '?'}
                              </Text>
                            </View>
                          )
                        ) : (
                          <View style={styles.emptySlot}>
                            <Ionicons name="person-outline" size={24} color="#9CA3AF" />
                          </View>
                        )}
                      </View>
                      <Text style={styles.playerName} numberOfLines={1}>
                        {participantsWithDetails[1]?.name || 'Open slot'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Vertical Divider */}
                <View style={styles.verticalDivider} />

                {/* Team 2 - Right Side */}
                <View style={styles.teamSection}>
                  <View style={styles.teamPlayers}>
                    <View style={styles.doublesPlayerContainer}>
                      <View style={styles.playerAvatar}>
                        {participantsWithDetails[2] ? (
                          participantsWithDetails[2].image ? (
                            <Image source={{ uri: participantsWithDetails[2].image }} style={styles.avatarImage} />
                          ) : (
                            <View style={styles.defaultAvatar}>
                              <Text style={styles.defaultAvatarText}>
                                {participantsWithDetails[2].name?.charAt(0)?.toUpperCase() || '?'}
                              </Text>
                            </View>
                          )
                        ) : (
                          <View style={styles.emptySlot}>
                            <Ionicons name="person-outline" size={24} color="#9CA3AF" />
                          </View>
                        )}
                      </View>
                      <Text style={styles.playerName} numberOfLines={1}>
                        {participantsWithDetails[2]?.name || 'Open slot'}
                      </Text>
                    </View>
                    <View style={styles.doublesPlayerContainer}>
                      <View style={styles.playerAvatar}>
                        {participantsWithDetails[3] ? (
                          participantsWithDetails[3].image ? (
                            <Image source={{ uri: participantsWithDetails[3].image }} style={styles.avatarImage} />
                          ) : (
                            <View style={styles.defaultAvatar}>
                              <Text style={styles.defaultAvatarText}>
                                {participantsWithDetails[3].name?.charAt(0)?.toUpperCase() || '?'}
                              </Text>
                            </View>
                          )
                        ) : (
                          <View style={styles.emptySlot}>
                            <Ionicons name="person-outline" size={24} color="#9CA3AF" />
                          </View>
                        )}
                      </View>
                      <Text style={styles.playerName} numberOfLines={1}>
                        {participantsWithDetails[3]?.name || 'Open slot'}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            ) : (
              <>
                {/* Singles - Player 1 */}
                <View style={styles.playerSection}>
                  <View style={styles.playerAvatar}>
                    {participantsWithDetails[0] ? (
                      participantsWithDetails[0].image ? (
                        <Image source={{ uri: participantsWithDetails[0].image }} style={styles.avatarImage} />
                      ) : (
                        <View style={styles.defaultAvatar}>
                          <Text style={styles.defaultAvatarText}>
                            {participantsWithDetails[0].name?.charAt(0)?.toUpperCase() || '?'}
                          </Text>
                        </View>
                      )
                    ) : (
                      <View style={styles.emptySlot}>
                        <Ionicons name="person-outline" size={24} color="#9CA3AF" />
                      </View>
                    )}
                  </View>
                  <Text style={styles.playerName} numberOfLines={1}>
                    {participantsWithDetails[0]?.name || 'Open slot'}
                  </Text>
                </View>
                
                {/* Vertical Divider */}
                
                <View style={styles.verticalDivider} />


                {/* Singles - Player 2 */}
                <View style={styles.playerSection}>
                  <View style={styles.playerAvatar}>
                    {participantsWithDetails[1] ? (
                      participantsWithDetails[1].image ? (
                        <Image source={{ uri: participantsWithDetails[1].image }} style={styles.avatarImage} />
                      ) : (
                        <View style={styles.defaultAvatar}>
                          <Text style={styles.defaultAvatarText}>
                            {participantsWithDetails[1].name?.charAt(0)?.toUpperCase() || '?'}
                          </Text>
                        </View>
                      )
                    ) : (
                      <View style={styles.emptySlot}>
                        <Ionicons name="person-outline" size={24} color="#9CA3AF" />
                      </View>
                    )}
                  </View>
                  <Text style={styles.playerName} numberOfLines={1}>
                    {participantsWithDetails[1]?.name || 'Open slot'}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Date & Time */}
        <View style={styles.detailRow}>
          <View style={styles.iconContainer}>
            <Ionicons name="calendar-outline" size={24} color={themeColor} />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailTitle}>{date} at {time}</Text>
            <Text style={styles.detailSubtitle}>{duration || 2} hour(s)</Text>
          </View>
        </View>

        {/* Location */}
        <View style={styles.detailRow}>
          <View style={styles.iconContainer}>
            <Ionicons name="location-outline" size={24} color={themeColor} />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailTitle}>{location || 'TBD'}</Text>
            {/* <Text style={styles.detailAddress}>
              Lot 15, Carpark behind BP Healthcare, Lot 3470, Jalan SS 23/15, Taman Sea, 47300 Petaling Jaya, Selangor
            </Text> */}
            <View style={styles.courtStatusContainer}>
              {courtBooked ? (
                <View style={styles.courtBadge}>
                  <Text style={styles.courtBadgeText}>Court booked</Text>
                  <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
                </View>
              ) : (
                <View style={[styles.courtBadge, { backgroundColor: '#FEF2F2' }]}>
                  <Text style={[styles.courtBadgeText, { color: '#EF4444' }]}>Court not booked</Text>
                  <Ionicons name="close-circle" size={14} color="#EF4444" />
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Fee */}
        <View style={styles.detailRow}>
          <View style={styles.iconContainer}>
            <Ionicons name="cash-outline" size={24} color={themeColor} />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailTitle}>Split - Estimated {fee || 'RM50.00'} per player</Text>
            <Text style={styles.detailSubtitle}>
              The per-player fee is estimated. The final amount depends on how many players join this match.
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionTitle}>Description</Text>
          <Text style={styles.descriptionText}>
            {description || ''}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Partnership Status for Doubles */}
        {matchType === 'DOUBLES' && (
          <View style={styles.partnershipStatus}>
            {partnerInfo.hasPartner ? (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                <Text style={styles.successBannerText}>
                  An invitation will be sent to {partnerInfo.partnerName} to join this match
                </Text>
              </View>
            ) : (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                <Text style={styles.errorBannerText}>
                  You need an active partnership to join doubles matches
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Report Section */}
        <TouchableOpacity style={styles.reportButton}>
          <Text style={styles.reportButtonText}>Report a problem</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer with Join Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[
            styles.joinButton,
            { backgroundColor:"#FEA04D" },
            (loading || !canJoin) && styles.joinButtonDisabled
          ]}
          onPress={handleJoinMatch}
          disabled={loading || !canJoin}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.joinButtonText}>Join Match</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  leagueBadge: {
    backgroundColor: '#FEA04D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  leagueBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  headerContent: {
    paddingHorizontal: 24,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  headerLeagueName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSeason: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  headerIcon: {
    position: 'absolute',
    bottom: -10,
    right: 10,
    opacity: 0.8,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingTop: 24,
    paddingBottom: 32,
  },
  participantsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerSection: {
    alignItems: 'center',
    flex: 1,
  },
  teamSection: {
    alignItems: 'center',
    flex: 1,
  },
  teamPlayers: {
    flexDirection: 'row',
    gap: 12,
  },
  doublesPlayerContainer: {
    alignItems: 'center',
    maxWidth: 60,
  },
  playerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 6,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  defaultAvatar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptySlot: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 24,
  },
  playerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  vsContainer: {
    paddingHorizontal: 16,
  },
  vsText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  verticalDivider: {
    width: 1,
    height: 80,
    backgroundColor: '#E2E2E2',
    marginHorizontal: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E2E2',
    marginHorizontal: 24,
  },
  detailRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 16,
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  detailSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  detailAddress: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  courtStatusContainer: {
    flexDirection: 'row',
  },
  courtBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  courtBadgeText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '500',
  },
  descriptionSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
  },
  descriptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  partnershipStatus: {
    marginHorizontal: 24,
    marginTop: 20,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  successBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#166534',
    fontWeight: '500',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
  reportButton: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  reportButtonText: {
    fontSize: 13,
    color: '#6B7280',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  joinButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  joinButtonDisabled: {
    opacity: 0.5,
  },
  joinButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
