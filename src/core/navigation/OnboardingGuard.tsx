import React, { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useSession } from '@/lib/auth-client';
import { useOnboarding } from '@features/onboarding/OnboardingContext';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

// Define the onboarding flow steps in order
const ONBOARDING_STEPS = [
  'personal-info',
  'location',
  'game-select',
  'skill-assessment',
  'profile-picture',
];

export const OnboardingGuard: React.FC<OnboardingGuardProps> = ({ children }) => {
  const router = useRouter();
  const segments = useSegments();
  const { data: session } = useSession();
  const { data: onboardingData } = useOnboarding();

  useEffect(() => {
    if (!session?.user) return;

    const currentPath = '/' + segments.join('/');

    // Check if user is in onboarding flow
    if (currentPath.includes('/onboarding/')) {
      const currentStep = segments[segments.length - 1];
      const currentStepIndex = ONBOARDING_STEPS.indexOf(currentStep);

      // Validate if user can access this step
      if (currentStepIndex > 0) {
        // Check if previous steps are completed
        const canAccessStep = validateStepAccess(currentStepIndex, onboardingData);

        if (!canAccessStep) {
          // Redirect to the first incomplete step
          const nextIncompleteStep = getFirstIncompleteStep(onboardingData);
          console.log(`Redirecting to incomplete step: ${nextIncompleteStep}`);
          router.replace(`/onboarding/${nextIncompleteStep}` as any);
        }
      }
    }
  }, [segments, session, onboardingData, router]);

  return <>{children}</>;
};

// Helper function to validate if a user can access a specific onboarding step
function validateStepAccess(stepIndex: number, data: any): boolean {
  // Check all previous steps are completed
  for (let i = 0; i < stepIndex; i++) {
    const step = ONBOARDING_STEPS[i];

    switch (step) {
      case 'personal-info':
        if (!data.fullName || !data.gender || !data.dateOfBirth) {
          return false;
        }
        break;
      case 'location':
        if (!data.location && !(data.useCurrentLocation && data.latitude && data.longitude)) {
          return false;
        }
        break;
      case 'game-select':
        if (!data.selectedSports || data.selectedSports.length === 0) {
          return false;
        }
        break;
      case 'skill-assessment':
        if (!data.skillAssessments || Object.keys(data.skillAssessments).length === 0) {
          return false;
        }
        break;
    }
  }

  return true;
}

// Helper function to get the first incomplete step
function getFirstIncompleteStep(data: any): string {
  if (!data.fullName || !data.gender || !data.dateOfBirth) {
    return 'personal-info';
  }
  if (!data.location && !(data.useCurrentLocation && data.latitude && data.longitude)) {
    return 'location';
  }
  if (!data.selectedSports || data.selectedSports.length === 0) {
    return 'game-select';
  }
  if (!data.skillAssessments || Object.keys(data.skillAssessments).length === 0) {
    return 'skill-assessment';
  }
  return 'profile-picture';
}