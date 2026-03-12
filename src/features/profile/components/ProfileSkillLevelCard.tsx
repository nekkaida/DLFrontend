import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@core/theme/theme';

// Map backend skill level enum values to display labels
const SKILL_LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'Beginner',
  IMPROVER: 'Improver',
  INTERMEDIATE: 'Intermediate',
  UPPER_INTERMEDIATE: 'Upper Intermediate',
  ADVANCED: 'Advanced',
  EXPERT: 'Expert',
};

interface ProfileSkillLevelCardProps {
  skillLevel: string;
  selfAssessedSkillLevels?: Record<string, string>;
  activeSport?: string;
  onEdit?: () => void;
}

export const ProfileSkillLevelCard: React.FC<ProfileSkillLevelCardProps> = ({
  skillLevel,
  selfAssessedSkillLevels,
  activeSport,
  onEdit,
}) => {
  // Get the self-assessed skill level for the active sport
  const getSportSkillLevel = (): string => {
    if (selfAssessedSkillLevels && activeSport) {
      const sportKey = activeSport.toLowerCase();
      const selfAssessedLevel = selfAssessedSkillLevels[sportKey];
      if (selfAssessedLevel) {
        // Convert enum value to display label
        return SKILL_LEVEL_LABELS[selfAssessedLevel] || selfAssessedLevel;
      }
    }
    // Fall back to the calculated skill level
    return skillLevel;
  };

  const displaySkillLevel = getSportSkillLevel();

  return (
    <View style={styles.skillLevelSection}>
      <View style={styles.skillContainer}>
        <Text style={styles.skillLabel}>Self Rating</Text>
        <View style={styles.skillValueRow}>
          <Text style={styles.skillValue}>{displaySkillLevel}</Text>
          {onEdit && (
            <TouchableOpacity
              onPress={onEdit}
              hitSlop={8}
              style={styles.editButton}
              accessibilityLabel="Edit skill level"
            >
              <Ionicons name="create-outline" size={18} color={theme.colors.neutral.gray[800]} />
            </TouchableOpacity>
          )}
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0px 12px 24px rgba(0, 0, 0, 0.12)',
  },
  skillLabel: {
    fontSize: 16,
    fontWeight: '600' as any,
    color: theme.colors.neutral.gray[700],
    fontFamily: theme.typography.fontFamily.primary,
  },
  skillValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  skillValue: {
    fontSize: 18,
    fontWeight: '700' as any,
    color: theme.colors.neutral.gray[700],
    fontFamily: theme.typography.fontFamily.primary,
  },
  editButton: {
    padding: 2,
  },
});
