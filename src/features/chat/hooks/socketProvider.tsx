import { SocketService } from '@/lib/socket-service';
import React, { createContext, useContext, useEffect } from 'react';
import { useChatStore } from '../stores/ChatStore';

interface ChatContextType {
  isConnected: boolean;
  reconnect: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setConnectionStatus, addMessage, updateThread } = useChatStore();
  const socketService = SocketService.getInstance();

  useEffect(() => {
    const initializeChat = async () => {
      try {
        await socketService.connect();
        
        socketService.on('connection_status', ({ connected }) => {
          setConnectionStatus(connected);
        });

        socketService.on('message', (message) => {
          addMessage(message);
        });

        socketService.on('thread_update', (thread) => {
          updateThread(thread);
        });
      } catch (error) {
        console.error('Failed to initialize chat:', error);
      }
    };

    initializeChat();

    return () => {
      socketService.disconnect();
    };
  }, []);

  const reconnect = () => {
    socketService.disconnect();
    socketService.connect();
  };

  return (
    <ChatContext.Provider value={{ isConnected: false, reconnect }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};