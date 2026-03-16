/**
 * LI-11 + LI-18: Login error handling for rate limits and unverified email.
 * Static analysis tests.
 */

const fs = require('fs');
const path = require('path');

const loginSource = fs.readFileSync(path.resolve(__dirname, '../login.tsx'), 'utf-8');

describe('LI-18: login.tsx should detect unverified email errors', () => {
  test('checks for email verification error in result.error', () => {
    // Should detect "not verified" or "email verification" in the error message
    expect(loginSource).toMatch(/verif/i);
    // Should have specific handling (navigate to verifyEmail or show specific message)
    expect(loginSource).toMatch(/verifyEmail|resend|not verified/i);
  });
});

describe('LI-11: login.tsx should handle 429 rate-limit responses', () => {
  test('checks for rate limit status or message', () => {
    // Should detect 429 status code or rate-limit message
    expect(loginSource).toMatch(/429|rate.?limit|too many/i);
  });
});
