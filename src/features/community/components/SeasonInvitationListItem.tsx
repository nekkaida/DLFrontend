import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { SeasonInvitation } from '../types';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isTablet = width > 768;

interface SeasonInvitationListItemProps {
  invitation: SeasonInvitation;
  type: 'received' | 'sent';
  actionLoading: string | null;
  onAccept?: (invitationId: string) => void;
  onDeny?: (invitationId: string) => void;
  onCancel?: (invitationId: string) => void;
}

export const SeasonInvitationListItem: React.FC<SeasonInvitationListItemProps> = ({
  invitation,
  type,
  actionLoading,
  onAccept,
  onDeny,
  onCancel,
}) => {
  const player = type === 'received' ? invitation.sender : invitation.recipient;
  if (!player) return null;

  const isPending = invitation.status === 'PENDING';
  const isActionLoading = actionLoading === invitation.id;

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
          <Text style={styles.subtitle}>Season Invitation</Text>
          <Text style={styles.seasonName}>{invitation.season.name}</Text>
          <Text style={styles.statusText}>{invitation.status}</Text>
        </View>
      </View>
      {isPending && (
        <View style={styles.actionButtons}>
          {type === 'received' ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.denyButton]}
                onPress={() => onDeny?.(invitation.id)}
                disabled={isActionLoading}
              >
                {isActionLoading ? (
                  <ActivityIndicator size="small" color="#F44336" />
                ) : (
                  <Text style={styles.denyButtonText}>Deny</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => onAccept?.(invitation.id)}
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
              onPress={() => onCancel?.(invitation.id)}
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
  subtitle: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: isSmallScreen ? 11 : isTablet ? 14 : 12,
    color: '#999999',
    marginTop: 2,
  },
  seasonName: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: isSmallScreen ? 11 : isTablet ? 14 : 12,
    color: '#999999',
    marginTop: 2,
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
  denyButton: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  denyButtonText: {
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
