/**
 * VE-2 / VE-6: Email verification store tests
 *
 * VE-2: Session validity should be 16 minutes (15min OTP expiry + 1min buffer)
 * VE-6: setEmail resets otpSentAt — used after resend to keep session alive
 */

import { useEmailVerificationStore } from '../emailVerificationStore';

// Helper: reset store between tests
beforeEach(() => {
  useEmailVerificationStore.getState().clearAll();
  jest.restoreAllMocks();
});

describe('VE-2: Session validity duration', () => {
  test('session should be valid within 16 minutes', () => {
    const store = useEmailVerificationStore.getState();
    store.setEmail('test@example.com');

    // Advance 15 minutes — should still be valid (within 16min window)
    const fifteenMinutesMs = 15 * 60 * 1000;
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + fifteenMinutesMs);

    expect(useEmailVerificationStore.getState().isSessionValid()).toBe(true);
  });

  test('session should expire AFTER 16 minutes', () => {
    const baseTime = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(baseTime);

    const store = useEmailVerificationStore.getState();
    store.setEmail('test@example.com');

    // Advance 16 minutes + 1ms — should be expired
    const sixteenMinutesPlusMs = 16 * 60 * 1000 + 1;
    jest.spyOn(Date, 'now').mockReturnValue(baseTime + sixteenMinutesPlusMs);

    expect(useEmailVerificationStore.getState().isSessionValid()).toBe(false);
  });

  test('session should NOT expire at 10 minutes (old value was too short)', () => {
    const baseTime = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(baseTime);

    const store = useEmailVerificationStore.getState();
    store.setEmail('test@example.com');

    // At 10 minutes + 1ms — should still be valid (VE-2 fix)
    const tenMinutesPlusMs = 10 * 60 * 1000 + 1;
    jest.spyOn(Date, 'now').mockReturnValue(baseTime + tenMinutesPlusMs);

    expect(useEmailVerificationStore.getState().isSessionValid()).toBe(true);
  });
});

describe('VE-6: setEmail resets session timer (used after resend)', () => {
  test('calling setEmail again should reset otpSentAt', () => {
    const baseTime = 1000000;
    jest.spyOn(Date, 'now').mockReturnValue(baseTime);

    const store = useEmailVerificationStore.getState();
    store.setEmail('test@example.com');

    // Advance 14 minutes
    const laterTime = baseTime + 14 * 60 * 1000;
    jest.spyOn(Date, 'now').mockReturnValue(laterTime);

    // Re-call setEmail (simulating resend)
    useEmailVerificationStore.getState().setEmail('test@example.com');

    // otpSentAt should be reset to laterTime
    expect(useEmailVerificationStore.getState().otpSentAt).toBe(laterTime);

    // Session should be valid for another 16 minutes from laterTime
    const almostExpired = laterTime + 15 * 60 * 1000;
    jest.spyOn(Date, 'now').mockReturnValue(almostExpired);
    expect(useEmailVerificationStore.getState().isSessionValid()).toBe(true);
  });
});
