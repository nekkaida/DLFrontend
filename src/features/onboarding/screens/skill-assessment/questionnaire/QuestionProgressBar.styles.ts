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
    paddingHorizontal: getResponsivePadding(36),
    paddingBottom: moderateScale(20),
  },
  progressText: {
    fontSize: scaleFontSize(18),
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Roboto',
    marginBottom: moderateScale(20),
    marginTop: moderateScale(30),
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
