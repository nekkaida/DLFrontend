import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '@core/theme/theme';

interface ProfileSportsSectionProps {
  sports: string[];
  activeTab: string;
  onTabPress: (sport: string) => void;
}

export const ProfileSportsSection: React.FC<ProfileSportsSectionProps> = ({
  sports,
  activeTab,
  onTabPress,
}) => {
  return (
    <View style={styles.section}>
      <View style={styles.sportsHeader}>
        <Text style={styles.sectionTitle}>Sports</Text>
        <View style={styles.tabs}>
          {sports?.map((sport) => (
            <Pressable
              key={sport}
              style={[
                styles.tab,
                activeTab === sport && styles.tabActive
              ]}
              onPress={() => onTabPress(sport)}
            >
              <Text style={[
                styles.tabText,
                activeTab === sport && styles.tabTextActive
              ]}>
                {sport}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  sportsHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as any,
    color: '#111827',
    fontFamily: theme.typography.fontFamily.primary,
  },
  tabs: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginLeft: theme.spacing.md,
  },
  tab: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    position: 'relative',
    borderRadius: theme.borderRadius.sm,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    color: '#9ca3af',
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: '500' as any,
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: '600' as any,
  },
});
