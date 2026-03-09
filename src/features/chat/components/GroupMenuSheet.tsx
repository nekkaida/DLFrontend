import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { scale, verticalScale, moderateScale } from '@/core/utils/responsive';
import { getSportColors } from '@/constants/SportsColor';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MenuOption {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
}

interface GroupMenuSheetProps {
  visible: boolean;
  onClose: () => void;
  sportType?: string;
  options: MenuOption[];
  title?: string;
}

export const GroupMenuSheet: React.FC<GroupMenuSheetProps> = ({
  visible,
  onClose,
  sportType = 'PICKLEBALL',
  options,
  title,
}) => {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const sportColors = getSportColors(sportType as 'PICKLEBALL' | 'TENNIS' | 'PADEL');
  const primaryColor = sportColors.primary;
  const gradientStart = sportColors.gradient?.[0] || primaryColor;

  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 300,
          mass: 0.8,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 15,
          stiffness: 200,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleOptionPress = (option: MenuOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    // Delay navigation to allow animation to complete
    setTimeout(() => {
      option.onPress();
    }, 150);
  };

  const handleBackdropPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={styles.backdropPressable} onPress={handleBackdropPress}>
            <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
          </Pressable>
        </Animated.View>

        {/* Menu Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [
                { translateY },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          {/* Handle indicator */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: gradientStart }]} />
          </View>

          {/* Title */}
          {title && (
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{title}</Text>
            </View>
          )}

          {/* Menu Options */}
          <View style={styles.optionsContainer}>
            {options.map((option, index) => (
              <Pressable
                key={option.id}
                style={({ pressed }) => [
                  styles.optionItem,
                  index !== options.length - 1 && styles.optionItemBorder,
                  pressed && styles.optionItemPressed,
                ]}
                onPress={() => handleOptionPress(option)}
              >
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: option.destructive
                        ? 'rgba(239, 68, 68, 0.1)'
                        : `${gradientStart}15`,
                    },
                  ]}
                >
                  <Ionicons
                    name={option.icon}
                    size={moderateScale(20)}
                    color={option.destructive ? '#EF4444' : gradientStart}
                  />
                </View>
                <Text
                  style={[
                    styles.optionLabel,
                    option.destructive && styles.optionLabelDestructive,
                  ]}
                >
                  {option.label}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={moderateScale(18)}
                  color={option.destructive ? '#EF4444' : '#9CA3AF'}
                />
              </Pressable>
            ))}
          </View>

          {/* Cancel Button */}
          <Pressable
            style={({ pressed }) => [
              styles.cancelButton,
              pressed && styles.cancelButtonPressed,
            ]}
            onPress={handleBackdropPress}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  backdropPressable: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    paddingBottom: verticalScale(34),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(8),
  },
  handle: {
    width: scale(40),
    height: verticalScale(4),
    borderRadius: moderateScale(2),
    opacity: 0.6,
  },
  titleContainer: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  optionsContainer: {
    marginTop: verticalScale(8),
    marginHorizontal: scale(16),
    backgroundColor: '#F9FAFB',
    borderRadius: moderateScale(16),
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(16),
    backgroundColor: '#FFFFFF',
  },
  optionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionItemPressed: {
    backgroundColor: '#F9FAFB',
  },
  iconContainer: {
    width: scale(40),
    height: scale(40),
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(14),
  },
  optionLabel: {
    flex: 1,
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  optionLabelDestructive: {
    color: '#EF4444',
  },
  cancelButton: {
    marginTop: verticalScale(12),
    marginHorizontal: scale(16),
    paddingVertical: verticalScale(16),
    backgroundColor: '#F3F4F6',
    borderRadius: moderateScale(14),
    alignItems: 'center',
  },
  cancelButtonPressed: {
    backgroundColor: '#E5E7EB',
  },
  cancelText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: -0.2,
  },
});

export default GroupMenuSheet;
