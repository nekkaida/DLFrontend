import React from 'react';
import { View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Match } from './types';
import { matchCardStyles as styles } from './styles';

interface ParticipantsRowProps {
  participants: Match['participants'];
  matchType: string;
}

export function ParticipantsRow({ participants, matchType }: ParticipantsRowProps) {
  const acceptedParticipants = participants.filter(p => p.invitationStatus === 'ACCEPTED');
  const pendingParticipants = participants.filter(p => p.invitationStatus === 'PENDING');
  const displayedParticipants = [...acceptedParticipants, ...pendingParticipants];

  const maxSlots = matchType === 'DOUBLES' ? 4 : 2;
  const emptySlots = maxSlots - displayedParticipants.length;
  const emptyPairs = matchType === 'DOUBLES' ? Math.ceil(emptySlots / 2) : emptySlots;

  return (
    <View style={styles.playersRow}>
      {/* Show accepted and pending participants */}
      {displayedParticipants.map((participant) => {
        const isPending = participant.invitationStatus === 'PENDING';
        return (
          <View key={participant.userId} style={styles.playerColumn}>
            <View style={styles.playerAvatarWrapper}>
              <View style={[
                styles.playerAvatarLarge,
                isPending && styles.playerAvatarPending
              ]}>
                {participant.user.image ? (
                  <Image
                    source={{ uri: participant.user.image }}
                    style={styles.playerImageLarge}
                  />
                ) : (
                  <View style={styles.defaultPlayerAvatarLarge}>
                    <Text style={styles.defaultPlayerTextLarge}>
                      {participant.user.name?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
              </View>
              {isPending && (
                <View style={styles.pendingBadge}>
                  <Ionicons name="time-outline" size={12} color="#F59E0B" />
                </View>
              )}
            </View>
            <Text style={[
              styles.playerNameText,
              isPending && styles.playerNamePending
            ]} numberOfLines={1}>
              {participant.user.name?.split(' ')[0] || 'Player'}
            </Text>
          </View>
        );
      })}

      {/* Show empty slots only for truly unfilled positions */}
      {emptySlots > 0 && (
        <View style={styles.emptySlotColumn}>
          <View style={styles.emptySlotRow}>
            {Array.from({ length: Math.min(emptySlots, 2) }).map((_, idx) => (
              <View key={`empty-${idx}`} style={styles.emptySlotCircle}>
                <Ionicons name="person" size={24} color="#D1D5DB" />
              </View>
            ))}
          </View>
          <Text style={styles.emptySlotText}>
            {emptyPairs} {matchType === 'DOUBLES' ? 'pair' : 'player'} slot{emptyPairs > 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </View>
  );
}
