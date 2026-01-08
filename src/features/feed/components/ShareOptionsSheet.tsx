// src/features/feed/components/ShareOptionsSheet.tsx

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, Alert } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { feedTheme } from '../theme';
import type { ShareError } from '../hooks/useSharePost';

export type ShareStyle = 'transparent' | 'standard';

interface ShareOptionsSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  onClose: () => void;
  onShareImage: (style: ShareStyle) => void;
  onSaveImage: (style: ShareStyle) => void;
  onShareLink: () => void;
  onShareInstagram?: (style: ShareStyle) => void;
  isLoading?: boolean;
  defaultStyle?: ShareStyle;
  shareError?: ShareError | null;
  onClearError?: () => void;
}

export const ShareOptionsSheet: React.FC<ShareOptionsSheetProps> = ({
  bottomSheetRef,
  onClose,
  onShareImage,
  onSaveImage,
  onShareLink,
  onShareInstagram,
  isLoading = false,
  defaultStyle = 'transparent',
  shareError,
  onClearError,
}) => {
  const [selectedStyle, setSelectedStyle] = useState<ShareStyle>(defaultStyle);

  const handleShareImage = useCallback(() => {
    onShareImage(selectedStyle);
  }, [onShareImage, selectedStyle]);

  const handleSaveImage = useCallback(() => {
    onSaveImage(selectedStyle);
  }, [onSaveImage, selectedStyle]);

  const handleShareInstagram = useCallback(async () => {
    if (!onShareInstagram) return;

    // Check if Instagram is installed
    const instagramUrl = 'instagram://';
    const canOpen = await Linking.canOpenURL(instagramUrl);

    if (!canOpen) {
      Alert.alert(
        'Instagram Not Installed',
        'Please install Instagram to share directly to your story.',
        [{ text: 'OK' }]
      );
      return;
    }

    onShareInstagram(selectedStyle);
  }, [onShareInstagram, selectedStyle]);

  const handleRetry = useCallback(() => {
    if (shareError?.retryAction) {
      onClearError?.();
      shareError.retryAction();
    }
  }, [shareError, onClearError]);

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
      snapPoints={['45%']}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetView style={styles.container}>
        {/* Error Banner */}
        {shareError && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color="#FF3B30" />
            <Text style={styles.errorText}>{shareError.message}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
              activeOpacity={0.7}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Style Selector */}
        <View style={styles.styleSelector}>
          <Text style={styles.styleSelectorLabel}>Image Style</Text>
          <View style={styles.styleToggle}>
            <TouchableOpacity
              style={[
                styles.styleOption,
                selectedStyle === 'transparent' && styles.styleOptionSelected,
              ]}
              onPress={() => setSelectedStyle('transparent')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.styleOptionText,
                  selectedStyle === 'transparent' && styles.styleOptionTextSelected,
                ]}
              >
                Transparent
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.styleOption,
                selectedStyle === 'standard' && styles.styleOptionSelected,
              ]}
              onPress={() => setSelectedStyle('standard')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.styleOptionText,
                  selectedStyle === 'standard' && styles.styleOptionTextSelected,
                ]}
              >
                Standard
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.option}
          onPress={handleShareImage}
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

        {onShareInstagram && (
          <TouchableOpacity
            style={styles.option}
            onPress={handleShareInstagram}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <Ionicons
              name="logo-instagram"
              size={24}
              color={isLoading ? feedTheme.colors.textTertiary : '#E4405F'}
            />
            <Text style={[styles.optionText, isLoading && styles.disabledText]}>
              Share to Instagram
            </Text>
            {isLoading && <ActivityIndicator size="small" color={feedTheme.colors.primary} style={styles.loader} />}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.option}
          onPress={handleSaveImage}
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
  styleSelector: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  styleSelectorLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: feedTheme.colors.textSecondary,
    marginBottom: 8,
  },
  styleToggle: {
    flexDirection: 'row',
    backgroundColor: feedTheme.colors.border,
    borderRadius: 8,
    padding: 3,
  },
  styleOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  styleOptionSelected: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  styleOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: feedTheme.colors.textSecondary,
  },
  styleOptionTextSelected: {
    color: feedTheme.colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: feedTheme.colors.border,
    marginVertical: 8,
    marginHorizontal: 12,
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 12,
    marginBottom: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#FF3B30',
    marginLeft: 8,
  },
  retryButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FF3B30',
    borderRadius: 6,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
