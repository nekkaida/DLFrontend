import { renderHook, act } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { useSettings } from '../useSettings';

// Mock axiosInstance
const mockGet = jest.fn();
const mockPut = jest.fn();
jest.mock('@/lib/endpoints', () => ({
  __esModule: true,
  default: {
    get: (...args: any[]) => mockGet(...args),
    put: (...args: any[]) => mockPut(...args),
  },
}));

// expo-secure-store is mocked in jest.setup.js

describe('useSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockRejectedValue(new Error('Network error')); // Default: backend unavailable
    mockPut.mockResolvedValue({ data: { success: true } });
  });

  describe('S-1: stale closure in updateSetting', () => {
    it('should not lose first update when two settings are changed rapidly', async () => {
      const savedValues: string[] = [];
      (SecureStore.setItemAsync as jest.Mock).mockImplementation(
        (_key: string, value: string) => {
          savedValues.push(value);
          return Promise.resolve();
        }
      );

      const { result } = renderHook(() => useSettings());

      // Wait for initial load
      await act(async () => {});

      // Rapidly change two different settings without awaiting the first
      await act(async () => {
        result.current.updateSetting('notifications', false);
        result.current.updateSetting('hapticFeedback', false);
      });

      // Both changes should be preserved
      expect(result.current.settings.notifications).toBe(false);
      expect(result.current.settings.hapticFeedback).toBe(false);

      // The last persisted value should contain BOTH changes
      const lastSaved = JSON.parse(savedValues[savedValues.length - 1]);
      expect(lastSaved.notifications).toBe(false);
      expect(lastSaved.hapticFeedback).toBe(false);
    });
  });

  describe('S-2: backend sync', () => {
    it('should fetch settings from backend on load (backend takes priority)', async () => {
      // Backend has notifications=false (user changed on another device)
      // Backend does NOT return hapticFeedback — so local should fill in
      mockGet.mockResolvedValueOnce({
        data: { data: { notifications: false, matchReminders: true } },
      });
      // Local SecureStore has hapticFeedback=false
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(
        JSON.stringify({ hapticFeedback: false })
      );

      const { result } = renderHook(() => useSettings());

      await act(async () => {});

      // Backend value should take priority for notifications
      expect(result.current.settings.notifications).toBe(false);
      // Local value should fill in for fields backend didn't return
      expect(result.current.settings.hapticFeedback).toBe(false);
    });

    it('should fall back to SecureStore when backend is unavailable', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network error'));
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(
        JSON.stringify({ notifications: false })
      );

      const { result } = renderHook(() => useSettings());

      await act(async () => {});

      // Should still load from SecureStore
      expect(result.current.settings.notifications).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should sync setting to backend when updateSetting is called', async () => {
      const { result } = renderHook(() => useSettings());

      await act(async () => {});

      await act(async () => {
        await result.current.updateSetting('hapticFeedback', false);
      });

      // Should have called PUT to backend
      expect(mockPut).toHaveBeenCalledWith(
        '/api/player/settings',
        expect.objectContaining({ hapticFeedback: false })
      );
    });
  });

  describe('S-3 + S-4: notification preference bridge', () => {
    it('should sync notifications toggle to notification preferences API', async () => {
      const { result } = renderHook(() => useSettings());

      await act(async () => {});

      await act(async () => {
        await result.current.updateSetting('notifications', false);
      });

      // Should call notification preferences endpoint
      expect(mockPut).toHaveBeenCalledWith(
        '/api/notification-preferences',
        expect.objectContaining({ pushEnabled: false })
      );
    });

    it('should sync matchReminders toggle to notification preferences API', async () => {
      const { result } = renderHook(() => useSettings());

      await act(async () => {});

      await act(async () => {
        await result.current.updateSetting('matchReminders', false);
      });

      // Should call notification preferences endpoint
      expect(mockPut).toHaveBeenCalledWith(
        '/api/notification-preferences',
        expect.objectContaining({ matchReminders: false })
      );
    });

    it('should not call notification preferences for non-notification settings', async () => {
      const { result } = renderHook(() => useSettings());

      await act(async () => {});

      await act(async () => {
        await result.current.updateSetting('hapticFeedback', false);
      });

      // Should NOT have called notification preferences
      const notifCalls = mockPut.mock.calls.filter(
        (call: any[]) => call[0] === '/api/notification-preferences'
      );
      expect(notifCalls).toHaveLength(0);
    });
  });
});
