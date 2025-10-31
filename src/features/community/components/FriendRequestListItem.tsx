import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { FriendRequest } from '../types';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isTablet = width > 768;

interface FriendRequestListItemProps {
  request: FriendRequest;
  type: 'received' | 'sent';
  actionLoading: string | null;
  onAccept?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
}

export const FriendRequestListItem: React.FC<FriendRequestListItemProps> = ({
  request,
  type,
  actionLoading,
  onAccept,
  onReject,
  onCancel,
}) => {
  const player = type === 'received' ? request.requester : request.recipient;
  if (!player) return null;

  const isPending = request.status === 'PENDING';
  const isActionLoading = actionLoading === request.id;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {player.image ? (
          <Image source={{ uri: player.image }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.defaultAvatarContainer]}>
            <Text style={styles.defaultAvatarText}>
              {player.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.content}>
          <Text style={styles.name}>{player.name}</Text>
          <Text style={styles.statusText}>{request.status}</Text>
        </View>
      </View>
      {isPending && (
        <View style={styles.actionButtons}>
          {type === 'received' ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => onReject?.(request.id)}
                disabled={isActionLoading}
              >
                {isActionLoading ? (
                  <ActivityIndicator size="small" color="#F44336" />
                ) : (
                  <Text style={styles.rejectButtonText}>Reject</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => onAccept?.(request.id)}
                disabled={isActionLoading}
              >
                {isActionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.acceptButtonText}>Accept</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => onCancel?.(request.id)}
              disabled={isActionLoading}
            >
              {isActionLoading ? (
                <ActivityIndicator size="small" color="#666666" />
              ) : (
                <Text style={styles.cancelButtonText}>Cancel</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: isSmallScreen ? 40 : isTablet ? 56 : 48,
    height: isSmallScreen ? 40 : isTablet ? 56 : 48,
    borderRadius: isSmallScreen ? 20 : isTablet ? 28 : 24,
  },
  defaultAvatarContainer: {
    backgroundColor: '#6de9a0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    color: '#FFFFFF',
    fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  name: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    letterSpacing: -0.3,
    color: '#1a1a1a',
  },
  statusText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: isSmallScreen ? 11 : isTablet ? 14 : 12,
    color: '#FEA04D',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingLeft: isSmallScreen ? 48 : isTablet ? 60 : 52,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  rejectButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 13,
    color: '#F44336',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  acceptButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 13,
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#E2E2E2',
  },
  cancelButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 13,
    color: '#666666',
  },
});
