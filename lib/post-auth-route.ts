/**
 * Determine post-authentication route based on user onboarding state.
 * Extracted to a dependency-free file for testability.
 */

export interface PostAuthUser {
  completedOnboarding: boolean;
  onboardingStep: string | null;
}

export interface PostAuthPayload {
  user: PostAuthUser;
}

export type PostAuthRoute = "/user-dashboard" | "/onboarding/personal-info" | `/onboarding/${string}`;

const STEP_TO_ROUTE: Record<string, PostAuthRoute> = {
  PERSONAL_INFO: "/onboarding/personal-info",
  LOCATION: "/onboarding/location",
  GAME_SELECT: "/onboarding/game-select",
  SKILL_ASSESSMENT: "/onboarding/skill-assessment",
  ASSESSMENT_RESULTS: "/onboarding/assessment-results",
  PROFILE_PICTURE: "/onboarding/profile-picture",
};

export const getPostAuthRoute = (
  payload: PostAuthPayload,
): PostAuthRoute => {
  if (payload.user.completedOnboarding) {
    return "/user-dashboard";
  }

  const step = payload.user.onboardingStep;
  if (step && STEP_TO_ROUTE[step]) {
    return STEP_TO_ROUTE[step];
  }

  return "/onboarding/personal-info";
};
