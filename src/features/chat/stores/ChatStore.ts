import { create } from 'zustand';
import { ChatService } from '../services/ChatService';
import { ChatState, Message, Thread } from '../types';

interface ChatActions {
  setCurrentThread: (thread: Thread | null) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (messageId: string, threadId: string) => void;
  markMessageAsRead: (messageId: string, threadId: string, readerId: string, readerName: string) => void;
  updateThread: (thread: Thread) => void;
  addThread: (thread: Thread) => void;
  loadThreads: (userId: string) => Promise<void>;
  loadMessages: (threadId: string) => Promise<void>;
  sendMessage: (threadId: string, senderId: string, content: string) => Promise<void>;
  setConnectionStatus: (connected: boolean) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  getTotalUnreadCount: () => number;
}

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  // State
  threads: [],
  currentThread: null,
  messages: {},
  isConnected: false,
  isLoading: false,
  error: null,

  // Actions
  setCurrentThread: (thread) => {
    console.log('ChatStore: Setting current thread:', thread?.name || 'null');
    set({ currentThread: thread });
  },
  
  addMessage: (message) => {
    console.log('ChatStore: Adding message:', message.content);
    console.log('ChatStore: Message ID:', message.id, 'Thread ID:', message.threadId);
    console.log('ChatStore: Current messages for thread:', message.threadId, 'count:', (get().messages[message.threadId] || []).length);
    
    const { messages } = get();
    const threadMessages = messages[message.threadId] || [];
    
    // Check if message already exists to prevent duplicates
    const exists = threadMessages.some(m => m.id === message.id);
    if (exists) {
      console.log('ChatStore: Message already exists, skipping:', message.id);
      return;
    }
    
    const updatedMessages = {
      ...messages,
      [message.threadId]: [...threadMessages, message],
    };
    
    set({ messages: updatedMessages });
    
    console.log('ChatStore: Message added successfully. Total messages in thread:', updatedMessages[message.threadId].length);
    console.log('ChatStore: Updated messages state:', Object.keys(updatedMessages).map(tid => `${tid}: ${updatedMessages[tid].length} messages`));
  },

  updateMessage: (messageId, updates) => {
    console.log('ChatStore: Updating message:', messageId);
    const { messages } = get();
    const updatedMessages = { ...messages };
    
    for (const threadId in updatedMessages) {
      updatedMessages[threadId] = updatedMessages[threadId].map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      );
    }
    
    set({ messages: updatedMessages });
  },

  deleteMessage: (messageId, threadId) => {
    console.log('ChatStore: Deleting message:', messageId);
    const { messages } = get();
    const threadMessages = messages[threadId] || [];
    
    set({
      messages: {
        ...messages,
        [threadId]: threadMessages.map(msg =>
          msg.id === messageId
            ? {
                ...msg,
                isDeleted: true,
                content: 'This message has been deleted',
                metadata: {
                  ...msg.metadata,
                  isDeleted: true,
                }
              }
            : msg
        ),
      },
    });
  },

  markMessageAsRead: (messageId, threadId, readerId, readerName) => {
    console.log('ChatStore: Marking message as read:', messageId);
    const { messages } = get();
    const threadMessages = messages[threadId] || [];
    
    set({
      messages: {
        ...messages,
        [threadId]: threadMessages.map(msg => {
          if (msg.id === messageId) {
            const readBy = msg.metadata?.readBy || [];
            const alreadyRead = readBy.some((r: any) => r.userId === readerId);
            
            if (!alreadyRead) {
              return {
                ...msg,
                isRead: true,
                metadata: {
                  ...msg.metadata,
                  readBy: [
                    ...readBy,
                    {
                      id: `${messageId}-${readerId}`,
                      userId: readerId,
                      messageId: messageId,
                      readAt: new Date().toISOString(),
                      user: { id: readerId, name: readerName },
                    },
                  ],
                },
              };
            }
          }
          return msg;
        }),
      },
    });
  },
  
  updateThread: (updatedThread) => {
    console.log('ChatStore: Updating thread:', updatedThread.name);
    console.log('ChatStore: Updated thread lastMessage:', updatedThread.lastMessage?.content);
    console.log('ChatStore: Updated thread updatedAt:', updatedThread.updatedAt);
    const { threads } = get();
    
    console.log('ChatStore: Current threads before update:', threads.length);
    
    // Update the thread and sort by most recent
    const updatedThreads = threads
      .map(thread => {
        if (thread.id === updatedThread.id) {
          console.log('ChatStore: Found matching thread, updating:', thread.name);
          return updatedThread;
        }
        return thread;
      })
      .sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA; // Most recent first
      });
    
    console.log('ChatStore: Setting new threads array...');
    set({ threads: updatedThreads });
    console.log('ChatStore: Threads updated! New array has', updatedThreads.length, 'threads');
    
    // Verify the update
    const { threads: finalThreads } = get();
    const verifyThread = finalThreads.find(t => t.id === updatedThread.id);
    console.log('ChatStore: Verification - Thread lastMessage:', verifyThread?.lastMessage?.content);
  },

  addThread: (newThread) => {
    console.log('ChatStore: Adding new thread:', newThread.name);
    const { threads } = get();
    
    // Add thread to beginning and sort
    const updatedThreads = [newThread, ...threads].sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    });
    
    set({ threads: updatedThreads });
  },
  
  loadThreads: async (userId: string) => {
    console.log('ChatStore: Loading threads for user:', userId);
    try {
      set({ isLoading: true, error: null });
      const threads = await ChatService.getThreads(userId);
      console.log('ChatStore: Loaded threads:', threads.length);
      set({ threads, isLoading: false });
    } catch (error) {
      console.error('ChatStore: Error loading threads:', error);
      set({ 
        error: 'Failed to load threads', 
        isLoading: false,
        threads: [] // Clear threads on error
      });
    }
  },
  
  loadMessages: async (threadId) => {
    console.log('ChatStore: Loading messages for thread:', threadId);
    try {
      set({ isLoading: true, error: null });
      const messages = await ChatService.getMessages(threadId);
      console.log('ChatStore: Loaded messages:', messages.length);
      const { messages: currentMessages } = get();
      set({
        messages: {
          ...currentMessages,
          [threadId]: messages,
        },
        isLoading: false,
      });
    } catch (error) {
      console.error('ChatStore: Error loading messages:', error);
      set({ error: 'Failed to load messages', isLoading: false });
    }
  },
  
  sendMessage: async (threadId, senderId, content) => {
    console.log('ChatStore: Sending message:', { threadId, senderId, content });
    try {
      const message = await ChatService.sendMessage(threadId, senderId, content);
      // console.log('ChatStore: Message sent via API, waiting for socket confirmation:', message.id);
    } catch (error) {
      console.error('ChatStore: Error sending message:', error);
      set({ error: 'Failed to send message' });
    }
  },
  
  setConnectionStatus: (connected) => {
    console.log('ChatStore: Connection status:', connected);
    set({ isConnected: connected });
  },
  
  setError: (error) => {
    console.log('ChatStore: Error:', error);
    set({ error });
  },
  
  setLoading: (loading) => {
    console.log('ChatStore: Loading:', loading);
    set({ isLoading: loading });
  },

  getTotalUnreadCount: () => {
    const { threads } = get();
    const totalUnread = threads.reduce((sum, thread) => sum + (thread.unreadCount || 0), 0);
    console.log('ChatStore: Total unread count:', totalUnread);
    return totalUnread;
  },
}));