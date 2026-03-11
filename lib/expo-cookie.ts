import { getSetCookie } from "@better-auth/expo/client";

export const applySetCookieHeader = (
  setCookieHeader: string,
  previousCookie?: string,
) => getSetCookie(setCookieHeader, previousCookie);
