import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import axiosInstance, { endpoints } from '@/lib/endpoints';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushTokenRegistration {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId?: string;
}

class PushNotificationService {
  private expoPushToken: string | null = null;

  /**
   * Register for push notifications and get Expo push token
   */
  async registerForPushNotifications(): Promise<string | null> {
    // Check if running on physical device
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    // Check and request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    // Get Expo push token
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.expoPushToken = tokenData.data;
      console.log('Expo Push Token:', this.expoPushToken);

      // Configure Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1a73e8',
        });
      }

      return this.expoPushToken;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  /**
   * Register push token with the backend
   */
  async registerTokenWithBackend(token: string): Promise<boolean> {
    try {
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      const deviceId = Device.deviceName || undefined;

      await axiosInstance.post(endpoints.notifications.registerPushToken, {
        token,
        platform,
        deviceId,
      });

      console.log('Push token registered with backend');
      return true;
    } catch (error) {
      console.error('Error registering push token with backend:', error);
      return false;
    }
  }

  /**
   * Unregister push token from the backend
   */
  async unregisterTokenFromBackend(token: string): Promise<boolean> {
    try {
      await axiosInstance.delete(endpoints.notifications.unregisterPushToken, {
        data: { token },
      });

      console.log('Push token unregistered from backend');
      return true;
    } catch (error) {
      console.error('Error unregistering push token from backend:', error);
      return false;
    }
  }

  /**
   * Full initialization: register for push notifications and send token to backend
   */
  async initialize(): Promise<string | null> {
    const token = await this.registerForPushNotifications();

    if (token) {
      await this.registerTokenWithBackend(token);
    }

    return token;
  }

  /**
   * Get the current push token
   */
  getToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Add notification received listener (when app is in foreground)
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Add notification response listener (when user taps notification)
   */
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Get last notification response (useful for handling app launch from notification)
   */
  async getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
    return await Notifications.getLastNotificationResponseAsync();
  }

  /**
   * Set badge count (iOS only)
   */
  async setBadgeCount(count: number): Promise<boolean> {
    try {
      await Notifications.setBadgeCountAsync(count);
      return true;
    } catch (error) {
      console.error('Error setting badge count:', error);
      return false;
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
  }
}

export const pushNotificationService = new PushNotificationService();
