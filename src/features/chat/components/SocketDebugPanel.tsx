import { useSession } from '@/lib/auth-client';
import { socketService } from '@/lib/socket-service';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const SocketDebugPanel = () => {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setIsConnected(socketService.isConnected());
    
    const interval = setInterval(() => {
      setIsConnected(socketService.isConnected());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 20));
  };

  const testConnection = () => {
    const socket = socketService.getSocket();
    addLog(`Socket exists: ${!!socket}`);
    addLog(`Socket connected: ${socket?.connected}`);
    addLog(`User ID: ${session?.user?.id}`);
  };

  const testSendMessage = () => {
    const socket = socketService.getSocket();
    if (!socket) {
      addLog('❌ No socket');
      return;
    }

    const testData = {
      threadId: 'test-thread',
      senderId: session?.user?.id,
      content: 'Test message from debug panel',
    };

    addLog('📤 Sending test message...');
    socket.emit('send_message', testData);
    addLog('✅ Message sent');
  };

  const testJoinThread = (threadId: string = 'test-thread') => {
    socketService.joinThread(threadId);
    addLog(`🚪 Joined thread: ${threadId}`);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Socket Debug Panel</Text>
        <View style={[styles.indicator, isConnected ? styles.connected : styles.disconnected]} />
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>User ID: {session?.user?.id || 'Not logged in'}</Text>
        <Text style={styles.infoText}>Status: {isConnected ? '✅ Connected' : '❌ Disconnected'}</Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.button} onPress={testConnection}>
          <Text style={styles.buttonText}>Test Connection</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testSendMessage}>
          <Text style={styles.buttonText}>Send Test Message</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={() => testJoinThread()}>
          <Text style={styles.buttonText}>Join Test Thread</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearLogs}>
          <Text style={styles.buttonText}>Clear Logs</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.logs}>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>{log}</Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  connected: {
    backgroundColor: '#00ff00',
  },
  disconnected: {
    backgroundColor: '#ff0000',
  },
  info: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
  },
  infoText: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 4,
  },
  buttons: {
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#ff3b30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  logs: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
  },
  logText: {
    color: '#00ff00',
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});
