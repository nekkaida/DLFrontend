/**
 * Helper utilities for questionnaire management
 */

/**
 * Extracts the first name from a full name string
 */
export function getFirstName(fullName: string | undefined): string {
  if (!fullName) return 'there';
  return fullName.split(' ')[0];
}

/**
 * Gets the display name for a sport
 */
export function getSportDisplayName(sport: string): string {
  return sport.charAt(0).toUpperCase() + sport.slice(1);
}

/**
 * Checks if a sport uses comprehensive questionnaire
 */
export function isComprehensiveSport(sport: string): boolean {
  return sport === 'pickleball' || sport === 'tennis' || sport === 'padel';
}
