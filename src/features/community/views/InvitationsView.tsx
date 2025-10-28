import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SubTabSwitcher, SeasonInvitationListItem, FriendRequestListItem, EmptyState } from '../components';
import { SeasonInvitationsData, FriendRequestsData } from '../types';

interface InvitationsViewProps {
  friendRequests: FriendRequestsData;
  seasonInvitations: SeasonInvitationsData;
  friendActionLoading: string | null;
  invitationActionLoading: string | null;
  onAcceptFriendRequest: (requestId: string) => void;
  onRejectFriendRequest: (requestId: string) => void;
  onAcceptInvitation: (invitationId: string) => void;
  onDenyInvitation: (invitationId: string) => void;
  onCancelInvitation: (invitationId: string) => void;
}

export const InvitationsView: React.FC<InvitationsViewProps> = ({
  friendRequests,
  seasonInvitations,
  friendActionLoading,
  invitationActionLoading,
  onAcceptFriendRequest,
  onRejectFriendRequest,
  onAcceptInvitation,
  onDenyInvitation,
  onCancelInvitation,
}) => {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  const totalReceived = friendRequests.received.length + seasonInvitations.received.length;
  const totalSent = friendRequests.sent.length + seasonInvitations.sent.length;

  const tabs = [
    { key: 'received', label: 'Received', count: totalReceived },
    { key: 'sent', label: 'Sent', count: totalSent },
  ];

  const receivedFriendRequests = friendRequests.received;
  const receivedSeasonInvitations = seasonInvitations.received;
  const sentFriendRequests = friendRequests.sent;
  const sentSeasonInvitations = seasonInvitations.sent;

  const hasReceivedItems = activeTab === 'received' && (receivedFriendRequests.length > 0 || receivedSeasonInvitations.length > 0);
  const hasSentItems = activeTab === 'sent' && (sentFriendRequests.length > 0 || sentSeasonInvitations.length > 0);

  return (
    <View style={styles.container}>
      <SubTabSwitcher activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as any)} tabs={tabs} />

      {!hasReceivedItems && !hasSentItems ? (
        <EmptyState
          icon="mail-outline"
          title={`No ${activeTab} requests`}
          subtitle={
            activeTab === 'received'
              ? 'Friend requests and season invitations you receive will appear here'
              : 'Friend requests and season invitations you send will appear here'
          }
        />
      ) : (
        <View style={styles.listContainer}>
          {activeTab === 'received' ? (
            <>
              {/* Friend Requests */}
              {receivedFriendRequests.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Friend Requests</Text>
                  {receivedFriendRequests.map((request, index) => (
                    <React.Fragment key={request.id}>
                      <FriendRequestListItem
                        request={request}
                        type="received"
                        actionLoading={friendActionLoading}
                        onAccept={onAcceptFriendRequest}
                        onReject={onRejectFriendRequest}
                      />
                      {index < receivedFriendRequests.length - 1 && <View style={styles.divider} />}
                    </React.Fragment>
                  ))}
                  {receivedSeasonInvitations.length > 0 && <View style={styles.sectionDivider} />}
                </>
              )}

              {/* Season Invitations */}
              {receivedSeasonInvitations.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Season Invitations</Text>
                  {receivedSeasonInvitations.map((invitation, index) => (
                    <React.Fragment key={invitation.id}>
                      <SeasonInvitationListItem
                        invitation={invitation}
                        type="received"
                        actionLoading={invitationActionLoading}
                        onAccept={onAcceptInvitation}
                        onDeny={onDenyInvitation}
                      />
                      {index < receivedSeasonInvitations.length - 1 && <View style={styles.divider} />}
                    </React.Fragment>
                  ))}
                </>
              )}
            </>
          ) : (
            <>
              {/* Sent Friend Requests */}
              {sentFriendRequests.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Friend Requests</Text>
                  {sentFriendRequests.map((request, index) => (
                    <React.Fragment key={request.id}>
                      <FriendRequestListItem
                        request={request}
                        type="sent"
                        actionLoading={friendActionLoading}
                        onCancel={onRejectFriendRequest}
                      />
                      {index < sentFriendRequests.length - 1 && <View style={styles.divider} />}
                    </React.Fragment>
                  ))}
                  {sentSeasonInvitations.length > 0 && <View style={styles.sectionDivider} />}
                </>
              )}

              {/* Sent Season Invitations */}
              {sentSeasonInvitations.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Season Invitations</Text>
                  {sentSeasonInvitations.map((invitation, index) => (
                    <React.Fragment key={invitation.id}>
                      <SeasonInvitationListItem
                        invitation={invitation}
                        type="sent"
                        actionLoading={invitationActionLoading}
                        onCancel={onCancelInvitation}
                      />
                      {index < sentSeasonInvitations.length - 1 && <View style={styles.divider} />}
                    </React.Fragment>
                  ))}
                </>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    fontFamily: 'Inter',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E2E2E2',
    marginVertical: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E2E2',
    marginLeft: 60,
  },
});
