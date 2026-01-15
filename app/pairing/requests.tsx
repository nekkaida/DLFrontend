import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  Dimensions,
  Platform,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSession, authClient } from '@/lib/auth-client';
import { getBackendBaseURL } from '@/config/network';
import { toast } from 'sonner-native';
import { scale, verticalScale, moderateScale } from '@/core/utils/responsive';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isTablet = width > 768;

interface PlayerInfo {
  id: string;
  name: string;
  username: string;
  displayUsername: string | null;
  image: string | null;
}

interface SeasonInfo {
  id: string;
  name: string;
  sport: string;
  registrationStart: Date;
  registrationEnd: Date;
}

interface PairRequest {
  id: string;
  requesterId: string;
  recipientId: string;
  seasonId: string;
  message: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'DENIED' | 'EXPIRED' | 'CANCELLED';
  createdAt: string;
  respondedAt: string | null;
  expiresAt: string;
  requester?: PlayerInfo;
  recipient?: PlayerInfo;
  season: SeasonInfo;
}

interface PairRequestsData {
  sent: PairRequest[];
  received: PairRequest[];
}

const STATUS_COLORS = {
  PENDING: '#FEA04D',
  ACCEPTED: '#4CAF50',
  DENIED: '#F44336',
  EXPIRED: '#9E9E9E',
  CANCELLED: '#9E9E9E',
};

const STATUS_LABELS = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  DENIED: 'Denied',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
};

export default function PairRequestsScreen() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [requests, setRequests] = useState<PairRequestsData>({ sent: [], received: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Entry animation values
  const headerEntryOpacity = useRef(new Animated.Value(0)).current;
  const headerEntryTranslateY = useRef(new Animated.Value(-20)).current;
  const contentEntryOpacity = useRef(new Animated.Value(0)).current;
  const contentEntryTranslateY = useRef(new Animated.Value(30)).current;
  const hasPlayedEntryAnimation = useRef(false);

  const fetchRequests = useCallback(async (showLoader = true) => {
    try {
      if (!session?.user?.id) return;

      if (showLoader) setIsLoading(true);

      const backendUrl = getBackendBaseURL();
      const response = await authClient.$fetch(`${backendUrl}/api/pairing/requests`, {
        method: 'GET',
      });

      console.log('Pair requests response:', response);

      if (response && (response as any).data) {
        const requestsData = (response as any).data.data || (response as any).data;
        setRequests(requestsData);
      }
    } catch (error) {
      console.error('Error fetching pair requests:', error);
      toast.error('Error', {
        description: 'Failed to load pair requests',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchRequests();
    }
  }, [session?.user?.id, fetchRequests]);

  // Entry animation effect
  useEffect(() => {
    if (!isLoading && !hasPlayedEntryAnimation.current) {
      hasPlayedEntryAnimation.current = true;
      Animated.stagger(80, [
        // Header slides down
        Animated.parallel([
          Animated.spring(headerEntryOpacity, {
            toValue: 1,
            tension: 50,
            friction: 8,
            useNativeDriver: false,
          }),
          Animated.spring(headerEntryTranslateY, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: false,
          }),
        ]),
        // Content slides up
        Animated.parallel([
          Animated.spring(contentEntryOpacity, {
            toValue: 1,
            tension: 50,
            friction: 8,
            useNativeDriver: false,
          }),
          Animated.spring(contentEntryTranslateY, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: false,
          }),
        ]),
      ]).start();
    }
  }, [
    isLoading,
    headerEntryOpacity,
    headerEntryTranslateY,
    contentEntryOpacity,
    contentEntryTranslateY,
  ]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchRequests(false);
  };

  const handleAccept = async (requestId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setActionLoading(requestId);

      // Find the request being accepted to get season info
      const acceptedRequest = requests.received.find(r => r.id === requestId);

      const backendUrl = getBackendBaseURL();
      const response = await authClient.$fetch(
        `${backendUrl}/api/pairing/request/${requestId}/accept`,
        {
          method: 'POST',
        }
      );

      const responseData = (response as any).data || response;
      if (responseData && responseData.success) {
        toast.success('Success', {
          description: 'Partnership created! Ready to pay.',
        });

        // Navigate back to seasons screen so user can proceed to payment
        if (acceptedRequest?.seasonId) {
          router.push({
            pathname: '/user-dashboard/seasons',
            params: {
              seasonId: acceptedRequest.seasonId,
              // Pass additional params if available from season data
            }
          });
        } else {
          // Fallback: just refresh the list
          await fetchRequests(false);
        }
      } else {
        toast.error('Error', {
          description: responseData.message || 'Failed to accept request',
        });
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Error', {
        description: 'Failed to accept pair request',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeny = (requestId: string, requesterName: string, seasonId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Alert.alert(
      'Deny Pair Request',
      `Are you sure you want to deny the pair request from ${requesterName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Deny',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(requestId);

              const backendUrl = getBackendBaseURL();
              const response = await authClient.$fetch(
                `${backendUrl}/api/pairing/request/${requestId}/deny`,
                {
                  method: 'POST',
                }
              );

              const responseData = (response as any).data || response;
              if (responseData && responseData.success) {
                toast.success('Request denied', {
                  description: 'You can find another partner to pair with',
                });
                // Navigate to doubles team pairing page to find a new partner
                router.push({
                  pathname: '/user-dashboard/doubles-team-pairing',
                  params: { seasonId }
                });
              } else {
                toast.error('Error', {
                  description: responseData.message || 'Failed to deny request',
                });
              }
            } catch (error) {
              console.error('Error denying request:', error);
              toast.error('Error', {
                description: 'Failed to deny pair request',
              });
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleCancel = (requestId: string, recipientName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Alert.alert(
      'Cancel Pair Request',
      `Are you sure you want to cancel your request to ${recipientName}?`,
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(requestId);

              const backendUrl = getBackendBaseURL();
              const response = await authClient.$fetch(
                `${backendUrl}/api/pairing/request/${requestId}`,
                {
                  method: 'DELETE',
                }
              );

              const responseData = (response as any).data || response;
              if (responseData && responseData.success) {
                toast.success('Request cancelled');
                await fetchRequests(false);
              } else {
                toast.error('Error', {
                  description: responseData.message || 'Failed to cancel request',
                });
              }
            } catch (error) {
              console.error('Error cancelling request:', error);
              toast.error('Error', {
                description: 'Failed to cancel pair request',
              });
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h remaining`;
    return 'Expires soon';
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const renderRequestCard = (request: PairRequest, isReceived: boolean) => {
    const player = isReceived ? request.requester : request.recipient;
    if (!player) return null;

    const isPending = request.status === 'PENDING';
    const isActionLoading = actionLoading === request.id;

    return (
      <View key={request.id} style={styles.requestCard}>
        <View style={styles.requestHeader}>
          {player.image ? (
            <Image source={{ uri: player.image }} style={styles.playerAvatar} />
          ) : (
            <View style={[styles.playerAvatar, styles.defaultAvatar]}>
              <Text style={styles.defaultAvatarText}>
                {player.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.requestInfo}>
            <Text style={styles.playerName}>{player.name}</Text>
            {player.displayUsername && (
              <Text style={styles.playerUsername}>@{player.displayUsername}</Text>
            )}
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: STATUS_COLORS[request.status] },
            ]}
          >
            <Text style={styles.statusText}>{STATUS_LABELS[request.status]}</Text>
          </View>
        </View>

        <View style={styles.seasonInfo}>
          <Ionicons name="trophy" size={moderateScale(14)} color="#666666" />
          <Text style={styles.seasonText}>{request.season.name}</Text>
        </View>

        {request.message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Message:</Text>
            <Text style={styles.messageText}>{request.message}</Text>
          </View>
        )}

        <View style={styles.requestFooter}>
          <View style={styles.timeInfo}>
            <Text style={styles.timeText}>{getTimeAgo(request.createdAt)}</Text>
            {isPending && (
              <Text style={styles.expiryText}>{getTimeRemaining(request.expiresAt)}</Text>
            )}
          </View>

          {isPending && (
            <View style={styles.actionButtons}>
              {isReceived ? (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.denyButton]}
                    onPress={() => handleDeny(request.id, player.name, request.seasonId)}
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
                    onPress={() => handleAccept(request.id)}
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
                  onPress={() => handleCancel(request.id, player.name)}
                  disabled={isActionLoading}
                >
                  {isActionLoading ? (
                    <ActivityIndicator size="small" color="#666666" />
                  ) : (
                    <Text style={styles.cancelButtonText}>Cancel Request</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const displayedRequests = activeTab === 'received' ? requests.received : requests.sent;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FDEDE0', '#FFFFFF']}
        locations={[0, 0.3]}
        style={styles.backgroundGradient}
      />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerEntryOpacity,
            transform: [{ translateY: headerEntryTranslateY }],
          }
        ]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={moderateScale(28)} color="#FEA04D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pair Requests</Text>
        <View style={styles.headerButton} />
      </Animated.View>

      {/* Tab Switcher + Content */}
      <Animated.View
        style={{
          flex: 1,
          opacity: contentEntryOpacity,
          transform: [{ translateY: contentEntryTranslateY }],
        }}
      >
      <View style={styles.tabSwitcher}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'received' && styles.tabButtonActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('received');
          }}
        >
          <Text style={[styles.tabButtonText, activeTab === 'received' && styles.tabButtonTextActive]}>
            Received ({requests.received.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'sent' && styles.tabButtonActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('sent');
          }}
        >
          <Text style={[styles.tabButtonText, activeTab === 'sent' && styles.tabButtonTextActive]}>
            Sent ({requests.sent.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#FEA04D" />
            <Text style={styles.emptyStateText}>Loading requests...</Text>
          </View>
        ) : displayedRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={moderateScale(64)} color="#BABABA" />
            <Text style={styles.emptyStateText}>
              No {activeTab === 'received' ? 'received' : 'sent'} requests
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {activeTab === 'received'
                ? 'Pair requests you receive will appear here'
                : 'Find a partner to send a pair request'}
            </Text>
          </View>
        ) : (
          displayedRequests.map((request) => renderRequestCard(request, activeTab === 'received'))
        )}
      </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: verticalScale(300),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    zIndex: 1,
  },
  headerButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: moderateScale(isSmallScreen ? 16 : 18),
    color: '#1a1a1a',
  },
  tabSwitcher: {
    flexDirection: 'row',
    paddingHorizontal: scale(isSmallScreen ? 12 : 16),
    paddingBottom: verticalScale(16),
    gap: scale(12),
  },
  tabButton: {
    flex: 1,
    paddingVertical: verticalScale(isSmallScreen ? 8 : 10),
    paddingHorizontal: scale(isSmallScreen ? 12 : 16),
    borderRadius: moderateScale(8),
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#FEA04D',
  },
  tabButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: moderateScale(isSmallScreen ? 12 : 14),
    color: '#666666',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(isSmallScreen ? 16 : 20),
    paddingBottom: verticalScale(40),
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(60),
    paddingHorizontal: scale(40),
  },
  emptyStateText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: moderateScale(isSmallScreen ? 16 : 18),
    color: '#666666',
    marginTop: verticalScale(16),
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: moderateScale(isSmallScreen ? 12 : 14),
    color: '#999999',
    marginTop: verticalScale(8),
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: verticalScale(12),
    borderWidth: 1,
    borderColor: '#E2E2E2',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: verticalScale(2) },
        shadowOpacity: 0.1,
        shadowRadius: moderateScale(4),
      },
      android: {
        elevation: 2,
      },
    }),
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  playerAvatar: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
  },
  defaultAvatar: {
    backgroundColor: '#6de9a0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    color: '#FFFFFF',
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  requestInfo: {
    flex: 1,
    marginLeft: scale(12),
  },
  playerName: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: moderateScale(isSmallScreen ? 14 : 16),
    color: '#1a1a1a',
  },
  playerUsername: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: moderateScale(isSmallScreen ? 12 : 13),
    color: '#666666',
    marginTop: verticalScale(2),
  },
  statusBadge: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(6),
  },
  statusText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: moderateScale(11),
    color: '#FFFFFF',
  },
  seasonInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    marginBottom: verticalScale(12),
  },
  seasonText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: moderateScale(isSmallScreen ? 12 : 13),
    color: '#666666',
  },
  messageContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    marginBottom: verticalScale(12),
  },
  messageLabel: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: moderateScale(12),
    color: '#666666',
    marginBottom: verticalScale(4),
  },
  messageText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: moderateScale(isSmallScreen ? 13 : 14),
    color: '#1a1a1a',
    lineHeight: moderateScale(20),
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeInfo: {
    flex: 1,
  },
  timeText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: moderateScale(12),
    color: '#999999',
  },
  expiryText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: moderateScale(12),
    color: '#FEA04D',
    marginTop: verticalScale(2),
  },
  actionButtons: {
    flexDirection: 'row',
    gap: scale(8),
  },
  actionButton: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(8),
    minWidth: scale(80),
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
    fontSize: moderateScale(13),
    color: '#F44336',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  acceptButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: moderateScale(13),
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
    fontSize: moderateScale(13),
    color: '#666666',
  },
});
