import { extractResponseData, extractErrorMessage } from '../responseHelpers';

describe('extractResponseData', () => {
  describe('FB-1/FB-2: unwraps sendSuccess envelope', () => {
    it('should extract appId from sendSuccess envelope', () => {
      // Backend sendSuccess returns: { success: true, data: { appId: "xyz" } }
      // After axios interceptor, response.data = this same object
      const responseData = { success: true, data: { appId: 'xyz', code: 'DLM' } };

      const result = extractResponseData(responseData);

      expect(result?.appId).toBe('xyz');
    });

    it('should extract report id from sendSuccess envelope', () => {
      const responseData = {
        success: true,
        data: { id: 'report-123', reportNumber: 'DLM-001', title: 'Test' },
      };

      const result = extractResponseData(responseData);

      expect(result?.id).toBe('report-123');
    });

    it('should handle null/undefined response', () => {
      expect(extractResponseData(null)).toBeNull();
      expect(extractResponseData(undefined)).toBeNull();
    });

    it('should pass through if no envelope (raw object)', () => {
      const raw = { appId: 'xyz' };
      // No success/data wrapper — should return the object itself
      const result = extractResponseData(raw);
      expect(result?.appId).toBe('xyz');
    });
  });
});

describe('extractErrorMessage', () => {
  describe('FB-4: extracts error from sendError response', () => {
    it('should extract message field from sendError response', () => {
      // sendError returns: { success: false, data: null, message: "User not found" }
      const error = {
        response: {
          data: { success: false, data: null, message: 'User not found' },
        },
      };

      expect(extractErrorMessage(error, 'fallback')).toBe('User not found');
    });

    it('should fall back to error field if message missing', () => {
      const error = {
        response: { data: { error: 'Something went wrong' } },
      };

      expect(extractErrorMessage(error, 'fallback')).toBe('Something went wrong');
    });

    it('should return fallback when no response data', () => {
      expect(extractErrorMessage({}, 'Please try again')).toBe('Please try again');
      expect(extractErrorMessage(null, 'Please try again')).toBe('Please try again');
    });
  });
});
