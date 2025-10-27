import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MessageInput } from './components/chat-input';
import { MessageWindow } from './components/chat-window';
import { useChatStore } from './stores/ChatStore';
import { Thread } from './types';

export const ChatScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredThreads, setFilteredThreads] = useState<Thread[]>([]);
  
  const {
    currentThread,
    messages,
    threads,
    isLoading,
    error,
    setCurrentThread,
    loadMessages,
    loadThreads,
    sendMessage,
    addMessage,
    setConnectionStatus,
  } = useChatStore();

  useEffect(() => {
    console.log('ChatScreen: Component mounted, loading threads...');
    // loadThreads();
    setConnectionStatus(true);
  }, []);

  useEffect(() => {
    console.log('ChatScreen: threads changed:', threads?.length || 0);
    setFilteredThreads(threads || []);
  }, [threads]);

  useEffect(() => {
    if (currentThread) {
      loadMessages(currentThread.id);
    }
  }, [currentThread]);

  useEffect(() => {
    if (!threads) return;
    
    if (searchQuery.trim() === '') {
      setFilteredThreads(threads);
    } else {
      const filtered = threads.filter(thread =>
        thread.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.participants.some(participant =>
          participant.name.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        thread.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredThreads(filtered);
    }
  }, [searchQuery, threads]);

  const handleThreadSelect = (thread: Thread) => {
    console.log('ChatScreen: Thread selected:', thread.name);
    setCurrentThread(thread);
  };

  const handleSendMessage = (content: string) => {
    // if (currentThread) {
    //   sendMessage(currentThread.id, content);
    // }
    console.log("tests")
  };

  const handleBackToThreads = () => {
    setCurrentThread(null);
    setSearchQuery('');
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  console.log('ChatScreen: Rendering - currentThread:', currentThread?.name, 'threads count:', threads?.length);

  // Show loading state
  if (isLoading && (!threads || threads.length === 0)) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#863A73" />
          <Text style={styles.loadingText}>Loading chats...</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (error && (!threads || threads.length === 0)) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <Text style={styles.errorSubtext}>Pull down to retry</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {currentThread ? (
        <View style={styles.chatContainer}>
          <View style={styles.chatHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackToThreads}
              activeOpacity={0.7}
            >
            <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <View style={styles.chatHeaderContent}>
              <Text style={styles.chatHeaderTitle}>{currentThread.name}</Text>
              <Text style={styles.chatHeaderSubtitle}>
                {currentThread.participants.length} participants
              </Text>
            </View>
            <TouchableOpacity style={styles.headerAction}>
              <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <MessageWindow
            messages={messages[currentThread.id] || []}
            threadId={currentThread.id}
          />
          <MessageInput onSendMessage={handleSendMessage} />
        </View>
      ) : (
        <View style={styles.threadsContainer}>
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          {/* <ThreadList 
            threads={filteredThreads}
            onThreadSelect={handleThreadSelect} 
          /> */}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  chatContainer: {
    flex: 1,
  },
  threadsContainer: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:  '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  chatHeaderContent: {
    flex: 1,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  chatHeaderSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  headerAction: {
    padding: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});