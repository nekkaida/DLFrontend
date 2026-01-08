// src/features/feed/components/EditCaptionSheet.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { feedTheme } from '../theme';

const MAX_CAPTION_LENGTH = 500;

interface EditCaptionSheetProps {
  postId: string | null;
  initialCaption: string;
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  onClose: () => void;
  onSave: (postId: string, newCaption: string) => void;
  isSaving?: boolean;
}

export const EditCaptionSheet: React.FC<EditCaptionSheetProps> = ({
  postId,
  initialCaption,
  bottomSheetRef,
  onClose,
  onSave,
  isSaving = false,
}) => {
  const [caption, setCaption] = useState(initialCaption);

  // Reset caption when postId changes (new post selected for editing)
  useEffect(() => {
    setCaption(initialCaption);
  }, [postId, initialCaption]);

  const hasChanges = caption !== initialCaption;
  const isOverLimit = caption.length > MAX_CAPTION_LENGTH;
  const canSave = hasChanges && !isOverLimit && !isSaving && postId !== null;

  const handleSave = useCallback(() => {
    if (canSave && postId) {
      onSave(postId, caption);
    }
  }, [canSave, postId, caption, onSave]);

  const handleCancel = useCallback(() => {
    setCaption(initialCaption);
    bottomSheetRef.current?.close();
  }, [initialCaption, bottomSheetRef]);

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
      snapPoints={['50%']}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetView style={styles.container}>
        <Text style={styles.title}>Edit Caption</Text>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Add a caption..."
              placeholderTextColor={feedTheme.colors.textTertiary}
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={MAX_CAPTION_LENGTH + 50} // Allow slight overflow to show error
              textAlignVertical="top"
              editable={!isSaving}
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
              style={styles.cancelButton}
              onPress={handleCancel}
              activeOpacity={0.7}
              disabled={isSaving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton,
                !canSave && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              activeOpacity={0.7}
              disabled={!canSave}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
  keyboardAvoid: {
    flex: 1,
  },
  inputContainer: {
    flex: 1,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: feedTheme.colors.background,
    borderWidth: 1,
    borderColor: feedTheme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: feedTheme.colors.textPrimary,
    lineHeight: 20,
    minHeight: 120,
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
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: feedTheme.colors.border,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: feedTheme.colors.border,
    backgroundColor: feedTheme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: feedTheme.colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: feedTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
