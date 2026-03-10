import { authClient, useSession } from "@/lib/auth-client";
import { signInWithApple } from "@/lib/apple-signin";
import axiosInstance, { endpoints } from "@/lib/endpoints";
import { signInWithGoogle } from "@/lib/google-signin";
import { AuthStorage } from "@/src/core/storage";
import { LoginScreen } from "@/src/features/auth/screens/LoginScreen";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
import { toast } from "sonner-native";

// Store session token AND session data in SecureStore (same format as Better Auth Expo client)
// This ensures useSession() works properly without needing to fetch from server
const storeSessionWithData = async (
  sessionToken: string,
  user: any,
  session: any
) => {
  // Build session_data cache that better-auth's expo client expects
  const sessionData = {
    session: {
      session: session,
      user: user,
      updatedAt: Date.now(),
      version: "1",
    },
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes cache
    signature: "manual", // Placeholder signature
  };

  const encodedSessionData = btoa(JSON.stringify(sessionData));
  const cookieValue = `better-auth.session_token=${sessionToken}; better-auth.session_data=${encodedSessionData}`;

  await SecureStore.setItemAsync("deuceleague_cookie", cookieValue);
  console.log("✅ Session token and data stored in SecureStore");
};

export default function LoginRoute() {
  const router = useRouter();
  const navigation = useNavigation();
  const { data: session } = useSession();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const [isSocialLoading, setIsSocialLoading] = useState(false);

  // Conditionally enable gesture navigation:
  // - Allow swipe back when coming from landing page (from=landing)
  // - Disable swipe back after logout to prevent accessing protected pages
  useEffect(() => {
    const allowGesture = from === "landing";
    navigation.setOptions({
      gestureEnabled: allowGesture,
    });
  }, [from, navigation]);

  const handleLogin = async (emailOrUsername: string, password: string) => {
    try {
      console.log("Login attempt with:", emailOrUsername);

      const isEmail = emailOrUsername.includes("@");

      let result;
      if (isEmail) {
        console.log("Attempting email login");
        result = await authClient.signIn.email({
          email: emailOrUsername,
          password: password,
        });
      } else {
        console.log("Attempting username login");
        result = await authClient.signIn.username({
          username: emailOrUsername,
          password: password,
        });
      }

      // console.log("Login result:", result);

      if (result.data?.user?.id) {
        console.log("Login successful, tracking last login...");

        // Update Last Login
        try {
          console.log("📤 Sending trackLogin request");
          const trackResponse = await axiosInstance.put(
            endpoints.user.trackLogin,
          );
          console.log(
            "✅ Last login tracked successfully:",
            trackResponse.data,
          );
        } catch (trackErr: any) {
          console.error("❌ Failed to track last login:", trackErr.message);
          if (trackErr.response) {
            console.error("❌ Response status:", trackErr.response.status);
            console.error("❌ Response data:", trackErr.response.data);
          }
        }

        // signIn() already stores the cookie synchronously via the expo client's
        // onSuccess hook, and useSession() will detect the change via $sessionSignal.
        // No need to poll getSession() — navigate immediately.
        await AuthStorage.markLoggedIn();
        router.replace("/user-dashboard");
        return;
      } else {
        console.error("Login failed:", result.error);
        toast.error(result.error?.message || "Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Login failed. Please try again.");
    }
  };

  const handleSignUp = () => {
    router.replace("/register");
  };

  const handleForgotPassword = () => {
    router.push("/resetPassword");
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

        console.log("🍎 Starting Apple Sign-In...");

        const appleResult = await signInWithApple();

        if (!appleResult.success) {
          console.error("Apple Sign-In failed:", appleResult.error);
          toast.error(appleResult.error || "Apple sign-in failed");
          return;
        }

        console.log("✅ Apple Sign-In successful, authenticating with backend...");

        // Send identity token to backend for verification and session creation
        const response = await axiosInstance.post(endpoints.auth.appleNative, {
          identityToken: appleResult.identityToken,
          fullName: appleResult.user?.fullName,
          email: appleResult.user?.email,
        });

        if (response.data?.success && response.data.data?.sessionToken) {
          console.log("✅ Backend authentication successful");

          // Store session token AND session data for better-auth compatibility
          await storeSessionWithData(
            response.data.data.sessionToken,
            response.data.data.user,
            response.data.data.session
          );
          await AuthStorage.markLoggedIn();

          // Force better-auth to refresh its internal session state
          // This ensures useSession() sees the new session immediately
          const sessionResult = await authClient.getSession();
          if (sessionResult?.data?.session) {
            console.log("✅ Session state refreshed - user:", sessionResult.data.user?.id);
          } else {
            console.warn("⚠️ getSession() returned no session - this may cause issues");
          }

          try {
            await axiosInstance.put(endpoints.user.trackLogin);
          } catch (trackErr) {
            console.error("Failed to track login:", trackErr);
          }

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
      console.log("🔐 Starting native Google Sign-In...");

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

        // Store session token AND session data for better-auth compatibility
        await storeSessionWithData(
          response.data.data.sessionToken,
          response.data.data.user,
          response.data.data.session
        );
        await AuthStorage.markLoggedIn();

        // Force better-auth to refresh its internal session state
        // This ensures useSession() sees the new session immediately
        const sessionResult = await authClient.getSession();
        if (sessionResult?.data?.session) {
          console.log("✅ Session state refreshed - user:", sessionResult.data.user?.id);
        } else {
          console.warn("⚠️ getSession() returned no session - this may cause issues");
        }

        // Track login
        try {
          await axiosInstance.put(endpoints.user.trackLogin);
        } catch (trackErr) {
          console.error("Failed to track login:", trackErr);
        }

        // Navigate based on whether user is new
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

  return (
    <LoginScreen
      onLogin={handleLogin}
      onSignUp={handleSignUp}
      onForgotPassword={handleForgotPassword}
      onSocialLogin={handleSocialLogin}
    />
  );
}
