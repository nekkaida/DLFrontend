import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import React, { useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Message } from '../types';
import { useSession } from '@/lib/auth-client';
import { JoinMatchModal } from './JoinMatchModal';
import { MatchInfoModal } from './MatchInfoModal';
import { getBackendBaseURL } from '@/src/config/network';
import { toast } from 'sonner-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MatchMessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  isGroupChat?: boolean;
}

export const MatchMessageBubble: React.FC<MatchMessageBubbleProps> = ({
  message,
  isCurrentUser,
  isGroupChat = false,
}) => {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const matchData = message.matchData;
  const senderName = message.metadata?.sender?.name || 
                    message.metadata?.sender?.username || 
                    'Unknown';
  const senderId = message.senderId;

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false); // Track if user just joined
  const [partnerInfo, setPartnerInfo] = useState<{
    hasPartner: boolean;
    partnerName?: string;
    partnerImage?: string;
  }>({ hasPartner: false });
  const [isFetchingPartner, setIsFetchingPartner] = useState(false);

  if (!matchData) {
    console.log('❌ No matchData found for match message:', message.id);
    return null;
  }

  console.log('🔍 Match participants for message:', message.id, {
    participants: matchData.participants,
    participantCount: matchData.participants?.length || 0,
    currentUserId,
    senderId
  });

  // Check if current user is the one who posted the match
  const isMatchPoster = currentUserId === senderId;
  
  // Check if current user is already in the match
  const isUserInMatch = React.useMemo(() => {
    if (!currentUserId) return false;
    if (isMatchPoster) return true; // Match creator is always in the match
    if (hasJoined) return true; // User just joined
    
    // Check if user is in participants array
    if (matchData.participants && matchData.participants.length > 0) {
      return matchData.participants.some(p => p.userId === currentUserId);
    }
    
    return false;
  }, [currentUserId, isMatchPoster, hasJoined, matchData.participants]);
  
  // Display name logic
  const displayName = isMatchPoster ? 'You' : senderName;

  // Fetch partner info when join modal is about to open for doubles matches
  const handleOpenJoinModal = async () => {
    const isDoubles = matchData.numberOfPlayers === '4';
    
    if (isDoubles && currentUserId && matchData.matchId) {
      setIsFetchingPartner(true);
      try {
        const backendUrl = getBackendBaseURL();
        
        // First, get the match to find divisionId and seasonId
        const matchResponse = await fetch(`${backendUrl}/api/match/${matchData.matchId}`, {
          headers: {
            'x-user-id': currentUserId,
          },
        });
        
        if (!matchResponse.ok) {
          throw new Error('Failed to fetch match details');
        }
        
        const matchResult = await matchResponse.json();
        const match = matchResult.data || matchResult;
        const seasonId = match.division?.seasonId || match.division?.season?.id;
        
        if (!seasonId) {
          console.warn('⚠️ No seasonId found for match');
          setPartnerInfo({ hasPartner: false });
          setShowJoinModal(true);
          return;
        }
        
        console.log('🔍 Fetching partnership for seasonId:', seasonId);
        
        // Fetch active partnership for this season
        const partnershipResponse = await fetch(
          `${backendUrl}/api/pairing/partnership/active/${seasonId}`,
          {
            method: 'GET',
            headers: { 'x-user-id': currentUserId }
          }
        );
        
        if (!partnershipResponse.ok) {
          console.log('ℹ️ No active partnership found');
          setPartnerInfo({ hasPartner: false });
        } else {
          const partnershipResult = await partnershipResponse.json();
          const partnership = partnershipResult?.data;
          
          if (partnership && partnership.id) {
            // Determine who the partner is (if user is captain, partner is partnerId, else captainId)
            const isUserCaptain = partnership.captainId === currentUserId;
            const partnerId = isUserCaptain ? partnership.partnerId : partnership.captainId;
            
            // Get partner details from partnership object
            const partner = isUserCaptain ? partnership.partner : partnership.captain;
            
            console.log('✅ Partner found:', {
              userId: currentUserId,
              partnerId,
              partnerName: partner?.name,
              isCaptain: isUserCaptain,
            });
            
            setPartnerInfo({
              hasPartner: true,
              partnerName: partner?.name || 'Partner',
              partnerImage: partner?.image,
            });
          } else {
            console.log('ℹ️ Partnership exists but no valid data');
            setPartnerInfo({ hasPartner: false });
          }
        }
      } catch (error) {
        console.error('❌ Error fetching partnership:', error);
        setPartnerInfo({ hasPartner: false });
      } finally {
        setIsFetchingPartner(false);
      }
    }
    
    setShowJoinModal(true);
  };

  const handleJoinMatch = async (asPartner: boolean) => {
    if (!matchData.matchId || !currentUserId) {
      toast.error('Unable to join match', {
        description: 'Missing match or user information',
      });
      return;
    }

    try {
      setIsJoining(true);
      const backendUrl = getBackendBaseURL();
      
      const isDoubles = matchData.numberOfPlayers === '4';
      
      // Prepare request payload
      const payload: any = { asPartner };
      
      // For doubles matches with a partner, include partnerId
      if (isDoubles && partnerInfo.hasPartner) {
        // Get the match to find seasonId, then get partnership to find partnerId
        try {
          const matchResponse = await fetch(`${backendUrl}/api/match/${matchData.matchId}`, {
            headers: {
              'x-user-id': currentUserId,
            },
          });
          
          if (matchResponse.ok) {
            const matchResult = await matchResponse.json();
            const match = matchResult.data || matchResult;
            const seasonId = match.division?.seasonId || match.division?.season?.id;
            
            if (seasonId) {
              const partnershipResponse = await fetch(
                `${backendUrl}/api/pairing/partnership/active/${seasonId}`,
                {
                  method: 'GET',
                  headers: { 'x-user-id': currentUserId }
                }
              );
              
              if (partnershipResponse.ok) {
                const partnershipResult = await partnershipResponse.json();
                const partnership = partnershipResult?.data;
                
                if (partnership && partnership.id) {
                  const isUserCaptain = partnership.captainId === currentUserId;
                  const partnerId = isUserCaptain ? partnership.partnerId : partnership.captainId;
                  
                  payload.partnerId = partnerId;
                  console.log('✅ Including partnerId in join request:', partnerId);
                }
              }
            }
          }
        } catch (error) {
          console.error('⚠️ Error fetching partner info for join:', error);
          // Continue without partnerId - backend might handle it
        }
      }
      
      console.log('🎯 Joining match:', {
        matchId: matchData.matchId,
        userId: currentUserId,
        asPartner,
        matchType: matchData.numberOfPlayers === '2' ? 'SINGLES' : 'DOUBLES',
        currentParticipants: matchData.participants,
        payload
      });

      const response = await fetch(`${backendUrl}/api/match/${matchData.matchId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // If already a participant, just update local state
        if (errorData.error?.includes('already a participant')) {
          console.log('ℹ️ User is already in match, updating UI state');
          setHasJoined(true);
          toast.info('You are already in this match');
          setShowJoinModal(false);
          return;
        }
        
        throw new Error(errorData.error || 'Failed to join match');
      }

      const result = await response.json();
      console.log('✅ Successfully joined match:', result);

      // Update local state immediately to show "Joined" button
      setHasJoined(true);

      toast.success('Joined match!', {
        description: asPartner ? 'You joined as a partner' : 'You joined as an opponent',
      });

      setShowJoinModal(false);
      
      // Refetch the match data to get updated participants
      try {
        const matchResponse = await fetch(`${backendUrl}/api/match/${matchData.matchId}`, {
          headers: {
            'x-user-id': currentUserId,
          },
        });

        if (matchResponse.ok) {
          const updatedMatch = await matchResponse.json();
          console.log('✅ Refetched match data:', updatedMatch);
          
          // Update the message matchData with new participants
          if (updatedMatch.participants) {
            // This will trigger a re-render with updated participants
            message.matchData = {
              ...matchData,
              participants: updatedMatch.participants
            };
          }
        }
      } catch (refetchError) {
        console.warn('⚠️ Could not refetch match data:', refetchError);
        // Not critical - hasJoined state will still show "Joined"
      }
      
    } catch (error) {
      console.error('❌ Error joining match:', error);
      toast.error('Failed to join match', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsJoining(false);
    }
  };

  const getSportColors = () => {
    switch (matchData.sportType) {
      case 'PICKLEBALL':
        return { background: '#863A73', badge: '#A855F7', label: 'Pickleball', buttonColor: '#602E98' };
      case 'TENNIS':
        return { background: '#65B741', badge: '#22C55E', label: 'Tennis', buttonColor: '#587A27' };
      case 'PADEL':
        return { background: '#3B82F6', badge: '#60A5FA', label: 'Padel', buttonColor: '#2E6698' };
      default:
        return { background: '#863A73', badge: '#A855F7', label: 'League', buttonColor: '#602E98' };
    }
  };

  const sportColors = getSportColors();

  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Format time to remove seconds if present
  const formatTime = (timeString: string) => {
    // Handle both "8:00 PM" and "20:00:00" formats
    if (timeString.includes('M')) return timeString;
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Calculate end time based on duration
  const calculateEndTime = (startTime: string, durationHours: number) => {
    const [time, modifier] = startTime.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let startHour = modifier === 'PM' && hours !== 12 ? hours + 12 : hours;
    if (modifier === 'AM' && hours === 12) startHour = 0;
    
    const totalMinutes = startHour * 60 + minutes + (durationHours * 60);
    const endHour = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    
    const displayEndHour = endHour % 12 || 12;
    const endModifier = endHour >= 12 ? 'PM' : 'AM';
    return `${displayEndHour}:${String(endMinutes).padStart(2, '0')} ${endModifier}`;
  };

  return (
    <View style={styles.container}>
      {/* Header with sender name and timestamp - outside card */}
      <View style={styles.headerRow}>
        <View style={styles.senderRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.senderName}>{displayName} posted a league match</Text>
        </View>
        <Text style={styles.timestamp}>
          {format(new Date(message.timestamp), 'HH:mm')}
        </Text>
      </View>

      <View style={styles.matchCard}>
        {/* Match Title Row with Sport Badge */}
        <View style={styles.titleRow}>
          <Text style={styles.matchTitle}>
            {matchData.numberOfPlayers === '2' ? 'Singles' : 'Doubles'} League Match
          </Text>
          <View style={[styles.sportBadge, { borderColor: sportColors.badge }]}>
            <Text style={[styles.sportBadgeText, { color: sportColors.badge }]}>
              {sportColors.label}
            </Text>
          </View>
        </View>

        {/* Main Content Row */}
        <View style={styles.contentRow}>
          {/* Left Column - Info */}
          <View style={styles.leftColumn}>
            {/* Location */}
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>{matchData.location || 'TBD'}</Text>
            </View>

            {/* Date */}
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>{formatDisplayDate(matchData.date)}</Text>
            </View>

            {/* Time Range */}
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>
                {formatTime(matchData.time)} – {calculateEndTime(matchData.time, matchData.duration)}
              </Text>
            </View>

            {/* Cost */}
            <View style={styles.infoRow}>
              <Text style={styles.costIcon}>$</Text>
              <Text style={styles.infoText}>
                {matchData.fee === 'FREE' ? 'Free •' : 'Split •'}
              </Text>
            </View>
          </View>

          {/* Right Column - Court Badge and Buttons */}
          <View style={styles.rightColumn}>

            {/* Court Booked Badge */}
            <View style={[
              styles.courtBadge,
              matchData.courtBooked ? styles.courtBadgeBooked : styles.courtBadgeNotBooked
            ]}>
              <Text style={[
                styles.courtBadgeText,
                matchData.courtBooked ? styles.courtBadgeTextBooked : styles.courtBadgeTextNotBooked
              ]}>
                Court {matchData.courtBooked ? 'booked' : 'not booked'}
              </Text>
              <Ionicons 
                name={matchData.courtBooked ? "checkmark-circle" : "close-circle"} 
                size={14} 
                color={matchData.courtBooked ? "#16A34A" : "#DC2626"} 
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.infoButton} 
                activeOpacity={0.7}
                onPress={() => setShowInfoModal(true)}
              >
                <Text style={styles.infoButtonText}>Info</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.joinButton, 
                  { backgroundColor: isUserInMatch ? '#9CA3AF' : sportColors.buttonColor }
                ]}
                activeOpacity={isUserInMatch ? 1 : 0.8}
                disabled={isUserInMatch || isFetchingPartner}
                onPress={handleOpenJoinModal}
              >
                <Text style={styles.joinButtonText}>
                  {isFetchingPartner ? 'Loading...' : isUserInMatch ? 'Joined' : 'Join match'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Join Match Modal */}
      <JoinMatchModal
        visible={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onConfirm={handleJoinMatch}
        matchType={matchData.numberOfPlayers === '2' ? 'SINGLES' : 'DOUBLES'}
        loading={isJoining}
        matchDetails={{
          date: formatDisplayDate(matchData.date),
          time: `${formatTime(matchData.time)} – ${calculateEndTime(matchData.time, matchData.duration)}`,
          location: matchData.location || 'TBD',
          sportType: sportColors.label,
        }}
        partnerInfo={partnerInfo}
      />

      {/* Match Info Modal */}
      <MatchInfoModal
        visible={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        matchData={matchData}
        creatorName={displayName}
        formattedDate={formatDisplayDate(matchData.date)}
        formattedTime={formatTime(matchData.time)}
        formattedEndTime={calculateEndTime(matchData.time, matchData.duration)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  senderName: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '400',
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    maxWidth: SCREEN_WIDTH * 0.95,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: 16,
    gap: 8,
  },
  sportBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  sportBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#374151',
    marginLeft: 6,
  },
  costIcon: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    width: 16,
  },
  courtBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-end',
  },
  courtBadgeBooked: {
    backgroundColor: '#F0FDF4',
  },
  courtBadgeNotBooked: {
    backgroundColor: '#FEF2F2',
  },
  courtBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    marginRight: 3,
  },
  courtBadgeTextBooked: {
    color: '#16A34A',
  },
  courtBadgeTextNotBooked: {
    color: '#DC2626',
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 6,
    width: 110,
  },
  infoButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  infoButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  joinButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
