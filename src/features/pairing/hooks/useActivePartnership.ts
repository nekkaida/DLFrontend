import { useState, useEffect, useCallback } from 'react';
import { authClient } from '@/lib/auth-client';
import { getBackendBaseURL } from '@/config/network';

interface Partnership {
  id: string;
  captainId: string;
  partnerId: string;
  seasonId: string;
  divisionId: string | null;
  pairRating: number | null;
  status: string;
  createdAt: string;
  dissolvedAt: string | null;
  captain: {
    id: string;
    name: string;
    username: string;
    displayUsername: string | null;
    image: string | null;
  };
  partner: {
    id: string;
    name: string;
    username: string;
    displayUsername: string | null;
    image: string | null;
  };
  season: {
    id: string;
    name: string;
    sportType: string;
  };
  division: {
    id: string;
    name: string;
  } | null;
}

interface UseActivePartnershipReturn {
  partnership: Partnership | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage active partnership for a specific season
 * @param seasonId - The season ID to check for active partnership
 * @param userId - Optional user ID (for checking specific user's partnership)
 * @returns Partnership data, loading state, error, and refresh function
 */
export const useActivePartnership = (
  seasonId: string | null,
  userId?: string
): UseActivePartnershipReturn => {
  const [partnership, setPartnership] = useState<Partnership | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPartnership = useCallback(async () => {
    if (!seasonId) {
      setLoading(false);
      setPartnership(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const backendUrl = getBackendBaseURL();
      const response = await authClient.$fetch(
        `${backendUrl}/api/pairing/partnership/active/${seasonId}`,
        {
          method: 'GET',
        }
      );

      const data = (response as any)?.data;

      if (data && data.status === 'ACTIVE') {
        setPartnership(data);
      } else {
        setPartnership(null);
      }
    } catch (err) {
      console.error('Error fetching active partnership:', err);
      setError(err as Error);
      setPartnership(null);
    } finally {
      setLoading(false);
    }
  }, [seasonId]);

  useEffect(() => {
    fetchPartnership();
  }, [fetchPartnership]);

  return {
    partnership,
    loading,
    error,
    refresh: fetchPartnership,
  };
};
