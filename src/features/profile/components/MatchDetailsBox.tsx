import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { theme } from '@core/theme/theme';

interface MatchDetailsBoxProps {
  match: any | null;
  profileData: any;
}

export const MatchDetailsBox: React.FC<MatchDetailsBoxProps> = ({ match, profileData }) => {
  if (!match) {
    return (
      <View style={styles.matchDetailsBox}>
        <View style={styles.emptyMatchDetails}>
          <Text style={styles.emptyMatchDetailsText}>Click a point on the graph to view match details</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.matchDetailsBox}>
      <View style={styles.matchDetailsContent}>
        {/* Top Row: Date (left) and Rating Change (right) */}
        <View style={styles.matchTopRow}>
          <Text style={styles.matchDateText}>{match.date}</Text>
          <View style={styles.matchRatingChangeContainer}>
            <Text style={[styles.matchRatingChangeText, { color: match.ratingChange > 0 ? '#34C759' : '#FF3B30' }]}>
              {match.ratingChange > 0 ? '+' : ''}{match.ratingChange} pts
            </Text>
            {match.ratingChange > 0 && (
              <Text style={styles.matchRatingChangeArrow}>↗</Text>
            )}
          </View>
        </View>

        {/* Players and Sets */}
        <View style={styles.matchPlayersContainer}>
          {/* Player Names Column with Profile Icons */}
          <View style={styles.matchPlayerColumn}>
            <View style={styles.matchPlayerRow}>
              {profileData?.image ? (
                <Image
                  source={{ uri: profileData.image }}
                  style={styles.matchProfileImage}
                  onError={() => console.log('Profile image failed to load')}
                />
              ) : (
                <View style={styles.matchDefaultProfileIcon}>
                  <Text style={styles.matchProfileIconText}>{match.player1?.charAt(0) || 'Y'}</Text>
                </View>
              )}
              <Text style={styles.matchPlayerName}>{match.player1 || 'You'}</Text>
            </View>
            <View style={styles.matchPlayerRow}>
              <View style={styles.matchDefaultProfileIcon}>
                <Text style={styles.matchProfileIconText}>{match.player2?.charAt(0) || 'O'}</Text>
              </View>
              <Text style={styles.matchPlayerName}>{match.player2 || 'Opponent'}</Text>
            </View>
          </View>

          {/* Set 1 */}
          <View style={styles.matchSetColumn}>
            <Text style={styles.matchSetHeader}>Set 1</Text>
            <Text style={styles.matchScore}>
              {match.scores?.set1?.player1 !== null ? match.scores.set1.player1 : '-'}
            </Text>
            <Text style={styles.matchScore}>
              {match.scores?.set1?.player2 !== null ? match.scores.set1.player2 : '-'}
            </Text>
          </View>

          {/* Set 2 */}
          <View style={styles.matchSetColumn}>
            <Text style={styles.matchSetHeader}>Set 2</Text>
            <Text style={styles.matchScore}>
              {match.scores?.set2?.player1 !== null ? match.scores.set2.player1 : '-'}
            </Text>
            <Text style={styles.matchScore}>
              {match.scores?.set2?.player2 !== null ? match.scores.set2.player2 : '-'}
            </Text>
          </View>

          {/* Set 3 */}
          <View style={styles.matchSetColumn}>
            <Text style={styles.matchSetHeader}>Set 3</Text>
            <Text style={styles.matchScore}>
              {match.scores?.set3?.player1 !== null ? match.scores.set3.player1 : '-'}
            </Text>
            <Text style={styles.matchScore}>
              {match.scores?.set3?.player2 !== null ? match.scores.set3.player2 : '-'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  matchDetailsBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyMatchDetails: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  emptyMatchDetailsText: {
    color: theme.colors.neutral.gray[500],
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.primary,
  },
  matchDetailsContent: {
    gap: theme.spacing.md,
  },
  matchTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  matchDateText: {
    color: '#6b7280',
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: '500' as any,
  },
  matchRatingChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchRatingChangeText: {
    fontSize: 14,
    fontWeight: '600' as any,
    fontFamily: theme.typography.fontFamily.primary,
  },
  matchRatingChangeArrow: {
    fontSize: 16,
    color: '#34C759',
  },
  matchPlayersContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  matchPlayerColumn: {
    flex: 2,
    gap: theme.spacing.sm,
  },
  matchPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  matchProfileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  matchDefaultProfileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchProfileIconText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600' as any,
    fontFamily: theme.typography.fontFamily.primary,
  },
  matchPlayerName: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '500' as any,
    fontFamily: theme.typography.fontFamily.primary,
    flex: 1,
  },
  matchSetColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  matchSetHeader: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '600' as any,
    fontFamily: theme.typography.fontFamily.primary,
    marginBottom: 2,
  },
  matchScore: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600' as any,
    fontFamily: theme.typography.fontFamily.primary,
  },
});
