/**
 * BUG 13: ProgressBar division by zero
 */
import { calculateProgressPercentage } from '../QuestionProgressBar';

describe('calculateProgressPercentage', () => {
  it('should return 0 when total is 0', () => {
    expect(calculateProgressPercentage(0, 0)).toBe(0);
  });

  it('should return 0 when total is 0 even if current > 0', () => {
    expect(calculateProgressPercentage(3, 0)).toBe(0);
  });

  it('should return correct percentage for normal values', () => {
    expect(calculateProgressPercentage(1, 4)).toBe(25);
    expect(calculateProgressPercentage(2, 4)).toBe(50);
    expect(calculateProgressPercentage(4, 4)).toBe(100);
  });

  it('should never return NaN', () => {
    const result = calculateProgressPercentage(0, 0);
    expect(Number.isNaN(result)).toBe(false);
  });
});
