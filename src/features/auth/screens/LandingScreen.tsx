import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Image, Pressable, Dimensions, Platform, StyleSheet, AppState } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { SocialButton } from '../components/AuthComponents';
import DeuceLogo from '../../onboarding/components/DeuceLogo';
import DeuceSvg from '@/assets/images/DEUCE.svg';

// Base width for scaling (iPhone 6/7/8 reference)
const BASE_WIDTH = 375;

// Device breakpoints
const BREAKPOINTS = {
  SMALL_PHONE: 360,
  TABLET: 768,
} as const;

// Layout constants - percentages of screen
const LAYOUT = {
  LOGO_TOP_POSITION: 0.15,
  TAGLINE_TOP_POSITION: 0.73,
  TAGLINE_WIDTH: 0.8,
  TAGLINE_LEFT_MARGIN: 0.07,
  CTA_BUTTON_MAX_WIDTH: 0.55,
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

// Responsive scaling helper - scales based on screen width with tablet cap
const createScaler = (screenWidth: number) => {
  const scaleRatio = screenWidth / BASE_WIDTH;
  // Cap scaling at 1.4x for tablets to prevent oversized elements
  const cappedRatio = Math.min(scaleRatio, 1.4);

  return {
    // Standard scale for most elements
    scale: (size: number) => Math.round(size * cappedRatio),
    // Moderate scale for elements that shouldn't grow too much (factor 0-1)
    moderateScale: (size: number, factor: number = 0.5) => {
      const scaledSize = Math.round(size * cappedRatio);
      return Math.round(size + (scaledSize - size) * factor);
    },
    // Check device type
    isSmallPhone: screenWidth < BREAKPOINTS.SMALL_PHONE,
    isTablet: screenWidth >= BREAKPOINTS.TABLET,
  };
};

// Get responsive logo sizes based on screen width
const getResponsiveLogoSizes = (screenWidth: number) => {
  const { scale, moderateScale } = createScaler(screenWidth);

  return {
    // DEUCE text SVG - scales with screen but moderate for tablets
    deuceSvg: {
      width: moderateScale(260, 0.6),
      height: moderateScale(94, 0.6),
    },
    // Logo icon - slightly smaller scaling
    deuceLogo: {
      width: moderateScale(100, 0.5),
      height: moderateScale(100, 0.5),
    },
    // Tagline font - moderate scaling
    taglineFontSize: moderateScale(22, 0.4),
    taglineLineHeight: moderateScale(29, 0.4),
    // Button text - minimal scaling
    buttonFontSize: moderateScale(Platform.OS === 'ios' ? 16 : 15, 0.3),
    buttonLineHeight: moderateScale(Platform.OS === 'ios' ? 20 : 18, 0.3),
    // Link text - minimal scaling
    linkFontSize: moderateScale(Platform.OS === 'ios' ? 14 : 13, 0.3),
    linkLineHeight: moderateScale(Platform.OS === 'ios' ? 18 : 17, 0.3),
    // Spacing
    logoMarginBottom: scale(20),
    // Button height - moderate scaling
    buttonHeight: moderateScale(Platform.OS === 'ios' ? 44 : 40, 0.4),
    // Bottom container min height
    bottomContainerMinHeight: moderateScale(Platform.OS === 'ios' ? 140 : 120, 0.3),
  };
};

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

  // Compute responsive sizes based on current screen width
  const responsiveSizes = useMemo(
    () => getResponsiveLogoSizes(screenWidth),
    [screenWidth]
  );

  const dynamicStyles = useMemo(
    () => getStyles(screenWidth, screenHeight, insets.bottom, responsiveSizes),
    [screenWidth, screenHeight, insets.bottom, responsiveSizes]
  );

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
            <DeuceSvg
              width={responsiveSizes.deuceSvg.width}
              height={responsiveSizes.deuceSvg.height}
            />
          </View>
          <View style={dynamicStyles.logoShadowContainer}>
            <DeuceLogo
              width={responsiveSizes.deuceLogo.width}
              height={responsiveSizes.deuceLogo.height}
            />
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

type ResponsiveSizes = ReturnType<typeof getResponsiveLogoSizes>;

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  bottomInset: number,
  sizes: ResponsiveSizes
) => StyleSheet.create({
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
    marginBottom: sizes.logoMarginBottom,
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
    fontSize: sizes.taglineFontSize,
    lineHeight: sizes.taglineLineHeight,
    letterSpacing: -0.01,
    color: COLORS.TAGLINE,
  },
  bottomContainer: {
    position: 'absolute',
    width: screenWidth,
    minHeight: sizes.bottomContainerMinHeight,
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
    height: sizes.buttonHeight,
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
    fontSize: sizes.buttonFontSize,
    lineHeight: sizes.buttonLineHeight,
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
    fontSize: sizes.linkFontSize,
    lineHeight: sizes.linkLineHeight,
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
    fontSize: sizes.linkFontSize,
    lineHeight: sizes.linkLineHeight,
    letterSpacing: -0.01,
    color: COLORS.ACCENT,
  },
});

// Re-export with old name for backwards compatibility during migration
/** @deprecated Use LandingScreen instead */
export const LoadingScreen = LandingScreen;
