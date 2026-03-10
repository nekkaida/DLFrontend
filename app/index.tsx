import { signInWithNativeOAuth } from "@/lib/native-social-auth";
import { LandingScreen, SplashScreen } from "@/src/features/auth";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Animated } from "react-native";
import { toast } from "sonner-native";

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
    router.push("/register");
  };

  const handleLogin = () => {
    router.push("/login");
  };

  const handleSocialLogin = async (
    provider: "google" | "apple",
  ) => {
    if (isSocialLoading) return;

    try {
      setIsSocialLoading(true);
      const result = await signInWithNativeOAuth(provider);
      if (result) {
        router.replace(result.nextRoute);
      }
    } catch (error: any) {
      console.error("Social login error:", error);
      toast.error(error.message || "Social login failed. Please try again.");
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
