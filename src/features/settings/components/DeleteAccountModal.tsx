import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { toast } from 'sonner-native';
import { theme } from '@core/theme/theme';
import { authClient } from '@/lib/auth-client';
import { navigateAndClearStack } from '@core/navigation';
import axiosInstance, { endpoints } from '@/lib/endpoints';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DELETION_REASONS = [
  "I no longer use the app",
  "Privacy concerns",
  "Found a better alternative",
  "Technical issues",
  "Too many notifications",
  "Other",
] as const;

const CONFIRM_COUNTDOWN_SECONDS = 5;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
}

type Step = 'reason' | 'confirm';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DeleteAccountModal({ visible, onClose }: DeleteAccountModalProps) {
  const [step, setStep] = useState<Step>('reason');
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [reasonText, setReasonText] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [countdown, setCountdown] = useState(CONFIRM_COUNTDOWN_SECONDS);
  const [isDeleting, setIsDeleting] = useState(false);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset all state when modal is closed / reopened
  useEffect(() => {
    if (!visible) {
      setStep('reason');
      setSelectedReason(null);
      setReasonText('');
      setDropdownOpen(false);
      setCountdown(CONFIRM_COUNTDOWN_SECONDS);
      setIsDeleting(false);
      if (countdownRef.current) clearInterval(countdownRef.current);
    }
  }, [visible]);

  // Start countdown when entering the confirm step
  useEffect(() => {
    if (step === 'confirm') {
      setCountdown(CONFIRM_COUNTDOWN_SECONDS);
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [step]);

  const handleClose = useCallback(() => {
    if (isDeleting) return;
    onClose();
  }, [isDeleting, onClose]);

  const handleProceedToConfirm = useCallback(() => {
    setStep('confirm');
    setDropdownOpen(false);
  }, []);

  const handleBackToReason = useCallback(() => {
    setStep('reason');
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    if (!selectedReason || countdown > 0 || isDeleting) return;
    setIsDeleting(true);
    try {
      await axiosInstance.delete(endpoints.player.deleteAccount, {
        data: { reason: selectedReason, reasonText: reasonText.trim() || undefined },
      });
      // Sign out locally (DB sessions already gone via cascade)
      await authClient.signOut();
      toast.success('Account Deleted', {
        description: 'Your account has been permanently deleted.',
      });
      navigateAndClearStack('/');
    } catch {
      setIsDeleting(false);
      toast.error('Deletion Failed', {
        description: 'Could not delete your account. Please try again.',
      });
    }
  }, [selectedReason, countdown, isDeleting, reasonText]);

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderReasonStep = () => (
    <View style={styles.modalBox}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.warningIconWrap}>
          <Ionicons name="trash-outline" size={22} color={theme.colors.semantic.error} />
        </View>
        <Text style={styles.title}>Delete Account</Text>
        <Pressable onPress={handleClose} hitSlop={12} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={theme.colors.neutral.gray[400]} />
        </Pressable>
      </View>

      {/* Warning */}
      <View style={styles.warningBanner}>
        <Ionicons name="alert-circle" size={16} color={theme.colors.semantic.error} />
        <Text style={styles.warningText}>
          This action is <Text style={styles.bold}>permanent</Text> and cannot be undone. Your profile,
          personal data, and active sessions will be removed. Match history will be anonymized.
        </Text>
      </View>

      {/* Dropdown label */}
      <Text style={styles.fieldLabel}>Why are you leaving?</Text>

      {/* Dropdown trigger */}
      <Pressable
        style={[styles.dropdownTrigger, dropdownOpen && styles.dropdownTriggerOpen]}
        onPress={() => setDropdownOpen((o) => !o)}
        accessibilityRole="combobox"
        accessibilityLabel="Select deletion reason"
      >
        <Text style={[styles.dropdownTriggerText, !selectedReason && styles.placeholder]}>
          {selectedReason ?? 'Select a reason…'}
        </Text>
        <Ionicons
          name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={theme.colors.neutral.gray[400]}
        />
      </Pressable>

      {/* Dropdown options */}
      {dropdownOpen && (
        <View style={styles.dropdownList}>
          {DELETION_REASONS.map((reason, idx) => (
            <Pressable
              key={reason}
              style={[
                styles.dropdownItem,
                idx < DELETION_REASONS.length - 1 && styles.dropdownItemBorder,
                selectedReason === reason && styles.dropdownItemSelected,
              ]}
              onPress={() => {
                setSelectedReason(reason);
                setDropdownOpen(false);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedReason === reason }}
            >
              <Text
                style={[
                  styles.dropdownItemText,
                  selectedReason === reason && styles.dropdownItemTextSelected,
                ]}
              >
                {reason}
              </Text>
              {selectedReason === reason && (
                <Ionicons name="checkmark" size={16} color={theme.colors.semantic.error} />
              )}
            </Pressable>
          ))}
        </View>
      )}

      {/* Optional details */}
      <Text style={[styles.fieldLabel, { marginTop: 16 }]}>
        Additional comments <Text style={styles.optional}>(optional)</Text>
      </Text>
      <TextInput
        style={styles.textArea}
        placeholder="Tell us more…"
        placeholderTextColor={theme.colors.neutral.gray[300]}
        multiline
        numberOfLines={3}
        value={reasonText}
        onChangeText={setReasonText}
        maxLength={500}
        textAlignVertical="top"
        accessibilityLabel="Additional deletion reason"
      />

      {/* Actions */}
      <Pressable
        style={[styles.proceedBtn, !selectedReason && styles.proceedBtnDisabled]}
        onPress={handleProceedToConfirm}
        disabled={!selectedReason}
        accessibilityRole="button"
        accessibilityLabel="Proceed to delete"
        accessibilityState={{ disabled: !selectedReason }}
      >
        <Ionicons name="arrow-forward" size={16} color={theme.colors.neutral.white} style={{ marginRight: 6 }} />
        <Text style={styles.proceedBtnText}>Proceed to Delete</Text>
      </Pressable>

      <Pressable onPress={handleClose} style={styles.cancelLink}>
        <Text style={styles.cancelLinkText}>Cancel</Text>
      </Pressable>
    </View>
  );

  const renderConfirmStep = () => (
    <View style={styles.modalBox}>
      {/* Header */}
      <View style={[styles.headerRow, { marginBottom: 8 }]}>
        <View style={[styles.warningIconWrap, styles.warningIconWrapLarge]}>
          <Ionicons name="warning" size={26} color={theme.colors.semantic.error} />
        </View>
        <Text style={[styles.title, { flex: 1 }]}>Are you absolutely sure?</Text>
      </View>

      {/* Final warning box */}
      <View style={styles.finalWarningBox}>
        <Text style={styles.finalWarningText}>
          Deleting your account will:{'\n\n'}
          {'  '}• <Text style={styles.bold}>Permanently remove</Text> your profile, login credentials,
          personal data, and active sessions.{'\n'}
          {'  '}• <Text style={styles.bold}>Anonymize</Text> your messages and match history — these
          remain visible to others as "Deleted User".{'\n\n'}
          <Text style={[styles.bold, { color: theme.colors.semantic.error }]}>
            This cannot be undone.
          </Text>
        </Text>
      </View>

      {/* Delete button with countdown */}
      <Pressable
        style={[
          styles.deleteForeverBtn,
          (countdown > 0 || isDeleting) && styles.deleteForeverBtnDisabled,
        ]}
        onPress={handleDeleteAccount}
        disabled={countdown > 0 || isDeleting}
        accessibilityRole="button"
        accessibilityLabel={countdown > 0 ? `Delete Forever, wait ${countdown} seconds` : 'Delete Forever'}
        accessibilityState={{ disabled: countdown > 0 || isDeleting }}
      >
        {isDeleting ? (
          <ActivityIndicator size="small" color={theme.colors.neutral.white} />
        ) : (
          <>
            <Ionicons name="trash" size={16} color={theme.colors.neutral.white} style={{ marginRight: 6 }} />
            <Text style={styles.deleteForeverBtnText}>
              {countdown > 0 ? `Delete Forever (${countdown})` : 'Delete Forever'}
            </Text>
          </>
        )}
      </Pressable>

      {/* Keep account */}
      <Pressable
        onPress={handleBackToReason}
        disabled={isDeleting}
        style={[styles.keepAccountBtn, isDeleting && { opacity: 0.5 }]}
        accessibilityRole="button"
        accessibilityLabel="Keep my account"
      >
        <Text style={styles.keepAccountBtnText}>Keep My Account</Text>
      </Pressable>
    </View>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Backdrop */}
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} accessible={false}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.androidBackdrop]} />
          )}
        </Pressable>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 'reason' ? renderReasonStep() : renderConfirmStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  androidBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  modalBox: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.md,
    padding: 24,
    ...theme.shadows.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  warningIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${theme.colors.semantic.error}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningIconWrapLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  title: {
    flex: 1,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.neutral.gray[700],
  },
  closeBtn: {
    padding: 4,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: `${theme.colors.semantic.error}10`,
    borderRadius: theme.borderRadius.base,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.semantic.error,
  },
  warningText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.neutral.gray[600],
    lineHeight: 18,
  },
  bold: {
    fontWeight: theme.typography.fontWeight.bold,
  },
  fieldLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.neutral.gray[600],
    marginBottom: 8,
  },
  optional: {
    fontWeight: theme.typography.fontWeight.regular,
    color: theme.colors.neutral.gray[400],
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 46,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.neutral.gray[200],
    paddingHorizontal: 14,
    backgroundColor: theme.colors.neutral.white,
    ...theme.shadows.sm,
  },
  dropdownTriggerOpen: {
    borderColor: theme.colors.semantic.error,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownTriggerText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.neutral.gray[700],
  },
  placeholder: {
    color: theme.colors.neutral.gray[300],
  },
  dropdownList: {
    borderWidth: theme.borderWidth.thin,
    borderTopWidth: 0,
    borderColor: theme.colors.semantic.error,
    borderBottomLeftRadius: theme.borderRadius.md,
    borderBottomRightRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.neutral.white,
    marginBottom: 4,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.neutral.gray[200],
  },
  dropdownItemSelected: {
    backgroundColor: `${theme.colors.semantic.error}08`,
  },
  dropdownItemText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.neutral.gray[600],
  },
  dropdownItemTextSelected: {
    color: theme.colors.semantic.error,
    fontWeight: theme.typography.fontWeight.medium,
  },
  textArea: {
    height: 88,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.neutral.gray[200],
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.neutral.gray[700],
    backgroundColor: theme.colors.neutral.white,
    ...theme.shadows.sm,
  },
  proceedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    height: 46,
    borderRadius: theme.borderRadius.base,
    backgroundColor: theme.colors.semantic.error,
  },
  proceedBtnDisabled: {
    backgroundColor: theme.colors.neutral.gray[200],
  },
  proceedBtnText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.neutral.white,
  },
  cancelLink: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 6,
  },
  cancelLinkText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.neutral.gray[400],
  },
  finalWarningBox: {
    backgroundColor: `${theme.colors.semantic.error}08`,
    borderRadius: theme.borderRadius.base,
    borderWidth: theme.borderWidth.thin,
    borderColor: `${theme.colors.semantic.error}30`,
    padding: 16,
    marginBottom: 24,
  },
  finalWarningText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.neutral.gray[600],
    lineHeight: 20,
  },
  deleteForeverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: theme.borderRadius.base,
    backgroundColor: theme.colors.semantic.error,
    marginBottom: 12,
  },
  deleteForeverBtnDisabled: {
    backgroundColor: theme.colors.neutral.gray[300],
  },
  deleteForeverBtnText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.neutral.white,
  },
  keepAccountBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: theme.borderRadius.base,
    borderWidth: theme.borderWidth.base,
    borderColor: theme.colors.neutral.gray[300],
  },
  keepAccountBtnText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.neutral.gray[600],
  },
});
