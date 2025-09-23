import { Dimensions, Platform } from 'react-native';

// Get current screen dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Base dimensions (iPhone 6/7/8 as reference)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 667;

// Device type detection
export const DeviceType = {
  SMALL_PHONE: 'small_phone',    // iPhone SE, etc.
  PHONE: 'phone',                // Standard phones
  LARGE_PHONE: 'large_phone',    // iPhone Pro Max, etc.
  TABLET: 'tablet',              // iPad, Android tablets
} as const;

export type DeviceTypeKey = typeof DeviceType[keyof typeof DeviceType];

// Breakpoints based on width
export const BREAKPOINTS = {
  SMALL_PHONE: 360,
  PHONE: 414,
  TABLET: 768,
} as const;

// Get current device type
export const getDeviceType = (): DeviceTypeKey => {
  if (screenWidth >= BREAKPOINTS.TABLET) return DeviceType.TABLET;
  if (screenWidth >= BREAKPOINTS.PHONE) return DeviceType.LARGE_PHONE;
  if (screenWidth >= BREAKPOINTS.SMALL_PHONE) return DeviceType.PHONE;
  return DeviceType.SMALL_PHONE;
};

// Screen dimension getters
export const getScreenDimensions = () => ({
  width: screenWidth,
  height: screenHeight,
  isLandscape: screenWidth > screenHeight,
  isTablet: screenWidth >= BREAKPOINTS.TABLET,
  isLargePhone: screenWidth >= BREAKPOINTS.PHONE,
  deviceType: getDeviceType(),
});

// Responsive scaling functions
export const scale = (size: number): number => {
  const scaleRatio = screenWidth / BASE_WIDTH;
  // Cap the scaling to prevent too large sizes on tablets
  const cappedRatio = Math.min(scaleRatio, 1.4);
  return Math.round(size * cappedRatio);
};

export const verticalScale = (size: number): number => {
  const scaleRatio = screenHeight / BASE_HEIGHT;
  const cappedRatio = Math.min(scaleRatio, 1.4);
  return Math.round(size * cappedRatio);
};

// Moderate scaling for elements that shouldn't scale too much
export const moderateScale = (size: number, factor: number = 0.5): number => {
  const scaledSize = scale(size);
  return Math.round(size + (scaledSize - size) * factor);
};

// Responsive padding/margin helpers
export const responsivePadding = {
  xs: scale(4),
  sm: scale(8),
  md: scale(16),
  lg: scale(24),
  xl: scale(32),
  xxl: scale(48),
};

export const responsiveMargin = responsivePadding;

// Responsive width/height helpers
export const responsiveWidth = (percentage: number): number => {
  return (screenWidth * percentage) / 100;
};

export const responsiveHeight = (percentage: number): number => {
  return (screenHeight * percentage) / 100;
};

// Device-specific values
export const getResponsiveValue = <T>(values: {
  smallPhone?: T;
  phone?: T;
  largePhone?: T;
  tablet?: T;
  default: T;
}): T => {
  const deviceType = getDeviceType();

  switch (deviceType) {
    case DeviceType.SMALL_PHONE:
      return values.smallPhone ?? values.default;
    case DeviceType.PHONE:
      return values.phone ?? values.default;
    case DeviceType.LARGE_PHONE:
      return values.largePhone ?? values.default;
    case DeviceType.TABLET:
      return values.tablet ?? values.default;
    default:
      return values.default;
  }
};

// Safe area helpers
export const getSafeAreaInsets = () => {
  // These would be better with react-native-safe-area-context
  // but this provides basic estimates
  const isIPhoneX = Platform.OS === 'ios' && screenHeight >= 812;

  return {
    top: isIPhoneX ? 44 : Platform.OS === 'ios' ? 20 : 0,
    bottom: isIPhoneX ? 34 : 0,
    left: 0,
    right: 0,
  };
};

// Component size helpers
export const getComponentSizes = () => {
  const deviceType = getDeviceType();

  return {
    // Avatar sizes
    avatar: {
      small: getResponsiveValue({
        smallPhone: 32,
        phone: 36,
        largePhone: 40,
        tablet: 48,
        default: 40,
      }),
      medium: getResponsiveValue({
        smallPhone: 48,
        phone: 56,
        largePhone: 64,
        tablet: 80,
        default: 64,
      }),
      large: getResponsiveValue({
        smallPhone: 80,
        phone: 96,
        largePhone: 120,
        tablet: 140,
        default: 120,
      }),
    },

    // Icon sizes
    icon: {
      small: getResponsiveValue({
        smallPhone: 16,
        phone: 18,
        largePhone: 20,
        tablet: 24,
        default: 20,
      }),
      medium: getResponsiveValue({
        smallPhone: 20,
        phone: 22,
        largePhone: 24,
        tablet: 28,
        default: 24,
      }),
      large: getResponsiveValue({
        smallPhone: 28,
        phone: 32,
        largePhone: 36,
        tablet: 42,
        default: 36,
      }),
    },

    // Button heights
    button: {
      small: getResponsiveValue({
        smallPhone: 32,
        phone: 36,
        largePhone: 40,
        tablet: 44,
        default: 40,
      }),
      medium: getResponsiveValue({
        smallPhone: 40,
        phone: 44,
        largePhone: 48,
        tablet: 56,
        default: 48,
      }),
      large: getResponsiveValue({
        smallPhone: 48,
        phone: 52,
        largePhone: 56,
        tablet: 64,
        default: 56,
      }),
    },

    // Card dimensions
    card: {
      borderRadius: getResponsiveValue({
        smallPhone: 12,
        phone: 14,
        largePhone: 16,
        tablet: 20,
        default: 16,
      }),
      padding: getResponsiveValue({
        smallPhone: 16,
        phone: 18,
        largePhone: 20,
        tablet: 24,
        default: 20,
      }),
    },

    // Navigation bar
    navBar: {
      height: getResponsiveValue({
        smallPhone: 70,
        phone: 75,
        largePhone: 83,
        tablet: 90,
        default: 83,
      }),
      iconSize: getResponsiveValue({
        smallPhone: 20,
        phone: 22,
        largePhone: 24,
        tablet: 28,
        default: 24,
      }),
    },
  };
};

// Layout helpers for different screen orientations
export const getLayoutConfig = () => {
  const { isTablet, isLandscape } = getScreenDimensions();

  return {
    // Grid columns for sport cards
    sportCardColumns: isTablet ? (isLandscape ? 3 : 2) : 1,

    // Container max width
    containerMaxWidth: isTablet ? responsiveWidth(85) : responsiveWidth(100),

    // Content padding
    contentPadding: isTablet ? responsivePadding.xl : responsivePadding.lg,

    // Header configuration
    header: {
      showBackButton: !isTablet || isLandscape,
      logoSize: isTablet ? scale(32) : scale(24),
    },
  };
};