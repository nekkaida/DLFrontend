import React from 'react';
import DoublesTeamPairingScreen from '@/src/features/dashboard-user/screens/DoublesTeamPairingScreen';
import { useLocalSearchParams } from 'expo-router';

export default function DoublesTeamPairingRoute() {
  const params = useLocalSearchParams();
  
  return (
    <DoublesTeamPairingScreen 
      seasonId={params.seasonId as string}
      seasonName={params.seasonName as string}
      leagueId={params.leagueId as string}
      sport={params.sport as 'pickleball' | 'tennis'}
    />
  );
}
