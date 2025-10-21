import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '@core/theme/theme';
import { InlineDropdown } from './InlineDropdown';
import { WinRateCircle } from './WinRateCircle';

interface ProfileLeagueStatsCardProps {
  activeTab: string;
  selectedGameType: string;
  gameTypeOptions: string[];
  onGameTypeSelect: (value: string) => void;
  winRate: number;
}

export const ProfileLeagueStatsCard: React.FC<ProfileLeagueStatsCardProps> = ({
  activeTab,
  selectedGameType,
  gameTypeOptions,
  onGameTypeSelect,
  winRate,
}) => {
  return (
    <View style={styles.skillLevelSection}>
      <View style={styles.leagueStatsContainer}>
        <View style={styles.statsHeader}>
          <Text style={styles.skillLabel}>League Stats - {activeTab}</Text>
          <InlineDropdown
            options={gameTypeOptions}
            selectedValue={selectedGameType}
            onSelect={(value) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onGameTypeSelect(value);
            }}
          />
        </View>

        {/* Win Rate Circle Chart */}
        <View style={styles.winRateContainer}>
          <WinRateCircle winRate={winRate} />
          <View style={styles.winRateLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#34C759' }]} />
              <Text style={styles.legendText}>Wins</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#FF3B30' }]} />
              <Text style={styles.legendText}>Losses</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skillLevelSection: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  leagueStatsContainer: {
    backgroundColor: '#ffffff',
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: theme.colors.neutral.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
  },
  skillLabel: {
    color: '#111827',
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: '600' as any,
  },
  winRateContainer: {
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  winRateLegend: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.neutral.gray[700],
    fontFamily: theme.typography.fontFamily.primary,
  },
});
