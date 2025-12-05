import { getSportColors, SportType } from '@/constants/SportsColor';
import { endpoints } from '@/lib/endpoints';
import axiosInstance from '@/lib/endpoints';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface StandingsPlayer {
  rank: number;
  playerId: string;
  name: string;
  image?: string;
  played: number;
  wins: number;
  losses: number;
  points: number;
}

export default function DivisionStandingsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [showResults, setShowResults] = useState(false);
  const [standings, setStandings] = useState<StandingsPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  // Get params from parent
  const divisionId = params.divisionId as string;
  const divisionName = (params.divisionName as string) || 'Division 1';
  const sportType = (params.sportType as string) as SportType;
  const leagueName = (params.leagueName as string) || 'Petaling Jaya Padel League';
  const seasonName = (params.seasonName as string) || 'Season 1 (2025)';
  const gameType = (params.gameType as string) || 'Mens Doubles';
  const genderCategory = (params.genderCategory as string) || '';
  const seasonStartDate = params.seasonStartDate as string;
  const seasonEndDate = params.seasonEndDate as string;

  // Format dates
  const formatDate = (dateString: string | null | undefined, fallback: string) => {
    if (!dateString) return fallback;
    try {
      return format(new Date(dateString), 'd MMMM yyyy');
    } catch {
      return fallback;
    }
  };

  const startDate = formatDate(seasonStartDate, '');
  const endDate = formatDate(seasonEndDate, '');

  // Format game type badge text with gender category
  const formatGenderCategory = (gender: string) => {
    const upperGender = gender.toUpperCase();
    if (upperGender === 'MALE' || upperGender === 'MENS' || upperGender === 'MEN') return "Men's";
    if (upperGender === 'FEMALE' || upperGender === 'WOMENS' || upperGender === 'WOMEN') return "Women's";
    if (upperGender === 'MIXED') return 'Mixed';
    return gender;
  };

  const gameTypeBadgeText = genderCategory 
    ? `${formatGenderCategory(genderCategory)} ${gameType}`
    : gameType;

  // Fetch standings data
  useEffect(() => {
    if (divisionId) {
      fetchStandings();
    }
  }, [divisionId]);

  const fetchStandings = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        endpoints.standings.getDivisionStandings(divisionId)
      );

      console.log('📊 Standings response:', response.data);

      // Handle response structure: {data: [], success: true}
      const standingsData = response.data.data || response.data || [];
      
      // Transform backend data to match our interface
      // Backend returns: odlayerName, odlayerImage OR user.name, user.image
      const transformedStandings: StandingsPlayer[] = standingsData.map((standing: any, index: number) => ({
        rank: standing.rank || index + 1,
        playerId: standing.odlayerId || standing.userId || standing.playerId,
        name: standing.odlayerName || standing.user?.name || standing.userName || 'Unknown Player',
        image: standing.odlayerImage || standing.user?.image || standing.userImage || null,
        played: standing.matchesPlayed || 0,
        wins: standing.wins || 0,
        losses: standing.losses || 0,
        points: standing.totalPoints || 0,
      }));

      setStandings(transformedStandings);
    } catch (error) {
      console.error('Error fetching standings:', error);
      // Keep empty array on error
      setStandings([]);
    } finally {
      setLoading(false);
    }
  };

  const sportColors = getSportColors(sportType);

  const handleViewMatches = () => {
    router.push({
      pathname: '/match/all-matches',
      params: {
        divisionId,
        sportType,
        leagueName,
        seasonName,
      },
    });
  };

  const renderPlayerRow = (player: StandingsPlayer, index: number) => {
    const isLastItem = index === standings.length - 1;
    
    return (
      <View
        key={player.playerId}
        style={[styles.playerRow, isLastItem && styles.playerRowLast]}
      >
        {/* Rank */}
        <View style={styles.rankCell}>
          <Text style={styles.rankText}>{player.rank}</Text>
        </View>

        {/* Player */}
        <View style={styles.playerCell}>
          <View style={styles.playerAvatar}>
            {player.image ? (
              <Image source={{ uri: player.image }} style={styles.avatarImage} />
            ) : (
              <View style={styles.defaultAvatar}>
                <Text style={styles.defaultAvatarText}>
                  {player.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.playerName}>{player.name}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statCell}>
          <Text style={styles.statText}>{player.played}</Text>
        </View>
        <View style={styles.statCell}>
          <Text style={styles.statText}>{player.wins}</Text>
        </View>
        <View style={styles.statCell}>
          <Text style={styles.statText}>{player.losses}</Text>
        </View>
        <View style={styles.ptsCell}>
          <Text style={styles.ptsText}>{player.points}pts</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: sportColors.badgeColor }]}>
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 12 }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color="#000000ff" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.seasonTitle}>{seasonName}</Text>
          <Text style={styles.leagueTitle}>{leagueName}</Text>
          <View style={[styles.sportBadge, { backgroundColor: sportColors.background }]}>
            <Text style={styles.sportBadgeText}>{gameTypeBadgeText}</Text>
          </View>
          <View style={styles.dateRange}>
            <Text style={styles.dateText}>Start date: {startDate}</Text>
            <Text style={styles.dateText}>End date: {endDate}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Standings Section */}
        <View style={styles.standingsSection}>
          <Text style={styles.standingsTitle}>Standings</Text>

          {/* Division Card */}
          <View style={styles.divisionCard}>
            {/* Division Header - Sport themed */}
            <View style={[styles.divisionHeader, { backgroundColor: sportColors.background }]}>
              <Text style={styles.divisionName}>{divisionName}</Text>
              <TouchableOpacity
                style={styles.viewMatchesButton}
                onPress={handleViewMatches}
                activeOpacity={0.7}
              >
                <Text style={styles.viewMatchesText}>View Matches</Text>
              </TouchableOpacity>
            </View>

            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={styles.rankHeaderCell}>
                <Text style={styles.headerText}>Rank</Text>
              </View>
              <View style={styles.playerHeaderCell}>
                <Text style={styles.headerText}>Player</Text>
              </View>
              <View style={styles.statHeaderCell}>
                <Text style={styles.headerText}>P</Text>
              </View>
              <View style={styles.statHeaderCell}>
                <Text style={styles.headerText}>W</Text>
              </View>
              <View style={styles.statHeaderCell}>
                <Text style={styles.headerText}>L</Text>
              </View>
              <View style={styles.ptsHeaderCell}>
                <Text style={styles.headerText}>Pts</Text>
              </View>
            </View>

            {/* Table Body */}
            <View style={styles.tableBody}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={sportColors.background} />
                  <Text style={styles.loadingText}>Loading standings...</Text>
                </View>
              ) : standings.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="trophy-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyTitle}>No Standings Yet</Text>
                  <Text style={styles.emptyText}>
                    Standings will appear once matches are completed
                  </Text>
                </View>
              ) : (
                standings.map((player, index) => renderPlayerRow(player, index))
              )}
            </View>

            {/* View Results Toggle - Sport themed */}
            <TouchableOpacity
              style={styles.viewResultsButton}
              onPress={() => setShowResults(!showResults)}
              activeOpacity={0.7}
            >
              <Text style={[styles.viewResultsText, { color: sportColors.background }]}>View Results</Text>
              <Ionicons
                name={showResults ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={sportColors.background}
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
    position: 'relative',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    padding: 4,
    zIndex: 10,
  },
  headerContent: {
    alignItems: 'center',
  },
  seasonTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  leagueTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  sportBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  sportBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateRange: {
    flexDirection: 'row',
    gap: 28,
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  standingsSection: {
    padding: 16,
  },
  standingsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  divisionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  divisionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#863A73',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  divisionName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  viewMatchesButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewMatchesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  rankHeaderCell: {
    width: 45,
  },
  playerHeaderCell: {
    flex: 1,
  },
  statHeaderCell: {
    width: 35,
    alignItems: 'center',
  },
  ptsHeaderCell: {
    width: 50,
    alignItems: 'flex-end',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  tableBody: {
    paddingHorizontal: 12,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  playerRowLast: {
    borderBottomWidth: 0,
  },
  rankCell: {
    width: 45,
  },
  rankText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  playerCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  defaultAvatar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  statCell: {
    width: 35,
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  ptsCell: {
    width: 50,
    alignItems: 'flex-end',
  },
  ptsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
  },
  viewResultsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  viewResultsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F59E0B',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
