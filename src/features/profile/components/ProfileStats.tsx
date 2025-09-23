import React from 'react';
import { View, Text } from 'react-native';
import { InlineDropdown, WinRateCircle } from './index';
import * as Haptics from 'expo-haptics';

interface ProfileStatsProps {
  styles: any; // Preserving exact styles from parent
  gameTypeOptions: string[];
  selectedGameType: string;
  onGameTypeSelect: (value: string) => void;
  calculateWinRate: () => number;
}

/**
 * ProfileStats - League stats section with win rate chart
 *
 * CRITICAL: This component preserves exact styling from profile.tsx
 */
export const ProfileStats: React.FC<ProfileStatsProps> = ({
  styles,
  gameTypeOptions,
  selectedGameType,
  onGameTypeSelect,
  calculateWinRate,
}) => {
  return (
    <View style={styles.skillLevelSection}>
      <View style={styles.leagueStatsContainer}>
        <View style={styles.statsHeader}>
          <Text style={styles.skillLabel}>League Stats</Text>
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
          <WinRateCircle winRate={calculateWinRate()} />
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