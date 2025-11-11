/**
 * TEST COMPONENT - Use this to verify Better Auth is working correctly
 * 
 * Add this to your app temporarily:
 * import TestAuth from './test-better-auth';
 * <TestAuth />
 */

import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { authClient, useSession } from '../../lib/auth-client';
import axiosInstance from '../../lib/endpoints';

export default function TestBetterAuth() {
  const { data: session, isPending } = useSession();
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    console.log(message);
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearLogs = () => setResults([]);

  // Test 1: Check session data
  const testSession = async () => {
    try {
      addLog('🔍 Testing session...');
      const session = await authClient.getSession();
      
      if (session?.data?.session?.token) {
        addLog(`✅ Session found!`);
        addLog(`   User ID: ${session.data.user?.id}`);
        addLog(`   Token: ${session.data.session.token.substring(0, 20)}...`);
        addLog(`   Expires: ${new Date(session.data.session.expiresAt).toLocaleString()}`);
      } else {
        addLog('❌ No session found - user not logged in');
      }
    } catch (error: any) {
      addLog(`❌ Session error: ${error.message}`);
    }
  };

  // Test 2: Test axios with Bearer token
  const testAxiosRequest = async () => {
    setLoading(true);
    try {
      addLog('📡 Testing axios request...');
      
      const response = await axiosInstance.get('/api/notifications', {
        params: { page: 1, limit: 5 }
      });
      
      addLog(`✅ Axios request successful!`);
      addLog(`   Status: ${response.status}`);
      addLog(`   Data: ${JSON.stringify(response.data).substring(0, 100)}...`);
    } catch (error: any) {
      addLog(`❌ Axios request failed: ${error.response?.status} ${error.message}`);
      if (error.response?.data) {
        addLog(`   Error data: ${JSON.stringify(error.response.data)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Test 3: Test Better Auth $fetch
  const testBetterAuthFetch = async () => {
    setLoading(true);
    try {
      addLog('📡 Testing Better Auth $fetch...');
      
      const response = await authClient.$fetch('/api/notifications', {
        method: 'GET',
        query: { page: 1, limit: 5 },
      });
      
      addLog(`✅ Better Auth fetch successful!`);
      addLog(`   Data: ${JSON.stringify(response).substring(0, 100)}...`);
    } catch (error: any) {
      addLog(`❌ Better Auth fetch failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test 4: Check what headers are being sent
  const testHeaders = async () => {
    try {
      addLog('🔍 Checking auth headers...');
      
      const session = await authClient.getSession();
      const token = session?.data?.session?.token;
      const userId = session?.data?.user?.id;
      
      if (userId) {
        addLog(`✅ User ID available for x-user-id header`);
        addLog(`   x-user-id: ${userId}`);
      } else {
        addLog('❌ No user ID available');
      }
      
      if (token) {
        addLog(`✅ Token available for Authorization header`);
        addLog(`   Authorization: Bearer ${token.substring(0, 30)}...`);
      } else {
        addLog('❌ No token available');
      }

      addLog('💡 Backend expects x-user-id header for mobile');
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    }
  };

  // Test 5: Full integration test
  const testFullFlow = async () => {
    addLog('🚀 Starting full integration test...');
    await testSession();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testHeaders();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testAxiosRequest();
    addLog('✅ Full test complete!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Better Auth Test Suite</Text>
      
      {isPending ? (
        <ActivityIndicator size="large" />
      ) : (
        <>
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionText}>
              {session?.user ? `Logged in as: ${session.user.email}` : 'Not logged in'}
            </Text>
            <Text style={styles.sessionText}>
              User ID: {session?.user?.id || 'N/A'}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={testSession}>
              <Text style={styles.buttonText}>1. Check Session</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={testHeaders}>
              <Text style={styles.buttonText}>2. Check Headers</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={testAxiosRequest} disabled={loading}>
              <Text style={styles.buttonText}>3. Test Axios</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={testBetterAuthFetch} disabled={loading}>
              <Text style={styles.buttonText}>4. Test $fetch</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={testFullFlow} disabled={loading}>
              <Text style={[styles.buttonText, styles.primaryButtonText]}>
                {loading ? 'Testing...' : 'Run All Tests'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearLogs}>
              <Text style={styles.buttonText}>Clear Logs</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.logContainer}>
            <Text style={styles.logTitle}>Test Results:</Text>
            {results.length === 0 ? (
              <Text style={styles.logText}>No tests run yet. Press a button to start.</Text>
            ) : (
              results.map((result, index) => (
                <Text key={index} style={styles.logText}>
                  {result}
                </Text>
              ))
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sessionInfo: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  sessionText: {
    fontSize: 14,
    marginBottom: 5,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#34C759',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryButtonText: {
    fontWeight: 'bold',
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
  },
  logTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  logText: {
    fontSize: 12,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
});
