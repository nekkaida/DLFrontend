import axiosInstance from '@/lib/endpoints';

export interface League {
  id: string;
  name: string;
  location?: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'UPCOMING' | 'ONGOING' | 'FINISHED' | 'CANCELLED';
  sportType: 'PADEL' | 'PICKLEBALL' | 'TENNIS';
  joinType?: 'OPEN' | 'INVITE_ONLY' | 'MANUAL';
  gameType: 'SINGLES' | 'DOUBLES';
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  seasonCount?: number;
  categoryCount?: number;
  totalSeasonMemberships?: number;
  categories?: Array<{
    id: string;
    name: string;
    genderRestriction?: string;
    game_type?: string;
    gender_category?: string;
  }>;
  seasons?: Array<{
    id: string;
    name: string;
    status?: string;
  }>;
  memberships?: Array<{
    id: string;
    userId: string;
    seasonId: string;
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
      console.log('🔍 LeagueService: Fetching all leagues...');
      
      const response = await axiosInstance.get('/api/league');

      if (response && response.data) {
        const apiResponse = response.data as any;

        // Handle success response with leagues data
        if (apiResponse.success && apiResponse.data && apiResponse.data.leagues) {
          console.log('✅ LeagueService: Leagues data fetched:', apiResponse.data.leagues.length);
          return apiResponse.data.leagues;
        }
        
        // Handle direct leagues array response
        if (Array.isArray(apiResponse)) {
          console.log('✅ LeagueService: Direct leagues array found:', apiResponse.length);
          return apiResponse;
        }
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
  static async fetchLeaguesBySport(sportType: 'PADEL' | 'PICKLEBALL' | 'TENNIS'): Promise<League[]> {
    try {
      const allLeagues = await this.fetchAllLeagues();
      return allLeagues.filter(league => league.sportType === sportType);
    } catch (error) {
      console.error('LeagueService: Error fetching leagues by sport:', error);
      return [];
    }
  }

  // fetch seasons for a specific league
  static async fetchLeagueSeasons(leagueId: string): Promise<any[]> {
    try {
      console.log('LeagueService: Fetching seasons for league:', leagueId);

      const response = await axiosInstance.get(`/api/league/${leagueId}/seasons`);

      console.log('LeagueService: League seasons API response:', response.data);

      if (response && response.data) {
        const apiResponse = response.data as any;
        
        // Handle success response with seasons data
        if (apiResponse.success && apiResponse.data && apiResponse.data.data) {
          const seasons = apiResponse.data.data as any[];
          console.log('✅ LeagueService: Successfully fetched league seasons:', seasons.length);
          return seasons;
        }
        
        // Handle direct seasons array response
        if (Array.isArray(apiResponse)) {
          console.log('✅ LeagueService: Direct seasons array found:', apiResponse.length);
          return apiResponse;
        }
      }
      
      console.error('LeagueService: No seasons data received from API');
      return [];
    } catch (error) {
      console.error('LeagueService: Error fetching league seasons:', error);
      return [];
    }
  }

  // fetch a specific league by ID
  static async fetchLeagueById(leagueId: string): Promise<League | null> {
    try {
      console.log('LeagueService: Fetching league by ID:', leagueId);

      const response = await axiosInstance.get(`/api/league/${leagueId}`);

      console.log('LeagueService: League by ID API response:', response.data);

      if (response && response.data) {
        const apiResponse = response.data as any;
        
        // Handle success response with league data
        if (apiResponse.success && apiResponse.data && apiResponse.data.league) {
          const league = apiResponse.data.league as League;
          console.log('✅ LeagueService: Successfully fetched league:', league.name);
          return league;
        }
        
        // Handle direct league object response
        if (apiResponse.id && apiResponse.name) {
          console.log('✅ LeagueService: Direct league object found:', apiResponse.name);
          return apiResponse as League;
        }
      }
      
      console.error('LeagueService: No league data received from API');
      return null;
    } catch (error) {
      console.error('LeagueService: Error fetching league by ID:', error);
      return null;
    }
  }

  // Note: League membership has been removed from the backend architecture.
  // Users now join seasons directly, not leagues.
  // To join a league, navigate to the league details page and select a season to join.
  
  static async joinLeague(leagueId: string, userId: string): Promise<boolean> {
    console.warn('LeagueService: joinLeague is deprecated. League membership model has been removed.');
    console.warn('LeagueService: Users should join seasons directly instead.');
    console.warn('LeagueService: Please navigate to league details and join a specific season.');
    return false;
  }

  // Fetch user's active leagues (leagues where user has season memberships)
  static async fetchUserActiveLeagues(userId: string): Promise<UserActiveLeague[]> {
    try {
      const response = await axiosInstance.get(`/api/player/${userId}/seasons`);

      if (response && response.data) {
        const apiResponse = response.data as any;

        // Handle axios response structure
        let seasons: any[] = [];
        if (apiResponse.success && apiResponse.data?.seasons) {
          seasons = apiResponse.data.seasons;
        } else if (apiResponse.data?.seasons) {
          seasons = apiResponse.data.seasons;
        } else if (Array.isArray(apiResponse)) {
          seasons = apiResponse;
        }

        // Extract unique leagues from seasons where user has active membership
        const leaguesMap = new Map<string, UserActiveLeague>();

        for (const season of seasons) {
          // Only include ACTIVE seasons
          if (season.status !== 'ACTIVE') continue;

          // Each season can have multiple leagues (many-to-many)
          const leaguesList = season.leagues || [];
          for (const league of leaguesList) {
            if (!leaguesMap.has(league.id)) {
              // Extract category data from the season
              const categories: UserActiveLeague['categories'] = [];
              if (season.category) {
                categories.push({
                  id: season.category.id,
                  name: season.category.name,
                  genderRestriction: season.category.genderRestriction || season.category.gender_category,
                  game_type: season.category.game_type || season.category.gameType,
                });
              }

              leaguesMap.set(league.id, {
                id: league.id,
                name: league.name,
                sportType: league.sportType,
                location: league.location,
                status: league.status,
                season: {
                  id: season.id,
                  name: season.name,
                  status: season.status,
                },
                membership: season.membership,
                totalSeasonMemberships: season._count?.memberships || season.registeredUserCount || 0,
                memberships: season.memberships,
                categories,
              });
            }
          }
        }

        return Array.from(leaguesMap.values());
      }

      return [];
    } catch (error) {
      console.error('LeagueService: Error fetching user active leagues:', error);
      return [];
    }
  }
}

// Type for user's active league with season info
export interface UserActiveLeague {
  id: string;
  name: string;
  sportType: string;
  location?: string;
  status: string;
  season: {
    id: string;
    name: string;
    status: string;
  };
  membership?: {
    id: string;
    joinedAt: string;
    status: string;
    paymentStatus: string;
    division?: {
      id: string;
      name: string;
    };
  };
  totalSeasonMemberships?: number;
  memberships?: Array<{
    id: string;
    userId: string;
    user?: {
      id: string;
      name: string;
      image?: string;
    };
  }>;
  categories?: Array<{
    id: string;
    name: string | null;
    genderRestriction?: string;
    game_type?: string;
  }>;
}
