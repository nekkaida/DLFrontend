import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import type { GameData } from '../types';

interface ProfileHandlersProps {
  setSelectedGameType: (gameType: string) => void;
  setActiveTab: (tab: string) => void;
  setSelectedGame: (game: GameData | null) => void;
  setModalVisible: (visible: boolean) => void;
}

export const useProfileHandlers = ({
  setSelectedGameType,
  setActiveTab,
  setSelectedGame,
  setModalVisible,
}: ProfileHandlersProps) => {
  const handleSettingsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/settings');
  };

  const handleEditPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/edit-profile');
  };

  const handleGameTypeSelect = (gameType: string) => {
    setSelectedGameType(gameType);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleLeagueSelect = (league: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleTabPress = (sport: string) => {
    setActiveTab(sport);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleGamePointPress = (game: GameData) => {
    setSelectedGame(game);
    setModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedGame(null);
  };

  const handleMatchHistoryPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/match-history');
  };

  return {
    handleSettingsPress,
    handleEditPress,
    handleGameTypeSelect,
    handleLeagueSelect,
    handleTabPress,
    handleGamePointPress,
    handleModalClose,
    handleMatchHistoryPress,
  };
};