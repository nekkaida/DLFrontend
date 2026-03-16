/**
 * VE-3: Cookie polling utility test
 *
 * Replaces the hardcoded 500ms delay with a polling loop that
 * checks for the session cookie, with a configurable timeout.
 */

import { waitForCookie } from '../waitForCookie';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('VE-3: waitForCookie', () => {
  test('resolves true immediately when cookie is already available', async () => {
    const getCookie = jest.fn().mockReturnValue('session-token');
    const promise = waitForCookie(getCookie, { maxWait: 2000, interval: 100 });
    jest.advanceTimersByTime(0);
    await expect(promise).resolves.toBe(true);
  });

  test('resolves true when cookie becomes available after a delay', async () => {
    const getCookie = jest.fn()
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(null)
      .mockReturnValue('session-token');

    const promise = waitForCookie(getCookie, { maxWait: 2000, interval: 100 });

    jest.advanceTimersByTime(100);
    jest.advanceTimersByTime(100);
    jest.advanceTimersByTime(100);

    await expect(promise).resolves.toBe(true);
  });

  test('resolves false when cookie never becomes available (timeout)', async () => {
    const getCookie = jest.fn().mockReturnValue(null);

    const promise = waitForCookie(getCookie, { maxWait: 500, interval: 100 });

    jest.advanceTimersByTime(600);

    await expect(promise).resolves.toBe(false);
  });

  test('uses default maxWait of 2000ms and interval of 100ms', async () => {
    const getCookie = jest.fn().mockReturnValue(null);

    const promise = waitForCookie(getCookie);

    jest.advanceTimersByTime(2100);

    await expect(promise).resolves.toBe(false);
    expect(getCookie.mock.calls.length).toBeGreaterThanOrEqual(1);
  });
});
