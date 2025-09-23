// Export all theme utilities from a single entry point
export * from './typography';
export * from './spacing';
export * from './responsiveStyles';
export * from '../utils/responsive';

// Re-export for convenience
export { responsiveStyles, responsiveHelpers } from './responsiveStyles';
export { typography, fontSize, fontWeight, fontFamily } from './typography';
export { spacing, margin, padding, dashboardSpacing } from './spacing';
export {
  scale,
  moderateScale,
  verticalScale,
  getScreenDimensions,
  getDeviceType,
  getResponsiveValue,
  getComponentSizes,
  getLayoutConfig,
  responsiveWidth,
  responsiveHeight,
} from '../utils/responsive';