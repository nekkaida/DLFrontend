/**
 * BUG 16: Premature completion when currentVisibleIndex is -1
 */
import { shouldCompleteQuestionnaire } from '../completionCheck';

describe('shouldCompleteQuestionnaire', () => {
  it('should return false when currentVisibleIndex is -1 and no visible questions', () => {
    expect(shouldCompleteQuestionnaire(-1, 0)).toBe(false);
  });

  it('should return false when currentVisibleIndex is -1 even with visible questions', () => {
    expect(shouldCompleteQuestionnaire(-1, 5)).toBe(false);
  });

  it('should return true on last visible question', () => {
    expect(shouldCompleteQuestionnaire(4, 5)).toBe(true);
  });

  it('should return false when not on last question', () => {
    expect(shouldCompleteQuestionnaire(2, 5)).toBe(false);
  });

  it('should return true when only one question and on first index', () => {
    expect(shouldCompleteQuestionnaire(0, 1)).toBe(true);
  });

  it('should return false when visibleQuestionsLength is 0', () => {
    expect(shouldCompleteQuestionnaire(0, 0)).toBe(false);
  });
});
