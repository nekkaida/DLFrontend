import { getBackendBaseURL } from '@/config/network';
import { useSession } from '@/lib/auth-client';
import axiosInstance, { endpoints } from '@/lib/endpoints';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

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

interface ScreenshotAsset {
  uri: string;
  fileName?: string;
  type?: string;
}

const MAX_SCREENSHOTS = 3;

export default function DisputeScorePage() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { data: session } = useSession();

  // Parse params
  const matchId = params.matchId as string;
  const matchType = (params.matchType as string) || 'SINGLES';
  const sportType = params.sportType as string;
  const players: Player[] = params.players ? JSON.parse(params.players as string) : [];
  const submittedScore = params.submittedScore ? JSON.parse(params.submittedScore as string) : null;

  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DisputeCategory | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [screenshots, setScreenshots] = useState<ScreenshotAsset[]>([]);
  const [correctTeam1Score, setCorrectTeam1Score] = useState('');
  const [correctTeam2Score, setCorrectTeam2Score] = useState('');

  // Separate players by team
  const teamAPlayers = players.filter(p => p.team === 'TEAM_A');
  const teamBPlayers = players.filter(p => p.team === 'TEAM_B');
  const displayTeamA = teamAPlayers.length > 0 ? teamAPlayers : players.slice(0, matchType === 'SINGLES' ? 1 : 2);
  const displayTeamB = teamBPlayers.length > 0 ? teamBPlayers : players.slice(matchType === 'SINGLES' ? 1 : 2);

  const handlePickScreenshot = async () => {
    if (screenshots.length >= MAX_SCREENSHOTS) {
      Alert.alert('Maximum Reached', `You can only add up to ${MAX_SCREENSHOTS} screenshots.`);
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Permission to access photo library is required to add screenshots.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setScreenshots(prev => [...prev, {
        uri: asset.uri,
        fileName: asset.fileName || `screenshot_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      }]);
    }
  };

  const handleRemoveScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  const uploadScreenshots = async (): Promise<string[]> => {
    if (screenshots.length === 0) return [];

    const uploadedUrls: string[] = [];
    const backendUrl = getBackendBaseURL();

    for (const screenshot of screenshots) {
      try {
        const formData = new FormData();
        formData.append('file', {
          uri: screenshot.uri,
          name: screenshot.fileName || 'screenshot.jpg',
          type: screenshot.type || 'image/jpeg',
        } as any);
        formData.append('folder', 'disputes');

        const response = await fetch(`${backendUrl}/api/upload/image`, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
            'x-user-id': session?.user?.id || '',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.url) {
            uploadedUrls.push(data.url);
          }
        }
      } catch (error) {
        console.error('Error uploading screenshot:', error);
      }
    }

    return uploadedUrls;
  };

  const handleSubmitDispute = async () => {
    if (!selectedCategory) {
      Alert.alert('Select Category', 'Please select a dispute category');
      return;
    }
    if (!disputeReason.trim() || disputeReason.trim().length < 20) {
      Alert.alert('More Details Needed', 'Please provide at least 20 characters explaining the issue');
      return;
    }

    try {
      setLoading(true);

      // Upload screenshots if any
      let evidenceUrls: string[] = [];
      if (screenshots.length > 0) {
        evidenceUrls = await uploadScreenshots();
      }

      const disputeData: {
        disputeReason: string;
        disputeCategory: DisputeCategory;
        disputerScore?: { team1Score: number; team2Score: number };
        evidenceUrl?: string;
      } = {
        disputeReason: disputeReason.trim(),
        disputeCategory: selectedCategory,
      };

      if (selectedCategory === 'WRONG_SCORE' && correctTeam1Score && correctTeam2Score) {
        disputeData.disputerScore = {
          team1Score: parseInt(correctTeam1Score) || 0,
          team2Score: parseInt(correctTeam2Score) || 0,
        };
      }

      // Join multiple URLs with comma or use single URL
      if (evidenceUrls.length > 0) {
        disputeData.evidenceUrl = evidenceUrls.join(',');
      }

      // Submit dispute via API
      await axiosInstance.post(
        endpoints.match.confirmResult(matchId),
        {
          confirmed: false,
          disputeReason: disputeData.disputeReason,
          disputeCategory: disputeData.disputeCategory,
          disputerScore: disputeData.disputerScore,
          evidenceUrl: disputeData.evidenceUrl
        }
      );

      toast.success('Dispute submitted. An admin will review your case.');
      // Go back twice to return to match list (skipping the match-details)
      router.back();
      router.back();
    } catch (error: any) {
      console.error('Error submitting dispute:', error);
      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.message ||
                          error.message ||
                          'Failed to submit dispute';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerIcon}>
            <Ionicons name="alert-circle" size={22} color="#DC2626" />
          </View>
          <Text style={styles.headerTitle}>Dispute Score</Text>
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Category Selection - Horizontal scroll */}
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
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
                <TextInput
                  style={styles.scoreInput}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  value={correctTeam1Score}
                  onChangeText={setCorrectTeam1Score}
                  maxLength={1}
                />
                <Text style={styles.scoreDash}>-</Text>
                <TextInput
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
            <TextInput
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

          {/* Screenshots Section */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>
              Screenshots <Text style={styles.optionalText}>(optional, max {MAX_SCREENSHOTS})</Text>
            </Text>
            <View style={styles.screenshotsContainer}>
              {screenshots.map((screenshot, index) => (
                <View key={index} style={styles.screenshotWrapper}>
                  <Image source={{ uri: screenshot.uri }} style={styles.screenshotImage} />
                  <TouchableOpacity
                    style={styles.removeScreenshotButton}
                    onPress={() => handleRemoveScreenshot(index)}
                  >
                    <Ionicons name="close-circle" size={22} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ))}
              {screenshots.length < MAX_SCREENSHOTS && (
                <TouchableOpacity style={styles.addScreenshotButton} onPress={handlePickScreenshot}>
                  <Ionicons name="camera-outline" size={28} color="#6B7280" />
                  <Text style={styles.addScreenshotText}>Add</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.screenshotHint}>
              Add screenshots of scorecards or evidence to support your dispute
            </Text>
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
            <TouchableOpacity style={styles.cancelButton} onPress={handleGoBack} disabled={loading}>
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
                  <Text style={styles.submitButtonText}>Submit Dispute</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
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
  headerPlaceholder: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
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
  optionalText: {
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
  screenshotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  screenshotWrapper: {
    position: 'relative',
  },
  screenshotImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  removeScreenshotButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 11,
  },
  addScreenshotButton: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addScreenshotText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 4,
  },
  screenshotHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
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
