import { PickleballQuestionnaire } from '../PickleballQuestionnaire';

describe('PickleballQuestionnaire', () => {
  let questionnaire: PickleballQuestionnaire;

  beforeEach(() => {
    questionnaire = new PickleballQuestionnaire();
  });

  describe('BUG 14: validateReliabilityInput NaN passthrough', () => {
    // validateReliabilityInput is private, so we test through calculateInitialRating
    // NaN flows into result.singles_reliability / doubles_reliability fields

    it('should not have NaN in singles_reliability when given non-numeric string', () => {
      const responses = {
        has_dupr: 'Yes',
        dupr_singles: '4.5',
        dupr_singles_reliability: 'abc',
      };

      const result = questionnaire.calculateInitialRating(responses);

      // singles_reliability must be null (treated as missing), not NaN
      expect(result.singles_reliability).toBeNull();
    });

    it('should not have NaN in doubles_reliability when given non-numeric string', () => {
      const responses = {
        has_dupr: 'Yes',
        dupr_singles: '3.75',
        dupr_doubles: '4.0',
        dupr_singles_reliability: 'not a number',
        dupr_doubles_reliability: 'N/A',
      };

      const result = questionnaire.calculateInitialRating(responses);

      expect(result.singles_reliability).toBeNull();
      expect(result.doubles_reliability).toBeNull();
    });
  });

  describe('BUG 3: truthiness checks in DUPR conversion', () => {
    it('should produce higher RD for reliability=0 than for reliability=50', () => {
      // reliability=0 means "no reliable data" and should produce HIGHER RD
      // than reliability=50 (somewhat reliable). If the truthiness check skips 0,
      // both would produce the same RD (using defaults), which is wrong.
      const responsesWithZero = {
        has_dupr: 'Yes',
        dupr_singles: '4.5',
        dupr_singles_reliability: '0',
      };

      const responsesWith50 = {
        has_dupr: 'Yes',
        dupr_singles: '4.5',
        dupr_singles_reliability: '50',
      };

      const resultZero = questionnaire.calculateInitialRating(responsesWithZero);
      const result50 = questionnaire.calculateInitialRating(responsesWith50);

      expect(resultZero.source).toBe('dupr_conversion');
      expect(result50.source).toBe('dupr_conversion');

      // Reliability 0 should give HIGHER RD (less confident) than reliability 50
      expect(resultZero.rating_deviation).toBeGreaterThan(result50.rating_deviation);
    });

    it('should record reliability=0 in result, not null or default', () => {
      const responses = {
        has_dupr: 'Yes',
        dupr_singles: '4.5',
        dupr_doubles: '4.0',
        dupr_singles_reliability: '0',
        dupr_doubles_reliability: '0',
      };

      const result = questionnaire.calculateInitialRating(responses);

      expect(result.source).toBe('dupr_conversion');
      expect(result.singles_reliability).toBe(0);
      expect(result.doubles_reliability).toBe(0);
    });
  });

  describe('Truthiness checks in skillAwareEstimation and detectDuprReliabilityPattern', () => {
    it('should produce different estimated singles when doubles reliability is 0 vs null', () => {
      // skillAwareEstimation uses `if (reliabilityScore && reliabilityScore < 30)`
      // which treats 0 as falsy, skipping the offset reduction.
      // reliability=0 should reduce offset (0.7×), null should use default offset.
      const responsesWithZero = {
        has_dupr: 'Yes',
        dupr_doubles: '4.5',
        dupr_doubles_reliability: '0',
      };

      const responsesWithNull = {
        has_dupr: 'Yes',
        dupr_doubles: '4.5',
        // no reliability → null → default offset
      };

      const resultZero = questionnaire.calculateInitialRating(responsesWithZero);
      const resultNull = questionnaire.calculateInitialRating(responsesWithNull);

      expect(resultZero.source).toBe('dupr_conversion');
      expect(resultNull.source).toBe('dupr_conversion');

      // With reliability=0 (unreliable), the estimated singles should differ
      // from null (where default assumptions are used)
      expect(resultZero.singles_rating).not.toBe(resultNull.singles_rating);
    });
  });

  describe('BUG 1: shouldSkipQuestionnaire behavior', () => {
    it('should return true when only singles DUPR is provided', () => {
      // Documents current behavior — shouldSkipQuestionnaire returns true
      // with just 1 of 4 DUPR values. Fix is in SkillAssessmentScreen,
      // not this method.
      const responses = {
        has_dupr: 'Yes',
        dupr_singles: 4.5,
      };

      expect(questionnaire.shouldSkipQuestionnaire(responses)).toBe(true);
    });

    it('should return false when DUPR values are out of range', () => {
      const responses = {
        has_dupr: 'Yes',
        dupr_singles: 1.0,
      };

      expect(questionnaire.shouldSkipQuestionnaire(responses)).toBe(false);
    });

    it('should return false when user does not have DUPR', () => {
      expect(questionnaire.shouldSkipQuestionnaire({ has_dupr: 'No' })).toBe(false);
    });
  });
});
