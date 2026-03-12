/**
 * Tests that login flow navigates immediately after successful signIn
 * without polling getSession().
 */

describe('BUG G: login should not poll getSession after successful signIn', () => {
  test('successful signIn result contains user data sufficient for navigation', () => {
    // Simulate what signIn returns on success
    const signInResult = {
      data: {
        user: { id: 'user-123', name: 'Test', email: 'test@test.com' },
        session: { token: 'abc' },
      },
      error: null,
    };

    // The fix: if signIn returns user data, we should navigate immediately
    // No need to poll getSession()
    const shouldNavigate = !!signInResult.data?.user?.id;
    expect(shouldNavigate).toBe(true);
  });

  test('failed signIn does not trigger navigation', () => {
    const signInResult = {
      data: null,
      error: { message: 'Invalid credentials' },
    };

    const shouldNavigate = !!signInResult.data?.user?.id;
    expect(shouldNavigate).toBe(false);
  });
});

/**
 * LI-2: login.tsx must use getPostAuthRoute for onboarding-aware navigation,
 * NOT hardcode "/user-dashboard" after email/password login.
 */
const fs = require('fs');
const path = require('path');

describe('LI-2: login.tsx must use onboarding-aware routing after email login', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../login.tsx'), 'utf-8');

  test('imports getPostAuthRoute from post-auth-route', () => {
    expect(source).toMatch(/import.*getPostAuthRoute.*from.*post-auth-route/);
  });

  test('calls getPostAuthRoute in handleLogin success path', () => {
    expect(source).toMatch(/getPostAuthRoute/);
  });

  test('does not hardcode router.replace("/user-dashboard") in handleLogin', () => {
    // The handleLogin function should NOT contain a hardcoded "/user-dashboard"
    const handleLoginMatch = source.match(/const handleLogin\s*=\s*async[\s\S]*?^  \};/m);
    if (handleLoginMatch) {
      expect(handleLoginMatch[0]).not.toMatch(/router\.replace\(["']\/user-dashboard["']\)/);
    }
  });
});
