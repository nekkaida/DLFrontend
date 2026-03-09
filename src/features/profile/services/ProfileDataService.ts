import axiosInstance from '@/lib/endpoints';
import { toast } from 'sonner-native';

/**
 * ProfileDataService - Handles all API calls for profile data
 *
 * CRITICAL: This service preserves the exact API call patterns, error handling,
 * and fallback mechanisms from the original profile.tsx implementation.
 * DO NOT modify the authentication patterns or response handling logic.
 */
export class ProfileDataService {
  /**
   * Fetch user achievements from backend
   * Preserves exact error handling and fallback patterns from original implementation
   */
  static async fetchAchievements(session: any): Promise<any[]> {
    try {
      if (!session?.user?.id) {
        console.log('No session user ID available for achievements');
        return [];
      }

      console.log('Fetching achievements from:', '/api/player/profile/achievements');

      const response = await axiosInstance.get('/api/player/profile/achievements');

      console.log('Achievements API response:', response.data);

      const data = response.data as { achievements?: any[] };
      if (data?.achievements) {
        console.log('Setting achievements data:', data.achievements);
        return data.achievements;
      } else {
        console.log('No achievements data found, setting empty array');
        return [];
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
      toast.error('Error', {
        description: 'Failed to load achievements. Please try again.',
      });
      return []; // Set empty array on error
    }
  }

  /**
   * Fetch user profile data from backend
   * Preserves exact response parsing logic from original implementation
   */
  static async fetchProfileData(session: any): Promise<any | null> {
    try {
      if (!session?.user?.id) {
        console.log('No session user ID available');
        return null;
      }

      console.log('Current session:', session);

      console.log('Fetching profile data from:', '/api/player/profile/me');

      const response = await axiosInstance.get('/api/player/profile/me');

      console.log('Profile API response:', response.data);

      const data = response.data;
      if (data) {
        console.log('Setting profile data:', data);
        return data;
      } else {
        console.error('No profile data received');
        return null;
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast.error('Error', {
        description: 'Failed to load profile data. Please try again.',
      });
      return null;
    }
  }

  /**
   * Fetch match history from backend
   * Preserves exact dual fallback strategy from original implementation
   */
  static async fetchMatchHistory(session: any): Promise<any[]> {
    try {
      if (!session?.user?.id) return [];

      console.log('Fetching match history from:', '/api/player/profile/matches');

      const response = await axiosInstance.get('/api/player/profile/matches');

      console.log('Match history data received:', response.data);

      const data = response.data;
      if (data) {
        return Array.isArray(data) ? data : (data.data || []);
      } else {
        console.error('No match history data received');
        return [];
      }
    } catch (error: any) {
      console.error('Error fetching match history:', error);

      // Check for 404 status
      if (error?.response?.status === 404) {
        console.log('No match history found for user (404) - this is normal for new users');
        return [];
      }

      toast.error('Error', {
        description: 'Failed to load match history. Please try again.',
      });
      return [];
    }
  }

  /**
   * Load all profile data with exact error handling from original
   * Preserves the loading state management and toast notifications
   */
  static async loadAllProfileData(
    session: any,
    hasLoadedBefore: boolean
  ): Promise<{
    profileData: any | null;
    achievements: any[];
    matchHistory: any[];
  }> {
    try {
      // Fetch profile data and achievements in parallel
      const [profileData, achievements] = await Promise.all([
        this.fetchProfileData(session),
        this.fetchAchievements(session),
        // Note: fetchMatchHistory is commented out until match system is ready
        // this.fetchMatchHistory(session)
      ]);

      // Show success toast only if this is a refresh (not initial load)
      if (hasLoadedBefore) {
        toast.success('Profile Updated', {
          description: 'Your profile data has been refreshed.',
        });
      }

      return {
        profileData,
        achievements,
        matchHistory: [], // Empty until match system is ready
      };
    } catch (error) {
      console.error('Error loading profile data:', error);
      toast.error('Error', {
        description: 'Failed to load profile data. Please try again.',
      });

      return {
        profileData: null,
        achievements: [],
        matchHistory: [],
      };
    }
  }
}