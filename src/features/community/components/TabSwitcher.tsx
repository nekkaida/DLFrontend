import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isTablet = width > 768;

export type ViewMode = 'all' | 'friends' | 'invitations';

interface TabSwitcherProps {
  activeTab: ViewMode;
  onTabChange: (tab: ViewMode) => void;
  friendsCount?: number;
}

export const TabSwitcher: React.FC<TabSwitcherProps> = ({
  activeTab,
  onTabChange,
  friendsCount = 0,
}) => {
  const handleTabPress = (tab: ViewMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onTabChange(tab);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'friends' && styles.tabButtonActive]}
        onPress={() => handleTabPress('friends')}
      >
        <Text style={[styles.tabButtonText, activeTab === 'friends' && styles.tabButtonTextActive]}>
          Friends ({friendsCount})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]}
        onPress={() => handleTabPress('all')}
      >
        <Text style={[styles.tabButtonText, activeTab === 'all' && styles.tabButtonTextActive]}>
          All Players
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'invitations' && styles.tabButtonActive]}
        onPress={() => handleTabPress('invitations')}
      >
        <Text style={[styles.tabButtonText, activeTab === 'invitations' && styles.tabButtonTextActive]}>
          Invitations
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: isSmallScreen ? 8 : isTablet ? 12 : 10,
    paddingHorizontal: isSmallScreen ? 12 : isTablet ? 20 : 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#FEA04D',
  },
  tabButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: isSmallScreen ? 12 : isTablet ? 16 : 14,
    color: '#666666',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
});
