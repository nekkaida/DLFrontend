/**
 * BUG 12: Storage not user-scoped
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingStorage, STORAGE_KEYS } from '../index';

// AsyncStorage is already mocked globally in jest.setup.js

describe('OnboardingStorage user-scoped keys', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('saveData', () => {
    it('should use user-scoped key when userId is provided', async () => {
      await OnboardingStorage.saveData({ fullName: 'Test' }, 'user-123');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@onboarding_data_user-123',
        expect.any(String)
      );
    });

    it('should use global key when userId is not provided', async () => {
      await OnboardingStorage.saveData({ fullName: 'Test' });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@onboarding_data',
        expect.any(String)
      );
    });
  });

  describe('loadData', () => {
    it('should use user-scoped key when userId is provided', async () => {
      await OnboardingStorage.loadData('user-123');

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@onboarding_data_user-123');
    });

    it('should not load another user data', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === '@onboarding_data_user-A') {
          return Promise.resolve(JSON.stringify({ fullName: 'User A' }));
        }
        return Promise.resolve(null);
      });

      const result = await OnboardingStorage.loadData('user-B');
      expect(result).toBeNull();
    });
  });

  describe('clearData', () => {
    it('should use user-scoped key when userId is provided', async () => {
      await OnboardingStorage.clearData('user-123');

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@onboarding_data_user-123');
    });
  });
});
