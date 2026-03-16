import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '@core/theme/theme';
import { getProfileSportConfig } from '../utils/profileSportUi';

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
          {sports?.map((sport) => {
            const config = getProfileSportConfig(sport);
            const isActive = activeTab === sport;
            const iconColor = isActive ? '#FFFFFF' : config.color;
            const Icon = config.Icon;

            return (
              <Pressable
                key={sport}
                style={[
                  styles.tab,
                  {
                    borderColor: config.color,
                    backgroundColor: isActive ? config.color : '#FFFFFF',
                  },
                ]}
                onPress={() => onTabPress(sport)}
              >
                <Icon width={16} height={16} fill={iconColor} color={iconColor} />
                <Text
                  style={[
                    styles.tabText,
                    { color: isActive ? '#FFFFFF' : config.color },
                  ]}
                >
                  {sport}
                </Text>
              </Pressable>
            );
          })}
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
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as any,
    color: '#111827',
    fontFamily: theme.typography.fontFamily.primary,
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: '600' as any,
  },
});
