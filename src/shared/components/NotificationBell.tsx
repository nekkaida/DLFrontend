import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface NotificationBellProps {
  onPress: () => void;
  unreadCount: number;
  isOpen?: boolean;
}

export default function NotificationBell({ 
  onPress, 
  unreadCount, 
  isOpen = false 
}: NotificationBellProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.bellContainer,
        isOpen && styles.bellContainerActive
      ]}
      activeOpacity={0.7}
    >
      <Ionicons
        name={isOpen ? "notifications" : "notifications-outline"}
        size={24}
        color={isOpen ? "#FFFFFF" : "#1A1C1E"}
      />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bellContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellContainerActive: {
    backgroundColor: '#A04DFE',
    borderColor: '#A04DFE',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#A04DFE',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
});
