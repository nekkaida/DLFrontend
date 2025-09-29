import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TextInput, Pressable, Alert, TouchableWithoutFeedback, Keyboard, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { authClient } from '@/lib/auth-client';
import { navigateAndClearStack, clearAuthPagesFromHistory } from '@core/navigation';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : '');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const hiddenInputRef = useRef<TextInput>(null);
  const cursorAnimation = useRef(new Animated.Value(1)).current;

  console.log('VerifyEmailScreen: Component mounted');
  console.log('VerifyEmailScreen: Email param:', params.email);

  useEffect(() => {
    console.log('VerifyEmailScreen: useEffect triggered');
    if (typeof params.email === 'string' && params.email) {
      console.log('VerifyEmailScreen: Setting email from params:', params.email);
      setEmail(params.email);
      setOtpSent(true); // Mark as sent since better-auth already sent it during signup
      console.log('VerifyEmailScreen: Email verification code was already sent during signup');
    } else {
      console.log('VerifyEmailScreen: No valid email param, email is:', params.email);
    }
  }, [params.email]);

  // Cursor blinking animation
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
      blinkAnimation.start();
      return () => blinkAnimation.stop();
    }
  }, [isFocused, cursorAnimation]);

  const handleOtpChange = (value: string) => {
    // Only allow digits and limit to 6 characters
    const cleanValue = value.replace(/\D/g, '').slice(0, 6);
    setOtp(cleanValue);
  };

  const handleOtpBoxPress = () => {
    if (!isLoading) {
      hiddenInputRef.current?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await authClient.emailOtp.verifyEmail({
        email,
        otp,
      });

      if (error) {
        Alert.alert('Verification Failed', error.message || 'The code is incorrect. Please try again.');
      } else if (data) {
        console.log('Email verification successful');
        Alert.alert(
          'Success',
          'Your email has been verified successfully.',
          [{ text: 'OK', onPress: () => {
            clearAuthPagesFromHistory();
            navigateAndClearStack('/onboarding/personal-info');
          }}]
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      console.log('VerifyEmailScreen: Manually resending verification email to:', email);
      await authClient.emailOtp.sendVerificationOtp({
        email: email,
        type: "email-verification",
      });
      setOtpSent(true);
      console.log('VerifyEmailScreen: Resend OTP request completed');
      Alert.alert('Code Sent', `A new verification code has been sent to ${email}.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error('VerifyEmailScreen: Error resending OTP:', err);
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    setIsFocused(false);
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
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#6C7278" />
            </Pressable>
            <ThemedText style={styles.title}>DEUCE</ThemedText>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.formContainer}>
            <ThemedText style={styles.welcomeText}>Verify Your Email</ThemedText>
            <ThemedText style={styles.instructionText}>
              We've sent a 6-digit verification code to your email address{' '}
              <ThemedText style={{ fontWeight: 'bold', color: '#FE9F4D' }}>{email}</ThemedText>.
            </ThemedText>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Verification Code</ThemedText>
              
              <View style={styles.otpWrapper}>
                {/* Hidden input that handles all the typing and pasting */}
                <TextInput
                  ref={hiddenInputRef}
                  style={styles.hiddenInput}
                  value={otp}
                  onChangeText={handleOtpChange}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!isLoading}
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  autoFocus={false}
                />
                
                {/* Visual OTP boxes */}
                <Pressable style={styles.otpContainer} onPress={handleOtpBoxPress}>
                  {Array.from({ length: 6 }).map((_, index) => {
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
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={handleVerifyOtp}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.actionButton,
                { opacity: pressed || isLoading ? 0.8 : 1 },
                isLoading && styles.actionButtonDisabled
              ]}
            >
              <ThemedText style={styles.actionButtonText}>
                {isLoading ? 'Verifying...' : 'Verify'}
              </ThemedText>
            </Pressable>

            <View style={styles.footerContainer}>
              <ThemedText style={styles.footerText}>Didn't receive a code? </ThemedText>
              <Pressable
                onPress={handleResendOtp}
                disabled={isLoading}
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              >
                <ThemedText style={styles.footerLink}>Resend Code</ThemedText>
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
    paddingTop: 40,
    minHeight: 600,
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
  otpWrapper: {
    position: 'relative',
  },
  hiddenInput: {
    position: 'absolute',
    width: '100%',
    height: 52,
    opacity: 0,
    zIndex: 1,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  otpInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EDF1F3',
    width: 48,
    height: 52,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  otpInputFilled: {
    borderColor: '#FE9F4D',
    backgroundColor: '#FFF8F3',
  },
  otpInputActive: {
    borderColor: '#FE9F4D',
    borderWidth: 2,
  },
  otpText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  otpTextFilled: {
    color: '#FE9F4D',
  },
  cursor: {
    position: 'absolute',
    width: 2,
    height: 20,
    backgroundColor: '#FE9F4D',
    opacity: 1,
  },
  actionButton: {
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
  actionButtonDisabled: {
    backgroundColor: '#B0B8C1',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#6C7278',
  },
  footerLink: {
    fontSize: 14,
    color: '#4D81E7',
    fontWeight: '600',
  },
});
