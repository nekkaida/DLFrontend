/**
 * BUG 11: Location coordinate fallback corruption
 * parseLocationString should not produce numeric city from coordinate strings.
 */
import { parseLocationString } from '../locationUtils';

describe('parseLocationString', () => {
  it('should parse "City, State" correctly', () => {
    const result = parseLocationString('KL, Selangor');
    expect(result.city).toBe('KL');
    expect(result.state).toBe('Selangor');
  });

  it('should parse "City, State, Country" correctly', () => {
    const result = parseLocationString('KL, Selangor, Malaysia');
    expect(result.city).toBe('KL');
    expect(result.state).toBe('Selangor');
    expect(result.country).toBe('Malaysia');
  });

  it('should parse single city correctly', () => {
    const result = parseLocationString('Tokyo');
    expect(result.city).toBe('Tokyo');
  });

  it('should NOT produce numeric city from coordinate string', () => {
    const result = parseLocationString('3.1390, 101.6869');
    // City should be empty, not a number
    expect(result.city).not.toMatch(/^-?\d+\.?\d*$/);
  });

  it('should NOT produce numeric city from negative coordinate string', () => {
    const result = parseLocationString('-33.8688, 151.2093');
    expect(result.city).not.toMatch(/^-?\d+\.?\d*$/);
  });

  it('should return empty city for coordinate-only strings', () => {
    const result = parseLocationString('3.1390, 101.6869');
    expect(result.city).toBe('');
    expect(result.state).toBe('');
  });
});
