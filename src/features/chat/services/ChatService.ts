import { getBackendBaseURL } from '@/config/network'; // Remove the /src/ part
import { authClient } from '@/lib/auth-client';
import { Message, Thread, User } from '../types';

export class ChatService {
  static async getThreads(): Promise<Thread[]> {
    console.log('ChatService: getThreads called');
    try {
      // For now, just return mock data directly
      console.log('ChatService: Returning mock threads');
      return this.getMockThreads();
    } catch (error) {
      console.error('Error fetching threads:', error);
      return this.getMockThreads();
    }
  }

  static async getMessages(threadId: string, page: number = 1, limit: number = 50): Promise<Message[]> {
    try {
      const backendUrl = getBackendBaseURL();
      const response = await authClient.$fetch(`${backendUrl}/api/chat/threads/${threadId}/messages`, {
        method: 'GET',
        query: { 
          page: page.toString(), 
          limit: limit.toString() 
        },
      });
      
      return response?.data || response || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      // Return mock data for development
      if (__DEV__) {
        return this.getMockMessages(threadId);
      }
      throw error;
    }
  }

  static async sendMessage(threadId: string, content: string, messageType: string = 'text'): Promise<Message> {
    try {
      const backendUrl = getBackendBaseURL();
      const response = await authClient.$fetch(`${backendUrl}/api/chat/threads/${threadId}/messages`, {
        method: 'POST',
        body: { 
          content, 
          messageType,
          timestamp: new Date().toISOString()
        },
      });
      
      return response?.data || response;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  static async createThread(participants: string[], type: string, name?: string, metadata?: Record<string, any>): Promise<Thread> {
    try {
      const backendUrl = getBackendBaseURL();
      const response = await authClient.$fetch(`${backendUrl}/api/chat/threads`, {
        method: 'POST',
        body: { 
          participants, 
          type, 
          name,
          metadata
        },
      });
      
      return response?.data || response;
    } catch (error) {
      console.error('Error creating thread:', error);
      throw error;
    }
  }

  static async getThread(threadId: string): Promise<Thread> {
    try {
      const backendUrl = getBackendBaseURL();
      const response = await authClient.$fetch(`${backendUrl}/api/chat/threads/${threadId}`, {
        method: 'GET',
      });
      
      return response?.data || response;
    } catch (error) {
      console.error('Error fetching thread:', error);
      throw error;
    }
  }

  static async markMessagesAsRead(threadId: string, messageIds: string[]): Promise<void> {
    try {
      const backendUrl = getBackendBaseURL();
      await authClient.$fetch(`${backendUrl}/api/chat/threads/${threadId}/read`, {
        method: 'POST',
        body: { messageIds },
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  static async searchUsers(query: string, limit: number = 20): Promise<User[]> {
    try {
      const backendUrl = getBackendBaseURL();
      const response = await authClient.$fetch(`${backendUrl}/api/users/search`, {
        method: 'GET',
        query: { 
          q: query,
          limit: limit.toString()
        },
      });
      
      return response?.data || response || [];
    } catch (error) {
      console.error('Error searching users:', error);
      if (__DEV__) {
        return this.getMockUsers(query);
      }
      throw error;
    }
  }

  static async getUsersInLeague(leagueId: string): Promise<User[]> {
    try {
      const backendUrl = getBackendBaseURL();
      const response = await authClient.$fetch(`${backendUrl}/api/leagues/${leagueId}/users`, {
        method: 'GET',
      });
      
      return response?.data || response || [];
    } catch (error) {
      console.error('Error fetching league users:', error);
      throw error;
    }
  }

  static async getUsersInSeason(seasonId: string): Promise<User[]> {
    try {
      const backendUrl = getBackendBaseURL();
      const response = await authClient.$fetch(`${backendUrl}/api/seasons/${seasonId}/users`, {
        method: 'GET',
      });
      
      return response?.data || response || [];
    } catch (error) {
      console.error('Error fetching season users:', error);
      throw error;
    }
  }

  static async deleteThread(threadId: string): Promise<void> {
    try {
      const backendUrl = getBackendBaseURL();
      await authClient.$fetch(`${backendUrl}/api/chat/threads/${threadId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting thread:', error);
      throw error;
    }
  }

  static async updateThread(threadId: string, updates: Partial<Thread>): Promise<Thread> {
    try {
      const backendUrl = getBackendBaseURL();
      const response = await authClient.$fetch(`${backendUrl}/api/chat/threads/${threadId}`, {
        method: 'PATCH',
        body: updates,
      });
      
      return response?.data || response;
    } catch (error) {
      console.error('Error updating thread:', error);
      throw error;
    }
  }

  // Mock data methods for development
  private static getMockThreads(): Thread[] {
    console.log('ChatService: Creating mock threads');
    return [
      {
        id: '1',
        name: 'General Chat',
        type: 'group',
        participants: [
          { id: '1', name: 'John Doe', isOnline: true },
          { id: '2', name: 'Jane Smith', isOnline: false },
        ],
        lastMessage: {
          id: 'msg1',
          threadId: '1',
          senderId: '1',
          content: 'Hey everyone! Ready for tomorrow\'s match?',
          messageType: 'text',
          timestamp: new Date(Date.now() - 3600000),
          isRead: false,
          isDelivered: true,
        },
        unreadCount: 2,
        isActive: true,
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(Date.now() - 3600000),
      },
      {
        id: '2',
        name: 'PJ League - Division A',
        type: 'league',
        participants: [
          { id: '1', name: 'John Doe', isOnline: true },
          { id: '3', name: 'Mike Johnson', isOnline: true },
          { id: '4', name: 'Sarah Wilson', isOnline: false },
        ],
        lastMessage: {
          id: 'msg2',
          threadId: '2',
          senderId: '3',
          content: 'Good game today! See you next week.',
          messageType: 'text',
          timestamp: new Date(Date.now() - 7200000),
          isRead: true,
          isDelivered: true,
        },
        unreadCount: 0,
        isActive: true,
        createdAt: new Date(Date.now() - 172800000),
        updatedAt: new Date(Date.now() - 7200000),
        metadata: {
          leagueId: 'league_1',
        },
      },
      {
        id: '3',
        name: 'Tennis Club',
        type: 'group',
        participants: [
          { id: '1', name: 'John Doe', isOnline: true },
          { id: '5', name: 'Alex Chen', isOnline: true },
          { id: '6', name: 'Maria Garcia', isOnline: false },
        ],
        lastMessage: {
          id: 'msg3',
          threadId: '3',
          senderId: '5',
          content: 'Who\'s up for a doubles match this weekend?',
          messageType: 'text',
          timestamp: new Date(Date.now() - 1800000),
          isRead: false,
          isDelivered: true,
        },
        unreadCount: 1,
        isActive: true,
        createdAt: new Date(Date.now() - 259200000),
        updatedAt: new Date(Date.now() - 1800000),
      },
      {
        id: '4',
        name: 'Coaching Tips',
        type: 'group',
        participants: [
          { id: '7', name: 'Coach Mike', isOnline: false },
          { id: '1', name: 'John Doe', isOnline: true },
        ],
        lastMessage: {
          id: 'msg4',
          threadId: '4',
          senderId: '7',
          content: 'Remember to keep your eye on the ball and follow through with your swing.',
          messageType: 'text',
          timestamp: new Date(Date.now() - 5400000),
          isRead: true,
          isDelivered: true,
        },
        unreadCount: 0,
        isActive: true,
        createdAt: new Date(Date.now() - 432000000),
        updatedAt: new Date(Date.now() - 5400000),
      },
    ];
  }

  private static getMockMessages(threadId: string): Message[] {
    return [
      {
        id: 'msg1',
        threadId,
        senderId: '1',
        content: 'Hey everyone! Ready for tomorrow\'s match?',
        messageType: 'text',
        timestamp: new Date(Date.now() - 3600000),
        isRead: false,
        isDelivered: true,
      },
      {
        id: 'msg2',
        threadId,
        senderId: '2',
        content: 'Absolutely! I\'ve been practicing my serves.',
        messageType: 'text',
        timestamp: new Date(Date.now() - 3000000),
        isRead: false,
        isDelivered: true,
      },
    ];
  }

  private static getMockUsers(query: string): User[] {
    const allUsers = [
      { id: '1', name: 'John Doe', avatar: undefined, isOnline: true },
      { id: '2', name: 'Jane Smith', avatar: undefined, isOnline: false },
      { id: '3', name: 'Mike Johnson', avatar: undefined, isOnline: true },
      { id: '4', name: 'Sarah Wilson', avatar: undefined, isOnline: false },
    ];

    return allUsers.filter(user => 
      user.name.toLowerCase().includes(query.toLowerCase())
    );
  }
}