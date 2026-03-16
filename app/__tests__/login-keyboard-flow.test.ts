/**
 * LI-23: LoginScreen keyboard flow — returnKeyType + onSubmitEditing
 *
 * The email field should have returnKeyType="next" to advance to password,
 * the password field should have returnKeyType="go" to submit login,
 * and InputField must support React.forwardRef for programmatic focus.
 *
 * Pattern: static analysis (same as session-safety.test.ts)
 */

const fs = require('fs');
const path = require('path');

describe('LI-23: InputField forwardRef support', () => {
  const filePath = path.resolve(
    __dirname,
    '../../src/features/auth/components/AuthComponents.tsx',
  );
  let source: string;

  beforeAll(() => {
    source = fs.readFileSync(filePath, 'utf-8');
  });

  test('InputField uses React.forwardRef', () => {
    // InputField must be wrapped with forwardRef to allow parent components
    // to programmatically focus the internal TextInput
    expect(source).toMatch(/forwardRef/);
  });
});

describe('LI-23: LoginScreen passes keyboard navigation props', () => {
  const filePath = path.resolve(
    __dirname,
    '../../src/features/auth/screens/LoginScreen.tsx',
  );
  let source: string;

  beforeAll(() => {
    source = fs.readFileSync(filePath, 'utf-8');
  });

  test('email input has returnKeyType="next"', () => {
    // The first InputField (email) should advance to password field
    expect(source).toMatch(/returnKeyType.*next|returnKeyType=.*next/);
  });

  test('password input has returnKeyType="go"', () => {
    // The second InputField (password) should submit the form
    expect(source).toMatch(/returnKeyType.*go|returnKeyType=.*go/);
  });

  test('uses a ref for password field focus', () => {
    // A ref is needed to programmatically focus the password input
    expect(source).toMatch(/useRef.*TextInput|passwordRef|passwordInputRef/);
  });
});
