/**
 * ProfileTypes - Extended type definitions for profile functionality
 *
 * These types extend the existing types in the profile feature and add
 * new types needed for the refactored components.
 */

// Re-export existing types for convenience
export type { GameData, UserData, DropdownModalProps, WinRateCircleProps, MatchDetailsModalProps, EloProgressGraphProps, LeagueStatsProps } from '../types';

/**
 * Profile data structure from API
 */
export interface ProfileData {
  id: string;
  name: string;
  username?: string;
  displayUsername?: string;
  email: string;
  image?: string;
  bio?: string;
  area?: string;
  gender?: string;
  phoneNumber?: string;
  status: string;
  lastLogin?: Date;
  registeredDate: Date;
  skillRatings?: SkillRatings;
  recentMatches?: Match[];
  totalMatches?: number;
}

/**
 * Skill ratings structure
 */
export interface SkillRatings {
  [sport: string]: {
    singles?: number;
    doubles?: number;
    rating: number;
    confidence: string;
    rd: number;
    lastUpdated?: Date | null;
  };
}

/**
 * Match data structure
 */
export interface Match {
  id: string;
  sport: string;
  date: Date;
  opponent: {
    name: string;
    username: string;
    image?: string;
  };
  playerScore: number;
  opponentScore: number;
  outcome: 'win' | 'loss' | 'draw';
  location?: string;
}

/**
 * Achievement data structure
 */
export interface Achievement {
  id: string;
  title: string;
  description?: string;
  icon: string;
  category: string;
  points: number;
  unlockedAt: Date;
  isCompleted: boolean;
}

/**
 * Profile loading state
 */
export interface ProfileLoadingState {
  isLoading: boolean;
  hasLoadedBefore: boolean;
  error?: string;
}

/**
 * Profile data service response
 */
export interface ProfileDataResponse {
  profileData: ProfileData | null;
  achievements: Achievement[];
  matchHistory: Match[];
}

/**
 * Sport color mapping
 */
export type SportColors = {
  [K in 'Tennis' | 'Pickleball' | 'Padel']: string;
};

/**
 * Game type options
 */
export type GameType = 'Singles' | 'Doubles';

/**
 * Profile section types
 */
export type ProfileSection = 'header' | 'stats' | 'dmr' | 'league_stats' | 'achievements' | 'matches';

/**
 * Rating display configuration
 */
export interface RatingConfig {
  sport: string;
  type: GameType;
  value: number;
}

/**
 * Profile handlers interface
 */
export interface ProfileHandlers {
  handleSettingsPress: () => void;
  handleEditPress: () => void;
  handleGameTypeSelect: (gameType: string) => void;
  handleLeagueSelect: (league: string) => void;
  handleTabPress: (sport: string) => void;
  handleGamePointPress: (game: GameData) => void;
  handleModalClose: () => void;
  handleMatchHistoryPress: () => void;
}

/**
 * Profile state interface
 */
export interface ProfileState {
  activeTab: string;
  selectedGame: GameData | null;
  modalVisible: boolean;
  selectedGameType: string;
}

/**
 * Profile component props (for extracted components)
 */
export interface ProfileHeaderProps {
  userData: UserData;
  onEditPress: () => void;
  onSettingsPress: () => void;
}

export interface ProfileStatsProps {
  userData: UserData;
  winRate: number;
  gameTypeOptions: string[];
  selectedGameType: string;
  onGameTypeSelect: (gameType: string) => void;
}

export interface ProfileDMRProps {
  userData: UserData;
  activeTab: string;
  gameTypeOptions: string[];
  selectedGameType: string;
  onGameTypeSelect: (gameType: string) => void;
  getRatingForType: (sport: string, type: GameType) => number;
  mockEloData: GameData[];
  onGamePointPress: (game: GameData) => void;
}

export interface ProfileAchievementsProps {
  achievements: Achievement[];
}

export interface ProfileSportTabsProps {
  sports: string[];
  activeTab: string;
  onTabPress: (sport: string) => void;
}