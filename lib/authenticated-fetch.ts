import { authClient } from '@/lib/auth-client';
import { getBackendBaseURL } from '@/config/network';

/**
 * Wrapper around fetch() that adds session cookie authentication.
 * Use this instead of raw fetch() for any authenticated API call
 * that can't go through axiosInstance (e.g., FormData, streaming).
 *
 * The Cookie header is read from SecureStore via authClient.getCookie() —
 * a local-only read that never calls the backend (safe from session invalidation).
 */
export async function authenticatedFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const backendUrl = getBackendBaseURL();

  // Build headers from existing options
  const headers: Record<string, string> = {};

  // Preserve existing headers
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, options.headers);
    }
  }

  // Add session cookie
  try {
    const cookies = authClient.getCookie();
    if (cookies) {
      headers['Cookie'] = cookies.replace(/^;\s*/, '');
    }

    if (!cookies && __DEV__) {
      console.warn(`⚠️ authenticatedFetch: No session cookie for ${path}`);
    }
  } catch (err) {
    if (__DEV__) {
      console.error('❌ authenticatedFetch: Failed to get session cookie:', err);
    }
  }

  return fetch(`${backendUrl}${path}`, {
    ...options,
    headers,
  });
}
