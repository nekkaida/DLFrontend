import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FriendListItem, EmptyState } from '../components';
import { Friend } from '../types';

interface FriendsViewProps {
  friends: Friend[];
  partnerships: any[];
}

export const FriendsView: React.FC<FriendsViewProps> = ({ friends }) => {
  return (
    <View style={styles.container}>
      {friends.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="No friends yet"
          subtitle="Send friend requests to connect with other players"
        />
      ) : (
        <View style={styles.listContainer}>
          {friends.map((friend, index) => (
            <React.Fragment key={friend.friendshipId}>
              <FriendListItem friend={friend} />
              {index < friends.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 63,
  },
});
