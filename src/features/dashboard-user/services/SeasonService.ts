import axiosInstance, { endpoints } from '@/lib/endpoints';

export interface SeasonUser {
  id: string;
  name?: string;
  image?: string;
}

export interface SeasonMembership {
  id: string;
  userId: string;
  seasonId: string;
  divisionId?: string;
  status: string;
  joinedAt: Date;
  withdrawalReason?: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  user?: SeasonUser;
}

export interface Season {
  id: string;
  name: string;
  startDate?: string | Date;
  endDate?: string | Date;
  regiDeadline?: string | Date;
  entryFee: number | string;
  description?: string;
  registeredUserCount: number;
  
  // Bools
  status: 'UPCOMING' | 'ACTIVE' | 'FINISHED' | 'CANCELLED';
  isActive: boolean;
  paymentRequired: boolean;
  promoCodeSupported: boolean;
  withdrawalEnabled: boolean;
  
  // Relations
  memberships?: SeasonMembership[];
  categories: Category[];
  leagues: League[];
  waitlistId?: string;
  _count?: {
    memberships: number;
  };
  
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Category {
  id: string;
  name: string;
  leagueId?: string;
  genderRestriction: string;
  matchFormat?: string;
  maxPlayers?: number;
  maxTeams?: number;
  game_type?: string;
  gender_category?: string;
  isActive: boolean;
}

export interface League {
  id: string;
  name: string;
  sportType: string;
  gameType: string;
  status: string;
}

export interface SeasonResponse {
  success: boolean;
  data: Season[];
  message: string;
}

export class SeasonService {
  /**
   * Fetch all seasons
   */
  static async fetchAllSeasons(): Promise<Season[]> {
    try {
      const response = await axiosInstance.get(endpoints.season.getAll);

      if (response && response.data) {
        const apiResponse = response.data as any;
        
        // Handle direct array response (from backend controller)
        if (Array.isArray(apiResponse)) {
          // console.log('✅ SeasonService: Direct array response found:', apiResponse.length);
          return apiResponse as Season[];
        }
        
        // Handle success response with data array
        if (apiResponse.success && apiResponse.data && Array.isArray(apiResponse.data.data)) {
          console.log('✅ SeasonService: Success response found:', apiResponse.data.data.length);
          return apiResponse.data.data as Season[];
        }
        
        // Handle wrapped response structure: { data: [...], error: null }
        if (apiResponse.data && Array.isArray(apiResponse.data)) {
          return apiResponse.data as Season[];
        }
        
        // Generic fallback: if there's a data property that's an array, use it
        if (apiResponse.data && Array.isArray(apiResponse.data)) {
          return apiResponse.data as Season[];
        }
      }

      console.warn('SeasonService: No seasons found or invalid response');
      // console.warn('SeasonService: Full response object:', JSON.stringify(response, null, 2));
      return [];
    } catch (error) {
      console.error('SeasonService: Error fetching seasons:', error);
      return [];
    }
  }

  /**
   * Fetch seasons for a specific category
   */
static async fetchSeasonsByCategory(categoryId: string): Promise<Season[]> {
  try {
    const allSeasons = await this.fetchAllSeasons();

    // Filter seasons that include this category
    const filteredSeasons = allSeasons.filter(season =>
      season.categories?.some(cat => cat.id === categoryId)
    );

    return filteredSeasons;
  } catch (error) {
    console.error('SeasonService: Error fetching seasons by category:', error);
    return [];
  }
}

  /**
   * Fetch seasons for a specific league - Updated to use new backend endpoint
   */
  static async fetchSeasonsByLeague(leagueId: string): Promise<Season[]> {
    try {
      const response = await axiosInstance.get(`/api/league/${leagueId}/seasons`);

      if (response && response.data) {
        const apiResponse = response.data as any;
        
        // Handle success response with data array
        if (apiResponse.success && apiResponse.data && apiResponse.data.data) {
          const seasons = apiResponse.data.data as Season[];
          console.log('✅ SeasonService: Successfully fetched seasons for league:', seasons.length);
          return seasons;
        }
        
        // Handle direct data array response
        if (apiResponse.data && Array.isArray(apiResponse.data)) {
          const seasons = apiResponse.data as Season[];
          return seasons;
        }
      }

      console.warn('SeasonService: No seasons found for league:', leagueId);
      return [];
    } catch (error) {
      console.error('SeasonService: Error fetching seasons by league:', error);
      return [];
    }
  }

  //Register Player to a season 
static async registerForSeason(seasonId: string, userId?: string, payLater: boolean = false): Promise<boolean> {
  try {
    console.log('SeasonService: Registering for season:', seasonId, 'payLater:', payLater);

    const body: any = {};
    if (userId) body.userId = userId; // optional if backend reads from auth token
    body.seasonId = seasonId;
    if (payLater) body.payLater = true;

    const response = await axiosInstance.post('/api/season/player/register', body);

    // console.log('SeasonService: Registration response:', JSON.stringify(response.data, null, 2));

    const apiResponse = response.data as any;
    
    // Check for singles registration response (has membership)
    let membership = null;
    if (apiResponse?.data?.data?.membership) {
      membership = apiResponse.data.data.membership;
    } else if (apiResponse?.data?.membership) {
      membership = apiResponse.data.membership;
    } else if (apiResponse?.membership) {
      membership = apiResponse.membership;
    }

    // Check for doubles registration response (has partnership and memberships)
    let partnership = null;
    let memberships = null;
    if (apiResponse?.data?.data?.partnership || apiResponse?.data?.data?.memberships) {
      partnership = apiResponse.data.data.partnership;
      memberships = apiResponse.data.data.memberships;
    } else if (apiResponse?.data?.partnership || apiResponse?.data?.memberships) {
      partnership = apiResponse.data.partnership;
      memberships = apiResponse.data.memberships;
    } else if (apiResponse?.partnership || apiResponse?.memberships) {
      partnership = apiResponse.partnership;
      memberships = apiResponse.memberships;
    }

    // Success if we have either membership (singles) or partnership/memberships (doubles)
    if (membership || (partnership && memberships)) {
      console.log('SeasonService: Registration successful for season:', seasonId);
      return true;
    }

    console.warn('SeasonService: Registration response unexpected:', response);
    return false;
  } catch (error) {
    console.error('SeasonService: Error registering for season:', error);
    throw error;
  }
}

  /**
   * Get seasons grouped by status
   */
  static groupSeasonsByStatus(seasons: Season[]): {
    active: Season[];
    upcoming: Season[];
    finished: Season[];
  } {
    const active: Season[] = [];
    const upcoming: Season[] = [];
    const finished: Season[] = [];

    seasons.forEach(season => {
      switch (season.status) {
        case 'ACTIVE':
          active.push(season);
          break;
        case 'UPCOMING':
          upcoming.push(season);
          break;
        case 'FINISHED':
        case 'CANCELLED':
          finished.push(season);
          break;
      }
    });

    return { active, upcoming, finished };
  }

  /**
   * Format date for display
   */
  static formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('SeasonService: Error formatting date:', error);
      return dateString;
    }
  }

  /**
   * Format date range for display
   */
  static formatDateRange(startDate: string, endDate: string): string {
    const start = this.formatDate(startDate);
    const end = this.formatDate(endDate);
    return `${start} – ${end}`;
  }

  /**
   * Get button text based on season status
   */
  static getButtonText(status: Season['status']): string {
    switch (status) {
      case 'ACTIVE':
        return 'Register';
      case 'UPCOMING':
        return 'Join Waitlist';
      case 'FINISHED':
      case 'CANCELLED':
        return 'View Standings';
      default:
        return 'View Details';
    }
  }

  /**
   * Get button color based on season status
   */
  static getButtonColor(status: Season['status']): string {
    switch (status) {
      case 'ACTIVE':
        return '#A04DFE';
      case 'UPCOMING':
        return '#000000';
      case 'FINISHED':
      case 'CANCELLED':
        return '#B2B2B2';
      default:
        return '#6B7280';
    }
  }

  /**
   * Get season badge emoji based on status
   */
  static getSeasonBadge(status: Season['status'], seasonName: string): string {
    switch (status) {
      case 'ACTIVE':
        return '🏆';
      case 'UPCOMING':
        return '🌱';
      case 'FINISHED':
        return '🍂';
      case 'CANCELLED':
        return '❌';
      default:
        return '📅';
    }
  }

  /**
   * Check if registration is still open
   */
  static isRegistrationOpen(season: Season): boolean {
    if (season.status !== 'ACTIVE') return false;
    
    if (season.regiDeadline) {
      const deadline = new Date(season.regiDeadline);
      const now = new Date();
      return now <= deadline;
    }
    
    return true;
  }
}
