export interface User {
  id: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
  username?: string;
  email?: string;
  lastSeen?: Date;
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  isDelivered: boolean;
  replyTo?: string;
  type?: 'text' | 'match'; // Add message type
  matchData?: { // Add match-specific data
    matchId?: string; // Match ID for API calls
    date: string;
    time: string;
    duration: number;
    numberOfPlayers: string;
    location: string;
    fee: 'FREE' | 'SPLIT';
    description: string;
    sportType: 'PICKLEBALL' | 'TENNIS' | 'PADEL';
    leagueName: string;
    courtBooked?: boolean;
    notes?: string; // Optional notes
    participants?: Array<{ // Match participants
      userId: string;
      role?: string;
      team?: string;
      invitationStatus?: string;
    }>;
  };
  metadata?: {
    isEdited?: boolean;
    isDeleted?: boolean;
    sender?: any;
    readBy?: any[];
    updatedAt?: string;
    [key: string]: any;
  };
}

export interface Thread {
  id: string;
  name?: string;
  type: 'direct' | 'group' | 'division';
  sportType?: 'PICKLEBALL' | 'TENNIS' | 'PADEL' | null;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    avatarUrl?: string;
    divisionId?: string;
    seasonId?: string;
    isGroup?: boolean;
    messageCount?: number;
    [key: string]: any;
  };
}

export interface ChatState {
  threads: Thread[];
  currentThread: Thread | null;
  messages: Record<string, Message[]>;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  replyingTo: Message | null;
}