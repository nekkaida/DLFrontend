import React from 'react';
import { router } from 'expo-router';
import { CommunityScreen } from '@/features/dashboard-user/screens';

export default function ConnectPage() {
  const handleTabPress = (tabIndex: number) => {
    // Navigate based on tab index
    // Tab indices: 0=Connect, 1=Friendly, 2=Leagues, 3=My Games, 4=Chat
    if (tabIndex === 0) {
      // Already on Connect page, do nothing
      return;
    } else if (tabIndex === 1) {
      // Navigate to Friendly
      router.push('/user-dashboard?view=friendly');
    } else if (tabIndex === 2) {
      // Navigate to Leagues (main dashboard)
      router.push('/user-dashboard?view=dashboard');
    } else if (tabIndex === 3) {
      // Navigate to My Games
      router.push('/user-dashboard?view=myGames');
    } else if (tabIndex === 4) {
      // Navigate to Chat
      router.push('/user-dashboard?view=chat');
    }
  };

  return <CommunityScreen onTabPress={handleTabPress} sport="pickleball" />;
}
