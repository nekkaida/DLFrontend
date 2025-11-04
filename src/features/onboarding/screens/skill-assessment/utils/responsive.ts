import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 11 Pro)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

/**
 * Scales a value based on screen width
 */
export function scaleWidth(size: number): number {
  return (SCREEN_WIDTH / BASE_WIDTH) * size;
}

/**
 * Scales a value based on screen height
 */
export function scaleHeight(size: number): number {
  return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
}

/**
 * Scales font size with PixelRatio for better cross-device support
 */
export function scaleFontSize(size: number): number {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

/**
 * Moderately scales a value (less aggressive than full scaling)
 */
export function moderateScale(size: number, factor: number = 0.5): number {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  return size + (scale - 1) * size * factor;
}

/**
 * Gets responsive padding based on screen width
 */
export function getResponsivePadding(basePadding: number = 20): number {
  if (SCREEN_WIDTH < 350) return basePadding * 0.8;  // Small phones
  if (SCREEN_WIDTH > 400) return basePadding * 1.2;  // Large phones/tablets
  return basePadding;
}

/**
 * Calculates position from bottom as percentage of screen height
 */
export function getBottomPosition(percentage: number): number {
  return SCREEN_HEIGHT * (percentage / 100);
}

/**
 * Platform-specific shadow helper
 */
export function createShadow(
  color: string = '#000',
  opacity: number = 0.1,
  radius: number = 8,
  elevation: number = 5
) {
  if (Platform.OS === 'ios') {
    return {
      shadowColor: color,
      shadowOffset: { width: 0, height: radius / 2 },
      shadowOpacity: opacity,
      shadowRadius: radius,
    };
  }
  return {
    elevation,
  };
}

/**
 * Checks if device is a small screen (iPhone SE, etc.)
 */
export function isSmallDevice(): boolean {
  return SCREEN_WIDTH < 375 || SCREEN_HEIGHT < 667;
}

/**
 * Checks if device is a large screen (tablets, etc.)
 */
export function isLargeDevice(): boolean {
  return SCREEN_WIDTH > 500 || SCREEN_HEIGHT > 900;
}

/**
 * Gets device dimensions
 */
export function getDeviceDimensions() {
  return {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    isSmall: isSmallDevice(),
    isLarge: isLargeDevice(),
  };
}
