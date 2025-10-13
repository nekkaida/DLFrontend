import React from 'react';
import SeasonsScreen from '@/src/features/dashboard-user/screens/SeasonsScreen';
import { useLocalSearchParams } from 'expo-router';

export default function SeasonsRoute() {
  const params = useLocalSearchParams();
  
  return (
    <SeasonsScreen 
      category={params.category as string}
      categoryId={params.categoryId as string}
      leagueId={params.leagueId as string}
      leagueName={params.leagueName as string}
      sport={params.sport as 'pickleball' | 'tennis'}
    />
  );
}
