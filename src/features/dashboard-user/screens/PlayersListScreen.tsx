import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Dimensions,
  TextInput,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { getSportColors, SportType } from '@/constants/SportsColor';
import { SeasonService, SeasonMembership } from '@/features/dashboard-user/services/SeasonService';
import { LeagueService } from '@/features/leagues/services/LeagueService';
import { PlayerListItemEnhanced } from '@/features/dashboard-user/components/PlayerListItemEnhanced';
import { SkillRatings } from '@/src/utils/dmrCalculator';
import axiosInstance, { endpoints } from '@/lib/endpoints';
import BackButtonIcon from '@/assets/icons/back-button.svg';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isTablet = width > 768;

interface PlayersListScreenProps {
  contextType: 'league' | 'season';
  contextId: string;
  contextName: string;
  sport: 'pickleball' | 'tennis' | 'padel';
  totalPlayers: number;
}

interface PlayerData {
  id: string;
  name: string;
  image?: string;
  divisionName?: string;
  divisionId?: string;
  status?: string;
  skillRatings?: SkillRatings | null;
}

export default function PlayersListScreen({
  contextType,
  contextId,
  contextName,
  sport,
  totalPlayers,
}: PlayersListScreenProps) {
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  // Entry animation values
  const headerEntryOpacity = useRef(new Animated.Value(0)).current;
  const headerEntryTranslateY = useRef(new Animated.Value(-20)).current;
  const contentEntryOpacity = useRef(new Animated.Value(0)).current;
  const contentEntryTranslateY = useRef(new Animated.Value(30)).current;
  const hasPlayedEntryAnimation = useRef(false);

  const sportColors = getSportColors(sport.toUpperCase() as SportType);

  useEffect(() => {
    fetchPlayers();
  }, [contextType, contextId]);

  // Entry animation effect
  useEffect(() => {
    if (!isLoading && !error && players.length >= 0 && !hasPlayedEntryAnimation.current) {
      hasPlayedEntryAnimation.current = true;
      Animated.stagger(80, [
        // Header animation
        Animated.parallel([
          Animated.spring(headerEntryOpacity, {
            toValue: 1,
            tension: 50,
            friction: 8,
            useNativeDriver: false,
          }),
          Animated.spring(headerEntryTranslateY, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: false,
          }),
        ]),
        // Content animation
        Animated.parallel([
          Animated.spring(contentEntryOpacity, {
            toValue: 1,
            tension: 50,
            friction: 8,
            useNativeDriver: false,
          }),
          Animated.spring(contentEntryTranslateY, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: false,
          }),
        ]),
      ]).start();
    }
  }, [isLoading, error, players]);

  const fetchPlayers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let memberships: SeasonMembership[] = [];

      if (contextType === 'season') {
        const allSeasons = await SeasonService.fetchAllSeasons();
        const season = allSeasons.find(s => s.id === contextId);
        memberships = season?.memberships || [];
      } else {
        // For league, we need to fetch the league data
        const league = await LeagueService.fetchLeagueById(contextId);
        memberships = (league as any)?.memberships || [];
      }

      // Get unique player IDs from memberships
      const playerIds = memberships
        .filter(membership => membership.user)
        .map(membership => membership.user!.id);

      // Fetch all players with skill ratings from the API
      let allPlayersWithRatings: any[] = [];
      try {
        const response = await axiosInstance.get(endpoints.player.getAll);
        // API returns { success, statusCode, data, message } - extract the data array
        const responseData = response.data?.data ?? response.data;
        if (responseData && Array.isArray(responseData.data)) {
          allPlayersWithRatings = responseData.data;
        } else if (Array.isArray(responseData)) {
          allPlayersWithRatings = responseData;
        }
      } catch (err) {
        console.error('Error fetching players with ratings:', err);
        // Continue without ratings if fetch fails
      }

      // Create a map of player ID to skill ratings
      const playerRatingsMap = new Map<string, SkillRatings>();
      if (Array.isArray(allPlayersWithRatings)) {
        for (const player of allPlayersWithRatings) {
          if (player.id && player.skillRatings) {
            playerRatingsMap.set(player.id, player.skillRatings);
          }
        }
      }

      // Transform memberships to PlayerData with skill ratings
      const playerData: PlayerData[] = memberships
        .filter(membership => membership.user)
        .map(membership => ({
          id: membership.user!.id,
          name: membership.user!.name || 'Unknown Player',
          image: membership.user!.image,
          divisionId: membership.divisionId,
          divisionName: undefined, // Will be populated if we have division data
          status: membership.status,
          skillRatings: playerRatingsMap.get(membership.user!.id) || null,
        }));

      setPlayers(playerData);
    } catch (err) {
      console.error('Error fetching players:', err);
      setError('Failed to load players');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPlayers();
    setRefreshing(false);
  }, [contextType, contextId]);

  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) return players;
    return players.filter(player =>
      player.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [players, searchQuery]);

  const handlePlayerPress = (playerId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/player-profile/[id]',
      params: { id: playerId },
    });
  };

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const renderPlayerItem = ({ item, index }: { item: PlayerData; index: number }) => (
    <View key={item.id}>
      <PlayerListItemEnhanced
        player={item}
        sport={sport}
        onPress={handlePlayerPress}
      />
      {index < filteredPlayers.length - 1 && <View style={styles.divider} />}
    </View>
  );

  const renderEmptyState = () => {
    if (searchQuery.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No players found</Text>
          <Text style={styles.emptyText}>
            No players match "{searchQuery}"
          </Text>
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={[styles.clearButton, { backgroundColor: sportColors.background }]}
          >
            <Text style={styles.clearButtonText}>Clear search</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={64} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>No players yet</Text>
        <Text style={styles.emptyText}>
          No players have registered for this {contextType} yet.
        </Text>
      </View>
    );
  };

  const renderErrorState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cloud-offline-outline" size={64} color="#EF4444" />
      <Text style={styles.emptyTitle}>Failed to load players</Text>
      <Text style={styles.emptyText}>
        {error || 'An error occurred while loading the player list.'}
      </Text>
      <TouchableOpacity
        onPress={fetchPlayers}
        style={[styles.retryButton, { backgroundColor: sportColors.background }]}
      >
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  // Header component for both normal and error states
  const renderHeader = () => (
    <LinearGradient
      colors={[sportColors.background, sportColors.buttonColor]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top }]}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <BackButtonIcon width={24} height={24} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title} numberOfLines={1}>{contextName}</Text>
          <Text style={styles.subtitle}>
            {players.length} {players.length === 1 ? 'player' : 'players'}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );

  if (error && !players.length) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        {renderHeader()}
        {renderErrorState()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <Animated.View
        style={{
          opacity: headerEntryOpacity,
          transform: [{ translateY: headerEntryTranslateY }],
        }}
      >
        {renderHeader()}
      </Animated.View>

      {/* Search Bar */}
      <Animated.View
        style={[
          styles.searchContainer,
          {
            opacity: contentEntryOpacity,
            transform: [{ translateY: contentEntryTranslateY }],
          },
        ]}
      >
        <View style={[styles.searchInputWrapper, { borderColor: sportColors.background }]}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search players..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Player List */}
      <Animated.View
        style={[
          styles.listContainer,
          {
            opacity: contentEntryOpacity,
            transform: [{ translateY: contentEntryTranslateY }],
          },
        ]}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={sportColors.background} />
          </View>
        ) : (
          <FlatList
            data={filteredPlayers}
            renderItem={renderPlayerItem}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={renderEmptyState}
            initialNumToRender={20}
            maxToRenderPerBatch={10}
            windowSize={10}
            removeClippedSubviews={true}
            getItemLayout={(data, index) => ({
              length: 80,
              offset: 80 * index,
              index,
            })}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={sportColors.background}
              />
            }
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingBottom: isSmallScreen ? 14 : isTablet ? 20 : 16,
    paddingHorizontal: isSmallScreen ? 16 : isTablet ? 24 : 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: isSmallScreen ? 8 : isTablet ? 12 : 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: isSmallScreen ? 8 : isTablet ? 16 : 12,
  },
  title: {
    fontSize: isSmallScreen ? 18 : isTablet ? 24 : 20,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: isSmallScreen ? 12 : isTablet ? 15 : 13,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.85,
    marginTop: 2,
    fontFamily: 'Inter',
  },
  searchContainer: {
    paddingHorizontal: isSmallScreen ? 16 : isTablet ? 24 : 20,
    paddingVertical: isSmallScreen ? 12 : isTablet ? 16 : 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 12,
    height: isSmallScreen ? 40 : isTablet ? 48 : 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    color: '#1F2937',
    fontFamily: 'Inter',
  },
  listContainer: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginLeft: isSmallScreen ? 76 : isTablet ? 104 : 90,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: isSmallScreen ? 18 : isTablet ? 24 : 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  emptyText: {
    fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Inter',
  },
  clearButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});
