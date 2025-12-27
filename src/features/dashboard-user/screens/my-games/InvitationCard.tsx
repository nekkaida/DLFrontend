import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { getSportColors, SportType } from '@/constants/SportsColor';
import { MatchInvitation } from './types';
import { invitationCardStyles as styles } from './styles';
import { formatMatchDate, formatMatchTime } from './utils';

interface InvitationCardProps {
  invitation: MatchInvitation;
  defaultSport: string;
  onAccept: (invitationId: string) => void;
  onDecline: (invitationId: string) => void;
}

export function InvitationCard({ invitation, defaultSport, onAccept, onDecline }: InvitationCardProps) {
  const sportColors = getSportColors((invitation.match.sport || defaultSport) as SportType);
  const expiresAt = new Date(invitation.expiresAt);
  const isExpiringSoon = expiresAt.getTime() - Date.now() < 24 * 60 * 60 * 1000;

  return (
    <View style={styles.invitationCard}>
      {/* Header with inviter and sport badge */}
      <View style={styles.invitationHeader}>
        <View style={styles.inviterRow}>
          {invitation.inviter.image ? (
            <Image source={{ uri: invitation.inviter.image }} style={styles.inviterAvatarSmall} />
          ) : (
            <View style={[styles.inviterAvatarSmall, styles.defaultInviterAvatar]}>
              <Text style={styles.inviterInitial}>
                {invitation.inviter.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <View style={styles.inviterTextContainer}>
            <Text style={styles.inviterNameSmall}>{invitation.inviter.name}</Text>
            <Text style={styles.invitationSubtext}>invited you to play</Text>
          </View>
        </View>
        <View style={[styles.sportBadgeSmall, { backgroundColor: sportColors.background }]}>
          <Text style={styles.sportBadgeTextSmall}>{sportColors.label}</Text>
        </View>
      </View>

      {/* Match info */}
      <View style={styles.invitationBody}>
        <Text style={styles.matchTypeSmall}>
          {invitation.match.matchType === 'DOUBLES' ? 'Doubles' : 'Singles'} Match
        </Text>

        {/* Division/League info */}
        {invitation.match.division && (
          <Text style={styles.divisionInfo} numberOfLines={1}>
            {invitation.match.division.name}
          </Text>
        )}

        {/* Time and location */}
        <View style={styles.invitationDetails}>
          {invitation.match.timeSlots && invitation.match.timeSlots.length > 0 && (
            <View style={styles.infoRowSmall}>
              <Ionicons name="calendar-outline" size={14} color="#6B7280" />
              <Text style={styles.infoTextSmall}>
                {formatMatchDate(invitation.match.timeSlots[0].proposedTime)} • {formatMatchTime(invitation.match.timeSlots[0].proposedTime)}
              </Text>
            </View>
          )}
          {(invitation.match.location || invitation.match.venue) && (
            <View style={styles.infoRowSmall}>
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text style={styles.infoTextSmall} numberOfLines={1}>
                {invitation.match.venue || invitation.match.location}
              </Text>
            </View>
          )}
        </View>

        {/* Expiry warning */}
        {isExpiringSoon && (
          <View style={styles.expiryWarning}>
            <Ionicons name="time-outline" size={12} color="#D97706" />
            <Text style={styles.expiryWarningText}>
              Expires {format(expiresAt, 'MMM dd, h:mm a')}
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.invitationActionsCompact}>
        <TouchableOpacity
          style={styles.declineButtonCompact}
          onPress={() => onDecline(invitation.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.declineButtonTextCompact}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.acceptButtonCompact}
          onPress={() => onAccept(invitation.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.acceptButtonTextCompact}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
