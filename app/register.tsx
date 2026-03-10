import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { SignUpScreen, SignUpData } from '@/src/features/auth/screens/SignUpScreen';
import { authClient } from '@/lib/auth-client';
import { signInWithNativeOAuth } from '@/lib/native-social-auth';
import { toast } from 'sonner-native';
import { AuthStorage } from '@/src/core/storage';
import { useEmailVerificationStore } from '@/src/stores/emailVerificationStore';

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
    if (isSocialLoading) return;

    try {
      setIsSocialLoading(true);
      const result = await signInWithNativeOAuth(provider);
      if (result) {
        router.replace(result.nextRoute);
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
