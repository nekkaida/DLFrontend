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

  console.log('📊 Match data:', matchData);

  // Get sport-specific colors
  const getSportColors = () => {
    switch (matchData.sportType) {
      case 'PICKLEBALL':
        return { background: '#863A73', badge: '#A855F7', label: 'Pickleball', buttonColor: '#65B741' };
      case 'TENNIS':
        return { background: '#65B741', badge: '#22C55E', label: 'Tennis', buttonColor: '#65B741' };
      case 'PADEL':
        return { background: '#3B82F6', badge: '#60A5FA', label: 'Padel', buttonColor: '#65B741' };
      default:
        return { background: '#863A73', badge: '#A855F7', label: 'League', buttonColor: '#65B741' };
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
      <View style={styles.matchCard}>
        {/* Header with sender name and timestamp */}
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

        {/* Match Title with Sport Badge */}
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

        {/* Location */}
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={20} color="#6B7280" />
          <Text style={styles.infoText}>{matchData.location || 'TBD'}</Text>
        </View>

        {/* Date */}
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={20} color="#6B7280" />
          <Text style={styles.infoText}>{formatDisplayDate(matchData.date)}</Text>
        </View>

        {/* Time Range */}
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={20} color="#6B7280" />
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

        {/* Court Booked Badge */}
        {matchData.courtBooked !== false && (
          <View style={styles.courtBadge}>
            <Text style={styles.courtBadgeText}>Court booked</Text>
            <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

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
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    maxWidth: SCREEN_WIDTH * 0.95,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  senderName: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '400',
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  matchTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  sportBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
    marginLeft: 8,
  },
  sportBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    color: '#374151',
    marginLeft: 8,
  },
  costIcon: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
    width: 20,
  },
  courtBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 4,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  courtBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
    marginRight: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  infoButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  infoButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  joinButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
