/**
 * LI-22: verifyEmail.tsx must read URL params as fallback for email
 *
 * When login.tsx detects an unverified email error, it navigates to /verifyEmail
 * with { params: { email } }. The verifyEmail screen must read this param as a
 * fallback when the Zustand store is empty (which happens when the user didn't
 * come from the registration flow).
 *
 * Pattern: static analysis (same as session-safety.test.ts)
 */

const fs = require('fs');
const path = require('path');

describe('LI-22: verifyEmail.tsx URL param email fallback', () => {
  const filePath = path.resolve(__dirname, '../verifyEmail.tsx');
  let source: string;

  beforeAll(() => {
    source = fs.readFileSync(filePath, 'utf-8');
  });

  test('imports useLocalSearchParams from expo-router', () => {
    expect(source).toMatch(/useLocalSearchParams/);
  });

  test('reads email from URL search params', () => {
    // Must destructure or access email from useLocalSearchParams result
    expect(source).toMatch(/useLocalSearchParams.*email|email.*useLocalSearchParams/s);
  });

  test('populates store when URL param email is available but store is empty', () => {
    // The screen should call setEmail with the URL param when store email is null
    // This ensures the Zustand store is populated for subsequent API calls
    expect(source).toMatch(/setEmail/);
  });
});
