import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Sport-specific color configurations
const SPORT_COLORS = {
  pickleball: {
    primary: '#A04DFE',
    secondary: '#7B2FD4',
    gradient: ['#A04DFE', '#7B2FD4'] as const,
  },
  tennis: {
    primary: '#7CB342',
    secondary: '#558B2F',
    gradient: ['#7CB342', '#558B2F'] as const,
  },
  padel: {
    primary: '#42A5F5',
    secondary: '#1E88E5',
    gradient: ['#42A5F5', '#1E88E5'] as const,
  },
};

interface LeaveWaitlistDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  position: number;
  seasonName: string;
  sport?: 'pickleball' | 'tennis' | 'padel';
  isLoading?: boolean;
}

export const LeaveWaitlistDialog: React.FC<LeaveWaitlistDialogProps> = ({
  visible,
  onClose,
  onConfirm,
  position,
  seasonName,
  sport = 'pickleball',
  isLoading = false,
}) => {
  const colors = SPORT_COLORS[sport];

  // Animation values
  const backdropOpacity = useSharedValue(0);
  const dialogScale = useSharedValue(0.8);
  const dialogOpacity = useSharedValue(0);
  const contentSlide = useSharedValue(20);
  const warningPulse = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 200 });
      dialogScale.value = withSpring(1, { damping: 15, stiffness: 100 });
      dialogOpacity.value = withTiming(1, { duration: 200 });
      contentSlide.value = withDelay(100, withSpring(0, { damping: 20 }));

      // Warning pulse
      warningPulse.value = withSpring(1.05, { damping: 8, stiffness: 200 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 150 });
      dialogScale.value = withTiming(0.8, { duration: 150 });
      dialogOpacity.value = withTiming(0, { duration: 150 });
      contentSlide.value = withTiming(20, { duration: 100 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const dialogStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dialogScale.value }],
    opacity: dialogOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentSlide.value }],
    opacity: interpolate(contentSlide.value, [20, 0], [0, 1], Extrapolation.CLAMP),
  }));

  const warningStyle = useAnimatedStyle(() => ({
    transform: [{ scale: warningPulse.value }],
  }));

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onConfirm();
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        {/* Dialog */}
        <Animated.View style={[styles.dialog, dialogStyle]}>
          <BlurView intensity={90} tint="dark" style={styles.blurContainer}>
            <Animated.View style={[styles.content, contentStyle]}>
              {/* Warning icon */}
              <Animated.View style={[styles.warningIconContainer, warningStyle]}>
                <View style={[styles.warningIcon, { borderColor: '#EF4444' }]}>
                  <Text style={styles.warningIconText}>!</Text>
                </View>
              </Animated.View>

              {/* Title */}
              <Text style={styles.title}>Leave Waitlist?</Text>

              {/* Position indicator */}
              <View style={styles.positionContainer}>
                <LinearGradient
                  colors={colors.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.positionBadge}
                >
                  <Text style={styles.positionText}>#{position}</Text>
                </LinearGradient>
                <Text style={styles.positionLabel}>Your current spot</Text>
              </View>

              {/* Warning message */}
              <View style={styles.messageContainer}>
                <Text style={styles.messageText}>
                  You'll lose your position in the queue for{' '}
                  <Text style={styles.seasonText}>{seasonName}</Text>
                </Text>
                <Text style={styles.subMessage}>
                  If you rejoin later, you'll be placed at the end of the waitlist.
                </Text>
              </View>

              {/* Buttons */}
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={styles.keepButton}
                  onPress={handleClose}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={colors.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.keepButtonGradient}
                  >
                    <Text style={styles.keepButtonText}>Keep My Spot</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.leaveButton}
                  onPress={handleConfirm}
                  activeOpacity={0.7}
                  disabled={isLoading}
                >
                  <Text style={styles.leaveButtonText}>
                    {isLoading ? 'Leaving...' : 'Leave Waitlist'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </BlurView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  blurContainer: {
    overflow: 'hidden',
    borderRadius: 24,
  },
  content: {
    padding: 28,
    alignItems: 'center',
  },
  warningIconContainer: {
    marginBottom: 20,
  },
  warningIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningIconText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#EF4444',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  positionContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  positionBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 8,
  },
  positionText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  positionLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  messageContainer: {
    marginBottom: 28,
  },
  messageText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  seasonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  subMessage: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    lineHeight: 18,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  keepButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  keepButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  leaveButton: {
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});

export default LeaveWaitlistDialog;
