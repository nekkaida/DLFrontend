import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Message } from '../types';

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
  const matchData = message.matchData;
  const senderName = message.metadata?.sender?.name || 
                    message.metadata?.sender?.username || 
                    'Unknown';

  if (!matchData) {
    console.log('❌ No matchData found for match message:', message.id);
    return null;
  }

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
              {senderName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.senderName}>{senderName} posted a league match</Text>
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
              <TouchableOpacity style={styles.infoButton} activeOpacity={0.7}>
                <Text style={styles.infoButtonText}>Info</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.joinButton, { backgroundColor: sportColors.buttonColor }]}
                activeOpacity={0.8}
              >
                <Text style={styles.joinButtonText}>Join match</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
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
