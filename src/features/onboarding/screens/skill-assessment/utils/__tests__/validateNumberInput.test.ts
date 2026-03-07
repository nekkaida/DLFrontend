import { validateNumberInput } from '../validateNumberInput';

describe('validateNumberInput', () => {
  describe('BUG 7: min/max validation on Next button path', () => {
    it('should reject value below minimum', () => {
      const result = validateNumberInput(1.5, { min_value: 2.0, max_value: 8.0 });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('2');
    });

    it('should reject value above maximum', () => {
      const result = validateNumberInput(9.0, { min_value: 2.0, max_value: 8.0 });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('8');
    });

    it('should accept value within range', () => {
      const result = validateNumberInput(4.5, { min_value: 2.0, max_value: 8.0 });

      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should accept value at minimum boundary', () => {
      const result = validateNumberInput(2.0, { min_value: 2.0, max_value: 8.0 });

      expect(result.valid).toBe(true);
    });

    it('should accept value at maximum boundary', () => {
      const result = validateNumberInput(8.0, { min_value: 2.0, max_value: 8.0 });

      expect(result.valid).toBe(true);
    });

    it('should accept any value when no constraints defined', () => {
      const result = validateNumberInput(999, {});

      expect(result.valid).toBe(true);
    });

    it('should reject NaN', () => {
      const result = validateNumberInput(NaN, { min_value: 0, max_value: 100 });

      expect(result.valid).toBe(false);
    });
  });
});
