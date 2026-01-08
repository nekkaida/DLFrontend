/**
 * Shared password validation utility
 * Used by SignUpScreen and ResetPasswordScreen for consistent password requirements
 */

export type PasswordStrength = 'weak' | 'medium' | 'strong' | null;

export interface PasswordValidationResult {
  isValid: boolean;
  error: string;
  strength: PasswordStrength;
}

/**
 * Validates password against requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - Special character (optional, for strong rating)
 */
export const validatePassword = (pwd: string): PasswordValidationResult => {
  if (pwd.length === 0) {
    return { isValid: true, error: '', strength: null };
  }

  if (pwd.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters', strength: 'weak' };
  }

  const hasUpperCase = /[A-Z]/.test(pwd);
  const hasLowerCase = /[a-z]/.test(pwd);
  const hasNumber = /\d/.test(pwd);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

  const strengthScore = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length;

  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    return {
      isValid: false,
      error: 'Password must contain uppercase, lowercase, and number',
      strength: 'weak'
    };
  }

  if (strengthScore === 3) {
    return { isValid: true, error: '', strength: 'medium' };
  }

  return { isValid: true, error: '', strength: 'strong' };
};

/**
 * Password requirements for display
 */
export const PASSWORD_REQUIREMENTS = [
  'At least 8 characters',
  'Uppercase and lowercase letters',
  'At least one number',
  'Special character for strong password (optional)',
];
