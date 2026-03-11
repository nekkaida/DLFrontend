/**
 * Auth components bug fixes for login screen (LI-10, LI-13 props, LI-14, LI-16).
 * Static analysis tests.
 */

const fs = require('fs');
const path = require('path');

const authComponentsSource = fs.readFileSync(
  path.resolve(__dirname, '../../src/features/auth/components/AuthComponents.tsx'),
  'utf-8'
);

describe('LI-10: getValidationIcon should not be called twice per render', () => {
  test('getValidationIcon() is called at most once in the render output', () => {
    // Count calls to getValidationIcon() in the JSX render section
    // The old pattern: {getValidationIcon() && (<View>{getValidationIcon()}</View>)}
    // calls it twice. Fixed pattern caches the result.
    const calls = authComponentsSource.match(/getValidationIcon\(\)/g) || [];
    // Allow 1 for definition + at most 1 in JSX render
    // The function definition line has getValidationIcon = () => {}, not getValidationIcon()
    // So all matches of getValidationIcon() are call sites
    expect(calls.length).toBeLessThanOrEqual(1);
  });
});

describe('LI-13: InputFieldProps must expose autoCapitalize', () => {
  test('InputFieldProps interface includes autoCapitalize', () => {
    expect(authComponentsSource).toMatch(/autoCapitalize\??\s*:/);
  });

  test('TextInput receives autoCapitalize prop', () => {
    // Inside the InputField component, the TextInput should pass autoCapitalize
    expect(authComponentsSource).toMatch(/autoCapitalize=\{autoCapitalize\}/);
  });
});

describe('LI-14: InputFieldProps must expose returnKeyType and onSubmitEditing', () => {
  test('InputFieldProps includes returnKeyType', () => {
    expect(authComponentsSource).toMatch(/returnKeyType\??\s*:/);
  });

  test('InputFieldProps includes onSubmitEditing', () => {
    expect(authComponentsSource).toMatch(/onSubmitEditing\??\s*:/);
  });
});

describe('LI-16: SocialButton getButtonStyle must differentiate Apple and Google', () => {
  test('getButtonStyle does not hardcode googleButton for all types', () => {
    // Extract the getButtonStyle function body
    const match = authComponentsSource.match(/getButtonStyle\s*=\s*\(\)\s*=>\s*\{([\s\S]*?)\};/);
    expect(match).not.toBeNull();
    if (match) {
      // Should NOT be just `return AuthStyles.googleButton;`
      // Should contain type-specific logic (switch or conditional)
      expect(match[1]).toMatch(/apple|type/i);
    }
  });
});
