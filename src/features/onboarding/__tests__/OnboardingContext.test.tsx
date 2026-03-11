import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { OnboardingProvider, useOnboarding } from '../OnboardingContext';
import type { OnboardingData, SportType } from '../types';

// Mock auth-client to avoid ESM import issue with @better-auth/expo
jest.mock('@/lib/auth-client', () => ({
  useSession: jest.fn(),
}));

// Mock the questionnaireAPI
jest.mock('../services/api', () => ({
  questionnaireAPI: {
    getUserProfile: jest.fn(),
  },
}));

import { useSession } from '@/lib/auth-client';
import { questionnaireAPI } from '../services/api';
const mockUseSession = useSession as jest.Mock;
const mockGetUserProfile = questionnaireAPI.getUserProfile as jest.Mock;

// Mock the storage module
jest.mock('@core/storage', () => ({
  OnboardingStorage: {
    loadData: jest.fn(),
    saveData: jest.fn(),
    clearData: jest.fn(),
    clearProgress: jest.fn(),
    saveProgress: jest.fn(),
  },
}));

import { OnboardingStorage } from '@core/storage';

const mockStorage = OnboardingStorage as jest.Mocked<typeof OnboardingStorage>;

describe('OnboardingContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({ data: null });
    mockGetUserProfile.mockResolvedValue({ success: false });
    mockStorage.loadData.mockResolvedValue(null);
    mockStorage.saveData.mockResolvedValue(undefined);
    mockStorage.clearData.mockResolvedValue(undefined);
    mockStorage.clearProgress.mockResolvedValue(undefined);
    mockStorage.saveProgress.mockResolvedValue(undefined);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <OnboardingProvider>{children}</OnboardingProvider>
  );

  describe('useOnboarding hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useOnboarding());
      }).toThrow('useOnboarding must be used within an OnboardingProvider');

      consoleSpy.mockRestore();
    });

    it('should provide initial data when no stored data exists', async () => {
      const { result } = renderHook(() => useOnboarding(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({
        fullName: '',
        gender: null,
        dateOfBirth: null,
        location: '',
        useCurrentLocation: false,
        latitude: undefined,
        longitude: undefined,
        selectedSports: [],
        sportSkillLevels: {},
        skillAssessments: {},
        profileImage: undefined,
      });
    });

    it('should load stored data on mount', async () => {
      const storedData: Partial<OnboardingData> = {
        fullName: 'John Doe',
        gender: 'male',
        selectedSports: ['tennis'] as SportType[],
      };
      mockStorage.loadData.mockResolvedValue(storedData);

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data.fullName).toBe('John Doe');
      expect(result.current.data.gender).toBe('male');
      expect(result.current.data.selectedSports).toEqual(['tennis']);
    });
  });

  describe('updateData', () => {
    it('should update data and save to storage', async () => {
      const { result } = renderHook(() => useOnboarding(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateData({ fullName: 'Jane Doe' });
      });

      expect(result.current.data.fullName).toBe('Jane Doe');
      expect(mockStorage.saveData).toHaveBeenCalled();
    });

    it('should merge updates with existing data', async () => {
      const storedData: Partial<OnboardingData> = {
        fullName: 'John Doe',
        gender: 'male',
      };
      mockStorage.loadData.mockResolvedValue(storedData);

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateData({ location: 'New York' });
      });

      expect(result.current.data.fullName).toBe('John Doe');
      expect(result.current.data.gender).toBe('male');
      expect(result.current.data.location).toBe('New York');
    });

    it('should handle storage save errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockStorage.saveData.mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateData({ fullName: 'Test' });
      });

      // Data should still be updated in state despite storage error
      expect(result.current.data.fullName).toBe('Test');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('clearData', () => {
    it('should reset data to initial state', async () => {
      const storedData: Partial<OnboardingData> = {
        fullName: 'John Doe',
        gender: 'male',
        selectedSports: ['tennis', 'pickleball'] as SportType[],
      };
      mockStorage.loadData.mockResolvedValue(storedData);

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data.fullName).toBe('John Doe');

      await act(async () => {
        await result.current.clearData();
      });

      expect(result.current.data.fullName).toBe('');
      expect(result.current.data.gender).toBeNull();
      expect(result.current.data.selectedSports).toEqual([]);
      expect(mockStorage.clearData).toHaveBeenCalled();
      expect(mockStorage.clearProgress).toHaveBeenCalled();
    });
  });

  describe('saveProgress', () => {
    it('should save progress based on completed fields', async () => {
      const { result } = renderHook(() => useOnboarding(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Complete personal info
      await act(async () => {
        await result.current.updateData({
          fullName: 'John Doe',
          gender: 'male',
          dateOfBirth: new Date('1990-01-01'),
        });
      });

      await act(async () => {
        await result.current.saveProgress();
      });

      expect(mockStorage.saveProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          completedSteps: expect.arrayContaining(['personal-info']),
          currentStep: 'personal-info',
        })
      );
    });

    it('should track location step completion', async () => {
      const { result } = renderHook(() => useOnboarding(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateData({
          fullName: 'John Doe',
          gender: 'male',
          dateOfBirth: new Date('1990-01-01'),
          location: 'New York, NY',
        });
      });

      await act(async () => {
        await result.current.saveProgress();
      });

      expect(mockStorage.saveProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          completedSteps: expect.arrayContaining(['personal-info', 'location']),
        })
      );
    });

    it('should track game selection step completion', async () => {
      const { result } = renderHook(() => useOnboarding(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateData({
          fullName: 'John Doe',
          gender: 'male',
          dateOfBirth: new Date('1990-01-01'),
          location: 'New York, NY',
          selectedSports: ['tennis'] as SportType[],
        });
      });

      await act(async () => {
        await result.current.saveProgress();
      });

      expect(mockStorage.saveProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          completedSteps: expect.arrayContaining(['personal-info', 'location', 'game-select']),
        })
      );
    });

    it('should track current location usage for location step', async () => {
      const { result } = renderHook(() => useOnboarding(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateData({
          fullName: 'John Doe',
          gender: 'male',
          dateOfBirth: new Date('1990-01-01'),
          useCurrentLocation: true,
          latitude: 40.7128,
          longitude: -74.006,
        });
      });

      await act(async () => {
        await result.current.saveProgress();
      });

      expect(mockStorage.saveProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          completedSteps: expect.arrayContaining(['personal-info', 'location']),
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle storage load errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockStorage.loadData.mockRejectedValue(new Error('Load error'));

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should fall back to initial data
      expect(result.current.data.fullName).toBe('');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle clear errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockStorage.clearData.mockRejectedValue(new Error('Clear error'));

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.clearData();
      });

      // Data should still be reset in state
      expect(result.current.data.fullName).toBe('');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  // BUG 14: AbortController — should not continue async work after unmount
  describe('AbortController cleanup', () => {
    it('should not save backend data to storage after unmount', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      // Setup: user is logged in, no local data, backend has data
      mockUseSession.mockReturnValue({ data: { user: { id: 'user-123' } } });
      mockStorage.loadData.mockResolvedValue(null); // No local data

      // Create a deferred promise for the backend fetch
      let resolveProfile: (value: any) => void;
      const deferredProfile = new Promise<any>((resolve) => {
        resolveProfile = resolve;
      });
      mockGetUserProfile.mockReturnValue(deferredProfile);

      const { unmount } = renderHook(() => useOnboarding(), { wrapper });

      // Unmount BEFORE the backend fetch resolves
      unmount();

      // Now resolve the backend fetch — after unmount
      await act(async () => {
        resolveProfile!({
          success: true,
          user: { name: 'Late Data', gender: 'male' },
        });
      });

      // Without AbortController: saveData WILL be called with backend data
      // With AbortController: saveData should NOT be called (async work aborted)
      const saveCallsWithBackendData = mockStorage.saveData.mock.calls.filter(
        (args: any[]) => args[0]?.fullName === 'Late Data'
      );
      expect(saveCallsWithBackendData).toHaveLength(0);

      consoleSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });
});
