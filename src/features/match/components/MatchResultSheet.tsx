import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Player {
  id: string;
  name: string;
  image?: string;
  team?: 'TEAM_A' | 'TEAM_B';
}

interface SetScore {
  teamAScore: number;
  teamBScore: number;
}

interface MatchResultSheetProps {
  matchId: string;
  matchType: 'SINGLES' | 'DOUBLES';
  players: Player[];
  onClose: () => void;
  onSubmit: (data: { setScores: SetScore[] }) => Promise<void>;
}

export const MatchResultSheet: React.FC<MatchResultSheetProps> = ({
  matchId,
  matchType,
  players,
  onClose,
  onSubmit,
}) => {
  const [loading, setLoading] = useState(false);
  const [numberOfSets, setNumberOfSets] = useState(3); // Best of 3 by default
  const [setScores, setSetScores] = useState<SetScore[]>([
    { teamAScore: 0, teamBScore: 0 },
    { teamAScore: 0, teamBScore: 0 },
    { teamAScore: 0, teamBScore: 0 },
  ]);
  const [didNotPlay, setDidNotPlay] = useState(false);
  const [incomplete, setIncomplete] = useState(false);

  // Separate players by team
  const teamAPlayers = players.filter(p => p.team === 'TEAM_A');
  const teamBPlayers = players.filter(p => p.team === 'TEAM_B');

  const updateScore = (setIndex: number, team: 'A' | 'B', value: string) => {
    const numValue = parseInt(value) || 0;
    const newScores = [...setScores];
    if (team === 'A') {
      newScores[setIndex].teamAScore = numValue;
    } else {
      newScores[setIndex].teamBScore = numValue;
    }
    setSetScores(newScores);
  };

  const handleSubmit = async () => {
    // Validate scores
    const playedSets = setScores.filter(
      (set) => set.teamAScore > 0 || set.teamBScore > 0
    );

    if (!didNotPlay && playedSets.length === 0) {
      Alert.alert('Invalid Scores', 'Please enter at least one set score');
      return;
    }

    try {
      setLoading(true);
      await onSubmit({ setScores: playedSets });
      onClose();
    } catch (error) {
      console.error('Error submitting result:', error);
      Alert.alert('Error', 'Failed to submit match result');
    } finally {
      setLoading(false);
    }
  };

  const renderPlayerAvatar = (player: Player) => (
    <View style={styles.playerContainer} key={player.id}>
      <View style={styles.avatar}>
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
      <Text style={styles.playerName} numberOfLines={1}>
        {player.name.split(' ')[0]}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>How did the match go?</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Quick Options Row */}
        <View style={styles.quickRow}>
          <Text style={styles.quickLeftText}>Didn't play</Text>
          <View style={styles.quickRight}>
            <Text style={styles.quickRightText}>Match incomplete</Text>
            <Switch
              value={incomplete}
              onValueChange={setIncomplete}
              trackColor={{ false: '#E5E7EB', true: '#FCD34D' }}
              thumbColor={incomplete ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Sets Header */}
        <View style={styles.setsHeaderRow}>
          <View style={styles.setsHeaderLabel}>
            <Text style={styles.setsHeaderLabelTop}>SET</Text>
          </View>
          <View style={styles.setsHeaderNumbers}>
            {[1,2,3].map(n => (
              <View key={n} style={styles.setNumberHeaderBox}>
                <Text style={styles.setNumberHeaderText}>{n}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Team Rows with 3 inputs each */}
        <View style={styles.teamRow}>
          <View style={styles.playersColumn}>
            {teamAPlayers.map(renderPlayerAvatar)}
          </View>
          <View style={styles.inputsGrid}>
            {[0,1,2].map((idx) => (
              <View key={`A-${idx}`} style={styles.scoreInputWrapperSquare}>
                <TextInput
                  style={styles.scoreInputSquare}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={setScores[idx]?.teamAScore ? String(setScores[idx].teamAScore) : ''}
                  onChangeText={(value) => updateScore(idx, 'A', value)}
                  placeholder=""
                  placeholderTextColor="#D1D5DB"
                />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.teamRow}>
          <View style={styles.playersColumn}>
            {teamBPlayers.map(renderPlayerAvatar)}
          </View>
          <View style={styles.inputsGrid}>
            {[0,1,2].map((idx) => (
              <View key={`B-${idx}`} style={styles.scoreInputWrapperSquare}>
                <TextInput
                  style={styles.scoreInputSquare}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={setScores[idx]?.teamBScore ? String(setScores[idx].teamBScore) : ''}
                  onChangeText={(value) => updateScore(idx, 'B', value)}
                  placeholder=""
                  placeholderTextColor="#D1D5DB"
                />
              </View>
            ))}
          </View>
        </View>

        {/* Game Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Game Summary</Text>
          <TextInput
            style={styles.summaryInput}
            multiline
            numberOfLines={3}
            placeholder="e.g. A great game with Darius, with plenty of good rallies and cool shots. I really just lost a lot more in the final set."
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Warning Message */}
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            Only team captains need to submit the scores.
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Confirm Result</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  quickRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickLeftText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  quickRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickRightText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  setsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  setsHeaderLabel: {
    width: 70,
    alignItems: 'center',
  },
  setsHeaderLabelTop: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  setsHeaderNumbers: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
    justifyContent: 'flex-start',
  },
  setNumberHeaderBox: {
    width: 56,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumberHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  playersColumn: {
    width: 70,
    alignItems: 'center',
  },
  playersRow: {
    flexDirection: 'column',
    gap: 8,
  },
  playerContainer: {
    alignItems: 'center',
    width: 56,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: 4,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  playerName: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  inputsGrid: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  scoreInputWrapperSquare: {
    width: 56,
    height: 56,
  },
  scoreInputSquare: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  vsDivider: {
    paddingHorizontal: 12,
  },
  vsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  summarySection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  summaryInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  warningContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
  },
  warningText: {
    fontSize: 13,
    color: '#92400E',
    textAlign: 'center',
  },
  submitButton: {
    marginHorizontal: 20,
    marginBottom: 32,
    backgroundColor: '#F59E0B',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
