import { useState } from 'react';
import type { GameData } from '../types';
import { ProfileDataTransformer } from '../services/ProfileDataTransformer';

export const useProfileState = (initialSport?: string) => {
  const [activeTab, setActiveTab] = useState(initialSport || 'Tennis');
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGameType, setSelectedGameType] = useState('Singles');
  const gameTypeOptions = ProfileDataTransformer.getGameTypeOptions();

  return {
    // State values
    activeTab,
    selectedGame,
    selectedMatch: selectedGame, // Alias for selectedGame
    modalVisible,
    selectedGameType,
    gameTypeOptions,
    
    // State setters
    setActiveTab,
    setSelectedGame,
    setSelectedMatch: setSelectedGame,
    setModalVisible,
    setSelectedGameType,
  };
};