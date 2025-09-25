import React, { useEffect } from 'react';
import { View, Text, Image, Pressable, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { SocialButton } from '../components/AuthComponents';
import { AuthStyles, AuthColors } from '../styles/AuthStyles';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface LoadingScreenProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onGetStarted, onLogin }) => {
  return (
    <View style={styles.container}>
      {/* Main Loading Page Container - Phone frame */}
      <View style={styles.loadingPage}>
        {/* Background Image */}
        <Image
          source={require('@/assets/images/splash.png')}
          style={styles.backgroundImage}
        />

        {/* Cross-platform Status Bar */}
        <StatusBar style="light" backgroundColor="transparent" />

        {/* Logo positioned exactly as in Figma */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>DEUCE</Text>
        </View>

        {/* Tagline positioned exactly as in Figma */}
        <Text style={styles.taglineText}>
          Your ultimate{'\n'}flex league platform...
        </Text>

        {/* Bottom Container with white background and shadow */}
        <View style={styles.bottomContainer}>
          {/* Top Row: Get Started Button and Social Buttons */}
          <View style={styles.topRow}>
            <Pressable 
              style={styles.getStartedButton} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onGetStarted();
              }}
            >
              <LinearGradient
                colors={['#FF7903', '#FEA04D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.getStartedButtonText} numberOfLines={1}>Ready? Start now</Text>
              </LinearGradient>
            </Pressable>

            {/* Social Login Buttons */}
            <View style={styles.socialContainer}>
              <SocialButton type="facebook" onPress={() => {}} />
              <SocialButton type="google" onPress={() => {}} />
              <SocialButton type="apple" onPress={() => {}} />
            </View>
          </View>

          {/* Login Link */}
          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginLinkText}>Already have an account? </Text>
            <Pressable 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onLogin();
              }} 
              style={styles.loginLinkButton}
            >
              <Text style={styles.loginLinkButtonText}>Log in</Text>
            </Pressable>
          </View>
        </View>

        {/* Home Indicator - Hidden to avoid black bar */}
      </View>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    width: screenWidth,
    height: screenHeight,
    backgroundColor: '#000000', // Changed to black to hide any gaps
  },
  loadingPage: {
    flex: 1,
    width: screenWidth,
    height: screenHeight,
    backgroundColor: 'transparent',
    overflow: 'hidden' as const,
  },
  backgroundImage: {
    position: 'absolute' as const,
    width: screenWidth,
    height: screenHeight,
    left: 0,
    top: 0,
    resizeMode: 'cover' as const,
  },
  logoContainer: {
    position: 'absolute' as const,
    width: 166,
    height: 80,
    left: screenWidth * 0.09, // Responsive left positioning
    top: screenHeight * 0.25, // Responsive top positioning
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
  },
  logoText: {
    fontFamily: Platform.OS === 'ios' ? 'IBM Plex Sans' : 'sans-serif-medium',
    fontStyle: 'italic' as const,
    fontWeight: '700' as const,
    fontSize: 48,
    lineHeight: 60, // Fixed: increased from 14 to prevent cutting
    letterSpacing: 3.5,
    color: '#FEA04D',
  },
  taglineText: {
    position: 'absolute' as const,
    width: screenWidth * 0.8,
    height: 58,
    left: screenWidth * 0.07,
    top: screenHeight * 0.76, // Responsive positioning
    fontFamily: 'Poppins',
    fontStyle: 'italic' as const,
    fontWeight: '500' as const,
    fontSize: 22,
    lineHeight: 29,
    letterSpacing: -0.01,
    color: '#C7C7C7',
  },
  bottomContainer: {
    position: 'absolute' as const,
    width: screenWidth,
    minHeight: Platform.OS === 'ios' ? 140 : 120, // More height on iOS for better touch targets
    left: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -20 },
    shadowOpacity: 0.25,
    shadowRadius: 80,
    elevation: 20,
    paddingHorizontal: screenWidth * 0.05, // Add horizontal padding
    paddingTop: Platform.OS === 'ios' ? 20 : 15, // More padding on iOS
    paddingBottom: Platform.OS === 'ios' ? 20 : 15, // Safe area padding
    justifyContent: 'space-between' as const,
  },
  topRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: Platform.OS === 'ios' ? 20 : 15, // More spacing on iOS
  },
  getStartedButton: {
    flex: 1, // Take available space
    maxWidth: screenWidth * 0.55, // Don't exceed 55% of screen width
    height: Platform.OS === 'ios' ? 44 : 40, // Larger touch target on iOS
    marginRight: 10, // Space between button and social icons
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    paddingHorizontal: 16,
  },
  getStartedButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600' as const,
    fontSize: Platform.OS === 'ios' ? 16 : 15, // Slightly smaller on Android
    lineHeight: Platform.OS === 'ios' ? 20 : 18,
    color: '#FFFFFF',
    textAlign: 'center' as const,
    flexShrink: 1,
  },
  socialContainer: {
    flexDirection: 'row' as const,
    gap: Platform.OS === 'ios' ? 8 : 6, // More spacing on iOS
    alignItems: 'center' as const,
  },
  loginLinkContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4, // More padding on iOS for better touch
    minHeight: Platform.OS === 'ios' ? 32 : 24, // Larger touch target on iOS
  },
  loginLinkText: {
    fontFamily: 'Inter',
    fontWeight: '500' as const,
    fontSize: Platform.OS === 'ios' ? 13 : 12,
    lineHeight: Platform.OS === 'ios' ? 18 : 17,
    letterSpacing: -0.01,
    color: '#6C7278',
  },
  loginLinkButton: {
    paddingVertical: Platform.OS === 'ios' ? 4 : 2, // Touch target padding
    paddingHorizontal: Platform.OS === 'ios' ? 4 : 2,
  },
  loginLinkButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600' as const,
    fontSize: Platform.OS === 'ios' ? 13 : 12,
    lineHeight: Platform.OS === 'ios' ? 18 : 17,
    letterSpacing: -0.01,
    textDecorationLine: 'underline' as const,
    color: '#FEBC2F',
  },
};