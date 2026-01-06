// app/user-dashboard/friend-list.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import CommunityScreen from '@/features/community/screens/CommunityScreen';

export default function FriendListPage() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      />
      <View style={styles.container}>
        <CommunityScreen />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
