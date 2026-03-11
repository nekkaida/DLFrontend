/**
 * BUG 15: showIfEvaluator unknown operators default to true
 */
import { evaluateShowIf, filterVisibleQuestions } from '../showIfEvaluator';

describe('evaluateShowIf', () => {
  it('should return true when showIf is undefined (no condition)', () => {
    expect(evaluateShowIf(undefined, {})).toBe(true);
  });

  it('should evaluate == operator correctly', () => {
    const condition = { key: 'has_dupr', operator: '==' as const, value: 'Yes' };
    expect(evaluateShowIf(condition, { has_dupr: 'Yes' })).toBe(true);
    expect(evaluateShowIf(condition, { has_dupr: 'No' })).toBe(false);
  });

  it('should evaluate != operator correctly', () => {
    const condition = { key: 'has_dupr', operator: '!=' as const, value: 'Yes' };
    expect(evaluateShowIf(condition, { has_dupr: 'No' })).toBe(true);
    expect(evaluateShowIf(condition, { has_dupr: 'Yes' })).toBe(false);
  });

  it('should evaluate exists operator correctly', () => {
    const condition = { key: 'rating', operator: 'exists' as const };
    expect(evaluateShowIf(condition, { rating: '4.5' })).toBe(true);
    expect(evaluateShowIf(condition, { rating: undefined })).toBe(false);
    expect(evaluateShowIf(condition, { rating: '' })).toBe(false);
    expect(evaluateShowIf(condition, { rating: null })).toBe(false);
    expect(evaluateShowIf(condition, {})).toBe(false);
  });

  it('should evaluate not_exists operator correctly', () => {
    const condition = { key: 'rating', operator: 'not_exists' as const };
    expect(evaluateShowIf(condition, {})).toBe(true);
    expect(evaluateShowIf(condition, { rating: '' })).toBe(true);
    expect(evaluateShowIf(condition, { rating: null })).toBe(true);
    expect(evaluateShowIf(condition, { rating: '4.5' })).toBe(false);
  });

  // BUG-SPECIFIC TEST: unknown operators should default to false (safe)
  it('should return false for unknown operators (safe default)', () => {
    const condition = { key: 'x', operator: '===' as any, value: 'y' };
    expect(evaluateShowIf(condition, { x: 'y' })).toBe(false);
  });

  it('should return false for completely invalid operator', () => {
    const condition = { key: 'x', operator: 'garbage' as any, value: 'y' };
    expect(evaluateShowIf(condition, { x: 'y' })).toBe(false);
  });

  it('should apply AND logic for array of conditions', () => {
    const conditions = [
      { key: 'a', operator: '==' as const, value: '1' },
      { key: 'b', operator: '==' as const, value: '2' },
    ];
    expect(evaluateShowIf(conditions, { a: '1', b: '2' })).toBe(true);
    expect(evaluateShowIf(conditions, { a: '1', b: '3' })).toBe(false);
  });
});

describe('filterVisibleQuestions', () => {
  it('should filter out questions with unknown operators', () => {
    const questions = [
      { key: 'q1', question: 'Q1', type: 'single_choice' as const },
      { key: 'q2', question: 'Q2', type: 'single_choice' as const, showIf: { key: 'x', operator: '===' as any, value: 'y' } },
    ];
    const visible = filterVisibleQuestions(questions, { x: 'y' });
    expect(visible).toHaveLength(1);
    expect(visible[0].key).toBe('q1');
  });
});
