/**
 * Determines whether the questionnaire should be marked as complete.
 * Guards against premature completion when currentVisibleIndex is -1
 * (current question not found in visible list).
 */
export function shouldCompleteQuestionnaire(
  currentVisibleIndex: number,
  visibleQuestionsLength: number
): boolean {
  if (currentVisibleIndex < 0 || visibleQuestionsLength === 0) {
    return false;
  }
  return currentVisibleIndex >= visibleQuestionsLength - 1;
}
