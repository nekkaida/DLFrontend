/**
 * Type definitions for match-details screen
 */

export interface ParticipantWithDetails {
  userId: string;
  name?: string;
  image?: string;
  role?: string;
  team?: string;
  invitationStatus?: string;
}

export interface FetchedMatchDetails {
  date?: string;
  time?: string;
  location?: string;
  sportType?: string;
  leagueName?: string;
  season?: string;
  division?: string;
  divisionId?: string;
  seasonId?: string;
  courtBooked?: boolean;
  fee?: string;
  feeAmount?: string;
  description?: string;
  duration?: string;
  matchType?: string;
  participants?: any[];
  status?: string;
  isFriendly?: boolean;
}

export interface MatchData {
  createdById: string | null;
  resultSubmittedById: string | null;
  resultSubmittedAt: string | null;
  status: string;
  team1Score: number | null;
  team2Score: number | null;
  isDisputed: boolean;
  matchDate: string | null;
  genderRestriction?: 'MALE' | 'FEMALE' | 'OPEN' | null;
  skillLevels?: string[];
  isWalkover?: boolean;
  walkoverReason?: string;
  walkover?: {
    defaultingPlayerId: string;
    defaultingPlayer?: { id: string; name: string; image?: string };
    winningPlayerId: string;
    winningPlayer?: { id: string; name: string; image?: string };
    walkoverReasonDetail?: string;
  };
}

export interface PartnershipData {
  captainId: string | null;
  partnerId: string | null;
}

export interface AutoApprovalCountdown {
  hours: number;
  minutes: number;
  expired: boolean;
}

export interface PartnerInfo {
  hasPartner: boolean;
  partnerName?: string;
  partnerImage?: string;
  partnerId?: string;
}
