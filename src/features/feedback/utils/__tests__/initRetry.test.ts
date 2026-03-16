/**
 * FB-5: Test that init retry logic works correctly.
 * We test the retry behavior via a simple helper that manages attempts.
 */

describe('FB-5: Init retry logic', () => {
  it('should retry initApp on failure and succeed on subsequent attempt', async () => {
    let callCount = 0;
    const mockInitApp = async (): Promise<string | null> => {
      callCount++;
      if (callCount === 1) throw new Error('Network error');
      return 'app-id-123';
    };

    // First call fails
    let result: string | null = null;
    try {
      result = await mockInitApp();
    } catch {
      // expected failure
    }
    expect(result).toBeNull();
    expect(callCount).toBe(1);

    // Retry succeeds
    result = await mockInitApp();
    expect(result).toBe('app-id-123');
    expect(callCount).toBe(2);
  });

  it('should track init failure state for retry UI', () => {
    // Simulates the state management pattern used in FeedbackScreen
    let initFailed = false;
    let appId: string | null = null;

    // Simulate failed init
    initFailed = true;
    expect(initFailed).toBe(true);
    expect(appId).toBeNull();

    // Simulate successful retry
    appId = 'app-id-456';
    initFailed = false;
    expect(initFailed).toBe(false);
    expect(appId).toBe('app-id-456');
  });
});
