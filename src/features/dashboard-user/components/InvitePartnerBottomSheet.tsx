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
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
  onPlayerSelect: (player: Player) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const InvitePartnerBottomSheet: React.FC<InvitePartnerBottomSheetProps> = ({
  visible,
  onClose,
  seasonId,
  onPlayerSelect,
}) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  // Use percentage-based snap points for better iOS compatibility
  const snapPoints = useMemo(() => ['85%'], []);

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

  const handleConnectPress = useCallback(() => {
    onClose();
    router.push('/user-dashboard/connect');
  }, [onClose]);

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
      // Use requestAnimationFrame for iOS to ensure proper rendering
      if (Platform.OS === 'ios') {
        requestAnimationFrame(() => {
          setTimeout(() => {
            bottomSheetModalRef.current?.present();
          }, 50);
        });
      } else {
        bottomSheetModalRef.current?.present();
      }
      fetchPlayers();
    } else {
      console.log('❌ Closing bottom sheet');
      bottomSheetModalRef.current?.dismiss();
    }
  }, [visible, seasonId, fetchPlayers]);

  // Render header content
  const renderHeader = () => (
    <View style={styles.headerContainer}>
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
    </View>
  );

  // Render empty/loading state
  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#A04DFE" />
          <Text style={styles.emptyStateText}>Loading players...</Text>
        </View>
      );
    }

    if (players.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color="#BABABA" />
          <Text style={styles.emptyStateText}>
            {searchQuery ? 'No players found' : 'No friends yet'}
          </Text>
          <Text style={styles.emptyStateSubtext}>
            {searchQuery 
              ? 'Try a different search term' 
              : 'Add friends first before selecting them as your partner'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity 
              style={styles.connectButton} 
              onPress={handleConnectPress}
              activeOpacity={0.7}
            >
              <Text style={styles.connectButtonText}>Go to Connect</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return null;
  };

  // Use a placeholder item for empty state to ensure consistent layout
  const listData = isLoading || players.length === 0 ? [{ id: 'empty' }] : players;
  const isEmpty = isLoading || players.length === 0;

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
      enableHandlePanningGesture={true}
      enableContentPanningGesture={true}
      android_keyboardInputMode="adjustResize"
      keyboardBlurBehavior="restore"
      keyboardBehavior="interactive"
      bottomInset={insets.bottom}
      detached={false}
    >
      <BottomSheetFlatList
        data={listData}
        renderItem={({ item }: { item: Player | { id: string } }) => {
          if (item.id === 'empty') {
            return renderEmptyState();
          }
          return (
            <PlayerInviteListItem
              player={item as Player}
              onPress={handlePlayerSelect}
            />
          );
        }}
        keyExtractor={(item: Player | { id: string }) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={[
          styles.listContent,
          isEmpty && styles.listContentEmpty,
        ]}
        style={styles.listStyle}
      />
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerContainer: {
    paddingTop: 8,
    paddingBottom: 16,
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
  listStyle: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    minHeight: 300,
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
    paddingHorizontal: 20,
  },
  connectButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#A04DFE',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
