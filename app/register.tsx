import React from 'react';
import { useRouter } from 'expo-router';
import { SignUpScreen, SignUpData } from '@/src/features/auth/screens/SignUpScreen';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner-native';

export default function RegisterRoute() {
  const router = useRouter();

  const handleSignUp = async (data: SignUpData) => {
    try {
      await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.username,
      });
      toast.success('Account created! Please check your email to verify.');
      router.push('/verifyEmail');
    } catch (error) {
      console.error('Sign up failed:', error);
      toast.error('Sign up failed. Please try again.');
    }
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleSocialSignUp = (provider: 'facebook' | 'google' | 'apple') => {
    // TODO: Implement social sign up
    toast.info(`${provider} sign up coming soon!`);
  };

  return (
    <SignUpScreen
      onSignUp={handleSignUp}
      onLogin={handleLogin}
      onSocialSignUp={handleSocialSignUp}
    />
  );
}