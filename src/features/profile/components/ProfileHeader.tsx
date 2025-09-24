import React from 'react';
import { View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CURVE_CONFIG, generateCurvePath } from '../constants/ProfileConstants';

interface ProfileHeaderProps {
  styles: any; // Preserving exact styles from parent
  width: number;
  onBackPress: () => void;
  onSettingsPress: () => void;
}

/**
 * ProfileHeader - Extracted header component with orange gradient and curved bottom
 *
 * CRITICAL: This component preserves the exact visual appearance from profile.tsx
 * All positioning values are passed through styles to maintain pixel-perfect layout
 */
export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  styles,
  width,
  onBackPress,
  onSettingsPress,
}) => {
  return (
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={['#FE9F4D', '#FFA366']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.orangeHeader}
      >
        <SafeAreaView edges={['top']} style={styles.safeHeader}>
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onBackPress();
              }}
              accessible={true}
              accessibilityLabel="Back to dashboard"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </Pressable>
            <Pressable
              style={styles.settingsIcon}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSettingsPress();
              }}
              accessible={true}
              accessibilityLabel="Settings"
              accessibilityRole="button"
            >
              <Ionicons name="settings-outline" size={24} color="#fff" />
            </Pressable>
          </View>
        </SafeAreaView>

        {/* Concave curve at bottom of orange header - ADJUSTABLE CONCAVITY */}
        <Svg
          height={CURVE_CONFIG.HEIGHT}
          width={width}
          viewBox={`0 0 ${width} ${CURVE_CONFIG.HEIGHT}`}
          style={styles.concaveCurve}
        >
          <Path
            d={generateCurvePath(width)}
            fill="#f0f0f0"
          />
        </Svg>
      </LinearGradient>
    </View>
  );
};