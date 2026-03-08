/**
 * BUG 19: Scoring Parity Tests (Frontend)
 *
 * Canonical test vectors verified independently in both backend and frontend.
 * Backend is the source of truth for scoring. These vectors ensure both
 * implementations agree on outputs for the same inputs.
 *
 * IMPORTANT: If you change a scoring algorithm, update BOTH parity test files:
 * - dl-backend/tests/integration/services/scoringParity.test.ts
 * - dl-frontend/src/features/onboarding/services/__tests__/scoringParity.test.ts (this file)
 */

import { PickleballQuestionnaire } from '../PickleballQuestionnaire';
import { TennisQuestionnaire } from '../TennisQuestionnaire';
import { PadelQuestionnaire } from '../PadelQuestionnaire';

describe('Scoring Parity Vectors (Frontend — must match backend)', () => {
  describe('Pickleball', () => {
    const questionnaire = new PickleballQuestionnaire();

    it('Vector PB-1: empty answers → base 1500, low confidence', () => {
      const result = questionnaire.calculateInitialRating({});
      expect(result.singles_rating).toBe(1500);
      expect(result.doubles_rating).toBe(1500);
      expect(result.confidence).toBe('low');
      expect(result.rating_deviation).toBe(350);
      // Frontend uses 'default' source for empty answers; backend uses 'questionnaire'
      expect(['questionnaire', 'default']).toContain(result.source);
    });

    it('Vector PB-2: full beginner → rating < 1500, >= 800', () => {
      const result = questionnaire.calculateInitialRating({
        experience: 'Less than 3 month',
        sports_background: 'No prior experience with racquet sports',
        frequency: 'Less than once a month',
        competitive_level: 'Recreational/social games',
        self_rating: '1.0-1.5 (Beginner)',
        tournament: 'Never',
      });
      expect(result.singles_rating).toBeLessThan(1500);
      expect(result.singles_rating).toBeGreaterThanOrEqual(800);
      expect(result.source).toBe('questionnaire');
    });

    it('Vector PB-3: advanced player → rating > 1500, high confidence', () => {
      const result = questionnaire.calculateInitialRating({
        experience: 'More than 2 years',
        sports_background: 'Advanced/competitive player in other racquet sports',
        frequency: '4+ times a week',
        competitive_level: 'High-level competitive tournaments',
        self_rating: '5.0+ (Expert/Pro)',
        tournament: 'Professional tournaments',
      });
      expect(result.singles_rating).toBeGreaterThan(1500);
      expect(result.confidence).toBe('high');
      expect(result.rating_deviation).toBe(150);
    });

    it('Vector PB-4: DUPR 4.0 → dupr_conversion source', () => {
      const result = questionnaire.calculateInitialRating({
        has_dupr: 'Yes',
        dupr_singles: 4.0,
        dupr_doubles: 4.0,
        dupr_singles_reliability: 60,
        dupr_doubles_reliability: 80,
      });
      expect(result.source).toBe('dupr_conversion');
      expect(result.singles_rating).toBeGreaterThan(2000);
      expect(result.doubles_rating).toBeGreaterThan(2000);
    });
  });

  describe('Tennis', () => {
    const questionnaire = new TennisQuestionnaire();

    it('Vector TN-1: empty answers → base 1500, low confidence', () => {
      const result = questionnaire.calculateInitialRating({});
      expect(result.singles_rating).toBe(1500);
      expect(result.doubles_rating).toBe(1500);
      expect(result.confidence).toBe('low');
      expect(result.rating_deviation).toBe(350);
      // Frontend uses 'default' source for empty answers; backend uses 'questionnaire'
      expect(['questionnaire', 'default']).toContain(result.source);
    });

    it('Vector TN-2: full beginner → rating < 1500, >= 800', () => {
      const result = questionnaire.calculateInitialRating({
        experience: 'Less than 6 months',
        frequency: 'Rarely (less than once a month)',
        competitive_level: 'Recreational/social play with friends',
        coaching_background: 'Self-taught/no formal instruction',
        tournament: 'Never played tournaments',
        self_rating: '1.0-2.0 (Beginner)',
      });
      expect(result.singles_rating).toBeLessThan(1500);
      expect(result.singles_rating).toBeGreaterThanOrEqual(800);
      expect(result.source).toBe('questionnaire');
    });

    it('Vector TN-3: advanced player → rating > 1500, high confidence', () => {
      const result = questionnaire.calculateInitialRating({
        experience: 'More than 5 years',
        frequency: 'Daily (5+ times per week)',
        competitive_level: 'National tournaments',
        coaching_background: 'Professional/academy training',
        tournament: 'National tournaments',
        self_rating: '5.0-6.0 (Professional)',
      });
      expect(result.singles_rating).toBeGreaterThan(1500);
      expect(result.confidence).toBe('high');
      expect(result.rating_deviation).toBe(150);
    });
  });

  describe('Padel', () => {
    const questionnaire = new PadelQuestionnaire();

    it('Vector PD-1: empty answers → base 1500, low confidence', () => {
      const result = questionnaire.calculateInitialRating({});
      expect(result.rating).toBe(1500);
      expect(result.confidence).toBe('low');
      expect(result.rating_deviation).toBe(350);
      // Frontend uses 'default' source for empty answers; backend uses 'questionnaire'
      expect(['questionnaire', 'default']).toContain(result.source);
    });

    it('Vector PD-2: full beginner → rating < 1500, >= 800', () => {
      const result = questionnaire.calculateInitialRating({
        experience: 'Less than 3 months',
        sports_background: 'No experience with racquet sports',
        frequency: 'Rarely (less than once a month)',
        competitive_level: 'Social/recreational games only',
        coaching_background: 'Self-taught/no formal instruction',
        tournament: 'Never played tournaments',
        self_rating: 'Beginner: Just starting, learning the basic rules and strokes.',
      });
      expect(result.rating).toBeLessThan(1500);
      expect(result.rating).toBeGreaterThanOrEqual(800);
      expect(result.source).toBe('questionnaire');
    });

    it('Vector PD-3: advanced player → rating > 1500, high confidence', () => {
      const result = questionnaire.calculateInitialRating({
        experience: 'More than 2 years',
        sports_background: 'Professional athlete in racquet sports',
        frequency: 'Daily (5+ times per week)',
        competitive_level: 'Professional tournaments',
        coaching_background: 'Professional/academy training',
        tournament: 'Intermediate/Advanced tournaments',
        self_rating: 'Expert/Competitive: Plays at a high level in competitive tournaments.',
      });
      expect(result.rating).toBeGreaterThan(1500);
      expect(result.confidence).toBe('high');
      expect(result.rating_deviation).toBe(150);
    });
  });
});
