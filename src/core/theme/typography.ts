import { Platform } from 'react-native';
import { scale, moderateScale, getResponsiveValue } from '../utils/responsive';

// Font families with platform-specific fallbacks
export const fontFamily = {
  primary: Platform.select({
    ios: 'Helvetica Neue',
    android: 'Roboto',
    default: 'System',
  }),
  secondary: Platform.select({
    ios: 'SF Pro Display',
    android: 'sans-serif-medium',
    default: 'System',
  }),
  mono: Platform.select({
    ios: 'SF Mono',
    android: 'monospace',
    default: 'monospace',
  }),
  inter: 'Inter',
  poppins: 'Poppins',
  ibmPlex: Platform.select({
    ios: 'IBM Plex Sans',
    android: 'sans-serif-medium',
    default: 'System',
  }),
} as const;

// Font weight mapping
export const fontWeight = {
  light: '300' as const,
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
  black: '900' as const,
} as const;

// Base font sizes - these will be scaled responsively
const baseFontSizes = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 36,
  '6xl': 48,
} as const;

// Responsive font sizes
export const fontSize = {
  xs: moderateScale(baseFontSizes.xs),
  sm: moderateScale(baseFontSizes.sm),
  base: moderateScale(baseFontSizes.base),
  md: moderateScale(baseFontSizes.md),
  lg: moderateScale(baseFontSizes.lg),
  xl: moderateScale(baseFontSizes.xl),
  '2xl': moderateScale(baseFontSizes['2xl']),
  '3xl': moderateScale(baseFontSizes['3xl']),
  '4xl': moderateScale(baseFontSizes['4xl']),
  '5xl': moderateScale(baseFontSizes['5xl']),
  '6xl': moderateScale(baseFontSizes['6xl']),
} as const;

// Line height calculations
export const lineHeight = {
  tight: 1.15,
  normal: 1.4,
  relaxed: 1.6,
  loose: 1.8,
} as const;

// Calculate responsive line heights
export const getLineHeight = (fontSize: number, ratio: number = lineHeight.normal): number => {
  return Math.round(fontSize * ratio);
};

// Typography preset styles
export const typography = {
  // Display styles
  display: {
    large: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize['6xl'],
      lineHeight: getLineHeight(fontSize['6xl'], lineHeight.tight),
      fontWeight: fontWeight.bold,
      letterSpacing: -0.5,
    },
    medium: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize['5xl'],
      lineHeight: getLineHeight(fontSize['5xl'], lineHeight.tight),
      fontWeight: fontWeight.bold,
      letterSpacing: -0.3,
    },
    small: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize['4xl'],
      lineHeight: getLineHeight(fontSize['4xl'], lineHeight.tight),
      fontWeight: fontWeight.bold,
      letterSpacing: -0.2,
    },
  },

  // Heading styles
  heading: {
    h1: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize['3xl'],
      lineHeight: getLineHeight(fontSize['3xl'], lineHeight.tight),
      fontWeight: fontWeight.bold,
      letterSpacing: -0.2,
    },
    h2: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize['2xl'],
      lineHeight: getLineHeight(fontSize['2xl'], lineHeight.normal),
      fontWeight: fontWeight.bold,
      letterSpacing: -0.1,
    },
    h3: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize.xl,
      lineHeight: getLineHeight(fontSize.xl, lineHeight.normal),
      fontWeight: fontWeight.semibold,
    },
    h4: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize.lg,
      lineHeight: getLineHeight(fontSize.lg, lineHeight.normal),
      fontWeight: fontWeight.semibold,
    },
    h5: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize.md,
      lineHeight: getLineHeight(fontSize.md, lineHeight.normal),
      fontWeight: fontWeight.semibold,
    },
    h6: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize.base,
      lineHeight: getLineHeight(fontSize.base, lineHeight.normal),
      fontWeight: fontWeight.semibold,
    },
  },

  // Body text styles
  body: {
    large: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize.lg,
      lineHeight: getLineHeight(fontSize.lg, lineHeight.relaxed),
      fontWeight: fontWeight.normal,
    },
    medium: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize.base,
      lineHeight: getLineHeight(fontSize.base, lineHeight.normal),
      fontWeight: fontWeight.normal,
    },
    small: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize.sm,
      lineHeight: getLineHeight(fontSize.sm, lineHeight.normal),
      fontWeight: fontWeight.normal,
    },
  },

  // Caption styles
  caption: {
    large: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize.sm,
      lineHeight: getLineHeight(fontSize.sm, lineHeight.normal),
      fontWeight: fontWeight.medium,
    },
    medium: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize.xs,
      lineHeight: getLineHeight(fontSize.xs, lineHeight.normal),
      fontWeight: fontWeight.medium,
    },
  },

  // Dashboard-specific styles
  dashboard: {
    logo: {
      fontFamily: fontFamily.ibmPlex,
      fontSize: getResponsiveValue({
        smallPhone: moderateScale(20),
        phone: moderateScale(22),
        largePhone: moderateScale(24),
        tablet: moderateScale(32),
        default: moderateScale(24),
      }),
      lineHeight: getResponsiveValue({
        smallPhone: getLineHeight(moderateScale(20), lineHeight.tight),
        phone: getLineHeight(moderateScale(22), lineHeight.tight),
        largePhone: getLineHeight(moderateScale(24), lineHeight.tight),
        tablet: getLineHeight(moderateScale(32), lineHeight.tight),
        default: getLineHeight(moderateScale(24), lineHeight.tight),
      }),
      fontWeight: fontWeight.bold,
      fontStyle: 'italic' as const,
      letterSpacing: 3.5,
    },

    sectionTitle: {
      fontFamily: fontFamily.inter,
      fontSize: getResponsiveValue({
        smallPhone: moderateScale(14),
        phone: moderateScale(15),
        largePhone: moderateScale(16),
        tablet: moderateScale(20),
        default: moderateScale(16),
      }),
      lineHeight: getResponsiveValue({
        smallPhone: getLineHeight(moderateScale(14), lineHeight.normal),
        phone: getLineHeight(moderateScale(15), lineHeight.normal),
        largePhone: getLineHeight(moderateScale(16), lineHeight.normal),
        tablet: getLineHeight(moderateScale(20), lineHeight.normal),
        default: getLineHeight(moderateScale(16), lineHeight.normal),
      }),
      fontWeight: fontWeight.bold,
    },

    sportName: {
      fontFamily: fontFamily.primary,
      fontSize: getResponsiveValue({
        smallPhone: moderateScale(16),
        phone: moderateScale(17),
        largePhone: moderateScale(18),
        tablet: moderateScale(22),
        default: moderateScale(18),
      }),
      lineHeight: getResponsiveValue({
        smallPhone: getLineHeight(moderateScale(16), lineHeight.tight),
        phone: getLineHeight(moderateScale(17), lineHeight.tight),
        largePhone: getLineHeight(moderateScale(18), lineHeight.tight),
        tablet: getLineHeight(moderateScale(22), lineHeight.tight),
        default: getLineHeight(moderateScale(18), lineHeight.tight),
      }),
      fontWeight: fontWeight.bold,
    },

    cardTitle: {
      fontFamily: fontFamily.primary,
      fontSize: getResponsiveValue({
        smallPhone: moderateScale(12),
        phone: moderateScale(13),
        largePhone: moderateScale(14),
        tablet: moderateScale(16),
        default: moderateScale(14),
      }),
      lineHeight: getResponsiveValue({
        smallPhone: getLineHeight(moderateScale(12), lineHeight.normal),
        phone: getLineHeight(moderateScale(13), lineHeight.normal),
        largePhone: getLineHeight(moderateScale(14), lineHeight.normal),
        tablet: getLineHeight(moderateScale(16), lineHeight.normal),
        default: getLineHeight(moderateScale(14), lineHeight.normal),
      }),
      fontWeight: fontWeight.medium,
    },

    buttonText: {
      fontFamily: fontFamily.primary,
      fontSize: getResponsiveValue({
        smallPhone: moderateScale(13),
        phone: moderateScale(14),
        largePhone: moderateScale(14),
        tablet: moderateScale(16),
        default: moderateScale(14),
      }),
      lineHeight: getResponsiveValue({
        smallPhone: getLineHeight(moderateScale(13), lineHeight.tight),
        phone: getLineHeight(moderateScale(14), lineHeight.tight),
        largePhone: getLineHeight(moderateScale(14), lineHeight.tight),
        tablet: getLineHeight(moderateScale(16), lineHeight.tight),
        default: getLineHeight(moderateScale(14), lineHeight.tight),
      }),
      fontWeight: fontWeight.semibold,
    },

    navBarLabel: {
      fontFamily: fontFamily.inter,
      fontSize: getResponsiveValue({
        smallPhone: moderateScale(9),
        phone: moderateScale(10),
        largePhone: moderateScale(10),
        tablet: moderateScale(12),
        default: moderateScale(10),
      }),
      lineHeight: getResponsiveValue({
        smallPhone: getLineHeight(moderateScale(9), lineHeight.tight),
        phone: getLineHeight(moderateScale(10), lineHeight.tight),
        largePhone: getLineHeight(moderateScale(10), lineHeight.tight),
        tablet: getLineHeight(moderateScale(12), lineHeight.tight),
        default: getLineHeight(moderateScale(10), lineHeight.tight),
      }),
      fontWeight: fontWeight.medium,
      letterSpacing: -0.24,
    },
  },
} as const;

// Helper function to get typography style by name
export const getTypographyStyle = (category: keyof typeof typography, variant: string) => {
  return (typography[category] as any)[variant] || typography.body.medium;
};

// Text style presets for common use cases
export const textPresets = {
  // Error/success messages
  error: {
    ...typography.body.small,
    color: '#EF4444',
  },
  success: {
    ...typography.body.small,
    color: '#10B981',
  },
  warning: {
    ...typography.body.small,
    color: '#F59E0B',
  },

  // Links
  link: {
    ...typography.body.medium,
    color: '#3B82F6',
    textDecorationLine: 'underline' as const,
  },

  // Placeholders
  placeholder: {
    ...typography.body.medium,
    color: '#9CA3AF',
    fontStyle: 'italic' as const,
  },
} as const;