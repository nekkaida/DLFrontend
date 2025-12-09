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
  Switch,
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
  const [didntPlay, setDidntPlay] = useState(false); // TODO for zawad
  const [matchIncomplete, setMatchIncomplete] = useState(false); // TODO for zawad

  // Separate players by team
  // First try to filter by team property, then fallback to splitting the array
  const teamAPlayersFiltered = players.filter(p => p.team === 'TEAM_A');
  const teamBPlayersFiltered = players.filter(p => p.team === 'TEAM_B');

  // Fallback: if no team property set, split players array (first half = team A, second half = team B)
  const teamAPlayers = teamAPlayersFiltered.length > 0
    ? teamAPlayersFiltered
    : matchType === 'SINGLES'
      ? players.slice(0, 1)
      : players.slice(0, 2);
  const teamBPlayers = teamBPlayersFiltered.length > 0
    ? teamBPlayersFiltered
    : matchType === 'SINGLES'
      ? players.slice(1, 2)
      : players.slice(2, 4);

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

            // Parse existing scores - handle both setScores (tennis/padel) and gameScores (pickleball)
            const scoresData = match.setScores || match.gameScores;
            if (scoresData) {
              try {
                const parsedScores = typeof scoresData === 'string' ? JSON.parse(scoresData) : scoresData;
                if (Array.isArray(parsedScores)) {
                  // Map to internal format - handle both naming conventions
                  // Database may store: { gameNumber, team1Points, team2Points } or { setNumber, team1Games, team2Games }
                  const mappedScores = parsedScores.map((score: any, index: number) => ({
                    setNumber: score.setNumber || score.gameNumber || (index + 1),
                    team1Games: score.team1Games ?? score.team1Points ?? 0,
                    team2Games: score.team2Games ?? score.team2Points ?? 0,
                    team1Tiebreak: score.team1Tiebreak,
                    team2Tiebreak: score.team2Tiebreak,
                  }));

                  setSetScores([
                    mappedScores[0] || { setNumber: 1, team1Games: 0, team2Games: 0 },
                    mappedScores[1] || { setNumber: 2, team1Games: 0, team2Games: 0 },
                    mappedScores[2] || { setNumber: 3, team1Games: 0, team2Games: 0 },
                  ]);
                }
              } catch (e) {
                console.error('Error parsing scores:', e);
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

  // Check if a set/game needs tiebreak input
  const needsTiebreak = (setIndex: number): boolean => {
    const set = setScores[setIndex];
    const team1 = set.team1Games;
    const team2 = set.team2Games;

    if (isTennisOrPadel) {
      // Tennis/Padel: Need tiebreak if either team has 7 (meaning 7-6 scenario)
      return team1 === 7 || team2 === 7;
    } else {
      // Pickleball: Need "tiebreak" (extended score) when both scores >= 14
      // This indicates a close game where win-by-2 is needed
      return (team1 >= 14 && team2 >= 14) ||
             (team1 >= 15 && team2 >= 14) ||
             (team1 >= 14 && team2 >= 15);
    }
  };

  // Check if a specific set should be disabled
  const isSetDisabled = (setIndex: number): boolean => {
    if (setIndex < 2) return false; // First two sets are always enabled

    // 3rd set is only enabled when the score is 1-1 (each player won one set)
    // Otherwise it stays disabled (either 2-0 win or sets not yet completed)
    let teamAWins = 0;
    let teamBWins = 0;

    for (let i = 0; i < 2; i++) {
      const winner = getSetWinner(i);
      if (winner === 'A') teamAWins++;
      if (winner === 'B') teamBWins++;
    }

    // Only enable 3rd set if it's 1-1
    const isOneOne = teamAWins === 1 && teamBWins === 1;
    return !isOneOne;
  };

  // Get the winner of a set based on games and tiebreak
  const getSetWinner = (setIndex: number): 'A' | 'B' | null => {
    const set = setScores[setIndex];
    const team1 = set.team1Games;
    const team2 = set.team2Games;

    if (team1 === 0 && team2 === 0) return null;

    if (isTennisOrPadel) {
      // Tennis/Padel scoring

      // If games are equal at 6-6, check tiebreak
      if (team1 === 6 && team2 === 6) {
        if ((set.team1Tiebreak || 0) > (set.team2Tiebreak || 0)) return 'A';
        if ((set.team2Tiebreak || 0) > (set.team1Tiebreak || 0)) return 'B';
        return null;
      }

      // For 7-6 or 6-7 scenarios, must have tiebreak scores to determine winner
      if (team1 === 7 && team2 === 6) {
        // Need tiebreak score to confirm winner
        const tb1 = set.team1Tiebreak || 0;
        const tb2 = set.team2Tiebreak || 0;
        if (tb1 > tb2 && tb1 >= 7 && tb1 - tb2 >= 2) return 'A';
        if (tb1 === 0 && tb2 === 0) return null; // Tiebreak not filled in yet
        return tb1 > tb2 ? 'A' : null;
      }
      if (team2 === 7 && team1 === 6) {
        // Need tiebreak score to confirm winner
        const tb1 = set.team1Tiebreak || 0;
        const tb2 = set.team2Tiebreak || 0;
        if (tb2 > tb1 && tb2 >= 7 && tb2 - tb1 >= 2) return 'B';
        if (tb1 === 0 && tb2 === 0) return null; // Tiebreak not filled in yet
        return tb2 > tb1 ? 'B' : null;
      }

      // Normal win (6-4, 6-3, etc.)
      if (team1 >= 6 && team1 - team2 >= 2) return 'A';
      if (team2 >= 6 && team2 - team1 >= 2) return 'B';

      return null;
    } else {
      // Pickleball scoring (first to 15, win by 2)

      // Check if either team has won (15+ points with 2+ lead)
      if (team1 >= 15 && team1 - team2 >= 2) return 'A';
      if (team2 >= 15 && team2 - team1 >= 2) return 'B';

      // For close games (both at 14+), check tiebreak/extended scores
      if (team1 >= 14 && team2 >= 14) {
        const tb1 = set.team1Tiebreak || 0;
        const tb2 = set.team2Tiebreak || 0;

        // If tiebreak scores exist, use them to determine winner
        if (tb1 > 0 || tb2 > 0) {
          if (tb1 > tb2 && tb1 - tb2 >= 2) return 'A';
          if (tb2 > tb1 && tb2 - tb1 >= 2) return 'B';
        }
      }

      return null;
    }
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

    // Validate scores - filter out disabled sets (e.g., 3rd set when match won 2-0)
    const playedSets = setScores.filter(
      (set, index) => (set.team1Games > 0 || set.team2Games > 0) && !isSetDisabled(index)
    );

    if (playedSets.length === 0) {
      Alert.alert('Invalid Scores', 'Please enter at least one set score');
      return;
    }

    // Validate tiebreaks for sets/games that need them
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
    } else if (sportType === 'PICKLEBALL') {
      // For Pickleball: If close game (14+ each), require final scores in tiebreak boxes
      for (let i = 0; i < playedSets.length; i++) {
        if (needsTiebreak(i)) {
          const set = setScores[i];
          if (!set.team1Tiebreak && !set.team2Tiebreak) {
            Alert.alert(
              'Missing Final Score',
              `Game ${i + 1} is a close game. Please enter the final winning scores.`
            );
            return;
          }
          // Validate win by 2
          const tb1 = set.team1Tiebreak || 0;
          const tb2 = set.team2Tiebreak || 0;
          const winner = Math.max(tb1, tb2);
          const loser = Math.min(tb1, tb2);
          if (winner < 15) {
            Alert.alert(
              'Invalid Score',
              `Game ${i + 1}: Winner must have at least 15 points.`
            );
            return;
          }
          if (winner - loser < 2) {
            Alert.alert(
              'Invalid Score',
              `Game ${i + 1}: Must win by 2 points. Current: ${tb1}-${tb2}`
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
        // For close games (14-14 or higher), use tiebreak scores as final scores
        submitData.gameScores = playedSets.map((set) => {
          // If tiebreak scores exist (close game), use them as final scores
          const hasTiebreak = set.team1Tiebreak !== undefined && set.team2Tiebreak !== undefined &&
                              (set.team1Tiebreak > 0 || set.team2Tiebreak > 0);

          return {
            gameNumber: set.setNumber,
            team1Points: hasTiebreak ? set.team1Tiebreak! : set.team1Games,
            team2Points: hasTiebreak ? set.team2Tiebreak! : set.team2Games
          };
        });
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
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {mode === 'view' ? 'Match Result' : mode === 'review' ? 'Review Match Result' : 'How did the match go?'}
          </Text>
          {mode === 'submit' && (
            <Text style={styles.headerSubtitle}>Submit the scores below.</Text>
          )}
          {mode === 'review' && (
            <Text style={styles.headerSubtitle}>A result has been submitted. Please verify and approve or dispute.</Text>
          )}
          {mode === 'view' && matchDetails?.resultSubmittedAt && (
            <Text style={styles.headerSubtitle}>Result submitted and confirmed.</Text>
          )}
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Status Banner - Show when result is pending approval */}
      {mode === 'review' && (
        <View style={styles.statusBanner}>
          <Ionicons name="information-circle" size={20} color="#F59E0B" />
          <Text style={styles.statusBannerText}>
            Opponent has submitted scores. Review and approve or dispute.
          </Text>
        </View>
      )}

      {/* Status Banner - Show when user's team submitted and waiting for approval */}
      {mode === 'view' && matchDetails?.status === 'ONGOING' && (
        <View style={[styles.statusBanner, { backgroundColor: '#EFF6FF' }]}>
          <Ionicons name="time" size={20} color="#3B82F6" />
          <Text style={[styles.statusBannerText, { color: '#1D4ED8' }]}>
            Waiting for opponent to approve the submitted result.
          </Text>
        </View>
      )}

      {/* Toggle Switches */}
      {mode === 'submit' && (
        <View style={styles.togglesSection}>
          <View style={styles.toggleItem}>
            <Text style={styles.toggleLabel}>Didn't play</Text>
            <Switch
              value={didntPlay}
              onValueChange={setDidntPlay}
              trackColor={{ false: '#E5E7EB', true: '#FEA04D' }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={styles.toggleItem}>
            <Text style={styles.toggleLabel}>Match incomplete</Text>
            <Switch
              value={matchIncomplete}
              onValueChange={setMatchIncomplete}
              trackColor={{ false: '#E5E7EB', true: '#FEA04D' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Sets/Games Header */}
        <View style={styles.setsHeaderRow}>
          <View style={styles.setsHeaderLabel}>
            <Text style={styles.setsHeaderLabelText}>{isTennisOrPadel ? 'SET' : 'GAME'}</Text>
          </View>
          <View style={styles.setsHeaderNumbers}>
            {[1,2,3].map(n => (
              <Text key={n} style={styles.setNumberHeaderText}>{n}</Text>
            ))}
          </View>
        </View>

        {/* Team A Row */}
        <View style={styles.teamRow}>
          {/* Avatar(s) - Overlapping for doubles, single for singles */}
          {matchType === 'DOUBLES' ? (
            <View style={styles.overlappingAvatars}>
              {teamAPlayers.map((player, index) => (
                <View
                  key={player.id}
                  style={[
                    styles.overlappingAvatarContainer,
                    index > 0 && { marginLeft: -16 }
                  ]}
                >
                  {player.image ? (
                    <Image source={{ uri: player.image }} style={styles.overlappingAvatarImage} />
                  ) : (
                    <View style={styles.overlappingAvatarDefault}>
                      <Text style={styles.overlappingAvatarText}>
                        {player.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.singleAvatarContainer}>
              {teamAPlayers[0]?.image ? (
                <Image source={{ uri: teamAPlayers[0].image }} style={styles.singleAvatarImage} />
              ) : (
                <View style={styles.singleAvatarDefault}>
                  <Text style={styles.singleAvatarText}>
                    {teamAPlayers[0]?.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          )}
          {/* Names - Stacked for doubles, single for singles */}
          <View style={styles.stackedNames}>
            {matchType === 'DOUBLES' ? (
              teamAPlayers.map(player => (
                <Text key={player.id} style={styles.stackedNameText}>
                  {player.name.split(' ')[0]}
                </Text>
              ))
            ) : (
              <Text style={styles.stackedNameText}>
                {teamAPlayers[0]?.name.split(' ')[0]}
              </Text>
            )}
          </View>
          {/* Score Inputs */}
          <View style={styles.scoresColumn}>
            {[0,1,2].map((setIdx) => {
              const setDisabled = isSetDisabled(setIdx);
              const showTiebreak = needsTiebreak(setIdx);
              return (
                <View key={`A-${setIdx}`} style={styles.scoreInputWrapper}>
                  <TextInput
                    style={[
                      styles.scoreInput,
                      (!isCaptain || mode !== 'submit' || setDisabled) && styles.scoreInputDisabled
                    ]}
                    keyboardType="number-pad"
                    maxLength={isTennisOrPadel ? 1 : 2}
                    value={setScores[setIdx].team1Games ? String(setScores[setIdx].team1Games) : ''}
                    onChangeText={(value) => updateScore(setIdx, 'A', 'games', value)}
                    editable={isCaptain && mode === 'submit' && !setDisabled}
                    placeholder=""
                    placeholderTextColor="#D1D5DB"
                  />
                  {showTiebreak && (
                    <View style={styles.tiebreakOverlay}>
                      <TextInput
                        style={[
                          styles.tiebreakOverlayInput,
                          (!isCaptain || mode !== 'submit' || setDisabled) && styles.tiebreakInputDisabled
                        ]}
                        keyboardType="number-pad"
                        maxLength={2}
                        value={setScores[setIdx].team1Tiebreak ? String(setScores[setIdx].team1Tiebreak) : ''}
                        onChangeText={(value) => updateScore(setIdx, 'A', 'tiebreak', value)}
                        editable={isCaptain && mode === 'submit' && !setDisabled}
                        placeholder=""
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Team B Row */}
        <View style={styles.teamRow}>
          {/* Avatar(s) - Overlapping for doubles, single for singles */}
          {matchType === 'DOUBLES' ? (
            <View style={styles.overlappingAvatars}>
              {teamBPlayers.map((player, index) => (
                <View
                  key={player.id}
                  style={[
                    styles.overlappingAvatarContainer,
                    index > 0 && { marginLeft: -16 }
                  ]}
                >
                  {player.image ? (
                    <Image source={{ uri: player.image }} style={styles.overlappingAvatarImage} />
                  ) : (
                    <View style={styles.overlappingAvatarDefault}>
                      <Text style={styles.overlappingAvatarText}>
                        {player.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.singleAvatarContainer}>
              {teamBPlayers[0]?.image ? (
                <Image source={{ uri: teamBPlayers[0].image }} style={styles.singleAvatarImage} />
              ) : (
                <View style={styles.singleAvatarDefault}>
                  <Text style={styles.singleAvatarText}>
                    {teamBPlayers[0]?.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          )}
          {/* Names - Stacked for doubles, single for singles */}
          <View style={styles.stackedNames}>
            {matchType === 'DOUBLES' ? (
              teamBPlayers.map(player => (
                <Text key={player.id} style={styles.stackedNameText}>
                  {player.name.split(' ')[0]}
                </Text>
              ))
            ) : (
              <Text style={styles.stackedNameText}>
                {teamBPlayers[0]?.name.split(' ')[0]}
              </Text>
            )}
          </View>
          {/* Score Inputs */}
          <View style={styles.scoresColumn}>
            {[0,1,2].map((setIdx) => {
              const setDisabled = isSetDisabled(setIdx);
              const showTiebreak = needsTiebreak(setIdx);
              return (
                <View key={`B-${setIdx}`} style={styles.scoreInputWrapper}>
                  <TextInput
                    style={[
                      styles.scoreInput,
                      (!isCaptain || mode !== 'submit' || setDisabled) && styles.scoreInputDisabled
                    ]}
                    keyboardType="number-pad"
                    maxLength={isTennisOrPadel ? 1 : 2}
                    value={setScores[setIdx].team2Games ? String(setScores[setIdx].team2Games) : ''}
                    onChangeText={(value) => updateScore(setIdx, 'B', 'games', value)}
                    editable={isCaptain && mode === 'submit' && !setDisabled}
                    placeholder=""
                    placeholderTextColor="#D1D5DB"
                  />
                  {showTiebreak && (
                    <View style={styles.tiebreakOverlay}>
                      <TextInput
                        style={[
                          styles.tiebreakOverlayInput,
                          (!isCaptain || mode !== 'submit' || setDisabled) && styles.tiebreakInputDisabled
                        ]}
                        keyboardType="number-pad"
                        maxLength={2}
                        value={setScores[setIdx].team2Tiebreak ? String(setScores[setIdx].team2Tiebreak) : ''}
                        onChangeText={(value) => updateScore(setIdx, 'B', 'tiebreak', value)}
                        editable={isCaptain && mode === 'submit' && !setDisabled}
                        placeholder=""
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Game Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Game Summary</Text>
          <TextInput
            style={[styles.summaryInput, (!isCaptain || mode !== 'submit') && styles.scoreInputDisabled]}
            multiline
            numberOfLines={3}
            placeholder="e.g. A great game with Serena, with plenty of good rallies and close points. I really got lucky there in the final set!"
            placeholderTextColor="#9CA3AF"
            value={comment}
            onChangeText={setComment}
            editable={isCaptain && mode === 'submit'}
          />
        </View>

        {/* Info Message */}
        {mode !== 'submit' && (
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle" size={16} color="#3B82F6" />
            <Text style={styles.infoText}>
              {mode === 'view'
                ? 'These scores have been submitted and are awaiting opponent confirmation.'
                : 'Please review the submitted scores carefully before approving or disputing.'}
            </Text>
          </View>
        )}

        {/* Red Disclaimer for Submit Mode */}
        {mode === 'submit' && (
          <View style={styles.disclaimerContainer}>
            <Text style={styles.disclaimerText}>
              Only team captains need to submit the scores.
            </Text>
          </View>
        )}

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
                {isCaptain ? 'Confirm Result' : 'Only Captain Can Confirm'}
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
              style={[styles.disputeButtonLarge, loading && styles.buttonDisabled]}
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
                <ActivityIndicator color="#DC2626" size="small" />
              ) : (
                <>
                  <Ionicons name="close-circle" size={20} color="#DC2626" />
                  <Text style={styles.disputeButtonLargeText}>Dispute Score</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.approveButtonLarge, loading && styles.buttonDisabled]}
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
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#2B2929" />
                  <Text style={styles.approveButtonLargeText}>Confirm Result</Text>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  closeButton: {
    padding: 4,
    marginTop: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  togglesSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  overlappingAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  singleAvatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    overflow: 'hidden',
  },
  singleAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  singleAvatarDefault: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  singleAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  overlappingAvatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  overlappingAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  overlappingAvatarDefault: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlappingAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  stackedNames: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  stackedNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 18,
  },
  tiebreakOverlay: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  tiebreakOverlayInput: {
    width: '100%',
    height: '100%',
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    padding: 0,
  },
  tiebreakInputDisabled: {
    backgroundColor: '#E5E7EB',
    opacity: 0.6,
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
    paddingTop: 20,
    paddingBottom: 12,
  },
  setsHeaderLabel: {
    width: 100,
  },
  setsHeaderLabelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  setsHeaderNumbers: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'flex-end',
    gap: 12,
  },
  setNumberHeaderBox: {
    width: 64,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumberHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    width: 64,
    textAlign: 'center',
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    justifyContent: 'flex-end',
    gap: 12,
  },
  scoreInputWrapper: {
    position: 'relative',
    width: 64,
    height: 64,
  },
  scoreInput: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#BFDBFE',
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  scoreInputDisabled: {
    backgroundColor: '#E5E7EB',
    borderColor: '#D1D5DB',
    opacity: 0.5,
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
  disclaimerContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  disclaimerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#DC2626',
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
    backgroundColor: '#FEA04D',
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
    color: '#2B2929',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
  },
  statusBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#92400E',
    lineHeight: 18,
  },
});
