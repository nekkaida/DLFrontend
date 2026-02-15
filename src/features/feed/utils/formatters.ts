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

/**
 * Format post timestamp for activity feed based on age.
 * Spec:
 * - Under 60 minutes: "Just now" (< 5 mins), "5m", "32m"
 * - Under 24 hours: "2h", "13h"
 * - Yesterday/1-2 days ago: "Yesterday", "1 day ago", "2 days ago"
 * - Within 7 days: "Mon", "Tue"
 * - Older than 7 days: "12 Jan", "12 Jan 2026" (only if different year)
 */
export const formatPostTime = (dateString: string): string => {
  const now = new Date();
  const postDate = new Date(dateString);
  const diffMs = now.getTime() - postDate.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Under 60 minutes
  if (diffMinutes < 5) {
    return 'Just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }

  // Under 24 hours
  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  // Yesterday/1 day ago/2 days ago
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays === 2) {
    return '2 days ago';
  }

  // Within 7 days - show day of week
  if (diffDays < 7) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[postDate.getDay()];
  }

  // Older than 7 days - show date
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = postDate.getDate();
  const month = months[postDate.getMonth()];
  const year = postDate.getFullYear();
  const currentYear = now.getFullYear();

  // Only show year if different from current year
  if (year !== currentYear) {
    return `${day} ${month} ${year}`;
  }
  return `${day} ${month}`;
};
