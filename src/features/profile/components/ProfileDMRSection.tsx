import React from 'react';
import { View, Text } from 'react-native';
import { InlineDropdown, EloProgressGraph } from '../components';
import type { ProfileDMRProps } from '../types/ProfileTypes';

/**
 * ProfileDMRSection - Safe wrapper component for DMR section
 *
 * CRITICAL: This component preserves the exact styling and behavior from
 * the original profile.tsx implementation. Styles are passed in from parent
 * to maintain the complex positioning calculations.
 */
interface Props extends ProfileDMRProps {
  styles: any; // Exact styles from parent component
}

export const ProfileDMRSection: React.FC<Props> = ({
  userData,
  activeTab,
  gameTypeOptions,
  selectedGameType,
  onGameTypeSelect,
  getRatingForType,
  mockEloData,
  onGamePointPress,
  styles
}) => {
  return (
    <View style={styles.skillLevelSection}>
      <View style={styles.dmrContainer}>
        {/* DMR Label and Ratings */}
        <View style={styles.dmrHeader}>
          <Text style={styles.skillLabel}>DMR</Text>
          <View style={styles.dmrRatingsRow}>
            <View style={styles.dmrItemVertical}>
              <Text style={styles.dmrTypeLabel}>Singles</Text>
              <View style={styles.ratingCircleSmall}>
                <Text style={styles.ratingTextSmall}>
                  {getRatingForType(activeTab || userData.sports?.[0] || 'pickleball', 'Singles') || 'N/A'}
                </Text>
              </View>
            </View>
            <View style={styles.dmrItemVertical}>
              <Text style={styles.dmrTypeLabel}>Doubles</Text>
              <View style={styles.ratingCircleSmall}>
                <Text style={styles.ratingTextSmall}>
                  {getRatingForType(activeTab || userData.sports?.[0] || 'pickleball', 'Doubles') || 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Dropdown above graph */}
        <View style={styles.dropdownSection}>
          <InlineDropdown
            options={gameTypeOptions}
            selectedValue={selectedGameType}
            onSelect={onGameTypeSelect}
          />
        </View>

        {/* ELO Progress Graph */}
        <EloProgressGraph
          data={mockEloData}
          onPointPress={onGamePointPress}
        />
      </View>
    </View>
  );
};