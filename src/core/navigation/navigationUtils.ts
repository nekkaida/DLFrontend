import { router } from 'expo-router';

// Navigation utilities to prevent duplicate pages and manage navigation stack while preserving swipe-back gesture functionality

// Track navigation history to prevent duplicates
let navigationHistory: string[] = [];
let isNavigating = false;

// Global logout flag - checked by NavigationInterceptor to immediately block protected routes
// This prevents the brief "glimpse" of protected routes during session state transition
let _isLogoutInProgress = false;

export const getIsLogoutInProgress = () => _isLogoutInProgress;
export const setLogoutInProgress = (value: boolean) => {
  _isLogoutInProgress = value;
};

// Only block these specific auth pages after login - NOT the home page
const BLOCKED_AUTH_PAGES = ['/login', '/register', '/resetPassword', '/verifyEmail'];

// Check if a route is a blocked authentication page
const isBlockedAuthPage = (route: string): boolean => {
  return BLOCKED_AUTH_PAGES.some(authPage => route.startsWith(authPage));
};

// Add route to navigation history
export const addToHistory = (route: string) => {
  if (!isNavigating) {
    navigationHistory.push(route);
    // Keep only last 10 routes to prevent memory issues
    if (navigationHistory.length > 10) {
      navigationHistory = navigationHistory.slice(-10);
    }
  }
};

// Check if route already exists in recent history
const isDuplicateRoute = (route: string): boolean => {
  // Check if the route exists in the last 3 navigation entries
  const recentHistory = navigationHistory.slice(-3);
  return recentHistory.includes(route);
};

// Navigate to a route with duplicate prevention Use this for normal navigation within the app
export const navigateTo = (route: string) => {
  if (isNavigating) return;
  
  // Auth page blocking is handled by NavigationInterceptor
  // This allows normal navigation while the interceptor manages auth page restrictions
  
  isNavigating = true;
  
  // If it's a duplicate route, replace instead of push
  if (isDuplicateRoute(route)) {
    router.replace(route as any);
  } else {
    router.push(route as any);
  }
  
  addToHistory(route);
  
  // Reset navigation lock after a short delay
  setTimeout(() => {
    isNavigating = false;
  }, 100);
};

// Clear blocked authentication pages from navigation history
export const clearAuthPagesFromHistory = () => {
  navigationHistory = navigationHistory.filter(route => !isBlockedAuthPage(route));
};

// Navigate to a route and clear the navigation stack to prevent duplicates Use this for critical navigation points like login, dashboard, etc.
export const navigateAndClearStack = (route: string) => {
  if (isNavigating) return;

  isNavigating = true;
  navigationHistory = [route]; // Reset history

  // Dismiss all pushed/modal screens back to root, then replace root with target
  // This ensures no protected screens remain in the stack after logout
  try {
    if (router.canDismiss()) {
      router.dismissAll();
    }
  } catch (e) {
    // dismissAll may fail if already at root - that's fine
  }
  router.replace(route as any);

  setTimeout(() => {
    isNavigating = false;
  }, 300);
};

// Navigate back to the previous screen Use this instead of router.back() to ensure proper navigation
export const navigateBack = () => {
  if (isNavigating) return;
  
  if (router.canGoBack()) {
    isNavigating = true;
    router.back();
    // Remove last entry from history
    navigationHistory.pop();
    
    setTimeout(() => {
      isNavigating = false;
    }, 100);
  } else {
    // Fallback to dashboard if can't go back
    navigateAndClearStack('/user-dashboard');
  }
};

// Reset navigation stack to a specific route Use this for authentication flows and major state changes
export const resetToRoute = (route: string) => {
  navigateAndClearStack(route);
};

// Get current navigation history (for debugging)
export const getNavigationHistory = (): string[] => {
  return [...navigationHistory];
};

// Clear navigation history
export const clearNavigationHistory = () => {
  navigationHistory = [];
};
