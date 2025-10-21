import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isTablet = width > 768;

interface PlayerActionModalProps {
  visible: boolean;
  onClose: () => void;
  onViewProfile: () => void;
  onSendRequest: () => void;
  playerName: string;
  playerImage?: string | null;
  playerBio?: string | null;
}

export const PlayerActionModal: React.FC<PlayerActionModalProps> = ({
  visible,
  onClose,
  onViewProfile,
  onSendRequest,
  playerName,
  playerImage,
  playerBio,
}) => {
  const handleViewProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onViewProfile();
    onClose();
  };

  const handleSendRequest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSendRequest();
    onClose();
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#666666" />
          </TouchableOpacity>

          {/* Player Info */}
          <View style={styles.playerInfo}>
            {playerImage ? (
              <Image source={{ uri: playerImage }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.defaultAvatar]}>
                <Text style={styles.defaultAvatarText}>
                  {playerName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.playerName}>{playerName}</Text>
            {playerBio && <Text style={styles.playerBio}>{playerBio}</Text>}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.viewProfileButton]}
              onPress={handleViewProfile}
              activeOpacity={0.8}
            >
              <Ionicons name="person-circle-outline" size={20} color="#FEA04D" />
              <Text style={styles.viewProfileButtonText}>View Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.sendRequestButton]}
              onPress={handleSendRequest}
              activeOpacity={0.8}
            >
              <Ionicons name="people" size={20} color="#FFFFFF" />
              <Text style={styles.sendRequestButtonText}>Send Pair Request</Text>
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
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: isSmallScreen ? 20 : isTablet ? 28 : 24,
    width: '100%',
    maxWidth: isTablet ? 500 : 400,
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
  playerInfo: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 12,
  },
  avatar: {
    width: isSmallScreen ? 80 : 96,
    height: isSmallScreen ? 80 : 96,
    borderRadius: isSmallScreen ? 40 : 48,
    marginBottom: 16,
  },
  defaultAvatar: {
    backgroundColor: '#6de9a0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    color: '#FFFFFF',
    fontSize: isSmallScreen ? 32 : 40,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  playerName: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: isSmallScreen ? 20 : isTablet ? 24 : 22,
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  playerBio: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: isSmallScreen ? 13 : 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  actionButtons: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  viewProfileButton: {
    backgroundColor: '#FFF9F0',
    borderWidth: 1,
    borderColor: '#FEA04D',
  },
  viewProfileButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: isSmallScreen ? 14 : 16,
    color: '#FEA04D',
  },
  sendRequestButton: {
    backgroundColor: '#FEA04D',
  },
  sendRequestButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: isSmallScreen ? 14 : 16,
    color: '#FFFFFF',
  },
});
