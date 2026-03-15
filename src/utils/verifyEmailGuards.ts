/**
 * VE-5: Guards for the verify email screen.
 *
 * Only accept URL param email when accompanied by a valid source,
 * preventing arbitrary deep-links from landing on the verify screen.
 */

const VALID_SOURCES = new Set(['login', 'register']);

export function shouldAcceptUrlEmail(
  email: string | undefined,
  source: string | undefined
): boolean {
  if (!email) return false;
  if (!source) return false;
  return VALID_SOURCES.has(source);
}
