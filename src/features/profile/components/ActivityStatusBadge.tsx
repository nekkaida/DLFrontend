/**
 * Activity Status Badge
 * Displays player's activity status with visual indicators
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { moderateScale, scaleFontSize } from '@core/utils/responsive';

interface ActivityStatusBadgeProps {
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  daysSinceLastMatch?: number | null;
  isAtRisk?: boolean;
  daysUntilInactive?: number | null;
}

export const ActivityStatusBadge: React.FC<ActivityStatusBadgeProps> = ({
  status,
  daysSinceLastMatch,
  isAtRisk,
  daysUntilInactive,
}) => {
  const getBadgeConfig = () => {
    if (status === 'SUSPENDED') {
      return {
        backgroundColor: '#EF4444',
        icon: '🚫',
        text: 'Suspended',
        subtext: 'Contact support for help',
      };
    }

    if (status === 'INACTIVE') {
      return {
        backgroundColor: '#F59E0B',
        icon: '⏸️',
        text: 'Inactive',
        subtext: daysSinceLastMatch ? `Last played ${daysSinceLastMatch}d ago` : 'Play to reactivate',
      };
    }

    // ACTIVE status
    if (isAtRisk && daysUntilInactive !== null) {
      return {
        backgroundColor: '#F59E0B',
        icon: '⚠️',
        text: 'At Risk',
        subtext: `Play within ${daysUntilInactive} days!`,
      };
    }

    return {
      backgroundColor: '#10B981',
      icon: '🟢',
      text: 'Active',
      subtext: daysSinceLastMatch !== null ? `Last played ${daysSinceLastMatch}d ago` : 'Ready to play',
    };
  };

  const config = getBadgeConfig();

  return (
    <View style={[styles.container, { backgroundColor: config.backgroundColor }]}>
      <View style={styles.content}>
        <Text style={styles.icon}>{config.icon}</Text>
        <View style={styles.textContainer}>
          <Text style={styles.mainText}>{config.text}</Text>
          {config.subtext && <Text style={styles.subtext}>{config.subtext}</Text>}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
    alignSelf: 'flex-start',
    marginVertical: moderateScale(8),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: scaleFontSize(20),
    marginRight: moderateScale(8),
  },
  textContainer: {
    flex: 1,
  },
  mainText: {
    fontSize: scaleFontSize(14),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtext: {
    fontSize: scaleFontSize(12),
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: moderateScale(2),
  },
});
