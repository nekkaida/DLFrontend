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
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SPORT_COLORS = {
  pickleball: {
    primary: '#A04DFE',
    secondary: '#7B2FD4',
    glow: 'rgba(160, 77, 254, 0.35)',
    gradient: ['#A04DFE', '#7B2FD4'] as [string, string],
  },
  tennis: {
    primary: '#7CB342',
    secondary: '#558B2F',
    glow: 'rgba(124, 179, 66, 0.35)',
    gradient: ['#7CB342', '#558B2F'] as [string, string],
  },
  padel: {
    primary: '#42A5F5',
    secondary: '#1E88E5',
    glow: 'rgba(66, 165, 245, 0.35)',
    gradient: ['#42A5F5', '#1E88E5'] as [string, string],
  },
};

interface RegisterInterestBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  seasonName: string;
  interestedCount: number;
  sport?: 'pickleball' | 'tennis' | 'padel';
  isLoading?: boolean;
}

export const RegisterInterestBottomSheet: React.FC<RegisterInterestBottomSheetProps> = ({
  visible,
  onClose,
  onConfirm,
  seasonName,
  interestedCount,
  sport = 'pickleball',
  isLoading = false,
}) => {
  const insets = useSafeAreaInsets();
  const colors = SPORT_COLORS[sport];

  const backdropOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(SCREEN_HEIGHT);
  const contentOpacity = useSharedValue(0);
  const headerScale = useSharedValue(0.8);
  const glowPulse = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 300 });
      sheetTranslateY.value = withSpring(0, { damping: 20, stiffness: 90, mass: 1 });
      contentOpacity.value = withDelay(150, withSpring(1, { damping: 20 }));
      headerScale.value = withDelay(200, withSpring(1, { damping: 15, stiffness: 100 }));
      glowPulse.value = withSequence(
        withTiming(1.2, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      );
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      sheetTranslateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
      contentOpacity.value = withTiming(0, { duration: 150 });
      headerScale.value = withTiming(0.8, { duration: 200 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: sheetTranslateY.value }] }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));
  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
    opacity: interpolate(headerScale.value, [0.8, 1], [0, 1], Extrapolation.CLAMP),
  }));
  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowPulse.value }],
    opacity: interpolate(glowPulse.value, [1, 1.2], [0.6, 1], Extrapolation.CLAMP),
  }));

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

        {/* Bottom Sheet */}
        <Animated.View style={[styles.sheet, sheetStyle, { paddingBottom: insets.bottom + 20 }]}>
          <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
            {/* Diagonal stripe overlay */}
            <View style={styles.stripesContainer}>
              {[...Array(12)].map((_, i) => (
                <View key={i} style={[styles.stripe, { left: -50 + i * 40, backgroundColor: colors.glow }]} />
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
              {/* Handle */}
              <View style={styles.handleContainer}>
                <View style={[styles.handle, { backgroundColor: colors.primary }]} />
              </View>

              {/* Header */}
              <Animated.View style={[styles.header, headerStyle]}>
                <View style={styles.headerTop}>
                  <Text style={styles.title}>Register Interest</Text>
                  <View style={styles.interestBadge}>
                    <LinearGradient
                      colors={colors.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.badgeGradient}
                    >
                      <Text style={styles.badgeEmoji}>✨</Text>
                    </LinearGradient>
                  </View>
                </View>
                <Text style={styles.seasonName} numberOfLines={2}>{seasonName}</Text>
              </Animated.View>

              {/* Stats row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.primary }]}>{interestedCount}</Text>
                  <Text style={styles.statLabel}>Interested</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.glow }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.primary }]}>#{interestedCount + 1}</Text>
                  <Text style={styles.statLabel}>You'd be</Text>
                </View>
              </View>

              {/* Info card */}
              <View style={[styles.infoCard, { borderColor: colors.glow }]}>
                <View style={styles.infoIconContainer}>
                  <LinearGradient colors={colors.gradient} style={styles.infoIcon}>
                    <Text style={styles.infoIconText}>i</Text>
                  </LinearGradient>
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoTitle}>No commitment yet</Text>
                  <Text style={styles.infoText}>
                    Registering interest lets the league know you're keen. When dates and registration open, you'll be notified early.
                  </Text>
                </View>
              </View>

              {/* Action buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleClose} disabled={isLoading}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmButtonWrapper} onPress={handleConfirm} disabled={isLoading} activeOpacity={0.85}>
                  <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.confirmButton}>
                    <Text style={styles.confirmButtonText}>
                      {isLoading ? 'Registering...' : "I'm Interested"}
                    </Text>
                  </LinearGradient>
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
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  blurContainer: {
    paddingTop: 8,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  stripesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  stripe: {
    position: 'absolute',
    top: -20,
    width: 20,
    height: '200%',
    opacity: 0.07,
    transform: [{ rotate: '25deg' }],
  },
  glowBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  glowGradient: {
    flex: 1,
  },
  content: {
    paddingBottom: 8,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.5,
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  interestBadge: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  badgeGradient: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeEmoji: {
    fontSize: 24,
  },
  seasonName: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
    opacity: 0.3,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 24,
    gap: 12,
  },
  infoIconContainer: {},
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIconText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
  },
  infoText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cancelButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonWrapper: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  confirmButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
