import React from 'react';
import { useRouter } from 'expo-router';
import { LoginScreen } from '@/src/features/auth/screens/LoginScreen';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner-native';

export default function LoginRoute() {
  const router = useRouter();

  const handleLogin = async (data: { email: string; password: string }) => {
    try {
      await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });
      router.replace('/user-dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Login failed. Please try again.');
    }
  };

  const handleSignUp = () => {
    router.push('/register');
  };

  const handleForgotPassword = () => {
    router.push('/resetPassword');
  };

  return (
    <LoginScreen
      onLogin={handleLogin}
      onSignUp={handleSignUp}
      onForgotPassword={handleForgotPassword}
    />
  );
}