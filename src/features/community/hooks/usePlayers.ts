import { useState, useCallback } from 'react';
import { useSession, authClient } from '@/lib/auth-client';
import { getBackendBaseURL } from '@/config/network';
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
      const backendUrl = getBackendBaseURL();
      const searchParam = query.trim().length >= 2 ? `?q=${encodeURIComponent(query)}` : '';
      const url = `${backendUrl}/api/player/search${searchParam}`;
      console.log('🔵 usePlayers: API URL:', url);

      const authResponse = await authClient.$fetch(url, {
        method: 'GET',
      });

      console.log('📦 usePlayers: API response:', authResponse);

      if (authResponse && (authResponse as any).data && (authResponse as any).data.data) {
        const playersData = (authResponse as any).data.data;
        console.log('✅ usePlayers: Players count:', playersData.length);
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
