import React, { useState, useCallback, useMemo, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { SkillLevel } from './SkillLevelSelector';

export interface FriendlyFilterOptions {
  status: 'all' | 'open' | 'full';
  gameType: 'SINGLES' | 'DOUBLES' | null;
  skillLevels: SkillLevel[];
}

interface FriendlyFilterBottomSheetProps {
  onClose: () => void;
  onApply: (filters: FriendlyFilterOptions) => void;
  currentFilters: FriendlyFilterOptions;
  sportColor?: string;
}

export interface FriendlyFilterBottomSheetRef {
  present: () => void;
  dismiss: () => void;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'full', label: 'Full' },
] as const;

const GAME_TYPE_OPTIONS = [
  { value: 'SINGLES', label: 'Singles' },
  { value: 'DOUBLES', label: 'Doubles' },
] as const;

const SKILL_LEVEL_OPTIONS: { value: SkillLevel; label: string }[] = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'IMPROVER', label: 'Improver' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'UPPER_INTERMEDIATE', label: 'Upper Intermediate' },
  { value: 'EXPERT', label: 'Expert' },
  { value: 'ADVANCED', label: 'Advanced' },
];

export const FriendlyFilterBottomSheet = forwardRef<FriendlyFilterBottomSheetRef, FriendlyFilterBottomSheetProps>(({
  onClose,
  onApply,
  currentFilters,
  sportColor = '#A04DFE',
}, ref) => {
  const bottomSheetModalRef = React.useRef<BottomSheetModal>(null);
  const [localFilters, setLocalFilters] = useState<FriendlyFilterOptions>(currentFilters);

  const snapPoints = useMemo(() => ['70%'], []);

  useImperativeHandle(ref, () => ({
    present: () => {
      setLocalFilters(currentFilters);
      bottomSheetModalRef.current?.present();
    },
    dismiss: () => {
      bottomSheetModalRef.current?.dismiss();
    },
  }));

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        onPress={() => bottomSheetModalRef.current?.dismiss()}
      />
    ),
    []
  );

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  const handleClearAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const clearedFilters: FriendlyFilterOptions = {
      status: 'all',
      gameType: null,
      skillLevels: [],
    };
    setLocalFilters(clearedFilters);
    onApply(clearedFilters);
    bottomSheetModalRef.current?.dismiss();
  };

  const handleApply = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onApply(localFilters);
    bottomSheetModalRef.current?.dismiss();
  };

  const handleStatusToggle = (value: 'all' | 'open' | 'full') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalFilters(prev => ({
      ...prev,
      status: value,
    }));
  };

  const handleGameTypeToggle = (value: 'SINGLES' | 'DOUBLES') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalFilters(prev => ({
      ...prev,
      gameType: prev.gameType === value ? null : value,
    }));
  };

  const handleSkillLevelToggle = (level: SkillLevel) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalFilters(prev => {
      const currentLevels = prev.skillLevels;
      if (currentLevels.includes(level)) {
        return { ...prev, skillLevels: currentLevels.filter(l => l !== level) };
      } else {
        return { ...prev, skillLevels: [...currentLevels, level] };
      }
    });
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (localFilters.status !== 'all') count++;
    if (localFilters.gameType !== null) count++;
    if (localFilters.skillLevels.length > 0) count++;
    return count;
  }, [localFilters]);

  const renderFilterChip = (
    key: string,
    label: string,
    isActive: boolean,
    onPress: () => void
  ) => (
    <TouchableOpacity
      key={key}
      style={[
        styles.filterChip,
        isActive && { backgroundColor: sportColor, borderColor: sportColor },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.filterChipText,
          isActive && styles.filterChipTextActive,
        ]}
      >
        {label}
      </Text>
      {isActive && (
        <Ionicons name="checkmark" size={16} color="#FFFFFF" style={styles.checkIcon} />
      )}
    </TouchableOpacity>
  );

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      enablePanDownToClose={true}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.placeholder} />
          <Text style={styles.title}>Filter Matches</Text>
          <TouchableOpacity
            onPress={() => bottomSheetModalRef.current?.dismiss()}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#1D1D1F" />
          </TouchableOpacity>
        </View>

        {/* Filter Sections */}
        <View style={styles.content}>
          {/* Status Section */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Status</Text>
            <View style={styles.chipsContainer}>
              {STATUS_OPTIONS.map(({ value, label }) =>
                renderFilterChip(
                  value,
                  label,
                  localFilters.status === value,
                  () => handleStatusToggle(value)
                )
              )}
            </View>
          </View>

          {/* Game Type Section */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Game Type</Text>
            <View style={styles.chipsContainer}>
              {GAME_TYPE_OPTIONS.map(({ value, label }) =>
                renderFilterChip(
                  value,
                  label,
                  localFilters.gameType === value,
                  () => handleGameTypeToggle(value)
                )
              )}
            </View>
          </View>

          {/* Skill Level Section */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Skill Level</Text>
            <View style={styles.chipsContainer}>
              {SKILL_LEVEL_OPTIONS.map(({ value, label }) =>
                renderFilterChip(
                  `skill-${value}`,
                  label,
                  localFilters.skillLevels.includes(value),
                  () => handleSkillLevelToggle(value)
                )
              )}
            </View>
          </View>
        </View>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleClearAll}
          >
            <Ionicons name="refresh-outline" size={20} color="#6B7280" />
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.applyButton, { backgroundColor: sportColor }]}
            onPress={handleApply}
          >
            <Text style={styles.applyButtonText}>
              Apply{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

FriendlyFilterBottomSheet.displayName = 'FriendlyFilterBottomSheet';

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    backgroundColor: '#E5E7EB',
    width: 40,
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  closeButton: {
    padding: 4,
    marginRight: -4,
    zIndex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D1D1F',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  placeholder: {
    width: 60,
    zIndex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  filterSection: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  checkIcon: {
    marginLeft: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default FriendlyFilterBottomSheet;
