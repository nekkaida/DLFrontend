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
  const headers: Record<string, string> = {
    'X-Client-Type': 'mobile', // Add mobile identifier
  };

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

    if (__DEV__) {
      console.log(`📤 authenticatedFetch [${path}]: Raw cookie length:`, cookies?.length || 0);
      console.log(`📤 authenticatedFetch [${path}]: Has session_data:`, cookies?.includes('session_data') || false);
    }

    if (cookies) {
      // Cookie values from SecureStore may be URL-encoded (containing %2F, %2B, %3D etc.)
      // Better Auth expects raw Base64 values, so we need to decode each cookie value
      const rawCookies = cookies.replace(/^;\s*/, '');
      const decodedCookies = rawCookies.split('; ').map(cookie => {
        const eqIndex = cookie.indexOf('=');
        if (eqIndex === -1) return cookie;
        const name = cookie.substring(0, eqIndex);
        const value = cookie.substring(eqIndex + 1);
        try {
          return `${name}=${decodeURIComponent(value)}`;
        } catch {
          return cookie; // If decoding fails, use original
        }
      }).join('; ');
      headers['Cookie'] = decodedCookies;

      if (__DEV__) {
        console.log(`📤 authenticatedFetch [${path}]: Cookie header set (${decodedCookies.substring(0, 80)}...)`);
      }
    }

    if (!cookies && __DEV__) {
      console.warn(`⚠️ authenticatedFetch: No session cookie for ${path}`);
    }
  } catch (err) {
    if (__DEV__) {
      console.error('❌ authenticatedFetch: Failed to get session cookie:', err);
    }
  }

  if (__DEV__) {
    console.log(`📤 authenticatedFetch [${path}]: Final headers:`, JSON.stringify(headers, null, 2));
  }

  return fetch(`${backendUrl}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
}
