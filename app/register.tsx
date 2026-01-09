import React from 'react';
import { useRouter } from 'expo-router';
import { SignUpScreen, SignUpData } from '@/src/features/auth/screens/SignUpScreen';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner-native';
import { AuthStorage } from '@/src/core/storage';

export default function RegisterRoute() {
  const router = useRouter();

  const handleSignUp = async (data: SignUpData) => {
    try {
      console.log('📱 Register Route - Received signup data:', {
        email: data.email,
        username: data.username,
        password: '***'
      });

      const signupPayload = {
        email: data.email,
        password: data.password,
        name: data.username,
        username: data.username,
        phoneNumber: '',
      };

      console.log('📤 Register Route:', {
        ...signupPayload,
        password: '***'
      });

      // Better Auth returns { data, error } - must check error explicitly
      const result = await authClient.signUp.email(signupPayload);

      console.log('📥 Register Route - Signup result:', {
        hasData: !!result.data,
        hasError: !!result.error,
        error: result.error
      });

      // Check for errors (including duplicate email)
      if (result.error) {
        console.error('Sign up error:', result.error);
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

      // Success - send verification OTP manually since overrideDefaultEmailVerification is true
      console.log('📧 Register Route - Sending verification OTP...');
      const otpResult = await authClient.emailOtp.sendVerificationOtp({
        email: data.email,
        type: "email-verification",
      });

      if (otpResult.error) {
        console.error('Failed to send verification OTP:', otpResult.error);
        toast.warning('Account created but verification email failed. You can resend it on the next screen.');
      } else {
        console.log('✅ Register Route - Verification OTP sent successfully');
      }

      toast.success('Account created! Please check your email to verify.');
      router.push(`/verifyEmail?email=${encodeURIComponent(data.email)}`);
    } catch (error) {
      console.error('Sign up failed:', error);
      toast.error('Sign up failed. Please try again.');
    }
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleSocialSignUp = async (provider: 'facebook' | 'google' | 'apple') => {
    try {
      // Only Google is currently configured
      if (provider !== 'google') {
        toast.info(`${provider.charAt(0).toUpperCase() + provider.slice(1)} sign-up coming soon!`);
        return;
      }

      console.log(`Social sign-up with ${provider}`);

      // Mark that user has registered (so they see login screen on return, not landing)
      await AuthStorage.markLoggedIn();

      // Social sign-in automatically creates account if user doesn't exist
      const result = await authClient.signIn.social({
        provider,
        callbackURL: '/onboarding/personal-info', // New users go to onboarding
      });

      console.log('Social sign-up result:', result);

      if (result.error) {
        console.error('Social sign-up failed:', result.error);
        toast.error(result.error.message || 'Social sign-up failed. Please try again.');
      }
      // Success handling is done via the callbackURL redirect
    } catch (error: any) {
      console.error('Social sign-up error:', error);
      toast.error(error.message || 'Social sign-up failed. Please try again.');
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