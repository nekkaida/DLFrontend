import { getBackendBaseURL } from '@/config/network';
import { io, Socket } from 'socket.io-client';
import { authClient } from './auth-client';

export class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  async connect(): Promise<void> {
    if (this.socket?.connected) return;

    try {
      const backendUrl = getBackendBaseURL();
      
      // Get the session token from Better Auth
      const session = await authClient.getSession();
      
      if (!session?.data) {
        console.log('SocketService: No session token available, skipping socket connection');
        return;
      }

      console.log('SocketService: Connecting to:', backendUrl);

      this.socket = io(backendUrl, {
        auth: {
          token: session.data,
        },
        transports: ['websocket'],
        timeout: 10000,
        reconnection: true,
        reconnectionDelay: this.reconnectDelay,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.socket.on('connect', () => {
        console.log('SocketService: Connected successfully');
        this.reconnectAttempts = 0;
        this.emit('connection_status', { connected: true });
      });

      this.socket.on('disconnect', (reason) => {
        console.log('SocketService: Disconnected, reason:', reason);
        this.emit('connection_status', { connected: false });
      });

      this.socket.on('connect_error', (error) => {
        console.error('SocketService: Connection error:', error);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('SocketService: Max reconnection attempts reached');
          this.emit('connection_status', { connected: false, error: 'Max reconnection attempts reached' });
        }
      });

      // Chat-related events
      this.socket.on('new_message', (data) => {
        console.log('SocketService: Received new message:', data);
        this.emit('message', data);
      });

      this.socket.on('message_sent', (data) => {
        console.log('SocketService: Message sent confirmation:', data);
        this.emit('message_sent', data);
      });

      this.socket.on('thread_updated', (data) => {
        console.log('SocketService: Thread updated:', data);
        this.emit('thread_update', data);
      });

      this.socket.on('user_online', (data) => {
        console.log('SocketService: User online:', data);
        this.emit('user_status', { ...data, isOnline: true });
      });

      this.socket.on('user_offline', (data) => {
        console.log('SocketService: User offline:', data);
        this.emit('user_status', { ...data, isOnline: false });
      });

      this.socket.on('typing_start', (data) => {
        console.log('SocketService: User started typing:', data);
        this.emit('typing', { ...data, isTyping: true });
      });

      this.socket.on('typing_stop', (data) => {
        console.log('SocketService: User stopped typing:', data);
        this.emit('typing', { ...data, isTyping: false });
      });

      this.socket.on('message_read', (data) => {
        console.log('SocketService: Message read receipt:', data);
        this.emit('read_receipt', data);
      });

      // Join user to their personal room for notifications
      if (session.data.user?.id) {
        this.socket.emit('join_user_room', { userId: session.data.user.id });
      }

    } catch (error) {
      console.error('SocketService: Failed to connect:', error);
      this.emit('connection_status', { connected: false});
    }
  }

  disconnect(): void {
    if (this.socket) {
      console.log('SocketService: Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
      this.reconnectAttempts = 0;
    }
  }

  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`SocketService: Error in callback for event ${event}:`, error);
        }
      });
    }
  }

  // Send a message through socket
  sendMessage(threadId: string, content: string, messageType: string = 'TEXT'): void {
    if (this.socket?.connected) {
      console.log('SocketService: Sending message via socket:', { threadId, content, messageType });
      this.socket.emit('send_message', {
        threadId,
        content,
        type: messageType.toUpperCase(),
      });
    } else {
      console.warn('SocketService: Cannot send message - socket not connected');
    }
  }

  // Join a specific thread room
  joinThread(threadId: string): void {
    if (this.socket?.connected) {
      console.log('SocketService: Joining thread:', threadId);
      this.socket.emit('join_thread', { threadId });
    }
  }

  // Leave a specific thread room
  leaveThread(threadId: string): void {
    if (this.socket?.connected) {
      console.log('SocketService: Leaving thread:', threadId);
      this.socket.emit('leave_thread', { threadId });
    }
  }

  // Mark message as read
  markAsRead(threadId: string, messageId: string): void {
    if (this.socket?.connected) {
      console.log('SocketService: Marking message as read:', { threadId, messageId });
      this.socket.emit('mark_as_read', { threadId, messageId });
    }
  }

  // Send typing indicator
  sendTyping(threadId: string, isTyping: boolean): void {
    if (this.socket?.connected) {
      const eventName = isTyping ? 'typing_start' : 'typing_stop';
      this.socket.emit(eventName, { threadId });
    }
  }

  // Get connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Manually reconnect
  async reconnect(): Promise<void> {
    this.disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    await this.connect();
  }
}