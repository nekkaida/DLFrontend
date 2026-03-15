/**
 * Extract the actual data payload from an axios response that's been
 * through the sendSuccess envelope: { success: true, data: { ... } }
 */
export function extractResponseData<T = any>(responseData: any): T | null {
  if (!responseData) return null;
  // Handle sendSuccess envelope: { success, data: { ... } }
  if (responseData.data !== undefined) return responseData.data;
  return responseData;
}

/**
 * Extract error message from an axios error response.
 * sendError returns: { success: false, data: null, message: "..." }
 */
export function extractErrorMessage(error: any, fallback: string): string {
  return error?.response?.data?.message
    || error?.response?.data?.error
    || fallback;
}
