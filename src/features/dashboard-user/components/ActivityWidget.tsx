/**
 * Activity Widget
 * Dashboard widget showing inactivity warnings
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { moderateScale, scaleFontSize, getResponsivePadding } from '@core/utils/responsive';
import { useSession } from '@/lib/auth-client';
import { fetchActivityStatus, ActivityStatus } from '@/src/features/profile/services/ActivityService';

export const ActivityWidget: React.FC = () => {
  const { data: session } = useSession();
  const [activityStatus, setActivityStatus] = useState<ActivityStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      loadActivityStatus();
    }
  }, [session?.user?.id]);

  const loadActivityStatus = async () => {
    try {
      setLoading(true);
      const status = await fetchActivityStatus(session?.user?.id as string);
      setActivityStatus(status);
    } catch (error) {
      console.error('Failed to fetch activity status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#666" />
      </View>
    );
  }

  if (!activityStatus) return null;

  const { isAtRisk, daysSinceLastMatch, daysUntilInactive, status, thresholds } = activityStatus;

  // Only show widget if at risk or inactive
  if (!isAtRisk && status !== 'INACTIVE') return null;

  const progress = daysSinceLastMatch
    ? Math.min(1, daysSinceLastMatch / thresholds.inactive)
    : 0;

  const getWarningConfig = () => {
    if (status === 'INACTIVE') {
      return {
        icon: '⏸️',
        title: 'YOUR ACCOUNT IS INACTIVE',
        message: `You haven't played in ${daysSinceLastMatch} days`,
        color: '#F59E0B',
        buttonText: 'Find a Match',
      };
    }

    return {
      icon: '⚠️',
      title: 'INACTIVITY WARNING',
      message: `${daysSinceLastMatch} days since last match`,
      color: '#F59E0B',
      buttonText: 'Schedule a Match',
    };
  };

  const config = getWarningConfig();

  return (
    <View style={[styles.container, { borderLeftColor: config.color }]}>
      <View style={styles.header}>
        <Text style={styles.icon}>{config.icon}</Text>
        <Text style={styles.title}>{config.title}</Text>
      </View>

      <Text style={styles.message}>{config.message}</Text>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%`,
                backgroundColor: config.color,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {daysUntilInactive !== null && daysUntilInactive > 0
            ? `${daysUntilInactive} days remaining`
            : 'Play to reactivate'}
        </Text>
      </View>

      {/* Call to Action */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: config.color }]}
          onPress={() => {
            // TODO: Navigate to match scheduling/league browsing
            console.log('Navigate to find match');
          }}
        >
          <Text style={styles.buttonText}>{config.buttonText}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dismissButton}
          onPress={() => {
            // Dismiss widget (could add to AsyncStorage to remember)
            setActivityStatus(null);
          }}
        >
          <Text style={styles.dismissText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    padding: moderateScale(20),
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: getResponsivePadding(16),
    marginHorizontal: getResponsivePadding(16),
    marginVertical: moderateScale(12),
    borderLeftWidth: moderateScale(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  icon: {
    fontSize: scaleFontSize(24),
    marginRight: moderateScale(8),
  },
  title: {
    fontSize: scaleFontSize(14),
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 0.5,
  },
  message: {
    fontSize: scaleFontSize(16),
    fontWeight: '500',
    color: '#374151',
    marginBottom: moderateScale(12),
  },
  progressContainer: {
    marginBottom: moderateScale(16),
  },
  progressBar: {
    height: moderateScale(8),
    backgroundColor: '#E5E7EB',
    borderRadius: moderateScale(4),
    overflow: 'hidden',
    marginBottom: moderateScale(6),
  },
  progressFill: {
    height: '100%',
    borderRadius: moderateScale(4),
  },
  progressText: {
    fontSize: scaleFontSize(12),
    color: '#6B7280',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
  },
  button: {
    flex: 1,
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  buttonText: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dismissButton: {
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
  },
  dismissText: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    color: '#6B7280',
  },
});
