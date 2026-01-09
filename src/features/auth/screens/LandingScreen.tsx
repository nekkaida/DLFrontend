import React, { useState, useEffect } from 'react';
import { View, Text, Image, Pressable, Dimensions, Platform, StyleSheet, AppState } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { SocialButton } from '../components/AuthComponents';
import DeuceLogo from '../../onboarding/components/DeuceLogo';
import DeuceSvg from '@/assets/images/DEUCE.svg';

// Layout constants - percentages of screen height
const LAYOUT = {
  /** Logo positioned at 15% from top */
  LOGO_TOP_POSITION: 0.15,
  /** Tagline positioned at 73% from top */
  TAGLINE_TOP_POSITION: 0.73,
  /** Tagline width as percentage of screen */
  TAGLINE_WIDTH: 0.8,
  /** Tagline left margin as percentage of screen */
  TAGLINE_LEFT_MARGIN: 0.07,
  /** CTA button max width as percentage of screen */
  CTA_BUTTON_MAX_WIDTH: 0.55,
  /** Horizontal padding for bottom container */
  CONTAINER_HORIZONTAL_PADDING: 0.05,
} as const;

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

export const LandingScreen: React.FC<LandingScreenProps> = ({
  onGetStarted,
  onLogin,
  onSocialLogin,
}) => {
  const insets = useSafeAreaInsets();

  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  // Force re-render when app comes to foreground to fix Android layout issues
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        forceUpdate(prev => prev + 1);
        const { width, height } = Dimensions.get('window');
        setDimensions({ width, height });
      }
    });

    return () => {
      subscription?.remove();
      appStateSubscription?.remove();
    };
  }, []);

  const { width: screenWidth, height: screenHeight } = dimensions;
  const dynamicStyles = getStyles(screenWidth, screenHeight, insets.bottom);

  const handleSocialPress = (provider: 'facebook' | 'google' | 'apple') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSocialLogin?.(provider);
  };

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.landingPage}>
        <Image
          source={require('@/assets/images/splash.png')}
          style={dynamicStyles.backgroundImage}
        />

        <StatusBar style="light" backgroundColor="transparent" />

        <View style={dynamicStyles.logoContainer}>
          <View style={dynamicStyles.textShadowContainer}>
            <DeuceSvg width={260} height={94} />
          </View>
          <View style={dynamicStyles.logoShadowContainer}>
            <DeuceLogo width={100} height={100} />
          </View>
        </View>

        <Text style={dynamicStyles.taglineText}>
          Your ultimate{'\n'}sports flex league platform.
        </Text>

        <View style={dynamicStyles.bottomContainer}>
          <View style={dynamicStyles.topRow}>
            <Pressable
              style={dynamicStyles.getStartedButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onGetStarted();
              }}
            >
              <LinearGradient
                colors={[COLORS.GRADIENT_START, COLORS.GRADIENT_END]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={dynamicStyles.gradientButton}
              >
                <Text style={dynamicStyles.getStartedButtonText} numberOfLines={1}>Ready? Start now</Text>
              </LinearGradient>
            </Pressable>

            <View style={dynamicStyles.socialContainer}>
              <SocialButton type="facebook" onPress={() => handleSocialPress('facebook')} />
              <SocialButton type="apple" onPress={() => handleSocialPress('apple')} />
              <SocialButton type="google" onPress={() => handleSocialPress('google')} />
            </View>
          </View>

          <View style={dynamicStyles.loginLinkContainer}>
            <Text style={dynamicStyles.loginLinkText}>Already have an account? </Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onLogin();
              }}
              style={dynamicStyles.loginLinkButton}
            >
              <Text style={dynamicStyles.loginLinkButtonText}>Log in</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number, bottomInset: number) => StyleSheet.create({
  container: {
    flex: 1,
    width: screenWidth,
    height: screenHeight,
    backgroundColor: COLORS.BACKGROUND,
  },
  landingPage: {
    flex: 1,
    width: screenWidth,
    height: screenHeight,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  backgroundImage: {
    position: 'absolute',
    width: screenWidth,
    height: screenHeight,
    left: 0,
    top: 0,
    resizeMode: 'cover',
  },
  logoContainer: {
    position: 'absolute',
    width: screenWidth,
    left: 0,
    top: screenHeight * LAYOUT.LOGO_TOP_POSITION,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textShadowContainer: {
    shadowColor: COLORS.BACKGROUND,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 20,
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
    width: screenWidth * LAYOUT.TAGLINE_WIDTH,
    left: screenWidth * LAYOUT.TAGLINE_LEFT_MARGIN,
    top: screenHeight * LAYOUT.TAGLINE_TOP_POSITION,
    fontFamily: Platform.select({
      ios: 'Helvetica',
      android: 'sans-serif',
    }),
    fontStyle: 'italic',
    fontWeight: '400',
    fontSize: 22,
    lineHeight: 29,
    letterSpacing: -0.01,
    color: COLORS.TAGLINE,
  },
  bottomContainer: {
    position: 'absolute',
    width: screenWidth,
    minHeight: Platform.OS === 'ios' ? 140 : 120,
    left: 0,
    bottom: 0,
    backgroundColor: COLORS.WHITE,
    shadowColor: COLORS.BACKGROUND,
    shadowOffset: { width: 0, height: -20 },
    shadowOpacity: 0.25,
    shadowRadius: 80,
    elevation: 20,
    paddingHorizontal: screenWidth * LAYOUT.CONTAINER_HORIZONTAL_PADDING,
    paddingTop: Platform.OS === 'ios' ? 20 : 15,
    paddingBottom: Math.max(Platform.OS === 'ios' ? 20 : 15, bottomInset),
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 20 : 15,
  },
  getStartedButton: {
    flex: 1,
    maxWidth: screenWidth * LAYOUT.CTA_BUTTON_MAX_WIDTH,
    height: Platform.OS === 'ios' ? 44 : 40,
    marginRight: 10,
    borderRadius: 20,
    shadowColor: COLORS.BACKGROUND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    paddingHorizontal: 16,
  },
  getStartedButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: Platform.OS === 'ios' ? 16 : 15,
    lineHeight: Platform.OS === 'ios' ? 20 : 18,
    color: COLORS.WHITE,
    textAlign: 'center',
    flexShrink: 1,
  },
  socialContainer: {
    flexDirection: 'row',
    gap: Platform.OS === 'ios' ? 8 : 6,
    alignItems: 'center',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    minHeight: Platform.OS === 'ios' ? 32 : 24,
  },
  loginLinkText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: Platform.OS === 'ios' ? 14 : 13,
    lineHeight: Platform.OS === 'ios' ? 18 : 17,
    letterSpacing: -0.01,
    color: COLORS.LINK_TEXT,
  },
  loginLinkButton: {
    paddingTop: Platform.OS === 'ios' ? 2 : 1,
    paddingBottom: Platform.OS === 'ios' ? 2 : 1,
    paddingHorizontal: Platform.OS === 'ios' ? 3 : 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.ACCENT,
  },
  loginLinkButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: Platform.OS === 'ios' ? 14 : 13,
    lineHeight: Platform.OS === 'ios' ? 18 : 17,
    letterSpacing: -0.01,
    color: COLORS.ACCENT,
  },
});

// Re-export with old name for backwards compatibility during migration
/** @deprecated Use LandingScreen instead */
export const LoadingScreen = LandingScreen;
