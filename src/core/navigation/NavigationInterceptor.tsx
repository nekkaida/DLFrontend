import React, { useEffect, useRef } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { BackHandler } from 'react-native';
import { useSession } from '@/lib/auth-client';

// Only block these specific auth pages after login - NOT the home page
const BLOCKED_AUTH_PAGES = ['/login', '/register', '/resetPassword', '/verifyEmail'];

const isBlockedAuthPage = (route: string): boolean => {
  return BLOCKED_AUTH_PAGES.some(authPage => route.startsWith(authPage));
};

interface NavigationInterceptorProps {
  children: React.ReactNode;
}

// Navigation interceptor component that prevents duplicate pages while preserving swipe-back gesture functionality
export const NavigationInterceptor: React.FC<NavigationInterceptorProps> = ({ children }) => {
  const router = useRouter();
  const segments = useSegments();
  const { data: session } = useSession();
  const navigationStack = useRef<string[]>([]);
  const isNavigating = useRef(false);

  // Track navigation stack and block auth pages for authenticated users
  useEffect(() => {
    const currentRoute = '/' + segments.join('/');
    const lastRoute = navigationStack.current[navigationStack.current.length - 1];
    
    // Only block specific auth pages if user is authenticated
    if (session?.user && isBlockedAuthPage(currentRoute)) {
      console.warn('Navigation to auth page blocked for authenticated user:', currentRoute);
      // Redirect to dashboard instead
      router.replace('/user-dashboard');
      return;
    }
    
    if (currentRoute !== lastRoute && !isNavigating.current) {
      // Add new route to stack
      navigationStack.current.push(currentRoute);
      
      // Keep only last 5 routes to prevent memory issues
      if (navigationStack.current.length > 5) {
        navigationStack.current = navigationStack.current.slice(-5);
      }
    }
  }, [segments, router, session]);

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      if (navigationStack.current.length > 1) {
        // Remove current route from stack
        navigationStack.current.pop();
        const previousRoute = navigationStack.current[navigationStack.current.length - 1];
        
        // Prevent back navigation to blocked auth pages for authenticated users
        if (session?.user && isBlockedAuthPage(previousRoute)) {
          console.warn('Back navigation to auth page blocked for authenticated user:', previousRoute);
          return true; // Prevent default back behavior
        }
        
        isNavigating.current = true;
        router.replace(previousRoute as any);
        
        setTimeout(() => {
          isNavigating.current = false;
        }, 100);
        
        return true; // Prevent default back behavior
      }
      return false; // Allow default back behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [router, session]);

  return <>{children}</>;
};
