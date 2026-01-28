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
console.log("🔑 Auth Client baseURL:", baseURL);

export const authClient = createAuthClient({
  baseURL,
  basePath: "/api/auth",
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
});

export const { signIn, signOut, useSession } = authClient;
