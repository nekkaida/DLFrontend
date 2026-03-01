import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SeasonInvitation } from './types';

interface SeasonInvitationCardProps {
  invitation: SeasonInvitation;
  /** Current user's ID — used to decide sender vs recipient view */
  currentUserId: string;
  actionLoading: string | null;
  onAccept: (id: string) => void;
  onDeny: (id: string) => void;
}

export function SeasonInvitationCard({
  invitation,
  currentUserId,
  actionLoading,
  onAccept,
  onDeny,
}: SeasonInvitationCardProps) {
  const isReceived = invitation.recipientId === currentUserId;
  const partner = isReceived ? invitation.sender : invitation.recipient;
  const expiresAt = new Date(invitation.expiresAt);
  const isExpiringSoon = expiresAt.getTime() - Date.now() < 24 * 60 * 60 * 1000;
  const isLoading = actionLoading === invitation.id;

  const renderAvatar = () => {
    if (partner.image) {
      return (
        <Image
          source={{ uri: partner.image }}
          style={styles.avatar}
        />
      );
    }
    return (
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarInitial}>
          {partner.name?.charAt(0)?.toUpperCase() ?? '?'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      {/* Top badge */}
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Ionicons name="people" size={11} color="#A04DFE" />
          <Text style={styles.badgeText}>Partnership Invite</Text>
        </View>
        {isExpiringSoon && (
          <View style={styles.urgentBadge}>
            <Ionicons name="time-outline" size={11} color="#EF4444" />
            <Text style={styles.urgentText}>Expires soon</Text>
          </View>
        )}
      </View>

      {/* Partner info */}
      <View style={styles.partnerRow}>
        {renderAvatar()}
        <View style={styles.partnerInfo}>
          <Text style={styles.partnerLabel}>
            {isReceived ? 'Invite from' : 'Invite sent to'}
          </Text>
          <Text style={styles.partnerName}>{partner.name}</Text>
          {partner.username ? (
            <Text style={styles.partnerUsername}>@{partner.username}</Text>
          ) : null}
        </View>
        <View style={styles.timeContainer}>
          <Text style={styles.timeAgo}>
            {formatDistanceToNow(new Date(invitation.createdAt), { addSuffix: true })}
          </Text>
        </View>
      </View>

      {/* Season info */}
      <View style={styles.seasonRow}>
        <Ionicons name="trophy-outline" size={14} color="#6B7280" />
        <View style={styles.seasonTexts}>
          <Text style={styles.seasonName}>{invitation.season.name}</Text>
          {invitation.season.league?.name ? (
            <Text style={styles.leagueName}>{invitation.season.league.name}</Text>
          ) : null}
        </View>
        {invitation.season.league?.sportType ? (
          <View style={styles.sportChip}>
            <Text style={styles.sportChipText}>
              {invitation.season.league.sportType}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Optional message */}
      {invitation.message ? (
        <View style={styles.messageRow}>
          <Ionicons name="chatbubble-outline" size={13} color="#9CA3AF" />
          <Text style={styles.messageText}>"{invitation.message}"</Text>
        </View>
      ) : null}

      {/* Expires line */}
      <Text style={[styles.expiresText, isExpiringSoon && styles.expiresTextUrgent]}>
        Expires {formatDistanceToNow(expiresAt, { addSuffix: true })}
      </Text>

      {/* Action buttons — only show for received invitations */}
      {isReceived && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.declineButton}
            onPress={() => onDeny(invitation.id)}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#6B7280" />
            ) : (
              <Text style={styles.declineText}>Decline</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => onAccept(invitation.id)}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                <Text style={styles.acceptText}>Accept</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Sent state */}
      {!isReceived && (
        <View style={styles.sentInfo}>
          <Ionicons name="time-outline" size={14} color="#9CA3AF" />
          <Text style={styles.sentInfoText}>Awaiting response</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: '#A04DFE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F0FF',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A04DFE',
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  urgentText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#EDE9FE',
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#A04DFE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EDE9FE',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  partnerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  partnerLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 1,
  },
  partnerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  partnerUsername: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  timeAgo: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  seasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    marginBottom: 10,
  },
  seasonTexts: {
    flex: 1,
  },
  seasonName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  leagueName: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  sportChip: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  sportChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'capitalize',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 8,
  },
  messageText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  expiresText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 14,
  },
  expiresTextUrgent: {
    color: '#EF4444',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  declineButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  declineText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  acceptButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#A04DFE',
    gap: 6,
  },
  acceptText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  sentInfoText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default SeasonInvitationCard;
