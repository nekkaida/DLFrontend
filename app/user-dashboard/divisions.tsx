import React from 'react';

import DivisionScreen from '@/src/features/dashboard-user/screens/DivisionScreen';
import { useLocalSearchParams } from 'expo-router';

export default function DivisionsRoute() {
  const params = useLocalSearchParams();

  return (
    <DivisionScreen
      seasonId={params.seasonId as string}
      seasonName={params.seasonName as string}
    />
  );
}