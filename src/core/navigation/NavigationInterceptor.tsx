import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { BackHandler } from 'react-native';
import { useSession } from '@/lib/auth-client';
import { getBackendBaseURL } from '@/src/config/network';

// Only block these specific auth pages after login - NOT the home page
const BLOCKED_AUTH_PAGES = ['/login', '/register', '/resetPassword', '/verifyEmail'];

const isBlockedAuthPage = (route: string): boolean => {
  return BLOCKED_AUTH_PAGES.some(authPage => route.startsWith(authPage));
};

// Pages where back navigation should be prevented
const NO_BACK_PAGES = ['/user-dashboard', '/login', '/'];

const isNoBackPage = (route: string): boolean => {
  return NO_BACK_PAGES.some(page => route === page);
};

interface NavigationInterceptorProps {
  children: React.ReactNode;
}

// Navigation interceptor component that prevents duplicate pages while preserving swipe-back gesture functionality
export const NavigationInterceptor: React.FC<NavigationInterceptorProps> = ({ children }) => {
  const router = useRouter();
  const segments = useSegments();
  const { data: session, isPending } = useSession();
  const navigationStack = useRef<string[]>([]);
  const isNavigating = useRef(false);
  const [onboardingStatus, setOnboardingStatus] = useState<{
    completedOnboarding: boolean;
    hasCompletedAssessment: boolean;
  } | null>(null);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);

  // Check onboarding completion status from backend (using existing APIs)
  const checkOnboardingStatus = async (userId: string) => {
    if (isCheckingOnboarding) return; // Prevent multiple concurrent checks

    console.log('NavigationInterceptor: Checking onboarding status for user:', userId);
    setIsCheckingOnboarding(true);
    try {
      const baseUrl = getBackendBaseURL();

      // Use the same API endpoint that login page uses
      const onboardingResponse = await fetch(`${baseUrl}/api/onboarding/status/${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!onboardingResponse.ok) {
        if (onboardingResponse.status === 404) {
          console.log('User not found in onboarding system, needs to complete onboarding');
        } else {
          console.warn(`Onboarding API error (${onboardingResponse.status}), assuming user needs onboarding`);
        }
        setOnboardingStatus({ completedOnboarding: false, hasCompletedAssessment: false });
        return;
      }

      const onboardingData = await onboardingResponse.json();
      console.log('NavigationInterceptor: Onboarding data received:', onboardingData);

      if (onboardingData?.completedOnboarding) {
        // Try assessment API, but don't fail if it doesn't exist
        try {
          const assessmentResponse = await fetch(`${baseUrl}/api/onboarding/assessment-status/${userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });

          if (assessmentResponse.ok) {
            const assessmentData = await assessmentResponse.json();
            const finalStatus = {
              completedOnboarding: true,
              hasCompletedAssessment: assessmentData?.hasCompletedAssessment || false
            };
            console.log('NavigationInterceptor: Final status (with assessment):', finalStatus);
            setOnboardingStatus(finalStatus);
          } else {
            // Assessment API doesn't exist, assume assessment needed
            const finalStatus = { completedOnboarding: true, hasCompletedAssessment: false };
            console.log('NavigationInterceptor: Final status (assessment API failed):', finalStatus);
            setOnboardingStatus(finalStatus);
          }
        } catch (assessmentError) {
          console.warn('Assessment API not available, assuming assessment needed');
          setOnboardingStatus({ completedOnboarding: true, hasCompletedAssessment: false });
        }
      } else {
        const finalStatus = { completedOnboarding: false, hasCompletedAssessment: false };
        console.log('NavigationInterceptor: Final status (onboarding not completed):', finalStatus);
        setOnboardingStatus(finalStatus);
      }
    } catch (error) {
      console.warn('Onboarding check failed, defaulting to incomplete for safety:', error);
      // Default to incomplete on error to be safe - this ensures onboarding flow works
      setOnboardingStatus({ completedOnboarding: false, hasCompletedAssessment: false });
    } finally {
      setIsCheckingOnboarding(false);
    }
  };

  // Function to refresh onboarding status (can be called after completing steps)
  const refreshOnboardingStatus = () => {
    if (session?.user?.id) {
      setOnboardingStatus(null); // Clear cache
      checkOnboardingStatus(session.user.id);
    }
  };

  // Check onboarding status when user session changes
  useEffect(() => {
    if (session?.user?.id && !onboardingStatus) {
      checkOnboardingStatus(session.user.id);
    } else if (!session?.user) {
      // Reset onboarding status when user logs out
      setOnboardingStatus(null);
    }
  }, [session?.user?.id]);

  // Track navigation stack and block auth pages for authenticated users
  useEffect(() => {
    // Don't do anything while auth is loading
    if (isPending) {
      console.log('NavigationInterceptor: Auth pending, waiting...');
      return;
    }

    const currentRoute = '/' + segments.join('/');
    const lastRoute = navigationStack.current[navigationStack.current.length - 1];

    // Handle landing page routing
    if (currentRoute === '/') {
      // Let unauthenticated users stay on landing page - they can navigate manually
      if (!session?.user) {
        console.log('NavigationInterceptor: Unauthenticated user on landing page, staying here');
        return;
      }

      // Authenticated users - check onboarding status
      if (isCheckingOnboarding || !onboardingStatus) {
        // Still checking onboarding status, don't redirect yet
        console.log('NavigationInterceptor: Checking onboarding status...');
        return;
      }

      if (!onboardingStatus.completedOnboarding) {
        console.log('NavigationInterceptor: User needs onboarding, redirecting to personal-info');
        setTimeout(() => router.replace('/onboarding/personal-info'), 100);
        return;
      }

      if (!onboardingStatus.hasCompletedAssessment) {
        console.log('NavigationInterceptor: User needs assessment, redirecting to game-select');
        setTimeout(() => router.replace('/onboarding/game-select'), 100);
        return;
      }

      console.log('NavigationInterceptor: User completed onboarding, redirecting to dashboard');
      setTimeout(() => router.replace('/user-dashboard'), 100);
      return;
    }

    // Block access to protected routes if onboarding is incomplete
    const protectedRoutes = ['/user-dashboard', '/profile', '/edit-profile', '/settings', '/match-history'];
    const isProtectedRoute = protectedRoutes.some(route => currentRoute.startsWith(route));

    if (session?.user && isProtectedRoute && onboardingStatus) {
      if (!onboardingStatus.completedOnboarding) {
        console.warn('Access to protected route blocked - onboarding incomplete:', currentRoute);
        setTimeout(() => router.replace('/onboarding/personal-info'), 100);
        return;
      }

      if (!onboardingStatus.hasCompletedAssessment) {
        console.warn('Access to protected route blocked - assessment incomplete:', currentRoute);
        setTimeout(() => router.replace('/onboarding/game-select'), 100);
        return;
      }
    }

    // Block authenticated users from auth pages and redirect based on onboarding status
    if (session?.user && isBlockedAuthPage(currentRoute)) {
      console.warn('Navigation to auth page blocked for authenticated user:', currentRoute);

      if (!onboardingStatus) {
        // Still checking status, don't redirect yet
        return;
      }

      // Redirect based on onboarding status
      if (onboardingStatus.completedOnboarding && onboardingStatus.hasCompletedAssessment) {
        setTimeout(() => router.replace('/user-dashboard'), 100);
      } else if (onboardingStatus.completedOnboarding) {
        setTimeout(() => router.replace('/onboarding/game-select'), 100);
      } else {
        setTimeout(() => router.replace('/onboarding/personal-info'), 100);
      }
      return;
    }
    
    if (currentRoute !== lastRoute && !isNavigating.current) {
      // Add new route to stack
      navigationStack.current.push(currentRoute);

      // Keep only last 5 routes to prevent memory issues
      if (navigationStack.current.length > 5) {
        navigationStack.current = navigationStack.current.slice(-5);
      }

      // Only refresh status when completing onboarding (going from onboarding to dashboard)
      const shouldRefreshStatus = (
        lastRoute?.includes('/onboarding/') && currentRoute === '/user-dashboard'
      );

      if (shouldRefreshStatus && session?.user?.id) {
        console.log('Refreshing onboarding status due to onboarding completion');
        refreshOnboardingStatus();
      }
    }
  }, [segments, router, session, onboardingStatus, isCheckingOnboarding, isPending]);

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      const currentRoute = '/' + segments.join('/');

      // Prevent back from certain pages
      if (isNoBackPage(currentRoute)) {
        // If on dashboard or login, exit app (return false lets Android handle it)
        if (currentRoute === '/user-dashboard' || currentRoute === '/login') {
          return false; // This will minimize/exit the app
        }
        return true; // Just prevent back but don't exit
      }

      // For onboarding pages, use router.back() for natural navigation
      if (currentRoute.includes('/onboarding/')) {
        router.back();
        return true;
      }

      // Check if we can go back
      if (navigationStack.current.length > 1) {
        const previousRoute = navigationStack.current[navigationStack.current.length - 2];

        // Prevent back navigation to blocked auth pages for authenticated users
        if (session?.user && isBlockedAuthPage(previousRoute)) {
          console.warn('Back navigation to auth page blocked for authenticated user');
          // Stay on current page instead of forcing navigation
          return true;
        }

        // Use router.back() for natural navigation instead of replace
        router.back();
        // Remove current route from stack after navigation
        setTimeout(() => {
          navigationStack.current.pop();
        }, 100);

        return true;
      }

      // No navigation history, let Android handle back (usually exits app)
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [router, session, segments]);

  return <>{children}</>;
};
