import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@core/theme/theme';

interface InlineDropdownProps {
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  style?: any;
}

export const InlineDropdown: React.FC<InlineDropdownProps> = ({
  options,
  selectedValue,
  onSelect,
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (value: string) => {
    onSelect(value);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Dropdown Button */}
      <Pressable 
        style={styles.dropdownButton}
        onPress={toggleDropdown}
      >
        <Text style={styles.dropdownText}>{selectedValue}</Text>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={16} 
          color={theme.colors.neutral.gray[600]} 
        />
      </Pressable>
      
      {/* Dropdown Options */}
      {isOpen && (
        <View style={styles.dropdownOptions}>
          {options.map((option, index) => (
            <Pressable
              key={index}
              style={[
                styles.dropdownOption,
                option === selectedValue && styles.dropdownOptionSelected,
                index === 0 && styles.dropdownOptionFirst,
                index === options.length - 1 && styles.dropdownOptionLast,
              ]}
              onPress={() => handleSelect(option)}
            >
              <Text style={[
                styles.dropdownOptionText,
                option === selectedValue && styles.dropdownOptionTextSelected
              ]}>
                {option}
              </Text>
              {option === selectedValue && (
                <Ionicons name="checkmark" size={16} color={theme.colors.primary} />
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdownButton: {
    backgroundColor: theme.colors.neutral.white,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.neutral.gray[300],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: 100,
  },
  dropdownText: {
    color: theme.colors.neutral.gray[600],
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: '500' as any,
  },
  dropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    minWidth: 100,
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.neutral.gray[300],
    marginTop: 2,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.neutral.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  dropdownOptionFirst: {
    borderTopLeftRadius: theme.borderRadius.md,
    borderTopRightRadius: theme.borderRadius.md,
  },
  dropdownOptionLast: {
    borderBottomLeftRadius: theme.borderRadius.md,
    borderBottomRightRadius: theme.borderRadius.md,
  },
  dropdownOptionSelected: {
    backgroundColor: `${theme.colors.primary}15`,
  },
  dropdownOptionText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.neutral.gray[700],
    fontWeight: theme.typography.fontWeight.medium,
    fontFamily: theme.typography.fontFamily.primary,
  },
  dropdownOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
