import { getSportColors, type SportType } from '@/constants/SportsColor';
import { useSession } from '@/lib/auth-client';
import { getBackendBaseURL } from '@/src/config/network';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { toast } from 'sonner-native';
import { Message } from '../types';
import { MatchInfoModal } from './MatchInfoModal';

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
  const senderImage = message.metadata?.sender?.image || null;
  const senderId = message.senderId;

  // Get first name only for display
  const firstName = senderName.split(' ')[0];

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [hasJoined, setHasJoined] = useState(false); // Track if user just joined
  const [isFetchingPartner, setIsFetchingPartner] = useState(false);

  if (!matchData) {
    console.log('❌ No matchData found for match message:', message.id);
    return null;
  }

  // Helper functions for time formatting
  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Extract start time from range (e.g., "2:00 PM - 4:00 PM" -> "2:00 PM")
  const extractStartTime = (timeRange: string): string => {
    if (timeRange.includes(' - ')) {
      return timeRange.split(' - ')[0].trim();
    }
    return timeRange.trim();
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

  // Calculate end time based on start time and duration
  const calculateEndTime = (startTime: string, durationHours: number) => {
    // Extract just the start time if it's a range
    const actualStartTime = extractStartTime(startTime);
    const [time, modifier] = actualStartTime.split(' ');
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
  
  // Display name logic - always show first name
  const displayName = firstName;

  // Calculate formatted start and end times
  const startTime = extractStartTime(matchData.time);
  const formattedStartTime = formatTime(startTime);
  const formattedEndTime = calculateEndTime(startTime, matchData.duration);

  // Fetch partner info when join modal is about to open for doubles matches
  // Navigate to join match page
  const handleOpenJoinMatch = async () => {
    if (!matchData.matchId || !currentUserId) {
      toast.error('Unable to join match');
      return;
    }

    setIsFetchingPartner(true);
    
    try {
      const backendUrl = getBackendBaseURL();
      
      // Fetch match details to get divisionId and seasonId
      const matchResponse = await fetch(`${backendUrl}/api/match/${matchData.matchId}`, {
        headers: {
          'x-user-id': currentUserId,
        },
      });
      
      let divisionId = '';
      let seasonId = '';
      
      if (matchResponse.ok) {
        const matchResult = await matchResponse.json();
        const match = matchResult.data || matchResult;
        divisionId = match.divisionId || match.division?.id || '';
        seasonId = match.division?.seasonId || match.division?.season?.id || '';
      }
      
      // Navigate to join match page with all the match data
      router.push({
        pathname: '/match/match-details',
        params: {
          matchId: matchData.matchId,
          matchType: matchData.matchType || (matchData.numberOfPlayers === '4' ? 'DOUBLES' : 'SINGLES'),
          date: formatDisplayDate(matchData.date),
          time: `${formattedStartTime} – ${formattedEndTime}`,
          location: matchData.location || 'TBD',
          sportType: matchData.sportType || 'PICKLEBALL',
          leagueName: matchData.leagueName || 'League Match',
          season: 'Season 1',
          division: 'Division 1',
          courtBooked: matchData.courtBooked ? 'true' : 'false',
          fee: matchData.fee || 'FREE',
          feeAmount: (matchData as any).feeAmount || '0.00',
          description: matchData.description || '',
          duration: String(matchData.duration || 2),
          divisionId,
          seasonId,
          participants: JSON.stringify(matchData.participants || []),
        },
      });
    } catch (error) {
      console.error('Error navigating to join match:', error);
      toast.error('Failed to open match details');
    } finally {
      setIsFetchingPartner(false);
    }
  };

  const sportColors = getSportColors(matchData.sportType as SportType);

  return (
    <View style={styles.container}>
      {/* Header with sender name and timestamp - outside card */}
      <View style={styles.headerRow}>
        <View style={styles.senderRow}>
          {senderImage ? (
            <Image source={{ uri: senderImage }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.senderName}>
            <Text style={styles.senderNameBold}>{displayName}</Text>
            {' posted a league match'}
          </Text>
        </View>
        <Text style={styles.timestamp}>
          {format(new Date(message.timestamp), 'HH:mm')}
        </Text>
      </View>

      <View style={styles.matchCard}>
        {/* Match Title Row with Sport Badge */}
        <View style={styles.titleRow}>
          <Text style={styles.matchTitle}>
            {matchData.matchType === 'SINGLES' ? 'Singles' : matchData.matchType === 'DOUBLES' ? 'Doubles' : matchData.numberOfPlayers === '2' ? 'Singles' : 'Doubles'} League Match
          </Text>
          <View style={[styles.sportBadge, { borderColor: sportColors.badgeColor }]}>
            <Text style={[styles.sportBadgeText, { color: sportColors.badgeColor }]}>
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
              <Ionicons name="location-outline" size={16} color="#86868B" />
              <Text style={styles.infoText}>{matchData.location || 'TBD'}</Text>
            </View>

            {/* Date */}
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color="#86868B" />
              <Text style={styles.infoText}>{formatDisplayDate(matchData.date)}</Text>
            </View>

            {/* Time Range */}
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color="#86868B" />
              <Text style={styles.infoText}>
                {formattedStartTime} – {formattedEndTime}
              </Text>
            </View>

            {/* Cost */}
            <View style={styles.infoRow}>
              <Text style={styles.costIcon}>$</Text>
              <Text style={styles.infoText}>
                {(() => {
                  const fee = matchData.fee as 'FREE' | 'SPLIT' | 'FIXED' | undefined;
                  const feeAmount = (matchData as any).feeAmount as string | undefined;
                  
                  if (fee === 'FREE' || !fee) {
                    return 'Free';
                  } else if (fee === 'SPLIT' && feeAmount) {
                    const totalAmount = parseFloat(feeAmount);
                    const numPlayers = parseInt(matchData.numberOfPlayers || '2', 10);
                    const perPlayer = numPlayers > 0 ? (totalAmount / numPlayers).toFixed(2) : '0.00';
                    return `Split · Est. RM${perPlayer} per player`;
                  } else if (fee === 'FIXED' && feeAmount) {
                    return `Fixed · RM${parseFloat(feeAmount).toFixed(2)} per player`;
                  }
                  return 'Free';
                })()}
              </Text>
            </View>
          </View>

          {/* Right Column - Court Badge and Action Buttons */}
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
            <View style={styles.actionButtonsRow}>
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
                onPress={handleOpenJoinMatch}
              >
                <Text style={styles.joinButtonText}>
                  {isFetchingPartner ? 'Loading...' : isUserInMatch ? 'Joined' : 'Join match'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Match Info Modal */}
      <MatchInfoModal
        visible={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        matchData={matchData}
        creatorName={senderName}
        creatorImage={senderImage}
        formattedDate={formatDisplayDate(matchData.date)}
        formattedTime={formattedStartTime}
        formattedEndTime={formattedEndTime}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    paddingHorizontal: 4,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarImage: {
    width: 24,
    height: 24,
    borderRadius: 14,
    marginRight: 8,
  },
  avatarText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  senderName: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '400',
    flex: 1,
  },
  senderNameBold: {
    fontWeight: '600',
    color: '#374151',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
    width: '100%',
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
    justifyContent: 'flex-start',
    marginLeft: 16,
    gap: 12,
  },
  sportBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  sportBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#86868B',
    marginLeft: 8,
  },
  costIcon: {
    fontSize: 13,
    fontWeight: '500',
    color: '#86868B',
    width: 16,
  },
  courtBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  courtBadgeBooked: {
    backgroundColor: '#F0FDF4',
  },
  courtBadgeNotBooked: {
    backgroundColor: '#FEF2F2',
  },
  courtBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 4,
  },
  courtBadgeTextBooked: {
    color: '#16A34A',
  },
  courtBadgeTextNotBooked: {
    color: '#DC2626',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 22,
  },
  infoButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    minWidth: 70,
  },
  infoButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#602E98',
  },
  joinButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 70,
  },
  joinButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
