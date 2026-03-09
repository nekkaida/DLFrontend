import { useState, useEffect } from 'react';
import axiosInstance from '@/lib/endpoints';

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
    console.log('[useUserPartnerships] Hook called with userId:', userId);

    if (!userId) {
      console.log('[useUserPartnerships] No userId, skipping fetch');
      setPartnerships(new Map());
      setLoading(false);
      return;
    }

    const fetchPartnerships = async () => {
      console.log('[useUserPartnerships] Starting fetch for userId:', userId);
      try {
        const response = await axiosInstance.get('/api/pairing/partnerships');

        const data = response.data?.data || [];
        console.log('[useUserPartnerships] Fetched partnerships:', data.length);
        console.log('[useUserPartnerships] First partnership:', data[0]);

        // Filter for ACTIVE and INCOMPLETE partnerships and build Map by seasonId
        const map = new Map();
        data.forEach((p: any) => {
          console.log(`[useUserPartnerships] Partnership status: ${p.status}, seasonId: ${p.season?.id}`);
          if (p.status === 'ACTIVE' || p.status === 'INCOMPLETE') {
            map.set(p.season?.id, p);
            console.log(`[useUserPartnerships] Added partnership for season: ${p.season?.id}`);
          }
        });

        console.log('[useUserPartnerships] Total active/incomplete partnerships:', map.size);
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
