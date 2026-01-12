import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Dimensions,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner-native';
import * as Haptics from 'expo-haptics';
import { usePasswordResetStore } from '@/src/stores/passwordResetStore';

// Constants
const DEBOUNCE_DELAY = 500;
const REQUEST_TIMEOUT = 30000;
const MAX_EMAIL_LENGTH = 255;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Safe haptics wrapper
const triggerHaptic = async (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
  try {
    await Haptics.impactAsync(style);
  } catch {
    // Haptics not supported
  }
};

const triggerNotification = async (type: Haptics.NotificationFeedbackType) => {
  try {
    await Haptics.notificationAsync(type);
  } catch {
    // Haptics not supported
  }
};

export default function ResetPasswordEmailScreen() {
  const router = useRouter();
  const { setEmail: storeEmail, clearAll: clearPasswordResetStore } = usePasswordResetStore();
  const isMountedRef = useRef<boolean>(true);
  const lastPressTimeRef = useRef<number>(0);

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  // Responsive dimensions
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  // Clear any stale password reset data on fresh start
  useEffect(() => {
    clearPasswordResetStore();
  }, [clearPasswordResetStore]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      if (isMountedRef.current) {
        setDimensions({ width: window.width, height: window.height });
      }
    });

    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && isMountedRef.current) {
        const { width, height } = Dimensions.get('window');
        setDimensions({ width, height });
      }
    });

    return () => {
      isMountedRef.current = false;
      subscription?.remove();
      appStateSubscription?.remove();
    };
  }, []);

  // Debounced press handler
  const handleDebouncedPress = useCallback((callback: () => void) => {
    const now = Date.now();
    if (now - lastPressTimeRef.current < DEBOUNCE_DELAY) {
      return;
    }
    lastPressTimeRef.current = now;
    triggerHaptic();
    callback();
  }, []);

  const handleSendOtp = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      toast.error('Email Required', {
        description: 'Please enter your email address.'
      });
      return;
    }

    if (trimmedEmail.length > MAX_EMAIL_LENGTH) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      toast.error('Invalid Email', {
        description: 'Email address is too long.'
      });
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      toast.error('Invalid Email', {
        description: 'Please enter a valid email address.'
      });
      return;
    }

    if (isLoading) return;

    setIsLoading(true);

    try {
      if (__DEV__) {
        console.log("Sending OTP to email (redacted)");
      }

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out. Please check your connection and try again.')), REQUEST_TIMEOUT);
      });

      const { error } = await Promise.race([
        authClient.emailOtp.sendVerificationOtp({
          email: trimmedEmail,
          type: "forget-password",
        }),
        timeoutPromise
      ]) as { data: any; error: any };

      if (!isMountedRef.current) return;

      // SECURITY: Always show success to prevent email enumeration
      triggerNotification(Haptics.NotificationFeedbackType.Success);
      toast.success('Code Sent', {
        description: `If ${trimmedEmail.substring(0, 3)}***@${trimmedEmail.split('@')[1] || 'email'} is registered, you'll receive a verification code.`,
      });

      // Store email in secure store and navigate to OTP screen with email param
      storeEmail(trimmedEmail);
      router.push({
        pathname: '/resetPassword/otp',
        params: { email: trimmedEmail }
      });

      if (__DEV__ && error) {
        console.log('OTP send error (dev only):', error.message);
      }
    } catch (err) {
      if (!isMountedRef.current) return;

      triggerNotification(Haptics.NotificationFeedbackType.Error);

      let message = 'An error occurred. Please try again.';
      if (err instanceof Error) {
        if (err.message.includes('timeout') || err.message.includes('network')) {
          message = 'Network error. Please check your connection and try again.';
        } else if (__DEV__) {
          message = err.message;
        }
      }

      toast.error('Error', { description: message });
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleBackToLogin = () => {
    handleDebouncedPress(() => router.replace('/login'));
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    // Don't manually unfocus - let onBlur handle it for better UX
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={handleBackToLogin}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              disabled={isLoading}
              accessibilityLabel="Go back to login"
              accessibilityRole="button"
              accessibilityHint="Returns to the login screen"
              accessibilityState={{ disabled: isLoading }}
            >
              <Ionicons name="arrow-back" size={24} color={isLoading ? "#B0B8C1" : "#6C7278"} />
            </Pressable>
            <ThemedText style={styles.title}>DEUCE</ThemedText>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.formContainer}>
            {/* Step indicator */}
            <View style={styles.stepIndicator}>
              <View style={[styles.stepDot, styles.stepDotActive]} />
              <View style={styles.stepLine} />
              <View style={styles.stepDot} />
              <View style={styles.stepLine} />
              <View style={styles.stepDot} />
            </View>
            <ThemedText style={styles.stepText}>Step 1 of 3</ThemedText>

            <ThemedText style={styles.welcomeText}>Reset Password</ThemedText>
            <ThemedText style={styles.instructionText}>
              Enter your email address and we'll send you a code to reset your password.
            </ThemedText>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Email address</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  emailFocused && styles.inputFocused,
                  isLoading && styles.inputDisabled
                ]}
                value={email}
                onChangeText={setEmail}
                placeholder={emailFocused ? "" : "Enter your email address"}
                placeholderTextColor="#B0B8C1"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                maxLength={MAX_EMAIL_LENGTH}
                returnKeyType="done"
                onSubmitEditing={() => handleDebouncedPress(handleSendOtp)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                editable={!isLoading}
                accessibilityLabel="Email address input"
                accessibilityHint="Enter your registered email address to receive a password reset code"
              />
            </View>

            <Pressable
              onPress={() => handleDebouncedPress(handleSendOtp)}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.resetButton,
                { opacity: pressed || isLoading ? 0.8 : 1 },
                isLoading && styles.resetButtonDisabled
              ]}
              accessibilityLabel="Send verification code"
              accessibilityRole="button"
              accessibilityHint="Sends a verification code to your email"
              accessibilityState={{ disabled: isLoading }}
            >
              <ThemedText style={styles.resetButtonText}>
                {isLoading ? 'Sending...' : 'Send Code'}
              </ThemedText>
            </Pressable>

            <View style={styles.loginContainer}>
              <ThemedText style={styles.loginText}>Remember your password? </ThemedText>
              <Pressable
                onPress={handleBackToLogin}
                disabled={isLoading}
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                accessibilityLabel="Sign in to your account"
                accessibilityRole="button"
                accessibilityHint="Returns to the login screen"
                accessibilityState={{ disabled: isLoading }}
              >
                <ThemedText style={[styles.loginLink, isLoading && styles.linkDisabled]}>
                  Sign in
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 5,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 0,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: Colors.light.brand.orange,
  },
  placeholder: {
    width: 40,
  },
  formContainer: {
    paddingHorizontal: 30,
    paddingTop: 30,
    minHeight: 600,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E5E7EB',
  },
  stepDotActive: {
    backgroundColor: Colors.light.brand.orange,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  stepText: {
    fontSize: 12,
    color: '#6C7278',
    textAlign: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 20,
    paddingTop: 10,
  },
  instructionText: {
    fontSize: 16,
    color: '#6C7278',
    lineHeight: 24,
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6C7278',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#EDF1F3',
    elevation: 2,
    minHeight: 52,
  },
  inputFocused: {
    borderColor: Colors.light.brand.orange,
  },
  inputDisabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.7,
  },
  resetButton: {
    backgroundColor: '#FE9F4D',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    elevation: 2,
    marginBottom: 30,
  },
  resetButtonDisabled: {
    backgroundColor: '#B0B8C1',
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingBottom: 20,
  },
  loginText: {
    fontSize: 14,
    color: '#6C7278',
  },
  loginLink: {
    fontSize: 14,
    color: '#4D81E7',
    fontWeight: '600',
  },
  linkDisabled: {
    opacity: 0.5,
  },
});
