import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isTablet = width > 768;

interface SubTabSwitcherProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: Array<{ key: string; label: string; count?: number }>;
}

export const SubTabSwitcher: React.FC<SubTabSwitcherProps> = ({
  activeTab,
  onTabChange,
  tabs,
}) => {
  const handleTabPress = (tabKey: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onTabChange(tabKey);
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
          onPress={() => handleTabPress(tab.key)}
        >
          <Text style={[styles.tabButtonText, activeTab === tab.key && styles.tabButtonTextActive]}>
            {tab.label} {tab.count !== undefined && `(${tab.count})`}
          </Text>
        </TouchableOpacity>
      ))}
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
    paddingVertical: isSmallScreen ? 6 : isTablet ? 10 : 8,
    paddingHorizontal: isSmallScreen ? 10 : isTablet ? 16 : 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E2E2',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#FEA04D',
    borderColor: '#FEA04D',
  },
  tabButtonText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: isSmallScreen ? 11 : isTablet ? 14 : 12,
    color: '#666666',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
});
