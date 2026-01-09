import React, { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { LoadingScreen, SplashScreen } from '@/src/features/auth';
import { Animated } from 'react-native';

/**
 * Landing Page (index.tsx)
 *
 * This is the entry point of the app. It shows:
 * 1. Splash screen (1.5s animation)
 * 2. Landing page with "Get Started" and "Login" buttons
 *
 * Navigation logic is handled by NavigationInterceptor:
 * - First-time users see this landing page
 * - Returning logged-out users are redirected to /login
 * - Authenticated users are redirected to dashboard/onboarding
 */
export default function LandingPage() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleGetStarted = () => {
    // First-time user wants to create an account
    router.push('/register');
  };

  const handleLogin = () => {
    // User wants to log in to existing account
    router.push('/login');
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <LoadingScreen
        onGetStarted={handleGetStarted}
        onLogin={handleLogin}
      />
    </Animated.View>
  );
}
