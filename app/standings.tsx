import { useSession } from '@/lib/auth-client';
import { DivisionWithStandings, StandingEntry, StandingsService } from '@/src/features/leagues/services/StandingsService';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

// Table column widths
const RANK_WIDTH = 40;
const PLAYER_WIDTH = 120;
const STAT_WIDTH = 35;
const POINTS_WIDTH = 50;

export default function StandingsScreen() {
  const insets = useSafeAreaInsets();
  const { data: session } = useSession();
  const params = useLocalSearchParams();
  
  // Extract params
  const seasonId = params.seasonId as string;
  const seasonName = params.seasonName as string;
  const leagueId = params.leagueId as string;
  const leagueName = params.leagueName as string;
  const categoryName = params.categoryName as string;
  const startDate = params.startDate as string;
  const endDate = params.endDate as string;
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [divisionsWithStandings, setDivisionsWithStandings] = useState<DivisionWithStandings[]>([]);
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(new Set());
  const [userDivisionId, setUserDivisionId] = useState<string | null>(null);

  const userId = session?.user?.id;

  useEffect(() => {
    fetchStandings();
  }, [seasonId, userId]);

  const fetchStandings = async () => {
    console.log('🏆 Standings Screen - seasonId:', seasonId, 'userId:', userId);
    
    if (!seasonId) {
      console.log('❌ No seasonId provided');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔍 Fetching standings for season:', seasonId);
      const data = await StandingsService.getSeasonDivisionsWithStandings(seasonId, userId);
      console.log('📊 Got divisions with standings:', data.length, 'divisions');
      console.log('📊 Divisions data:', JSON.stringify(data, null, 2));
      setDivisionsWithStandings(data);

      // Find which division the user is in and expand it by default
      const userDiv = data.find(d => d.userStanding);
      if (userDiv) {
        setUserDivisionId(userDiv.division.id);
        setExpandedDivisions(new Set([userDiv.division.id]));
      } else if (data.length > 0) {
        // If user not in any division, expand the first one
        setExpandedDivisions(new Set([data[0].division.id]));
      }
    } catch (error) {
      console.error('Error fetching standings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDivision = (divisionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedDivisions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(divisionId)) {
        newSet.delete(divisionId);
      } else {
        newSet.add(divisionId);
      }
      return newSet;
    });
  };

  const handlePlayerPress = (playerId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/player-profile/[id]' as any,
      params: { id: playerId }
    });
  };

  const handleViewMatches = (divisionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to matches view filtered by division
    router.push({
      pathname: '/match-history' as any,
      params: { divisionId, seasonId }
    });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const renderStandingRow = (standing: StandingEntry, index: number, isUserRow: boolean) => {
    const playerId = standing.userId || standing.odlayerId || standing.user?.id;
    const playerName = standing.user?.name || standing.odlayerName || 'Unknown Player';
    const playerImage = standing.user?.image || standing.odlayerImage;
    const playerInitial = playerName.charAt(0).toUpperCase();

    return (
      <TouchableOpacity
        key={standing.id || `standing-${index}`}
        style={[
          styles.standingRow,
          isUserRow && styles.userRow,
          index % 2 === 0 && styles.evenRow,
        ]}
        onPress={() => playerId && handlePlayerPress(playerId)}
        activeOpacity={0.7}
      >
        {/* Rank */}
        <View style={[styles.cell, { width: RANK_WIDTH }]}>
          <Text style={[styles.rankText, isUserRow && styles.userText]}>
            {standing.rank || index + 1}
          </Text>
        </View>

        {/* Player */}
        <View style={[styles.playerCell, { width: PLAYER_WIDTH }]}>
          {playerImage ? (
            <Image source={{ uri: playerImage }} style={styles.playerImage} />
          ) : (
            <View style={styles.playerImagePlaceholder}>
              <Text style={styles.playerInitial}>{playerInitial}</Text>
            </View>
          )}
          <Text 
            style={[styles.playerName, isUserRow && styles.userText]} 
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {playerName}
          </Text>
        </View>

        {/* P (Played) */}
        <View style={[styles.cell, { width: STAT_WIDTH }]}>
          <Text style={[styles.statText, isUserRow && styles.userText]}>
            {standing.matchesPlayed}
          </Text>
        </View>

        {/* W (Wins) */}
        <View style={[styles.cell, { width: STAT_WIDTH }]}>
          <Text style={[styles.statText, isUserRow && styles.userText]}>
            {standing.wins}
          </Text>
        </View>

        {/* L (Losses) */}
        <View style={[styles.cell, { width: STAT_WIDTH }]}>
          <Text style={[styles.statText, isUserRow && styles.userText]}>
            {standing.losses}
          </Text>
        </View>

        {/* Pts (Points) */}
        <View style={[styles.cell, { width: POINTS_WIDTH }]}>
          <TouchableOpacity 
            style={styles.pointsButton}
            onPress={() => playerId && handlePlayerPress(playerId)}
          >
            <Text style={styles.pointsText}>{standing.totalPoints}pts</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDivisionCard = (divisionData: DivisionWithStandings) => {
    const { division, standings, userStanding } = divisionData;
    const isExpanded = expandedDivisions.has(division.id);
    const isUserDivision = userDivisionId === division.id;

    return (
      <View 
        key={division.id} 
        style={[
          styles.divisionCard,
          isUserDivision && styles.userDivisionCard,
        ]}
      >
        {/* Division Header */}
        <TouchableOpacity
          style={[
            styles.divisionHeader,
            isUserDivision && styles.userDivisionHeader,
          ]}
          onPress={() => toggleDivision(division.id)}
          activeOpacity={0.8}
        >
          <View style={styles.divisionHeaderLeft}>
            <Text style={[
              styles.divisionTitle,
              isUserDivision && styles.userDivisionTitle,
            ]}>
              {division.name}
            </Text>
          </View>
          <View style={styles.divisionHeaderRight}>
            <TouchableOpacity
              style={[
                styles.viewMatchesButton,
                isUserDivision && styles.viewMatchesButtonActive,
              ]}
              onPress={() => handleViewMatches(division.id)}
            >
              <Text style={[
                styles.viewMatchesText,
                isUserDivision && styles.viewMatchesTextActive,
              ]}>View Matches</Text>
            </TouchableOpacity>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={isUserDivision ? '#FFFFFF' : '#6B7280'}
            />
          </View>
        </TouchableOpacity>

        {/* Standings Table */}
        {isExpanded && (
          <View style={styles.standingsTable}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={[styles.headerCell, { width: RANK_WIDTH }]}>
                <Text style={styles.headerText}>Rank</Text>
              </View>
              <View style={[styles.headerCell, { width: PLAYER_WIDTH }]}>
                <Text style={styles.headerText}>Player</Text>
              </View>
              <View style={[styles.headerCell, { width: STAT_WIDTH }]}>
                <Text style={styles.headerText}>P</Text>
              </View>
              <View style={[styles.headerCell, { width: STAT_WIDTH }]}>
                <Text style={styles.headerText}>W</Text>
              </View>
              <View style={[styles.headerCell, { width: STAT_WIDTH }]}>
                <Text style={styles.headerText}>L</Text>
              </View>
              <View style={[styles.headerCell, { width: POINTS_WIDTH }]}>
                <Text style={styles.headerText}>Pts</Text>
              </View>
            </View>

            {/* Table Body */}
            {standings.length > 0 ? (
              standings.map((standing, index) => {
                const isUserRow = userId && (
                  standing.userId === userId || 
                  standing.odlayerId === userId || 
                  standing.user?.id === userId
                );
                return renderStandingRow(standing, index, !!isUserRow);
              })
            ) : (
              <View style={styles.emptyStandings}>
                <Text style={styles.emptyText}>No standings yet</Text>
              </View>
            )}

            {/* View Results Link */}
            <TouchableOpacity 
              style={styles.viewResultsLink}
              onPress={() => toggleDivision(division.id)}
            >
              <Text style={styles.viewResultsText}>View Results</Text>
              <Ionicons name="chevron-down" size={16} color="#48A7F8" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#48A7F8', '#59C3FB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + 12 }]}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Season Info */}
        <View style={styles.seasonInfo}>
          <Text style={styles.seasonTitle}>
            {seasonName || 'Season 1 (2025)'}
          </Text>
          <Text style={styles.leagueName}>
            {leagueName || 'League'}
          </Text>
          {categoryName && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{categoryName}</Text>
            </View>
          )}
          {(startDate || endDate) && (
            <Text style={styles.dateRange}>
              {startDate && `Start date: ${formatDate(startDate)}`}
              {startDate && endDate && '    '}
              {endDate && `End date: ${formatDate(endDate)}`}
            </Text>
          )}
        </View>
      </LinearGradient>

      {/* Standings Content */}
      <View style={styles.content}>
        <Text style={styles.standingsTitle}>Standings</Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#48A7F8" />
            <Text style={styles.loadingText}>Loading standings...</Text>
          </View>
        ) : divisionsWithStandings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Standings Yet</Text>
            <Text style={styles.emptyDescription}>
              Standings will appear once the season begins and players are assigned to divisions.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {divisionsWithStandings.map(renderDivisionCard)}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  seasonInfo: {
    alignItems: 'center',
  },
  seasonTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  leagueName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: '#2C2C2C',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dateRange: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.85,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  standingsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  divisionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userDivisionCard: {
    borderWidth: 2,
    borderColor: '#48A7F8',
  },
  divisionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  userDivisionHeader: {
    backgroundColor: '#48A7F8',
    borderBottomColor: '#48A7F8',
  },
  divisionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  divisionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  userDivisionTitle: {
    color: '#FFFFFF',
  },
  divisionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewMatchesButton: {
    backgroundColor: '#48A7F8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  viewMatchesButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  viewMatchesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  viewMatchesTextActive: {
    color: '#48A7F8',
  },
  standingsTable: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  standingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  evenRow: {
    backgroundColor: '#FAFBFC',
  },
  userRow: {
    backgroundColor: '#EBF5FF',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1C1E',
  },
  playerImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  playerImagePlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEA04D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  playerInitial: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playerName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1A1C1E',
    flex: 1,
  },
  statText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
  },
  userText: {
    color: '#48A7F8',
    fontWeight: '600',
  },
  pointsButton: {
    backgroundColor: 'transparent',
  },
  pointsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#48A7F8',
  },
  emptyStandings: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  viewResultsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  viewResultsText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#48A7F8',
    marginRight: 4,
  },
});
