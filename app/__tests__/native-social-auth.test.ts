import * as fs from "fs";
import * as path from "path";
import * as SecureStore from "expo-secure-store";

const mockPost = jest.fn();
const mockPut = jest.fn();
const mockSignInWithGoogle = jest.fn();
const mockSignInWithApple = jest.fn();
const mockMarkLoggedIn = jest.fn();
const mockToastError = jest.fn();
const mockToastInfo = jest.fn();

let sessionAtomState: any;
const mockSessionAtom = {
  get: jest.fn(() => sessionAtomState),
  set: jest.fn((nextValue) => {
    sessionAtomState = nextValue;
  }),
};

jest.mock("@/lib/auth-client", () => ({
  authClient: {
    $store: {
      atoms: {
        session: mockSessionAtom,
      },
    },
  },
}));

jest.mock("@/lib/endpoints", () => ({
  __esModule: true,
  default: {
    post: mockPost,
    put: mockPut,
  },
  endpoints: {
    auth: {
      googleNative: "/api/auth-custom/google/native",
      appleNative: "/api/auth-custom/apple/native",
    },
    user: {
      trackLogin: "/api/player/track-login",
    },
  },
}));

jest.mock("@/lib/google-signin", () => ({
  signInWithGoogle: mockSignInWithGoogle,
}));

jest.mock("@/lib/apple-signin", () => ({
  signInWithApple: mockSignInWithApple,
}));

jest.mock("@/src/core/storage", () => ({
  AuthStorage: {
    markLoggedIn: mockMarkLoggedIn,
  },
}));

jest.mock("sonner-native", () => ({
  toast: {
    error: mockToastError,
    info: mockToastInfo,
  },
}));

const {
  bootstrapNativeOAuthSession,
  signInWithNativeOAuth,
} = require("@/lib/native-social-auth");

describe("native social auth helper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionAtomState = {
      data: null,
      error: null,
      isPending: true,
      isRefetching: false,
      refetch: jest.fn(),
    };
    mockSessionAtom.get.mockImplementation(() => sessionAtomState);
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
  });

  test("bootstrapNativeOAuthSession writes Better Auth Expo storage and hydrates the session atom", async () => {
    const payload = {
      sessionToken: "session-token-123",
      isNewUser: true,
      user: {
        id: "user-1",
        email: "user@example.com",
        name: "User Example",
        image: null,
        emailVerified: true,
        role: "USER",
        username: "SwiftOtter123",
        completedOnboarding: false,
        onboardingStep: null,
      },
      session: {
        id: "session-1",
        expiresAt: "2030-01-01T00:00:00.000Z",
      },
    };

    await bootstrapNativeOAuthSession(payload);

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "deuceleague_cookie",
      JSON.stringify({
        "better-auth.session_token": {
          value: "session-token-123",
          expires: "2030-01-01T00:00:00.000Z",
        },
      }),
    );
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "deuceleague_session_data",
      JSON.stringify({
        user: payload.user,
        session: payload.session,
      }),
    );
    expect(mockSessionAtom.set).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          user: payload.user,
          session: payload.session,
        },
        error: null,
        isPending: false,
        isRefetching: false,
      }),
    );
    expect(mockMarkLoggedIn).toHaveBeenCalled();
  });

  test("signInWithNativeOAuth sends the native Google token with the mobile client header", async () => {
    mockSignInWithGoogle.mockResolvedValue({
      success: true,
      idToken: "google-id-token",
    });
    mockPost.mockResolvedValue({
      data: {
        success: true,
        data: {
          sessionToken: "session-token-456",
          isNewUser: true,
          user: {
            id: "user-2",
            email: "new-google-user@example.com",
            name: "New Google User",
            image: null,
            emailVerified: true,
            role: "USER",
            username: "LuckyPanda456",
            completedOnboarding: false,
            onboardingStep: null,
          },
          session: {
            id: "session-2",
            expiresAt: "2030-02-01T00:00:00.000Z",
          },
        },
      },
    });
    mockPut.mockResolvedValue({ data: { success: true } });

    const result = await signInWithNativeOAuth("google");

    expect(mockPost).toHaveBeenCalledWith(
      "/api/auth-custom/google/native",
      {
        idToken: "google-id-token",
      },
      {
        headers: { "X-Client-Type": "mobile" },
      },
    );
    expect(mockPut).toHaveBeenCalledWith("/api/player/track-login");
    expect(result).toMatchObject({
      isNewUser: true,
      nextRoute: "/onboarding/personal-info",
      user: {
        id: "user-2",
        username: "LuckyPanda456",
      },
    });
    expect(mockToastError).not.toHaveBeenCalled();
  });

  test("landing, login, and register routes use the shared native social auth helper", () => {
    const routeFiles = [
      path.resolve(__dirname, "../index.tsx"),
      path.resolve(__dirname, "../login.tsx"),
      path.resolve(__dirname, "../register.tsx"),
    ];

    for (const routeFile of routeFiles) {
      const source = fs.readFileSync(routeFile, "utf-8");
      expect(source).toMatch(/signInWithNativeOAuth/);
    }
  });
});
