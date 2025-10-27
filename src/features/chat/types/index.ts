export interface User {
  id: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  timestamp: Date;
  isRead: boolean;
  isDelivered: boolean;
  replyTo?: string;
  metadata?: Record<string, any>;
}

export interface Thread {
  id: string;
  name?: string;
  type: 'direct' | 'group' | 'league' | 'season';
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    leagueId?: string;
    seasonId?: string;
    avatar?: string;
  };
}

export interface ChatState {
  threads: Thread[];
  currentThread: Thread | null;
  messages: Record<string, Message[]>;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface SocketMessage {
  type: 'message' | 'thread_update' | 'user_online' | 'user_offline' | 'typing' | 'read_receipt';
  payload: any;
}