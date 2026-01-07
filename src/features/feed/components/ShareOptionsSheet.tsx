// src/features/feed/components/ShareOptionsSheet.tsx

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { feedTheme } from '../theme';

interface ShareOptionsSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  onClose: () => void;
  onShareImage: () => void;
  onSaveImage: () => void;
  onShareLink: () => void;
  isLoading?: boolean;
}

export const ShareOptionsSheet: React.FC<ShareOptionsSheetProps> = ({
  bottomSheetRef,
  onClose,
  onShareImage,
  onSaveImage,
  onShareLink,
  isLoading = false,
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
      snapPoints={['30%']}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetView style={styles.container}>
        <TouchableOpacity
          style={styles.option}
          onPress={onShareImage}
          activeOpacity={0.7}
          disabled={isLoading}
        >
          <Ionicons
            name="share-outline"
            size={24}
            color={isLoading ? feedTheme.colors.textTertiary : feedTheme.colors.primary}
          />
          <Text style={[styles.optionText, isLoading && styles.disabledText]}>
            Share as Image
          </Text>
          {isLoading && <ActivityIndicator size="small" color={feedTheme.colors.primary} style={styles.loader} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={onSaveImage}
          activeOpacity={0.7}
          disabled={isLoading}
        >
          <Ionicons
            name="download-outline"
            size={24}
            color={isLoading ? feedTheme.colors.textTertiary : feedTheme.colors.primary}
          />
          <Text style={[styles.optionText, isLoading && styles.disabledText]}>
            Save to Gallery
          </Text>
          {isLoading && <ActivityIndicator size="small" color={feedTheme.colors.primary} style={styles.loader} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={onShareLink}
          activeOpacity={0.7}
          disabled={isLoading}
        >
          <Ionicons
            name="link-outline"
            size={24}
            color={isLoading ? feedTheme.colors.textTertiary : feedTheme.colors.primary}
          />
          <Text style={[styles.optionText, isLoading && styles.disabledText]}>
            Share Link
          </Text>
          {isLoading && <ActivityIndicator size="small" color={feedTheme.colors.primary} style={styles.loader} />}
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: feedTheme.spacing.screenPadding,
    paddingTop: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  optionText: {
    fontSize: 16,
    color: feedTheme.colors.textPrimary,
    marginLeft: 14,
    flex: 1,
  },
  disabledText: {
    color: feedTheme.colors.textTertiary,
  },
  loader: {
    marginLeft: 8,
  },
});
