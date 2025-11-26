import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@core/theme/theme';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

// Types
interface MatchScore {
  player1: number | null;
  player2: number | null;
}

interface Match {
  id: string;
  league: string;
  player1: string;
  player2: string;
  status: 'completed' | 'ongoing' | 'upcoming';
  scores: {
    set1: MatchScore;
    set2: MatchScore;
    set3: MatchScore;
  };
  date: string;
  time: string;
}

// Default Profile Icon Component (reused from profile)
const DefaultProfileIcon = () => (
  <View style={styles.profileIcon as ViewStyle}>
    <Svg width="20" height="20" viewBox="0 0 24 24">
      <Path
        fill="#FFFFFF"
        fillRule="evenodd"
        d="M8 7a4 4 0 1 1 8 0a4 4 0 0 1-8 0m0 6a5 5 0 0 0-5 5a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3a5 5 0 0 0-5-5z"
        clipRule="evenodd"
      />
    </Svg>
  </View>
);


// Real match data - currently empty until match system is implemented
const matches: Match[] = []; // Will be populated from API when match system is ready

const MatchCard = ({ match }: { match: Match }) => {
  // Determine winner based on sets won
  const getWinner = (): 'player1' | 'player2' | null => {
    if (match.status !== 'completed') return null;

    let player1Sets = 0;
    let player2Sets = 0;

    // Count sets won
    if (match.scores.set1.player1 !== null && match.scores.set1.player2 !== null) {
      if (match.scores.set1.player1 > match.scores.set1.player2) player1Sets++;
      else if (match.scores.set1.player2 > match.scores.set1.player1) player2Sets++;
    }

    if (match.scores.set2.player1 !== null && match.scores.set2.player2 !== null) {
      if (match.scores.set2.player1 > match.scores.set2.player2) player1Sets++;
      else if (match.scores.set2.player2 > match.scores.set2.player1) player2Sets++;
    }

    if (match.scores.set3.player1 !== null && match.scores.set3.player2 !== null) {
      if (match.scores.set3.player1 > match.scores.set3.player2) player1Sets++;
      else if (match.scores.set3.player2 > match.scores.set3.player1) player2Sets++;
    }

    if (player1Sets > player2Sets) return 'player1';
    if (player2Sets > player1Sets) return 'player2';
    return null; // Draw or incomplete
  };

  const winner = getWinner();
  const getStatusBackgroundColor = (status: Match['status']): string => {
    switch (status) {
      case 'completed':
        return '#eeeeee';
      case 'ongoing':
        return `${theme.colors.primary}20`;
      case 'upcoming':
        return `${theme.colors.neutral.gray[500]}20`;
      default:
        return `${theme.colors.neutral.gray[500]}20`;
    }
  };

  const getStatusTextColor = (status: Match['status']): string => {
    switch (status) {
      case 'completed':
        return '#fda04d';
      case 'ongoing':
        return theme.colors.primary;
      case 'upcoming':
        return theme.colors.neutral.gray[500];
      default:
        return theme.colors.neutral.gray[500];
    }
  };

  const getStatusText = (status: Match['status']): string => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'ongoing':
        return 'Ongoing';
      case 'upcoming':
        return 'Upcoming';
      default:
        return status;
    }
  };

  return (
    <Pressable
      style={styles.matchCard as ViewStyle}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Navigate to match details
      }}
    >
      {/* League Name with Container */}
      <View style={styles.leagueNameContainer as ViewStyle}>
        <Text style={styles.leagueName as TextStyle}>{match.league}</Text>
      </View>

      {/* Scoreboard */}
      <View style={styles.scoreboardContainer as ViewStyle}>
        {/* Player Names Column with Profile Icons */}
        <View style={styles.playerColumn as ViewStyle}>
          <View style={styles.playerRow as ViewStyle}>
            <DefaultProfileIcon />
            <Text style={[styles.playerName, winner === 'player1' && styles.winnerText] as unknown as TextStyle}>{match.player1}</Text>
          </View>
          <View style={styles.playerRow as ViewStyle}>
            <DefaultProfileIcon />
            <Text style={[styles.playerName, winner === 'player2' && styles.winnerText] as unknown as TextStyle}>{match.player2}</Text>
          </View>
        </View>

        {/* Set 1 */}
        <View style={styles.setColumn as ViewStyle}>
          <Text style={styles.setHeader as TextStyle}>Set 1</Text>
          <View style={styles.scoreContainer as ViewStyle}>
            <Text style={[styles.score, winner === 'player1' && styles.winnerText] as unknown as TextStyle}>
              {match.scores.set1.player1 !== null ? match.scores.set1.player1 : '-'}
            </Text>
          </View>
          <View style={styles.scoreContainer as ViewStyle}>
            <Text style={[styles.score, winner === 'player2' && styles.winnerText] as unknown as TextStyle}>
              {match.scores.set1.player2 !== null ? match.scores.set1.player2 : '-'}
            </Text>
          </View>
        </View>

        {/* Set 2 */}
        <View style={styles.setColumn as ViewStyle}>
          <Text style={styles.setHeader as TextStyle}>Set 2</Text>
          <View style={styles.scoreContainer as ViewStyle}>
            <Text style={[styles.score, winner === 'player1' && styles.winnerText] as unknown as TextStyle}>
              {match.scores.set2.player1 !== null ? match.scores.set2.player1 : '-'}
            </Text>
          </View>
          <View style={styles.scoreContainer as ViewStyle}>
            <Text style={[styles.score, winner === 'player2' && styles.winnerText] as unknown as TextStyle}>
              {match.scores.set2.player2 !== null ? match.scores.set2.player2 : '-'}
            </Text>
          </View>
        </View>

        {/* Set 3 */}
        <View style={styles.setColumn as ViewStyle}>
          <Text style={styles.setHeader as TextStyle}>Set 3</Text>
          <View style={styles.scoreContainer as ViewStyle}>
            <Text style={[styles.score, winner === 'player1' && styles.winnerText] as unknown as TextStyle}>
              {match.scores.set3.player1 !== null ? match.scores.set3.player1 : '-'}
            </Text>
          </View>
          <View style={styles.scoreContainer as ViewStyle}>
            <Text style={[styles.score, winner === 'player2' && styles.winnerText] as unknown as TextStyle}>
              {match.scores.set3.player2 !== null ? match.scores.set3.player2 : '-'}
            </Text>
          </View>
        </View>
      </View>


      {/* Divider */}
      <View style={styles.divider as ViewStyle} />

      {/* Bottom Section */}
      <View style={styles.bottomSection as ViewStyle}>
        {/* Date and Time */}
        <View style={styles.dateTimeContainer as ViewStyle}>
          <Text style={styles.dateText as TextStyle}>{match.date}</Text>
          <Text style={styles.timeText as TextStyle}>{match.time}</Text>
        </View>

        {/* Status */}
        <View style={[styles.statusContainer, { backgroundColor: getStatusBackgroundColor(match.status) }] as unknown as ViewStyle}>
          <Text style={[styles.statusText, { color: getStatusTextColor(match.status), fontWeight: (match.status === 'completed' || match.status === 'ongoing') ? 'bold' as const : 'normal' as const }] as unknown as TextStyle}>
            {getStatusText(match.status)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default function MatchHistoryScreen() {
  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <View style={styles.container as ViewStyle}>
      {/* Orange Header */}
      <LinearGradient
        colors={[theme.colors.primary, '#FFA366']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient as ViewStyle}
      >
        <SafeAreaView edges={['top']} style={styles.safeHeader as ViewStyle}>
          <View style={styles.header as ViewStyle}>
            <Pressable
              style={styles.backButton as ViewStyle}
              onPress={handleBackPress}
              accessible={true}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.headerTitle as TextStyle}>Match History</Text>
            <View style={styles.headerSpacer as ViewStyle} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* White Background Content */}
      <ScrollView
        style={styles.scrollView as ViewStyle}
        contentContainerStyle={styles.scrollContent as ViewStyle}
        showsVerticalScrollIndicator={false}
      >
        {matches.length > 0 ? (
          matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))
        ) : (
          <View style={styles.noDataContainer as ViewStyle}>
            <Ionicons name="tennisball-outline" size={64} color="#E5E7EB" />
            <Text style={styles.noDataTitle as TextStyle}>No Match History</Text>
            <Text style={styles.noDataText as TextStyle}>
              You haven't played any matches yet.{'\n'}
              Start playing to see your match history here!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.gray[50], // Gray background like profile
  },
  headerGradient: {
    // Remove paddingBottom to fix visibility
  },
  safeHeader: {
    // Remove flex: 1 to fix header height
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.primary,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    backgroundColor: theme.colors.neutral.gray[50], // Gray background
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  matchCard: {
    backgroundColor: '#FFFFFF', // White containers
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.neutral.black,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.neutral.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  leagueNameContainer: {
    backgroundColor: '#feecdb',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.md,
    alignSelf: 'flex-start',
  },
  leagueName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.primary,
  },
  scoreboardContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  playerColumn: {
    flex: 2,
    justifyContent: 'flex-end',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    height: 32,
    marginBottom: theme.spacing.xs,
  },
  profileIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.neutral.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  setColumn: {
    flex: 0.8,
    alignItems: 'center',
  },
  playerName: {
    fontSize: theme.typography.fontSize.base, // Bigger font
    color: theme.colors.neutral.gray[700],
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: theme.typography.fontWeight.semibold as any,
  },
  setHeader: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.neutral.gray[500],
    fontFamily: theme.typography.fontFamily.primary,
    marginBottom: theme.spacing.xs,
    fontWeight: theme.typography.fontWeight.medium as any,
  },
  score: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.neutral.gray[700],
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: theme.typography.fontWeight.bold as any,
    height: 32,
    lineHeight: 32,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.neutral.gray[200],
    marginVertical: theme.spacing.md,
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTimeContainer: {
    flexDirection: 'column',
  },
  dateText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.neutral.gray[600],
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: theme.typography.fontWeight.medium as any,
  },
  timeText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.neutral.gray[500],
    fontFamily: theme.typography.fontFamily.primary,
    marginTop: 2,
  },
  statusContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold as any,
    fontFamily: theme.typography.fontFamily.primary,
    textTransform: 'uppercase',
  },
  scoreContainer: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  winnerText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold as any,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 3,
    paddingHorizontal: theme.spacing.xl,
  },
  noDataTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.neutral.gray[700],
    fontFamily: theme.typography.fontFamily.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  noDataText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.neutral.gray[600],
    fontFamily: theme.typography.fontFamily.primary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.relaxed,
  },
});