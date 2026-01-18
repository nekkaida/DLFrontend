import { getBackendBaseURL } from '@/config/network';
import {
  scale,
  verticalScale,
  moderateScale,
} from '@/core/utils/responsive';
import { authClient, useSession } from '@/lib/auth-client';
import { ChatService } from '@/src/features/chat/services/ChatService';
import { useChatStore } from '@/src/features/chat/stores/ChatStore';
import { chatLogger } from '@/utils/logger';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

// User API response type from getAvailableUsers endpoint
interface UserApiResponse {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
}

interface FetchResponse {
  data?: {
    success: boolean;
    data: UserApiResponse[];
    count: number;
  };
}

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isTablet = width > 768;

interface Player {
  id: string;
  name: string;
  username?: string;
  image?: string | null;
}

export default function NewMessageScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<Player[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const insets = useSafeAreaInsets();
  const { setCurrentThread, loadThreads } = useChatStore();

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(
        (user) =>
          user.name?.toLowerCase().includes(query) ||
          user.username?.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const backendUrl = getBackendBaseURL();

      // Fetch all available users (excludes admins and existing DM partners)
      const response = await authClient.$fetch(
        `${backendUrl}/api/chat/threads/users/available/${session.user.id}`,
        { method: 'GET' }
      );

      const typedResponse = response as FetchResponse | null;
      if (typedResponse?.data?.data) {
        const usersData = typedResponse.data.data;

        // Transform users to player format
        const usersList: Player[] = usersData.map((item: UserApiResponse) => ({
          id: item.id,
          name: item.name || 'Unknown',
          username: item.username || undefined,
          image: item.image,
        }));

        setUsers(usersList);
        setFilteredUsers(usersList);
      }
    } catch (error) {
      chatLogger.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = useCallback(async (user: Player) => {
    if (!session?.user?.id) {
      toast.error('Please log in to start a conversation');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics not available
    }

    try {
      chatLogger.debug('Creating/finding thread with user:', user.id, user.name);

      // Create or find existing direct message thread
      const thread = await ChatService.createThread(
        session.user.id,
        [user.id],
        false // isGroup = false for direct messages
      );

      chatLogger.debug('Thread created/found:', thread.id, thread.name);

      // Set the thread as current
      setCurrentThread(thread);

      // Refresh the threads list to include the new thread
      loadThreads(session.user.id);

      // Navigate to the chat thread using native navigation
      // Replace current modal with the chat screen
      router.replace({
        pathname: '/chat/[threadId]',
        params: { threadId: thread.id }
      });

    } catch (error) {
      chatLogger.error('Error creating thread:', error);
      toast.error('Failed to start conversation. Please try again.');
    }
  }, [session?.user?.id, setCurrentThread, loadThreads]);

  const handleClose = useCallback(() => {
    router.back();
  }, []);

  const renderUserItem = useCallback(({ item }: { item: Player }) => (
    <View style={styles.playerItem}>
      <View style={styles.playerLeft}>
        <View style={styles.avatarContainer}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Text style={styles.defaultAvatarText}>
                {item.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{item.name}</Text>
          {item.username && (
            <Text style={styles.playerUsername}>@{item.username}</Text>
          )}
        </View>
      </View>
      <Pressable
        style={({ pressed }) => [styles.chatButton, pressed && { opacity: 0.7 }]}
        onPress={() => handleSelectUser(item)}
      >
        <Ionicons name="chatbubble-outline" size={moderateScale(18)} color="#FFFFFF" />
        <Text style={styles.chatButtonText}>Chat</Text>
      </Pressable>
    </View>
  ), [handleSelectUser]);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={moderateScale(56)} color="#BABABA" />
      <Text style={styles.emptyText}>
        {searchQuery.trim() ? 'No users found' : 'No users available'}
      </Text>
      <Text style={styles.emptySubtext}>
        {searchQuery.trim()
          ? 'Try adjusting your search'
          : 'You have already messaged all available users'}
      </Text>
    </View>
  ), [searchQuery]);

  const renderLoading = useCallback(() => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#FEA04D" />
      <Text style={styles.loadingText}>Loading users...</Text>
    </View>
  ), []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Handle indicator for swipe gesture visual */}
      <View style={styles.handleContainer}>
        <View style={styles.handle} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.title}>New Message</Text>
        <Pressable
          onPress={handleClose}
          style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="close" size={moderateScale(18)} color="#6B7280" />
        </Pressable>
      </View>

      {/* Search Bar - Regular TextInput works perfectly! */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={moderateScale(20)} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery('')}
              style={({ pressed }) => [styles.clearButton, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="close-circle" size={moderateScale(20)} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </View>

      {/* User List - Regular FlatList */}
      <FlatList
        data={isLoading ? [] : filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={isLoading ? renderLoading : renderEmpty}
        contentContainerStyle={[
          !isLoading && filteredUsers.length === 0
            ? styles.emptyListContainer
            : styles.listContent,
          { paddingBottom: verticalScale(20) + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: verticalScale(-4) },
        shadowOpacity: 0.1,
        shadowRadius: moderateScale(8),
      },
      android: {
        elevation: 8,
      },
    }),
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(4),
  },
  handle: {
    width: scale(40),
    height: verticalScale(4),
    backgroundColor: '#BABABA',
    borderRadius: moderateScale(2),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerSpacer: {
    width: scale(32),
  },
  closeButton: {
    width: scale(32),
    height: verticalScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: moderateScale(isSmallScreen ? 16 : isTablet ? 20 : 18),
    fontWeight: '600',
    color: '#111827',
  },
  searchContainer: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    paddingHorizontal: scale(12),
    paddingVertical: Platform.OS === 'android' ? verticalScale(4) : verticalScale(8),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: verticalScale(40),
  },
  searchIcon: {
    marginRight: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(isSmallScreen ? 14 : isTablet ? 18 : 16),
    color: '#111827',
    paddingVertical: Platform.OS === 'android' ? verticalScale(8) : verticalScale(4),
    paddingHorizontal: 0,
  },
  clearButton: {
    padding: scale(4),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: verticalScale(12),
    fontSize: moderateScale(14),
    color: '#6B7280',
  },
  listContent: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(40),
  },
  emptyListContainer: {
    flex: 1,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  playerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: scale(12),
  },
  avatar: {
    width: scale(48),
    height: verticalScale(48),
    borderRadius: moderateScale(24),
  },
  defaultAvatar: {
    backgroundColor: '#6de9a0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    color: '#FFFFFF',
    fontSize: moderateScale(18),
    fontWeight: '600',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#111827',
    marginBottom: verticalScale(2),
  },
  playerUsername: {
    fontSize: moderateScale(14),
    color: '#6B7280',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEA04D',
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(8),
    gap: scale(6),
  },
  chatButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(32),
    paddingVertical: verticalScale(60),
  },
  emptyText: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#6B7280',
    marginTop: verticalScale(16),
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: moderateScale(14),
    color: '#9CA3AF',
    marginTop: verticalScale(8),
    textAlign: 'center',
    lineHeight: verticalScale(20),
  },
});
