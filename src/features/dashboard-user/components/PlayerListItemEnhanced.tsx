import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSportColors, SportType } from '@/constants/SportsColor';
import { getSinglesDMR, getDoublesDMR, SkillRatings } from '@/src/utils/dmrCalculator';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isTablet = width > 768;

interface PlayerListItemEnhancedProps {
  player: {
    id: string;
    name: string;
    image?: string;
    divisionName?: string;
    status?: string;
    skillRatings?: SkillRatings | null;
  };
  sport: 'pickleball' | 'tennis' | 'padel';
  onPress: (playerId: string) => void;
}

export const PlayerListItemEnhanced: React.FC<PlayerListItemEnhancedProps> = ({
  player,
  sport,
  onPress,
}) => {
  const sportColors = getSportColors(sport.toUpperCase() as SportType);

  // Get DMR ratings for the specific sport
  const singlesDMR = getSinglesDMR(player.skillRatings, sport);
  const doublesDMR = getDoublesDMR(player.skillRatings, sport);

  const hasDMR = singlesDMR !== 'N/A' || doublesDMR !== 'N/A';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(player.id)}
      activeOpacity={0.7}
    >
      {player.image ? (
        <Image source={{ uri: player.image }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.defaultAvatarContainer, { backgroundColor: sportColors.background }]}>
          <Text style={styles.defaultAvatarText}>
            {player.name?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{player.name || 'Unknown Player'}</Text>
        {hasDMR && (
          <View style={styles.dmrContainer}>
            {singlesDMR !== 'N/A' && (
              <View style={styles.dmrItem}>
                <Text style={styles.dmrLabel}>Singles: </Text>
                <Text style={[styles.dmrValue, { color: sportColors.background }]}>{singlesDMR}</Text>
              </View>
            )}
            {singlesDMR !== 'N/A' && doublesDMR !== 'N/A' && (
              <View style={styles.dmrSeparator} />
            )}
            {doublesDMR !== 'N/A' && (
              <View style={styles.dmrItem}>
                <Text style={styles.dmrLabel}>Doubles: </Text>
                <Text style={[styles.dmrValue, { color: sportColors.background }]}>{doublesDMR}</Text>
              </View>
            )}
          </View>
        )}
        {player.divisionName && (
          <Text style={styles.division}>{player.divisionName}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#BABABA" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: isSmallScreen ? 12 : isTablet ? 16 : 14,
    paddingHorizontal: isSmallScreen ? 16 : isTablet ? 24 : 20,
    backgroundColor: '#FFFFFF',
  },
  avatar: {
    width: isSmallScreen ? 48 : isTablet ? 64 : 56,
    height: isSmallScreen ? 48 : isTablet ? 64 : 56,
    borderRadius: isSmallScreen ? 24 : isTablet ? 32 : 28,
  },
  defaultAvatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    color: '#FFFFFF',
    fontSize: isSmallScreen ? 18 : isTablet ? 24 : 20,
    fontWeight: '700',
    fontFamily: 'System',
  },
  content: {
    flex: 1,
    marginLeft: isSmallScreen ? 12 : isTablet ? 16 : 14,
    justifyContent: 'center',
  },
  name: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: isSmallScreen ? 15 : isTablet ? 19 : 17,
    letterSpacing: -0.3,
    color: '#1a1a1a',
  },
  dmrContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dmrItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dmrLabel: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: isSmallScreen ? 12 : isTablet ? 14 : 13,
    color: '#6B7280',
  },
  dmrValue: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: isSmallScreen ? 12 : isTablet ? 14 : 13,
  },
  dmrSeparator: {
    width: 1,
    height: 12,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 10,
  },
  division: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: isSmallScreen ? 12 : isTablet ? 14 : 13,
    color: '#6B7280',
    marginTop: 4,
  },
});
