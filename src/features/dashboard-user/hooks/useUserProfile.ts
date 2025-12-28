import { useState, useEffect, useCallback } from 'react';
import { questionnaireAPI } from '@/src/features/questionnaires/api/questionnaireAPI';
import { getBackendBaseURL } from '@/src/config/network';
import { authClient } from '@/src/lib/auth-client';

/**
 * Custom hook to manage user profile data and gender
 *
 * @param userId - The ID of the current user
 * @returns Profile data, user gender, and fetch function
 */
export const useUserProfile = (userId: string | undefined) => {
  const [profileData, setProfileData] = useState<any>(null);
  const [userGender, setUserGender] = useState<string | null | undefined>(undefined);

  // Fetch user profile data from /api/player/profile/me
  const fetchProfileData = useCallback(async () => {
    if (!userId) {
      setProfileData(null);
      return;
    }

    try {
      const backendUrl = getBackendBaseURL();
      const authResponse = await authClient.$fetch(`${backendUrl}/api/player/profile/me`, {
        method: 'GET',
      });
      if (authResponse && (authResponse as any).data && (authResponse as any).data.data) {
        setProfileData((authResponse as any).data.data);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setProfileData(null);
    }
  }, [userId]);

  // Fetch user gender separately (needed for category filtering)
  useEffect(() => {
    const fetchUserGender = async () => {
      if (!userId) {
        // If no userId, explicitly set to null so data fetching can proceed
        setUserGender(null);
        return;
      }

      try {
        const { user } = await questionnaireAPI.getUserProfile(userId);
        setUserGender(user.gender?.toUpperCase() || null);
      } catch (error) {
        console.error('Error fetching user gender:', error);
        // Set to null on error so data fetching can still proceed
        setUserGender(null);
      }
    };

    fetchUserGender();
  }, [userId]);

  // Fetch profile data on mount
  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  return {
    profileData,
    userGender,
    fetchProfileData,
  };
};
