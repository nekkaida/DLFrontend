import { getBackendBaseURL } from '@/config/network';
import { useSession } from '@/lib/auth-client';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface Player {
  id: string;
  name: string;
  image?: string;
  team?: 'TEAM_A' | 'TEAM_B';
}

interface SetScore {
  setNumber: number;
  team1Games: number;
  team2Games: number;
  team1Tiebreak?: number;
  team2Tiebreak?: number;
}

interface Partnership {
  id: string;
  captainId: string;
  partnerId: string;
  captain: { id: string; name: string; image?: string };
  partner: { id: string; name: string; image?: string };
}

interface MatchResultSheetProps {
  matchId: string;
  matchType: 'SINGLES' | 'DOUBLES';
  players: Player[];
  sportType: string; // 'TENNIS', 'PADEL', 'PICKLEBALL'
  seasonId?: string;
  mode?: 'submit' | 'view' | 'review'; // submit: add result, view: read-only, review: approve/dispute
  onClose: () => void;
  onSubmit: (data: { setScores: SetScore[]; comment?: string }) => Promise<void>;
  onConfirm?: () => Promise<void>;
  onDispute?: () => Promise<void>;
}

export const MatchResultSheet: React.FC<MatchResultSheetProps> = ({
  matchId,
  matchType,
  players,
  sportType,
  seasonId,
  mode = 'submit',
  onClose,
  onSubmit,
  onConfirm,
  onDispute,
}) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [partnershipLoading, setPartnershipLoading] = useState(true);
  const [partnership, setPartnership] = useState<Partnership | null>(null);
  const [isCaptain, setIsCaptain] = useState(false);
  const [comment, setComment] = useState('');
  const [matchDetails, setMatchDetails] = useState<any>(null);
  
  const [setScores, setSetScores] = useState<SetScore[]>([
    { setNumber: 1, team1Games: 0, team2Games: 0 },
    { setNumber: 2, team1Games: 0, team2Games: 0 },
    { setNumber: 3, team1Games: 0, team2Games: 0 },
  ]);

  // Separate players by team
  const teamAPlayers = players.filter(p => p.team === 'TEAM_A');
  const teamBPlayers = players.filter(p => p.team === 'TEAM_B');

  // Debug log removed to prevent spam

  const isTennisOrPadel = sportType === 'TENNIS' || sportType === 'PADEL';

  // Fetch match details if in view/review mode
  useEffect(() => {
    const fetchMatchDetails = async () => {
      if (mode === 'view' || mode === 'review') {
        try {
          const backendUrl = getBackendBaseURL();
          const response = await fetch(`${backendUrl}/api/match/${matchId}`, {
            headers: {
              'x-user-id': session?.user?.id || '',
            },
          });

          if (response.ok) {
            const data = await response.json();
            const match = data.match || data;
            setMatchDetails(match);

            // Parse existing scores
            if (match.setScores) {
              try {
                const parsedScores = JSON.parse(match.setScores);
                if (Array.isArray(parsedScores)) {
                  setSetScores([
                    parsedScores[0] || { setNumber: 1, team1Games: 0, team2Games: 0 },
                    parsedScores[1] || { setNumber: 2, team1Games: 0, team2Games: 0 },
                    parsedScores[2] || { setNumber: 3, team1Games: 0, team2Games: 0 },
                  ]);
                }
              } catch (e) {
                console.error('Error parsing set scores:', e);
              }
            }

            // Set comment if exists
            if (match.resultComment) {
              setComment(match.resultComment);
            }
          }
        } catch (error) {
          console.error('Error fetching match details:', error);
        }
      }
    };

    fetchMatchDetails();
  }, [matchId, mode, session?.user?.id]);

  // Fetch partnership info for doubles (still fetch for display purposes)
  useEffect(() => {
    const fetchPartnership = async () => {
      if (matchType !== 'DOUBLES' || !session?.user?.id || !seasonId) {
        setPartnershipLoading(false);
        // For singles or no partnership, use mode to determine submit capability
        setIsCaptain(mode === 'submit');
        return;
      }

      try {
        const backendUrl = getBackendBaseURL();
        const response = await fetch(
          `${backendUrl}/api/pairing/partnership/active/${seasonId}`,
          {
            headers: {
              'x-user-id': session.user.id,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const partnershipData = data.partnership || data.data || data;
          
          if (partnershipData) {
            setPartnership(partnershipData);
            // The mode prop from parent already determines if user can submit
            // If mode is 'submit', user is the creator team captain
            setIsCaptain(mode === 'submit');
          }
        }
      } catch (error) {
        console.error('Error fetching partnership:', error);
      } finally {
        setPartnershipLoading(false);
      }
    };

    fetchPartnership();
  }, [matchType, session?.user?.id, seasonId, mode]);

  const updateScore = (setIndex: number, team: 'A' | 'B', field: 'games' | 'tiebreak', value: string) => {
    const numValue = parseInt(value) || 0;
    const newScores = [...setScores];
    
    if (field === 'games') {
      if (team === 'A') {
        // Pickleball allows higher scores (15+), Tennis/Padel max 7
        const maxScore = isTennisOrPadel ? 7 : 99;
        newScores[setIndex].team1Games = Math.min(numValue, maxScore);
      } else {
        const maxScore = isTennisOrPadel ? 7 : 99;
        newScores[setIndex].team2Games = Math.min(numValue, maxScore);
      }
    } else if (field === 'tiebreak') {
      if (team === 'A') {
        newScores[setIndex].team1Tiebreak = numValue;
      } else {
        newScores[setIndex].team2Tiebreak = numValue;
      }
    }
    
    setSetScores(newScores);
  };

  // Check if a set needs tiebreak input (6-6 or 7-6 scenarios)
  const needsTiebreak = (setIndex: number): boolean => {
    if (!isTennisOrPadel) return false;
    
    const set = setScores[setIndex];
    const team1 = set.team1Games;
    const team2 = set.team2Games;
    
    // Need tiebreak if 6-6 or if one team has 7 and other has 6
    return (team1 === 6 && team2 === 6) || 
           (team1 === 7 && team2 === 6) || 
           (team1 === 6 && team2 === 7);
  };

  // Get the winner of a set based on games and tiebreak
  const getSetWinner = (setIndex: number): 'A' | 'B' | null => {
    const set = setScores[setIndex];
    const team1 = set.team1Games;
    const team2 = set.team2Games;
    
    if (team1 === 0 && team2 === 0) return null;
    
    // If games are equal at 6-6, check tiebreak
    if (team1 === 6 && team2 === 6) {
      if ((set.team1Tiebreak || 0) > (set.team2Tiebreak || 0)) return 'A';
      if ((set.team2Tiebreak || 0) > (set.team1Tiebreak || 0)) return 'B';
      return null;
    }
    
    // For 7-6 or 6-7 scenarios
    if (team1 === 7 && team2 === 6) return 'A';
    if (team2 === 7 && team1 === 6) return 'B';
    
    // Normal win (6-4, 6-3, etc.)
    if (team1 >= 6 && team1 - team2 >= 2) return 'A';
    if (team2 >= 6 && team2 - team1 >= 2) return 'B';
    
    return null;
  };

  const handleSubmit = async () => {
    // Check if user is captain (for doubles)
    if (matchType === 'DOUBLES' && !isCaptain) {
      Alert.alert(
        'Captain Only',
        'Only team captains can submit match results. Your partner will submit their score separately.'
      );
      return;
    }

    // Validate scores
    const playedSets = setScores.filter(
      (set) => set.team1Games > 0 || set.team2Games > 0
    );

    if (playedSets.length === 0) {
      Alert.alert('Invalid Scores', 'Please enter at least one set score');
      return;
    }

    // For Tennis/Padel: Validate tiebreaks for sets that need them
    if (sportType === 'TENNIS' || sportType === 'PADEL') {
      for (let i = 0; i < playedSets.length; i++) {
        if (needsTiebreak(i)) {
          const set = setScores[i];
          if (!set.team1Tiebreak && !set.team2Tiebreak) {
            Alert.alert(
              'Missing Tiebreak',
              `Set ${i + 1} requires a tiebreak score. Please enter the tiebreak points.`
            );
            return;
          }
        }
      }
    }

    try {
      setLoading(true);
      
      let submitData: any = {
        comment: comment.trim() || undefined
      };

      // Format data based on sport type
      if (sportType === 'PICKLEBALL') {
        // Pickleball uses gameScores with gameNumber, team1Points, team2Points
        submitData.gameScores = playedSets.map((set) => ({
          gameNumber: set.setNumber,
          team1Points: set.team1Games,
          team2Points: set.team2Games
        }));
      } else {
        // Tennis/Padel uses setScores with setNumber, team1Games, team2Games, tiebreaks
        submitData.setScores = playedSets;
      }
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Error submitting result:', error);
      Alert.alert('Error', 'Failed to submit match result');
    } finally {
      setLoading(false);
    }
  };

  const renderPlayerAvatar = (player: Player, showIndicator?: boolean) => (
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
        {showIndicator && matchType === 'DOUBLES' && partnership && (
          <View style={styles.captainBadge}>
            <Ionicons name="star" size={10} color="#FFD700" />
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
          <Ionicons name="close" size={24} color="#FEA04D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mode === 'view' ? 'Submitted Scores' : mode === 'review' ? 'Review Match Result' : 'How did the match go?'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Team Names Section - Show all players */}
        <View style={styles.teamsHeaderSection}>
          <View style={styles.teamHeaderRow}>
            {/* Team A Players */}
            <View style={styles.teamHeaderPlayers}>
              {teamAPlayers.map(player => (
                <View key={player.id} style={styles.teamHeaderPlayerItem}>
                  {player.image ? (
                    <Image source={{ uri: player.image }} style={styles.teamHeaderAvatar} />
                  ) : (
                    <View style={[styles.defaultAvatar, styles.teamHeaderAvatar]}>
                      <Text style={styles.defaultAvatarText}>
                        {player.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.teamHeaderPlayerName} numberOfLines={1}>
                    {player.name}
                  </Text>
                </View>
              ))}
            </View>
            {/* VS Divider */}
            <View style={styles.vsDividerContainer}>
              <Text style={styles.vsText}>VS</Text>
            </View>
            {/* Team B Players */}
            <View style={styles.teamHeaderPlayers}>
              {teamBPlayers.map(player => (
                <View key={player.id} style={styles.teamHeaderPlayerItem}>
                  {player.image ? (
                    <Image source={{ uri: player.image }} style={styles.teamHeaderAvatar} />
                  ) : (
                    <View style={[styles.defaultAvatar, styles.teamHeaderAvatar]}>
                      <Text style={styles.defaultAvatarText}>
                        {player.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.teamHeaderPlayerName} numberOfLines={1}>
                    {player.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          {/* Captain warning for doubles */}
          {matchType === 'DOUBLES' && partnership && !isCaptain && (
            <View style={styles.warningBanner}>
              <Ionicons name="alert-circle" size={16} color="#D97706" />
              <Text style={styles.warningBannerText}>
                Only the captain can submit scores
              </Text>
            </View>
          )}
        </View>

        {/* Sets/Games Header */}
        <View style={styles.setsHeaderRow}>
          <View style={styles.setsHeaderLabel}>
            <Text style={styles.setsHeaderLabelText}>{isTennisOrPadel ? 'SET' : 'GAME'}</Text>
          </View>
          <View style={styles.setsHeaderNumbers}>
            {[1,2,3].map(n => (
              <View key={n} style={styles.setNumberHeaderBox}>
                <Text style={styles.setNumberHeaderText}>{n}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Team A Row */}
        <View style={styles.teamRow}>
          <View style={styles.teamNameColumn}>
            <Text style={styles.teamNameText} numberOfLines={2}>
              {teamAPlayers.map(p => p.name.split(' ')[0]).join(' / ')}
            </Text>
          </View>
          <View style={styles.scoresColumn}>
            {[0,1,2].map((setIdx) => (
              <View key={`A-${setIdx}`} style={styles.scoreSetContainer}>
                <View style={styles.scoreInputWrapper}>
                  <TextInput
                    style={[styles.scoreInput, (!isCaptain || mode !== 'submit') && styles.scoreInputDisabled]}
                    keyboardType="number-pad"
                    maxLength={isTennisOrPadel ? 1 : 2}
                    value={setScores[setIdx].team1Games ? String(setScores[setIdx].team1Games) : ''}
                    onChangeText={(value) => updateScore(setIdx, 'A', 'games', value)}
                    editable={isCaptain && mode === 'submit'}
                    placeholder={isTennisOrPadel ? '' : '15'}
                    placeholderTextColor="#D1D5DB"
                  />
                  {needsTiebreak(setIdx) && getSetWinner(setIdx) === 'A' && (
                    <View style={styles.winIndicator}>
                      <Text style={styles.winIndicatorText}>+1</Text>
                    </View>
                  )}
                </View>
                {needsTiebreak(setIdx) && (
                  <View style={styles.tiebreakInputWrapper}>
                    <TextInput
                      style={[styles.tiebreakInput, (!isCaptain || mode !== 'submit') && styles.scoreInputDisabled]}
                      keyboardType="number-pad"
                      maxLength={2}
                      value={setScores[setIdx].team1Tiebreak ? String(setScores[setIdx].team1Tiebreak) : ''}
                      onChangeText={(value) => updateScore(setIdx, 'A', 'tiebreak', value)}
                      placeholder="TB"
                      placeholderTextColor="#9CA3AF"
                      editable={isCaptain && mode === 'submit'}
                    />
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Team B Row */}
        <View style={styles.teamRow}>
          <View style={styles.teamNameColumn}>
            <Text style={styles.teamNameText} numberOfLines={2}>
              {teamBPlayers.map(p => p.name.split(' ')[0]).join(' / ')}
            </Text>
          </View>
          <View style={styles.scoresColumn}>
            {[0,1,2].map((setIdx) => (
              <View key={`B-${setIdx}`} style={styles.scoreSetContainer}>
                <View style={styles.scoreInputWrapper}>
                  <TextInput
                    style={[styles.scoreInput, (!isCaptain || mode !== 'submit') && styles.scoreInputDisabled]}
                    keyboardType="number-pad"
                    maxLength={isTennisOrPadel ? 1 : 2}
                    value={setScores[setIdx].team2Games ? String(setScores[setIdx].team2Games) : ''}
                    onChangeText={(value) => updateScore(setIdx, 'B', 'games', value)}
                    editable={isCaptain && mode === 'submit'}
                    placeholder={isTennisOrPadel ? '' : '15'}
                    placeholderTextColor="#D1D5DB"
                  />
                  {needsTiebreak(setIdx) && getSetWinner(setIdx) === 'B' && (
                    <View style={styles.winIndicator}>
                      <Text style={styles.winIndicatorText}>+1</Text>
                    </View>
                  )}
                </View>
                {needsTiebreak(setIdx) && (
                  <View style={styles.tiebreakInputWrapper}>
                    <TextInput
                      style={[styles.tiebreakInput, (!isCaptain || mode !== 'submit') && styles.scoreInputDisabled]}
                      keyboardType="number-pad"
                      maxLength={2}
                      value={setScores[setIdx].team2Tiebreak ? String(setScores[setIdx].team2Tiebreak) : ''}
                      onChangeText={(value) => updateScore(setIdx, 'B', 'tiebreak', value)}
                      placeholder="TB"
                      placeholderTextColor="#9CA3AF"
                      editable={isCaptain && mode === 'submit'}
                    />
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Game Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Game Summary (Optional)</Text>
          <TextInput
            style={[styles.summaryInput, (!isCaptain || mode !== 'submit') && styles.scoreInputDisabled]}
            multiline
            numberOfLines={3}
            placeholder="e.g. Great match with close rallies in the final set..."
            placeholderTextColor="#9CA3AF"
            value={comment}
            onChangeText={setComment}
            editable={isCaptain && mode === 'submit'}
          />
        </View>

        {/* Info Message */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle" size={16} color="#3B82F6" />
          <Text style={styles.infoText}>
            {mode === 'view' 
              ? 'These scores have been submitted and are awaiting opponent confirmation.'
              : mode === 'review'
              ? 'Please review the submitted scores carefully before approving or disputing.'
              : matchType === 'DOUBLES' 
              ? 'Only the team captain can submit scores. Your opponent will review and confirm.'
              : 'Your opponent will verify the score. If they confirm, the result is final. If not, a dispute will be created.'}
          </Text>
        </View>

        {/* Action Buttons */}
        {mode === 'submit' ? (
          <TouchableOpacity
            style={[styles.submitButton, (loading || !isCaptain) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading || !isCaptain}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isCaptain ? 'Submit Result' : 'Only Captain Can Submit'}
              </Text>
            )}
          </TouchableOpacity>
        ) : mode === 'view' ? (
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: '#6B7280' }]}
            onPress={onClose}
          >
            <Text style={styles.submitButtonText}>Close</Text>
          </TouchableOpacity>
        ) : mode === 'review' ? (
          <View style={styles.reviewActions}>
            <TouchableOpacity
              style={[styles.disputeButtonLarge]}
              onPress={async () => {
                setLoading(true);
                try {
                  await onDispute?.();
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#DC2626" />
              ) : (
                <>
                  <Ionicons name="close-circle" size={20} color="#DC2626" />
                  <Text style={styles.disputeButtonLargeText}>Dispute Score</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.approveButtonLarge]}
              onPress={async () => {
                setLoading(true);
                try {
                  await onConfirm?.();
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.approveButtonLargeText}>Approve & Confirm</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
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
  teamsHeaderSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  teamHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamHeaderPlayers: {
    flex: 1,
    gap: 12,
  },
  teamHeaderPlayerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  teamHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  teamHeaderPlayerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  vsDividerContainer: {
    paddingHorizontal: 16,
  },
  vsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  partnershipInfo: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  partnershipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  partnershipPlayer: {
    alignItems: 'center',
    flex: 1,
  },
  partnershipAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 8,
  },
  partnershipName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  captainLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  captainText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  partnerText: {
    fontSize: 11,
    color: '#6B7280',
  },
  partnershipDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  warningBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
  setsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  setsHeaderLabel: {
    width: 80,
    alignItems: 'center',
  },
  setsHeaderLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  setsHeaderNumbers: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  setNumberHeaderBox: {
    width: 70,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  playersColumn: {
    width: 80,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamNameColumn: {
    width: 120,
    justifyContent: 'center',
    paddingRight: 12,
  },
  teamNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'left',
  },
  playerContainer: {
    alignItems: 'center',
    width: 48,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: 4,
    overflow: 'visible',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  defaultAvatar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  defaultAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  captainBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  playerName: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  scoresColumn: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  scoreSetContainer: {
    alignItems: 'center',
    gap: 4,
  },
  scoreInputWrapper: {
    position: 'relative',
    width: 70,
    height: 70,
  },
  scoreInput: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  scoreInputDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.6,
  },
  winIndicator: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#10B981',
    borderRadius: 10,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  winIndicatorText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tiebreakInputWrapper: {
    width: 44,
    height: 32,
  },
  tiebreakInput: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    textAlign: 'center',
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
  infoContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 16,
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
  reviewActions: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 32,
  },
  disputeButtonLarge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#FEE2E2',
  },
  disputeButtonLargeText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#DC2626',
  },
  approveButtonLarge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#10B981',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  approveButtonLargeText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
