/**
 * Activity Service
 * Handles API calls for player activity status
 */

import axios from 'axios';
import { getBackendBaseURL } from '@/src/config/network';

export interface ActivityStatus {
  userId: string;
  status: string;
  lastMatchDate: string | null;
  daysSinceLastMatch: number | null;
  isAtRisk: boolean;
  daysUntilInactive: number | null;
  lastActivityCheck: string | null;
  thresholds: {
    warning: number;
    inactive: number;
  };
}

export interface ActivityStatusResponse {
  success: boolean;
  data: ActivityStatus;
}

/**
 * Fetch activity status for a player
 */
export async function fetchActivityStatus(
  userId: string,
  authToken?: string
): Promise<ActivityStatus> {
  try {
    const response = await axios.get<ActivityStatusResponse>(
      `${getBackendBaseURL()}/api/player/activity-status/${userId}`,
      {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
      }
    );

    if (!response.data.success) {
      throw new Error('Failed to fetch activity status');
    }

    return response.data.data;
  } catch (error) {
    console.error('Error fetching activity status:', error);
    throw error;
  }
}
