import React, { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { LandingScreen, SplashScreen } from '@/src/features/auth';
import { Animated } from 'react-native';
import { authClient } from '@/lib/auth-client';
import { AuthStorage } from '@/src/core/storage';
import { toast } from 'sonner-native';

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
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleGetStarted = () => {
    router.push('/register');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleSocialLogin = async (provider: 'facebook' | 'google' | 'apple') => {
    // Prevent double-clicks while OAuth is in progress
    if (isSocialLoading) return;

    try {
      setIsSocialLoading(true);
      // TODO: Social Login Configuration Status
      // ✅ Google OAuth - Configured and working
      // ❌ Facebook Login - Needs configuration:
      //    1. Create Facebook App at https://developers.facebook.com
      //    2. Add Facebook Login product
      //    3. Configure OAuth redirect URIs (deuceleague://oauth/facebook)
      //    4. Add Facebook App ID/Secret to Better Auth config
      //    5. Test on iOS and Android (requires native SDK setup)
      // ❌ Apple Sign-In - Needs configuration:
      //    1. Enable Sign in with Apple capability in Apple Developer Console
      //    2. Create Service ID for web authentication
      //    3. Configure OAuth redirect URIs
      //    4. Add Apple credentials to Better Auth config
      //    5. Required for iOS App Store (if other social logins are offered)
      if (provider !== 'google') {
        toast.info(`${provider.charAt(0).toUpperCase() + provider.slice(1)} sign-in coming soon!`);
        return;
      }

      console.log(`Landing page: Social login with ${provider}`);

      // Mark that user has interacted with auth (so they see login screen on return, not landing)
      await AuthStorage.markLoggedIn();

      const result = await authClient.signIn.social({
        provider,
        callbackURL: '/onboarding/personal-info', // New users from landing go to onboarding
      });

      console.log('Social login result:', result);

      if (result.error) {
        console.error('Social login failed:', result.error);
        toast.error(result.error.message || 'Social login failed. Please try again.');
      }
      // Success handling is done via the callbackURL redirect
    } catch (error: any) {
      console.error('Social login error:', error);
      toast.error(error.message || 'Social login failed. Please try again.');
    } finally {
      setIsSocialLoading(false);
    }
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
      <LandingScreen
        onGetStarted={handleGetStarted}
        onLogin={handleLogin}
        onSocialLogin={handleSocialLogin}
      />
    </Animated.View>
  );
}
