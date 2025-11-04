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
  gender?: 'MALE' | 'FEMALE' | null;
  questionnaireStatus?: {
    hasSelectedSport: boolean;
    hasCompletedQuestionnaire: boolean;
    startedAt: string | null;
    completedAt: string | null;
  };
}

interface InvitePartnerBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  seasonId: string;
  season?: any;  // Season object (optional for backward compatibility)
  seasonSport?: string;  // Pre-calculated season sport
  onPlayerSelect: (player: Player) => void;
}

export const InvitePartnerBottomSheet: React.FC<InvitePartnerBottomSheetProps> = ({
  visible,
  onClose,
  seasonId,
  season,
  seasonSport = 'pickleball',  // Default fallback
  onPlayerSelect,
}) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [players, setPlayers] = useState<Player[]>([]);
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

  const fetchPlayers = useCallback(async (query: string = '') => {
    try {
      console.log('🔄 fetchPlayers called with seasonId:', seasonId, '| search query:', query);
      if (!seasonId) {
        console.log('❌ No seasonId provided, aborting fetch');
        return;
      }

      setIsLoading(true);
      const backendUrl = getBackendBaseURL();
      const url = query.trim()
        ? `${backendUrl}/api/player/discover/${seasonId}?q=${encodeURIComponent(query)}`
        : `${backendUrl}/api/player/discover/${seasonId}`;
      console.log('📡 Fetching players from:', url);
      const response = await authClient.$fetch(url, {
        method: 'GET',
      });
      console.log('✅ API Response received:', response);

      if (response && (response as any).data) {
        const responseData = (response as any).data;
        console.log('📦 Response data structure:', responseData);

        // Backend returns { data: { players: [...], friendsCount, totalCount, usedFallback } }
        // Extract the players array from the nested data object
        let playersArray: Player[] = [];

        if (Array.isArray(responseData.players)) {
          // Direct players array
          playersArray = responseData.players;
        } else if (responseData.data && Array.isArray(responseData.data.players)) {
          // Nested in data.players
          playersArray = responseData.data.players;
        } else if (Array.isArray(responseData.data)) {
          // data is the array itself
          playersArray = responseData.data;
        } else if (Array.isArray(responseData)) {
          // responseData is the array
          playersArray = responseData;
        }

        console.log('👥 Players array extracted:', playersArray);
        setPlayers(playersArray);
        console.log('✅ Players state updated with', playersArray.length, 'players');

        // Show info toast if fallback was used
        if (responseData.usedFallback) {
          toast.info('No Friends Available', {
            description: 'Showing all eligible players since you have no friends to pair with',
          });
        }
      } else {
        console.log('⚠️ Unexpected response format:', response);
      }
    } catch (error) {
      console.error('❌ Error fetching players:', error);
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
      // If search is empty, fetch friends only
      // If search has text, fetch all eligible non-friends
      console.log('🔍 Search query changed to:', text);
      fetchPlayers(text);
    }, 500);
  }, [fetchPlayers]);

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
        pressBehavior="close"
      />
    ),
    []
  );

  useEffect(() => {
    console.log('🎬 Bottom sheet effect triggered - visible:', visible, 'seasonId:', seasonId);
    if (visible && seasonId) {
      console.log('✅ Opening bottom sheet and fetching players');
      bottomSheetModalRef.current?.present();
      fetchPlayers();
    } else {
      console.log('❌ Closing bottom sheet');
      bottomSheetModalRef.current?.dismiss();
    }
  }, [visible, seasonId, fetchPlayers]);

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      snapPoints={snapPoints}
      index={0}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      handleComponent={(props) => (
        <View style={styles.handleContainer}>
          <BottomSheetHandle {...props} />
        </View>
      )}
      backgroundStyle={styles.bottomSheetBackground}
      style={styles.bottomSheetContainer}
      enablePanDownToClose={true}
      enableDismissOnClose={true}
      android_keyboardInputMode="adjustResize"
      keyboardBlurBehavior="restore"
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
              <ActivityIndicator size="large" color="#934ce4ff" />
              <Text style={styles.emptyStateText}>Loading players...</Text>
            </View>
          ) : players.length === 0 ? (
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
              data={players}
              renderItem={({ item }) => (
                <PlayerInviteListItem
                  player={item}
                  onPress={handlePlayerSelect}
                  seasonSport={seasonSport}
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
