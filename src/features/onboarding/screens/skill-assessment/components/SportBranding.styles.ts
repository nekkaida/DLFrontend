import { StyleSheet } from 'react-native';
import { scaleFontSize, getBottomPosition, getResponsivePadding, moderateScale, isSmallDevice } from '../utils/responsive';

const isSmall = isSmallDevice();

export const styles = StyleSheet.create({
  // Sport Branding - NOW RELATIVE POSITIONING (no more absolute!)
  sportBranding: {
    alignItems: 'flex-end',
  },
  sportIconContainer: {
    marginBottom: moderateScale(isSmall ? 4 : 6),
  },
  sportText: {
    fontSize: scaleFontSize(isSmall ? 36 : 42),  // Smaller on small screens
    fontWeight: '500',
    color: '#CA9BFF',
    fontFamily: 'Poppins',
    textAlign: 'right',
  },
  tennisSportText: {
    color: '#D7FFA9',
  },
  padelSportText: {
    color: '#9BD0FF',
  },
});
