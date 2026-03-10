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
const buildCookieState = (setCookieHeader: string) => {
  const [cookiePair] = setCookieHeader.split(";");
  const [name, ...valueParts] = cookiePair.split("=");
  const value = decodeURIComponent(valueParts.join("="));

  return JSON.stringify({
    [name]: {
      value,
      expires: "2030-01-01T00:00:00.000Z",
    },
  });
};
const mockGetSetCookie = jest.fn(buildCookieState);

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

jest.mock("@/lib/expo-cookie", () => ({
  __esModule: true,
  applySetCookieHeader: mockGetSetCookie,
}));

jest.mock("sonner-native", () => ({
  toast: {
    error: mockToastError,
    info: mockToastInfo,
  },
}));

const {
  bootstrapNativeOAuthSession,
  patchNativeOAuthSessionUser,
  signInWithNativeOAuth,
} = require("@/lib/native-social-auth");

describe("native social auth helper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSetCookie.mockImplementation(buildCookieState);
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
      sessionCookieHeader:
        "better-auth.session_token=session-token-123.signed-signature%3D%3D; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax",
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

    const cookieWriteCall = (SecureStore.setItemAsync as jest.Mock).mock.calls.find(
      (call) => call[0] === "deuceleague_cookie" && typeof call[1] === "string",
    );

    expect(cookieWriteCall).toBeDefined();
    expect(cookieWriteCall?.[0]).toBe("deuceleague_cookie");
    expect(JSON.parse(cookieWriteCall?.[1] as string)).toMatchObject({
      "better-auth.session_token": {
        value: "session-token-123.signed-signature==",
      },
    });
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
          sessionCookieHeader:
            "better-auth.session_token=session-token-456.signed-signature%3D%3D; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax",
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

  test("patchNativeOAuthSessionUser updates the hydrated session atom and persisted session cache", async () => {
    sessionAtomState = {
      data: {
        user: {
          id: "user-3",
          email: "existing-user@example.com",
          name: "Existing User",
          image: null,
          emailVerified: true,
          role: "USER",
          username: "SteadyFalcon001",
          completedOnboarding: false,
          onboardingStep: null,
        },
        session: {
          id: "session-3",
          expiresAt: "2030-03-01T00:00:00.000Z",
        },
      },
      error: null,
      isPending: false,
      isRefetching: false,
      refetch: jest.fn(),
    };
    mockSessionAtom.get.mockImplementation(() => sessionAtomState);
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
      JSON.stringify(sessionAtomState.data),
    );

    await patchNativeOAuthSessionUser({
      completedOnboarding: true,
      onboardingStep: "PROFILE_PICTURE",
    });

    expect(mockSessionAtom.set).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          user: expect.objectContaining({
            id: "user-3",
            completedOnboarding: true,
            onboardingStep: "PROFILE_PICTURE",
          }),
          session: sessionAtomState.data.session,
        },
      }),
    );

    const sessionWriteCall = (SecureStore.setItemAsync as jest.Mock).mock.calls.find(
      (call) => call[0] === "deuceleague_session_data",
    );

    expect(sessionWriteCall).toBeDefined();
    expect(JSON.parse(sessionWriteCall?.[1] as string)).toMatchObject({
      user: {
        id: "user-3",
        completedOnboarding: true,
        onboardingStep: "PROFILE_PICTURE",
      },
      session: sessionAtomState.data.session,
    });
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
