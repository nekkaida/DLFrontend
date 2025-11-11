import { getBackendBaseURL } from '@/config/network';
import { authClient, useSession } from '@/lib/auth-client';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageInput } from './components/chat-input';
import { ThreadList } from './components/chat-list';
import { MessageWindow } from './components/chat-window';
import { useChatSocketEvents } from './hooks/useChatSocketEvents';
import { useChatStore } from './stores/ChatStore';
import { Thread } from './types';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isTablet = width > 768;

export const ChatScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: session} = useSession();
  const [filteredThreads, setFilteredThreads] = useState<Thread[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const insets = useSafeAreaInsets();
  
  const user = session?.user;
  const STATUS_BAR_HEIGHT = insets.top;
  
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

  // Setup Socket.IO event listeners for real-time chat
  const { isConnected: socketConnected } = useChatSocketEvents(
    currentThread?.id || null,
    user?.id || ''
  );

  // Fetch profile data when component mounts
  useEffect(() => {
    if (session?.user?.id) {
      fetchProfileData();
    }
  }, [session?.user?.id]);

  const fetchProfileData = async () => {
    try {
      if (!session?.user?.id) {
        console.log(
          "ChatScreen: No session user ID available for profile data"
        );
        return;
      }

      const backendUrl = getBackendBaseURL();
      console.log(
        "ChatScreen: Fetching profile data from:",
        `${backendUrl}/api/player/profile/me`
      );

      const authResponse = await authClient.$fetch(
        `${backendUrl}/api/player/profile/me`,
        {
          method: "GET",
        }
      );

      console.log("ChatScreen: Profile API response:", authResponse);

      if (
        authResponse &&
        (authResponse as any).data &&
        (authResponse as any).data.data
      ) {
        console.log(
          "ChatScreen: Setting profile data:",
          (authResponse as any).data.data
        );
        setProfileData((authResponse as any).data.data);
      } else if (authResponse && (authResponse as any).data) {
        console.log(
          "ChatScreen: Setting profile data (direct):",
          (authResponse as any).data
        );
        setProfileData((authResponse as any).data);
      } else {
        console.error(
          "ChatScreen: No profile data received from authClient"
        );
      }
    } catch (error) {
      console.error("ChatScreen: Error fetching profile data:", error);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    loadThreads(user.id);
    setConnectionStatus(true);
  }, [user]);

  useEffect(() => {
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
    if (!currentThread || !user?.id) return;

    console.log('Sending message:', {
      threadId: currentThread.id,
      senderId: user.id,
      content,
    });

    sendMessage(currentThread.id, user.id, content);
  };

  const handleBackToThreads = () => {
    setCurrentThread(null);
    setSearchQuery('');
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleMatch = () => {
    console.log('Create match button pressed');
    // TO DO ADD MATCH LOGIC LATER
  };

  // Get header content based on chat type
  const getHeaderContent = () => {
    if (!currentThread || !user?.id) return { title: 'Chat', subtitle: null };

    if (currentThread.type === 'group') {
      // Group chat: show group name and participant count
      return {
        title: currentThread.name || 'Group Chat',
        subtitle: `${currentThread.participants.length} participants`
      };
    } else {
      // Direct chat: show other participant's name and username
      const otherParticipant = currentThread.participants.find(
        participant => participant.id !== user.id
      );
      
      if (otherParticipant) {
        return {
          title: otherParticipant.name || otherParticipant.username || 'Unknown User',
          subtitle: otherParticipant.username ? `@${otherParticipant.username}` : null
        };
      } else {
        return {
          title: 'Chat',
          subtitle: null
        };
      }
    }
  };

  const headerContent = getHeaderContent();

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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {currentThread ? (
        <KeyboardAvoidingView 
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? STATUS_BAR_HEIGHT : 0}
        >
          <View style={[styles.chatHeader, { paddingTop: STATUS_BAR_HEIGHT + 12 }]}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackToThreads}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            
            <View style={styles.chatHeaderContent}>
              <Text style={styles.chatHeaderTitle} numberOfLines={1}>
                {headerContent.title}
              </Text>
              {headerContent.subtitle && (
                <Text style={styles.chatHeaderSubtitle} numberOfLines={1}>
                  {headerContent.subtitle}
                </Text>
              )}
            </View>
            
            <TouchableOpacity style={styles.headerAction}>
              <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <MessageWindow
            messages={messages[currentThread.id] || []}
            threadId={currentThread.id}
            isGroupChat={currentThread.type === 'group'}
          />
          
          <MessageInput 
            onSendMessage={handleSendMessage}
            onhandleMatch={handleMatch}
          />
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.threadsContainer}>
          {/* Header with profile picture */}
          <View style={[styles.headerContainer, { paddingTop: STATUS_BAR_HEIGHT }]}>
            <TouchableOpacity 
              style={styles.headerProfilePicture}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/profile');
              }}
            >
              {(profileData?.image || session?.user?.image) ? (
                <Image 
                  source={{ uri: profileData?.image || session?.user?.image }}
                  style={styles.headerProfileImage}
                />
              ) : (
                <View style={styles.defaultHeaderAvatarContainer}>
                  <Text style={styles.defaultHeaderAvatarText}>
                    {(profileData?.name || session?.user?.name)?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            
            <View style={styles.headerRight} />
          </View>

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
           <ThreadList 
            onThreadSelect={handleThreadSelect}
          /> 
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
    paddingHorizontal: isSmallScreen ? 12 : isTablet ? 24 : 16,
    paddingVertical: isSmallScreen ? 6 : isTablet ? 10 : 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'android' ? 4 : 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    color: '#111827',
    paddingVertical: Platform.OS === 'android' ? 8 : 4,
    paddingHorizontal: 0,
  },
  clearButton: {
    padding: 4,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isSmallScreen ? 12 : isTablet ? 24 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    minHeight: 60,
    width: '100%',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  chatHeaderContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeaderTitle: {
    fontSize: isSmallScreen ? 16 : isTablet ? 20 : 18,
    fontWeight: '600',
    color: '#111827',
    lineHeight: isSmallScreen ? 20 : isTablet ? 24 : 22,
  },
  chatHeaderSubtitle: {
    fontSize: isSmallScreen ? 12 : isTablet ? 16 : 14,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: isSmallScreen ? 14 : isTablet ? 18 : 16,
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
    fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    color: '#6B7280',
  },
  errorText: {
    fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: isSmallScreen ? 12 : isTablet ? 16 : 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: isSmallScreen ? 16 : isTablet ? 24 : 20,
    paddingVertical: isSmallScreen ? 4 : isTablet ? 8 : 6,
    minHeight: isSmallScreen ? 36 : isTablet ? 44 : 40,
  },
  headerProfilePicture: {
    width: isSmallScreen ? 40 : isTablet ? 56 : 48,
    height: isSmallScreen ? 40 : isTablet ? 56 : 48,
    borderRadius: isSmallScreen ? 20 : isTablet ? 28 : 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerProfileImage: {
    width: '100%',
    height: '100%',
  },
  defaultHeaderAvatarContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#6de9a0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultHeaderAvatarText: {
    color: '#FFFFFF',
    fontSize: isSmallScreen ? 16 : isTablet ? 22 : 18,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  headerRight: {
    width: isSmallScreen ? 40 : isTablet ? 56 : 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});