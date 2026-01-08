// src/features/feed/components/PostMatchShareSheet.tsx

import React, { useState, useCallback, useMemo, useRef, useImperativeHandle, forwardRef } from 'react';
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
} from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { feedTheme } from '../theme';
import { useSharePost } from '../hooks';
import { processDisplayName } from '../utils/formatters';

const MAX_CAPTION_LENGTH = 500;

interface PostMatchShareSheetProps {
  visible: boolean;
  matchData: {
    matchId: string;
    sport: string;
    matchType: string;
    gameType: string;
    winnerNames: string[];
    loserNames: string[];
    scores: any;
    matchDate: string;
  } | null;
  onPost: (caption: string) => void;
  onSkip: () => void;
  onClose?: () => void;
  onExternalShare?: () => void;
  onInstagramShare?: () => void;
  isPosting?: boolean;
  bottomSheetRef: React.RefObject<BottomSheet | null>;
}

export const PostMatchShareSheet: React.FC<PostMatchShareSheetProps> = ({
  matchData,
  onPost,
  onSkip,
  onClose,
  onExternalShare,
  onInstagramShare,
  isPosting = false,
  bottomSheetRef,
}) => {
  const [caption, setCaption] = useState('');
  const shareableViewRef = useRef<View | null>(null);
  const { captureAndSave, shareToInstagram, isCapturing, isSaving } = useSharePost();

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
      const success = await shareToInstagram(shareableViewRef);
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
      const success = await captureAndSave(shareableViewRef);
      if (success) {
        bottomSheetRef.current?.close();
      }
    }
  }, [onExternalShare, captureAndSave, bottomSheetRef]);

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

  const formattedScore = useMemo(() => {
    if (!matchData?.scores) return null;

    if (Array.isArray(matchData.scores)) {
      return matchData.scores.map((score: any) => {
        if (score.team1Games !== undefined) {
          return score.team1Games + '-' + score.team2Games;
        } else if (score.team1Points !== undefined) {
          return score.team1Points + '-' + score.team2Points;
        }
        return '';
      }).filter(Boolean).join(', ');
    }

    if (matchData.scores.team1Score !== undefined) {
      return matchData.scores.team1Score + ' - ' + matchData.scores.team2Score;
    }

    return null;
  }, [matchData?.scores]);

  const renderMatchPreview = () => {
    if (!matchData) return null;

    const winnerText = matchData.winnerNames
      .map(name => processDisplayName(name, 20))
      .join(' & ');
    const loserText = matchData.loserNames
      .map(name => processDisplayName(name, 20))
      .join(' & ');
    const isLeague = matchData.gameType === 'league';
    const isDoubles = matchData.matchType === 'doubles';

    return (
      <View ref={shareableViewRef} style={styles.previewCard} collapsable={false}>
        <View style={styles.previewBadgeRow}>
          <View style={[styles.badge, isLeague ? styles.leagueBadge : styles.friendlyBadge]}>
            <Text style={styles.badgeText}>
              {isLeague ? 'League' : 'Friendly'}
            </Text>
          </View>
          {isDoubles && (
            <View style={[styles.badge, styles.doublesBadge]}>
              <Text style={styles.badgeText}>Doubles</Text>
            </View>
          )}
        </View>

        <View style={styles.previewTeamRow}>
          <Ionicons name="trophy" size={18} color={feedTheme.colors.primary} />
          <Text style={styles.previewWinnerName} numberOfLines={1}>
            {winnerText}
          </Text>
        </View>

        {formattedScore && (
          <Text style={styles.previewScore}>{formattedScore}</Text>
        )}

        <View style={styles.previewTeamRow}>
          <View style={styles.iconPlaceholder} />
          <Text style={styles.previewLoserName} numberOfLines={1}>
            {loserText}
          </Text>
        </View>

        <Text style={styles.previewDate}>
          {new Date(matchData.matchDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </View>
    );
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
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
    backgroundColor: feedTheme.colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: feedTheme.colors.border,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  previewBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  leagueBadge: {
    backgroundColor: feedTheme.colors.accent,
  },
  friendlyBadge: {
    backgroundColor: feedTheme.colors.primary,
  },
  doublesBadge: {
    backgroundColor: feedTheme.colors.textSecondary,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  previewTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    paddingHorizontal: 8,
  },
  iconPlaceholder: {
    width: 18,
  },
  previewWinnerName: {
    fontSize: 16,
    fontWeight: '600',
    color: feedTheme.colors.textPrimary,
    flex: 1,
  },
  previewLoserName: {
    fontSize: 16,
    fontWeight: '400',
    color: feedTheme.colors.textSecondary,
    flex: 1,
  },
  previewScore: {
    fontSize: 24,
    fontWeight: '700',
    color: feedTheme.colors.textPrimary,
    marginVertical: 8,
  },
  previewDate: {
    fontSize: 12,
    color: feedTheme.colors.textTertiary,
    marginTop: 8,
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
