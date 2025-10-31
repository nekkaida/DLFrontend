import { useState, useCallback } from 'react';
import { useSession, authClient } from '@/lib/auth-client';
import { getBackendBaseURL } from '@/config/network';

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

      const backendUrl = getBackendBaseURL();
      const authResponse = await authClient.$fetch(`${backendUrl}/api/player/profile/me`, {
        method: 'GET',
      });

      if (authResponse && (authResponse as any).data && (authResponse as any).data.data) {
        setProfileData((authResponse as any).data.data);
      } else if (authResponse && (authResponse as any).data) {
        setProfileData((authResponse as any).data);
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
