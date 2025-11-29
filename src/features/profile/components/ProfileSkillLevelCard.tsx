import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@core/theme/theme';

interface ProfileSkillLevelCardProps {
  skillLevel: string;
}

export const ProfileSkillLevelCard: React.FC<ProfileSkillLevelCardProps> = ({
  skillLevel,
}) => {
  return (
    <View style={styles.skillLevelSection}>
      <View style={styles.skillContainer}>
        <Text style={styles.skillLabel}>Skill Level</Text>
        <Text style={styles.skillValue}>{skillLevel}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skillLevelSection: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  skillContainer: {
    backgroundColor: '#ffffff',
    padding: theme.spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xl * 3,
    shadowColor: theme.colors.neutral.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  skillLabel: {
    fontSize: 16,
    fontWeight: '600' as any,
    color: theme.colors.neutral.gray[700],
    fontFamily: theme.typography.fontFamily.primary,
  },
  skillValue: {
    fontSize: 16,
    fontWeight: '500' as any,
    color: theme.colors.neutral.gray[700],
    fontFamily: theme.typography.fontFamily.primary,
  },
});
