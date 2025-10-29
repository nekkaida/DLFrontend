import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BottomSheetBackdrop,
  BottomSheetHandle,
  BottomSheetModal,
  BottomSheetView,
  BottomSheetFlatList,
} from '@gorhom/bottom-sheet';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authClient } from '@/lib/auth-client';
import { getBackendBaseURL } from '@/src/config/network';
import { PlayerInviteListItem } from './PlayerInviteListItem';
import { toast } from 'sonner-native';

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

interface InvitePartnerBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  seasonId: string;
  onPlayerSelect: (player: Player) => void;
}

export const InvitePartnerBottomSheet: React.FC<InvitePartnerBottomSheetProps> = ({
  visible,
  onClose,
  seasonId,
  onPlayerSelect,
}) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const snapPoints = useMemo(() => ['80%'], []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
      setSearchQuery('');
    }
  }, [onClose]);

  const fetchPlayers = useCallback(async () => {
    try {
      if (!seasonId) return;
      
      setIsLoading(true);
      const backendUrl = getBackendBaseURL();
      const response = await authClient.$fetch(`${backendUrl}/api/player/discover/${seasonId}`, {
        method: 'GET',
      });

      if (response && (response as any).data) {
        const playersData = (response as any).data.data || (response as any).data;
        setPlayers(playersData);
        setFilteredPlayers(playersData);
      }
    } catch (error) {
      console.error('Error fetching players:', error);
      toast.error('Error', {
        description: 'Failed to load available players',
      });
    } finally {
      setIsLoading(false);
    }
  }, [seasonId]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (text.trim().length === 0) {
        setFilteredPlayers(players);
      } else {
        const filtered = players.filter(player => {
          const nameMatch = player.name.toLowerCase().includes(text.toLowerCase());
          const usernameMatch = player.username?.toLowerCase().includes(text.toLowerCase());
          const displayUsernameMatch = player.displayUsername?.toLowerCase().includes(text.toLowerCase());
          return nameMatch || usernameMatch || displayUsernameMatch;
        });
        setFilteredPlayers(filtered);
      }
    }, 300);
  }, [players]);

  const handlePlayerSelect = useCallback((player: Player) => {
    onPlayerSelect(player);
    onClose();
  }, [onPlayerSelect, onClose]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        onPress={onClose}
      />
    ),
    [onClose]
  );

  useEffect(() => {
    if (visible && seasonId) {
      bottomSheetModalRef.current?.present();
      fetchPlayers();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [visible, seasonId, fetchPlayers]);

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      handleComponent={(props) => (
        <View style={styles.handleContainer}>
          <BottomSheetHandle {...props} />
        </View>
      )}
      backgroundStyle={styles.bottomSheetBackground}
      style={styles.bottomSheetContainer}
    >
      <BottomSheetView style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Invite Your Doubles Partner</Text>
          <Text style={styles.description}>
            Send an invitation to one of your friends to pair up and join the league together.
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#86868B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or username"
            placeholderTextColor="#86868B"
            value={searchQuery}
            onChangeText={handleSearchChange}
          />
        </View>

        <View style={styles.listContainer}>
          {isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color="#A04DFE" />
              <Text style={styles.emptyStateText}>Loading players...</Text>
            </View>
          ) : filteredPlayers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#BABABA" />
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'No players found' : 'No available players'}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery ? 'Try a different search term' : 'All players are already paired or unavailable'}
              </Text>
            </View>
          ) : (
            <BottomSheetFlatList
              data={filteredPlayers}
              renderItem={({ item }) => (
                <PlayerInviteListItem
                  player={item}
                  onPress={handlePlayerSelect}
                />
              )}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  handleContainer: {
    paddingTop: 8,
  },
  bottomSheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomSheetContainer: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#86868B',
    textAlign: 'center',
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1C1E',
    padding: 0,
  },
  listContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#86868B',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#BABABA',
    marginTop: 6,
    textAlign: 'center',
  },
});
