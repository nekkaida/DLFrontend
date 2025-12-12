import { Ionicons } from '@expo/vector-icons';
import { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Dispute category options matching backend enum
const DISPUTE_CATEGORIES = [
  { value: 'WRONG_SCORE', label: 'Wrong Score', icon: 'calculator-outline' as const },
  { value: 'NO_SHOW', label: 'No Show', icon: 'person-remove-outline' as const },
  { value: 'BEHAVIOR', label: 'Behavior', icon: 'warning-outline' as const },
  { value: 'OTHER', label: 'Other', icon: 'help-circle-outline' as const },
] as const;

type DisputeCategory = typeof DISPUTE_CATEGORIES[number]['value'];

interface Player {
  id: string;
  name: string;
  image?: string;
  team?: 'TEAM_A' | 'TEAM_B';
}

interface DisputeScoreSheetProps {
  matchId: string;
  matchType: 'SINGLES' | 'DOUBLES';
  players: Player[];
  sportType: string;
  submittedScore?: {
    team1Score: number;
    team2Score: number;
  };
  onClose: () => void;
  onDispute: (data: {
    disputeReason: string;
    disputeCategory: DisputeCategory;
    disputerScore?: { team1Score: number; team2Score: number };
    evidenceUrl?: string;
  }) => Promise<void>;
}

export const DisputeScoreSheet: React.FC<DisputeScoreSheetProps> = ({
  matchId,
  matchType,
  players,
  sportType,
  submittedScore,
  onClose,
  onDispute,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DisputeCategory | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [correctTeam1Score, setCorrectTeam1Score] = useState('');
  const [correctTeam2Score, setCorrectTeam2Score] = useState('');

  // Separate players by team
  const teamAPlayers = players.filter(p => p.team === 'TEAM_A');
  const teamBPlayers = players.filter(p => p.team === 'TEAM_B');
  const displayTeamA = teamAPlayers.length > 0 ? teamAPlayers : players.slice(0, matchType === 'SINGLES' ? 1 : 2);
  const displayTeamB = teamBPlayers.length > 0 ? teamBPlayers : players.slice(matchType === 'SINGLES' ? 1 : 2);

  const handleSubmitDispute = async () => {
    if (!selectedCategory) {
      Alert.alert('Select Category', 'Please select a dispute category');
      return;
    }
    if (!disputeReason.trim() || disputeReason.trim().length < 20) {
      Alert.alert('More Details Needed', 'Please provide at least 20 characters explaining the issue');
      return;
    }

    const disputeData: Parameters<typeof onDispute>[0] = {
      disputeReason: disputeReason.trim(),
      disputeCategory: selectedCategory,
    };

    if (selectedCategory === 'WRONG_SCORE' && correctTeam1Score && correctTeam2Score) {
      disputeData.disputerScore = {
        team1Score: parseInt(correctTeam1Score) || 0,
        team2Score: parseInt(correctTeam2Score) || 0,
      };
    }

    if (evidenceUrl.trim()) {
      disputeData.evidenceUrl = evidenceUrl.trim();
    }

    try {
      setLoading(true);
      await onDispute(disputeData);
    } catch (error) {
      console.error('Error submitting dispute:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPlayerAvatar = (player: Player, size: number = 28) => (
    <View key={player.id} style={[styles.playerAvatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {player.image ? (
        <Image source={{ uri: player.image }} style={styles.playerImage} />
      ) : (
        <View style={[styles.playerPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={styles.playerInitial}>{player.name?.charAt(0) || '?'}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Ionicons name="alert-circle" size={22} color="#DC2626" />
          </View>
          <Text style={styles.headerTitle}>Dispute Score</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Category Selection - Horizontal scroll (doesn't block vertical) */}
      <View style={styles.categorySection}>
        <Text style={styles.categoryLabel}>Select issue type:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {DISPUTE_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[
                styles.categoryChip,
                selectedCategory === cat.value && styles.categoryChipSelected,
              ]}
              onPress={() => setSelectedCategory(cat.value)}
            >
              <Ionicons
                name={cat.icon}
                size={18}
                color={selectedCategory === cat.value ? '#FFFFFF' : '#6B7280'}
              />
              <Text style={[
                styles.categoryChipText,
                selectedCategory === cat.value && styles.categoryChipTextSelected,
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Content - Scrollable */}
      <BottomSheetScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Submitted Score Display */}
        {submittedScore && (
          <View style={styles.scoreSection}>
            <Text style={styles.scoreSectionLabel}>Submitted Score</Text>
            <View style={styles.scoreDisplay}>
              <View style={styles.teamAvatars}>
                {displayTeamA.map(p => renderPlayerAvatar(p))}
              </View>
              <Text style={styles.scoreText}>{submittedScore.team1Score}</Text>
              <Text style={styles.vsText}>-</Text>
              <Text style={styles.scoreText}>{submittedScore.team2Score}</Text>
              <View style={styles.teamAvatars}>
                {displayTeamB.map(p => renderPlayerAvatar(p))}
              </View>
            </View>
          </View>
        )}

        {/* Corrected Score (only for WRONG_SCORE) */}
        {selectedCategory === 'WRONG_SCORE' && (
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Correct score:</Text>
            <View style={styles.scoreInputRow}>
              <BottomSheetTextInput
                style={styles.scoreInput}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                value={correctTeam1Score}
                onChangeText={setCorrectTeam1Score}
                maxLength={1}
              />
              <Text style={styles.scoreDash}>-</Text>
              <BottomSheetTextInput
                style={styles.scoreInput}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                value={correctTeam2Score}
                onChangeText={setCorrectTeam2Score}
                maxLength={1}
              />
            </View>
          </View>
        )}

        {/* Explanation */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>
            Explain the issue <Text style={styles.requiredText}>(min 20 chars)</Text>
          </Text>
          <BottomSheetTextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder="Describe what happened..."
            placeholderTextColor="#9CA3AF"
            value={disputeReason}
            onChangeText={setDisputeReason}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, disputeReason.length >= 20 && styles.charCountOk]}>
            {disputeReason.length}/20
          </Text>
        </View>

        {/* Evidence URL */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Evidence URL (optional)</Text>
          <BottomSheetTextInput
            style={styles.urlInput}
            placeholder="https://..."
            placeholderTextColor="#9CA3AF"
            value={evidenceUrl}
            onChangeText={setEvidenceUrl}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={18} color="#0369A1" />
          <Text style={styles.infoText}>
            Disputes are reviewed by admins. False claims may result in penalties.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={loading}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedCategory || disputeReason.length < 20 || loading) && styles.buttonDisabled,
            ]}
            onPress={handleSubmitDispute}
            disabled={!selectedCategory || disputeReason.length < 20 || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="flag" size={18} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Submit</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </BottomSheetScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  categorySection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 10,
  },
  categoryScroll: {
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  categoryChipSelected: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  scoreSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  scoreSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  teamAvatars: {
    flexDirection: 'row',
  },
  scoreText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  vsText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  requiredText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  scoreInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  scoreInput: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111827',
  },
  scoreDash: {
    fontSize: 24,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    fontSize: 15,
    color: '#111827',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#F59E0B',
    textAlign: 'right',
    marginTop: 4,
  },
  charCountOk: {
    color: '#10B981',
  },
  urlInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    fontSize: 15,
    color: '#111827',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#0369A1',
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  submitButton: {
    flex: 1.5,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  bottomSpacer: {
    height: 40,
  },
  playerAvatar: {
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  playerImage: {
    width: '100%',
    height: '100%',
  },
  playerPlaceholder: {
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerInitial: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
});
