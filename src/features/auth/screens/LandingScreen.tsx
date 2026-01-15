import React, { useRef, useCallback } from 'react';
import { View, Text, Image, Pressable, Dimensions, Platform, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { SocialButton } from '../components/AuthComponents';
import DeuceLogo from '../../onboarding/components/DeuceLogo';
import DeuceSvg from '@/assets/images/DEUCE.svg';
import {
  scale,
  verticalScale,
  moderateScale,
} from '@/core/utils/responsive';

// Safe haptics wrapper - handles unsupported devices gracefully
const triggerHaptic = async (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
  try {
    await Haptics.impactAsync(style);
  } catch {
    // Haptics not supported on this device
  }
};

// Visual constants
const COLORS = {
  GRADIENT_START: '#FEA04D',
  GRADIENT_END: '#FF7903',
  BACKGROUND: '#000000',
  WHITE: '#FFFFFF',
  TAGLINE: '#E3EEF2',
  LINK_TEXT: '#404040',
  ACCENT: '#FEA04D',
} as const;

interface LandingScreenProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onSocialLogin?: (provider: 'facebook' | 'google' | 'apple') => void;
}

// Debounce delay in milliseconds
const DEBOUNCE_DELAY = 500;

export const LandingScreen: React.FC<LandingScreenProps> = ({
  onGetStarted,
  onLogin,
  onSocialLogin,
}) => {
  const insets = useSafeAreaInsets();
  const lastPressTimeRef = useRef<number>(0);
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // Debounced press handler to prevent double-clicks
  const handleDebouncedPress = useCallback((callback: () => void) => {
    const now = Date.now();
    if (now - lastPressTimeRef.current < DEBOUNCE_DELAY) {
      return; // Ignore rapid clicks
    }
    lastPressTimeRef.current = now;
    triggerHaptic();
    callback();
  }, []);

  const handleSocialPress = useCallback((provider: 'facebook' | 'google' | 'apple') => {
    handleDebouncedPress(() => onSocialLogin?.(provider));
  }, [handleDebouncedPress, onSocialLogin]);

  return (
    <View style={styles.container}>
      <View style={styles.landingPage}>
        <Image
          source={require('@/assets/images/splash.png')}
          style={[styles.backgroundImage, { width: screenWidth, height: screenHeight }]}
        />

        <StatusBar style="light" backgroundColor="transparent" />

        <View style={[styles.logoContainer, { top: verticalScale(120) }]}>
          <View style={styles.textShadowContainer}>
            <DeuceSvg
              width={scale(200)}
              height={scale(72)}
            />
          </View>
          <View style={styles.logoShadowContainer}>
            <DeuceLogo
              width={scale(75)}
              height={scale(75)}
            />
          </View>
        </View>

        <Text style={[styles.taglineText, { top: verticalScale(640), left: scale(26) }]}>
          Your ultimate{'\n'}sports flex league platform.
        </Text>

        <View style={[styles.bottomContainer, { paddingBottom: Math.max(verticalScale(20), insets.bottom) }]}>
          <View style={styles.topRow}>
            <Pressable
              style={styles.getStartedButton}
              onPress={() => handleDebouncedPress(onGetStarted)}
              accessibilityLabel="Get started with registration"
              accessibilityRole="button"
              accessibilityHint="Navigates to the sign up screen"
            >
              <LinearGradient
                colors={[COLORS.GRADIENT_START, COLORS.GRADIENT_END]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.getStartedButtonText} numberOfLines={1}>Ready? Start now</Text>
              </LinearGradient>
            </Pressable>

            <View style={styles.socialContainer}>
              <SocialButton type="facebook" onPress={() => handleSocialPress('facebook')} />
              <SocialButton type="apple" onPress={() => handleSocialPress('apple')} />
              <SocialButton type="google" onPress={() => handleSocialPress('google')} />
            </View>
          </View>

          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginLinkText}>Already have an account? </Text>
            <Pressable
              onPress={() => handleDebouncedPress(onLogin)}
              style={styles.loginLinkButton}
              accessibilityLabel="Log in to existing account"
              accessibilityRole="button"
              accessibilityHint="Navigates to the login screen"
            >
              <Text style={styles.loginLinkButtonText}>Log in</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  landingPage: {
    flex: 1,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  backgroundImage: {
    position: 'absolute',
    left: 0,
    top: 0,
    resizeMode: 'cover',
  },
  logoContainer: {
    position: 'absolute',
    width: '100%',
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textShadowContainer: {
    shadowColor: COLORS.BACKGROUND,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: scale(20),
  },
  logoShadowContainer: {
    shadowColor: COLORS.BACKGROUND,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  taglineText: {
    position: 'absolute',
    width: scale(300),
    fontFamily: Platform.select({
      ios: 'Helvetica',
      android: 'sans-serif',
    }),
    fontStyle: 'italic',
    fontWeight: '400',
    fontSize: moderateScale(22),
    lineHeight: moderateScale(29),
    letterSpacing: -0.01,
    color: COLORS.TAGLINE,
  },
  bottomContainer: {
    position: 'absolute',
    width: '100%',
    minHeight: verticalScale(140),
    left: 0,
    bottom: 0,
    backgroundColor: COLORS.WHITE,
    shadowColor: COLORS.BACKGROUND,
    shadowOffset: { width: 0, height: verticalScale(-20) },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(80),
    elevation: 20,
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(20),
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  getStartedButton: {
    flex: 1,
    maxWidth: scale(200),
    height: verticalScale(44),
    marginRight: scale(10),
    borderRadius: moderateScale(20),
    shadowColor: COLORS.BACKGROUND,
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(4),
    elevation: 4,
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(16),
  },
  getStartedButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: moderateScale(16),
    lineHeight: moderateScale(20),
    color: COLORS.WHITE,
    textAlign: 'center',
    flexShrink: 1,
  },
  socialContainer: {
    flexDirection: 'row',
    gap: scale(8),
    alignItems: 'center',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
    minHeight: verticalScale(32),
  },
  loginLinkText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: moderateScale(14),
    lineHeight: moderateScale(18),
    letterSpacing: -0.01,
    color: COLORS.LINK_TEXT,
  },
  loginLinkButton: {
    paddingTop: verticalScale(2),
    paddingBottom: verticalScale(2),
    paddingHorizontal: scale(3),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.ACCENT,
  },
  loginLinkButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: moderateScale(14),
    lineHeight: moderateScale(18),
    letterSpacing: -0.01,
    color: COLORS.ACCENT,
  },
});

// Re-export with old name for backwards compatibility during migration
/** @deprecated Use LandingScreen instead */
export const LoadingScreen = LandingScreen;
