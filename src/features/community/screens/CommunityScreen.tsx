import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, View, StyleSheet, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useSession } from '@/lib/auth-client';
import { NavBar } from '@/shared/components/layout';
import * as Haptics from 'expo-haptics';
import { toast } from 'sonner-native';
import { router } from 'expo-router';
import { CommunityHeader, SearchBar, TabSwitcher, PlayerInfoModal, FriendRequestModal } from '../components';
import { AllPlayersView, FriendsView, InvitationsView } from '../views';
import { useProfile, usePlayers, useFriends, useSeasonInvitations } from '../hooks';
import { Player } from '../types';
import type { ViewMode } from '../components/TabSwitcher';

const { height } = Dimensions.get('window');

interface CommunityScreenProps {
  onTabPress: (tabIndex: number) => void;
}

export default function CommunityScreen({ onTabPress }: CommunityScreenProps) {
  const insets = useSafeAreaInsets();
  const { data: session } = useSession();

  // Hooks
  const { profileData, fetchProfile } = useProfile();
  const { players, isLoading, searchPlayers } = usePlayers();
  const {
    friends,
    friendRequests,
    actionLoading: friendActionLoading,
    fetchFriends,
    fetchFriendRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
  } = useFriends();
  const {
    seasonInvitations,
    actionLoading: invitationActionLoading,
    fetchSeasonInvitations,
    acceptSeasonInvitation,
    denySeasonInvitation,
    cancelSeasonInvitation,
  } = useSeasonInvitations();

  // Local state
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [friendRequestModalVisible, setFriendRequestModalVisible] = useState(false);
  const [friendRequestRecipient, setFriendRequestRecipient] = useState<{ id: string; name: string } | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const STATUS_BAR_HEIGHT = insets.top;

  // Filtered players based on search
  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if player is friend
  const isFriend = useCallback((playerId: string) => {
    return friends.some(f => f.friend.id === playerId);
  }, [friends]);

  // Fetch data on mount
  useEffect(() => {
    if (session?.user?.id) {
      console.log('🔵 CommunityScreen: Fetching all data for user:', session.user.id);
      fetchProfile();
      searchPlayers();
      fetchFriends();
      fetchFriendRequests();
      fetchSeasonInvitations();
    } else {
      console.log('❌ CommunityScreen: No session user ID found');
    }
  }, [session?.user?.id, fetchProfile, searchPlayers, fetchFriends, fetchFriendRequests, fetchSeasonInvitations]);

  // Handle search with debounce
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (searchQuery.trim().length >= 2) {
      const timeout = setTimeout(() => {
        searchPlayers(searchQuery);
      }, 500);
      setSearchTimeout(timeout);
    } else if (searchQuery.trim().length === 0) {
      searchPlayers();
    }

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchQuery]);

  const handleTabPress = useCallback((tabIndex: number) => {
    setActiveTab(tabIndex);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onTabPress(tabIndex);
  }, [onTabPress]);

  const handlePlayerPress = useCallback((player: Player) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlayer(player);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setTimeout(() => setSelectedPlayer(null), 300);
  }, []);

  const handleChat = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Chat with:', selectedPlayer?.name);
    closeModal();
  }, [selectedPlayer, closeModal]);


  const handleSendFriendRequest = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (selectedPlayer?.id && selectedPlayer?.name) {
      if (isFriend(selectedPlayer.id)) {
        toast.success('Already friends!');
        return;
      }

      setFriendRequestRecipient({
        id: selectedPlayer.id,
        name: selectedPlayer.name
      });
    }

    closeModal();
    setTimeout(() => {
      setFriendRequestModalVisible(true);
    }, 300);
  }, [selectedPlayer, closeModal, isFriend]);

  const handleSendFriendRequestConfirm = useCallback(async () => {
    try {
      if (!friendRequestRecipient?.id) {
        return;
      }

      await sendFriendRequest(friendRequestRecipient.id);
      setFriendRequestRecipient(null);
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  }, [friendRequestRecipient, sendFriendRequest]);

  const handleAcceptSeasonInvitation = useCallback(async (invitationId: string) => {
    await acceptSeasonInvitation(invitationId, (partnershipData) => {
      // Refresh friends and invitations after accepting
      fetchFriends();

      // Navigate to DoublesTeamPairingScreen if partnership was created
      if (partnershipData?.season) {
        const seasonId = partnershipData.season.id;
        const seasonName = partnershipData.season.name;

        // Navigate to the season pairing screen
        router.push({
          pathname: '/(tabs)/seasons/[seasonId]/doubles-pairing',
          params: {
            seasonId,
            seasonName,
          },
        });
      }
    });
  }, [acceptSeasonInvitation, fetchFriends]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FDEDE0', '#FFFFFF']}
        locations={[0, 1]}
        style={styles.backgroundGradient}
      />

      <View style={[styles.contentContainer, { paddingTop: STATUS_BAR_HEIGHT }]}>
        {/* Header */}
        <View style={styles.headerSection}>
          <CommunityHeader
            profileImage={profileData?.image || session?.user?.image}
            profileName={profileData?.name || session?.user?.name}
          />
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabSection}>
          <TabSwitcher
            activeTab={viewMode}
            onTabChange={setViewMode}
            friendsCount={friends.length}
          />
        </View>

        {/* Content Views */}
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {viewMode === 'all' && (
            <AllPlayersView
              players={filteredPlayers}
              isLoading={isLoading}
              searchQuery={searchQuery}
              onPlayerPress={handlePlayerPress}
            />
          )}

          {viewMode === 'friends' && (
            <FriendsView
              friends={friends}
              partnerships={[]}
            />
          )}

          {viewMode === 'invitations' && (
            <InvitationsView
              friendRequests={friendRequests}
              seasonInvitations={seasonInvitations}
              friendActionLoading={friendActionLoading}
              invitationActionLoading={invitationActionLoading}
              onAcceptFriendRequest={acceptFriendRequest}
              onRejectFriendRequest={rejectFriendRequest}
              onAcceptInvitation={handleAcceptSeasonInvitation}
              onDenyInvitation={denySeasonInvitation}
              onCancelInvitation={cancelSeasonInvitation}
            />
          )}
        </ScrollView>
      </View>

      <NavBar
        activeTab={activeTab}
        onTabPress={handleTabPress}
        badgeCounts={{
          connect: seasonInvitations.received.length + friendRequests.received.length,
        }}
      />

      {/* Player Info Modal */}
      <PlayerInfoModal
        visible={modalVisible}
        player={selectedPlayer}
        isFriend={selectedPlayer ? isFriend(selectedPlayer.id) : false}
        onClose={closeModal}
        onChat={handleChat}
        onSendFriendRequest={handleSendFriendRequest}
      />

      {/* Friend Request Modal */}
      <FriendRequestModal
        visible={friendRequestModalVisible}
        recipientName={friendRequestRecipient?.name || ''}
        onClose={() => {
          setFriendRequestModalVisible(false);
          setFriendRequestRecipient(null);
        }}
        onSend={handleSendFriendRequestConfirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.35,
  },
  contentContainer: {
    flex: 1,
    zIndex: 1,
  },
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 16 : 20,
    paddingBottom: 20,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  tabSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
});
