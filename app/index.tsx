import { signInWithApple } from "@/lib/apple-signin";
import axiosInstance, { endpoints } from "@/lib/endpoints";
import { signInWithGoogle } from "@/lib/google-signin";
import { AuthStorage } from "@/src/core/storage";
import { LandingScreen, SplashScreen } from "@/src/features/auth";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useRef, useState } from "react";
import { Animated, Platform } from "react-native";
import { toast } from "sonner-native";

// Store session token in SecureStore (same format as Better Auth Expo client)
const storeSessionToken = async (sessionToken: string) => {
  const cookieValue = `better-auth.session_token=${sessionToken}`;
  await SecureStore.setItemAsync("deuceleague_cookie", cookieValue);
  console.log("✅ Session token stored in SecureStore");
};

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
    // Prevent double-clicks while OAuth is in progress
    if (isSocialLoading) return;

    try {
      setIsSocialLoading(true);

      // Apple Sign-In (iOS only)
      if (provider === "apple") {
        if (Platform.OS !== "ios") {
          toast.info("Apple Sign-In is only available on iOS");
          return;
        }

        console.log("🍎 Starting Apple Sign-In from landing...");

        const appleResult = await signInWithApple();

        if (!appleResult.success) {
          console.error("Apple Sign-In failed:", appleResult.error);
          toast.error(appleResult.error || "Apple sign-in failed");
          return;
        }

        console.log("✅ Apple Sign-In successful, authenticating with backend...");

        const response = await axiosInstance.post(endpoints.auth.appleNative, {
          identityToken: appleResult.identityToken,
          fullName: appleResult.user?.fullName,
          email: appleResult.user?.email,
        });

        if (response.data?.success && response.data.data?.sessionToken) {
          console.log("✅ Backend authentication successful");

          await storeSessionToken(response.data.data.sessionToken);
          await AuthStorage.markLoggedIn();

          try {
            await axiosInstance.put(endpoints.user.trackLogin);
          } catch (trackErr) {
            console.error("Failed to track login:", trackErr);
          }

          // New users from landing always go to onboarding
          if (response.data.data?.isNewUser) {
            router.replace("/onboarding/personal-info");
          } else {
            router.replace("/user-dashboard");
          }
        } else {
          toast.error(response.data?.message || "Authentication failed");
        }
        return;
      }

      // Google Sign-In (iOS and Android)
      console.log("🔐 Starting native Google Sign-In from landing...");

      const googleResult = await signInWithGoogle();

      if (!googleResult.success) {
        console.error("Google Sign-In failed:", googleResult.error);
        toast.error(googleResult.error || "Google sign-in failed");
        return;
      }

      console.log("✅ Google Sign-In successful, authenticating with backend...");

      // Send ID token to backend for verification and session creation
      const response = await axiosInstance.post(endpoints.auth.googleNative, {
        idToken: googleResult.idToken,
      });

      if (response.data?.success && response.data.data?.sessionToken) {
        console.log("✅ Backend authentication successful");

        // Store session token in SecureStore for Better Auth compatibility
        await storeSessionToken(response.data.data.sessionToken);
        await AuthStorage.markLoggedIn();

        // Track login
        try {
          await axiosInstance.put(endpoints.user.trackLogin);
        } catch (trackErr) {
          console.error("Failed to track login:", trackErr);
        }

        // New users from landing always go to onboarding
        if (response.data.data?.isNewUser) {
          router.replace("/onboarding/personal-info");
        } else {
          router.replace("/user-dashboard");
        }
      } else {
        toast.error(response.data?.message || "Authentication failed");
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
