import { StyleSheet, Platform } from 'react-native';
import {
  scaleFontSize,
  moderateScale,
  createShadow,
  getResponsivePadding,
  scaleHeight,
  isSmallDevice
} from './utils/responsive';

const isSmall = isSmallDevice();

export const styles = StyleSheet.create({
  // Container
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

  // Dropdown
  dropdown: {
    height: moderateScale(46),
    borderWidth: 1,
    borderColor: '#EDF1F3',
    borderRadius: moderateScale(10),
    paddingHorizontal: getResponsivePadding(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    ...createShadow('#E4E5E7', 0.24, 2, 2),
    marginBottom: moderateScale(16),
  },
  dropdownText: {
    fontSize: scaleFontSize(14),
    color: '#6C7278',
    fontWeight: '500',
  },
  dropdownTextSelected: {
    color: '#1A1C1E',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  modalDropdown: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDF1F3',
    borderRadius: moderateScale(10),
    // Responsive maxHeight - 30% of screen on small devices, 40% on large
    maxHeight: scaleHeight(isSmall ? 200 : 280),
    ...createShadow('#000', 0.3, 8, 8),
  },
  modalDropdownList: {
    flexGrow: 0,  // Allow list to shrink if needed
  },
  dropdownItem: {
    paddingHorizontal: getResponsivePadding(14),
    paddingVertical: moderateScale(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EDF1F3',
    minHeight: moderateScale(44),  // Ensure touch target
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemText: {
    fontSize: scaleFontSize(14),
    color: '#1A1C1E',
    fontWeight: '500',
  },

  // Confirm Button - NOW WITH SAFE AREA AWARENESS
  simpleConfirmButtonContainer: {
    position: 'absolute',
    // Add extra padding for home indicator on iPhone X+
    bottom: Platform.select({
      ios: moderateScale(20) + (isSmall ? 0 : 34),  // 34px for home indicator
      android: moderateScale(20),
    }),
    left: 0,
    right: 0,
    paddingHorizontal: getResponsivePadding(20),
  },
  simpleConfirmButton: {
    backgroundColor: '#FE9F4D',
    borderRadius: moderateScale(25),
    paddingVertical: moderateScale(12),
    paddingHorizontal: getResponsivePadding(32),
    alignItems: 'center',
    minHeight: moderateScale(48),  // Ensure touch target
    ...createShadow('#FE9F4D', 0.3, 4, 3),
  },
  simpleConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
});
