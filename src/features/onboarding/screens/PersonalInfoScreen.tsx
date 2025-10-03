import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { G, Path, Defs, ClipPath, Rect } from 'react-native-svg';
import { router } from 'expo-router';
import { useOnboarding } from '../OnboardingContext';
import { InputField, GenderSelector, DatePicker } from '@shared/components/forms';
import { BackgroundGradient } from '../components';
import { LoadingSpinner } from '@shared/components/ui';
import { validateFullName, validateGender, validateDateOfBirth } from '../utils/validation';
import { questionnaireAPI } from '../services/api';
import { useSession } from '../../../../lib/auth-client';
import { toast } from 'sonner-native';

const PersonalInfoScreen = () => {
  const { data, updateData, isLoading } = useOnboarding();
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    fullName: data.fullName || '',
    gender: data.gender || null,
    dateOfBirth: data.dateOfBirth || null,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Update context when form data changes
  useEffect(() => {
    updateData({
      fullName: formData.fullName,
      gender: formData.gender,
      dateOfBirth: formData.dateOfBirth,
    });
  }, [formData]);

  const [errors, setErrors] = useState({
    fullName: '',
    gender: '',
    dateOfBirth: '',
  });

  const validateForm = () => {
    const nameValidation = validateFullName(formData.fullName);
    const genderValidation = validateGender(formData.gender);
    const dobValidation = validateDateOfBirth(formData.dateOfBirth);

    const newErrors = {
      fullName: nameValidation.isValid ? '' : nameValidation.error || '',
      gender: genderValidation.isValid ? '' : genderValidation.error || '',
      dateOfBirth: dobValidation.isValid ? '' : dobValidation.error || '',
    };

    setErrors(newErrors);
    return nameValidation.isValid && genderValidation.isValid && dobValidation.isValid;
  };

  const handleNext = async () => {
    if (!validateForm()) {
      return;
    }

    if (!session?.user?.id) {
      toast.error('Error', {
        description: 'Please log in to continue.',
      });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaving(true);

    try {
      // Update local context first
      updateData({
        fullName: formData.fullName,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
      });

      // Save to backend database
      await questionnaireAPI.updateUserProfile(session.user.id, {
        name: formData.fullName.trim(),
        gender: formData.gender as 'male' | 'female',
        dateOfBirth: formData.dateOfBirth?.toISOString().split('T')[0] || '',
      });

      // Navigate to location screen (required step)
      router.push('/onboarding/location');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Error', {
        description: 'Failed to save your profile information. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading spinner while data is loading
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <BackgroundGradient />
        <LoadingSpinner message="Loading your information..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <BackgroundGradient />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Svg width="35" height="37" viewBox="0 0 67 71" fill="none">
              <Defs>
                <ClipPath id="clip0_1273_1964">
                  <Rect width="67" height="71" fill="white"/>
                </ClipPath>
              </Defs>
              <G clipPath="url(#clip0_1273_1964)">
                <Path d="M66.9952 35.2153C66.9769 35.9135 66.9083 36.6208 66.7848 37.3281C64.9275 48.0714 50.9017 59.5725 19.7851 70.9404C18.9983 71.2252 18.2846 70.5086 18.4676 69.6911C23.399 47.3457 22.7586 14.6934 18.1382 1.29534C17.8729 0.537481 18.646 -0.19282 19.4145 0.0506138C47.9694 9.11738 67.3521 21.482 66.9952 35.2153Z" fill="#44A7DE"/>
                <Path d="M20.6226 35.2153V37.3282H21.1303V35.2153H20.6226Z" stroke="#ED2124" strokeMiterlimit="10"/>
                <Path d="M22.3879 8.15321C21.6972 7.8271 20.9973 7.50558 20.2836 7.18866C14.5973 4.6303 8.22489 2.24649 1.31263 0.0509927C0.548666 -0.192441 -0.1787 0.519488 0.0363074 1.29572C6.46823 24.6929 7.2139 47.4425 0.365681 69.6914C0.118651 70.4906 0.900912 71.2255 1.68317 70.9408C8.74182 68.3595 14.9267 65.7735 20.2836 63.1876C21.0018 62.8477 21.7017 62.4987 22.3879 62.1542C39.2088 53.7029 47.3059 45.3067 48.6875 37.3285C48.811 36.6212 48.8796 35.9138 48.8979 35.2157C49.1587 25.2211 38.9664 15.9523 22.3879 8.15321ZM22.3879 46.8408C21.9808 47.0108 21.5599 47.1761 21.1299 47.3461V37.3285H20.6221V35.2157H21.1299V24.8812C21.5599 25.0879 21.9762 25.2946 22.3879 25.5013C28.7878 28.7119 33.0377 31.9454 34.0349 35.2157C34.25 35.9184 34.3186 36.6212 34.2179 37.3285C33.7879 40.461 30.1694 43.6348 22.3879 46.8408Z" fill="#195E9A"/>
                <Path d="M34.0349 35.2148C34.2499 35.9176 34.3185 36.6203 34.2179 37.3277H20.6221V35.2148H34.0349Z" fill="white"/>
                <Path d="M66.9952 35.2148C66.9769 35.913 66.9082 36.6203 66.7847 37.3277H48.6875C48.811 36.6203 48.8796 35.913 48.8979 35.2148H66.9952Z" fill="white"/>
                <Path d="M22.388 8.15254V62.1535C21.7018 62.498 21.0019 62.8471 20.2837 63.187V7.18799C20.9973 7.50491 21.6973 7.82643 22.388 8.15254Z" fill="white"/>
              </G>
            </Svg>
          </View>

          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Welcome aboard.</Text>
            <Text style={styles.subtitle}>
              Let&apos;s get you ready for the court.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Full Name */}
            <InputField
              label="Your Name"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChangeText={(text) => {
                setFormData({ ...formData, fullName: text });
                if (errors.fullName) {
                  setErrors({ ...errors, fullName: '' });
                }
              }}
              error={errors.fullName}
            />

            {/* Gender */}
            <GenderSelector
              label="Your Gender"
              selectedGender={formData.gender}
              onGenderSelect={(gender) => {
                setFormData({ ...formData, gender });
                if (errors.gender) {
                  setErrors({ ...errors, gender: '' });
                }
              }}
              error={errors.gender}
            />

            {/* Date of Birth */}
            <DatePicker
              label="Your Birthday"
              selectedDate={formData.dateOfBirth}
              onDateSelect={(date) => {
                setFormData({ ...formData, dateOfBirth: date });
                if (errors.dateOfBirth) {
                  setErrors({ ...errors, dateOfBirth: '' });
                }
              }}
              error={errors.dateOfBirth}
            />
          </View>

          {/* Confirm Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                ((!formData.fullName || !formData.gender || !formData.dateOfBirth) || isSaving) &&
                  styles.buttonDisabled,
              ]}
              onPress={handleNext}
              disabled={!formData.fullName || !formData.gender || !formData.dateOfBirth || isSaving}
            >
              <Text style={styles.buttonText}>
                {isSaving ? 'Saving...' : 'Confirm'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  buttonContainer: {
    paddingHorizontal: 71,
    marginTop: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    fontSize: 24,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#FE9F4D',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  headerContainer: {
    paddingHorizontal: 37,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 40,
    marginBottom: 10,
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FE9F4D',
    lineHeight: 30,
    fontFamily: 'Inter',
  },
  formContainer: {
    paddingHorizontal: 37,
  },
  button: {
    height: 40,
    backgroundColor: '#FE9F4D',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 24,
  },
});

export default PersonalInfoScreen;