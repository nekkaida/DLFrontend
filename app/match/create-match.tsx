import { CreateMatchScreen, MatchFormData } from '@/features/chat/components/CreateMatchScreen';
import { useCreateMatchStore } from '@/features/chat/stores/CreateMatchStore';
import { useLocalSearchParams, router } from 'expo-router';
import React from 'react';

export default function CreateMatchPage() {
  const params = useLocalSearchParams();
  const { setPendingMatchData } = useCreateMatchStore();
  
  const leagueInfo = {
    name: (params.leagueName as string) || 'League',
    season: params.season as string | undefined,
    division: params.division as string | undefined,
    sportType: (params.sportType as 'PICKLEBALL' | 'TENNIS' | 'PADEL') || 'PICKLEBALL',
    divisionId: params.divisionId as string | undefined,
  };

  const handleClose = () => {
    router.back();
  };

  const handleCreateMatch = (matchData: MatchFormData) => {
    // Store the match data in the global store
    // The ChatScreen will pick it up when we navigate back
    setPendingMatchData(matchData);
    
    // Navigate back to the chat screen
    router.back();
  };

  return (
    <CreateMatchScreen
      leagueInfo={leagueInfo}
      onClose={handleClose}
      onCreateMatch={handleCreateMatch}
    />
  );
}
