/**
 * VE-5: URL param email validation guard
 *
 * Only accept email from URL params when accompanied by a valid source
 * parameter (e.g., source=login). Prevents arbitrary deep-links from
 * landing on the verify screen for any email.
 */

import { shouldAcceptUrlEmail } from '../verifyEmailGuards';

describe('VE-5: shouldAcceptUrlEmail', () => {
  test('should accept email when source is "login"', () => {
    expect(shouldAcceptUrlEmail('test@example.com', 'login')).toBe(true);
  });

  test('should accept email when source is "register"', () => {
    expect(shouldAcceptUrlEmail('test@example.com', 'register')).toBe(true);
  });

  test('should reject email when source is missing', () => {
    expect(shouldAcceptUrlEmail('test@example.com', undefined)).toBe(false);
  });

  test('should reject email when source is empty string', () => {
    expect(shouldAcceptUrlEmail('test@example.com', '')).toBe(false);
  });

  test('should reject email when source is unknown value', () => {
    expect(shouldAcceptUrlEmail('test@example.com', 'deeplink')).toBe(false);
  });

  test('should reject when email is empty', () => {
    expect(shouldAcceptUrlEmail('', 'login')).toBe(false);
  });

  test('should reject when email is undefined', () => {
    expect(shouldAcceptUrlEmail(undefined, 'login')).toBe(false);
  });
});
