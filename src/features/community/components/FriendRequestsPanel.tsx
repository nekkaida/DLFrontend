// src/features/community/components/FriendRequestsPanel.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { FriendRequestListItem } from './FriendRequestListItem';
import { FriendRequest, FriendRequestsData } from '../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type PanelTab = 'received' | 'sent';

interface FriendRequestsPanelProps {
  visible: boolean;
  friendRequests: FriendRequestsData;
  actionLoading: string | null;
  onClose: () => void;
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onCancel: (requestId: string) => void;
}

export const FriendRequestsPanel: React.FC<FriendRequestsPanelProps> = ({
  visible,
  friendRequests,
  actionLoading,
  onClose,
  onAccept,
  onReject,
  onCancel,
}) => {
  const [activeTab, setActiveTab] = useState<PanelTab>('received');

  const receivedCount = friendRequests.received.length;
  const sentCount = friendRequests.sent.length;

  const handleTabPress = (tab: PanelTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const currentList: FriendRequest[] =
    activeTab === 'received' ? friendRequests.received : friendRequests.sent;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Friend Requests</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={22} color="#555555" />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabRow}>
            {(['received', 'sent'] as PanelTab[]).map((tab) => {
              const count = tab === 'received' ? receivedCount : sentCount;
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.panelTab, isActive && styles.panelTabActive]}
                  onPress={() => handleTabPress(tab)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.panelTabText, isActive && styles.panelTabTextActive]}>
                    {tab === 'received' ? 'Received' : 'Sent'}
                    {count > 0 ? ` (${count})` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* List */}
          <ScrollView
            style={styles.listContainer}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {currentList.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons
                  name={activeTab === 'received' ? 'mail-outline' : 'paper-plane-outline'}
                  size={40}
                  color="#CCCCCC"
                />
                <Text style={styles.emptyTitle}>
                  {activeTab === 'received' ? 'No requests received' : 'No requests sent'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {activeTab === 'received'
                    ? "Friend requests from others will appear here."
                    : "Your pending friend requests will appear here."}
                </Text>
              </View>
            ) : (
              currentList.map((request, index) => (
                <React.Fragment key={request.id}>
                  <FriendRequestListItem
                    request={request}
                    type={activeTab}
                    actionLoading={actionLoading}
                    onAccept={onAccept}
                    onReject={onReject}
                    onCancel={onCancel}
                  />
                  {index < currentList.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.78,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDDDDD',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    color: '#1a1a1a',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* Tabs */
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  panelTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  panelTabActive: {
    backgroundColor: '#FEA04D',
  },
  panelTabText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 13,
    color: '#777777',
  },
  panelTabTextActive: {
    color: '#FFFFFF',
  },
  /* List */
  listContainer: {
    flex: 0,
    maxHeight: SCREEN_HEIGHT * 0.52,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 60,
  },
  /* Empty */
  empty: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
    gap: 10,
  },
  emptyTitle: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#444444',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 13,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});
