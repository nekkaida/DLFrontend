// src/features/feed/components/SportFilterSheet.tsx

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { feedTheme } from '../theme';

const SPORT_OPTIONS = [
  { value: undefined, label: 'All Sports', icon: 'apps-outline' },
  { value: 'tennis', label: 'Tennis', icon: 'tennisball-outline' },
  { value: 'padel', label: 'Padel', icon: 'tennisball-outline' },
  { value: 'pickleball', label: 'Pickleball', icon: 'tennisball-outline' },
] as const;

interface SportFilterSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  selectedSport?: string;
  onSelect: (sport: string | undefined) => void;
  onClose: () => void;
}

export const SportFilterSheet: React.FC<SportFilterSheetProps> = ({
  bottomSheetRef,
  selectedSport,
  onSelect,
  onClose,
}) => {
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

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={['35%']}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetView style={styles.container}>
        <Text style={styles.title}>Filter by Sport</Text>

        {SPORT_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.label}
            style={[
              styles.option,
              selectedSport === option.value && styles.optionSelected,
            ]}
            onPress={() => onSelect(option.value)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={option.icon as any}
              size={22}
              color={selectedSport === option.value
                ? feedTheme.colors.primary
                : feedTheme.colors.textSecondary}
            />
            <Text style={[
              styles.optionText,
              selectedSport === option.value && styles.optionTextSelected,
            ]}>
              {option.label}
            </Text>
            {selectedSport === option.value && (
              <Ionicons
                name="checkmark"
                size={22}
                color={feedTheme.colors.primary}
                style={styles.checkmark}
              />
            )}
          </TouchableOpacity>
        ))}
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: feedTheme.spacing.screenPadding,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: feedTheme.colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  optionSelected: {
    backgroundColor: `${feedTheme.colors.primary}15`,
  },
  optionText: {
    fontSize: 16,
    color: feedTheme.colors.textPrimary,
    marginLeft: 12,
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: feedTheme.colors.primary,
  },
  checkmark: {
    marginLeft: 'auto',
  },
});
