import { useSession } from '@/lib/auth-client';
import { socketService } from '@/lib/socket-service';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * Socket Debug Component
 * Add this to any screen to see socket connection status
 * 
 * Usage: <SocketDebug />
 */
export const SocketDebug: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionLog, setConnectionLog] = useState<string[]>([]);
  const { data: session } = useSession();

  useEffect(() => {
    const interval = setInterval(() => {
      const connected = socketService.isConnected();
      setIsConnected(connected);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const addLog = (message: string) => {
    setConnectionLog(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    const handleConnectionStatus = (status: any) => {
      addLog(`Connection status: ${status.connected ? 'Connected' : 'Disconnected'}`);
    };

    socketService.on('connection_status', handleConnectionStatus);

    return () => {
      socketService.off('connection_status', handleConnectionStatus);
    };
  }, []);

  const handleConnect = async () => {
    addLog('Manual connect triggered');
    try {
      await socketService.connect();
      addLog('Connect called successfully');
    } catch (error) {
      addLog(`Connect error: ${error}`);
    }
  };

  const handleDisconnect = () => {
    addLog('Manual disconnect triggered');
    socketService.disconnect();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Socket Debug</Text>
      
      <View style={[styles.statusBadge, isConnected ? styles.connected : styles.disconnected]}>
        <Text style={styles.statusText}>
          {isConnected ? '✅ Connected' : '❌ Disconnected'}
        </Text>
      </View>

      <Text style={styles.info}>User: {session?.user?.id || 'No user'}</Text>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={handleConnect}>
          <Text style={styles.buttonText}>Connect</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.disconnectButton]} onPress={handleDisconnect}>
          <Text style={styles.buttonText}>Disconnect</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logContainer}>
        <Text style={styles.logTitle}>Connection Log:</Text>
        {connectionLog.map((log, index) => (
          <Text key={index} style={styles.logText}>{log}</Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statusBadge: {
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  connected: {
    backgroundColor: '#4CAF50',
  },
  disconnected: {
    backgroundColor: '#f44336',
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  info: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  disconnectButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  logContainer: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  logTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  logText: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'monospace',
  },
});
