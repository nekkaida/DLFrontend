import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Animated,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner-native';
import * as Haptics from 'expo-haptics';
import axiosInstance, { endpoints } from '@/lib/endpoints';
import { usePasswordResetStore } from '@/src/stores/passwordResetStore';

// Constants
const DEBOUNCE_DELAY = 500;
const REQUEST_TIMEOUT = 30000;
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

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

export default function ResetPasswordVerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { email: storeEmail, setEmail, setVerifiedOtp } = usePasswordResetStore();

  const isMountedRef = useRef<boolean>(true);
  const lastPressTimeRef = useRef<number>(0);
  const hiddenInputRef = useRef<TextInput>(null);
  const cursorAnimation = useRef(new Animated.Value(1)).current;
  const blinkAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const hasCheckedEmail = useRef<boolean>(false);

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);

  // Get email from params (more reliable) or store (fallback)
  const email = params.email || storeEmail;

  // Update store with email from params if available
  useEffect(() => {
    if (params.email && params.email !== storeEmail) {
      if (__DEV__) {
        console.log('📧 [OTP Screen] Updating store with email from params');
      }
      setEmail(params.email);
    }
  }, [params.email, storeEmail, setEmail]);

  // Cleanup on unmount and auto-focus
  useEffect(() => {
    isMountedRef.current = true;

    // Auto-focus the hidden input after mount (more reliable than autoFocus prop)
    const focusTimeout = setTimeout(() => {
      if (isMountedRef.current && hiddenInputRef.current) {
        hiddenInputRef.current.focus();
      }
    }, 100);

    return () => {
      isMountedRef.current = false;
      clearTimeout(focusTimeout);
      // Stop any running animation on unmount to prevent memory leak
      blinkAnimationRef.current?.stop();
    };
  }, []);

  // Validate email - redirect if missing or invalid
  // Since email now comes from params, it's immediately available
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Only check once on mount
    if (hasCheckedEmail.current) return;
    hasCheckedEmail.current = true;
    
    if (__DEV__) {
      console.log('🔍 [OTP Screen] Email validation check:', {
        email,
        fromParams: !!params.email,
        fromStore: !!storeEmail,
        isValid: email && emailRegex.test(email),
      });
    }
    
    if (!email || !emailRegex.test(email)) {
      if (__DEV__) {
        console.log('❌ [OTP Screen] Email missing or invalid, redirecting...');
      }
      toast.error('Session Expired', {
        description: 'Please start the password reset process again.',
      });
      
      // Use setTimeout to avoid navigation conflicts
      setTimeout(() => {
        router.replace('/resetPassword');
      }, 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Resend cooldown timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        if (isMountedRef.current) {
          setResendCooldown((prev) => Math.max(0, prev - 1));
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendCooldown]);

  // Cursor blinking animation with proper cleanup
  useEffect(() => {
    if (isFocused) {
      const blinkAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(cursorAnimation, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(cursorAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      blinkAnimationRef.current = blinkAnimation;
      blinkAnimation.start();
      return () => {
        blinkAnimation.stop();
        blinkAnimationRef.current = null;
      };
    } else {
      // Stop animation when not focused
      blinkAnimationRef.current?.stop();
      blinkAnimationRef.current = null;
    }
  }, [isFocused, cursorAnimation]);

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

  const handleOtpChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtp(cleanValue);

    // Auto-verify when 6 digits entered
    if (cleanValue.length === OTP_LENGTH) {
      // Small delay to let the UI update
      setTimeout(() => {
        handleVerifyOtp(cleanValue);
      }, 100);
    }
  };

  const handleVerifyOtp = async (otpValue?: string) => {
    const trimmedOtp = (otpValue || otp).trim();

    if (!trimmedOtp || trimmedOtp.length !== OTP_LENGTH) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      toast.error('Invalid Code', {
        description: `Please enter the ${OTP_LENGTH}-digit verification code.`,
      });
      return;
    }

    if (isLoading) return;

    setIsLoading(true);

    try {
      // Verify OTP with backend before navigating
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out.')), REQUEST_TIMEOUT);
      });

      const response = await Promise.race([
        axiosInstance.post(endpoints.auth.verifyResetOtp, {
          email: safeEmail,
          otp: trimmedOtp,
        }),
        timeoutPromise,
      ]);

      if (!isMountedRef.current) return;

      // ALWAYS log response for debugging
      console.log('✅ [OTP Screen] Backend response:', {
        status: response.status,
        data: JSON.stringify(response.data),
        success: response.data?.success,
      });

      // Check if verification was successful
      if (response.data?.success) {
        console.log('🎉 [OTP Screen] Verification successful, storing OTP and navigating...');
        
        triggerNotification(Haptics.NotificationFeedbackType.Success);

        // Store verified OTP securely (not in URL)
        setVerifiedOtp(safeEmail, trimmedOtp);

        // Stop animation before navigation to prevent memory leak
        blinkAnimationRef.current?.stop();

        // Wait longer to ensure AsyncStorage persist completes before navigation
        setTimeout(() => {
          console.log('📍 [OTP Screen] Store updated, navigating to password screen...');
          router.push('/resetPassword/password');
        }, 300);
      } else {
        // Shouldn't reach here if backend returns proper error status
        console.log('❌ [OTP Screen] Verification failed, response:', JSON.stringify(response.data));
        
        triggerNotification(Haptics.NotificationFeedbackType.Error);
        toast.error('Verification Failed', {
          description: response.data?.message || 'Invalid verification code.',
        });
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;

      console.log('💥 [OTP Screen] Exception caught:', {
        message: err.message,
        response: err.response ? JSON.stringify(err.response.data) : 'No response',
        status: err.response?.status,
      });

      triggerNotification(Haptics.NotificationFeedbackType.Error);

      // Handle different error types
      let message = 'An error occurred. Please try again.';
      let shouldClearOtp = false;

      // Check for HTTP 429 rate limit (IP-based)
      if (err.response?.status === 429) {
        message = 'Too many requests. Please wait a few minutes and try again.';
        shouldClearOtp = true;
      } else if (err.response?.data) {
        // Backend returned an error response
        const errorCode = err.response.data.data?.code;
        message = err.response.data.message || message;

        if (errorCode === 'OTP_EXPIRED') {
          message = 'This code has expired. Please request a new one.';
          shouldClearOtp = true;
        } else if (errorCode === 'OTP_ALREADY_USED') {
          message = 'This code has already been used. Please request a new one.';
          shouldClearOtp = true;
        } else if (errorCode === 'OTP_INVALID') {
          message = 'Invalid verification code. Please check and try again.';
        } else if (errorCode === 'TOO_MANY_ATTEMPTS') {
          // Use the message from backend which includes the lockout time
          shouldClearOtp = true;
        }
      } else if (err instanceof Error) {
        if (err.message.includes('timeout') || err.message.includes('network')) {
          message = 'Network error. Please check your connection.';
        }
      }

      toast.error('Verification Failed', { description: message });

      if (shouldClearOtp) {
        setOtp('');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading) return;

    setIsLoading(true);

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out.')), REQUEST_TIMEOUT);
      });

      const result = await Promise.race([
        authClient.emailOtp.sendVerificationOtp({
          email: safeEmail,
          type: "forget-password",
        }),
        timeoutPromise
      ]) as { data: any; error: any };

      if (!isMountedRef.current) return;

      // Check for API error
      if (result.error) {
        triggerNotification(Haptics.NotificationFeedbackType.Error);
        toast.error('Error', {
          description: result.error.message || 'Failed to resend code. Please try again.',
        });
        return;
      }

      triggerNotification(Haptics.NotificationFeedbackType.Success);
      toast.success('Code Sent', {
        description: 'A new verification code has been sent to your email.',
      });
      setResendCooldown(RESEND_COOLDOWN);
      setOtp('');
    } catch (err) {
      if (!isMountedRef.current) return;

      triggerNotification(Haptics.NotificationFeedbackType.Error);

      let message = 'Failed to resend code. Please try again.';
      if (err instanceof Error) {
        if (err.message.includes('timeout') || err.message.includes('network')) {
          message = 'Network error. Please check your connection.';
        }
      }

      toast.error('Error', { description: message });
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleGoBack = () => {
    handleDebouncedPress(() => router.back());
  };

  const handleBackToLogin = () => {
    handleDebouncedPress(() => router.replace('/login'));
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    // Don't set isFocused to false here - let onBlur handle it
    // This prevents confusing UX when user taps outside
  };

  // Mask email for display (email should always exist if we reached this screen)
  const maskedEmail = email
    ? `${email.substring(0, 3)}***@${email.split('@')[1] || 'email'}`
    : 'your email';

  // Safe email for API calls (prevents TypeScript null errors)
  const safeEmail = email || '';

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
              onPress={handleGoBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              disabled={isLoading}
              accessibilityLabel="Go back"
              accessibilityRole="button"
              accessibilityHint="Returns to the previous screen"
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
              <View style={[styles.stepDot, styles.stepDotCompleted]} />
              <View style={[styles.stepLine, styles.stepLineCompleted]} />
              <View style={[styles.stepDot, styles.stepDotActive]} />
              <View style={styles.stepLine} />
              <View style={styles.stepDot} />
            </View>
            <ThemedText style={styles.stepText}>Step 2 of 3</ThemedText>

            <ThemedText style={styles.welcomeText}>Enter Code</ThemedText>
            <ThemedText style={styles.instructionText}>
              We've sent a 6-digit verification code to {maskedEmail}
            </ThemedText>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Verification Code</ThemedText>

              <Pressable
                style={styles.otpWrapper}
                onPress={() => hiddenInputRef.current?.focus()}
                accessibilityLabel="Enter verification code"
                accessibilityHint="Tap to enter the 6-digit code"
              >
                {/* Visual OTP boxes */}
                <View style={styles.otpContainer} pointerEvents="box-none">
                  {Array.from({ length: OTP_LENGTH }).map((_, index) => {
                    const digit = otp[index] || '';
                    const isActive = isFocused && index === otp.length;
                    const isFilled = !!digit;

                    return (
                      <View
                        key={index}
                        style={[
                          styles.otpInput,
                          isFilled && styles.otpInputFilled,
                          isActive && styles.otpInputActive,
                        ]}
                      >
                        <ThemedText style={[
                          styles.otpText,
                          isFilled && styles.otpTextFilled
                        ]}>
                          {digit}
                        </ThemedText>
                        {isActive && (
                          <Animated.View
                            style={[
                              styles.cursor,
                              { opacity: cursorAnimation }
                            ]}
                          />
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Hidden input that handles all typing and pasting */}
                <TextInput
                  ref={hiddenInputRef}
                  style={styles.hiddenInput}
                  value={otp}
                  onChangeText={handleOtpChange}
                  keyboardType="number-pad"
                  maxLength={OTP_LENGTH}
                  editable={!isLoading}
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  caretHidden={false}
                  selectionColor="transparent"
                  underlineColorAndroid="transparent"
                />
              </Pressable>

              {/* Resend OTP link */}
              <View style={styles.resendContainer}>
                {resendCooldown > 0 ? (
                  <Text style={styles.resendCooldownText}>
                    Resend code in {resendCooldown}s
                  </Text>
                ) : (
                  <Pressable
                    onPress={() => handleDebouncedPress(handleResendOtp)}
                    disabled={isLoading}
                    accessibilityLabel="Resend verification code"
                    accessibilityRole="button"
                    accessibilityHint="Sends a new verification code to your email"
                    accessibilityState={{ disabled: isLoading || resendCooldown > 0 }}
                  >
                    <Text style={[styles.resendLink, isLoading && styles.resendLinkDisabled]}>
                      Resend Code
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>

            <Pressable
              onPress={() => handleDebouncedPress(() => handleVerifyOtp())}
              disabled={isLoading || otp.length !== OTP_LENGTH}
              style={({ pressed }) => [
                styles.verifyButton,
                { opacity: pressed || isLoading || otp.length !== OTP_LENGTH ? 0.8 : 1 },
                (isLoading || otp.length !== OTP_LENGTH) && styles.verifyButtonDisabled
              ]}
              accessibilityLabel="Verify code"
              accessibilityRole="button"
              accessibilityHint="Verifies your code and continues to set new password"
              accessibilityState={{ disabled: isLoading || otp.length !== OTP_LENGTH }}
            >
              <ThemedText style={styles.verifyButtonText}>
                {isLoading ? 'Verifying...' : 'Verify'}
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
  stepDotCompleted: {
    backgroundColor: '#10B981',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  stepLineCompleted: {
    backgroundColor: '#10B981',
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
    marginBottom: 12,
  },
  otpWrapper: {
    position: 'relative',
    width: '100%',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: 52,
    color: 'rgba(0,0,0,0.01)',
    backgroundColor: 'transparent',
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 38,
    zIndex: 10,
    borderWidth: 0,
  },
  otpInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#EDF1F3',
    height: 52,
    shadowColor: '#E4E5E7',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.24,
    shadowRadius: 2,
    elevation: 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  otpInputFilled: {
    borderColor: Colors.light.brand.orange,
    backgroundColor: '#FFFFFF',
  },
  otpInputActive: {
    borderColor: Colors.light.brand.orange,
    borderWidth: 2,
  },
  otpText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  otpTextFilled: {
    color: Colors.light.brand.orange,
  },
  cursor: {
    position: 'absolute',
    width: 2,
    height: 24,
    backgroundColor: Colors.light.brand.orange,
  },
  resendContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  resendLink: {
    fontSize: 14,
    color: '#4D81E7',
    fontWeight: '600',
  },
  resendLinkDisabled: {
    opacity: 0.5,
  },
  resendCooldownText: {
    fontSize: 14,
    color: '#6C7278',
  },
  verifyButton: {
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
  verifyButtonDisabled: {
    backgroundColor: '#B0B8C1',
  },
  verifyButtonText: {
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
