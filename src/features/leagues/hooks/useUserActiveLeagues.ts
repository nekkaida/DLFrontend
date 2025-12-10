import { useSession } from '@/lib/auth-client';
import { useCallback, useEffect, useState } from 'react';
import { LeagueService, UserActiveLeague } from '../services/LeagueService';

export interface UseUserActiveLeaguesOptions {
  sportType?: 'PADEL' | 'PICKLEBALL' | 'TENNIS';
  autoFetch?: boolean;
}

export interface UseUserActiveLeaguesReturn {
  activeLeagues: UserActiveLeague[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasActiveLeagues: boolean;
}

export function useUserActiveLeagues(options: UseUserActiveLeaguesOptions = {}): UseUserActiveLeaguesReturn {
  const { sportType, autoFetch = true } = options;
  const { data: session } = useSession();

  const [activeLeagues, setActiveLeagues] = useState<UserActiveLeague[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveLeagues = useCallback(async () => {
    if (!session?.user?.id) {
      setActiveLeagues([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let fetchedLeagues = await LeagueService.fetchUserActiveLeagues(session.user.id);

      // Filter by sport type if specified
      if (sportType) {
        fetchedLeagues = fetchedLeagues.filter(league => league.sportType === sportType);
      }

      setActiveLeagues(fetchedLeagues);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch active leagues';
      console.error('useUserActiveLeagues: Error:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, sportType]);

  useEffect(() => {
    if (autoFetch && session?.user?.id) {
      fetchActiveLeagues();
    }
  }, [fetchActiveLeagues, autoFetch, session?.user?.id]);

  return {
    activeLeagues,
    isLoading,
    error,
    refetch: fetchActiveLeagues,
    hasActiveLeagues: activeLeagues.length > 0,
  };
}
