import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Check if running in Expo Go (native modules not available)
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Lazy import to avoid crash in Expo Go
let AppleAuthentication: any;

if (!isExpoGo && Platform.OS === 'ios') {
  AppleAuthentication = require('expo-apple-authentication');
}

export interface AppleSignInResult {
  success: boolean;
  identityToken?: string;
  authorizationCode?: string;
  user?: {
    id: string;
    email: string | null;
    fullName: {
      givenName: string | null;
      familyName: string | null;
    } | null;
  };
  error?: string;
}

// Check if Apple Sign-In is available on this device
export const isAppleSignInAvailable = async (): Promise<boolean> => {
  if (isExpoGo || Platform.OS !== 'ios') {
    return false;
  }
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
};

// Sign in with Apple and return the identity token
export const signInWithApple = async (): Promise<AppleSignInResult> => {
  // Not available on Android
  if (Platform.OS !== 'ios') {
    return {
      success: false,
      error: 'Apple Sign-In is only available on iOS',
    };
  }

  // Return error if running in Expo Go
  if (isExpoGo) {
    return {
      success: false,
      error: 'Apple Sign-In requires a development build. Not available in Expo Go.',
    };
  }

  try {
    // Check if available
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      return {
        success: false,
        error: 'Apple Sign-In is not available on this device',
      };
    }

    // Request sign-in
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      return {
        success: false,
        error: 'No identity token received from Apple',
      };
    }

    return {
      success: true,
      identityToken: credential.identityToken,
      authorizationCode: credential.authorizationCode || undefined,
      user: {
        id: credential.user,
        email: credential.email,
        fullName: credential.fullName,
      },
    };
  } catch (error: unknown) {
    const typedError = error as { code?: string; message?: string };

    // User cancelled
    if (typedError.code === 'ERR_REQUEST_CANCELED') {
      return {
        success: false,
        error: 'Sign in was cancelled',
      };
    }

    return {
      success: false,
      error: typedError.message || 'Unknown error occurred',
    };
  }
};
