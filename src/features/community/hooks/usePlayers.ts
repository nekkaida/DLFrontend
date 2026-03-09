import { useState, useCallback } from 'react';
import { useSession } from '@/lib/auth-client';
import axiosInstance from '@/lib/endpoints';
import { Player } from '../types';

export const usePlayers = () => {
  const { data: session } = useSession();
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchPlayers = useCallback(async (query: string = '') => {
    try {
      if (!session?.user?.id) {
        console.log('❌ usePlayers: No session user ID');
        return;
      }

      console.log('🔵 usePlayers: Fetching players with query:', query);
      setIsLoading(true);
      const searchParam = query.trim().length >= 2 ? `?q=${encodeURIComponent(query)}` : '';
      const url = `/api/player/search${searchParam}`;
      console.log('🔵 usePlayers: API URL:', url);

      const response = await axiosInstance.get(url);

      if (response.data?.data) {
        const playersData = response.data.data;
        setPlayers(playersData);
      }
    } catch (error) {
      console.error('❌ usePlayers: Error fetching players:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  return {
    players,
    isLoading,
    searchPlayers,
  };
};
