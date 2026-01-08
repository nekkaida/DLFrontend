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
    justifyContent: 'center',
    paddingHorizontal: getResponsivePadding(20),
    paddingTop: Platform.select({
      ios: moderateScale(isSmall ? 16 : 20),
      android: moderateScale(isSmall ? 12 : 16),
    }),
    paddingBottom: moderateScale(isSmall ? 12 : 16),
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
    bottom: 0, // Use bottom instead of height: 100% for proper flex calculation
    zIndex: 15, // Behind active card
  },

  // Active Card Container (used by carousel items)
  activeCardContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  // Blank card (white card for when no next question)
  blankCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(isSmall ? 24 : 30),
    ...createShadow('#000', 0.1, 8, 5),
  },

  // Preview card (shows next question text dimmed)
  previewCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(isSmall ? 24 : 30),
    ...createShadow('#000', 0.12, 10, 6),
    overflow: 'hidden',
  },
  previewCardContent: {
    flex: 1,
    paddingHorizontal: getResponsivePadding(isSmall ? 24 : 28),
    paddingTop: moderateScale(isSmall ? 24 : 28),
  },
  previewInstructionText: {
    fontSize: scaleFontSize(isSmall ? 12 : 13),
    color: '#8C8C8C',
    marginBottom: moderateScale(isSmall ? 12 : 16),
    fontFamily: 'Roboto',
    textAlign: 'left',
  },
  previewQuestionText: {
    fontSize: scaleFontSize(isSmall ? 18 : 20),
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Roboto',
    lineHeight: scaleFontSize(isSmall ? 24 : 28),
    textAlign: 'left',
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
