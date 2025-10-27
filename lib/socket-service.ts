import { authClient } from './auth-client';
// import { getBackendBaseURL } from '@/core/config';
import { io, Socket } from 'socket.io-client';

export class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  async connect(): Promise<void> {
    if (this.socket?.connected) return;

    const backendUrl = "http://localhost:3001"
    const token = await authClient.getAccessToken();

    this.socket = io(backendUrl, {
      auth: {
        token,
      },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.emit('connection_status', { connected: true });
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.emit('connection_status', { connected: false });
    });

    this.socket.on('message', (data) => {
      this.emit('message', data);
    });

    this.socket.on('thread_update', (data) => {
      this.emit('thread_update', data);
    });

    this.socket.on('user_status', (data) => {
      this.emit('user_status', data);
    });

    this.socket.on('typing', (data) => {
      this.emit('typing', data);
    });

    this.socket.on('read_receipt', (data) => {
      this.emit('read_receipt', data);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
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
      callbacks.forEach(callback => callback(data));
    }
  }

  sendMessage(threadId: string, content: string, messageType: string = 'text'): void {
    if (this.socket?.connected) {
      this.socket.emit('send_message', {
        threadId,
        content,
        messageType,
      });
    }
  }

  joinThread(threadId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join_thread', { threadId });
    }
  }

  leaveThread(threadId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_thread', { threadId });
    }
  }

  markAsRead(threadId: string, messageId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('mark_read', { threadId, messageId });
    }
  }

  sendTyping(threadId: string, isTyping: boolean): void {
    if (this.socket?.connected) {
      this.socket.emit('typing', { threadId, isTyping });
    }
  }
}