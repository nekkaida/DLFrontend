import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { getBackendBaseURL } from '@/src/config/network';

/**
 * Custom hook to fetch all active partnerships for the current user
 * Returns a Map<seasonId, partnership> for fast O(1) lookup by season
 *
 * @param userId - The ID of the current user
 * @returns Object containing partnerships Map and loading state
 *
 * @example
 * const { partnerships, loading } = useUserPartnerships(userId);
 * const hasPartnership = partnerships.has(seasonId);
 * const partnership = partnerships.get(seasonId);
 */
export const useUserPartnerships = (userId: string | undefined) => {
  const [partnerships, setPartnerships] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setPartnerships(new Map());
      setLoading(false);
      return;
    }

    const fetchPartnerships = async () => {
      try {
        const backendUrl = getBackendBaseURL();
        const response = await authClient.$fetch(
          `${backendUrl}/api/pairing/partnerships`,
          { method: 'GET' }
        );

        const data = response?.data?.data || [];
        // Filter for ACTIVE partnerships only and build Map by seasonId
        const map = new Map();
        data.forEach((p: any) => {
          if (p.status === 'ACTIVE') {
            map.set(p.season?.id, p);
          }
        });

        setPartnerships(map);
      } catch (error) {
        console.error('Error fetching partnerships:', error);
        setPartnerships(new Map());
      } finally {
        setLoading(false);
      }
    };

    fetchPartnerships();
  }, [userId]);

  return { partnerships, loading };
};
