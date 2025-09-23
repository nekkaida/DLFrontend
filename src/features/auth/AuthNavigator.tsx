import React, { useState } from 'react';
import { View } from 'react-native';
import {
  LoadingScreen,
  LoginScreen,
  SignUpScreen,
  VerificationScreen,
  SignUpData,
} from './index';

type AuthScreen = 'loading' | 'login' | 'signup' | 'verification';

/**
 * Example Authentication Navigator
 *
 * This demonstrates how to use the authentication screens together.
 * In a real app, you would integrate this with your navigation library
 * (React Navigation, Expo Router, etc.) and authentication logic.
 */
export const AuthNavigator: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('loading');
  const [verificationEmail, setVerificationEmail] = useState('');

  // Handle navigation between screens
  const handleGetStarted = () => {
    setCurrentScreen('signup');
  };

  const handleGoToLogin = () => {
    setCurrentScreen('login');
  };

  const handleGoToSignUp = () => {
    setCurrentScreen('signup');
  };

  // Handle authentication actions
  const handleLogin = async (email: string, password: string) => {
    console.log('Login:', { email, password });
    // Add your login logic here
    // Example: await authClient.signIn({ email, password });
  };

  const handleSignUp = async (data: SignUpData) => {
    console.log('Sign Up:', data);
    setVerificationEmail(data.email);
    setCurrentScreen('verification');
    // Add your signup logic here
    // Example: await authClient.signUp(data);
  };

  const handleVerification = async (code: string) => {
    console.log('Verify:', { email: verificationEmail, code });
    // Add your verification logic here
    // Example: await authClient.verifyEmail({ email: verificationEmail, code });
  };

  const handleResendCode = async () => {
    console.log('Resend code to:', verificationEmail);
    // Add your resend code logic here
    // Example: await authClient.resendVerificationCode({ email: verificationEmail });
  };

  const handleForgotPassword = () => {
    console.log('Forgot password');
    // Add your forgot password logic here
  };

  const handleSocialAuth = async (provider: 'facebook' | 'google' | 'apple', isLogin: boolean) => {
    console.log(`${isLogin ? 'Login' : 'Sign up'} with ${provider}`);
    // Add your social authentication logic here
    // Example: await authClient.signInWithProvider(provider);
  };

  // Render the appropriate screen based on current state
  const renderScreen = () => {
    switch (currentScreen) {
      case 'loading':
        return (
          <LoadingScreen
            onGetStarted={handleGetStarted}
            onLogin={handleGoToLogin}
          />
        );

      case 'login':
        return (
          <LoginScreen
            onLogin={handleLogin}
            onSignUp={handleGoToSignUp}
            onForgotPassword={handleForgotPassword}
            onSocialLogin={(provider) => handleSocialAuth(provider, true)}
          />
        );

      case 'signup':
        return (
          <SignUpScreen
            onSignUp={handleSignUp}
            onLogin={handleGoToLogin}
            onSocialSignUp={(provider) => handleSocialAuth(provider, false)}
          />
        );

      case 'verification':
        return (
          <VerificationScreen
            email={verificationEmail}
            onVerify={handleVerification}
            onResendCode={handleResendCode}
            onBack={() => setCurrentScreen('signup')}
          />
        );

      default:
        return null;
    }
  };

  return <View style={{ flex: 1 }}>{renderScreen()}</View>;
};

/**
 * Usage with Expo Router:
 *
 * In your app/(auth)/loading.tsx:
 * export default function LoadingRoute() {
 *   const router = useRouter();
 *   return (
 *     <LoadingScreen
 *       onGetStarted={() => router.push('/auth/signup')}
 *       onLogin={() => router.push('/auth/login')}
 *     />
 *   );
 * }
 *
 * In your app/(auth)/login.tsx:
 * export default function LoginRoute() {
 *   const router = useRouter();
 *   return (
 *     <LoginScreen
 *       onLogin={async (email, password) => {
 *         // Login logic
 *         router.replace('/(tabs)/home');
 *       }}
 *       onSignUp={() => router.push('/auth/signup')}
 *       onForgotPassword={() => router.push('/auth/forgot-password')}
 *       onSocialLogin={handleSocialLogin}
 *     />
 *   );
 * }
 *
 * And so on for signup.tsx and verification.tsx
 */