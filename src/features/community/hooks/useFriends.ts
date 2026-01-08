import { useState, useCallback } from 'react';
import { useSession, authClient } from '@/lib/auth-client';
import { getBackendBaseURL } from '@/config/network';
import { toast } from 'sonner-native';
import { Friend, FriendRequestsData } from '../types';

export const useFriends = () => {
  const { data: session } = useSession();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequestsData>({ sent: [], received: [] });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    try {
      if (!session?.user?.id) {
        return;
      }

      const backendUrl = getBackendBaseURL();
      const authResponse = await authClient.$fetch(`${backendUrl}/api/pairing/friends`, {
        method: 'GET',
      });

      if (authResponse && (authResponse as any).data) {
        const friendsData = (authResponse as any).data.data || (authResponse as any).data;
        setFriends(friendsData);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  }, [session?.user?.id]);

  const fetchFriendRequests = useCallback(async () => {
    try {
      if (!session?.user?.id) {
        return;
      }

      const backendUrl = getBackendBaseURL();
      const authResponse = await authClient.$fetch(`${backendUrl}/api/pairing/friendship/requests`, {
        method: 'GET',
      });

      if (authResponse && (authResponse as any).data) {
        const requestsData = (authResponse as any).data.data || (authResponse as any).data;
        setFriendRequests(requestsData);
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  }, [session?.user?.id]);

  const sendFriendRequest = useCallback(async (recipientId: string) => {
    try {
      if (!session?.user?.id) {
        return;
      }

      const backendUrl = getBackendBaseURL();
      const response = await authClient.$fetch(`${backendUrl}/api/pairing/friendship/request`, {
        method: 'POST',
        body: { recipientId },
      });

      const responseData = (response as any).data || response;
      if (responseData && responseData.message) {
        toast.success('Success', {
          id: `friend-request-sent-${recipientId}`,
          description: 'Friend request sent!',
        });
        await fetchFriendRequests();
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Error', {
        id: `friend-request-error-${recipientId}`,
        description: 'Failed to send friend request',
      });
      throw error;
    }
  }, [session?.user?.id, fetchFriendRequests]);

  const acceptFriendRequest = useCallback(async (friendshipId: string) => {
    try {
      setActionLoading(friendshipId);

      const backendUrl = getBackendBaseURL();
      const response = await authClient.$fetch(
        `${backendUrl}/api/pairing/friendship/${friendshipId}/accept`,
        {
          method: 'POST',
        }
      );

      const responseData = (response as any).data || response;
      if (responseData && responseData.message) {
        toast.success('Success', {
          id: `friend-request-accepted-${friendshipId}`,
          description: 'Friend request accepted!',
        });
        await fetchFriendRequests();
        await fetchFriends();
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error('Error', {
        id: `friend-accept-error-${friendshipId}`,
        description: 'Failed to accept request',
      });
    } finally {
      setActionLoading(null);
    }
  }, [fetchFriendRequests, fetchFriends]);

  const rejectFriendRequest = useCallback(async (friendshipId: string) => {
    try {
      setActionLoading(friendshipId);

      const backendUrl = getBackendBaseURL();
      const response = await authClient.$fetch(
        `${backendUrl}/api/pairing/friendship/${friendshipId}/reject`,
        {
          method: 'POST',
        }
      );

      const responseData = (response as any).data || response;
      if (responseData && responseData.message) {
        toast.success('Request rejected', {
          id: `friend-request-rejected-${friendshipId}`,
        });
        await fetchFriendRequests();
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      toast.error('Error', {
        id: `friend-reject-error-${friendshipId}`,
        description: 'Failed to reject request',
      });
    } finally {
      setActionLoading(null);
    }
  }, [fetchFriendRequests]);

  const removeFriend = useCallback(async (friendshipId: string) => {
    try {
      setActionLoading(friendshipId);

      const backendUrl = getBackendBaseURL();
      const response = await authClient.$fetch(
        `${backendUrl}/api/pairing/friendship/${friendshipId}`,
        {
          method: 'DELETE',
        }
      );

      const responseData = (response as any).data || response;
      if (responseData && responseData.message) {
        toast.success('Friend removed', {
          id: `friend-removed-${friendshipId}`,
        });
        await fetchFriends();
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      toast.error('Error', {
        id: `friend-remove-error-${friendshipId}`,
        description: 'Failed to remove friend',
      });
    } finally {
      setActionLoading(null);
    }
  }, [fetchFriends]);

  return {
    friends,
    friendRequests,
    actionLoading,
    fetchFriends,
    fetchFriendRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
  };
};
