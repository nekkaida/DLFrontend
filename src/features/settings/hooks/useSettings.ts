import { useState, useEffect, useCallback, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import axiosInstance from '@/lib/endpoints';

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
  const settingsRef = useRef<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      // Load from SecureStore first (fast, always available)
      const stored = await SecureStore.getItemAsync(SETTINGS_KEY);
      let localSettings: Partial<Settings> = {};
      if (stored) {
        localSettings = JSON.parse(stored) as Partial<Settings>;
      }

      // Try to fetch from backend (may fail if offline)
      let backendSettings: Partial<Settings> = {};
      try {
        const response = await axiosInstance.get('/api/player/settings');
        const data = response.data?.data || response.data;
        if (data) {
          backendSettings = data;
        }
      } catch {
        // Backend unavailable — use local only
      }

      // Merge: backend takes priority, then local, then defaults
      const merged = { ...DEFAULT_SETTINGS, ...localSettings, ...backendSettings };
      settingsRef.current = merged;
      setSettings(merged);

      // Persist merged result to SecureStore
      await SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify(merged));
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
    const previousSettings = settingsRef.current;
    const newSettings = { ...previousSettings, [key]: value };
    settingsRef.current = newSettings;
    setSettings(newSettings);
    try {
      await SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify(newSettings));

      // Sync to backend (fire-and-forget — don't block on failure)
      axiosInstance.put('/api/player/settings', newSettings).catch(() => {});

      // S-3 + S-4: Sync notification-related settings to notification preferences API
      if (key === 'notifications') {
        axiosInstance.put('/api/notification-preferences', { pushEnabled: value }).catch(() => {});
      } else if (key === 'matchReminders') {
        axiosInstance.put('/api/notification-preferences', { matchReminders: value }).catch(() => {});
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to save setting:', error);
      }
      // Revert on error
      settingsRef.current = previousSettings;
      setSettings(previousSettings);
      throw error;
    }
  }, []);

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
