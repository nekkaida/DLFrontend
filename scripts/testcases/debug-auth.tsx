/**
 * DEBUG FILE - Add this to your app temporarily to see what Better Auth stores
 * 
 * Usage: Import this component and render it anywhere in your app during development
 * It will log all the session details to help you understand the structure
 */

import * as SecureStore from 'expo-secure-store';
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { authClient, useSession } from '../../lib/auth-client';

export default function DebugAuth() {
  const { data: session, isPending } = useSession();

  useEffect(() => {
    debugAuth();
  }, []);

  const debugAuth = async () => {
    console.log('🔍 BETTER AUTH DEBUG - EXPO');
    console.log('========================================\n');

    // 1. Check what's in SecureStore
    console.log('📦 1. CHECKING SECURE STORE:');
    try {
      const keys = [
        'deuceleague-session',
        'deuceleague.session.token',
        'better-auth.session_token',
        'session',
        'accessToken',
      ];

      for (const key of keys) {
        const value = await SecureStore.getItemAsync(key);
        if (value) {
          console.log(`   ✅ Found "${key}":`, value);
          try {
            const parsed = JSON.parse(value);
            console.log(`   📝 Parsed:`, JSON.stringify(parsed, null, 2));
          } catch {
            console.log(`   📝 Not JSON, raw value:`, value);
          }
        } else {
          console.log(`   ❌ "${key}" not found`);
        }
      }
    } catch (err) {
      console.error('   ⚠️ SecureStore error:', err);
    }

    console.log('\n📦 2. CHECKING ALL SECURE STORE KEYS:');
    try {
      // Try to list all keys (this might not work on all Expo versions)
      const allKeys = await SecureStore.getItemAsync('*');
      console.log('   All keys:', allKeys);
    } catch {
      console.log('   ⚠️ Cannot list all keys');
    }

    // 2. Check authClient.getSession()
    console.log('\n🔐 3. CHECKING authClient.getSession():');
    try {
      const sessionData = await authClient.getSession();
      console.log('   Session data:', JSON.stringify(sessionData, null, 2));
      
      if (sessionData?.data) {
        console.log('\n   🔍 Breaking down session.data:');
        console.log('   - session:', sessionData.data.session);
        console.log('   - user:', sessionData.data.user);
        
        if (sessionData.data.session) {
          console.log('\n   🎫 Session tokens:');
          console.log('   - token:', sessionData.data.session.token);
        }
      }
    } catch (err) {
      console.error('   ⚠️ authClient.getSession() error:', err);
    }

    // 3. Check useSession() hook data
    console.log('\n🪝 4. CHECKING useSession() HOOK:');
    console.log('   isPending:', isPending);
    console.log('   session:', JSON.stringify(session, null, 2));

    // 4. Check what headers Better Auth would send
    console.log('\n📤 5. WHAT SHOULD WE SEND TO BACKEND?');
    try {
      const sessionData = await authClient.getSession();
      const token = sessionData?.data?.session?.token;
      
      console.log('\n   ✅ Session Token (use this):');
      if (token) {
        console.log(`   Authorization: Bearer ${token}`);
        console.log(`   OR`);
        console.log(`   Cookie: better-auth.session_token=${token}`);
      } else {
        console.log('   ❌ No session token found');
      }
      
      console.log('\n   💡 Recommended approach:');
      console.log('   Use authClient.$fetch() instead of axios - it handles auth automatically');
      
    } catch (err) {
      console.error('   ⚠️ Error:', err);
    }

    console.log('\n========================================');
    console.log('🔍 END DEBUG');
    console.log('========================================\n');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll}>
        <Text style={styles.title}>Better Auth Debug</Text>
        <Text style={styles.text}>Check console logs for detailed session info</Text>
        <Text style={styles.text}>Session status: {isPending ? 'Loading...' : session ? 'Logged in' : 'Not logged in'}</Text>
        {session?.user && (
          <View style={styles.userInfo}>
            <Text style={styles.label}>User ID: {session.user.id}</Text>
            <Text style={styles.label}>Email: {session.user.email}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  scroll: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
  },
  userInfo: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
  },
});
