import { socketService } from '@/lib/socket-service';
import { useEffect, useRef } from 'react';
import { useChatStore } from '../stores/ChatStore';
import { Message } from '../types';

/**
 * Custom hook to manage Socket.IO event listeners for chat
 * Handles real-time message delivery, read receipts, and deletions
 */
export const useChatSocketEvents = (threadId: string | null, currentUserId: string) => {
  const { 
    addMessage, 
    deleteMessage, 
    markMessageAsRead,
    updateThread,
    threads 
  } = useChatStore();
  
  const socket = socketService.getSocket();
  const isConnected = socketService.isConnected();
  
  // Use ref to avoid stale closure issues
  const currentThreadIdRef = useRef(threadId);
  
  useEffect(() => {
    currentThreadIdRef.current = threadId;
  }, [threadId]);

  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('⏸️ Socket not ready for chat events');
      return;
    }

    console.log('🎧 Setting up chat socket listeners');

    // 📥 Handle new messages
    const handleNewMessage = (message: Message) => {
      console.log('📥 Received new message:', message.id, 'for thread:', message.threadId);
      
      // Add message to store
      addMessage(message);
      
      // Update thread's last message
      const thread = threads.find(t => t.id === message.threadId);
      if (thread) {
        updateThread({
          ...thread,
          lastMessage: message,
          updatedAt: new Date(message.timestamp),
        });
      }
      
      // If message is in current thread and not from current user, mark as read automatically
      if (message.threadId === currentThreadIdRef.current && message.senderId !== currentUserId) {
        console.log('📖 Auto-marking message as read:', message.id);
        socketService.markMessageAsRead(message.id, currentUserId);
      }
    };

    // 🗑️ Handle message deletion
    const handleMessageDeleted = (data: { messageId: string; threadId: string }) => {
      console.log('🗑️ Message deleted:', data.messageId);
      deleteMessage(data.messageId, data.threadId);
    };

    // ✅ Handle message sent confirmation
    const handleMessageSent = (data: { messageId: string; threadId: string; message?: Message }) => {
      console.log('✅ Message sent confirmed:', data.messageId);
      
      // If full message data is provided, update it in store
      if (data.message) {
        addMessage(data.message);
      }
    };

    // 👁️ Handle message read receipts
    const handleMessageRead = (data: {
      messageId: string;
      threadId: string;
      readerId: string;
      readerName: string;
    }) => {
      console.log('👁️ Message read by:', data.readerName);
      
      // Don't process our own read receipts
      if (data.readerId !== currentUserId) {
        markMessageAsRead(data.messageId, data.threadId, data.readerId, data.readerName);
      }
    };

    // 📊 Handle unread count updates
    const handleUnreadCountUpdate = (data: { threadId: string; unreadCount: number }) => {
      console.log('📊 Unread count update:', data);
      
      const thread = threads.find(t => t.id === data.threadId);
      if (thread) {
        updateThread({
          ...thread,
          unreadCount: data.unreadCount,
        });
      }
    };

    // Register all listeners
    socket.on('new_message', handleNewMessage);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('message_sent', handleMessageSent);
    socket.on('message_read', handleMessageRead);
    socket.on('unread_count_update', handleUnreadCountUpdate);

    // Join thread room if we have a current thread
    if (threadId) {
      console.log('🚪 Joining thread room:', threadId);
      socketService.joinThread(threadId);
    }

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up chat socket listeners');
      
      socket.off('new_message', handleNewMessage);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('message_sent', handleMessageSent);
      socket.off('message_read', handleMessageRead);
      socket.off('unread_count_update', handleUnreadCountUpdate);
      
      // Leave thread room
      if (threadId) {
        console.log('🚪 Leaving thread room:', threadId);
        socketService.leaveThread(threadId);
      }
    };
  }, [socket, isConnected, threadId, currentUserId, addMessage, deleteMessage, markMessageAsRead, updateThread, threads]);

  return {
    isConnected,
  };
};
