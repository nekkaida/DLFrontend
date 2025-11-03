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

export const authClient = createAuthClient({
  baseURL: getBackendBaseURL(),
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
