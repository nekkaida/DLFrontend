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
import { usePasswordResetStore } from '@/src/stores/passwordResetStore';

// Constants
const DEBOUNCE_DELAY = 500;
const REQUEST_TIMEOUT = 30000;
const MAX_PASSWORD_LENGTH = 128;

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

export default function ResetPasswordNewScreen() {
  const router = useRouter();
  const { getVerifiedOtp, clearAll: clearPasswordResetStore, isOtpValid } = usePasswordResetStore();

  // Get verified OTP from secure store (not URL params)
  const verifiedData = getVerifiedOtp();
  const email = verifiedData?.email || '';
  const otp = verifiedData?.otp || '';

  const isMountedRef = useRef<boolean>(true);
  const lastPressTimeRef = useRef<number>(0);
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCheckedOtp = useRef<boolean>(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [newPasswordFocused, setNewPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const [passwordError, setPasswordError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>(null);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  // Redirect if missing or expired OTP data
  // Wait for store to hydrate from AsyncStorage before checking
  useEffect(() => {
    // Give store time to load from AsyncStorage (500ms)
    const checkOtp = setTimeout(() => {
      // Only check once
      if (hasCheckedOtp.current) return;
      hasCheckedOtp.current = true;

      console.log('🔍 [Password Screen] OTP check:', {
        email,
        hasOtp: !!otp,
        isValid: isOtpValid(),
      });

      if (!email || !otp || !isOtpValid()) {
        console.log('❌ [Password Screen] OTP missing or invalid, redirecting back...');
        toast.error('Session Expired', {
          description: 'Your verification has expired. Please start again.',
        });
        clearPasswordResetStore();
        router.replace('/resetPassword/');
      } else {
        console.log('✅ [Password Screen] OTP validated successfully');
      }
    }, 500);

    return () => clearTimeout(checkOtp);
  }, [email, otp, router, isOtpValid, clearPasswordResetStore]);

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

  const handlePasswordChange = (text: string) => {
    setNewPassword(text);
    const validation = validatePassword(text);
    setPasswordError(validation.error);
    setPasswordStrength(validation.strength);
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      toast.error('Password Required', {
        description: 'Please enter and confirm your new password.',
      });
      return;
    }

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
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out. Please try again.')), REQUEST_TIMEOUT);
      });

      const { error } = await Promise.race([
        authClient.emailOtp.resetPassword({
          email: email,
          otp: otp,
          password: newPassword,
        }),
        timeoutPromise
      ]) as { data: any; error: any };

      if (!isMountedRef.current) return;

      if (error) {
        triggerNotification(Haptics.NotificationFeedbackType.Error);

        // Handle specific error cases
        if (error.message?.toLowerCase().includes('invalid') ||
            error.message?.toLowerCase().includes('expired')) {
          toast.error('Invalid Code', {
            description: 'Your verification code has expired or is invalid. Please request a new one.',
          });
          // Clear store and navigate back to start the flow again
          clearPasswordResetStore();
          navigationTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              router.replace('/resetPassword/');
            }
          }, 2000);
        } else {
          toast.error('Reset Failed', {
            description: error.message || 'Failed to reset password. Please try again.',
          });
        }
      } else {
        triggerNotification(Haptics.NotificationFeedbackType.Success);
        toast.success('Password Reset', {
          description: 'Your password has been reset successfully. Redirecting to login...',
        });

        // Clear sensitive data from store after successful reset
        clearPasswordResetStore();

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

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    // Don't manually unfocus - let onBlur handle it for better UX
  };

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
              <View style={[styles.stepDot, styles.stepDotCompleted]} />
              <View style={[styles.stepLine, styles.stepLineCompleted]} />
              <View style={[styles.stepDot, styles.stepDotCompleted]} />
              <View style={[styles.stepLine, styles.stepLineCompleted]} />
              <View style={[styles.stepDot, styles.stepDotActive]} />
            </View>
            <ThemedText style={styles.stepText}>Step 3 of 3</ThemedText>

            <ThemedText style={styles.welcomeText}>New Password</ThemedText>
            <ThemedText style={styles.instructionText}>
              Create a strong password for your account.
            </ThemedText>

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
                  autoCorrect={false}
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
                  {passwordError && (
                    <Text style={styles.errorText}>{passwordError}</Text>
                  )}

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
                  autoCorrect={false}
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
    marginBottom: 24,
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
    paddingRight: 50,
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
    marginTop: 4,
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
