import { useState } from 'react';
import type { GameData } from '../types';

export const useProfileState = (initialSport?: string) => {
  const [activeTab, setActiveTab] = useState(initialSport || 'Tennis');
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGameType, setSelectedGameType] = useState('Singles');

  return {
    // State values
    activeTab,
    selectedGame,
    modalVisible,
    selectedGameType,
    
    // State setters
    setActiveTab,
    setSelectedGame,
    setModalVisible,
    setSelectedGameType,
  };
};