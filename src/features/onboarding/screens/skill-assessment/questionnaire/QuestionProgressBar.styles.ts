import { StyleSheet } from 'react-native';
import {
  scaleFontSize,
  moderateScale,
  getResponsivePadding,
  isSmallDevice
} from '../utils/responsive';

const isSmall = isSmallDevice();

export const styles = StyleSheet.create({
  // Progress
  progressContainer: {
    paddingHorizontal: getResponsivePadding(isSmall ? 24 : 32),
    paddingBottom: moderateScale(isSmall ? 12 : 16),
  },
  progressText: {
    fontSize: scaleFontSize(isSmall ? 16 : 18),
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Roboto',
    marginBottom: moderateScale(isSmall ? 12 : 16),
    marginTop: moderateScale(isSmall ? 8 : 12),  // Reduced from 30
    textAlign: 'left',
  },
  progressBar: {
    height: moderateScale(isSmall ? 5 : 6),  // Slightly smaller on small devices
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: moderateScale(4),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FE9F4D',
    borderRadius: moderateScale(4),
  },
});
