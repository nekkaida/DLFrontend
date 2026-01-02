import { Stack } from 'expo-router';
import { OnboardingProvider } from '@features/onboarding';
import { ErrorBoundary } from '@shared/components/layout';

export default function OnboardingLayout() {
  return (
    <ErrorBoundary>
      <OnboardingProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            gestureEnabled: true, // Re-enable swipe-back gesture
            animation: 'default',
          }}
        >
          <Stack.Screen name="personal-info" />
          <Stack.Screen name="location" />
          <Stack.Screen name="game-select" />
          <Stack.Screen name="profile-picture" />
          <Stack.Screen name="dmr-intro" />
          <Stack.Screen name="skill-assessment" />
          <Stack.Screen name="assessment-results" />
        </Stack>
      </OnboardingProvider>
    </ErrorBoundary>
  );
}