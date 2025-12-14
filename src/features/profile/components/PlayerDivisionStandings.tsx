import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { theme } from '@core/theme/theme';
import { StandingsService, DivisionWithStandings } from '@/src/features/leagues/services/StandingsService';

interface PlayerDivisionStandingsProps {
  userId: string;
  showOnlyCurrentDivisions?: boolean;
}

export const PlayerDivisionStandings: React.FC<PlayerDivisionStandingsProps> = ({
  userId,
  showOnlyCurrentDivisions = true,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [divisionsWithStandings, setDivisionsWithStandings] = useState<DivisionWithStandings[]>([]);

  useEffect(() => {
    if (userId) {
      fetchUserDivisions();
    }
  }, [userId]);

  const fetchUserDivisions = async () => {
    try {
      setIsLoading(true);
      const data = await StandingsService.getUserStandings(userId);
      setDivisionsWithStandings(data);
    } catch (error) {
      console.error('Error fetching user divisions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewAllStandings = (division: DivisionWithStandings) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/standings' as any,
      params: {
        seasonId: division.division.seasonId,
        leagueId: '',
      }
    });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Division Standings</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading standings...</Text>
        </View>
      </View>
    );
  }

  if (divisionsWithStandings.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Division Standings</Text>
        <View style={styles.emptyContainer}>
          <Ionicons name="trophy-outline" size={40} color="#9CA3AF" />
          <Text style={styles.emptyText}>Not in any divisions yet</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Division Standings</Text>
      
      {divisionsWithStandings.map((divisionData) => {
        const { division, standings, userStanding } = divisionData;
        
        if (!userStanding && showOnlyCurrentDivisions) return null;
        
        return (
          <View key={division.id} style={styles.divisionCard}>
            {/* Division Header */}
            <View style={styles.divisionHeader}>
              <Text style={styles.divisionName}>{division.name}</Text>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => handleViewAllStandings(divisionData)}
              >
                <Text style={styles.viewAllText}>View All</Text>
                <Ionicons name="chevron-forward" size={14} color="#48A7F8" />
              </TouchableOpacity>
            </View>

            {/* User's Standing */}
            {userStanding && (
              <View style={styles.userStandingRow}>
                <View style={styles.rankContainer}>
                  <Text style={styles.rankText}>#{userStanding.rank || '-'}</Text>
                </View>
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{userStanding.matchesPlayed}</Text>
                    <Text style={styles.statLabel}>P</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, styles.winText]}>{userStanding.wins}</Text>
                    <Text style={styles.statLabel}>W</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, styles.lossText]}>{userStanding.losses}</Text>
                    <Text style={styles.statLabel}>L</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, styles.pointsText]}>{userStanding.totalPoints}pts</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Top 3 players (if not user) */}
            {standings.length > 0 && (
              <View style={styles.topPlayersContainer}>
                {standings.slice(0, 3).map((standing, index) => {
                  const isCurrentUser = standing.userId === userId || 
                    standing.odlayerId === userId || 
                    standing.user?.id === userId;
                  
                  if (isCurrentUser) return null;
                  
                  const playerName = standing.user?.name || standing.odlayerName || 'Player';
                  const playerImage = standing.user?.image || standing.odlayerImage;
                  const playerInitial = playerName.charAt(0).toUpperCase();
                  
                  return (
                    <View key={standing.id || index} style={styles.playerRow}>
                      <Text style={styles.playerRank}>{standing.rank || index + 1}</Text>
                      {playerImage ? (
                        <Image source={{ uri: playerImage }} style={styles.playerImage} />
                      ) : (
                        <View style={styles.playerImagePlaceholder}>
                          <Text style={styles.playerInitial}>{playerInitial}</Text>
                        </View>
                      )}
                      <Text style={styles.playerName} numberOfLines={1}>{playerName}</Text>
                      <Text style={styles.playerPoints}>{standing.totalPoints}pts</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  loadingContainer: {
    backgroundColor: '#ffffff',
    padding: theme.spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  loadingText: {
    marginTop: theme.spacing.sm,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    padding: theme.spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: theme.spacing.sm,
    fontSize: 14,
    color: '#6B7280',
  },
  divisionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  divisionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  divisionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1C1E',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#48A7F8',
    marginRight: 2,
  },
  userStandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#48A7F8',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1C1E',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },
  winText: {
    color: '#34C759',
  },
  lossText: {
    color: '#FF3B30',
  },
  pointsText: {
    color: '#48A7F8',
    fontWeight: '700',
  },
  topPlayersContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: theme.spacing.sm,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  playerRank: {
    width: 24,
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  playerImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  playerImagePlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEA04D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  playerInitial: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  playerName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#1A1C1E',
  },
  playerPoints: {
    fontSize: 13,
    fontWeight: '600',
    color: '#48A7F8',
  },
});
