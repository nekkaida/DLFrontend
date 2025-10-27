import { getBackendBaseURL } from '@/config/network';
import { authClient } from '@/lib/auth-client';
import { Message, Thread, User } from '../types';

export class ChatService {
  static async getThreads(userId: string): Promise<Thread[]> {
    console.log('ChatService: getThreads called for user:', userId);
    try {
      const backendUrl = getBackendBaseURL();
      const response = await authClient.$fetch(`${backendUrl}/api/chat/threads/${userId}`, {
        method: 'GET',
      });
      
      console.log('ChatService: Backend response:', response);
      
      // Transform backend data to match our frontend types
      const threads = Array.isArray(response?.data) ? response.data.map(this.transformBackendThread) : [];
      console.log('ChatService: Transformed threads:', threads.length);
      
      return threads;
    } catch (error) {
      console.error('Error fetching threads:', error);
      throw error;
    }
  }

  static async getMessages(threadId: string, page: number = 1, limit: number = 50): Promise<Message[]> {
    console.log('ChatService: getMessages called for thread:', threadId);
    try {
      const backendUrl = getBackendBaseURL();
      const response = await authClient.$fetch(`${backendUrl}/api/chat/threads/${threadId}/messages`, {
        method: 'GET',
        query: { 
          page: page.toString(), 
          limit: limit.toString() 
        },
      });
      
      console.log('ChatService: Messages response:', response);
      
      // Transform backend data to match our frontend types
      const messages = Array.isArray(response?.data) ? response.data.map(this.transformBackendMessage) : [];
      console.log('ChatService: Transformed messages:', messages.length);
      
      return messages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  static async sendMessage(threadId: string, senderId: string, content: string): Promise<Message> {
    console.log('ChatService: sendMessage called:', { threadId, senderId, content });
    try {
      const backendUrl = getBackendBaseURL();
      const response = await authClient.$fetch(`${backendUrl}/api/chat/threads/${threadId}/messages`, {
        method: 'POST',
        body: { 
          senderId,
          content,
        },
      });
      
      console.log('ChatService: Send message response:', response);
      return this.transformBackendMessage(response.data);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  static async createThread(currentUserId: string, userIds: string[], isGroup: boolean = false, name?: string): Promise<Thread> {
    console.log('ChatService: createThread called:', { currentUserId, userIds, isGroup, name });
    try {
      const backendUrl = getBackendBaseURL();
      
      // Include current user in the userIds array
      const allUserIds = [currentUserId, ...userIds.filter(id => id !== currentUserId)];
      
      const response = await authClient.$fetch(`${backendUrl}/api/chat/threads`, {
        method: 'POST',
        body: { 
          userIds: allUserIds,
          isGroup,
          name: isGroup ? name : undefined
        },
      });
      
      console.log('ChatService: Create thread response:', response);
      return this.transformBackendThread(response.data);
    } catch (error) {
      console.error('Error creating thread:', error);
      throw error;
    }
  }

  static async getAvailableUsers(userId: string): Promise<User[]> {
    console.log('ChatService: getAvailableUsers called for user:', userId);
    try {
      const backendUrl = getBackendBaseURL();
      const response = await authClient.$fetch(`${backendUrl}/api/chat/available-users/${userId}`, {
        method: 'GET',
      });
      
      console.log('ChatService: Available users response:', response);
      
      // Transform backend data to match our frontend types
      const users = Array.isArray(response?.data) ? response.data.map(this.transformBackendUser) : [];
      console.log('ChatService: Transformed users:', users.length);
      
      return users;
    } catch (error) {
      console.error('Error fetching available users:', error);
      throw error;
    }
  }

  static async markAsRead(messageId: string, userId: string): Promise<void> {
    console.log('ChatService: markAsRead called:', { messageId, userId });
    try {
      const backendUrl = getBackendBaseURL();
      await authClient.$fetch(`${backendUrl}/api/chat/messages/${messageId}/read`, {
        method: 'POST',
        body: { userId },
      });
      
      console.log('ChatService: Message marked as read');
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  // Transform backend thread data to frontend format
  private static transformBackendThread(backendThread: any): Thread {
    // Backend structure based on your schema:
    // {
    //   id, name, avatarUrl, isGroup, divisionId, division,
    //   members: [{ id, threadId, userId, role, joinedAt, user: { id, name, username, image } }],
    //   messages: [{ latest message }],
    //   _count: { messages: number },
    //   createdAt, updatedAt
    // }

    const lastMessage = backendThread.messages?.[0];
    
    return {
      id: backendThread.id,
      name: backendThread.name || this.generateThreadName(backendThread.members, backendThread.isGroup),
      type: backendThread.isGroup ? 'group' : 'direct',
      participants: backendThread.members?.map((member: any) => this.transformBackendUser(member.user)) || [],
      lastMessage: lastMessage ? this.transformBackendMessage(lastMessage) : undefined,
      unreadCount: this.calculateUnreadCount(backendThread.messages, backendThread.members),
      isActive: true,
      createdAt: new Date(backendThread.createdAt),
      updatedAt: new Date(backendThread.updatedAt),
      metadata: {
        avatarUrl: backendThread.avatarUrl,
        divisionId: backendThread.divisionId,
        isGroup: backendThread.isGroup,
        messageCount: backendThread._count?.messages || 0,
      },
    };
  }

  // Transform backend message data to frontend format
  private static transformBackendMessage(backendMessage: any): Message {
    // Backend structure based on your schema:
    // {
    //   id, threadId, senderId, content, repliesToId, isEdited, isDeleted,
    //   sender: { id, name, username, image },
    //   readBy: [{ id, messageId, userId, user: { id, name } }],
    //   createdAt, updatedAt
    // }

    return {
      id: backendMessage.id,
      threadId: backendMessage.threadId,
      senderId: backendMessage.senderId,
      content: backendMessage.content || '',
      messageType: 'text', // You might want to add a type field to your Message schema
      timestamp: new Date(backendMessage.createdAt),
      isRead: backendMessage.readBy?.length > 0 || false,
      isDelivered: true, // Assume delivered if we received it
      replyTo: backendMessage.repliesToId,
      metadata: {
        isEdited: backendMessage.isEdited,
        isDeleted: backendMessage.isDeleted,
        sender: backendMessage.sender,
        readBy: backendMessage.readBy || [],
        updatedAt: backendMessage.updatedAt,
      },
    };
  }

  // Transform backend user data to frontend format
  private static transformBackendUser(backendUser: any): User {
    // Backend structure: { id, name, username, image, email }
    return {
      id: backendUser.id,
      name: backendUser.name || backendUser.username || 'Unknown User',
      avatar: backendUser.image,
      isOnline: false, // You'll need to implement online status tracking
      username: backendUser.username,
      email: backendUser.email,
    };
  }

  // Generate thread name for direct messages
  private static generateThreadName(members: any[], isGroup: boolean): string {
    if (isGroup) {
      return 'Group Chat';
    }
    
    // For direct messages, use the other person's name
    // members structure: [{ user: { name, username } }]
    if (members && members.length >= 2) {
      return members
        .map(member => member.user?.name || member.user?.username || 'Unknown')
        .join(', ');
    }
    
    return 'Chat';
  }

  // Calculate unread count (you might want to enhance this based on your needs)
  private static calculateUnreadCount(messages: any[], members: any[]): number {
    // This is a simplified calculation
    // You might want to implement proper unread counting based on MessageReadBy
    return 0; // For now, return 0 - implement based on your specific requirements
  }

  // Get thread members
  static async getThreadMembers(threadId: string): Promise<User[]> {
    console.log('ChatService: getThreadMembers called for thread:', threadId);
    try {
      const backendUrl = getBackendBaseURL();
      const response = await authClient.$fetch(`${backendUrl}/api/chat/threads/${threadId}/members`, {
        method: 'GET',
      });
      
      console.log('ChatService: Thread members response:', response);
      
      // Transform backend data to match our frontend types
      const members = Array.isArray(response?.data) 
        ? response.data.map((member: any) => this.transformBackendUser(member.user)) 
        : [];
      
      console.log('ChatService: Transformed members:', members.length);
      return members;
    } catch (error) {
      console.error('Error fetching thread members:', error);
      throw error;
    }
  }
}