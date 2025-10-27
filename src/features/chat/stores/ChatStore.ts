import { create } from 'zustand';
import { ChatService } from '../services/ChatService';
import { ChatState, Message, Thread } from '../types';

interface ChatActions {
  setCurrentThread: (thread: Thread | null) => void;
  addMessage: (message: Message) => void;
  updateThread: (thread: Thread) => void;
  loadThreads: () => Promise<void>;
  loadMessages: (threadId: string) => Promise<void>;
  sendMessage: (threadId: string, content: string) => void;
  setConnectionStatus: (connected: boolean) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
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
    const { messages } = get();
    const threadMessages = messages[message.threadId] || [];
    set({
      messages: {
        ...messages,
        [message.threadId]: [...threadMessages, message],
      },
    });
  },
  
  updateThread: (updatedThread) => {
    console.log('ChatStore: Updating thread:', updatedThread.name);
    const { threads } = get();
    const updatedThreads = threads.map(thread => 
      thread.id === updatedThread.id ? updatedThread : thread
    );
    set({ threads: updatedThreads });
  },
  
  loadThreads: async () => {
    console.log('ChatStore: Loading threads...');
    try {
      set({ isLoading: true, error: null });
      const threads = await ChatService.getThreads();
      console.log('ChatStore: Loaded threads:', threads.length);
      set({ threads, isLoading: false });
    } catch (error) {
      console.error('ChatStore: Error loading threads:', error);
      set({ error: 'Failed to load threads', isLoading: false });
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
  
  sendMessage: (threadId, content) => {
    console.log('ChatStore: Sending message:', { threadId, content });
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
}));