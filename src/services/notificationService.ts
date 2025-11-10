import axiosInstance, { endpoints } from '@/lib/endpoints';
import {
    Notification,
    NotificationCategory,
    NotificationFilter,
    NotificationStats,
    PaginatedNotifications
} from '@/src/shared/types/notification';

export class NotificationService {
  /**
   * Get user notifications with pagination and filtering
   */
  async getUserNotifications(filter: NotificationFilter = {}, userId: string): Promise<PaginatedNotifications> {
    try {
      if (!userId) throw new Error('userId is required');

      const params = new URLSearchParams({ userId }); // <-- Pass userId
      if (filter.page) params.append('page', filter.page.toString());
      if (filter.limit) params.append('limit', filter.limit.toString());
      if (filter.unreadOnly) params.append('unreadOnly', 'true');
      if (filter.archived !== undefined) params.append('archived', filter.archived.toString());
      if (filter.category) params.append('category', filter.category);
      if (filter.categories && filter.categories.length > 0) {
        params.append('categories', JSON.stringify(filter.categories));
      }
      if (filter.type) params.append('type', filter.type);
      if (filter.types && filter.types.length > 0) {
        params.append('types', JSON.stringify(filter.types));
      }

      const response = await axiosInstance.get(`${endpoints.notifications.getAll}?${params.toString()}`);
      const data = response.data.data;

      if (!data) {
        console.error('No data in response:', response.data);
        return {
          notifications: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 1,
            hasMore: false,
          }
        };
      }

      return data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    if (!userId) throw new Error('userId is required');
    try {
      await axiosInstance.put(endpoints.notifications.markRead(notificationId), { userId });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<{ updatedCount: number }> {
    if (!userId) throw new Error('userId is required');
    try {
      const response = await axiosInstance.put(endpoints.notifications.markAllRead, { userId });
      return response.data.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Archive notification
   */
  async archiveNotification(notificationId: string, userId: string): Promise<void> {
    if (!userId) throw new Error('userId is required');
    try {
      await axiosInstance.put(endpoints.notifications.archive(notificationId), { userId });
    } catch (error) {
      console.error('Error archiving notification:', error);
      throw error;
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    if (!userId) throw new Error('userId is required');
    try {
      const response = await axiosInstance.get(`${endpoints.notifications.unreadCount}?userId=${userId}`);
      return response.data.data.unreadCount;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId: string): Promise<NotificationStats> {
    if (!userId) throw new Error('userId is required');
    try {
      const response = await axiosInstance.get(`${endpoints.notifications.stats}?userId=${userId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }

  /**
   * Get notifications by category
   */
  async getNotificationsByCategory(category: NotificationCategory, userId: string, limit: number = 100): Promise<Notification[]> {
    if (!userId) throw new Error('userId is required');
    try {
      const response = await axiosInstance.get(
        `${endpoints.notifications.byCategory(category)}?limit=${limit}&userId=${userId}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Error getting notifications by category:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
