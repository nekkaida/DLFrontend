import { StyleSheet, Platform } from 'react-native';
import {
  scaleFontSize,
  moderateScale,
  getResponsivePadding,
  isSmallDevice,
  createShadow
} from '../utils/responsive';

const isSmall = isSmallDevice();

export const styles = StyleSheet.create({
  // Header
  questionnaireHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsivePadding(20),
    paddingTop: Platform.select({
      ios: moderateScale(isSmall ? 50 : 60),     // Much more space for iOS
      android: moderateScale(isSmall ? 40 : 50), // More space for Android
    }),
    paddingBottom: moderateScale(isSmall ? 12 : 16),
  },
  backButton: {
    width: moderateScale(48),
    height: moderateScale(48),
    justifyContent: 'center',
    alignItems: 'center',
    // Ensure minimum touch target
    minWidth: 44,
    minHeight: 44,
  },
  questionnaireTitle: {
    fontSize: scaleFontSize(isSmall ? 24 : 28),
    fontWeight: '600',
    color: '#CA9BFF',
    fontFamily: 'Poppins',
    textTransform: 'lowercase',
  },
  tennisQuestionnaireTitle: {
    color: '#D7FFA9',
  },
  padelQuestionnaireTitle: {
    color: '#9BD0FF',
  },
  headerSpacer: {
    width: moderateScale(40),
  },

  // Question Container - Card stack layout
  questionnaireContainer: {
    flex: 1,
    paddingHorizontal: getResponsivePadding(15),
    paddingBottom: Platform.select({
      ios: moderateScale(20),      // Account for iOS home indicator
      android: moderateScale(15),
    }),
  },

  // Card Stack Container
  cardStack: {
    flex: 1,
    position: 'relative',
  },

  // Stacked Card Layers (showing depth/remaining cards) - only peek at top
  stackedCardLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden', // Hide most of the card
  },

  // Card Placeholder (empty card showing just top edge)
  cardPlaceholder: {
    height: '100%',
    backgroundColor: '#FFFFFF',  // Solid white
    borderRadius: moderateScale(isSmall ? 24 : 30),
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.08)', // Subtle dark border for depth
    ...createShadow('#000', 0.2, 8, 6), // Strong shadow for contrast
    opacity: 1,  // Ensure fully opaque
  },

  // Next Card Container (behind current, animated to slide up)
  nextCardContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 15, // Behind active card
  },

  // Active Card Container (animated, slides left)
  activeCardContainer: {
    position: 'relative',
    flex: 1,
    zIndex: 20, // In front of next card
  },

  // Loading/Error
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: scaleFontSize(16),
    color: '#6C7278',
    fontFamily: 'Roboto',
    textAlign: 'center',
  },
  errorText: {
    fontSize: scaleFontSize(16),
    color: '#FF6B6B',
    fontFamily: 'Roboto',
    textAlign: 'center',
  },
});
