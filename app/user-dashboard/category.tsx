import React from 'react';
import LeagueCategoryScreen from '@/src/features/dashboard-user/screens/LeagueCategoryScreen';
import { useLocalSearchParams } from 'expo-router';

export default function LeagueCategoryRoute() {
  const params = useLocalSearchParams();
  
  return (
    <LeagueCategoryScreen 
      leagueId={params.leagueId as string}
      leagueName={params.leagueName as string}
      sport={params.sport as 'pickleball' | 'tennis'} // add padel later
      gameType={params.gameType as 'SINGLES' | 'DOUBLES'} // add mixed later
    />
  );
}
