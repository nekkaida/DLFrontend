import PickleballIcon from '@/assets/images/045-PICKLEBALL.svg';
import PadelIcon from '@/assets/images/padel-icon.svg';
import TennisIcon from '@/assets/images/tennis-icon.svg';
import { getBackendBaseURL } from '@/config/network';
import { getSportColors, SportType } from '@/constants/SportsColor';
import { useSession } from '@/lib/auth-client';
import axiosInstance, { endpoints } from '@/lib/endpoints';
import { socketService } from '@/lib/socket-service';
import { MatchResultSheet } from '@/src/features/match/components/MatchResultSheet';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  invitationStatus?: string;
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
  
  // Match data for result submission logic
  const [matchData, setMatchData] = useState<{
    createdById: string | null;
    resultSubmittedById: string | null;
    status: string;
  }>({ createdById: null, resultSubmittedById: null, status: 'SCHEDULED' });
  
  // Partnership data with captain info
  const [partnershipData, setPartnershipData] = useState<{
    captainId: string | null;
    partnerId: string | null;
  }>({ captainId: null, partnerId: null });
  
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['75%', '90%'], []);

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
  const matchStatus = (params.status as string) || 'SCHEDULED';

  // Debug log only once - remove later
  // console.log('🔍 MATCH DETAILS DEBUG:', { matchId, matchStatus });

  const sportColors = getSportColors(sportType as SportType);
  const themeColor = sportColors.background;

  // Backdrop component for bottom sheet
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

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

  // Fetch match data (createdById, resultSubmittedById, status)
  useEffect(() => {
    const fetchMatchData = async () => {
      if (!matchId || !session?.user?.id) return;
      
      try {
        const backendUrl = getBackendBaseURL();
        const response = await fetch(`${backendUrl}/api/match/${matchId}`, {
          headers: {
            'x-user-id': session.user.id,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          const match = data.match || data;
          setMatchData({
            createdById: match.createdById || null,
            resultSubmittedById: match.resultSubmittedById || null,
            status: match.status || 'SCHEDULED',
          });
        }
      } catch (error) {
        console.error('Error fetching match data:', error);
      }
    };
    
    fetchMatchData();
  }, [matchId, session?.user?.id]);

  // Fetch partnership info for doubles
  useEffect(() => {
    if (matchType === 'DOUBLES' && session?.user?.id && seasonId) {
      fetchPartnershipInfo();
    }
  }, [matchType, session?.user?.id, seasonId]);

  // Listen for real-time match updates
  useEffect(() => {
    const handleMatchUpdate = (data: any) => {
      console.log('🔄 Match updated in real-time:', data);
      
      // If this is our match, refresh participant details
      if (data.matchId === matchId) {
        if (data.participants) {
          // Update participants with new data
          fetchParticipantDetails();
          toast.success('Match updated - new player joined!');
        }
      }
    };

    // Subscribe to match update events
    socketService.on('match_participant_joined', handleMatchUpdate);
    socketService.on('match_updated', handleMatchUpdate);

    // Cleanup on unmount
    return () => {
      socketService.off('match_participant_joined', handleMatchUpdate);
      socketService.off('match_updated', handleMatchUpdate);
    };
  }, [matchId]);

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
              invitationStatus: p.invitationStatus,
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
          invitationStatus: p.invitationStatus,
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

          // Save partnership data for result submission logic
          setPartnershipData({
            captainId: captainId || null,
            partnerId: partnerId || null,
          });

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

  // Check if all slots are filled
  const requiredParticipants = matchType === 'DOUBLES' ? 4 : 2;
  const allSlotsFilled = participants.length >= requiredParticipants;

  // Check if result submission is allowed (match time until duration + 1 hour)
  const isMatchTimeReached = () => {
    if (!date || !time) {
      return false;
    }
    
    try {
      // Parse date using manual parsing for "Dec 04, 2025" format
      const datePartsMatch = date.match(/(\w+)\s+(\d+),\s+(\d+)/);
      if (!datePartsMatch) {
        console.error('❌ Invalid date format:', date);
        return false;
      }

      const [, monthStr, day, year] = datePartsMatch;
      const monthMap: { [key: string]: number } = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      const month = monthMap[monthStr];
      if (month === undefined) {
        console.error('❌ Invalid month:', monthStr);
        return false;
      }

      // Parse time using manual parsing for "1:30 PM" format
      const timeMatch = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!timeMatch) {
        console.error('❌ Invalid time format:', time);
        return false;
      }

      const [, hourStr, minuteStr, period] = timeMatch;
      let hours = parseInt(hourStr);
      const minutes = parseInt(minuteStr);
      
      // Convert to 24-hour format
      if (period.toUpperCase() === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
      }

      // Create match start time
      const matchStartTime = new Date(parseInt(year), month, parseInt(day), hours, minutes);
      
      // Validate the date
      if (isNaN(matchStartTime.getTime())) {
        console.error('❌ Invalid date created:', { date, time, matchStartTime });
        return false;
      }

      // Calculate match end time (duration + 1 hour grace period)
      const matchDuration = parseInt(duration || '2'); // Default 2 hours
      const graceHours = 1;
      const totalHours = matchDuration + graceHours;
      const matchEndTime = new Date(matchStartTime.getTime() + totalHours * 60 * 60 * 1000);
      
      const now = new Date();
      
      // Check if current time is between match start and end (+ grace period)
      const hasStarted = now >= matchStartTime;
      const isBeforeEnd = now <= matchEndTime;
      const canSubmit = hasStarted && isBeforeEnd;
      
      // Debug log removed to prevent spam
      
      return canSubmit;
    } catch (error) {
      console.error('❌ Error parsing match date/time:', error, { date, time });
      return false;
    }
  };

  const canStartMatch = allSlotsFilled && isMatchTimeReached();

  // Get match status badge with real-time progression
  const getStatusBadge = () => {
    const status = matchStatus.toUpperCase();
    
    let badgeColor = '#E5E7EB';
    let textColor = '#6B7280';
    let statusText = 'Open';
    
    // Calculate time-based status
    const getTimeBasedStatus = () => {
      if (!date || !time) return null;
      
      try {
        const datePartsMatch = date.match(/(\w+)\s+(\d+),\s+(\d+)/);
        if (!datePartsMatch) return null;

        const [, monthStr, day, year] = datePartsMatch;
        const monthMap: { [key: string]: number } = {
          'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
          'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        const month = monthMap[monthStr];
        if (month === undefined) return null;

        const timeMatch = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!timeMatch) return null;

        const [, hourStr, minuteStr, period] = timeMatch;
        let hours = parseInt(hourStr);
        const minutes = parseInt(minuteStr);
        
        if (period.toUpperCase() === 'PM' && hours !== 12) {
          hours += 12;
        } else if (period.toUpperCase() === 'AM' && hours === 12) {
          hours = 0;
        }

        const matchStartTime = new Date(parseInt(year), month, parseInt(day), hours, minutes);
        if (isNaN(matchStartTime.getTime())) return null;

        const matchDuration = parseInt(duration || '2');
        const graceHours = 1;
        const matchEndTime = new Date(matchStartTime.getTime() + (matchDuration + graceHours) * 60 * 60 * 1000);
        
        const now = new Date();
        
        // Before match starts
        if (now < matchStartTime) {
          return 'scheduled';
        }
        // Match is ongoing (between start and end of duration)
        else if (now >= matchStartTime && now <= new Date(matchStartTime.getTime() + matchDuration * 60 * 60 * 1000)) {
          return 'in_progress';
        }
        // Grace period (duration ended but within grace time)
        else if (now > new Date(matchStartTime.getTime() + matchDuration * 60 * 60 * 1000) && now <= matchEndTime) {
          return 'time_passed';
        }
        // After grace period
        else {
          return 'time_passed';
        }
      } catch (error) {
        return null;
      }
    };
    
    const timeBasedStatus = getTimeBasedStatus();
    
    // Status priority: DB status > time-based status
    switch (status) {
      case 'COMPLETED':
      case 'FINISHED':
        badgeColor = '#D1FAE5';
        textColor = '#000000ff';
        statusText = 'Finished';
        break;
      case 'CANCELLED':
        badgeColor = '#FEE2E2';
        textColor = '#991B1B';
        statusText = 'Cancelled';
        break;
      case 'ONGOING':
      case 'IN_PROGRESS':
        badgeColor = '#D1FAE5';
        textColor = '#065F46';
        statusText = 'In Progress';
        break;
      case 'OPEN':
      case 'SCHEDULED':
      default:
        // Use time-based status for open/scheduled matches
        if (timeBasedStatus === 'in_progress') {
          badgeColor = '#D1FAE5';
          textColor = '#065F46';
          statusText = 'In Progress';
        } else if (timeBasedStatus === 'time_passed') {
          badgeColor = '#FEE2E2';
          textColor = '#991B1B';
          statusText = 'Time Passed';
        } else if (allSlotsFilled) {
          badgeColor = '#FEF3C7';
          textColor = '#92400E';
          statusText = 'Scheduled';
        } else {
          badgeColor = '#DBEAFE';
          textColor = '#1E40AF';
          statusText = 'Open';
        }
    }
    
    return { badgeColor, textColor, statusText };
  };

  const statusBadge = getStatusBadge();

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

  // Check if current user is a participant
  const isUserParticipant = participants.some((p: any) => p.userId === session?.user?.id);

  // Handler for submitting match result
  const handleSubmitResult = async (data: { setScores?: any[]; gameScores?: any[]; comment?: string }) => {
    try {
      console.log('📤 Submitting to backend:', JSON.stringify(data, null, 2));
      console.log('👥 Participants with teams:', participantsWithDetails.map(p => ({
        name: p.name,
        team: p.team,
        mappedTeam: p.team === 'team1' ? 'TEAM_A' : p.team === 'team2' ? 'TEAM_B' : 'TEAM_A'
      })));
      const response = await axiosInstance.post(
        endpoints.match.submitResult(matchId),
        data
      );
      
      toast.success('Match result submitted successfully!');
      bottomSheetModalRef.current?.dismiss();
      router.back();
    } catch (error: any) {
      console.error('❌ Error submitting result:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error message:', error.message);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to submit result';
      
      toast.error(errorMessage);
      throw error;
    }
  };

  // Handler for confirming/approving match result (opponent captain)
  const handleConfirmResult = async () => {
    try {
      const response = await axiosInstance.post(
        endpoints.match.confirmResult(matchId),
        { confirmed: true }
      );
      
      toast.success('Match result confirmed!');
      bottomSheetModalRef.current?.dismiss();
      router.back();
    } catch (error: any) {
      console.error('❌ Error confirming result:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to confirm result';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Handler for disputing match result (opponent captain)
  const handleDisputeResult = async () => {
    try {
      // Use the same confirm endpoint with confirmed: false
      const response = await axiosInstance.post(
        endpoints.match.confirmResult(matchId),
        { 
          confirmed: false,
          disputeReason: 'Score disagreement - opponent disputed the submitted scores'
        }
      );
      
      toast.success('Match result disputed. An admin will review.');
      bottomSheetModalRef.current?.dismiss();
      router.back();
    } catch (error: any) {
      console.error('❌ Error disputing result:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to dispute result';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Determine if user is the captain of the team that CREATED the match (can submit result)
  const isCreatorTeamCaptain = (() => {
    if (matchType === 'SINGLES') {
      // For singles, the creator can submit
      return matchData.createdById === session?.user?.id;
    }
    // For doubles, check if user's partnership captain is the match creator
    return partnershipData.captainId === matchData.createdById;
  })();

  // Determine if user is the OPPONENT captain (can review/approve result)
  const isOpponentCaptain = (() => {
    if (!isUserParticipant) return false;
    if (matchType === 'SINGLES') {
      // For singles, opponent is anyone who is a participant but not the creator
      return matchData.createdById !== session?.user?.id;
    }
    // For doubles, user is opponent captain if they are a captain but NOT the creator's team captain
    const isCaptain = partnershipData.captainId === session?.user?.id;
    const isOnCreatorTeam = partnershipData.captainId === matchData.createdById;
    return isCaptain && !isOnCreatorTeam;
  })();

  // Determine result sheet mode based on match status and user role
  const getResultSheetMode = (): 'submit' | 'view' | 'review' => {
    const status = matchData.status?.toUpperCase() || matchStatus.toUpperCase();
    
    // If match is ONGOING (result submitted), opponent captain can review
    if (status === 'ONGOING' && isOpponentCaptain) {
      return 'review';
    }
    
    // If match is COMPLETED, everyone sees view mode
    if (status === 'COMPLETED' || status === 'FINISHED') {
      return 'view';
    }
    
    // If creator team captain can still submit
    if (isCreatorTeamCaptain && status === 'SCHEDULED') {
      return 'submit';
    }
    
    // Default to view for everyone else
    return 'view';
  };

  const resultSheetMode = getResultSheetMode();

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
                      <View style={styles.playerAvatarWrapper}>
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
                        {participantsWithDetails[0]?.invitationStatus === 'PENDING' && (
                          <View style={styles.pendingBadge}>
                            <Ionicons name="time-outline" size={14} color="#F59E0B" />
                          </View>
                        )}
                        {participantsWithDetails[0]?.invitationStatus === 'ACCEPTED' && (
                          <View style={styles.acceptedBadge}>
                            <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                          </View>
                        )}
                      </View>
                      <Text style={styles.playerName} numberOfLines={1}>
                        {participantsWithDetails[0]?.name || 'Open slot'}
                      </Text>
                    </View>
                    <View style={styles.doublesPlayerContainer}>
                      <View style={styles.playerAvatarWrapper}>
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
                        {participantsWithDetails[1]?.invitationStatus === 'PENDING' && (
                          <View style={styles.pendingBadge}>
                            <Ionicons name="time-outline" size={14} color="#F59E0B" />
                          </View>
                        )}
                        {participantsWithDetails[1]?.invitationStatus === 'ACCEPTED' && (
                          <View style={styles.acceptedBadge}>
                            <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
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
                      <View style={styles.playerAvatarWrapper}>
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
                        {participantsWithDetails[2]?.invitationStatus === 'PENDING' && (
                          <View style={styles.pendingBadge}>
                            <Ionicons name="time-outline" size={14} color="#F59E0B" />
                          </View>
                        )}
                        {participantsWithDetails[2]?.invitationStatus === 'ACCEPTED' && (
                          <View style={styles.acceptedBadge}>
                            <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                          </View>
                        )}
                      </View>
                      <Text style={styles.playerName} numberOfLines={1}>
                        {participantsWithDetails[2]?.name || 'Open slot'}
                      </Text>
                    </View>
                    <View style={styles.doublesPlayerContainer}>
                      <View style={styles.playerAvatarWrapper}>
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
                        {participantsWithDetails[3]?.invitationStatus === 'PENDING' && (
                          <View style={styles.pendingBadge}>
                            <Ionicons name="time-outline" size={14} color="#F59E0B" />
                          </View>
                        )}
                        {participantsWithDetails[3]?.invitationStatus === 'ACCEPTED' && (
                          <View style={styles.acceptedBadge}>
                            <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
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
                  <View style={styles.playerAvatarWrapper}>
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
                    {participantsWithDetails[0]?.invitationStatus === 'PENDING' && (
                      <View style={styles.pendingBadge}>
                        <Ionicons name="time-outline" size={14} color="#F59E0B" />
                      </View>
                    )}
                    {participantsWithDetails[0]?.invitationStatus === 'ACCEPTED' && (
                      <View style={styles.acceptedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
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
                  <View style={styles.playerAvatarWrapper}>
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
                    {participantsWithDetails[1]?.invitationStatus === 'PENDING' && (
                      <View style={styles.pendingBadge}>
                        <Ionicons name="time-outline" size={14} color="#F59E0B" />
                      </View>
                    )}
                    {participantsWithDetails[1]?.invitationStatus === 'ACCEPTED' && (
                      <View style={styles.acceptedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
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
            <View style={styles.dateTimeHeader}>
              <Text style={styles.detailTitle}>{date} at {time}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusBadge.badgeColor }]}>
                <Text style={[styles.statusBadgeText, { color: statusBadge.textColor }]}>
                  {statusBadge.statusText}
                </Text>
              </View>
            </View>
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

        {/* Partnership Status for Doubles - Only show if match not full */}
        {matchType === 'DOUBLES' && !allSlotsFilled && (
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

        {/* Report Section  - Waiting on updates from clients */} 
        <TouchableOpacity style={styles.reportButton}>
          <Text style={styles.reportButtonText}>Report a problem</Text>  
        </TouchableOpacity>
      </ScrollView>

      {/* Footer with Action Buttons */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {isUserParticipant && allSlotsFilled ? (
          <View style={styles.buttonGroup}>            
            {/* Dynamic button based on user role and match status */}
            {(() => {
              const status = matchData.status?.toUpperCase() || matchStatus.toUpperCase();
              
              // Match COMPLETED - Show "View Scores" to everyone
              if (status === 'COMPLETED' || status === 'FINISHED') {
                return (
                  <TouchableOpacity
                    style={[styles.joinButton, { backgroundColor: "#F59E0B" }]}
                    onPress={() => bottomSheetModalRef.current?.present()}
                  >
                    <Text style={styles.joinButtonText}>View Scores</Text>
                  </TouchableOpacity>
                );
              }
              
              // Match ONGOING (result submitted) - Opponent captain sees "View Scores" to approve/deny
              if (status === 'ONGOING' && isOpponentCaptain) {
                return (
                  <TouchableOpacity
                    style={[styles.joinButton, { backgroundColor: "#F59E0B" }]}
                    onPress={() => bottomSheetModalRef.current?.present()}
                  >
                    <Ionicons name="eye" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.joinButtonText}>View Scores</Text>
                  </TouchableOpacity>
                );
              }
              
              // Match ONGOING but user is creator team - show waiting message
              if (status === 'ONGOING' && isCreatorTeamCaptain) {
                return (
                  <TouchableOpacity
                    style={[styles.joinButton, { backgroundColor: "#9CA3AF" }, styles.joinButtonDisabled]}
                    disabled
                  >
                    <Text style={styles.joinButtonText}>Awaiting Approval</Text>
                  </TouchableOpacity>
                );
              }
              
              // Match SCHEDULED - Creator team captain can submit
              if (isCreatorTeamCaptain && canStartMatch) {
                return (
                  <TouchableOpacity
                    style={[styles.joinButton, { backgroundColor: "#F59E0B" }]}
                    onPress={() => bottomSheetModalRef.current?.present()}
                  >
                    <Text style={styles.joinButtonText}>Add Result</Text>
                  </TouchableOpacity>
                );
              }
              
              // Match not started yet
              if (!canStartMatch) {
                return (
                  <TouchableOpacity
                    style={[styles.joinButton, { backgroundColor: "#FEA04D" }, styles.joinButtonDisabled]}
                    disabled
                  >
                    <Text style={styles.joinButtonText}>Scheduled</Text>
                  </TouchableOpacity>
                );
              }
              
              // Default: Non-captain participant - can only view once submitted
              return (
                <TouchableOpacity
                  style={[styles.joinButton, { backgroundColor: "#9CA3AF" }, styles.joinButtonDisabled]}
                  disabled
                >
                  <Text style={styles.joinButtonText}>Captain Submits</Text>
                </TouchableOpacity>
              );
            })()}
          </View>
        ) : (
          // Join Match Button (shown to non-participants) 
          <View style={styles.buttonGroup}>
            {/* TEST BUTTON - No time check - Remove later */}
            <TouchableOpacity
              style={[styles.joinButton, { backgroundColor: "#10B981" }]}
              onPress={handleJoinMatch}
              disabled={loading || !canJoin || allSlotsFilled}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.joinButtonText}>
                  🧪 Join (No Time Check Comment OUT After testing)
                </Text>
              )}
            </TouchableOpacity>
            
            {/* Normal Join Button */}
            <TouchableOpacity
              style={[
                styles.joinButton,
                { backgroundColor:"#FEA04D" },
                (loading || !canJoin || allSlotsFilled || isMatchTimeReached()) && styles.joinButtonDisabled
              ]}
              onPress={handleJoinMatch}
              disabled={loading || !canJoin || allSlotsFilled || isMatchTimeReached()}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.joinButtonText}>
                  {isMatchTimeReached() && !allSlotsFilled ? 'Time Passed' : allSlotsFilled ? 'Match Full' : 'Join Match'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Match Result Sheet Modal */}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        enablePanDownToClose={true}
        backgroundStyle={styles.bottomSheetBackground}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <MatchResultSheet
            matchId={matchId}
            matchType={matchType as 'SINGLES' | 'DOUBLES'}
            players={participantsWithDetails.map(p => ({
              id: p.userId,
              name: p.name || 'Unknown',
              image: p.image,
              team: (p.team === 'team1' ? 'TEAM_A' : p.team === 'team2' ? 'TEAM_B' : 'TEAM_A') as 'TEAM_A' | 'TEAM_B',
            }))}
            sportType={sportType}
            seasonId={seasonId}
            mode={resultSheetMode}
            onClose={() => bottomSheetModalRef.current?.dismiss()}
            onSubmit={handleSubmitResult}
            onConfirm={handleConfirmResult}
            onDispute={handleDisputeResult}
          />
        </BottomSheetView>
      </BottomSheetModal>
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
  playerAvatarWrapper: {
    position: 'relative',
    marginBottom: 6,
  },
  playerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  pendingBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  acceptedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
  dateTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
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
  buttonGroup: {
    gap: 12,
  },
  testButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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
  bottomSheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 0,
  },
});
