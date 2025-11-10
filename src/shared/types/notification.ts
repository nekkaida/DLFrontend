// Notification types matching backend schema
export type NotificationCategory = 
  | 'DIVISION'
  | 'LEAGUE'
  | 'CHAT'
  | 'MATCH'
  | 'SEASON'
  | 'PAYMENT'
  | 'ADMIN'
  | 'GENERAL';

export type NotificationType = 
  | 'SEASON_REGISTRATION_OPEN'
  | 'SEASON_STARTING_SOON'
  | 'SEASON_STARTED'
  | 'SEASON_ENDING_SOON'
  | 'SEASON_ENDED'
  | 'DIVISION_ASSIGNMENT'
  | 'DIVISION_PROMOTION'
  | 'DIVISION_DEMOTION'
  | 'MATCH_SCHEDULED'
  | 'MATCH_REMINDER'
  | 'MATCH_RESULT_SUBMITTED'
  | 'MATCH_RESULT_DISPUTED'
  | 'MATCH_RESULT_APPROVED'
  | 'PAIR_REQUEST_RECEIVED'
  | 'PAIR_REQUEST_ACCEPTED'
  | 'PAIR_REQUEST_DECLINED'
  | 'PARTNER_ASSIGNED'
  | 'NEW_MESSAGE'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_REMINDER'
  | 'ADMIN_ANNOUNCEMENT'
  | 'TEST_NOTIFICATION';

export interface Notification {
  id: string;
  title?: string;
  message: string;
  category: NotificationCategory;
  type?: NotificationType;
  read: boolean;
  archive: boolean;
  createdAt: string;
  readAt?: string;
  metadata?: Record<string, any>;
}

export interface NotificationFilter {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  archived?: boolean;
  category?: NotificationCategory;
  categories?: NotificationCategory[];
  type?: NotificationType;
  types?: NotificationType[];
}

export interface PaginatedNotifications {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  archived: number;
  byCategory: Record<NotificationCategory, number>;
  byType: Record<NotificationType, number>;
}

export interface CategoryConfig {
  value: NotificationCategory;
  label: string;
  icon: string; // Icon name for React Native
  color: string;
}

export const NOTIFICATION_CATEGORIES: CategoryConfig[] = [
  { value: 'DIVISION', label: 'Division', icon: 'people', color: '#3B82F6' },
  { value: 'LEAGUE', label: 'League', icon: 'trophy', color: '#10B981' },
  { value: 'CHAT', label: 'Chat', icon: 'chatbubble', color: '#8B5CF6' },
  { value: 'MATCH', label: 'Match', icon: 'notifications', color: '#F59E0B' },
  { value: 'SEASON', label: 'Season', icon: 'calendar', color: '#6366F1' },
  { value: 'PAYMENT', label: 'Payment', icon: 'card', color: '#EAB308' },
  { value: 'ADMIN', label: 'Admin', icon: 'shield', color: '#EF4444' },
  { value: 'GENERAL', label: 'General', icon: 'notifications-outline', color: '#6B7280' },
];
