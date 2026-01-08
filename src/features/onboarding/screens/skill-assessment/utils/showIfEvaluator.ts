import { ShowIfCondition } from '../types/questionnaire.types';

/**
 * Evaluates a showIf condition against current responses.
 *
 * @param showIf - Single condition or array of conditions (AND logic for arrays)
 * @param responses - Current questionnaire responses
 * @returns true if question should be visible, false otherwise
 */
export function evaluateShowIf(
  showIf: ShowIfCondition | ShowIfCondition[] | undefined,
  responses: Record<string, any>
): boolean {
  // No condition = always visible
  if (!showIf) return true;

  const conditions = Array.isArray(showIf) ? showIf : [showIf];

  // ALL conditions must be true (AND logic)
  return conditions.every(condition => {
    const value = responses[condition.key];

    switch (condition.operator) {
      case '==':
        return value === condition.value;
      case '!=':
        return value !== condition.value;
      case 'exists':
        return value !== undefined && value !== '' && value !== null;
      case 'not_exists':
        return value === undefined || value === '' || value === null;
      default:
        return true;
    }
  });
}

/**
 * Filters questions based on current responses.
 * Returns only questions that should be visible.
 *
 * @param questions - All questions with showIf conditions
 * @param responses - Current questionnaire responses
 * @returns Filtered array of visible questions
 */
export function filterVisibleQuestions<T extends { showIf?: ShowIfCondition | ShowIfCondition[] }>(
  questions: T[],
  responses: Record<string, any>
): T[] {
  return questions.filter(q => evaluateShowIf(q.showIf, responses));
}
