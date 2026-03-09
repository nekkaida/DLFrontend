import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { PlayerAvatar } from './PlayerAvatar';

interface TeamAvatarsProps {
  players: Array<{ name: string; image?: string | null }>;
  size?: number;
  overlap?: number;
  style?: ViewStyle;
  borderColor?: string;
}

export const TeamAvatars: React.FC<TeamAvatarsProps> = ({
  players,
  size = 32,
  overlap = 8,
  style,
  borderColor = 'rgba(22, 26, 35, 1)', // Dark background color for seamless overlap
}) => {
  if (players.length === 0) return null;

  // Single player - just show one avatar
  if (players.length === 1) {
    return (
      <View style={[styles.container, style]}>
        <PlayerAvatar
          image={players[0].image}
          name={players[0].name}
          size={size}
          showBorder
          borderColor={borderColor}
        />
      </View>
    );
  }

  // Multiple players - overlapping avatars
  return (
    <View style={[styles.container, style]}>
      <View style={styles.avatarsRow}>
        {players.map((player, index) => (
          <View
            key={`player-${index}`}
            style={[
              styles.avatarWrapper,
              index > 0 ? { marginLeft: -overlap, zIndex: players.length - index } : { zIndex: players.length },
            ]}
          >
            <PlayerAvatar
              image={player.image}
              name={player.name}
              size={size}
              showBorder
              borderColor={borderColor}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
});

export default TeamAvatars;
