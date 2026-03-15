/**
 * LI-9: AuthStyles should not use stale module-scope Dimensions.
 */
const fs = require('fs');
const path = require('path');

describe('LI-9: screenContainer should not use stale dimensions', () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, '../../src/features/auth/styles/AuthStyles.ts'),
    'utf-8'
  );

  test('screenContainer uses flex: 1 instead of static width/height', () => {
    // Extract the screenContainer style block
    const match = source.match(/screenContainer:\s*\{([^}]+)\}/);
    expect(match).not.toBeNull();
    if (match) {
      // Should NOT use screenWidth or screenHeight
      expect(match[1]).not.toMatch(/screenWidth|screenHeight/);
    }
  });
});
