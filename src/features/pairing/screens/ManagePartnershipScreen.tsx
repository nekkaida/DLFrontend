import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authClient, useSession } from '@/lib/auth-client';
import { getBackendBaseURL } from '@/config/network';
import { PartnershipCard } from '../components/PartnershipCard';
import { usePartnershipMonitor } from '../hooks/usePartnershipMonitor';
import { useWithdrawalRequestMonitor } from '../hooks/useWithdrawalRequestMonitor';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

interface ManagePartnershipScreenProps {
  seasonId: string;
}

export default function ManagePartnershipScreen({ seasonId }: ManagePartnershipScreenProps) {
  const [partnership, setPartnership] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const insets = useSafeAreaInsets();

  // Monitor partnership for dissolution by partner
  const { isMonitoring: isMonitoringPartnership } = usePartnershipMonitor({
    seasonId: seasonId,
    enabled: !!partnership, // Only monitor if partnership exists
    pollingInterval: 30000, // Poll every 30 seconds
  });

  // Monitor withdrawal requests for admin approval/denial
  const { pendingRequests, isMonitoring: isMonitoringRequests } = useWithdrawalRequestMonitor({
    userId: session?.user?.id || null,
    enabled: true,
    pollingInterval: 60000, // Poll every 60 seconds
  });

  useEffect(() => {
    fetchPartnership();
  }, [seasonId]);

  const fetchPartnership = async () => {
    try {
      setLoading(true);
      setError(null);

      const backendUrl = getBackendBaseURL();
      const response = await authClient.$fetch(
        `${backendUrl}/api/pairing/partnership/active/${seasonId}`
      );

      const partnershipData = (response as any)?.data;

      if (partnershipData) {
        setPartnership(partnershipData);
      } else {
        setError('No active partnership found for this season');
      }
    } catch (err) {
      console.error('Error fetching partnership:', err);
      setError('Failed to load partnership details');
    } finally {
      setLoading(false);
    }
  };

  const handleDissolve = () => {
    // After dissolution, navigate back
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#A04DFE', '#602E98']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.header, { paddingTop: insets.top + 16 }]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Manage Partnership</Text>
            <View style={styles.headerRight} />
          </View>
        </LinearGradient>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A04DFE" />
          <Text style={styles.loadingText}>Loading partnership details...</Text>
        </View>
      </View>
    );
  }

  if (error || !partnership) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#A04DFE', '#602E98']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.header, { paddingTop: insets.top + 16 }]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Manage Partnership</Text>
            <View style={styles.headerRight} />
          </View>
        </LinearGradient>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#DC2626" />
          <Text style={styles.errorTitle}>Partnership Not Found</Text>
          <Text style={styles.errorText}>
            {error || 'No active partnership found for this season'}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              fetchPartnership();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#A04DFE', '#602E98']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Partnership</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <PartnershipCard
          partnership={partnership}
          currentUserId={session?.user?.id}
          onDissolve={handleDissolve}
          showActions={true}
        />

        {/* Pending Request Status Badge */}
        {pendingRequests.length > 0 && (
          <View style={styles.statusBadge}>
            <Ionicons name="time-outline" size={20} color="#FF9800" />
            <Text style={styles.statusText}>
              Partner change request pending - Awaiting admin approval
            </Text>
          </View>
        )}

        {/* Additional Info Section */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle" size={20} color="#4CAF50" />
            <Text style={styles.infoTitle}>Partnership Actions</Text>
          </View>
          <Text style={styles.infoText}>
            • <Text style={styles.infoBold}>View Profile:</Text> See your partner's player profile and stats{'\n'}
            • <Text style={styles.infoBold}>Request Change:</Text> Submit a request to the admin for partner reassignment{'\n'}
            • <Text style={styles.infoBold}>Leave:</Text> Dissolve the partnership immediately (cannot be undone)
          </Text>
        </View>

        {partnership.division && (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="trophy" size={20} color="#FEA04D" />
              <Text style={styles.infoTitle}>Division Information</Text>
            </View>
            <Text style={styles.infoText}>
              You and your partner are currently assigned to {partnership.division.name}.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6FAFC',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  errorText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Inter',
  },
  retryButton: {
    backgroundColor: '#A04DFE',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  statusText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#E65100',
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    fontFamily: 'Inter',
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  infoBold: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
});
