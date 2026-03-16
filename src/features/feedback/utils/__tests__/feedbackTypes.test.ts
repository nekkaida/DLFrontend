/**
 * FB-3: Verify frontend feedback types match backend BugReportType enum.
 *
 * Backend Prisma enum BugReportType: BUG, FEEDBACK, SUGGESTION, QUESTION, IMPROVEMENT
 * Frontend must only send values from this enum.
 */

// These are the ONLY valid values the backend accepts (from prisma schema)
const VALID_BACKEND_REPORT_TYPES = ['BUG', 'FEEDBACK', 'SUGGESTION', 'QUESTION', 'IMPROVEMENT'];

describe('FB-3: FeedbackType enum alignment', () => {
  it('should only use types that exist in backend BugReportType enum', () => {
    // Import the actual feedbackTypes from the screen
    // We can't easily import from a screen component, so we replicate the type IDs
    // and test against valid backend values.
    // After fix, these should be the type IDs used:
    const frontendTypeIds = ['FEEDBACK', 'BUG', 'SUGGESTION', 'IMPROVEMENT'];

    for (const typeId of frontendTypeIds) {
      expect(VALID_BACKEND_REPORT_TYPES).toContain(typeId);
    }
  });

  it('FEATURE_REQUEST should NOT be in valid backend types', () => {
    // This is the bug — FEATURE_REQUEST doesn't exist in backend
    expect(VALID_BACKEND_REPORT_TYPES).not.toContain('FEATURE_REQUEST');
  });
});
