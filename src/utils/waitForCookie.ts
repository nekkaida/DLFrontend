/**
 * VE-3: Poll for session cookie availability after email verification.
 *
 * After autoSignInAfterVerification, better-auth creates a session and the
 * expo plugin writes it to SecureStore asynchronously. Instead of a hardcoded
 * 500ms delay, poll until the cookie appears or timeout.
 */

interface WaitForCookieOptions {
  maxWait?: number;   // Total time to wait in ms (default: 2000)
  interval?: number;  // Poll interval in ms (default: 100)
}

export async function waitForCookie(
  getCookie: () => unknown,
  options: WaitForCookieOptions = {}
): Promise<boolean> {
  const { maxWait = 2000, interval = 100 } = options;

  // Check immediately
  if (getCookie()) return true;

  const start = Date.now();

  return new Promise<boolean>((resolve) => {
    const check = () => {
      if (getCookie()) {
        resolve(true);
        return;
      }
      if (Date.now() - start >= maxWait) {
        resolve(false);
        return;
      }
      setTimeout(check, interval);
    };
    setTimeout(check, interval);
  });
}
