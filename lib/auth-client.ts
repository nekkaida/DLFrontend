import { expoClient } from "@better-auth/expo/client";
import {
  emailOTPClient,
  inferAdditionalFields,
  usernameClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import { getBackendBaseURL, logNetworkConfig } from "../src/config/network";

// Wrap early initialization in try-catch to prevent crash if native modules fail
let baseURL: string;
try {
  // Log network configuration in development
  logNetworkConfig();
  baseURL = getBackendBaseURL();
  if (__DEV__) console.log("🔑 Auth Client baseURL:", baseURL);
} catch (e) {
  console.warn("Failed to get backend URL, using fallback:", e);
  baseURL = "https://staging.appdevelopers.my"; // Fallback URL
}

// Custom fetch that adds X-Client-Type header and session cookie to all auth requests
const mobileAuthFetch: typeof fetch = async (input, init) => {
  const headers = new Headers(init?.headers);
  headers.set("X-Client-Type", "mobile");

  // Add session cookie from SecureStore for auth requests
  // This ensures getSession() can authenticate after OAuth sign-in
  try {
    const storedCookie = await SecureStore.getItemAsync("deuceleague_cookie");
    if (storedCookie) {
      headers.set("Cookie", storedCookie);
    }
  } catch (e) {
    console.warn("🔐 [Auth Fetch] Failed to read cookie from SecureStore:", e);
  }

  if (__DEV__) {
    console.log("🔐 [Auth Fetch] Adding X-Client-Type: mobile header");
  }
  return fetch(input, { ...init, headers });
};

// IMPORTANT: The expoClient plugin accesses SecureStore (Keychain) synchronously
// during initialization. If the Keychain throws a native exception, it can crash
// Hermes before JS error handling can catch it. We defer expoClient initialization
// to avoid this crash-on-startup issue.

// Create auth client WITHOUT expoClient first (safe initialization)
let authClient: ReturnType<typeof createAuthClient>;
let expoClientPlugin: any = null;

// Try to create the expoClient plugin separately so we can catch errors
try {
  expoClientPlugin = expoClient({
    scheme: "deuceleague",
    storagePrefix: "deuceleague",
    storage: SecureStore,
  });
} catch (e) {
  console.warn("Failed to initialize expoClient plugin:", e);
  expoClientPlugin = null;
}

// Build plugins array, only including expoClient if it initialized successfully
const plugins: any[] = [
  usernameClient(),
  emailOTPClient(),
  inferAdditionalFields({
    user: {
      phoneNumber: {
        type: "string",
      },
    },
  }),
];

if (expoClientPlugin) {
  plugins.push(expoClientPlugin);
}

try {
  authClient = createAuthClient({
    baseURL,
    basePath: "/api/auth",
    fetch: mobileAuthFetch,
    plugins,
    sessionOptions: {
      // Disable automatic session refetch when the app comes to foreground.
      refetchOnWindowFocus: false,
    },
  });
} catch (e) {
  console.error("Failed to create auth client:", e);
  authClient = {
    signIn: async () => { throw new Error("Auth client failed to initialize"); },
    signOut: async () => { throw new Error("Auth client failed to initialize"); },
    useSession: () => ({ data: null, isPending: false, error: new Error("Auth client failed to initialize") }),
    getCookie: () => null,
    $store: { atoms: { session: { get: () => null, set: () => {} } } },
  } as any;
}

export { authClient };
export const { signIn, signOut, useSession } = authClient;
