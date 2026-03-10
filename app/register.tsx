import React, { useState } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SignUpScreen, SignUpData } from '@/src/features/auth/screens/SignUpScreen';
import { authClient } from '@/lib/auth-client';
import { signInWithApple } from '@/lib/apple-signin';
import { signInWithGoogle } from '@/lib/google-signin';
import axiosInstance, { endpoints } from '@/lib/endpoints';
import * as SecureStore from 'expo-secure-store';
import { toast } from 'sonner-native';
import { AuthStorage } from '@/src/core/storage';
import { useEmailVerificationStore } from '@/src/stores/emailVerificationStore';

// Store session token AND session data in SecureStore (same format as Better Auth Expo client)
// This ensures useSession() works properly without needing to fetch from server
const storeSessionWithData = async (
  sessionToken: string,
  user: any,
  session: any
) => {
  const sessionData = {
    session: {
      session: session,
      user: user,
      updatedAt: Date.now(),
      version: "1",
    },
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes cache
    signature: "manual",
  };

  const encodedSessionData = btoa(JSON.stringify(sessionData));
  const cookieValue = `better-auth.session_token=${sessionToken}; better-auth.session_data=${encodedSessionData}`;

  await SecureStore.setItemAsync("deuceleague_cookie", cookieValue);
  console.log("✅ Session token and data stored in SecureStore");
};

export default function RegisterRoute() {
  const router = useRouter();
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const { setEmail: storeEmail } = useEmailVerificationStore();

  const handleSignUp = async (data: SignUpData) => {
    try {
      if (__DEV__) {
        console.log('📱 Register Route - Received signup data:', {
          email: data.email,
          username: data.username,
          password: '***'
        });
      }

      const signupPayload = {
        email: data.email,
        password: data.password,
        name: data.username,
        username: data.username,
        phoneNumber: '',
      };

      if (__DEV__) {
        console.log('📤 Register Route:', {
          ...signupPayload,
          password: '***'
        });
      }

      // Better Auth returns { data, error } - must check error explicitly
      const result = await authClient.signUp.email(signupPayload);

      if (__DEV__) {
        console.log('📥 Register Route - Signup result:', {
          hasData: !!result.data,
          hasError: !!result.error,
          error: result.error
        });
      }

      // Check for errors (including duplicate email)
      if (result.error) {
        if (__DEV__) console.error('Sign up error:', result.error);
        const errorMessage = result.error.message || 'Sign up failed';
        // Handle specific error cases
        if (errorMessage.toLowerCase().includes('email') &&
            (errorMessage.toLowerCase().includes('exist') || errorMessage.toLowerCase().includes('already'))) {
          toast.error('This email is already registered. Please login instead.');
        } else if (errorMessage.toLowerCase().includes('username') &&
                   (errorMessage.toLowerCase().includes('exist') || errorMessage.toLowerCase().includes('taken'))) {
          toast.error('This username is already taken. Please choose another.');
        } else {
          toast.error(errorMessage);
        }
        return;
      }

      // Mark that user has registered (so they see login screen on return, not landing)
      await AuthStorage.markLoggedIn();

      // Note: better-auth automatically sends verification email during signup
      // via the sendVerificationOTP callback configured in auth.ts
      if (__DEV__) console.log('✅ Register Route - Account created, verification email sent automatically by better-auth');

      toast.success('Account created! Please check your email to verify.');
      // Store email securely (not in URL) and navigate
      storeEmail(data.email);
      router.push('/verifyEmail');
    } catch (error) {
      if (__DEV__) console.error('Sign up failed:', error);
      toast.error('Sign up failed. Please try again.');
    }
  };

  const handleLogin = () => {
    router.replace('/login');
  };

  const handleSocialSignUp = async (provider: 'google' | 'apple') => {
    // Prevent double-clicks while OAuth is in progress
    if (isSocialLoading) return;

    try {
      setIsSocialLoading(true);

      // Apple Sign-In (iOS only)
      if (provider === 'apple') {
        if (Platform.OS !== 'ios') {
          toast.info('Apple Sign-In is only available on iOS');
          return;
        }

        console.log('🍎 Starting Apple Sign-In from register...');

        const appleResult = await signInWithApple();

        if (!appleResult.success) {
          console.error('Apple Sign-In failed:', appleResult.error);
          toast.error(appleResult.error || 'Apple sign-in failed');
          return;
        }

        console.log('✅ Apple Sign-In successful, authenticating with backend...');

        const response = await axiosInstance.post(endpoints.auth.appleNative, {
          identityToken: appleResult.identityToken,
          fullName: appleResult.user?.fullName,
          email: appleResult.user?.email,
        });

        if (response.data?.success && response.data.data?.sessionToken) {
          console.log('✅ Backend authentication successful');

          // Store session token AND session data for better-auth compatibility
          await storeSessionWithData(
            response.data.data.sessionToken,
            response.data.data.user,
            response.data.data.session
          );
          await AuthStorage.markLoggedIn();

          // Force better-auth to refresh its internal session state
          const sessionResult = await authClient.getSession();
          if (sessionResult?.data?.session) {
            console.log('✅ Session state refreshed - user:', sessionResult.data.user?.id);
          } else {
            console.warn('⚠️ getSession() returned no session - this may cause issues');
          }

          try {
            await axiosInstance.put(endpoints.user.trackLogin);
          } catch (trackErr) {
            console.error('Failed to track login:', trackErr);
          }

          // New users go to onboarding
          if (response.data.data?.isNewUser) {
            router.replace('/onboarding/personal-info');
          } else {
            router.replace('/user-dashboard');
          }
        } else {
          toast.error(response.data?.message || 'Authentication failed');
        }
        return;
      }

      // Google Sign-In (iOS and Android)
      console.log('🔐 Starting native Google Sign-In from register...');

      const googleResult = await signInWithGoogle();

      if (!googleResult.success) {
        console.error('Google Sign-In failed:', googleResult.error);
        toast.error(googleResult.error || 'Google sign-in failed');
        return;
      }

      console.log('✅ Google Sign-In successful, authenticating with backend...');

      const response = await axiosInstance.post(endpoints.auth.googleNative, {
        idToken: googleResult.idToken,
      });

      if (response.data?.success && response.data.data?.sessionToken) {
        console.log('✅ Backend authentication successful');

        // Store session token AND session data for better-auth compatibility
        await storeSessionWithData(
          response.data.data.sessionToken,
          response.data.data.user,
          response.data.data.session
        );
        await AuthStorage.markLoggedIn();

        // Force better-auth to refresh its internal session state
        const sessionResult = await authClient.getSession();
        if (sessionResult?.data?.session) {
          console.log('✅ Session state refreshed - user:', sessionResult.data.user?.id);
        } else {
          console.warn('⚠️ getSession() returned no session - this may cause issues');
        }

        try {
          await axiosInstance.put(endpoints.user.trackLogin);
        } catch (trackErr) {
          console.error('Failed to track login:', trackErr);
        }

        // New users go to onboarding
        if (response.data.data?.isNewUser) {
          router.replace('/onboarding/personal-info');
        } else {
          router.replace('/user-dashboard');
        }
      } else {
        toast.error(response.data?.message || 'Authentication failed');
      }
    } catch (error: any) {
      console.error('Social sign-up error:', error);
      toast.error(error.message || 'Social sign-up failed. Please try again.');
    } finally {
      setIsSocialLoading(false);
    }
  };

  return (
    <SignUpScreen
      onSignUp={handleSignUp}
      onLogin={handleLogin}
      onSocialSignUp={handleSocialSignUp}
    />
  );
}