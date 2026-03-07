interface NumberConstraints {
  min_value?: number;
  max_value?: number;
}

interface ValidationResult {
  valid: boolean;
  error: string | null;
}

export function validateNumberInput(
  value: number,
  constraints: NumberConstraints
): ValidationResult {
  if (isNaN(value)) {
    return { valid: false, error: 'Please enter a valid number' };
  }

  if (constraints.min_value !== undefined && value < constraints.min_value) {
    return { valid: false, error: `Minimum value is ${constraints.min_value}` };
  }

  if (constraints.max_value !== undefined && value > constraints.max_value) {
    return { valid: false, error: `Maximum value is ${constraints.max_value}` };
  }

  return { valid: true, error: null };
}
