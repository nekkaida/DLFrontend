import axiosInstance from '@/lib/endpoints';

export interface WaitlistStatus {
  isWaitlisted: boolean;
  position: number | null;
  totalWaitlisted: number;
  seasonStatus: string;
  maxParticipants: number | null;
  waitlistEnabled: boolean;
}

export interface JoinWaitlistResult {
  success: boolean;
  waitlistUserId: string;
  position: number;
  totalWaitlisted: number;
}

export interface LeaveWaitlistResult {
  success: boolean;
}

export class WaitlistService {
  /**
   * Join waitlist for a season
   */
  static async joinWaitlist(seasonId: string): Promise<JoinWaitlistResult> {
    console.log('[WaitlistService] joinWaitlist called for season:', seasonId);
    try {
      const response = await axiosInstance.post(`/api/waitlist/${seasonId}/join`);
      console.log('[WaitlistService] joinWaitlist response:', {
        status: response.status,
        data: response.data
      });

      // Handle wrapped response { success: true, data: {...} }
      if (response.data?.data) {
        console.log('[WaitlistService] Unwrapping nested data from joinWaitlist response');
        const result = { success: true, ...response.data.data } as JoinWaitlistResult;
        console.log('[WaitlistService] Successfully joined waitlist for season:', seasonId, result);
        return result;
      } else if (response.data) {
        console.log('[WaitlistService] Successfully joined waitlist for season:', seasonId);
        return response.data as JoinWaitlistResult;
      }

      throw new Error('Invalid response from server');
    } catch (error: any) {
      console.error('[WaitlistService] Error joining waitlist:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      // Extract error message from response
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to join waitlist';
      throw new Error(errorMessage);
    }
  }

  /**
   * Leave waitlist for a season
   */
  static async leaveWaitlist(seasonId: string): Promise<LeaveWaitlistResult> {
    console.log('[WaitlistService] leaveWaitlist called for season:', seasonId);
    try {
      const response = await axiosInstance.delete(`/api/waitlist/${seasonId}/leave`);
      console.log('[WaitlistService] leaveWaitlist response:', {
        status: response.status,
        data: response.data
      });

      // Handle wrapped response { success: true, data: {...} }
      if (response.data?.data) {
        console.log('[WaitlistService] Unwrapping nested data from leaveWaitlist response');
        const result = { success: true, ...response.data.data } as LeaveWaitlistResult;
        console.log('[WaitlistService] Successfully left waitlist for season:', seasonId);
        return result;
      } else if (response.data) {
        console.log('[WaitlistService] Successfully left waitlist for season:', seasonId);
        return response.data as LeaveWaitlistResult;
      }

      throw new Error('Invalid response from server');
    } catch (error: any) {
      console.error('[WaitlistService] Error leaving waitlist:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to leave waitlist';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get waitlist status for current user
   */
  static async getStatus(seasonId: string): Promise<WaitlistStatus> {
    console.log('[WaitlistService] getStatus called for season:', seasonId);
    try {
      const response = await axiosInstance.get(`/api/waitlist/${seasonId}/status`);
      console.log('[WaitlistService] getStatus response:', {
        status: response.status,
        data: response.data
      });

      // Handle wrapped response { success: true, data: {...} }
      if (response.data?.data) {
        console.log('[WaitlistService] Unwrapping nested data from response');
        return response.data.data as WaitlistStatus;
      } else if (response.data) {
        // Fallback for flat response structure
        return response.data as WaitlistStatus;
      }

      console.log('[WaitlistService] No data in response, returning default status');
      // Return default status if no data
      return {
        isWaitlisted: false,
        position: null,
        totalWaitlisted: 0,
        seasonStatus: 'UNKNOWN',
        maxParticipants: null,
        waitlistEnabled: false,
      };
    } catch (error: any) {
      console.error('[WaitlistService] Error getting waitlist status:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      // Return default status on error
      return {
        isWaitlisted: false,
        position: null,
        totalWaitlisted: 0,
        seasonStatus: 'UNKNOWN',
        maxParticipants: null,
        waitlistEnabled: false,
      };
    }
  }

  /**
   * Get position text for display
   */
  static getPositionText(position: number | null, total: number): string {
    if (position === null) return '';
    return `#${position} of ${total}`;
  }

  /**
   * Check if waitlist is full
   */
  static isWaitlistFull(status: WaitlistStatus): boolean {
    if (!status.maxParticipants) return false;
    return status.totalWaitlisted >= status.maxParticipants;
  }
}
