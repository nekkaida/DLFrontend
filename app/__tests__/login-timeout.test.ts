/**
 * LI-4: LoginScreen timeout timer must be properly cleared.
 * Static analysis test to verify the setTimeout has a corresponding clearTimeout.
 */

const fs = require('fs');
const path = require('path');

describe('LI-4: LoginScreen timeout timer must be cleared', () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, '../../src/features/auth/screens/LoginScreen.tsx'),
    'utf-8'
  );

  test('setTimeout return value is stored in a variable', () => {
    // The timeout ID must be captured to allow clearing
    // Pattern: timeoutId = setTimeout(...) or similar
    expect(source).toMatch(/\w+\s*=\s*setTimeout/);
  });

  test('clearTimeout is called in the finally or cleanup block', () => {
    expect(source).toMatch(/clearTimeout/);
  });

  test('timeout ID is declared outside Promise for cleanup access', () => {
    // The timeout ID must be declared BEFORE the Promise constructor
    // so clearTimeout can access it in the finally block
    expect(source).toMatch(/let\s+timeoutId[\s\S]*?timeoutId\s*=\s*setTimeout/);
  });
});
