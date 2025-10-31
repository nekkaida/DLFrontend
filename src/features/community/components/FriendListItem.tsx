import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Friend } from '../types';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isTablet = width > 768;

interface FriendListItemProps {
  friend: Friend;
}

export const FriendListItem: React.FC<FriendListItemProps> = ({ friend }) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push(`/player-profile/${friend.friend.id}` as any)}
      activeOpacity={0.7}
    >
      {friend.friend.image ? (
        <Image source={{ uri: friend.friend.image }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.defaultAvatarContainer]}>
          <Text style={styles.defaultAvatarText}>
            {friend.friend.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.name}>{friend.friend.name}</Text>
        <Text style={styles.subtitle}>
          Friends since {new Date(friend.friendsSince).toLocaleDateString()}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#BABABA" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: isSmallScreen ? 10 : isTablet ? 16 : 12,
  },
  avatar: {
    width: isSmallScreen ? 40 : isTablet ? 56 : 48,
    height: isSmallScreen ? 40 : isTablet ? 56 : 48,
    borderRadius: isSmallScreen ? 20 : isTablet ? 28 : 24,
  },
  defaultAvatarContainer: {
    backgroundColor: '#6de9a0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    color: '#FFFFFF',
    fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  name: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    letterSpacing: -0.3,
    color: '#1a1a1a',
  },
  subtitle: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: isSmallScreen ? 11 : isTablet ? 14 : 12,
    color: '#999999',
    marginTop: 2,
  },
});
