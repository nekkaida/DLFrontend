import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

export interface Settings {
  notifications: boolean;
  matchReminders: boolean;
  locationServices: boolean;
  hapticFeedback: boolean;
}

interface UseSettingsReturn {
  settings: Settings;
  isLoading: boolean;
  loadError: string | null;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>;
  retryLoad: () => Promise<void>;
}

const SETTINGS_KEY = 'deuceleague.settings';

const DEFAULT_SETTINGS: Settings = {
  notifications: true,
  matchReminders: true,
  locationServices: false,
  hapticFeedback: true,
};

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const stored = await SecureStore.getItemAsync(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<Settings>;
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to load settings:', error);
      }
      setLoadError('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSetting = useCallback(async <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to save setting:', error);
      }
      // Revert on error
      setSettings(settings);
      throw error;
    }
  }, [settings]);

  const retryLoad = useCallback(async () => {
    await loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    isLoading,
    loadError,
    updateSetting,
    retryLoad,
  };
}
