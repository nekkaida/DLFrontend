import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Sport-specific color configurations
const SPORT_COLORS = {
  pickleball: {
    primary: '#A04DFE',
    secondary: '#7B2FD4',
    glow: 'rgba(160, 77, 254, 0.4)',
    gradient: ['#A04DFE', '#7B2FD4'] as const,
  },
  tennis: {
    primary: '#7CB342',
    secondary: '#558B2F',
    glow: 'rgba(124, 179, 66, 0.4)',
    gradient: ['#7CB342', '#558B2F'] as const,
  },
  padel: {
    primary: '#42A5F5',
    secondary: '#1E88E5',
    glow: 'rgba(66, 165, 245, 0.4)',
    gradient: ['#42A5F5', '#1E88E5'] as const,
  },
};

interface WaitlistBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onJoin: () => void;
  seasonName: string;
  currentWaitlistCount: number;
  sport?: 'pickleball' | 'tennis' | 'padel';
  isLoading?: boolean;
}

export const WaitlistBottomSheet: React.FC<WaitlistBottomSheetProps> = ({
  visible,
  onClose,
  onJoin,
  seasonName,
  currentWaitlistCount,
  sport = 'pickleball',
  isLoading = false,
}) => {
  const insets = useSafeAreaInsets();
  const colors = SPORT_COLORS[sport];

  // Animation values
  const backdropOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(SCREEN_HEIGHT);
  const contentOpacity = useSharedValue(0);
  const headerScale = useSharedValue(0.8);
  const badgeRotate = useSharedValue(-15);
  const glowPulse = useSharedValue(1);
  const stripeOffset = useSharedValue(0);

  // Estimated position (next in queue)
  const estimatedPosition = currentWaitlistCount + 1;

  useEffect(() => {
    if (visible) {
      // Entrance animations
      backdropOpacity.value = withTiming(1, { duration: 300 });
      sheetTranslateY.value = withSpring(0, {
        damping: 20,
        stiffness: 90,
        mass: 1,
      });
      contentOpacity.value = withDelay(150, withSpring(1, { damping: 20 }));
      headerScale.value = withDelay(200, withSpring(1, { damping: 15, stiffness: 100 }));
      badgeRotate.value = withDelay(300, withSpring(0, { damping: 12, stiffness: 80 }));

      // Continuous glow pulse
      glowPulse.value = withSequence(
        withTiming(1.2, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      );

      // Stripe animation
      stripeOffset.value = withTiming(20, { duration: 2000 });
    } else {
      // Exit animations
      backdropOpacity.value = withTiming(0, { duration: 200 });
      sheetTranslateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
      contentOpacity.value = withTiming(0, { duration: 150 });
      headerScale.value = withTiming(0.8, { duration: 200 });
    }
  }, [visible]);

  // Animated styles
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
    opacity: interpolate(headerScale.value, [0.8, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${badgeRotate.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowPulse.value }],
    opacity: interpolate(glowPulse.value, [1, 1.2], [0.6, 1], Extrapolation.CLAMP),
  }));

  const handleJoin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onJoin();
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

        {/* Bottom Sheet */}
        <Animated.View style={[styles.sheet, sheetStyle, { paddingBottom: insets.bottom + 20 }]}>
          {/* Glassmorphic background */}
          <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
            {/* Diagonal stripes pattern overlay */}
            <View style={styles.stripesContainer}>
              {[...Array(12)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.stripe,
                    {
                      left: -50 + i * 40,
                      backgroundColor: colors.glow,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Gradient border glow */}
            <Animated.View style={[styles.glowBorder, glowStyle]}>
              <LinearGradient
                colors={[colors.primary, 'transparent', colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.glowGradient}
              />
            </Animated.View>

            {/* Content */}
            <Animated.View style={[styles.content, contentStyle]}>
              {/* Handle bar */}
              <View style={styles.handleContainer}>
                <View style={[styles.handle, { backgroundColor: colors.primary }]} />
              </View>

              {/* Header with position badge */}
              <Animated.View style={[styles.header, headerStyle]}>
                <View style={styles.headerTop}>
                  <Text style={styles.title}>Join Waitlist</Text>
                  <Animated.View style={[styles.positionBadge, badgeStyle]}>
                    <LinearGradient
                      colors={colors.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.badgeGradient}
                    >
                      <Text style={styles.badgeLabel}>YOUR SPOT</Text>
                      <Text style={styles.badgeNumber}>#{estimatedPosition}</Text>
                    </LinearGradient>
                  </Animated.View>
                </View>
                <Text style={styles.seasonName}>{seasonName}</Text>
              </Animated.View>

              {/* Stats row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.primary }]}>
                    {currentWaitlistCount}
                  </Text>
                  <Text style={styles.statLabel}>In Queue</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.glow }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.primary }]}>
                    #{estimatedPosition}
                  </Text>
                  <Text style={styles.statLabel}>Your Position</Text>
                </View>
              </View>

              {/* Info card */}
              <View style={[styles.infoCard, { borderColor: colors.glow }]}>
                <View style={styles.infoIconContainer}>
                  <LinearGradient
                    colors={colors.gradient}
                    style={styles.infoIcon}
                  >
                    <Text style={styles.infoIconText}>i</Text>
                  </LinearGradient>
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoTitle}>How it works</Text>
                  <Text style={styles.infoText}>
                    When registration opens, you'll be automatically promoted based on your queue position. No action needed!
                  </Text>
                </View>
              </View>

              {/* Buttons */}
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.joinButtonContainer}
                  onPress={handleJoin}
                  activeOpacity={0.85}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={colors.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.joinButton}
                  >
                    <Text style={styles.joinButtonText}>
                      {isLoading ? 'Joining...' : 'Join Waitlist'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Fine print */}
              <Text style={styles.finePrint}>
                You can leave the waitlist anytime from your profile
              </Text>
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
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  blurContainer: {
    overflow: 'hidden',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  stripesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    opacity: 0.1,
  },
  stripe: {
    position: 'absolute',
    width: 20,
    height: '200%',
    top: -50,
    transform: [{ rotate: '25deg' }],
  },
  glowBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    overflow: 'hidden',
  },
  glowGradient: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 12,
  },
  handleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    opacity: 0.6,
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  positionBadge: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  badgeGradient: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  badgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1,
    marginBottom: 2,
  },
  badgeNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  seasonName: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 20,
    opacity: 0.3,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  infoIconContainer: {
    marginRight: 14,
  },
  infoIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIconText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  joinButtonContainer: {
    flex: 2,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  joinButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  finePrint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
  },
});

export default WaitlistBottomSheet;
