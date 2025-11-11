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
    addThread,
  } = useChatStore();
  
  const isConnected = socketService.isConnected();
  
  // Use ref to avoid stale closure issues
  const currentThreadIdRef = useRef(threadId);
  const currentUserIdRef = useRef(currentUserId);
  
  useEffect(() => {
    currentThreadIdRef.current = threadId;
    currentUserIdRef.current = currentUserId;
  }, [threadId, currentUserId]);

  // Transform backend message to frontend format
  const transformMessage = (backendMessage: any): Message => {
    return {
      id: backendMessage.id,
      threadId: backendMessage.threadId,
      senderId: backendMessage.senderId,
      content: backendMessage.content || "",
      timestamp: new Date(backendMessage.createdAt || backendMessage.timestamp),
      isRead: backendMessage.readBy?.length > 0 || false,
      isDelivered: true,
      replyTo: backendMessage.repliesToId,
      metadata: {
        isEdited: backendMessage.isEdited,
        isDeleted: backendMessage.isDeleted,
        sender: backendMessage.sender,
        readBy: backendMessage.readBy || [],
        updatedAt: backendMessage.updatedAt,
      },
    };
  };

  useEffect(() => {
    if (!isConnected) {
      console.log('⏸️ Socket not connected, waiting...');
      return;
    }

    console.log('🎧 Setting up chat socket listeners');
    console.log('🎧 Current thread:', threadId);
    console.log('🎧 Current user:', currentUserId);
    console.log('🎧 Socket connected:', isConnected);

    // 📥 Handle new messages
    const handleNewMessage = (backendMessage: any) => {
      console.log('========================================');
      console.log('📥 NEW MESSAGE EVENT RECEIVED');
      console.log('========================================');
      console.log('📥 Message ID:', backendMessage.id);
      console.log('📥 Thread ID:', backendMessage.threadId);
      console.log('📥 Content:', backendMessage.content);
      console.log('📥 Sender ID:', backendMessage.senderId);
      console.log('📥 Current Thread ID:', currentThreadIdRef.current);
      console.log('📥 Current User ID:', currentUserIdRef.current);
      console.log('📥 Raw message data:', JSON.stringify(backendMessage, null, 2));
      
      // Transform backend format to frontend format
      const message = transformMessage(backendMessage);
      console.log('📥 Transformed message:', JSON.stringify(message, null, 2));
      
      // Add message to store
      console.log('📥 Adding message to store...');
      addMessage(message);
      console.log('📥 Message added to store!');
      
      // Update thread's last message and move to top
      const currentThreads = useChatStore.getState().threads;
      console.log('📥 Current threads count:', currentThreads.length);
      const thread = currentThreads.find(t => t.id === message.threadId);
      if (thread) {
        console.log('📥 Found thread to update:', thread.name);
        const updatedThread = {
          ...thread,
          lastMessage: message,
          updatedAt: new Date(message.timestamp),
        };
        updateThread(updatedThread);
        console.log('📥 Thread updated!');
      } else {
        console.log('⚠️ Thread not found in store!');
      }
      
      // If message is in current thread and not from current user, mark as read automatically
      if (message.threadId === currentThreadIdRef.current && message.senderId !== currentUserIdRef.current) {
        console.log('📖 Auto-marking message as read');
        socketService.markMessageAsRead(message.id, currentUserIdRef.current);
      }
      console.log('========================================');
    };

    // 🗑️ Handle message deletion
    const handleMessageDeleted = (data: { messageId: string; threadId: string }) => {
      console.log('🗑️ Message deleted:', data.messageId);
      deleteMessage(data.messageId, data.threadId);
    };

    // ✅ Handle message sent confirmation
    const handleMessageSent = (data: { messageId: string; threadId: string; message?: any }) => {
      console.log('✅ Message sent confirmed:', data.messageId);
      console.log('✅ Full sent data:', data);
      
      // If full message data is provided, transform and update it in store
      if (data.message) {
        const message = transformMessage(data.message);
        addMessage(message);
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
      if (data.readerId !== currentUserIdRef.current) {
        markMessageAsRead(data.messageId, data.threadId, data.readerId, data.readerName);
      }
    };

    // 📊 Handle unread count updates
    const handleUnreadCountUpdate = (data: { threadId: string; unreadCount: number }) => {
      console.log('📊 Unread count update:', data);
      
      const currentThreads = useChatStore.getState().threads;
      const thread = currentThreads.find(t => t.id === data.threadId);
      if (thread) {
        updateThread({
          ...thread,
          unreadCount: data.unreadCount,
        });
      }
    };

    // 🆕 Handle new thread created
    const handleThreadCreated = (data: any) => {
      console.log('🆕 New thread created:', data);
      
      const thread = data.thread || data;
      
      // Only add if user is a member
      const isMember = thread.members?.some((m: any) => m.userId === currentUserIdRef.current);
      if (isMember) {
        addThread(thread);
      }
    };

    // Register all listeners on socketService (NOT raw socket!)
    // The socket-service already listens to Socket.IO and re-emits events
    console.log('🎧 Registering socketService event listeners...');
    socketService.on('new_message', handleNewMessage);
    socketService.on('message_deleted', handleMessageDeleted);
    socketService.on('message_sent', handleMessageSent);
    socketService.on('message_read', handleMessageRead);
    socketService.on('unread_count_update', handleUnreadCountUpdate);
    socketService.on('thread_created', handleThreadCreated);
    socketService.on('new_thread', handleThreadCreated); // Backend sends this too
    console.log('✅ All socketService event listeners registered!');

    // Join thread room if we have a current thread
    if (threadId) {
      console.log('========================================');
      console.log('🎯 COMPONENT: Requesting to join thread');
      console.log('🎯 Thread ID from prop:', threadId);
      console.log('🎯 User ID:', currentUserId);
      console.log('========================================');
      socketService.joinThread(threadId);
      console.log('✅ Join request sent to socketService');
    } else {
      console.log('ℹ️ No current thread, not joining any room');
    }

    // Cleanup function
    return () => {
      console.log('========================================');
      console.log('🧹 CLEANUP: Removing chat socket listeners');
      console.log('🧹 Thread being cleaned up:', threadId);
      console.log('========================================');
      
      socketService.off('new_message', handleNewMessage);
      socketService.off('message_deleted', handleMessageDeleted);
      socketService.off('message_sent', handleMessageSent);
      socketService.off('message_read', handleMessageRead);
      socketService.off('unread_count_update', handleUnreadCountUpdate);
      socketService.off('thread_created', handleThreadCreated);
      socketService.off('new_thread', handleThreadCreated);
      
      // Leave thread room
      if (threadId) {
        console.log('🚪 Cleanup: Leaving thread room:', threadId);
        socketService.leaveThread(threadId);
      }
    };
  }, [isConnected, threadId, addMessage, deleteMessage, markMessageAsRead, updateThread, addThread]);

  return {
    isConnected,
  };
};
