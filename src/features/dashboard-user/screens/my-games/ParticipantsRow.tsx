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

  // Render a single participant
  const renderParticipant = (participant: Match['participants'][0]) => {
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
  };

  // Render empty slots
  const renderEmptySlots = () => {
    if (emptySlots <= 0) return null;
    return (
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
    );
  };

  // For DOUBLES matches, group by team
  if (matchType === 'DOUBLES') {
    const byTeam1 = displayedParticipants.filter(p => p.team === 'team1');
    const byTeam2 = displayedParticipants.filter(p => p.team === 'team2');

    // If no team data, split positionally (first 2 = team1, rest = team2)
    const hasTeamData = byTeam1.length > 0 || byTeam2.length > 0;
    const team1 = hasTeamData ? byTeam1 : displayedParticipants.slice(0, 2);
    const team2 = hasTeamData ? byTeam2 : displayedParticipants.slice(2, 4);

    const team1Empty = Math.max(0, 2 - team1.length);
    const team2Empty = Math.max(0, 2 - team2.length);

    return (
      <View style={styles.playersRow}>
        {/* Team 1 */}
        {team1.map(p => renderParticipant(p))}
        {Array.from({ length: team1Empty }).map((_, i) => (
          <View key={`t1-empty-${i}`} style={styles.playerColumn}>
            <View style={styles.emptySlotCircle}>
              <Ionicons name="person" size={24} color="#D1D5DB" />
            </View>
            <Text style={styles.emptySlotText}>Open</Text>
          </View>
        ))}

        {/* Vertical divider — always shown for doubles */}
        <View style={styles.teamDivider} />

        {/* Team 2 */}
        {team2.map(p => renderParticipant(p))}
        {Array.from({ length: team2Empty }).map((_, i) => (
          <View key={`t2-empty-${i}`} style={styles.playerColumn}>
            <View style={styles.emptySlotCircle}>
              <Ionicons name="person" size={24} color="#D1D5DB" />
            </View>
            <Text style={styles.emptySlotText}>Open</Text>
          </View>
        ))}
      </View>
    );
  }

  // For SINGLES or DOUBLES without team data, render in order
  return (
    <View style={styles.playersRow}>
      {displayedParticipants.map(participant => renderParticipant(participant))}
      {renderEmptySlots()}
    </View>
  );
}
