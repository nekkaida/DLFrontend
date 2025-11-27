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

  if (!matchData) return null;

  // Get sport-specific colors
  const getSportColors = () => {
    switch (matchData.sportType) {
      case 'PICKLEBALL':
        return { background: '#863A73', badge: '#A855F7', label: 'Pickleball' };
      case 'TENNIS':
        return { background: '#65B741', badge: '#22C55E', label: 'Tennis' };
      case 'PADEL':
        return { background: '#3B82F6', badge: '#60A5FA', label: 'Padel' };
      default:
        return { background: '#863A73', badge: '#A855F7', label: 'League' };
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

  return (
    <View style={[
      styles.container,
      isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer
    ]}>
      {!isCurrentUser && isGroupChat && (
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {senderName.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
      )}
      
      <View style={styles.matchCard}>
        {/* Sender name for GROUP chats only */}
        {!isCurrentUser && isGroupChat && (
          <Text style={styles.senderName}>{senderName}</Text>
        )}

        {/* Sport Badge */}
        <View style={[styles.sportBadge, { borderColor: sportColors.badge }]}>
          <Text style={[styles.sportBadgeText, { color: sportColors.badge }]}>
            {sportColors.label}
          </Text>
        </View>

        {/* Match Title */}
        <Text style={styles.matchTitle}>Singles League Match</Text>

        {/* Location */}
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#6B7280" />
          <Text style={styles.infoText}>{matchData.location}</Text>
        </View>

        {/* Date */}
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text style={styles.infoText}>{formatDisplayDate(matchData.date)}</Text>
        </View>

        {/* Time */}
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text style={styles.infoText}>{matchData.time}</Text>
        </View>

        {/* Cost */}
        <View style={styles.infoRow}>
          <Text style={styles.costLabel}>$</Text>
          <Text style={styles.infoText}>
            {matchData.fee === 'FREE' ? 'Free' : `Split • RM${matchData.fee === 'SPLIT' ? '40.00' : '0'} per player`}
          </Text>
        </View>

        {/* Court Booked Badge */}
        {matchData.courtBooked && (
          <View style={styles.courtBadge}>
            <Text style={styles.courtBadgeText}>Court booked</Text>
            <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.infoButton}>
            <Text style={styles.infoButtonText}>Info</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.joinButton, { backgroundColor: sportColors.background }]}
          >
            <Text style={styles.joinButtonText}>Join match</Text>
          </TouchableOpacity>
        </View>

        {/* Timestamp */}
        <Text style={styles.timestamp}>
          {format(new Date(message.timestamp), 'HH:mm')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  currentUserContainer: {
    justifyContent: 'flex-end',
  },
  otherUserContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    flex: 1,
  },
  senderName: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  sportBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
    marginBottom: 8,
  },
  sportBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    fontWeight: '500',
  },
  costLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    width: 16,
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
    color: '#22C55E',
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
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  infoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  joinButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'right',
  },
});
