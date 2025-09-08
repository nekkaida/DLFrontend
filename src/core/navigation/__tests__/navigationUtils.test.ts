/**
 * Tests for navigation utilities
 * These tests verify that duplicate route prevention works correctly
 */

import { navigateTo, navigateAndClearStack, getNavigationHistory, clearNavigationHistory } from '../navigationUtils';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    canGoBack: jest.fn(() => true),
    back: jest.fn(),
  },
}));

describe('Navigation Utils', () => {
  beforeEach(() => {
    clearNavigationHistory();
    jest.clearAllMocks();
  });

  describe('navigateTo', () => {
    it('should push new routes to history', () => {
      const { router } = require('expo-router');
      
      navigateTo('/profile');
      navigateTo('/settings');
      
      expect(router.push).toHaveBeenCalledTimes(2);
      expect(getNavigationHistory()).toEqual(['/profile', '/settings']);
    });

    it('should replace duplicate routes instead of pushing', () => {
      const { router } = require('expo-router');
      
      navigateTo('/profile');
      navigateTo('/settings');
      navigateTo('/profile'); // Duplicate
      
      expect(router.push).toHaveBeenCalledTimes(1); // Only first call
      expect(router.replace).toHaveBeenCalledTimes(1); // Duplicate call
    });
  });

  describe('navigateAndClearStack', () => {
    it('should clear navigation history and replace route', () => {
      const { router } = require('expo-router');
      
      navigateTo('/profile');
      navigateTo('/settings');
      navigateAndClearStack('/dashboard');
      
      expect(router.replace).toHaveBeenCalledWith('/dashboard');
      expect(getNavigationHistory()).toEqual(['/dashboard']);
    });
  });
});
