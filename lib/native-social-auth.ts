import { authClient } from "@/lib/auth-client";
import { signInWithApple } from "@/lib/apple-signin";
import axiosInstance, { endpoints } from "@/lib/endpoints";
import { applySetCookieHeader } from "@/lib/expo-cookie";
import { signInWithGoogle } from "@/lib/google-signin";
import { getPostAuthRoute } from "@/lib/post-auth-route";
import { AuthStorage } from "@/src/core/storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { toast } from "sonner-native";

const COOKIE_STORAGE_KEY = "deuceleague_cookie";
const SESSION_CACHE_KEY = "deuceleague_session_data";
const SESSION_COOKIE_NAME = "better-auth.session_token";
const MOBILE_AUTH_HEADERS = { "X-Client-Type": "mobile" };

export type NativeOAuthProvider = "google" | "apple";

interface NativeOAuthCookieState {
  [cookieName: string]: {
    value: string;
    expires: string | null;
  };
}

export interface NativeOAuthUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
  emailVerified: boolean;
  role: string;
  username: string;
  completedOnboarding: boolean;
  onboardingStep: string | null;
}

export interface NativeOAuthSession {
  id: string;
  expiresAt: string;
}

export interface NativeOAuthPayload {
  user: NativeOAuthUser;
  session: NativeOAuthSession;
  sessionToken: string;
  sessionCookieHeader?: string | null;
  isNewUser: boolean;
}

export interface NativeOAuthSuccess {
  isNewUser: boolean;
  nextRoute: string;
  session: NativeOAuthSession;
  user: NativeOAuthUser;
}

export { getPostAuthRoute } from "./post-auth-route";

const parseCookieState = (rawValue: string | null): NativeOAuthCookieState => {
  if (!rawValue) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const normalizeExpiry = (expiresAt: string | null | undefined): string | null => {
  if (!expiresAt) {
    return null;
  }

  const parsed = new Date(expiresAt);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

export const hydrateNativeOAuthSession = (payload: NativeOAuthPayload) => {
  const sessionAtom = authClient.$store?.atoms?.session;
  if (!sessionAtom?.get || !sessionAtom?.set) {
    return;
  }

  const currentValue = sessionAtom.get();
  sessionAtom.set({
    ...currentValue,
    data: {
      user: payload.user,
      session: payload.session,
    },
    error: null,
    isPending: false,
    isRefetching: false,
    refetch: currentValue?.refetch ?? (async () => undefined),
  });
};

export const bootstrapNativeOAuthSession = async (
  payload: NativeOAuthPayload,
) => {
  // Capture existing state for rollback on failure
  const existingCookieRaw = await SecureStore.getItemAsync(COOKIE_STORAGE_KEY);
  const existingSessionRaw = await SecureStore.getItemAsync(SESSION_CACHE_KEY);
  const existingCookieState = parseCookieState(existingCookieRaw);
  let nextCookieState: string;

  if (payload.sessionCookieHeader) {
    nextCookieState = applySetCookieHeader(
      payload.sessionCookieHeader,
      existingCookieRaw ?? undefined,
    );
  } else {
    existingCookieState[SESSION_COOKIE_NAME] = {
      value: payload.sessionToken,
      expires: normalizeExpiry(payload.session.expiresAt),
    };
    nextCookieState = JSON.stringify(existingCookieState);
  }

  try {
    await SecureStore.setItemAsync(COOKIE_STORAGE_KEY, nextCookieState);
    await SecureStore.setItemAsync(
      SESSION_CACHE_KEY,
      JSON.stringify({ user: payload.user, session: payload.session }),
    );
    hydrateNativeOAuthSession(payload);
    await AuthStorage.markLoggedIn();
  } catch (error) {
    // Rollback: restore previous SecureStore state to avoid partial writes
    console.error("bootstrapNativeOAuthSession failed, rolling back:", error);
    try {
      if (existingCookieRaw !== null) {
        await SecureStore.setItemAsync(COOKIE_STORAGE_KEY, existingCookieRaw);
      } else {
        await SecureStore.deleteItemAsync(COOKIE_STORAGE_KEY);
      }
      if (existingSessionRaw !== null) {
        await SecureStore.setItemAsync(SESSION_CACHE_KEY, existingSessionRaw);
      } else {
        await SecureStore.deleteItemAsync(SESSION_CACHE_KEY);
      }
    } catch (rollbackError) {
      console.error("Rollback also failed:", rollbackError);
    }
    throw error;
  }
};

export const patchNativeOAuthSessionUser = async (
  updates: Partial<NativeOAuthUser>,
) => {
  if (Object.keys(updates).length === 0) {
    return;
  }

  const sessionAtom = authClient.$store?.atoms?.session;
  const currentAtomValue = sessionAtom?.get?.();
  const currentSessionData = currentAtomValue?.data;
  const currentUser = currentSessionData?.user;
  const currentSession = currentSessionData?.session;

  if (currentUser && currentSession && sessionAtom?.set) {
    sessionAtom.set({
      ...currentAtomValue,
      data: {
        user: {
          ...currentUser,
          ...updates,
        },
        session: currentSession,
      },
      error: null,
      isPending: false,
      isRefetching: false,
      refetch: currentAtomValue?.refetch ?? (async () => undefined),
    });
  }

  const cachedSessionRaw = await SecureStore.getItemAsync(SESSION_CACHE_KEY);
  let cachedSessionData: Record<string, any> | null = null;

  if (cachedSessionRaw) {
    try {
      const parsed = JSON.parse(cachedSessionRaw);
      if (parsed && typeof parsed === "object") {
        cachedSessionData = parsed;
      }
    } catch {
      cachedSessionData = null;
    }
  }

  const cachedUser =
    cachedSessionData?.user && typeof cachedSessionData.user === "object"
      ? cachedSessionData.user
      : currentUser;
  const cachedSession =
    cachedSessionData?.session && typeof cachedSessionData.session === "object"
      ? cachedSessionData.session
      : currentSession;

  if (!cachedUser || !cachedSession) {
    return;
  }

  await SecureStore.setItemAsync(
    SESSION_CACHE_KEY,
    JSON.stringify({
      ...(cachedSessionData ?? {}),
      user: {
        ...cachedUser,
        ...updates,
      },
      session: cachedSession,
    }),
  );
};

const getNativeAuthPayload = (response: any): NativeOAuthPayload | null => {
  const payload = response?.data?.data;
  if (!response?.data?.success || !payload?.sessionToken) {
    return null;
  }

  return payload as NativeOAuthPayload;
};

const getErrorMessage = (error: any, fallback: string): string => {
  return error?.response?.data?.message || error?.message || fallback;
};

const trackSuccessfulLogin = async () => {
  try {
    await axiosInstance.put(endpoints.user.trackLogin);
  } catch (error) {
    console.error("Failed to track login:", error);
  }
};

export const signInWithNativeOAuth = async (
  provider: NativeOAuthProvider,
): Promise<NativeOAuthSuccess | null> => {
  try {
    if (provider === "apple") {
      if (Platform.OS !== "ios") {
        toast.info("Apple Sign-In is only available on iOS");
        return null;
      }

      const appleResult = await signInWithApple();
      if (!appleResult.success || !appleResult.identityToken) {
        toast.error(appleResult.error || "Apple sign-in failed");
        return null;
      }

      const response = await axiosInstance.post(
        endpoints.auth.appleNative,
        {
          identityToken: appleResult.identityToken,
          fullName: appleResult.user?.fullName,
          email: appleResult.user?.email,
        },
        {
          headers: MOBILE_AUTH_HEADERS,
        },
      );

      const payload = getNativeAuthPayload(response);
      if (!payload) {
        toast.error(response?.data?.message || "Authentication failed");
        return null;
      }

      await bootstrapNativeOAuthSession(payload);
      await trackSuccessfulLogin();

      return {
        isNewUser: payload.isNewUser,
        nextRoute: getPostAuthRoute(payload),
        session: payload.session,
        user: payload.user,
      };
    }

    const googleResult = await signInWithGoogle();
    if (!googleResult.success || !googleResult.idToken) {
      toast.error(googleResult.error || "Google sign-in failed");
      return null;
    }

    const response = await axiosInstance.post(
      endpoints.auth.googleNative,
      {
        idToken: googleResult.idToken,
      },
      {
        headers: MOBILE_AUTH_HEADERS,
      },
    );

    const payload = getNativeAuthPayload(response);
    if (!payload) {
      toast.error(response?.data?.message || "Authentication failed");
      return null;
    }

    await bootstrapNativeOAuthSession(payload);
    await trackSuccessfulLogin();

    return {
      isNewUser: payload.isNewUser,
      nextRoute: getPostAuthRoute(payload),
      session: payload.session,
      user: payload.user,
    };
  } catch (error: any) {
    console.error("Native social auth error:", error);
    toast.error(
      getErrorMessage(error, "Social login failed. Please try again."),
    );
    return null;
  }
};
