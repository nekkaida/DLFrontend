import { getBackendBaseURL } from '@/config/network';
import { authClient, useSession } from '@/lib/auth-client';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
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
import { toast } from 'sonner-native';
import { MessageInput } from './components/chat-input';
import { ThreadList } from './components/chat-list';
import { MessageWindow } from './components/chat-window';
import { MessageActionBar } from './components/MessageActionBar';
import { useChatSocketEvents } from './hooks/useChatSocketEvents';
import { ChatService } from './services/ChatService';
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [showActionBar, setShowActionBar] = useState(false);
  const insets = useSafeAreaInsets();
  
  const user = session?.user;
  const STATUS_BAR_HEIGHT = insets.top;
  
  const {
    currentThread,
    messages,
    threads,
    isLoading,
    error,
    replyingTo,
    setCurrentThread,
    loadMessages,
    loadThreads,
    sendMessage,
    addMessage,
    setConnectionStatus,
    updateThread,
    setReplyingTo,
    handleDeleteMessage: deleteMessageFromStore,
  } = useChatStore();

  // Setup Socket.IO event listeners for real-time chat
  const { isConnected: socketConnected } = useChatSocketEvents(
    currentThread?.id || null,
    user?.id || ''
  );

  // Force re-render when messages change
  useEffect(() => {
    if (currentThread?.id && messages[currentThread.id]) {
      console.log('💬 Messages updated for current thread:', messages[currentThread.id].length);
      setRefreshKey(prev => prev + 1);
    }
  }, [messages, currentThread?.id]);

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

  const handleThreadSelect = async (thread: Thread) => {
    console.log('ChatScreen: Thread selected:', thread.name);
    setCurrentThread(thread);
    
    // Mark thread as read when opening it
    if (user?.id && thread.unreadCount > 0) {
      console.log('ChatScreen: Marking thread as read, unread count:', thread.unreadCount);
      try {
        await ChatService.markAllAsRead(thread.id, user.id);
        console.log('ChatScreen: Thread marked as read successfully');
        updateThread({
          ...thread,
          unreadCount: 0,
        });
      } catch (error) {
        console.error('ChatScreen: Error marking thread as read:', error);
      }
    }
  };

  const handleSendMessage = (content: string, replyToId?: string) => {
    if (!currentThread || !user?.id) return;

    console.log('Sending message:', {
      threadId: currentThread.id,
      senderId: user.id,
      content,
      replyToId,
    });

    sendMessage(currentThread.id, user.id, content, replyToId);
    
    if (replyingTo) {
      setReplyingTo(null);
    }
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

  const handleReply = (message: any) => {
    // console.log('📝 Reply to message:', message.id);
    // console.log('📝 Message content:', message.content);
    // console.log('📝 Message sender:', message.metadata?.sender);
    // console.log('📝 Full message object:', JSON.stringify(message, null, 2));
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleLongPress = (message: any) => {
    console.log('Long press on message:', message.id);
    setSelectedMessage(message);
    setShowActionBar(true);
  };

  const handleCloseActionBar = () => {
    setShowActionBar(false);
    setSelectedMessage(null);
  };

  const handleActionBarReply = () => {
    if (selectedMessage) {
      handleReply(selectedMessage);
    }
  };

  const handleActionBarCopy = async () => {
    if (selectedMessage?.content && !selectedMessage.metadata?.isDeleted) {
      try {
        await Clipboard.setStringAsync(selectedMessage.content);
        toast.success('Message copied to clipboard');
      } catch (error) {
        console.error('Failed to copy:', error);
        toast.error('Failed to copy message');
      }
    }
  };

  const handleActionBarDelete = async () => {
    if (selectedMessage) {
      // Show confirmation toast
      toast('Delete this message?', {
        action: {
          label: 'Delete',
          onClick: async () => {
            try {
              await deleteMessageFromStore(selectedMessage.id, currentThread?.id || '');
              toast.success('Message deleted');
            } catch (error) {
              console.error('Failed to delete:', error);
              toast.error('Failed to delete message');
            }
          },
        },
        cancel: {
          label: 'Cancel',
          onClick: () => {},
        },
      });
    }
  };

  const handleDeleteMessageAction = async (messageId: string) => {
    if (!currentThread) {
      return;
    }
    try {
      await deleteMessageFromStore(messageId, currentThread.id);
      console.log('✅ Message deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete message:', error);
      toast.error('Failed to delete message. Please try again.');
    }
  };

  // Get sport colors based on sport type
  const getSportColors = (sportType: 'PICKLEBALL' | 'TENNIS' | 'PADEL' | null | undefined) => {
    switch (sportType) {
      case 'PICKLEBALL':
        return { background: '#863A73', badgeColor: '#A855F7', label: 'PICKLEBALL' };
      case 'TENNIS':
        return { background: '#65B741', badgeColor: '#22C55E', label: 'TENNIS' };
      case 'PADEL':
        return { background: '#3B82F6', badgeColor: '#60A5FA', label: 'PADEL' };
      default:
        return { background: '#863A73', badgeColor: null, label: null };
    }
  };

  // Get header content based on chat type
  const getHeaderContent = () => {
    if (!currentThread || !user?.id) return { title: 'Chat', subtitle: null, sportType: null };

    if (currentThread.type === 'group') {
      // Group chat: show group name and participant count
      return {
        title: currentThread.name || 'Group Chat',
        subtitle: `${currentThread.participants.length} participants`,
        sportType: currentThread.sportType
      };
    } else {
      // Direct chat: show other participant's name and username
      const otherParticipant = currentThread.participants.find(
        participant => participant.id !== user.id
      );
      
      if (otherParticipant) {
        return {
          title: otherParticipant.name || otherParticipant.username || 'Unknown User',
          subtitle: otherParticipant.username ? `@${otherParticipant.username}` : null,
          sportType: null
        };
      } else {
        return {
          title: 'Chat',
          subtitle: null,
          sportType: null
        };
      }
    }
  };

  const headerContent = getHeaderContent();
  const sportColors = getSportColors(headerContent.sportType);

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
      
      {/* Uncomment to see socket debug info */}
      {/* <SocketDebugPanel /> */}
      
      {currentThread ? (
        <KeyboardAvoidingView 
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? STATUS_BAR_HEIGHT : 0}
        >
          {/* Message Action Bar */}
          <MessageActionBar
            visible={showActionBar}
            isCurrentUser={selectedMessage?.senderId === user?.id}
            onReply={handleActionBarReply}
            onCopy={handleActionBarCopy}
            onDelete={handleActionBarDelete}
            onClose={handleCloseActionBar}
          />

          <View style={[styles.chatHeader, { paddingTop: STATUS_BAR_HEIGHT + 12 }]}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackToThreads}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            
            <View style={styles.chatHeaderContent}>
              <View style={styles.chatHeaderTitleRow}>
                <Text style={styles.chatHeaderTitle} numberOfLines={1}>
                  {headerContent.title}
                </Text>
                {currentThread?.type === 'group' && sportColors.label && (
                  <View style={[
                    styles.sportBadge,
                    { 
                      borderColor: sportColors.badgeColor,
                      borderWidth: 1.5,
                    }
                  ]}>
                    <Text style={[
                      styles.sportBadgeText,
                      { color: sportColors.badgeColor }
                    ]}>{sportColors.label}</Text>
                  </View>
                )}
              </View>
              {headerContent.subtitle && (
                <Text style={styles.chatHeaderSubtitle} numberOfLines={1}>
                  {headerContent.subtitle}
                </Text>
              )}
            </View>
            
            {/* <SocketTestButton threadId={currentThread.id} /> */}
            
            <TouchableOpacity style={styles.headerAction}>
              <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <MessageWindow
            key={refreshKey}
            messages={messages[currentThread.id] || []}
            threadId={currentThread.id}
            isGroupChat={currentThread.type === 'group'}
            onReply={handleReply}
            onDeleteMessage={handleDeleteMessageAction}
            onLongPress={handleLongPress}
          />
          
          <MessageInput 
            onSendMessage={handleSendMessage}
            onhandleMatch={handleMatch}
            replyingTo={replyingTo}
            onCancelReply={handleCancelReply}
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
  chatHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatHeaderTitle: {
    fontSize: isSmallScreen ? 16 : isTablet ? 20 : 18,
    fontWeight: '600',
    color: '#111827',
    lineHeight: isSmallScreen ? 20 : isTablet ? 24 : 22,
    flexShrink: 1,
  },
  sportBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
  },
  sportBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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