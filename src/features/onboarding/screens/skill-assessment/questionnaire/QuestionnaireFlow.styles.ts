import { StyleSheet, Platform } from 'react-native';
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

  // Question Container - Pure flex layout (no absolute positioning)
  questionnaireContainer: {
    flex: 1,
    paddingHorizontal: getResponsivePadding(15),
    paddingBottom: Platform.select({
      ios: moderateScale(20),      // Account for iOS home indicator
      android: moderateScale(15),
    }),
  },
  questionCardWrapper: {
    flex: 1,
  },
  navigationButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(8),
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
