import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '@/lib/auth-client';
import { PartnershipCard } from '../components/PartnershipCard';
import { PartnershipStatusBanner } from '../components/PartnershipStatusBanner';
import { usePartnershipMonitor } from '../hooks/usePartnershipMonitor';
import { usePartnershipStatus } from '../hooks/usePartnershipStatus';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

interface ManagePartnershipScreenProps {
  seasonId: string;
}

export default function ManagePartnershipScreen({ seasonId }: ManagePartnershipScreenProps) {
  const { data: session } = useSession();
  const insets = useSafeAreaInsets();

  // Monitor partnership for dissolution by partner
  // This hook also fetches and manages partnership data, so we don't need separate state
  const { partnership, loading, refresh, isMonitoring: isMonitoringPartnership } = usePartnershipMonitor({
    seasonId: seasonId,
    enabled: true, // Always enabled - hook handles null partnership
    pollingInterval: 30000, // Poll every 30 seconds
  });

  // Monitor partnership status (pending requests from both partners)
  const partnershipStatus = usePartnershipStatus({
    partnershipId: partnership?.id || null,
    enabled: !!partnership?.id,
    pollingInterval: 30000, // Poll every 30 seconds
  });

  // Derive error state from partnership being null after loading
  const error = !loading && !partnership ? 'No active partnership found for this season' : null;

  const handleDissolve = () => {
    // PartnershipCard handles navigation to find-partner, so we don't need to do anything here
    // The monitoring hooks will also detect the dissolution and could redirect, but PartnershipCard navigates first
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
              refresh();
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
        {/* Status Banner - Shows alerts for pending requests or partner actions */}
        <PartnershipStatusBanner
          hasMyPendingRequest={partnershipStatus.hasMyPendingRequest}
          hasPartnerPendingRequest={partnershipStatus.hasPartnerPendingRequest}
          partnerHasLeft={partnershipStatus.partnerHasLeft}
        />

        {/* Partnership Card */}
        <PartnershipCard
          partnership={partnership}
          currentUserId={session?.user?.id}
          onDissolve={handleDissolve}
          showActions={true}
          hasPartnerPendingRequest={partnershipStatus.hasPartnerPendingRequest}
          hasMyPendingRequest={partnershipStatus.hasMyPendingRequest}
        />

        {/* Division Information Card */}
        {partnership.division && (
          <View style={styles.divisionCard}>
            <View style={styles.divisionHeader}>
              <View style={styles.divisionIconContainer}>
                <Ionicons name="trophy" size={18} color="#FE9F4D" />
              </View>
              <Text style={styles.divisionTitle}>Division Assignment</Text>
            </View>
            <Text style={styles.divisionText}>
              You and your partner are assigned to <Text style={styles.divisionName}>{partnership.division.name}</Text>
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
    fontFamily: 'Inter',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
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
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  divisionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  divisionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  divisionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divisionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter',
  },
  divisionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  divisionName: {
    fontWeight: '600',
    color: '#374151',
  },
});
