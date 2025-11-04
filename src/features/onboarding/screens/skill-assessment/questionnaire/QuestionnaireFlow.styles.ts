import { StyleSheet } from 'react-native';
import {
  scaleFontSize,
  moderateScale,
  getResponsivePadding,
  isSmallDevice
} from '../utils/responsive';

const isSmall = isSmallDevice();

export const styles = StyleSheet.create({
  // Header
  questionnaireHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsivePadding(20),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(20),
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

  // Question Container
  questionnaireContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: moderateScale(10),
  },
  cardStackContainer: {
    flex: 1,
    position: 'relative',
  },
  stackedCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  activeCard: {
    zIndex: 2,
    opacity: 1,
  },
  inactiveCard: {
    zIndex: 1,
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },

  // Loading/Error
  loadingText: {
    fontSize: scaleFontSize(16),
    color: '#6C7278',
    fontFamily: 'Roboto',
    textAlign: 'center',
    marginTop: moderateScale(20),
  },
  errorText: {
    fontSize: scaleFontSize(16),
    color: '#FF6B6B',
    fontFamily: 'Roboto',
    textAlign: 'center',
    marginTop: moderateScale(20),
  },
});
