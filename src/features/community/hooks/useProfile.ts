import { useState, useCallback } from 'react';
import { useSession } from '@/lib/auth-client';
import axiosInstance from '@/lib/endpoints';

interface ProfileData {
  image?: string;
  name?: string;
}

export const useProfile = () => {
  const { data: session } = useSession();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      if (!session?.user?.id) {
        return;
      }

      const response = await axiosInstance.get('/api/player/profile/me');

      if (response.data?.data) {
        setProfileData(response.data.data);
      } else if (response.data) {
        setProfileData(response.data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, [session?.user?.id]);

  return {
    profileData,
    fetchProfile,
  };
};
