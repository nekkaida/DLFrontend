import Constants from 'expo-constants';

// iOS Client ID from Google Cloud Console
const IOS_CLIENT_ID = '1049126820486-s6dpimmdmcgkcar6ju3c1turdlr05hpt.apps.googleusercontent.com';

// Web Client ID - required for Android to get ID token
const WEB_CLIENT_ID = '1049126820486-5amoljjhl97lodkul5jhp669k40jl6av.apps.googleusercontent.com';

// Check if running in Expo Go (native modules not available)
// executionEnvironment is the non-deprecated way to check
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Lazy import to avoid crash in Expo Go
let GoogleSignin: any;
let isErrorWithCode: any;
let isSuccessResponse: any;
let statusCodes: any;

if (!isExpoGo) {
  const googleSignIn = require('@react-native-google-signin/google-signin');
  GoogleSignin = googleSignIn.GoogleSignin;
  isErrorWithCode = googleSignIn.isErrorWithCode;
  isSuccessResponse = googleSignIn.isSuccessResponse;
  statusCodes = googleSignIn.statusCodes;
}

// Configure Google Sign-In (call once at app startup)
export const configureGoogleSignIn = () => {
  if (isExpoGo) {
    console.log('⚠️ Google Sign-In not available in Expo Go');
    return;
  }
  GoogleSignin.configure({
    iosClientId: IOS_CLIENT_ID,
    webClientId: WEB_CLIENT_ID, // Required for Android ID token
  });
};

export interface GoogleSignInResult {
  success: boolean;
  idToken?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    photo: string | null;
  };
  error?: string;
}

// Sign in with Google and return the ID token
export const signInWithGoogle = async (): Promise<GoogleSignInResult> => {
  // Return error if running in Expo Go
  if (isExpoGo) {
    return {
      success: false,
      error: 'Google Sign-In requires a development build. Not available in Expo Go.',
    };
  }

  try {
    // Check if Google Play Services are available (Android only, always true on iOS)
    await GoogleSignin.hasPlayServices();

    // Perform sign-in
    const response = await GoogleSignin.signIn();

    if (isSuccessResponse(response)) {
      const { idToken, user } = response.data;

      if (!idToken) {
        return {
          success: false,
          error: 'No ID token received from Google',
        };
      }

      return {
        success: true,
        idToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || '',
          photo: user.photo,
        },
      };
    } else {
      return {
        success: false,
        error: 'Sign in was cancelled',
      };
    }
  } catch (error: unknown) {
    if (isErrorWithCode(error)) {
      const typedError = error as { code: string; message?: string };
      switch (typedError.code) {
        case statusCodes.IN_PROGRESS:
          return {
            success: false,
            error: 'Sign in already in progress',
          };
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          return {
            success: false,
            error: 'Google Play Services not available',
          };
        default:
          return {
            success: false,
            error: typedError.message || 'Unknown error occurred',
          };
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// Sign out from Google
export const signOutFromGoogle = async (): Promise<void> => {
  if (isExpoGo) return;
  try {
    await GoogleSignin.signOut();
  } catch {
    // Ignore sign out errors
  }
};

// Check if user is already signed in
export const isGoogleSignedIn = async (): Promise<boolean> => {
  if (isExpoGo) return false;
  try {
    const currentUser = await GoogleSignin.getCurrentUser();
    return currentUser !== null;
  } catch {
    return false;
  }
};
