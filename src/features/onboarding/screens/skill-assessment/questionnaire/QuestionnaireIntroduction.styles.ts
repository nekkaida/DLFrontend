import { StyleSheet, Platform } from 'react-native';
import {
  scaleFontSize,
  getResponsivePadding,
  moderateScale,
  createShadow,
  isSmallDevice,
  scaleHeight
} from '../utils/responsive';

const isSmall = isSmallDevice();

export const styles = StyleSheet.create({
  // BOTTOM-CENTRIC RESPONSIVE LAYOUT - No absolute positioning, flex only!
  fullContainer: {
    flex: 1,
  },
  brandingSection: {
    flex: 1,  // Takes remaining space above card
    justifyContent: 'flex-end',  // Push branding to bottom of its space (closer to card)
    alignItems: 'flex-end',  // Align to right
    paddingRight: getResponsivePadding(20),
    paddingTop: moderateScale(isSmall ? 40 : 60),  // Top padding for SafeArea
    paddingBottom: moderateScale(isSmall ? 16 : 20),  // Reduced gap before card
  },
  introductionContainer: {
    // No flex - natural height based on content
    paddingHorizontal: getResponsivePadding(15),
    paddingBottom: Platform.select({
      ios: moderateScale(15),
      android: moderateScale(15),
    }),
  },

  // Greeting
  greetingContainer: {
    alignItems: 'flex-start',
    marginBottom: moderateScale(isSmall ? 12 : 14),
  },
  greetingText: {
    fontSize: scaleFontSize(isSmall ? 14 : 15),
    fontWeight: '600',
    color: '#A04DFE',
    fontFamily: 'Poppins',
  },
  tennisGreetingText: {
    color: '#A2E047',
  },
  padelGreetingText: {
    color: '#4DABFE',
  },
  whiteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(isSmall ? 20 : 24),  // Smaller border radius
    padding: getResponsivePadding(isSmall ? 20 : 24),  // Reduced padding for more compact look
    ...createShadow('#000', 0.1, 8, 5),
  },

  // Intro Content
  introTitle: {
    fontSize: scaleFontSize(isSmall ? 22 : 24),  // Smaller title font
    fontWeight: '500',
    color: '#000000',
    marginBottom: moderateScale(isSmall ? 16 : 20),  // Reduced margin
    fontFamily: 'Inter',
    textAlign: 'left',
  },
  introPoints: {
    marginBottom: moderateScale(isSmall ? 12 : 16),  // Reduced margin
  },
  introPointContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(isSmall ? 8 : 10),  // Tighter spacing
  },
  arrowCircle: {
    width: moderateScale(isSmall ? 22 : 24),  // Smaller circles
    height: moderateScale(isSmall ? 22 : 24),
    borderRadius: moderateScale(isSmall ? 11 : 12),
    backgroundColor: 'rgba(160, 77, 254, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(10),  // Reduced margin
  },
  tennisArrowCircle: {
    backgroundColor: 'rgba(162, 224, 71, 0.15)',
  },
  padelArrowCircle: {
    backgroundColor: 'rgba(77, 171, 254, 0.15)',
  },
  arrowText: {
    fontSize: scaleFontSize(isSmall ? 14 : 15),  // Smaller arrow
    color: '#A04DFE',
    fontWeight: '600',
  },
  tennisArrowText: {
    color: '#A2E047',
  },
  padelArrowText: {
    color: '#4DABFE',
  },
  introDescription: {
    fontSize: scaleFontSize(isSmall ? 13 : 14),  // Smaller description
    color: '#000000',
    lineHeight: scaleFontSize(isSmall ? 18 : 20),
    marginBottom: moderateScale(2),
    fontFamily: 'Poppins',
  },
  introPoint: {
    fontSize: scaleFontSize(isSmall ? 13 : 14),  // Smaller bullet text
    fontWeight: '500',
    color: '#8C8C8C',
    lineHeight: scaleFontSize(isSmall ? 18 : 20),
    fontFamily: 'Roboto',
    flex: 1,
  },

  // Buttons
  introButtonContainer: {
    gap: moderateScale(isSmall ? 10 : 12),  // Reduced gap
    marginTop: moderateScale(isSmall ? 16 : 20),  // Reduced margin
  },
  startButton: {
    height: moderateScale(isSmall ? 46 : 48),  // Slightly smaller buttons
    minHeight: 44,  // Ensure minimum touch target
    backgroundColor: '#A04DFE',
    borderRadius: moderateScale(isSmall ? 23 : 24),
    justifyContent: 'center',
    alignItems: 'center',
    ...createShadow('#A04DFE', 0.3, 4, 3),
  },
  tennisStartButton: {
    backgroundColor: '#A2E047',
    ...createShadow('#A2E047', 0.3, 4, 3),
  },
  padelStartButton: {
    backgroundColor: '#4DABFE',
    ...createShadow('#4DABFE', 0.3, 4, 3),
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: scaleFontSize(isSmall ? 15 : 16),  // Smaller button text
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  answerLaterButton: {
    height: moderateScale(isSmall ? 46 : 48),  // Slightly smaller buttons
    minHeight: 44,  // Ensure minimum touch target
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#A04DFE',
    borderRadius: moderateScale(isSmall ? 23 : 24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  tennisAnswerLaterButton: {
    borderColor: '#A2E047',
  },
  padelAnswerLaterButton: {
    borderColor: '#4DABFE',
  },
  answerLaterButtonText: {
    color: '#777777',
    fontSize: scaleFontSize(isSmall ? 15 : 16),  // Smaller button text
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  tennisAnswerLaterButtonText: {
    color: '#A2E047',
  },
  padelAnswerLaterButtonText: {
    color: '#4DABFE',
  },
});
