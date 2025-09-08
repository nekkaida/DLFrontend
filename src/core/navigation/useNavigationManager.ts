import { useEffect, useRef } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { navigateTo, navigateAndClearStack, navigateBack, addToHistory } from './navigationUtils';

/**
 * Custom hook to manage navigation and prevent duplicates
 * while preserving swipe-back gesture functionality
 */
export const useNavigationManager = () => {
  const router = useRouter();
  const segments = useSegments();
  const currentRoute = useRef<string>('');
  const isInitialized = useRef(false);

  // Track current route changes
  useEffect(() => {
    const newRoute = '/' + segments.join('/');
    
    if (newRoute !== currentRoute.current) {
      currentRoute.current = newRoute;
      
      // Add to history only after initial load
      if (isInitialized.current) {
        addToHistory(newRoute);
      } else {
        isInitialized.current = true;
      }
    }
  }, [segments]);

  return {
    navigateTo,
    navigateAndClearStack,
    navigateBack,
    currentRoute: currentRoute.current,
  };
};
