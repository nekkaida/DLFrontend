import React, { useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AuthColors } from '../styles/AuthStyles';
import {
  scale,
  verticalScale,
  moderateScale,
} from '@/core/utils/responsive';

// Platform-specific font family to avoid Android crashes when font is not loaded
const fontFamily = Platform.select({
  ios: 'SF Pro Text',
  android: 'Roboto',
  default: 'System',
});

// Safe haptics wrapper with debouncing
const triggerHaptic = async (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
  try {
    await Haptics.impactAsync(style);
  } catch {
    // Haptics not supported on this device
  }
};

interface LegalModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  visible,
  onClose,
  title,
  children,
}) => {
  // Debounce ref to prevent rapid close triggers (Android back button spam)
  const isClosingRef = useRef(false);
  // Ref for setTimeout cleanup to prevent memory leak
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset isClosingRef when modal visibility changes (fixes race condition)
  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
    }
    // Cleanup timeout on unmount or visibility change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [visible]);

  const handleClose = useCallback(() => {
    // Prevent rapid successive calls (debounce)
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    // Clear any existing timeout before setting new one
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Reset after animation completes
    timeoutRef.current = setTimeout(() => {
      isClosingRef.current = false;
      timeoutRef.current = null;
    }, 300);

    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);

    // Runtime guard for onClose - prevent crash if undefined
    if (onClose && typeof onClose === 'function') {
      onClose();
    }
  }, [onClose]);

  // Don't render modal content if children is empty/null
  // React.Children.count handles null/undefined (returns 0) and primitives (returns 1)
  const hasContent = React.Children.count(children) > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
      accessibilityViewIsModal={true}
    >
      <SafeAreaView
        style={styles.modalContainer}
        accessibilityLabel={`${title || 'Legal'} modal dialog`}
      >
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
            accessibilityLabel="Close modal"
            accessibilityRole="button"
            accessibilityHint="Closes this dialog and returns to previous screen"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={moderateScale(24)} color={colors.gray600} />
          </TouchableOpacity>
          <Text
            style={styles.modalTitle}
            numberOfLines={2}
            ellipsizeMode="tail"
            accessibilityRole="header"
          >
            {title || 'Legal Document'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.modalContent}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.scrollContent}
          scrollIndicatorInsets={{ right: 1 }}
        >
          {hasContent ? (
            <View style={styles.contentContainer}>
              {children}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No content available</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// Reusable text components for legal content
export const LegalSectionTitle: React.FC<{ children: React.ReactNode; isFirst?: boolean }> = ({ children, isFirst }) => (
  <Text
    style={[styles.sectionTitle, isFirst && styles.firstSectionTitle]}
    accessibilityRole="header"
  >
    {children}
  </Text>
);

export const LegalSubTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text style={styles.subTitle} accessibilityRole="header">
    {children}
  </Text>
);

export const LegalText: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text style={styles.text} accessibilityRole="text">
    {children}
  </Text>
);

export const LegalBulletList: React.FC<{ items: string[] }> = ({ items }) => {
  // Guard against undefined/null items to prevent crash
  if (!items || !Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <View style={styles.bulletList} accessibilityRole="list">
      {items.map((item, index) => (
        <View key={`bullet-${index}`} style={styles.bulletItem}>
          <Text style={styles.bullet} accessibilityLabel="">•</Text>
          <Text style={styles.bulletText} accessibilityRole="text">{item ?? ''}</Text>
        </View>
      ))}
    </View>
  );
};

// Modern color theme
const colors = {
  primary: AuthColors.primary,
  background: '#FFFFFF',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray900: '#111827',
  white: '#FFFFFF',
  black: '#000000',
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(16),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: verticalScale(1) },
        shadowOpacity: 0.05,
        shadowRadius: moderateScale(4),
      },
      android: {
        elevation: 2,
      },
    }),
  },
  closeButton: {
    width: scale(44),
    height: scale(44),
    borderRadius: moderateScale(22),
    backgroundColor: colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: moderateScale(17),
    fontWeight: '600',
    color: colors.gray900,
    fontFamily,
    textAlign: 'center',
    flex: 1,
    marginHorizontal: scale(8),
  },
  headerSpacer: {
    width: scale(44),
  },
  modalContent: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  scrollContent: {
    paddingBottom: verticalScale(40),
  },
  contentContainer: {
    backgroundColor: colors.white,
    marginHorizontal: scale(16),
    marginTop: verticalScale(16),
    borderRadius: moderateScale(12),
    padding: scale(24),
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: verticalScale(2) },
        shadowOpacity: 0.08,
        shadowRadius: moderateScale(8),
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: colors.gray900,
    fontFamily,
    marginBottom: verticalScale(16),
    marginTop: verticalScale(24),
    paddingTop: verticalScale(24),
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  firstSectionTitle: {
    marginTop: 0,
    borderTopWidth: 0,
    paddingTop: 0,
  },
  subTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: colors.gray700,
    fontFamily,
    marginBottom: verticalScale(8),
    marginTop: verticalScale(16),
  },
  text: {
    fontSize: moderateScale(15),
    fontWeight: '400',
    color: colors.gray700,
    fontFamily,
    lineHeight: moderateScale(24),
    marginBottom: verticalScale(20),
    letterSpacing: 0.2,
  },
  bulletList: {
    marginBottom: verticalScale(20),
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: verticalScale(8),
    paddingLeft: scale(8),
  },
  bullet: {
    fontSize: moderateScale(15),
    fontWeight: '400',
    color: colors.gray700,
    marginRight: scale(12),
    lineHeight: moderateScale(24),
  },
  bulletText: {
    flex: 1,
    fontSize: moderateScale(15),
    fontWeight: '400',
    color: colors.gray700,
    fontFamily,
    lineHeight: moderateScale(24),
    letterSpacing: 0.2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(60),
    marginHorizontal: scale(16),
    marginTop: verticalScale(16),
  },
  emptyText: {
    fontSize: moderateScale(16),
    fontWeight: '500',
    color: colors.gray500,
    fontFamily,
    textAlign: 'center',
  },
});
