import React, { useEffect } from 'react';
import { View, Text, Image, Pressable, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
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
          {/* Get Started Button - positioned as in Figma */}
          <Pressable style={styles.getStartedButton} onPress={onGetStarted}>
            <LinearGradient
              colors={['#FF7903', '#FEA04D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.getStartedButtonText}>Ready? Start now</Text>
            </LinearGradient>
          </Pressable>

          {/* Social Login Buttons - positioned as in Figma */}
          <View style={styles.socialContainer}>
            <SocialButton type="facebook" onPress={() => {}} />
            <SocialButton type="google" onPress={() => {}} />
            <SocialButton type="apple" onPress={() => {}} />
          </View>

          {/* Login Link - positioned as in Figma */}
          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginLinkText}>Already have an account? </Text>
            <Pressable onPress={onLogin}>
              <Text style={styles.loginLinkButton}>Log in</Text>
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
    height: 120, // Much more extended height
    left: 0,
    bottom: 0, // Keeps it anchored to bottom
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -20 },
    shadowOpacity: 0.25,
    shadowRadius: 80,
    elevation: 20,
  },
  getStartedButton: {
    position: 'absolute' as const,
    width: 199,
    height: 36,
    left: screenWidth * 0.03,
    top: 30, // Adjusted for new container height
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
    paddingVertical: 4,
    paddingHorizontal: 36,
  },
  getStartedButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600' as const,
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  socialContainer: {
    position: 'absolute' as const,
    width: 156,
    height: 48,
    right: screenWidth * 0.05,
    top: 24, // Adjusted for new container height
    flexDirection: 'row' as const,
    gap: 6,
  },
  loginLinkContainer: {
    position: 'absolute' as const,
    width: screenWidth * 0.8,
    height: 17,
    left: screenWidth * 0.1,
    top: 100, // Adjusted for new container height
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  loginLinkText: {
    fontFamily: 'Inter',
    fontWeight: '500' as const,
    fontSize: 12,
    lineHeight: 17, // 140% of 12px
    letterSpacing: -0.01,
    color: '#6C7278',
  },
  loginLinkButton: {
    fontFamily: 'Inter',
    fontWeight: '600' as const,
    fontSize: 12,
    lineHeight: 17, // 140% of 12px
    letterSpacing: -0.01,
    textDecorationLine: 'underline' as const,
    color: '#FEBC2F',
  },
};