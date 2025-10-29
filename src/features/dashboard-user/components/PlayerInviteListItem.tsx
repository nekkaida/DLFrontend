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

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
      {player.image ? (
        <Image source={{ uri: player.image }} style={styles.avatar} />
      ) : (
        <View style={styles.defaultAvatar}>
          <Text style={styles.defaultAvatarText}>
            {player.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{player.name}</Text>
        {player.displayUsername && (
          <Text style={styles.playerUsername}>@{player.displayUsername}</Text>
        )}
        <View style={styles.ratingRow}>
          <Text style={styles.ratingLabel}>Doubles DMR:</Text>
          <Text style={styles.ratingValue}>{getDoublesDMR()}</Text>
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color="#BABABA" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  defaultAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6de9a0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 2,
  },
  playerUsername: {
    fontSize: 14,
    color: '#86868B',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingLabel: {
    fontSize: 13,
    color: '#86868B',
  },
  ratingValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1C1E',
  },
});
