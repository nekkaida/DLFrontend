import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { 
  BottomSheetModal, 
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetHandle
} from '@gorhom/bottom-sheet';
import { theme } from '@core/theme/theme';
import type { MatchDetailsModalProps } from '../types';

// Default Profile Icon Component
const DefaultProfileIcon = () => (
  <View style={styles.profileIcon}>
    <Svg width="16" height="16" viewBox="0 0 24 24">
      <Path 
        fill="#FFFFFF" 
        fillRule="evenodd" 
        d="M8 7a4 4 0 1 1 8 0a4 4 0 0 1-8 0m0 6a5 5 0 0 0-5 5a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3a5 5 0 0 0-5-5z" 
        clipRule="evenodd" 
      />
    </Svg>
  </View>
);

export const MatchDetailsModal: React.FC<MatchDetailsModalProps> = ({ match, onClose }) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  // Define snap points for the bottom sheet
  const snapPoints = useMemo(() => ['60%', '85%'], []);

  // Handle sheet changes
  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  // Present modal when match is available
  useEffect(() => {
    if (match) {
      bottomSheetModalRef.current?.present();
    }
  }, [match]);

  // Backdrop component
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        onPress={onClose}
      />
    ),
    [onClose]
  );

  if (!match) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#34C759';
      case 'ongoing':
        return theme.colors.primary;
      case 'upcoming':
        return theme.colors.neutral.gray[500];
      default:
        return theme.colors.neutral.gray[500];
    }
  };

  const getStatusText = (status: string) => {
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
    <BottomSheetModal
      ref={bottomSheetModalRef}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      handleComponent={(props) => (
        <View style={styles.handleContainer}>
          <BottomSheetHandle {...props} />
        </View>
      )}
      backgroundStyle={styles.bottomSheetBackground}
      style={styles.bottomSheetContainer}
    >
      <BottomSheetView style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Match Details</Text>
        </View>
          
          <View style={styles.matchDetailsCard}>
              {/* League Name with Container */}
              <View style={styles.leagueNameContainer}>
                <Text style={styles.leagueName}>{match.league}</Text>
              </View>
              
              {/* Scoreboard */}
              <View style={styles.scoreboardContainer}>
                {/* Player Names Column with Profile Icons */}
                <View style={styles.playerColumn}>
                  <View style={styles.playerRow}>
                    <DefaultProfileIcon />
                    <Text style={styles.playerName}>{match.player1}</Text>
                  </View>
                  <View style={styles.playerRow}>
                    <DefaultProfileIcon />
                    <Text style={styles.playerName}>{match.player2}</Text>
                  </View>
                </View>
                
                {/* Set 1 */}
                <View style={styles.setColumn}>
                  <Text style={styles.setHeader}>Set 1</Text>
                  <Text style={styles.score}>
                    {match.scores.set1.player1 !== null ? match.scores.set1.player1 : '-'}
                  </Text>
                  <Text style={styles.score}>
                    {match.scores.set1.player2 !== null ? match.scores.set1.player2 : '-'}
                  </Text>
                </View>
                
                {/* Set 2 */}
                <View style={styles.setColumn}>
                  <Text style={styles.setHeader}>Set 2</Text>
                  <Text style={styles.score}>
                    {match.scores.set2.player1 !== null ? match.scores.set2.player1 : '-'}
                  </Text>
                  <Text style={styles.score}>
                    {match.scores.set2.player2 !== null ? match.scores.set2.player2 : '-'}
                  </Text>
                </View>
                
                {/* Set 3 */}
                <View style={styles.setColumn}>
                  <Text style={styles.setHeader}>Set 3</Text>
                  <Text style={styles.score}>
                    {match.scores.set3.player1 !== null ? match.scores.set3.player1 : '-'}
                  </Text>
                  <Text style={styles.score}>
                    {match.scores.set3.player2 !== null ? match.scores.set3.player2 : '-'}
                  </Text>
                </View>
              </View>
              
              {/* Divider */}
              <View style={styles.divider} />
              
              {/* Bottom Section */}
              <View style={styles.bottomSection}>
                {/* Date and Time */}
                <View style={styles.dateTimeContainer}>
                  <Text style={styles.dateText}>{match.date}</Text>
                  <Text style={styles.timeText}>{match.time}</Text>
                </View>
                
                {/* Status */}
                <View style={[styles.statusContainer, { backgroundColor: `${getStatusColor(match.status)}20` }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(match.status) }]}>
                    {getStatusText(match.status)}
                  </Text>
                </View>
              </View>
              
              {/* Rating Change Info */}
              <View style={styles.ratingChangeSection}>
                <Text style={styles.ratingChangeLabel}>Rating Change</Text>
                <Text style={[styles.ratingChangeValue, { color: match.ratingChange > 0 ? '#34C759' : '#FF3B30' }]}>
                  {match.ratingChange > 0 ? '+' : ''}{match.ratingChange} → {match.rating}
                </Text>
              </View>
            </View>
        </BottomSheetView>
      </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  bottomSheetContainer: {
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.neutral.black,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  bottomSheetBackground: {
    backgroundColor: theme.colors.neutral.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleContainer: {
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  modalHeader: {
    alignItems: 'center',
    paddingBottom: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.neutral.gray[700],
    fontFamily: theme.typography.fontFamily.primary,
  },
  matchDetailsCard: {
    backgroundColor: 'transparent',
    padding: 0,
  },
  leagueNameContainer: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 12,
    marginBottom: theme.spacing.md,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  leagueName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.neutral.gray[600],
    fontFamily: theme.typography.fontFamily.primary,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  scoreboardContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  playerColumn: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.neutral.gray[700],
    fontFamily: theme.typography.fontFamily.primary,
  },
  setColumn: {
    alignItems: 'center',
    gap: theme.spacing.xs,
    minWidth: 50,
  },
  setHeader: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.neutral.gray[600],
    fontFamily: theme.typography.fontFamily.primary,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
  },
  score: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.neutral.gray[700],
    fontFamily: theme.typography.fontFamily.primary,
    textAlign: 'center',
    minHeight: 20,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.neutral.white,
    borderRadius: 6,
    minWidth: 36,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    marginBottom: theme.spacing.md,
    backgroundColor: '#f8fafc',
    padding: theme.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateTimeContainer: {
    gap: theme.spacing.xs,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.neutral.gray[700],
    fontFamily: theme.typography.fontFamily.primary,
  },
  timeText: {
    fontSize: 12,
    color: theme.colors.neutral.gray[500],
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: '400',
  },
  statusContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: theme.typography.fontFamily.primary,
    textTransform: 'uppercase',
  },
  ratingChangeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: theme.spacing.md,
  },
  ratingChangeLabel: {
    fontSize: 14,
    color: theme.colors.neutral.gray[600],
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: '500',
  },
  ratingChangeValue: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: theme.typography.fontFamily.primary,
  },
  profileIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.neutral.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
});