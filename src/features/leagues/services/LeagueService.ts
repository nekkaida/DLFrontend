import { authClient } from '@/lib/auth-client';
import { getBackendBaseURL, logNetworkConfig } from '@/src/config/network';

export interface League {
  id: string;
  name: string;
  location?: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'UPCOMING' | 'ONGOING' | 'FINISHED' | 'CANCELLED';
  sportType: 'PADDLE' | 'PICKLEBALL' | 'TENNIS';
  joinType?: 'OPEN' | 'INVITE_ONLY' | 'MANUAL';
  gameType: 'SINGLES' | 'DOUBLES';
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  seasonCount?: number;
  categoryCount?: number;
  categories?: Array<{
    id: string;
    name: string;
    genderRestriction?: string;
    game_type?: string;
    gender_category?: string;
  }>;
  memberships?: Array<{
    id: string;
    userId: string;
    leagueId: string;
    joinedAt: string;
    user: {
      id: string;
      name: string;
      image?: string;
    };
  }>;
  _count?: {
    memberships: number;
    seasons: number;
  };
}

export interface LeagueResponse {
  success: boolean;
  statusCode: number;
  data: {
    leagues: League[];
  };
  message: string;
}

export class LeagueService {
  // fetch all leagues from the backend
  static async fetchAllLeagues(): Promise<League[]> {
    try {
      // Log network configuration for debugging
      logNetworkConfig();
      
      const backendUrl = getBackendBaseURL();
      console.log('🔍 LeagueService: Starting fetchAllLeagues');
      console.log('🔍 LeagueService: Backend URL:', backendUrl);
      console.log('🔍 LeagueService: Full API URL:', `${backendUrl}/api/league`);

      // try with regular fetch first to debug
      console.log('🔍 LeagueService: Testing with regular fetch...');
      const regularFetchResponse = await fetch(`${backendUrl}/api/league`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('🔍 LeagueService: Regular fetch response status:', regularFetchResponse.status);
      console.log('🔍 LeagueService: Regular fetch response headers:', Object.fromEntries(regularFetchResponse.headers.entries()));
      
      const regularFetchData = await regularFetchResponse.json();
      console.log('🔍 LeagueService: Regular fetch data:', regularFetchData);

      // use regular fetch data since it works
      if (regularFetchData && regularFetchData.success && regularFetchData.data && regularFetchData.data.leagues) {
        console.log('✅ LeagueService: Successfully found leagues via regular fetch:', regularFetchData.data.leagues.length);
        console.log('✅ LeagueService: Leagues data:', regularFetchData.data.leagues);
        return regularFetchData.data.leagues;
      }

      // Check auth client cookies
      const authCookies = authClient.getCookie();
      console.log('🔍 LeagueService: Auth client cookies:', authCookies);

      const response = await authClient.$fetch(`${backendUrl}/api/league`, {
        method: 'GET',
      });

      console.log('🔍 LeagueService: Raw API response:', response);
      console.log('🔍 LeagueService: Response type:', typeof response);
      console.log('🔍 LeagueService: Response keys:', response ? Object.keys(response) : 'null');

      // handle the ApiResponse structure from backend
      if (response && typeof response === 'object') {
        const apiResponse = response as any;
        console.log('🔍 LeagueService: API Response structure:', {
          success: apiResponse.success,
          status: apiResponse.status,
          hasData: !!apiResponse.data,
          dataKeys: apiResponse.data ? Object.keys(apiResponse.data) : 'no data',
          message: apiResponse.message
        });

        if (apiResponse.success && apiResponse.data && apiResponse.data.leagues) {
          console.log('✅ LeagueService: Successfully found leagues:', apiResponse.data.leagues.length);
          console.log('✅ LeagueService: Leagues data:', apiResponse.data.leagues);
          return apiResponse.data.leagues;
        } else {
          console.log('❌ LeagueService: Response structure issue:', {
            success: apiResponse.success,
            hasData: !!apiResponse.data,
            hasLeagues: !!(apiResponse.data && apiResponse.data.leagues),
            dataContent: apiResponse.data
          });
        }
      } else {
        console.log('❌ LeagueService: Response is not an object or is null');
      }
      
      console.error('❌ LeagueService: No leagues data received from API');
      return [];
    } catch (error) {
      console.error('❌ LeagueService: Error fetching leagues:', error);
      console.error('❌ LeagueService: Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      return [];
    }
  }

  // fetch leagues filtered by sport type
  static async fetchLeaguesBySport(sportType: 'PADDLE' | 'PICKLEBALL' | 'TENNIS'): Promise<League[]> {
    try {
      const allLeagues = await this.fetchAllLeagues();
      return allLeagues.filter(league => league.sportType === sportType);
    } catch (error) {
      console.error('LeagueService: Error fetching leagues by sport:', error);
      return [];
    }
  }

  // fetch a specific league by ID
  static async fetchLeagueById(leagueId: string): Promise<League | null> {
    try {
      const backendUrl = getBackendBaseURL();
      console.log('LeagueService: Fetching league by ID from:', `${backendUrl}/api/league/${leagueId}`);

      const response = await authClient.$fetch(`${backendUrl}/api/league/${leagueId}`, {
        method: 'GET',
      });

      console.log('LeagueService: League by ID API response:', response);

      // handle the apiResponse structure from backend
      if (response && typeof response === 'object') {
        const apiResponse = response as any;
        
        // Handle authClient.$fetch wrapped response structure
        if (apiResponse.data && apiResponse.data.success && apiResponse.data.data && apiResponse.data.data.league) {
          console.log('LeagueService: Setting league data (wrapped):', apiResponse.data.data.league);
          return apiResponse.data.data.league as League;
        }
        
        // Handle direct API response structure
        if (apiResponse.success && apiResponse.data && apiResponse.data.league) {
          console.log('LeagueService: Setting league data (direct):', apiResponse.data.league);
          return apiResponse.data.league as League;
        }
      }
      
      console.error('LeagueService: No league data received from API');
      return null;
    } catch (error) {
      console.error('LeagueService: Error fetching league by ID:', error);
      return null;
    }
  }

  // join a league
  static async joinLeague(leagueId: string, userId: string): Promise<boolean> {
    try {
      const backendUrl = getBackendBaseURL();
      console.log('LeagueService: Joining league at:', `${backendUrl}/api/league/join`);

      const response = await authClient.$fetch(`${backendUrl}/api/league/join`, {
        method: 'POST',
        body: {
          leagueId: leagueId,
          userId: userId
        }
      });

      console.log('LeagueService: Join league API response:', response);

      // handle the apiResponse structure from backend
      if (response && typeof response === 'object') {
        const apiResponse = response as any;
        
        console.log('LeagueService: Debug - apiResponse.success:', apiResponse.success);
        console.log('LeagueService: Debug - apiResponse.data:', apiResponse.data);
        console.log('LeagueService: Debug - apiResponse.data?.message:', apiResponse.data?.message);
        console.log('LeagueService: Debug - apiResponse.data?.membership:', apiResponse.data?.membership);
        console.log('LeagueService: Debug - apiResponse.message:', apiResponse.message);
        console.log('LeagueService: Debug - apiResponse.error:', apiResponse.error);
        
        // check for success indicators in the response
        if (apiResponse.success || 
            (apiResponse.data?.message?.includes('Successfully joined')) ||
            (apiResponse.data?.membership && apiResponse.data !== null) ||
            (apiResponse.message?.includes('Successfully joined'))) {
          console.log('LeagueService: Successfully joined league');
          return true;
        }
        
        // handle case where user is already a member
        if (apiResponse.error?.status === 409 && 
            apiResponse.error?.message?.includes('already joined')) {
          console.log('LeagueService: User is already a member of this league');
          return true; // treat as success since user is already in the league
        }
      }
      
      console.error('LeagueService: Failed to join league');
      return false;
    } catch (error) {
      console.error('LeagueService: Error joining league:', error);
      return false;
    }
  }
}
