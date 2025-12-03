import { getBackendBaseURL } from '@/config/network';
import { getSportColors } from '@/constants/SportsColor';
import { authClient, useSession } from '@/lib/auth-client';
import { NavBar } from '@/shared/components/layout';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
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
import { CreateMatchModal, MatchFormData } from './components/CreateMatchModal';
import { MessageActionBar } from './components/MessageActionBar';
import { NewMessageBottomSheet } from './components/NewMessageBottomSheet';
import { useChatSocketEvents } from './hooks/useChatSocketEvents';
import { ChatService } from './services/ChatService';
import { useChatStore } from './stores/ChatStore';

import { Thread } from './types';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isTablet = width > 768;

interface ChatScreenProps {
  activeTab?: number;
  onTabPress?: (tabIndex: number) => void;
  sport?: 'pickleball' | 'tennis' | 'padel';
  chatUnreadCount?: number;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  activeTab = 4,
  onTabPress,
  sport = 'pickleball',
  chatUnreadCount = 0,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: session} = useSession();
  const [filteredThreads, setFilteredThreads] = useState<Thread[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showActionBar, setShowActionBar] = useState(false);
  const [showNewMessageSheet, setShowNewMessageSheet] = useState(false);
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
    setShowMatchModal(true);
  };

  const handleCreateMatch = async (matchData: MatchFormData) => {
    console.log('Match created:', matchData);
    
    if (!currentThread || !user) {
      console.error('Cannot create match: missing thread or user');
      toast.error('Cannot create match: missing information');
      return;
    }

    try {
      const backendUrl = getBackendBaseURL();
      const isDoubles = matchData.numberOfPlayers === '4';
      
      // Step 1: Fetch division to check gameType and seasonId
      let partnerId: string | undefined;
      let divisionGameType: string | undefined;
      let seasonId: string | undefined;
      
      if (currentThread.metadata?.divisionId) {
        console.log('🔍 Fetching division data for match creation...');
        
        try {
          const divisionResponse = await fetch(
            `${backendUrl}/api/division/${currentThread.metadata.divisionId}`,
            {
              method: 'GET',
              headers: { 'x-user-id': user.id }
            }
          );
          
          if (!divisionResponse.ok) {
            throw new Error(`Failed to fetch division: ${divisionResponse.status}`);
          }
          
          const divisionResult = await divisionResponse.json();
          const divisionData = divisionResult.data || divisionResult;
          
          divisionGameType = divisionData.gameType?.toUpperCase();
          seasonId = divisionData.seasonId || divisionData.season?.id;
          
          console.log('✅ Division info:', {
            divisionId: divisionData.id,
            gameType: divisionGameType,
            seasonId: seasonId,
          });
        } catch (error) {
          console.error('❌ Failed to fetch division:', error);
          toast.error('Failed to fetch division details');
          return;
        }
      }
      
      // Step 2: If division is DOUBLES type, fetch partnership
      if (divisionGameType === 'DOUBLES' && seasonId) {
        console.log('🎾 Division is DOUBLES type, fetching partnership...');
        
        try {
          const partnershipResponse = await fetch(
            `${backendUrl}/api/pairing/partnership/active/${seasonId}`,
            {
              method: 'GET',
              headers: { 'x-user-id': user.id }
            }
          );
          
          if (!partnershipResponse.ok) {
            throw new Error(`No active partnership found for this season`);
          }
          
          const partnershipResult = await partnershipResponse.json();
          const partnership = partnershipResult?.data;
          
          if (!partnership || !partnership.id) {
            toast.warning('No partner found', {
              description: 'You need to pair up with a partner for doubles divisions',
            });
            return;
          }
          
          // Determine partner ID based on whether user is captain or partner
          partnerId = partnership.captainId === user.id 
            ? partnership.partnerId 
            : partnership.captainId;
          
          console.log('✅ Partner found:', {
            userId: user.id,
            partnerId,
            isCaptain: partnership.captainId === user.id,
          });
          
        } catch (error) {
          console.error('❌ Failed to fetch partnership:', error);
          toast.error('Partner required', {
            description: error instanceof Error ? error.message : 'You must have an active partnership for doubles divisions',
          });
          return;
        }
      }
      
      // Step 3: Convert 12-hour time to 24-hour format
      const convertTo24Hour = (time12h: string): string => {
        const [time, modifier] = time12h.split(' ');
        let [hours, minutes] = time.split(':');
        
        if (hours === '12') {
          hours = modifier === 'AM' ? '00' : '12';
        } else {
          hours = modifier === 'PM' ? String(parseInt(hours, 10) + 12) : hours.padStart(2, '0');
        }
        
        return `${hours}:${minutes}`;
      };

      const time24 = convertTo24Hour(matchData.time);
      const matchDateTime = new Date(`${matchData.date}T${time24}:00`);
      
      console.log('📅 Match date/time:', {
        original: `${matchData.date} ${matchData.time}`,
        converted: `${matchData.date}T${time24}:00`,
        dateObject: matchDateTime.toISOString()
      });
      
      // Step 4: Create the match using the division's gameType
      const matchPayload: any = {
        divisionId: currentThread.metadata?.divisionId,
        matchType: divisionGameType || (isDoubles ? 'DOUBLES' : 'SINGLES'),
        format: 'STANDARD',
        proposedTimes: [matchDateTime.toISOString()],
        location: matchData.location || 'TBD',
        notes: matchData.description,
        courtBooked: matchData.courtBooked || false,
      };
      
      // Add partnerId only for DOUBLES divisions
      if (divisionGameType === 'DOUBLES' && partnerId) {
        matchPayload.partnerId = partnerId;
        console.log('✅ Added partnerId to payload:', partnerId);
      }
      
      console.log('📤 Creating match with payload:', {
        payload: matchPayload,
        payloadString: JSON.stringify(matchPayload, null, 2),
        endpoint: `${backendUrl}/api/match/create`,
        userId: user.id,
        isDoubles,
        hasPartnerId: !!partnerId
      });
      
      const matchResponse = await fetch(`${backendUrl}/api/match/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify(matchPayload),
      });

      console.log('📥 STEP 9: Match creation response:', {
        status: matchResponse.status,
        ok: matchResponse.ok,
        statusText: matchResponse.statusText
      });

      if (!matchResponse.ok) {
        const errorData = await matchResponse.json();
        console.error('❌ Match creation failed:', {
          status: matchResponse.status,
          errorData,
          originalPayload: matchPayload
        });
        throw new Error(errorData.error || 'Failed to create match');
      }

      const matchResult = await matchResponse.json();
      console.log('✅ STEP 10: Match created successfully:', {
        matchId: matchResult.id,
        fullResult: matchResult
      });

      // Step 2: Send a message to the thread with match data for UI display
      const messageContent = `📅 Match scheduled for ${matchData.date} at ${matchData.time}`;
      const messagePayload = {
        senderId: user.id,
        content: messageContent,
        messageType: 'MATCH',
        matchId: matchResult.id,
        matchData: {
          matchId: matchResult.id,
          date: matchData.date,
          time: matchData.time,
          duration: matchData.duration || 2,
          numberOfPlayers: matchData.numberOfPlayers,
          location: matchData.location || 'TBD',
          fee: matchData.fee,
          description: matchData.description,
          sportType: currentThread.sportType || 'PICKLEBALL',
          leagueName: currentThread.name || 'Match',
          courtBooked: matchData.courtBooked || false,
          status: 'SCHEDULED',
          participants: matchResult.participants || [], // Include participants from match creation
        },
      };

      const messageResponse = await fetch(`${backendUrl}/api/chat/threads/${currentThread.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify(messagePayload),
      });

      if (!messageResponse.ok) {
        const errorData = await messageResponse.json();
        throw new Error(errorData.error || 'Failed to send match message');
      }

      console.log('✅ Match message sent to thread');
      
      setShowMatchModal(false);
      toast.success('Match created successfully!');
    } catch (error) {
      console.error('❌ Error creating match:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create match');
    }

    // MOCK DATA (commented out for reference)
    // const matchMessage = {
    //   id: `match-${Date.now()}`,
    //   threadId: currentThread.id,
    //   senderId: user.id,
    //   content: `📅 Match scheduled for ${matchData.date} at ${matchData.time}`,
    //   timestamp: new Date(),
    //   isRead: false,
    //   isDelivered: true,
    //   type: 'match' as const,
    //   matchData: {
    //     ...matchData,
    //     location: matchData.location || 'Home',
    //     sportType: currentThread.sportType || 'PICKLEBALL',
    //     leagueName: currentThread.name || 'League Match',
    //     courtBooked: true,
    //   },
    //   metadata: {
    //     sender: {
    //       id: user.id,
    //       name: user.name || user.username || 'You',
    //       username: user.username,
    //     },
    //   },
    // };
    // const currentMessages = messages[currentThread.id] || [];
    // const updatedMessages = [...currentMessages, matchMessage as any];
    // useChatStore.setState((state) => ({
    //   messages: {
    //     ...state.messages,
    //     [currentThread.id]: updatedMessages,
    //   },
    // }));
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

  // Get header content based on chat type
  const getHeaderContent = () => {
    if (!currentThread || !user?.id) return { title: 'Chat', subtitle: null, sportType: null };

    if (currentThread.type === 'group') {
      // Group chat: show group name and participant count
      return {
        title: currentThread.name || 'Group Chat',
        subtitle: null, //TO DO update this to show the season name 
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

  // Generate participant preview text for group chats
  const getParticipantPreview = () => {
    if (!currentThread || currentThread.type !== 'group') return '';
    
    const participantNames = currentThread.participants
      .slice(0, 5) // Show first 5 participants
      .map(p => {
        // Get first name only
        const firstName = p.name?.split(' ')[0] || p.username || 'Unknown';
        // Shorten long names
        return firstName.length > 10 ? firstName.substring(0, 8) + '.' : firstName;
      });
    
    // Add ellipsis if there are more participants
    if (currentThread.participants.length > 5) {
      return participantNames.join(', ') + '...';
    }
    
    return participantNames.join(', ');
  };

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
          keyboardVerticalOffset={0}
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
            
            {currentThread?.type === 'group' ? (
              // Group chat header with avatar
              <>
                <View style={styles.groupHeaderAvatar}>
                  <View style={[
                    styles.groupAvatarCircle,
                    { backgroundColor: sportColors.background }
                  ]}>
                    <Text style={styles.groupAvatarText}>
                      {currentThread.name?.charAt(0)?.toUpperCase() || 'G'}
                    </Text>
                  </View>
                  {/* Badge number overlay */}
                  <View style={styles.groupBadgeOverlay}>
                    <Text style={styles.groupBadgeNumber}>
                      {currentThread.participants.length}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.groupHeaderContent}>
                  <View style={styles.groupHeaderTopRow}>
                    {sportColors.label && (
                      <View style={[
                        styles.sportBadgeHeader,
                        { 
                          borderColor: sportColors.badgeColor,
                          borderWidth: 1.5,
                        }
                      ]}>
                        <Text style={[
                          styles.sportBadgeHeaderText,
                          { color: sportColors.badgeColor }
                        ]}>{sportColors.label}</Text>
                      </View>
                    )}
                    <Text style={styles.groupHeaderTitle} numberOfLines={1}>
                      {headerContent.title}
                    </Text>
                  </View>
                  <Text style={styles.groupHeaderParticipants} numberOfLines={1}>
                    {getParticipantPreview()}
                  </Text>
                  
                  {/* Action buttons */}
                  <View style={styles.groupActionButtons}>
                    <TouchableOpacity 
                      style={[
                        styles.actionButton, 
                        styles.primaryActionButton,
                        { backgroundColor: sportColors.background }
                      ]}
                      activeOpacity={0.8}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push('/standings');
                      }}
                    >
                      <Text style={styles.primaryActionText}>View Standings</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.secondaryActionButton]}
                      activeOpacity={0.8}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push({
                          pathname: '/match/all-matches',
                          params: {
                            divisionId: currentThread.metadata?.divisionId,
                            sportType: currentThread.sportType || 'PICKLEBALL',
                            leagueName: currentThread.name || 'League',
                            seasonName: 'Season 1 (2025)', // TODO: Get from thread metadata
                          },
                        });
                      }}
                    >
                      <Text style={styles.secondaryActionText}>View All Matches</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : (
              // Direct chat header (original design)
              <>
                <View style={styles.chatHeaderContent}>
                  <View style={styles.chatHeaderTitleRow}>
                    <Text style={styles.chatHeaderTitle} numberOfLines={1}>
                      {headerContent.title}
                    </Text>
                  </View>
                  {headerContent.subtitle && (
                    <Text style={styles.chatHeaderSubtitle} numberOfLines={1}>
                      {headerContent.subtitle}
                    </Text>
                  )}
                </View>
              </>
            )}
            
            <TouchableOpacity style={styles.headerAction}>
              <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <MessageWindow
            key={refreshKey}
            messages={messages[currentThread.id] || []}
            threadId={currentThread.id}
            isGroupChat={currentThread.type === 'group'}
            sportType={currentThread.sportType}
            onReply={handleReply}
            onDeleteMessage={handleDeleteMessageAction}
            onLongPress={handleLongPress}
          />
          
          <MessageInput 
            onSendMessage={handleSendMessage}
            onhandleMatch={handleMatch}
            replyingTo={replyingTo}
            onCancelReply={handleCancelReply}
            sportType={currentThread.sportType}
            isGroupChat={currentThread.type === 'group'}
          />
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.threadsContainer}>
          {/* Header with Chats title and New Message button */}
          <View style={[styles.chatsHeaderContainer, { paddingTop: STATUS_BAR_HEIGHT }]}>
            <Text style={styles.chatsTitle}>Chats</Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowNewMessageSheet(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.newMessageButton}>New Message</Text>
            </TouchableOpacity>
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
          {onTabPress && (
            <NavBar
              activeTab={activeTab}
              onTabPress={onTabPress}
              sport={sport}
              badgeCounts={{ chat: chatUnreadCount }}
            />
          )}
        </View>
      )}

        {/* Create Match Modal */}
      {currentThread?.type === 'group' && (
        <CreateMatchModal
          visible={showMatchModal}
          onClose={() => setShowMatchModal(false)}
          leagueInfo={{
            name: currentThread.name || 'League Chat',
            season: 'Season 1', // TODO: Get from thread metadata
            division: 'Division I', // TODO: Get from thread metadata
            sportType: currentThread.sportType || 'PICKLEBALL',
          }}
          onCreateMatch={handleCreateMatch}
        />
      )}

      {/* New Message Bottom Sheet */}
      <NewMessageBottomSheet
        visible={showNewMessageSheet}
        onClose={() => setShowNewMessageSheet(false)}
        onSelectUser={async (userId, userName) => {
          if (!user?.id) {
            toast.error('Please log in to start a conversation');
            return;
          }

          try {
            console.log('Creating/finding thread with user:', userId, userName);

            // Create or find existing direct message thread
            const thread = await ChatService.createThread(
              user.id,
              [userId],
              false // isGroup = false for direct messages
            );

            console.log('Thread created/found:', thread.id, thread.name);

            // Close the bottom sheet
            setShowNewMessageSheet(false);

            // Set the thread as current to navigate to the chat
            setCurrentThread(thread);

            // Load messages for the thread
            loadMessages(thread.id);

            // Refresh the threads list to include the new thread
            loadThreads(user.id);

          } catch (error) {
            console.error('Error creating thread:', error);
            toast.error('Failed to start conversation. Please try again.');
          }
        }}
      />
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
  // Group chat header styles
  groupHeaderAvatar: {
    position: 'relative',
    marginRight: 12,
  },
  groupAvatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupAvatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  groupBadgeOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  groupBadgeNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111827',
  },
  groupHeaderContent: {
    flex: 1,
    justifyContent: 'center',
  },
  groupHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  sportBadgeHeader: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  sportBadgeHeaderText: {
    fontSize: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  groupHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    flexShrink: 1,
  },
  groupHeaderSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
  },
  groupHeaderParticipants: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  groupActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionButton: {
    backgroundColor: '#863A73',
  },
  secondaryActionButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  primaryActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
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
  chatsHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: isSmallScreen ? 16 : isTablet ? 24 : 20,
    paddingVertical: 12,
  },
  chatsTitle: {
    fontSize: isSmallScreen ? 28 : isTablet ? 36 : 32,
    fontWeight: '700',
    color: '#111827',
  },
  newMessageButton: {
    fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    fontWeight: '600',
    color: '#FEA04D',
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