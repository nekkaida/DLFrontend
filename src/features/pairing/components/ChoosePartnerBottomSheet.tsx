import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isTablet = width > 768;

interface Partner {
  id: string;
  name: string;
  username?: string;
  displayUsername?: string | null;
  image?: string | null;
  area?: string | null;
  gender?: string | null;
  dmr?: number; // Calculated DMR from questionnaire
}

interface GeneralPartnership {
  id: string;
  player1Id: string;
  player2Id: string;
  player1: Partner;
  player2: Partner;
}

interface ChoosePartnerBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet>;
  partnerships: GeneralPartnership[];
  currentUserId: string;
  seasonId: string;
  isLoading?: boolean;
  onSendInvitation: (partnershipId: string, partnerId: string) => Promise<void>;
}

export const ChoosePartnerBottomSheet: React.FC<ChoosePartnerBottomSheetProps> = ({
  bottomSheetRef,
  partnerships,
  currentUserId,
  seasonId,
  isLoading = false,
  onSendInvitation,
}) => {
  const [sendingId, setSendingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    console.log('🔵 ChoosePartnerBottomSheet received props:', {
      partnerships: partnerships.length,
      currentUserId,
      seasonId,
      isLoading,
      partnershipsData: partnerships
    });
  }, [partnerships, currentUserId, seasonId, isLoading]);

  const handleSendInvitation = useCallback(async (partnershipId: string, partnerId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSendingId(partnershipId);
      await onSendInvitation(partnershipId, partnerId);
    } catch (error) {
      console.error('Error sending season invitation:', error);
    } finally {
      setSendingId(null);
    }
  }, [onSendInvitation]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const renderPartnershipItem = ({ item }: { item: GeneralPartnership }) => {
    const partner = item.player1Id === currentUserId ? item.player2 : item.player1;
    const isSending = sendingId === item.id;
    const dmr = partner.dmr || 0;

    return (
      <View style={styles.partnershipItem}>
        <View style={styles.partnerInfo}>
          {partner.image ? (
            <Image source={{ uri: partner.image }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Text style={styles.defaultAvatarText}>
                {partner.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.partnerDetails}>
            <Text style={styles.partnerName}>{partner.name}</Text>
            <View style={styles.partnerMeta}>
              {dmr > 0 && (
                <View style={styles.dmrBadge}>
                  <Text style={styles.dmrText}>DMR: {dmr.toFixed(1)}</Text>
                </View>
              )}
              {partner.area && (
                <View style={styles.locationBadge}>
                  <Ionicons name="location-outline" size={12} color="#666666" />
                  <Text style={styles.locationText}>{partner.area}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.inviteButton, isSending && styles.inviteButtonDisabled]}
          onPress={() => handleSendInvitation(item.id, partner.id)}
          disabled={isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="send" size={16} color="#FFFFFF" />
              <Text style={styles.inviteButtonText}>Send Invitation</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={['75%']}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose a Partner</Text>
          <Text style={styles.subtitle}>
            Select from your general partnerships to invite to this season
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FEA04D" />
            <Text style={styles.loadingText}>Loading partnerships...</Text>
          </View>
        ) : partnerships.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#BABABA" />
            <Text style={styles.emptyText}>No general partnerships yet</Text>
            <Text style={styles.emptySubtext}>
              Go to Connect → All Players to create general partnerships first
            </Text>
          </View>
        ) : (
          <FlatList
            data={partnerships}
            renderItem={renderPartnershipItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  handleIndicator: {
    backgroundColor: '#BABABA',
    width: 40,
    height: 4,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: isSmallScreen ? 16 : isTablet ? 32 : 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: isSmallScreen ? 20 : isTablet ? 26 : 22,
    fontWeight: '700',
    color: '#1a1a1a',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: isSmallScreen ? 13 : isTablet ? 16 : 14,
    fontWeight: '400',
    color: '#666666',
    fontFamily: 'Inter',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Inter',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: isSmallScreen ? 16 : isTablet ? 20 : 18,
    fontWeight: '600',
    color: '#666666',
    fontFamily: 'Inter',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: isSmallScreen ? 12 : isTablet ? 16 : 14,
    fontWeight: '400',
    color: '#999999',
    fontFamily: 'Inter',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  partnershipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E2E2',
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: isSmallScreen ? 48 : isTablet ? 60 : 52,
    height: isSmallScreen ? 48 : isTablet ? 60 : 52,
    borderRadius: isSmallScreen ? 24 : isTablet ? 30 : 26,
  },
  defaultAvatar: {
    backgroundColor: '#6de9a0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    color: '#FFFFFF',
    fontSize: isSmallScreen ? 18 : isTablet ? 24 : 20,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  partnerDetails: {
    marginLeft: 12,
    flex: 1,
  },
  partnerName: {
    fontSize: isSmallScreen ? 15 : isTablet ? 18 : 16,
    fontWeight: '700',
    color: '#1a1a1a',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  partnerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dmrBadge: {
    backgroundColor: '#FEA04D',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  dmrText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Inter',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEA04D',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    minWidth: 140,
    justifyContent: 'center',
  },
  inviteButtonDisabled: {
    opacity: 0.6,
  },
  inviteButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
});
