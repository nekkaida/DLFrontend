import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Text,
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
import { validatePassword, PasswordStrength } from '@/features/auth/utils/passwordValidation';
import * as Haptics from 'expo-haptics';

// Constants
const DEBOUNCE_DELAY = 500;
const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_EMAIL_LENGTH = 255;
const MAX_PASSWORD_LENGTH = 128;
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // 60 seconds cooldown for resend

// Email regex pattern (same as LoginScreen)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Safe haptics wrapper - handles unsupported devices gracefully
const triggerHaptic = async (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
  try {
    await Haptics.impactAsync(style);
  } catch {
    // Haptics not supported on this device, ignore
  }
};

const triggerNotification = async (type: Haptics.NotificationFeedbackType) => {
  try {
    await Haptics.notificationAsync(type);
  } catch {
    // Haptics not supported on this device, ignore
  }
};

export default function ResetPasswordScreen() {
  const router = useRouter();
  const isMountedRef = useRef<boolean>(true);
  const lastPressTimeRef = useRef<number>(0);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [emailFocused, setEmailFocused] = useState(false);
  const [otpFocused, setOtpFocused] = useState(false);
  const [newPasswordFocused, setNewPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // Password validation state
  const [passwordError, setPasswordError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>(null);

  // Responsive dimensions
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

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
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
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

  const { width: screenWidth } = dimensions;

  // Debounced press handler to prevent double-clicks
  const handleDebouncedPress = useCallback((callback: () => void) => {
    const now = Date.now();
    if (now - lastPressTimeRef.current < DEBOUNCE_DELAY) {
      return;
    }
    lastPressTimeRef.current = now;
    triggerHaptic();
    callback();
  }, []);

  const handlePasswordChange = (text: string) => {
    setNewPassword(text);
    const validation = validatePassword(text);
    setPasswordError(validation.error);
    setPasswordStrength(validation.strength);
  };

  // Sanitize OTP input - only allow digits
  const handleOtpChange = (text: string) => {
    const sanitized = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtp(sanitized);
  };

  const handleSendOtp = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      toast.error('Email Required', {
        description: 'Please enter your email address.'
      });
      return;
    }

    // Max length validation
    if (trimmedEmail.length > MAX_EMAIL_LENGTH) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      toast.error('Invalid Email', {
        description: 'Email address is too long.'
      });
      return;
    }

    // Proper email format validation
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

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out. Please check your connection and try again.')), REQUEST_TIMEOUT);
      });

      const { data, error } = await Promise.race([
        authClient.emailOtp.sendVerificationOtp({
          email: trimmedEmail,
          type: "forget-password",
        }),
        timeoutPromise
      ]) as { data: any; error: any };

      if (!isMountedRef.current) return;

      // SECURITY: Always show success to prevent email enumeration
      // Backend should also implement this pattern
      triggerNotification(Haptics.NotificationFeedbackType.Success);
      toast.success('Code Sent', {
        description: `If ${trimmedEmail.substring(0, 3)}***@${trimmedEmail.split('@')[1] || 'email'} is registered, you'll receive a verification code.`,
      });
      setOtpSent(true);
      setResendCooldown(RESEND_COOLDOWN);

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

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading) return;
    await handleSendOtp();
  };

  const handleResetPassword = async () => {
    const trimmedOtp = otp.trim();

    // OTP validation
    if (!trimmedOtp || trimmedOtp.length !== OTP_LENGTH) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      toast.error('Invalid Code', {
        description: `Please enter the ${OTP_LENGTH}-digit verification code.`,
      });
      return;
    }

    if (!newPassword || !confirmPassword) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      toast.error('Password Required', {
        description: 'Please enter and confirm your new password.',
      });
      return;
    }

    // Max length validation
    if (newPassword.length > MAX_PASSWORD_LENGTH) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      toast.error('Invalid Password', {
        description: 'Password is too long.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      toast.error('Password Mismatch', {
        description: 'Passwords do not match.',
      });
      return;
    }

    // Use shared password validation
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      toast.error('Weak Password', {
        description: validation.error,
      });
      return;
    }

    if (isLoading) return;

    setIsLoading(true);

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out. Please try again.')), REQUEST_TIMEOUT);
      });

      const { error } = await Promise.race([
        authClient.emailOtp.resetPassword({
          email: email.trim(),
          otp: trimmedOtp,
          password: newPassword,
        }),
        timeoutPromise
      ]) as { data: any; error: any };

      if (!isMountedRef.current) return;

      if (error) {
        triggerNotification(Haptics.NotificationFeedbackType.Error);
        toast.error('Reset Failed', {
          description: error.message || 'Failed to reset password. Please check your code and try again.',
        });
      } else {
        triggerNotification(Haptics.NotificationFeedbackType.Success);
        toast.success('Password Reset', {
          description: 'Your password has been reset successfully. Redirecting to login...',
        });

        // Navigate back to login after a short delay (with cleanup)
        navigationTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            router.replace('/login');
          }
        }, 2000);
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

  const handleGoBack = () => {
    handleDebouncedPress(() => setOtpSent(false));
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    setEmailFocused(false);
    setOtpFocused(false);
    setNewPasswordFocused(false);
    setConfirmPasswordFocused(false);
  };

  // Check if passwords match for real-time feedback
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

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
          {/* Header with back button */}
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
            <ThemedText style={styles.welcomeText}>Reset Password</ThemedText>

            {!otpSent ? (
              <>
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
              </>
            ) : (
              <>
                <ThemedText style={styles.instructionText}>
                  Enter the code sent to {email.substring(0, 3)}***@{email.split('@')[1] || 'email'} and your new password.
                </ThemedText>

                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>Verification Code</ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      otpFocused && styles.inputFocused,
                      isLoading && styles.inputDisabled
                    ]}
                    value={otp}
                    onChangeText={handleOtpChange}
                    placeholder={otpFocused ? "" : "Enter the 6-digit code"}
                    placeholderTextColor="#B0B8C1"
                    keyboardType="number-pad"
                    maxLength={OTP_LENGTH}
                    autoComplete="one-time-code"
                    textContentType="oneTimeCode"
                    returnKeyType="next"
                    onFocus={() => setOtpFocused(true)}
                    onBlur={() => setOtpFocused(false)}
                    editable={!isLoading}
                    accessibilityLabel="Verification code input"
                    accessibilityHint="Enter the 6-digit code sent to your email"
                  />

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

                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>New Password</ThemedText>
                  <View>
                    <TextInput
                      style={[
                        styles.input,
                        newPasswordFocused && styles.inputFocused,
                        isLoading && styles.inputDisabled
                      ]}
                      value={newPassword}
                      onChangeText={handlePasswordChange}
                      placeholder={newPasswordFocused ? "" : "Enter your new password"}
                      placeholderTextColor="#B0B8C1"
                      secureTextEntry={!isPasswordVisible}
                      autoCapitalize="none"
                      autoComplete="password-new"
                      textContentType="newPassword"
                      maxLength={MAX_PASSWORD_LENGTH}
                      returnKeyType="next"
                      onFocus={() => setNewPasswordFocused(true)}
                      onBlur={() => setNewPasswordFocused(false)}
                      editable={!isLoading}
                      accessibilityLabel="New password input"
                      accessibilityHint="Enter your new password"
                    />
                    <Pressable
                      onPress={() => setPasswordVisible(!isPasswordVisible)}
                      style={styles.eyeIcon}
                      accessibilityLabel={isPasswordVisible ? "Hide password" : "Show password"}
                      accessibilityRole="button"
                      accessibilityHint="Toggles password visibility"
                    >
                      <Ionicons
                        name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                        size={24}
                        color="#6C7278"
                      />
                    </Pressable>
                  </View>

                  {/* Password Validation Feedback */}
                  {newPassword.length > 0 && (
                    <View style={styles.validationContainer}>
                      {/* Error Message */}
                      {passwordError && (
                        <Text style={styles.errorText}>{passwordError}</Text>
                      )}

                      {/* Password Strength Indicator */}
                      {passwordStrength && (
                        <View style={styles.strengthContainer}>
                          <View style={styles.strengthBars}>
                            <View style={[
                              styles.strengthBar,
                              { backgroundColor: passwordStrength === 'weak' ? '#EF4444' :
                                               passwordStrength === 'medium' ? '#F59E0B' : '#10B981' }
                            ]} />
                            <View style={[
                              styles.strengthBar,
                              { backgroundColor: passwordStrength === 'medium' || passwordStrength === 'strong' ?
                                               (passwordStrength === 'medium' ? '#F59E0B' : '#10B981') : '#E5E7EB' }
                            ]} />
                            <View style={[
                              styles.strengthBar,
                              { backgroundColor: passwordStrength === 'strong' ? '#10B981' : '#E5E7EB' }
                            ]} />
                          </View>
                          <Text style={[
                            styles.strengthText,
                            { color: passwordStrength === 'weak' ? '#EF4444' :
                                     passwordStrength === 'medium' ? '#F59E0B' : '#10B981' }
                          ]}>
                            {passwordStrength === 'weak' ? 'Weak' :
                             passwordStrength === 'medium' ? 'Medium' : 'Strong'}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>Confirm New Password</ThemedText>
                  <View>
                    <TextInput
                      style={[
                        styles.input,
                        confirmPasswordFocused && styles.inputFocused,
                        isLoading && styles.inputDisabled,
                        passwordsMatch && styles.inputSuccess,
                        passwordsMismatch && styles.inputError
                      ]}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder={confirmPasswordFocused ? "" : "Confirm your new password"}
                      placeholderTextColor="#B0B8C1"
                      secureTextEntry={!isConfirmPasswordVisible}
                      autoCapitalize="none"
                      autoComplete="password-new"
                      textContentType="newPassword"
                      maxLength={MAX_PASSWORD_LENGTH}
                      returnKeyType="done"
                      onSubmitEditing={() => handleDebouncedPress(handleResetPassword)}
                      onFocus={() => setConfirmPasswordFocused(true)}
                      onBlur={() => setConfirmPasswordFocused(false)}
                      editable={!isLoading}
                      accessibilityLabel="Confirm new password input"
                      accessibilityHint="Re-enter your new password to confirm"
                    />
                    <Pressable
                      onPress={() => setConfirmPasswordVisible(!isConfirmPasswordVisible)}
                      style={styles.eyeIcon}
                      accessibilityLabel={isConfirmPasswordVisible ? "Hide password" : "Show password"}
                      accessibilityRole="button"
                      accessibilityHint="Toggles password visibility"
                    >
                      <Ionicons
                        name={isConfirmPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                        size={24}
                        color="#6C7278"
                      />
                    </Pressable>
                  </View>

                  {/* Real-time password match feedback */}
                  {passwordsMismatch && (
                    <Text style={styles.errorText}>Passwords do not match</Text>
                  )}
                  {passwordsMatch && (
                    <Text style={styles.successText}>Passwords match</Text>
                  )}
                </View>

                <Pressable
                  onPress={() => handleDebouncedPress(handleResetPassword)}
                  disabled={isLoading}
                  style={({ pressed }) => [
                    styles.resetButton,
                    { opacity: pressed || isLoading ? 0.8 : 1 },
                    isLoading && styles.resetButtonDisabled
                  ]}
                  accessibilityLabel="Reset password"
                  accessibilityRole="button"
                  accessibilityHint="Submits your new password"
                  accessibilityState={{ disabled: isLoading }}
                >
                  <ThemedText style={styles.resetButtonText}>
                    {isLoading ? 'Resetting...' : 'Reset Password'}
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={handleGoBack}
                  disabled={isLoading}
                  accessibilityLabel="Go back to email entry"
                  accessibilityRole="button"
                  accessibilityHint="Returns to enter a different email address"
                  accessibilityState={{ disabled: isLoading }}
                >
                  <ThemedText style={[styles.loginLink, isLoading && styles.linkDisabled]}>
                    Back
                  </ThemedText>
                </Pressable>
              </>
            )}

            {/* Back to Login Link */}
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
  formContainer: {
    paddingHorizontal: 30,
    paddingTop: 40,
    minHeight: 600,
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
  inputSuccess: {
    borderColor: '#10B981',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 14,
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
  resendContainer: {
    marginTop: 12,
    alignItems: 'flex-start',
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
  // Password validation styles
  validationContainer: {
    marginTop: 8,
    gap: 4,
  },
  errorText: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    color: '#EF4444',
    fontWeight: '500',
    marginTop: 4,
  },
  successText: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    color: '#10B981',
    fontWeight: '500',
    marginTop: 4,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
});
