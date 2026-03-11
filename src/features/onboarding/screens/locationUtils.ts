import { toast } from 'sonner-native';

/**
 * Parses a location string into city, state, country components.
 * Guards against coordinate strings (e.g. "3.1390, 101.6869") being
 * mistakenly parsed as city names.
 */
export function parseLocationString(locationString: string): {
  city: string;
  state: string;
  country: string;
} {
  const parts = locationString.split(',').map(part => part.trim());

  // Guard: if all parts look like numbers (coordinates), return empty values
  const allNumeric = parts.every(part => /^-?\d+\.?\d*$/.test(part));
  if (allNumeric) {
    return { city: '', state: '', country: '' };
  }

  if (parts.length >= 3) {
    return {
      city: parts[0],
      state: parts[1],
      country: parts.slice(2).join(', '),
    };
  } else if (parts.length === 2) {
    return {
      city: parts[0],
      state: parts[1],
      country: '',
    };
  } else {
    return {
      city: parts[0],
      state: 'Unknown',
      country: 'Unknown',
    };
  }
}

/**
 * Wraps a save function with user-facing error feedback.
 * Shows a toast error if the save fails instead of silently swallowing.
 */
export async function saveLocationWithFeedback(
  saveFn: () => Promise<unknown>
): Promise<void> {
  try {
    await saveFn();
  } catch (error) {
    toast.error('Failed to save location. Please try again.');
  }
}
