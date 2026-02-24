// src/features/feed/components/FriendsList.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import CommunityScreen from '@/features/community/screens/CommunityScreen';

interface FriendsListProps {
  sport?: 'pickleball' | 'tennis' | 'padel';
  mode?: 'friend' | 'invite';
  panelVisible?: boolean;
  onPanelOpen?: () => void;
  onPanelClose?: () => void;
  onPendingCountChange?: (count: number) => void;
}

export const FriendsList: React.FC<FriendsListProps> = ({
  sport = 'pickleball',
  mode = 'friend',
  panelVisible,
  onPanelOpen,
  onPanelClose,
  onPendingCountChange,
}) => {
  return (
    <View style={styles.container}>
      <CommunityScreen
        sport={sport}
        mode={mode}
        panelVisible={panelVisible}
        onPanelOpen={onPanelOpen}
        onPanelClose={onPanelClose}
        onPendingCountChange={onPendingCountChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFD',
  },
});
