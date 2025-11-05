import { useSession } from '@/lib/auth-client';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChatService } from '../../chat/services/ChatService';
import { useChatStore } from '../../chat/stores/ChatStore';
import { Player } from '../types';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isTablet = width > 768;

const SPORT_COLORS: { [key: string]: string } = {
  Tennis: '#A2E047',
  tennis: '#A2E047',
  Pickleball: '#A04DFE',
  pickleball: '#A04DFE',
  Padel: '#4DABFE',
  padel: '#4DABFE',
};

interface PlayerInfoModalProps {
  visible: boolean;
  player: Player | null;
  isFriend: boolean;
  onClose: () => void;
  onSendFriendRequest: () => void;
}

export const PlayerInfoModal: React.FC<PlayerInfoModalProps> = ({
  visible,
  player,
  isFriend,
  onClose,
  onSendFriendRequest,
}) => {
  const { data: session } = useSession();
  const currentUser = session?.user;
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const { threads, setCurrentThread, loadThreads } = useChatStore();

  if (!player) return null;

  const handleViewProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    router.push(`/player-profile/${player.id}` as any);
  };

  const handleChat = async () => {
    if (!currentUser?.id || !player.id) {
      console.error('Missing user IDs');
      return;
    }

    try {
      setIsLoadingChat(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      console.log('Checking for existing thread between:', currentUser.id, 'and', player.id);

      // Check if thread already exists
      const existingThread = threads.find(thread => 
        thread.type === 'direct' && 
        thread.participants.some(p => p.id === player.id) &&
        thread.participants.some(p => p.id === currentUser.id)
      );

      if (existingThread) {
        console.log('Found existing thread:', existingThread.id);
        setCurrentThread(existingThread);
      } else {
        console.log('No existing thread, creating new one');
        const newThread = await ChatService.createThread(
          currentUser.id,
          [player.id],
          false
        );
        
        console.log('Created new thread:', newThread.id);
        await loadThreads(currentUser.id);
        setCurrentThread(newThread);
      }
      
      onClose();
      
      router.push({
        pathname: '/user-dashboard',
        params: { view: 'chat' }
      });
      
    } catch (error) {
      console.error('Error handling chat:', error);
    } finally {
      setIsLoadingChat(false);
    }
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.content} onPress={(e) => e.stopPropagation()}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#666666" />
          </TouchableOpacity>

          {/* Player Avatar */}
          <View style={styles.avatarSection}>
            {player.image ? (
              <Image source={{ uri: player.image }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.defaultAvatarContainer]}>
                <Text style={[styles.defaultAvatarText, { fontSize: 40 }]}>
                  {player.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Player Name */}
          <Text style={styles.playerName}>{player.name}</Text>

          {/* Sport Pills */}
          {player.sports && player.sports.length > 0 && (
            <View style={styles.sportPills}>
              {player.sports.map((sport, index) => (
                <View
                  key={index}
                  style={[styles.sportPill, { backgroundColor: SPORT_COLORS[sport] || '#A2E047' }]}
                >
                  <Text style={styles.sportPillText}>{sport}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleChat}
              disabled={isLoadingChat}
            >
              {isLoadingChat ? (
                <ActivityIndicator size="small" color="#FEA04D" />
              ) : (
                <Ionicons name="chatbubble" size={20} color="#FEA04D" />
              )}
              <Text style={styles.actionButtonText}>Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleViewProfile}>
              <Ionicons name="person" size={20} color="#FEA04D" />
              <Text style={styles.actionButtonText}>View Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={onSendFriendRequest}>
              <Ionicons name={isFriend ? "checkmark-circle" : "person-add"} size={20} color="#FEA04D" />
              <Text style={styles.actionButtonText}>
                {isFriend ? "Friends" : "Add Friend"}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: isSmallScreen ? 20 : isTablet ? 28 : 24,
    width: '90%',
    maxWidth: isTablet ? 420 : 380,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: isSmallScreen ? 80 : isTablet ? 120 : 100,
    height: isSmallScreen ? 80 : isTablet ? 120 : 100,
    borderRadius: isSmallScreen ? 40 : isTablet ? 60 : 50,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  defaultAvatarContainer: {
    backgroundColor: '#6de9a0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  playerName: {
    fontSize: isSmallScreen ? 18 : isTablet ? 24 : 20,
    fontWeight: '700',
    color: '#1a1a1a',
    fontFamily: 'Inter',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 16,
  },
  sportPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  sportPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  sportPillText: {
    color: '#FFFFFF',
    fontSize: isSmallScreen ? 9 : isTablet ? 12 : 10,
    fontFamily: 'Inter',
    fontWeight: '600',
    opacity: 0.95,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  actionButton: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: isSmallScreen ? 10 : isTablet ? 13 : 11,
    color: '#6b7280',
    marginTop: 4,
  },
});
