/**
 * Questionnaire Status Check Utilities
 * Helper functions to check if user has selected and completed questionnaire for a sport
 */

export interface QuestionnaireStatus {
  hasSelectedSport: boolean;
  hasCompletedQuestionnaire: boolean;
}

/**
 * Check if user has selected and completed questionnaire for a specific sport
 * @param profileData - User's profile data (from API response)
 * @param sport - Sport to check (pickleball, tennis, padel)
 * @returns QuestionnaireStatus object
 */
export function checkQuestionnaireStatus(
  profileData: any,
  sport: 'pickleball' | 'tennis' | 'padel'
): QuestionnaireStatus {
  if (!profileData) {
    return {
      hasSelectedSport: false,
      hasCompletedQuestionnaire: false,
    };
  }

  // Check if user has selected the sport
  // Sports are stored in profileData.sports as an array
  const userSports = profileData.sports || [];
  const normalizedSports = userSports.map((s: string) => s.toLowerCase());
  const hasSelectedSport = normalizedSports.includes(sport.toLowerCase());

  // Check if user has completed questionnaire for this sport
  // Questionnaire status is stored in profileData.questionnaireStatus
  // Format: { [sport]: { isCompleted: boolean, startedAt: Date, completedAt: Date } }
  let hasCompletedQuestionnaire = false;

  if (profileData.questionnaireStatus) {
    const sportKey = sport.toLowerCase();
    const status = profileData.questionnaireStatus[sportKey];
    if (status && status.isCompleted) {
      hasCompletedQuestionnaire = true;
    }
  }

  // Fallback: Check if skillRatings exist for the sport (indicates completed questionnaire)
  if (!hasCompletedQuestionnaire && profileData.skillRatings) {
    const sportKey = sport.toLowerCase();
    const hasSkillRating = profileData.skillRatings[sportKey] != null;
    hasCompletedQuestionnaire = hasSkillRating;
  }

  return {
    hasSelectedSport,
    hasCompletedQuestionnaire,
  };
}

/**
 * Get the season's sport type from a season object
 * @param season - Season object
 * @returns Sport type (pickleball, tennis, padel) or null
 */
export function getSeasonSport(
  season: any
): 'pickleball' | 'tennis' | 'padel' | null {
  if (!season) return null;

  // Try to get sport from league
  if (season.leagues && season.leagues.length > 0) {
    const sportType = season.leagues[0].sportType?.toLowerCase();
    if (sportType === 'pickleball' || sportType === 'tennis' || sportType === 'padel') {
      return sportType;
    }
  }

  // Fallback: infer from categories or default to pickleball
  return 'pickleball';
}

