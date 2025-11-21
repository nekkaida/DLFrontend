import axiosInstance, { endpoints } from '@/lib/endpoints';
import {
    Notification,
    NotificationCategory,
    NotificationFilter,
    PaginatedNotifications
} from '@/src/shared/types/notification';

export class NotificationService {
  async getUserNotifications(filter: NotificationFilter = {}, userId: string): Promise<PaginatedNotifications> {
    try {
      if (!userId) throw new Error('userId is required');

      const params = new URLSearchParams({ userId });
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

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    if (!userId) throw new Error('userId is required');
    try {
      await axiosInstance.put(endpoints.notifications.markRead(notificationId), { userId });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

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

  // Delete notification
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    if (!userId) throw new Error("userId is required");

    try {
      console.log("🗑️ Deleting notification:", notificationId);
      console.log("🗑️ Delete URL:", endpoints.notifications.delete(notificationId));
      
      const response = await axiosInstance.delete(endpoints.notifications.delete(notificationId));
      
      console.log("✅ Delete response:", response.data);
    } catch (error: any) {
      console.error("❌ Error deleting notification:", error.response?.status, error.message);
      console.error("❌ Error URL:", error.config?.url);
      throw error;
    }
  }
  

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
