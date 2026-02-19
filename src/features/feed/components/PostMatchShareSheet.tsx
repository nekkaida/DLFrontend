// src/features/feed/components/PostMatchShareSheet.tsx

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
  Alert,
  Dimensions,
} from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { feedTheme } from '../theme';
import { useSharePost } from '../hooks';
import { ScorecardCaptureWrapper, ScorecardCaptureRef } from './ScorecardCaptureWrapper';
import { MatchResult, SportColors } from '@/features/standings/types';

const MAX_CAPTION_LENGTH = 500;

interface PostMatchShareSheetProps {
  visible: boolean;
  scorecardMatch: MatchResult | null;
  sportColors: SportColors;
  isPickleball: boolean;
  onPost: (caption: string) => void;
  onSkip: () => void;
  onClose?: () => void;
  onExternalShare?: () => void;
  onInstagramShare?: () => void;
  isPosting?: boolean;
  bottomSheetRef: React.RefObject<BottomSheet | null>;
}

export const PostMatchShareSheet: React.FC<PostMatchShareSheetProps> = ({
  visible,
  scorecardMatch,
  sportColors,
  isPickleball,
  onPost,
  onSkip,
  onClose,
  onExternalShare,
  onInstagramShare,
  isPosting = false,
  bottomSheetRef,
}) => {
  const [caption, setCaption] = useState('');
  const scorecardRef = useRef<ScorecardCaptureRef>(null);
  const { captureAndSave, shareToInstagram, isCapturing, isSaving } = useSharePost();
  const cardWidth = Math.min(360, Dimensions.get('window').width - 48);
  const getCaptureViewRef = () => ({ current: scorecardRef.current?.viewRef || null });

  const isOverLimit = caption.length > MAX_CAPTION_LENGTH;
  const canPost = !isOverLimit && !isPosting;

  const handlePost = useCallback(() => {
    if (canPost) {
      onPost(caption);
      setCaption('');
    }
  }, [canPost, caption, onPost]);

  const handleSkip = useCallback(() => {
    setCaption('');
    onSkip();
  }, [onSkip]);

  const handleClose = useCallback(() => {
    setCaption('');
    // Call onClose if provided (allows parent to reset state without navigation)
    onClose?.();
  }, [onClose]);

  const handleInstagramShare = useCallback(async () => {
    // Check if Instagram is installed
    const canOpen = await Linking.canOpenURL('instagram://');
    if (!canOpen) {
      Alert.alert(
        'Instagram Not Installed',
        'Please install Instagram to share directly to your story.',
        [{ text: 'OK' }]
      );
      return;
    }

    // If custom handler provided, use it; otherwise use internal shareToInstagram
    if (onInstagramShare) {
      onInstagramShare();
    } else {
      const success = await shareToInstagram(getCaptureViewRef());
      if (success) {
        bottomSheetRef.current?.close();
      }
    }
  }, [onInstagramShare, shareToInstagram, bottomSheetRef]);

  const handleSaveToGallery = useCallback(async () => {
    // If custom handler provided, use it; otherwise use internal captureAndSave
    if (onExternalShare) {
      onExternalShare();
    } else {
      const success = await captureAndSave(getCaptureViewRef());
      if (success) {
        bottomSheetRef.current?.close();
      }
    }
  }, [onExternalShare, captureAndSave, bottomSheetRef]);

  // Only render backdrop when visible to prevent touch blocking
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  const renderMatchPreview = () => {
    if (!scorecardMatch) return null;

    return (
      <View style={styles.previewCard} collapsable={false}>
        <ScorecardCaptureWrapper
          ref={scorecardRef}
          match={scorecardMatch}
          sportColors={sportColors}
          isPickleball={isPickleball}
          cardWidth={cardWidth}
        />
      </View>
    );
  };

  // Don't render anything if not visible - prevents touch blocking when closed
  if (!visible) {
    return null;
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={['75%']}
      enablePanDownToClose
      onClose={handleClose}
      backdropComponent={renderBackdrop}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      <BottomSheetScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          <Text style={styles.title}>Share to Activity Feed?</Text>

          {renderMatchPreview()}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Add a caption..."
              placeholderTextColor={feedTheme.colors.textTertiary}
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={MAX_CAPTION_LENGTH + 50}
              textAlignVertical="top"
              editable={!isPosting}
            />
            <Text
              style={[
                styles.charCounter,
                isOverLimit && styles.charCounterError,
              ]}
            >
              {caption.length}/{MAX_CAPTION_LENGTH}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              activeOpacity={0.7}
              disabled={isPosting}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.postButton,
                !canPost && styles.postButtonDisabled,
              ]}
              onPress={handlePost}
              activeOpacity={0.7}
              disabled={!canPost}
            >
              {isPosting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.postButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or share externally:</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.externalShareRow}>
            <TouchableOpacity
              style={styles.externalShareButton}
              onPress={handleInstagramShare}
              activeOpacity={0.7}
              disabled={isPosting || isCapturing}
            >
              <View style={styles.externalShareIcon}>
                {isCapturing ? (
                  <ActivityIndicator size="small" color="#E4405F" />
                ) : (
                  <Ionicons
                    name="logo-instagram"
                    size={24}
                    color="#E4405F"
                  />
                )}
              </View>
              <Text style={styles.externalShareLabel}>Instagram</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.externalShareButton}
              onPress={handleSaveToGallery}
              activeOpacity={0.7}
              disabled={isPosting || isSaving}
            >
              <View style={styles.externalShareIcon}>
                {isSaving ? (
                  <ActivityIndicator size="small" color={feedTheme.colors.primary} />
                ) : (
                  <Ionicons
                    name="download-outline"
                    size={24}
                    color={feedTheme.colors.primary}
                  />
                )}
              </View>
              <Text style={styles.externalShareLabel}>Save</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: feedTheme.spacing.screenPadding,
    paddingBottom: 24,
  },
  keyboardAvoid: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: feedTheme.colors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  previewCard: {
    marginBottom: 20,
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: feedTheme.colors.background,
    borderWidth: 1,
    borderColor: feedTheme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: feedTheme.colors.textPrimary,
    lineHeight: 20,
    minHeight: 80,
    maxHeight: 120,
  },
  charCounter: {
    fontSize: 12,
    color: feedTheme.colors.textTertiary,
    textAlign: 'right',
    marginTop: 8,
  },
  charCounterError: {
    color: '#FF3B30',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: feedTheme.colors.border,
    backgroundColor: feedTheme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: feedTheme.colors.textSecondary,
  },
  postButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: feedTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: feedTheme.colors.border,
  },
  dividerText: {
    fontSize: 13,
    color: feedTheme.colors.textSecondary,
    paddingHorizontal: 12,
  },
  externalShareRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  externalShareButton: {
    alignItems: 'center',
    gap: 6,
  },
  externalShareIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: feedTheme.colors.background,
    borderWidth: 1,
    borderColor: feedTheme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  externalShareLabel: {
    fontSize: 12,
    color: feedTheme.colors.textSecondary,
    fontWeight: '500',
  },
});
