import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { G, Path, Defs, ClipPath, Rect } from 'react-native-svg';
import { toast } from 'sonner-native';
import {
  InputField,
  SocialButton,
} from '../components/AuthComponents';
import { AuthStyles, AuthColors } from '../styles/AuthStyles';
import { PrivacyPolicyModal } from '../components/PrivacyPolicyModal';
import { TermsOfServiceModal } from '../components/TermsOfServiceModal';
import { validatePassword, PasswordStrength } from '../utils/passwordValidation';
import axiosInstance, { endpoints } from '@/lib/endpoints';
import {
  scale,
  verticalScale,
  moderateScale,
} from '@/core/utils/responsive';
import { useScreenSizes } from '@/core/utils/authScreenSizes';
import { DeuceLogo } from '../../onboarding';

// Safe haptics wrapper - handles unsupported devices gracefully
const triggerHaptic = async (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
  try {
    await Haptics.impactAsync(style);
  } catch {
    // Haptics not supported on this device
  }
};

// Debounce delay in milliseconds
const DEBOUNCE_DELAY = 500;

// Validation constants
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 30;
const MAX_EMAIL_LENGTH = 255;

// Validation functions
const validateEmail = (email: string): { isValid: boolean; error: string } => {
  const trimmed = email.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Email is required' };
  }
  if (trimmed.length > MAX_EMAIL_LENGTH) {
    return { isValid: false, error: 'Email address is too long' };
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  return { isValid: true, error: '' };
};

const validateUsername = (username: string): { isValid: boolean; error: string } => {
  const trimmed = username.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Username is required' };
  }
  if (trimmed.length < MIN_USERNAME_LENGTH) {
    return { isValid: false, error: `Username must be at least ${MIN_USERNAME_LENGTH} characters` };
  }
  if (trimmed.length > MAX_USERNAME_LENGTH) {
    return { isValid: false, error: `Username must be less than ${MAX_USERNAME_LENGTH} characters` };
  }
  if (!USERNAME_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  return { isValid: true, error: '' };
};

interface SignUpScreenProps {
  onSignUp: (data: SignUpData) => void | Promise<void>;
  onLogin: () => void;
  onSocialSignUp: (provider: 'google' | 'apple') => void | Promise<void>;
}

export interface SignUpData {
  email: string;
  username: string;
  password: string;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onSignUp,
  onLogin,
  onSocialSignUp,
}) => {
  const lastPressTimeRef = useRef<number>(0);

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>(null);

  // Email validation state
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [emailError, setEmailError] = useState('');
  
  // Username validation state
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [usernameError, setUsernameError] = useState('');

  // Policy agreement states
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

  // Debounce timers
  const emailDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const usernameDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Responsive size tokens — breakpoints live in src/core/utils/authScreenSizes.ts
  const { rs } = useScreenSizes();

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
    setPassword(text);
    const validation = validatePassword(text);
    setPasswordError(validation.error);
    setPasswordStrength(validation.strength);
  };

  // Check email availability with debouncing
  const checkEmailAvailability = useCallback(async (emailValue: string) => {
    const validation = validateEmail(emailValue);
    
    if (!validation.isValid) {
      setEmailStatus('idle');
      setEmailError(validation.error);
      return;
    }

    setEmailStatus('checking');
    setEmailError('');

    try {
      const response = await axiosInstance.post(endpoints.auth.checkEmail, {
        email: emailValue.trim().toLowerCase(),
      });

      if (response.data?.data?.available) {
        setEmailStatus('available');
        setEmailError('');
      } else {
        setEmailStatus('taken');
        setEmailError(response.data?.message || 'This email is already registered');
      }
    } catch (error: any) {
      if (__DEV__) console.error('Email check error:', error);
      setEmailStatus('idle');
      if (error.code === 'ERR_NETWORK' || !error.response) {
        setEmailError('Network error — please check your connection');
      } else {
        setEmailError(error.response?.data?.message || 'Could not verify email');
      }
    }
  }, []);

  // Check username availability with debouncing
  const checkUsernameAvailability = useCallback(async (usernameValue: string) => {
    const validation = validateUsername(usernameValue);
    
    if (!validation.isValid) {
      setUsernameStatus('idle');
      setUsernameError(validation.error);
      return;
    }

    setUsernameStatus('checking');
    setUsernameError('');

    try {
      const response = await axiosInstance.post(endpoints.auth.checkUsername, {
        username: usernameValue.trim(),
      });

      if (response.data?.data?.available) {
        setUsernameStatus('available');
        setUsernameError('');
      } else {
        setUsernameStatus('taken');
        setUsernameError(response.data?.message || 'This username is already taken');
      }
    } catch (error: any) {
      if (__DEV__) console.error('Username check error:', error);
      setUsernameStatus('idle');
      if (error.code === 'ERR_NETWORK' || !error.response) {
        setUsernameError('Network error — please check your connection');
      } else {
        setUsernameError(error.response?.data?.message || 'Could not verify username');
      }
    }
  }, []);

  // Handle email change with debounced validation
  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
    setEmailStatus('idle');
    setEmailError('');

    // Clear previous timer
    if (emailDebounceTimer.current) {
      clearTimeout(emailDebounceTimer.current);
    }

    // Only check if email looks valid
    const trimmed = text.trim();
    if (trimmed.length > 0 && EMAIL_REGEX.test(trimmed)) {
      emailDebounceTimer.current = setTimeout(() => {
        checkEmailAvailability(text);
      }, DEBOUNCE_DELAY);
    }
  }, [checkEmailAvailability]);

  // Handle username change with debounced validation
  const handleUsernameChange = useCallback((text: string) => {
    setUsername(text);
    setUsernameStatus('idle');
    setUsernameError('');

    // Clear previous timer
    if (usernameDebounceTimer.current) {
      clearTimeout(usernameDebounceTimer.current);
    }

    // Only check if username looks valid
    const trimmed = text.trim();
    if (trimmed.length >= MIN_USERNAME_LENGTH && USERNAME_REGEX.test(trimmed)) {
      usernameDebounceTimer.current = setTimeout(() => {
        checkUsernameAvailability(text);
      }, DEBOUNCE_DELAY);
    }
  }, [checkUsernameAvailability]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (emailDebounceTimer.current) clearTimeout(emailDebounceTimer.current);
      if (usernameDebounceTimer.current) clearTimeout(usernameDebounceTimer.current);
    };
  }, []);

  const handleSignUp = async () => {
    // Validate all fields
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      toast.error('Invalid Email', { description: emailValidation.error });
      return;
    }

    // Check email availability status
    if (emailStatus === 'taken') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      toast.error('Email Already Registered', { 
        description: 'This email is already registered. Please use a different email or login instead.' 
      });
      return;
    }

    if (emailStatus === 'checking') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      toast.info('Please Wait', { description: 'Checking email availability...' });
      return;
    }

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      toast.error('Invalid Username', { description: usernameValidation.error });
      return;
    }

    // Check username availability status
    if (usernameStatus === 'taken') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      toast.error('Username Taken', { 
        description: 'This username is already taken. Please choose a different username.' 
      });
      return;
    }

    if (usernameStatus === 'checking') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      toast.info('Please Wait', { description: 'Checking username availability...' });
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      toast.error('Invalid Password', { description: passwordValidation.error || 'Please enter a valid password' });
      return;
    }

    // Require both policy agreements
    if (!agreedToTerms || !agreedToPrivacy) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      toast.error('Agreement Required', {
        description: !agreedToTerms && !agreedToPrivacy
          ? 'Please agree to the Terms of Service and Privacy Policy to register.'
          : !agreedToTerms
            ? 'Please agree to the Terms of Service to register.'
            : 'Please consent to the Privacy Policy to register.',
      });
      return;
    }

    if (isLoading) return;

    try {
      setIsLoading(true);
      if (__DEV__) {
        console.log('Signup Data:', {
          email,
          username,
          password: '***'
        });
      }
      await onSignUp({ email: email.trim(), username: username.trim(), password });
    } catch (error) {
      if (__DEV__) console.error('Sign up error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={AuthStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[AuthStyles.screenContainer, { paddingHorizontal: rs.hPadding }]}>

        <View style={{
            position: 'absolute',
            width: scale(67),
            height: verticalScale(71),
            right: scale(34),
            top: verticalScale(80),
          }}>
            <DeuceLogo width={scale(67)} height={verticalScale(71)}/> 
          </View>

          {/* Content Section */}
          <View style={{
            flex: 1,
            marginTop: verticalScale(120),
            gap: rs.sectionGap,
          }}>
      
            {/* Header Title */}
            <View style={{
            }}>
              <Text style={{
                fontFamily: 'Inter',
                fontWeight: '700',
                fontSize: rs.headerFontSize,
                lineHeight: rs.headerLineHeight,
              }}>
                <Text style={{ color: 'black '}}>Hello!{'\n'}</Text>
                <Text style={{ color: AuthColors.primary}}>Join our leagues.</Text>
              </Text>
            </View>

            {/* Input Section */}
            <View style={{ gap: rs.inputGap }}>
              {/* Email Input */}
              <InputField
                label="Email"
                placeholder="yourname@gmail.com"
                value={email}
                onChangeText={handleEmailChange}
                icon="mail"
                keyboardType="email-address"
                validationStatus={emailStatus}
                validationError={emailError}
              />

              {/* Username Input */}
              <InputField
                label="Username"
                placeholder="Choose a username"
                value={username}
                onChangeText={handleUsernameChange}
                icon="user"
                validationStatus={usernameStatus}
                validationError={usernameError}
              />

              {/* Password Input */}
              <View>
                <InputField
                  label="Password"
                  placeholder="Create a password"
                  value={password}
                  onChangeText={handlePasswordChange}
                  icon="lock"
                  secureTextEntry={!showPassword}
                  showEyeIcon
                  onEyePress={() => setShowPassword(!showPassword)}
                />

                {/* Password Validation Feedback */}
                {password.length > 0 && (
                  <View style={{ marginTop: verticalScale(6), gap: verticalScale(3) }}>
                    {passwordError && (
                      <Text style={{
                        fontFamily: 'Inter',
                        fontSize: moderateScale(11),
                        lineHeight: moderateScale(15),
                        color: '#EF4444',
                        fontWeight: '500',
                      }}>
                        {passwordError}
                      </Text>
                    )}

                    {passwordStrength && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(6) }}>
                        <View style={{ flexDirection: 'row', gap: scale(4), flex: 1 }}>
                          <View style={{
                            flex: 1,
                            height: verticalScale(3),
                            borderRadius: moderateScale(2),
                            backgroundColor: passwordStrength === 'weak' ? '#EF4444' :
                                             passwordStrength === 'medium' ? '#F59E0B' : '#10B981',
                          }} />
                          <View style={{
                            flex: 1,
                            height: verticalScale(3),
                            borderRadius: moderateScale(2),
                            backgroundColor: passwordStrength === 'medium' || passwordStrength === 'strong' ?
                                             (passwordStrength === 'medium' ? '#F59E0B' : '#10B981') : '#E5E7EB',
                          }} />
                          <View style={{
                            flex: 1,
                            height: verticalScale(3),
                            borderRadius: moderateScale(2),
                            backgroundColor: passwordStrength === 'strong' ? '#10B981' : '#E5E7EB',
                          }} />
                        </View>
                        <Text style={{
                          fontFamily: 'Inter',
                          fontSize: moderateScale(11),
                          lineHeight: moderateScale(15),
                          fontWeight: '600',
                          color: passwordStrength === 'weak' ? '#EF4444' :
                                 passwordStrength === 'medium' ? '#F59E0B' : '#10B981',
                        }}>
                          {passwordStrength === 'weak' ? 'Weak' :
                           passwordStrength === 'medium' ? 'Medium' : 'Strong'}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>

            {/* Policy Agreement Section */}
            <View style={{ gap: rs.policyGap }}>
              <Text style={{
                fontFamily: 'Inter',
                fontWeight: '500',
                fontSize: rs.policyFontSize,
                lineHeight: rs.policyLineHeight,
                color: '#6C7278',
              }}>
                Please review and agree to the following to create your account:
              </Text>

              {/* Terms of Service Row */}
              <TouchableOpacity
                onPress={() => setAgreedToTerms(!agreedToTerms)}
                style={{ flexDirection: 'row', alignItems: 'flex-start', gap: scale(8) }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: agreedToTerms }}
                accessibilityLabel="Agree to Terms of Service"
              >
                <View style={{
                  width: rs.checkboxSize,
                  height: rs.checkboxSize,
                  borderRadius: moderateScale(4),
                  borderWidth: 2,
                  borderColor: agreedToTerms ? AuthColors.primary : '#C5C5C5',
                  backgroundColor: agreedToTerms ? AuthColors.primary : 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: verticalScale(1),
                  flexShrink: 0,
                }}>
                  {agreedToTerms && (
                    <Svg width={scale(10)} height={scale(10)} viewBox="0 0 12 12" fill="none">
                      <Path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </Svg>
                  )}
                </View>
                <Text style={{
                  fontFamily: 'Inter',
                  fontWeight: '400',
                  fontSize: rs.policyFontSize,
                  lineHeight: rs.policyLineHeight,
                  color: '#404040',
                  flex: 1,
                }}>
                  {'I have read and agree to the '}
                  <Text
                    onPress={() => Linking.openURL('https://deuceleague.com/terms-of-service')}
                    style={{ color: '#4DABFE', fontWeight: '600', textDecorationLine: 'underline' }}
                  >
                    Terms of Service
                  </Text>
                </Text>
              </TouchableOpacity>

              {/* Privacy Policy Row */}
              <TouchableOpacity
                onPress={() => setAgreedToPrivacy(!agreedToPrivacy)}
                style={{ flexDirection: 'row', alignItems: 'flex-start', gap: scale(8) }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: agreedToPrivacy }}
                accessibilityLabel="Agree to Privacy Policy"
              >
                <View style={{
                  width: rs.checkboxSize,
                  height: rs.checkboxSize,
                  borderRadius: moderateScale(4),
                  borderWidth: 2,
                  borderColor: agreedToPrivacy ? AuthColors.primary : '#C5C5C5',
                  backgroundColor: agreedToPrivacy ? AuthColors.primary : 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: verticalScale(1),
                  flexShrink: 0,
                }}>
                  {agreedToPrivacy && (
                    <Svg width={scale(10)} height={scale(10)} viewBox="0 0 12 12" fill="none">
                      <Path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </Svg>
                  )}
                </View>
                <Text style={{
                  fontFamily: 'Inter',
                  fontWeight: '400',
                  fontSize: rs.policyFontSize,
                  lineHeight: rs.policyLineHeight,
                  color: '#404040',
                  flex: 1,
                }}>
                  {'I consent to the collection and processing of my personal data as described in the '}
                  <Text
                    onPress={() => Linking.openURL('https://deuceleague.com/privacy-policy')}
                    style={{ color: '#4DABFE', fontWeight: '600', textDecorationLine: 'underline' }}
                  >
                    Privacy Policy
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sign Up Button with Arrow */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              // marginTop: rs.signUpRowMarginTop,
            }}>
              <Text style={{
                fontFamily: 'Inter',
                fontWeight: '600',
                fontSize: rs.signUpFontSize,
                letterSpacing: -0.01,
                color: '#000000',
              }}>
                Sign Up
              </Text>
              <TouchableOpacity
                onPress={handleSignUp}
                disabled={isLoading}
                style={{
                  width: rs.btnSize,
                  height: rs.btnSize,
                  borderRadius: rs.btnSize / 2,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: AuthColors.primary,
                  shadowOffset: { width: 0, height: verticalScale(4) },
                  shadowOpacity: 0.3,
                  shadowRadius: moderateScale(8),
                  elevation: 6,
                }}
                accessibilityLabel="Sign up"
                accessibilityRole="button"
                accessibilityHint="Creates your account"
                accessibilityState={{ disabled: isLoading }}
              >
                <LinearGradient
                  colors={[AuthColors.primary, AuthColors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: rs.btnSize,
                    height: rs.btnSize,
                    borderRadius: rs.btnSize / 2,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Svg width={moderateScale(36)} height={moderateScale(36)} viewBox="0 0 42 42" fill="none">
                      <Path d="M8.75 21H33.25M33.25 21L26.25 28M33.25 21L26.25 14" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </Svg>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Or Sign Up With */}
            <Text style={{
              textAlign: 'center',
              fontFamily: 'Inter',
              fontWeight: '500',
              fontSize: rs.labelFontSize,
              lineHeight: moderateScale(15),
              letterSpacing: -0.01,
              color: '#404040',
            }}>or sign up with</Text>

            {/* Social Sign Up Buttons */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: rs.socialGap,
            }}>
              <SocialButton
                type="apple"
                onPress={() => onSocialSignUp('apple')}
              />
              <SocialButton
                type="google"
                onPress={() => onSocialSignUp('google')}
              />
            </View>

            {/* Login Link */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: scale(4),
              paddingBottom: verticalScale(14),
            }}>
              <Text style={{
                fontFamily: 'Inter',
                fontWeight: '500',
                fontSize: rs.loginFontSize,
                lineHeight: rs.loginLineHeight,
                letterSpacing: -0.01,
                color: '#404040',
              }}>Already have an account?</Text>
              <TouchableOpacity
                onPress={() => handleDebouncedPress(onLogin)}
                style={{
                  paddingVertical: verticalScale(2),
                  paddingHorizontal: scale(3),
                  borderBottomWidth: 1,
                  borderBottomColor: AuthColors.primary,
                }}
                accessibilityLabel="Log in to existing account"
                accessibilityRole="button"
                accessibilityHint="Navigates to the login screen"
              >
                <Text style={{
                  fontFamily: 'Inter',
                  fontWeight: '600',
                  fontSize: rs.loginFontSize,
                  lineHeight: rs.loginLineHeight,
                  letterSpacing: -0.01,
                  color: AuthColors.primary,
                }}>Log in</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </ScrollView>

    </KeyboardAvoidingView>
  );
};
