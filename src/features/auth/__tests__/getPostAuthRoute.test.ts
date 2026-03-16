/**
 * L-7: getPostAuthRoute should use onboardingStep to route to the correct
 * onboarding screen, not always to /onboarding/personal-info.
 */

// We'll test the exported getPostAuthRoute function
// For now, we import from the module (will need to export it)
import { getPostAuthRoute } from "@/lib/post-auth-route";

const makePayload = (overrides: { completedOnboarding?: boolean; onboardingStep?: string | null }) => ({
  user: {
    id: "user-1",
    email: "test@example.com",
    name: "Test",
    image: null,
    emailVerified: true,
    role: "USER",
    username: "test123",
    completedOnboarding: overrides.completedOnboarding ?? false,
    onboardingStep: overrides.onboardingStep ?? null,
  },
  session: { id: "s1", expiresAt: "2030-01-01T00:00:00.000Z" },
  sessionToken: "tok",
  isNewUser: false,
});

describe("getPostAuthRoute (L-7)", () => {
  test("should return /user-dashboard when onboarding is completed", () => {
    const payload = makePayload({ completedOnboarding: true });
    expect(getPostAuthRoute(payload)).toBe("/user-dashboard");
  });

  test("should return /onboarding/personal-info when step is null", () => {
    const payload = makePayload({ onboardingStep: null });
    expect(getPostAuthRoute(payload)).toBe("/onboarding/personal-info");
  });

  test("should return /onboarding/personal-info when step is PERSONAL_INFO", () => {
    const payload = makePayload({ onboardingStep: "PERSONAL_INFO" });
    expect(getPostAuthRoute(payload)).toBe("/onboarding/personal-info");
  });

  test("should return /onboarding/location when step is LOCATION", () => {
    const payload = makePayload({ onboardingStep: "LOCATION" });
    expect(getPostAuthRoute(payload)).toBe("/onboarding/location");
  });

  test("should return /onboarding/game-select when step is GAME_SELECT", () => {
    const payload = makePayload({ onboardingStep: "GAME_SELECT" });
    expect(getPostAuthRoute(payload)).toBe("/onboarding/game-select");
  });

  test("should return /onboarding/skill-assessment when step is SKILL_ASSESSMENT", () => {
    const payload = makePayload({ onboardingStep: "SKILL_ASSESSMENT" });
    expect(getPostAuthRoute(payload)).toBe("/onboarding/skill-assessment");
  });

  test("should return /onboarding/profile-picture when step is PROFILE_PICTURE", () => {
    const payload = makePayload({ onboardingStep: "PROFILE_PICTURE" });
    expect(getPostAuthRoute(payload)).toBe("/onboarding/profile-picture");
  });

  test("should fallback to /onboarding/personal-info for unknown steps", () => {
    const payload = makePayload({ onboardingStep: "UNKNOWN_STEP" });
    expect(getPostAuthRoute(payload)).toBe("/onboarding/personal-info");
  });
});
