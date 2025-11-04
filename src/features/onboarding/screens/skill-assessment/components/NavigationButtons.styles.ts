import { StyleSheet } from 'react-native';
import {
  scaleFontSize,
  moderateScale,
  getResponsivePadding
} from '../utils/responsive';

export const styles = StyleSheet.create({
  // Skip Button
  skipButton: {
    paddingVertical: moderateScale(12),
    paddingHorizontal: getResponsivePadding(20),
    minHeight: 44,  // Minimum touch target
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: scaleFontSize(16),
    color: '#FE9F4D',
    fontWeight: '500',
    fontFamily: 'Roboto',
  },

  // Next Button
  nextButtonContainer: {
    borderRadius: moderateScale(25),
    minWidth: moderateScale(100),
    minHeight: 44,  // Minimum touch target
    alignItems: 'center',
  },
  nextButtonGradient: {
    borderRadius: moderateScale(25),
    paddingVertical: moderateScale(12),
    paddingHorizontal: getResponsivePadding(32),
    minWidth: moderateScale(100),
    minHeight: 44,  // Minimum touch target
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: scaleFontSize(16),
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
});
