import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isTablet = width > 768;

export type ViewMode = 'players' | 'friends';

interface TabSwitcherProps {
  activeTab: ViewMode;
  onTabChange: (tab: ViewMode) => void;
  friendsCount?: number;
  pendingRequestsCount?: number;
  onRequestsPress?: () => void;
}

export const TabSwitcher: React.FC<TabSwitcherProps> = ({
  activeTab,
  onTabChange,
  friendsCount = 0,
  pendingRequestsCount = 0,
  onRequestsPress,
}) => {
  const handleTabPress = (tab: ViewMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onTabChange(tab);
  };

  const tabs: { key: ViewMode; label: string }[] = [
    { key: 'friends', label: `Friends (${friendsCount})` },
    { key: 'players', label: 'Players' },
  ];

  return (
    <View style={styles.container}>
      {/* Pill tabs */}
      <View style={styles.tabs}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => handleTabPress(tab.key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tabs: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: isSmallScreen ? 8 : isTablet ? 12 : 10,
    paddingHorizontal: isSmallScreen ? 10 : 14,
    borderRadius: 10,
    backgroundColor: '#EFEFEF',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#FEA04D',
  },
  tabText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: isSmallScreen ? 12 : isTablet ? 15 : 13,
    color: '#777777',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  requestsButton: {
    width: isSmallScreen ? 38 : 42,
    height: isSmallScreen ? 38 : 42,
    borderRadius: isSmallScreen ? 19 : 21,
    backgroundColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FEA04D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#1D1D1F',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 12,
  },
});
