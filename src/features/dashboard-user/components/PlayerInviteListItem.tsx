import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface Player {
  id: string;
  name: string;
  username?: string;
  displayUsername?: string;
  image: string | null;
  skillRatings?: any;
  bio?: string | null;
  area?: string | null;
  gender?: 'MALE' | 'FEMALE' | null;
  questionnaireStatus?: {
    hasSelectedSport: boolean;
    hasCompletedQuestionnaire: boolean;
    startedAt: string | null;
    completedAt: string | null;
  };
}

interface PlayerInviteListItemProps {
  player: Player;
  onPress: (player: Player) => void;
}

export const PlayerInviteListItem: React.FC<PlayerInviteListItemProps> = ({ player, onPress }) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(player);
  };

  // Get doubles DMR rating
  const getDoublesDMR = () => {
    if (!player.skillRatings) return 'N/A';
    const sportKeys = Object.keys(player.skillRatings);
    if (sportKeys.length === 0) return 'N/A';

    // Get the first available sport rating
    const firstSport = player.skillRatings[sportKeys[0]];
    const doublesRating = firstSport?.doubles;

    if (doublesRating) {
      return Math.round(doublesRating * 1000).toString();
    }

    return 'N/A';
  };

  // Get gender icon
  const getGenderIcon = () => {
    if (player.gender === 'MALE') {
      return '♂';
    } else if (player.gender === 'FEMALE') {
      return '♀';
    }
    return '';
  };

  // Get questionnaire status message
  const getQuestionnaireStatusMessage = () => {
    if (!player.questionnaireStatus) return null;
    
    const { hasSelectedSport, hasCompletedQuestionnaire } = player.questionnaireStatus;
    
    if (!hasSelectedSport) {
      return 'This player needs to complete a questionnaire to join';
    }
    
    if (hasSelectedSport && !hasCompletedQuestionnaire) {
      return 'This player has not completed their questionnaire.';
    }
    
    return null;
  };

  const statusMessage = getQuestionnaireStatusMessage();
  const isEligible = !statusMessage; // Player is eligible if there's no status message

  return (
    <View style={styles.container}>
      {/* Avatar - Left most */}
      {player.image ? (
        <Image source={{ uri: player.image }} style={styles.avatar} />
      ) : (
        <View style={styles.defaultAvatar}>
          <Text style={styles.defaultAvatarText}>
            {player.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      {/* Content Column - Name, Gender, DMR, Location */}
      <View style={styles.contentColumn}>
        {/* Name and Gender Row */}
        <View style={styles.nameRow}>
          <Text style={styles.playerName} numberOfLines={1}>
            {player.name}
          </Text>
          {player.gender && (
            <Text style={styles.genderIcon}>{getGenderIcon()}</Text>
          )}
        </View>

        {/* DMR */}
        <Text style={styles.dmrText}>DMR: {getDoublesDMR()}</Text>

        {/* Location */}
        {player.area && (
          <View style={styles.locationRow}>
            <Ionicons name="location" size={12} color="#FEA04D" />
            <Text style={styles.locationText}>{player.area}</Text>
          </View>
        )}

        {/* Questionnaire Status Message */}
        {statusMessage && (
          <View style={styles.statusMessageContainer}>
            <Ionicons name="information-circle" size={14} color="#FFA500" />
            <Text style={styles.statusMessageText}>{statusMessage}</Text>
          </View>
        )}
      </View>

      {/* Invite Button - Right most */}
      <TouchableOpacity 
        style={[
          styles.inviteButton, 
          !isEligible && styles.inviteButtonDisabled
        ]} 
        onPress={handlePress} 
        activeOpacity={isEligible ? 0.7 : 1}
        disabled={!isEligible}
      >
        <Text style={[
          styles.inviteButtonText,
          !isEligible && styles.inviteButtonTextDisabled
        ]}>
          Invite
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 80,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  defaultAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6de9a0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  defaultAvatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  contentColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1C1E',
    flex: 1,
  },
  genderIcon: {
    fontSize: 14,
    color: '#86868B',
  },
  dmrText: {
    fontSize: 12,
    color: '#86868B',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 11,
    color: '#FEA04D',
    fontWeight: '500',
  },
  inviteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FEA04D',
    borderRadius: 8,
    marginLeft: 12,
  },
  inviteButtonDisabled: {
    backgroundColor: '#E5E5E5',
  },
  inviteButtonText: {
    color: '#1D1D1F',
    fontSize: 13,
    fontWeight: '600',
  },
  inviteButtonTextDisabled: {
    color: '#9CA3AF',
  },
  statusMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  statusMessageText: {
    fontSize: 11,
    color: '#FFA500',
    fontWeight: '500',
    flex: 1,
  },
});
