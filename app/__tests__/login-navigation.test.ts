/**
 * Login screen navigation regression tests.
 * Static analysis tests to prevent common navigation bugs.
 */

const fs = require('fs');
const path = require('path');

describe('LI-3: Landing page must pass from=landing when navigating to /login', () => {
  test('index.tsx passes from param when navigating to /login', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../index.tsx'), 'utf-8');

    // Should use router.push with params object, not bare string
    // Accept: router.push({ pathname: "/login", params: { from: "landing" } })
    expect(source).toMatch(/from.*["']landing["']/);
  });
});

describe('LI-5: login.tsx should not have duplicate isSocialLoading state', () => {
  test('login.tsx does not declare isSocialLoading state', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../login.tsx'), 'utf-8');

    // Route should NOT have its own isSocialLoading state — it's dead
    const stateDeclarations = (source.match(/useState.*isSocialLoading|isSocialLoading.*useState/g) || []);
    expect(stateDeclarations.length).toBe(0);
  });
});

describe('LI-7: login.tsx social login handler should not have unreachable catch', () => {
  test('handleSocialLogin does not have try/catch wrapping signInWithNativeOAuth', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../login.tsx'), 'utf-8');

    // Extract handleSocialLogin function body
    const match = source.match(/const handleSocialLogin\s*=\s*async[\s\S]*?^\s{2}\};/m);
    if (match) {
      // Should not have a catch block (signInWithNativeOAuth never throws)
      expect(match[0]).not.toMatch(/\bcatch\b/);
    }
  });
});

describe('LI-6: LoginScreen must hide Apple button on Android', () => {
  test('LoginScreen.tsx wraps Apple SocialButton with Platform.OS check', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../src/features/auth/screens/LoginScreen.tsx'),
      'utf-8'
    );

    // Find the Social Login Buttons section and verify Apple button is guarded
    const socialSection = source.match(/Social Login Buttons[\s\S]*?<\/View>/);
    expect(socialSection).not.toBeNull();
    if (socialSection) {
      // Apple button must be inside a Platform.OS === 'ios' guard
      expect(socialSection[0]).toMatch(/Platform\.OS\s*===\s*['"]ios['"][\s\S]*?type=["']apple["']/);
    }
  });
});

describe('LI-12: Sign In button must disable during social loading', () => {
  test('Sign In TouchableOpacity disabled includes isSocialLoading', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../src/features/auth/screens/LoginScreen.tsx'),
      'utf-8'
    );

    // Find the Sign In button's disabled prop (near handleLogin invocation)
    const signInSection = source.match(/PressTimeRef\)\(handleLogin\)[\s\S]{0,200}disabled=\{([^}]+)\}/);
    expect(signInSection).not.toBeNull();
    if (signInSection) {
      expect(signInSection[1]).toContain('isSocialLoading');
    }
  });
});

describe('LI-8 + LI-15: Login input field hints and placeholder', () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, '../../src/features/auth/screens/LoginScreen.tsx'),
    'utf-8'
  );

  test('email/username field does NOT use autoComplete="email"', () => {
    // Find the Username or email InputField section
    const inputSection = source.match(/label=["']Username or email["'][\s\S]{0,500}/);
    expect(inputSection).not.toBeNull();
    if (inputSection) {
      expect(inputSection[0]).not.toMatch(/autoComplete=["']email["']/);
    }
  });

  test('placeholder is not email-only format', () => {
    const inputSection = source.match(/label=["']Username or email["'][\s\S]{0,300}/);
    expect(inputSection).not.toBeNull();
    if (inputSection) {
      expect(inputSection[0]).not.toMatch(/placeholder=["']yourname@gmail\.com["']/);
    }
  });
});

describe('LI-13: Login email/username field disables auto-capitalize', () => {
  test('email/username InputField has autoCapitalize="none"', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../src/features/auth/screens/LoginScreen.tsx'),
      'utf-8'
    );

    const inputSection = source.match(/label=["']Username or email["'][\s\S]{0,500}/);
    expect(inputSection).not.toBeNull();
    if (inputSection) {
      expect(inputSection[0]).toMatch(/autoCapitalize=["']none["']/);
    }
  });
});

describe('LI-19: LoginScreen must use per-button debounce, not shared', () => {
  test('does not use a single shared lastPressTimeRef for all buttons', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../src/features/auth/screens/LoginScreen.tsx'),
      'utf-8'
    );

    // There should NOT be a single shared lastPressTimeRef
    const sharedRefCount = (source.match(/lastPressTimeRef/g) || []).length;
    expect(sharedRefCount).toBe(0);

    // Should have separate per-button refs
    expect(source).toMatch(/loginPressTimeRef|signInPressTimeRef/);
    expect(source).toMatch(/forgotPressTimeRef/);
    expect(source).toMatch(/signUpPressTimeRef/);
  });
});
