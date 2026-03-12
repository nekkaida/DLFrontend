/**
 * LI-1 + LI-17: Production console.log leak regression guard
 *
 * Ensures all console.log/console.error/console.warn statements in login-related
 * files are wrapped in __DEV__ guards to prevent leaking user credentials,
 * API responses, and backend URLs in production builds.
 *
 * Pattern: same static-analysis approach as session-safety.test.ts
 */

const fs = require('fs');
const path = require('path');

/**
 * Checks that every console statement in a file is inside an `if (__DEV__)` block.
 * Tracks __DEV__ block scope via brace counting.
 * Returns an array of { line, content } for any unguarded console statements.
 */
function findUnguardedConsoleStatements(filePath: string): Array<{ line: number; content: string }> {
  const source = fs.readFileSync(filePath, 'utf-8');
  const lines: string[] = source.split('\n');
  const violations: Array<{ line: number; content: string }> = [];

  // Track nested __DEV__ block depth
  let devBlockDepth = 0;
  const devBlockBraceStart: number[] = []; // brace depth when __DEV__ block started
  let braceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;

    // Detect `if (__DEV__)` on this line — both inline and block forms
    if (/__DEV__/.test(line)) {
      if (line.includes('{')) {
        // Block form: if (__DEV__) { ... }
        devBlockBraceStart.push(braceDepth);
        devBlockDepth++;
      }
      // Inline form: if (__DEV__) console.log(...) — handled by same-line check below
    }

    // Count braces to track when we exit __DEV__ blocks
    const opens = (line.match(/{/g) || []).length;
    const closes = (line.match(/}/g) || []).length;
    braceDepth += opens - closes;

    // Check if we've exited any __DEV__ blocks
    while (devBlockDepth > 0 && braceDepth <= devBlockBraceStart[devBlockBraceStart.length - 1]) {
      devBlockBraceStart.pop();
      devBlockDepth--;
    }

    // Check for console.log, console.error, console.warn
    if (/console\.(log|error|warn)\s*\(/.test(line)) {
      // Guarded if: inside a __DEV__ block OR same line has __DEV__
      const isGuarded = devBlockDepth > 0 || /__DEV__/.test(line);
      if (!isGuarded) {
        violations.push({ line: i + 1, content: trimmed });
      }
    }
  }

  return violations;
}

describe('LI-1: login.tsx must not have unguarded console statements', () => {
  test('all console.log/console.error in login.tsx are wrapped in __DEV__', () => {
    const filePath = path.resolve(__dirname, '../login.tsx');
    const violations = findUnguardedConsoleStatements(filePath);

    expect(violations).toEqual([]);
  });
});

describe('LI-17: auth-client.ts must not have unguarded console statements', () => {
  test('all console.log in auth-client.ts are wrapped in __DEV__', () => {
    const filePath = path.resolve(__dirname, '../../lib/auth-client.ts');
    const violations = findUnguardedConsoleStatements(filePath);

    expect(violations).toEqual([]);
  });
});

describe('LI-21: native-social-auth.ts must not have unguarded console statements', () => {
  test('all console.error in native-social-auth.ts are wrapped in __DEV__', () => {
    const filePath = path.resolve(__dirname, '../../lib/native-social-auth.ts');
    const violations = findUnguardedConsoleStatements(filePath);

    expect(violations).toEqual([]);
  });
});
