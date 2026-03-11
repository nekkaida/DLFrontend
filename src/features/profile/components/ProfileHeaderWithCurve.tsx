import React from 'react';
import { View, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '@core/theme/theme';

interface ProfileHeaderWithCurveProps {
  onBack: () => void;
  onSettings?: () => void;
  showSettings?: boolean;
}

export const ProfileHeaderWithCurve: React.FC<ProfileHeaderWithCurveProps> = ({
  onBack,
  onSettings,
  showSettings = true,
}) => {
  const { width } = useWindowDimensions();
  const headerHeight = Math.max(96, Math.min(124, width * 0.28));
  const iconButtonSize = Math.max(36, Math.min(42, width * 0.11));
  const iconSize = Math.max(20, Math.min(24, width * 0.06));
  const horizontalPadding = Math.max(16, Math.min(24, width * 0.05));

  return (
    <View style={[styles.headerContainer, { height: headerHeight }] }>
      <SafeAreaView edges={['top']} style={styles.safeHeader}>
        <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
          <Pressable
            style={[styles.iconButton, { width: iconButtonSize, height: iconButtonSize, borderRadius: iconButtonSize / 2 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onBack();
            }}
            accessible={true}
            accessibilityLabel="Back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={iconSize} color="#1f2937" />
          </Pressable>
          {showSettings && onSettings && (
            <Pressable
              style={[styles.iconButton, { width: iconButtonSize, height: iconButtonSize, borderRadius: iconButtonSize / 2 }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSettings();
              }}
              accessible={true}
              accessibilityLabel="Settings"
              accessibilityRole="button"
            >
              <Ionicons name="settings-outline" size={iconSize} color="#1f2937" />
            </Pressable>
          )}
          {!showSettings && (
            <View
              style={[
                styles.iconButton,
                { width: iconButtonSize, height: iconButtonSize, borderRadius: iconButtonSize / 2 },
              ]}
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FFFFFF',
  },
  safeHeader: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
  },
  iconButton: {
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
