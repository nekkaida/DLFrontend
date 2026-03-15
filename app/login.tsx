import { authClient } from "@/lib/auth-client";
import axiosInstance, { endpoints } from "@/lib/endpoints";
import { signInWithNativeOAuth } from "@/lib/native-social-auth";
import { getPostAuthRoute } from "@/lib/post-auth-route";
import { AuthStorage } from "@/src/core/storage";
import { LoginScreen } from "@/src/features/auth/screens/LoginScreen";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { toast } from "sonner-native";

export default function LoginRoute() {
  const router = useRouter();
  const navigation = useNavigation();
  const { from } = useLocalSearchParams<{ from?: string }>();

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
      if (__DEV__) console.log("Login attempt with:", emailOrUsername);

      const isEmail = emailOrUsername.includes("@");

      let result;
      if (isEmail) {
        if (__DEV__) console.log("Attempting email login");
        result = await authClient.signIn.email({
          email: emailOrUsername,
          password: password,
        });
      } else {
        if (__DEV__) console.log("Attempting username login");
        result = await authClient.signIn.username({
          username: emailOrUsername,
          password: password,
        });
      }

      // console.log("Login result:", result);

      if (result.data?.user?.id) {
        if (__DEV__) console.log("Login successful, tracking last login...");

        // Update Last Login
        try {
          if (__DEV__) console.log("📤 Sending trackLogin request");
          const trackResponse = await axiosInstance.put(
            endpoints.user.trackLogin,
          );
          if (__DEV__) console.log("✅ Last login tracked successfully:", trackResponse.data);
        } catch (trackErr: any) {
          if (__DEV__) {
            console.error("❌ Failed to track last login:", trackErr.message);
            if (trackErr.response) {
              console.error("❌ Response status:", trackErr.response.status);
              console.error("❌ Response data:", trackErr.response.data);
            }
          }
        }

        // signIn() already stores the cookie synchronously via the expo client's
        // onSuccess hook, and useSession() will detect the change via $sessionSignal.
        // No need to poll getSession() — navigate immediately.
        await AuthStorage.markLoggedIn();
        const nextRoute = getPostAuthRoute({ user: result.data.user as any });
        router.replace(nextRoute as any);
        return;
      } else {
        if (__DEV__) console.error("Login failed:", result.error);
        const errorMsg = result.error?.message?.toLowerCase() || "";

        // LI-18: Detect unverified email and offer path to verification
        if (errorMsg.includes("not verified") || errorMsg.includes("email verification")) {
          toast.error("Email not verified", {
            description: "Please check your inbox for the verification email.",
          });
          router.push({ pathname: "/verifyEmail", params: { email: emailOrUsername, source: "login" } } as any);
          return;
        }

        // LI-11: Detect rate limiting (429) and show specific message
        if (errorMsg.includes("too many") || (result.error as any)?.status === 429) {
          toast.error("Too many login attempts", {
            description: "Please wait a few minutes before trying again.",
          });
          return;
        }

        toast.error(result.error?.message || "Login failed. Please try again.");
      }
    } catch (error) {
      if (__DEV__) console.error("Login failed:", error);
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
    // signInWithNativeOAuth handles all errors internally and returns null on failure
    const result = await signInWithNativeOAuth(provider);
    if (result) {
      router.replace(result.nextRoute);
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
