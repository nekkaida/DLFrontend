import { socketService } from '@/lib/socket-service';
import { useChatStore } from '@/src/features/chat/stores/ChatStore';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';

export const SocketTestButton: React.FC<{ threadId: string }> = ({ threadId }) => {
  const { messages } = useChatStore();

  const runTests = () => {
    console.log('========================================');
    console.log('🧪 ===== RUNNING SOCKET TESTS =====');
    console.log('========================================');
    
    // Test 1: Check socket connection
    const socket = socketService.getSocket();
    const isConnected = socketService.isConnected();
    console.log('🧪 Test 1: Socket exists?', !!socket);
    console.log('🧪 Test 1: Socket connected?', isConnected);
    console.log('🧪 Test 1: Socket ID:', socket?.id);
    console.log('🧪 Test 1: Transport:', (socket as any)?.io?.engine?.transport?.name);
    
    // Test 2: Check current thread messages
    const currentMessages = messages[threadId] || [];
    console.log('🧪 Test 2: Current thread:', threadId);
    console.log('🧪 Test 2: Messages count:', currentMessages.length);
    console.log('🧪 Test 2: Last 3 messages:', JSON.stringify(currentMessages.slice(-3).map(m => ({
      id: m.id,
      content: m.content.substring(0, 30),
      timestamp: m.timestamp
    })), null, 2));
    
    // Test 3: Check if we're in the thread room
    console.log('🧪 Test 3: Socket rooms:', (socket as any)?.rooms);
    
    // Test 4: Check registered listeners
    console.log('🧪 Test 4: Checking socketService listeners...');
    (socketService as any).debugListeners?.();
    
    // Test 5: Manually emit a test event
    if (socket && isConnected) {
      console.log('🧪 Test 5: Sending test event to backend...');
      socket.emit('test_event', { test: 'from mobile', threadId, timestamp: new Date() });
    }
    
    // Test 6: Check store state
    const storeState = useChatStore.getState();
    console.log('🧪 Test 6: Store threads count:', storeState.threads.length);
    console.log('🧪 Test 6: Store current thread:', storeState.currentThread?.name);
    console.log('🧪 Test 6: Store connected?', storeState.isConnected);
    
    console.log('========================================');
    console.log('🧪 ===== TESTS COMPLETE - CHECK LOGS =====');
    console.log('========================================');
    
    Alert.alert(
      'Socket Tests',
      `Socket: ${isConnected ? 'Connected ✅' : 'Disconnected ❌'}\n` +
      `Messages: ${currentMessages.length}\n` +
      `Thread: ${threadId.substring(0, 8)}...\n` +
      `Check console for detailed logs`,
      [{ text: 'OK' }]
    );
  };

  return (
    <TouchableOpacity style={styles.button} onPress={runTests}>
      <Ionicons name="flask" size={16} color="#FFFFFF" />
      <Text style={styles.buttonText}>Test Socket</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
