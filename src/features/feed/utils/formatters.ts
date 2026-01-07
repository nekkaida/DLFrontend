// src/features/feed/utils/formatters.ts

const MAX_NAME_LENGTH = 20;
const DELETED_USER_FALLBACK = '[Deleted User]';

/**
 * Truncates a name to the specified max length with ellipsis.
 * Spec: Very long player names should truncate at ~20 characters with "..."
 * Total length including ellipsis will be maxLength (e.g., 17 chars + "..." = 20)
 */
export const truncateName = (name: string | null | undefined, maxLength: number = MAX_NAME_LENGTH): string => {
  if (!name) return '';
  if (name.length <= maxLength) return name;
  return `${name.slice(0, maxLength - 3)}...`;
};

/**
 * Formats a name for display, handling null/deleted users.
 * Spec: User deletes account - name shows as "[Deleted User]"
 */
export const formatDisplayName = (
  name: string | null | undefined,
  fallback: string = DELETED_USER_FALLBACK
): string => {
  if (!name || name.trim() === '') return fallback;
  return name;
};

/**
 * Combines formatDisplayName and truncateName for full name processing.
 * Note: "[Deleted User]" fallback is never truncated per spec.
 */
export const processDisplayName = (
  name: string | null | undefined,
  maxLength: number = MAX_NAME_LENGTH
): string => {
  const displayName = formatDisplayName(name);
  // Never truncate the deleted user fallback - spec requires exact "[Deleted User]" text
  if (displayName === DELETED_USER_FALLBACK) return displayName;
  return truncateName(displayName, maxLength);
};
