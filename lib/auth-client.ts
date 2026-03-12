import { expoClient } from "@better-auth/expo/client";
import {
  emailOTPClient,
  inferAdditionalFields,
  usernameClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import { getBackendBaseURL, logNetworkConfig } from "../src/config/network";

// Log network configuration in development
logNetworkConfig();

const baseURL = getBackendBaseURL();
if (__DEV__) console.log("🔑 Auth Client baseURL:", baseURL);

// Custom fetch that adds X-Client-Type header to all auth requests
const mobileAuthFetch: typeof fetch = (input, init) => {
  const headers = new Headers(init?.headers);
  headers.set("X-Client-Type", "mobile");
  if (__DEV__) console.log("🔐 [Auth Fetch] Adding X-Client-Type: mobile header");
  return fetch(input, { ...init, headers });
};

export const authClient = createAuthClient({
  baseURL,
  basePath: "/api/auth",
  // Use custom fetch to ensure X-Client-Type header is always sent
  fetch: mobileAuthFetch,
  plugins: [
    usernameClient(),
    emailOTPClient(),
    inferAdditionalFields({
      user: {
        phoneNumber: {
          type: "string",
        },
      },
    }),
    expoClient({
      scheme: "deuceleague",
      storagePrefix: "deuceleague",
      storage: SecureStore,
    }),
  ],
  sessionOptions: {
    // Disable automatic session refetch when the app comes to foreground.
    // better-auth's default (true) triggers a /get-session backend call on every
    // AppState change; if that call fails for any reason (network, 401, 500),
    // the session atom is set to null → user gets logged out.
    refetchOnWindowFocus: false,
  },
});

export const { signIn, signOut, useSession } = authClient;
