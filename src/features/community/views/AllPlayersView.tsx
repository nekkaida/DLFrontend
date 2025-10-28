import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PlayerListItem, EmptyState } from '../components';
import { Player } from '../types';

interface AllPlayersViewProps {
  players: Player[];
  isLoading: boolean;
  searchQuery: string;
  onPlayerPress: (player: Player) => void;
}

export const AllPlayersView: React.FC<AllPlayersViewProps> = ({
  players,
  isLoading,
  searchQuery,
  onPlayerPress,
}) => {
  if (isLoading) {
    return (
      <EmptyState
        icon="search-outline"
        title="Loading players..."
        subtitle="Please wait"
      />
    );
  }

  if (players.length === 0 && searchQuery.trim().length >= 2) {
    return (
      <EmptyState
        icon="search-outline"
        title="No players found"
        subtitle="Try adjusting your search query"
      />
    );
  }

  return (
    <View style={styles.container}>
      {players.map((player, index) => (
        <React.Fragment key={player.id}>
          <PlayerListItem player={player} onPress={onPlayerPress} />
          {index < players.length - 1 && <View style={styles.divider} />}
        </React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E2E2',
    marginLeft: 60,
  },
});
