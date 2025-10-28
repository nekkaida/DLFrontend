import React from 'react';
import LeagueDetailsScreen from '@/src/features/dashboard-user/screens/LeagueDetailsScreen';
import { useLocalSearchParams } from 'expo-router';

export default function LeagueDetailsRoute() {
  const params = useLocalSearchParams();
  
  return (
    <LeagueDetailsScreen 
      leagueId={params.leagueId as string}
      leagueName={params.leagueName as string}
      sport={params.sport as 'pickleball' | 'tennis'}
    />
  );
}

