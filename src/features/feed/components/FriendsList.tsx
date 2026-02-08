// src/features/feed/components/FriendsList.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import CommunityScreen from '@/features/community/screens/CommunityScreen';

interface FriendsListProps {
  sport?: 'pickleball' | 'tennis' | 'padel';
}

export const FriendsList: React.FC<FriendsListProps> = ({ sport = 'pickleball' }) => {
  return (
    <View style={styles.container}>
      <CommunityScreen sport={sport} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6FAFC',
  },
});
