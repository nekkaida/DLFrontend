import React from 'react';
import SeasonDetailsScreen from '@/src/features/dashboard-user/screens/SeasonDetailsScreen';
import { useLocalSearchParams } from 'expo-router';

export default function SeasonDetailsRoute() {
  const params = useLocalSearchParams();
  
  return (
    <SeasonDetailsScreen 
      seasonId={params.seasonId as string}
      seasonName={params.seasonName as string}
      leagueId={params.leagueId as string}
      sport={params.sport as 'pickleball' | 'tennis'}
    />
  );
}

