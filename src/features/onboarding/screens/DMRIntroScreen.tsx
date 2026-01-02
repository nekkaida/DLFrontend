import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Path } from 'react-native-svg';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useOnboarding } from '../OnboardingContext';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive calculations
const isSmallDevice = screenHeight < 700;
const isMediumDevice = screenHeight >= 700 && screenHeight < 800;
const horizontalPadding = Math.max(screenWidth * 0.08, 20);

// Video size based on screen
const videoSize = isSmallDevice ? 200 : isMediumDevice ? 250 : 300;

const DMRIntroScreen = () => {
  const { data } = useOnboarding();

  // Create video player for the intro animation
  const videoPlayer = useVideoPlayer(require('@/assets/videos/connect_partner.mp4'), player => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  const handleLetsGo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Navigate to skill assessment for first selected sport
    const selectedSports = data.selectedSports || [];
    if (selectedSports.length > 0) {
      router.push(`/onboarding/skill-assessment?sport=${selectedSports[0]}&sportIndex=0`);
    } else {
      // Fallback - shouldn't happen if flow is correct
      router.push('/user-dashboard');
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
          <Path
            d="M22.5 27L13.5 18L22.5 9"
            stroke="#000000"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Let's get your game started</Text>
          <Text style={styles.subtitle}>You're all set with your profile!</Text>
          <Text style={styles.description}>
            Before you jump in, we'll help you get your Deuce Match Rating (DMR) for each sport you selected.
          </Text>
          <Text style={styles.description}>
            Just answer a few quick questions per sport to find your starting level.
          </Text>
          <Text style={styles.description}>
            Prefer to skip now? you can always complete it later.
          </Text>
        </View>

        {/* Video Container */}
        <View style={[styles.videoContainer, { width: videoSize, height: videoSize }]}>
          <VideoView
            player={videoPlayer}
            contentFit="contain"
            nativeControls={false}
            style={{ width: videoSize, height: videoSize }}
          />
        </View>
      </View>

      {/* Bottom Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={handleLetsGo}
          style={styles.buttonTouchableContainer}
        >
          <LinearGradient
            colors={['#FEA04D', '#FF8C1A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Let's Go!</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    position: 'absolute',
    top: Platform.select({
      ios: isSmallDevice ? 50 : 60,
      android: isSmallDevice ? 40 : 50,
    }),
    left: 19,
    zIndex: 10,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingTop: Platform.select({
      ios: isSmallDevice ? 80 : 100,
      android: isSmallDevice ? 70 : 90,
    }),
  },
  headerContainer: {
    paddingHorizontal: horizontalPadding,
    marginBottom: isSmallDevice ? 12 : 20,
  },
  title: {
    fontSize: isSmallDevice ? 24 : 28,
    fontWeight: '700',
    color: '#000000',
    lineHeight: isSmallDevice ? 30 : 36,
    marginBottom: isSmallDevice ? 20 : 28,
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: isSmallDevice ? 14 : 16,
    fontWeight: '500',
    color: '#8C8C8C',
    lineHeight: isSmallDevice ? 20 : 22,
    marginBottom: isSmallDevice ? 12 : 16,
    fontFamily: 'Inter',
  },
  description: {
    fontSize: isSmallDevice ? 14 : 16,
    fontWeight: '500',
    color: '#8C8C8C',
    lineHeight: isSmallDevice ? 20 : 22,
    marginBottom: isSmallDevice ? 8 : 12,
    fontFamily: 'Inter',
  },
  videoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: Platform.select({
      ios: isSmallDevice ? 60 : 80,
      android: isSmallDevice ? 50 : 70,
    }),
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  buttonTouchableContainer: {
    borderRadius: 22,
    overflow: 'hidden',
    width: screenWidth * 0.7,
  },
  button: {
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    fontFamily: 'Inter',
  },
});

export default DMRIntroScreen;
