import { useSession } from '@/lib/auth-client';
import { useCallback, useEffect, useState } from 'react';
import { League, LeagueService } from '../services/LeagueService';

export interface UseLeaguesOptions {
  sportType?: 'PADEL' | 'PICKLEBALL' | 'TENNIS';
  autoFetch?: boolean;
}

export interface UseLeaguesReturn {
  leagues: League[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  joinLeague: (leagueId: string) => Promise<boolean>;
}

export function useLeagues(options: UseLeaguesOptions = {}): UseLeaguesReturn {
  const { sportType, autoFetch = true } = options;
  const { data: session } = useSession();
  
  const [leagues, setLeagues] = useState<League[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeagues = useCallback(async () => {
    // console.log('🔍 useLeagues: Starting fetchLeagues');
    // console.log('🔍 useLeagues: Sport type filter:', sportType);
    
    setIsLoading(true);
    setError(null);
    
    try {
      let fetchedLeagues: League[];
      
      if (sportType) {
        fetchedLeagues = await LeagueService.fetchLeaguesBySport(sportType);
      } else {
        fetchedLeagues = await LeagueService.fetchAllLeagues();
      }
      
      // console.log('🔍 useLeagues: Received leagues:', fetchedLeagues.length);
      // console.log('🔍 useLeagues: Leagues data:', fetchedLeagues);
      
      setLeagues(fetchedLeagues);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch leagues';
      console.error('❌ useLeagues: Error fetching leagues:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [sportType]);

  const joinLeague = useCallback(async (leagueId: string): Promise<boolean> => {
    console.warn('useLeagues: joinLeague is deprecated. League membership model has been removed.');
    console.warn('useLeagues: Users should navigate to league details and join specific seasons instead.');
    return false;
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchLeagues();
    }
  }, [fetchLeagues, autoFetch]);

  return {
    leagues,
    isLoading,
    error,
    refetch: fetchLeagues,
    joinLeague,
  };
}
