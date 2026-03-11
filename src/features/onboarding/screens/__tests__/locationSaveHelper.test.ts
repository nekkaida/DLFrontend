/**
 * BUG 17: Silent location save failure
 * saveLocationWithFeedback should show toast.error on failure.
 */
import { saveLocationWithFeedback } from '../locationUtils';

// Mock toast
const mockToastError = jest.fn();
jest.mock('sonner-native', () => ({
  toast: {
    error: (...args: any[]) => mockToastError(...args),
    success: jest.fn(),
  },
}));

describe('saveLocationWithFeedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call toast.error when save fails', async () => {
    const failingSaveFn = jest.fn().mockRejectedValue(new Error('Network error'));

    await saveLocationWithFeedback(failingSaveFn);

    expect(mockToastError).toHaveBeenCalled();
  });

  it('should not show error when save succeeds', async () => {
    const successSaveFn = jest.fn().mockResolvedValue(undefined);

    await saveLocationWithFeedback(successSaveFn);

    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('should call the save function', async () => {
    const saveFn = jest.fn().mockResolvedValue(undefined);

    await saveLocationWithFeedback(saveFn);

    expect(saveFn).toHaveBeenCalled();
  });
});
