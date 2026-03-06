/**
 * useAuthScreenSizes
 *
 * Centralised responsive size tokens for auth screens (Sign Up, Login, etc.).
 * Reuse this hook in any auth screen that needs the same breakpoint-aware layout.
 *
 * Breakpoints (based on screen HEIGHT):
 *   Small  — < 700px  (iPhone SE, compact Androids)
 *   Medium — 700–819px (iPhone 14/15, Pixel 7)
 *   Large  — ≥ 820px  (Pro Max, tall Androids, tablets)
 */

import { useState, useEffect } from 'react';
import { Dimensions, AppState } from 'react-native';
import { scale, verticalScale, moderateScale } from './responsive';

interface ScreenSizes {
  screenWidth: number;
  screenHeight: number;
  isSmallScreen: boolean;
  isMediumScreen: boolean;
  isLargeScreen: boolean;
  rs: {
    hPadding: number;
    topMargin: number;
    sectionGap: number;
    inputGap: number;
    logoSize: number;
    logoHeight: number;
    headerPadV: number;
    headerBorderRadius: number;
    headerFontSize: number;
    headerLineHeight: number;
    policyGap: number;
    policyFontSize: number;
    policyLineHeight: number;
    checkboxSize: number;
    signUpRowMarginTop: number;
    btnSize: number;
    signUpFontSize: number;
    socialGap: number;
    labelFontSize: number;
    loginFontSize: number;
    loginLineHeight: number;
  };
}

const computeSizes = (screenHeight: number): ScreenSizes => {
  const { width: screenWidth } = Dimensions.get('window');

  const isSmallScreen  = screenHeight < 700;
  const isMediumScreen = screenHeight >= 700 && screenHeight < 820;
  const isLargeScreen  = screenHeight >= 820;

  const rs = {
    hPadding:            scale(isSmallScreen ? 24 : 30),
    topMargin:           isSmallScreen ? verticalScale(12)  : isMediumScreen ? verticalScale(30)  : verticalScale(50),
    sectionGap:          isSmallScreen ? verticalScale(8)   : isMediumScreen ? verticalScale(12)  : verticalScale(18),
    inputGap:            isSmallScreen ? verticalScale(6)   : verticalScale(10),
    logoSize:            isSmallScreen ? scale(42)          : scale(56),
    logoHeight:          isSmallScreen ? verticalScale(45)  : verticalScale(60),
    headerPadV:          isSmallScreen ? verticalScale(8)   : isMediumScreen ? verticalScale(12)  : verticalScale(16),
    headerBorderRadius:  moderateScale(isSmallScreen ? 10   : 14),
    headerFontSize:      isSmallScreen ? moderateScale(20)  : isMediumScreen ? moderateScale(24)  : moderateScale(28),
    headerLineHeight:    isSmallScreen ? moderateScale(26)  : isMediumScreen ? moderateScale(30)  : moderateScale(36),
    policyGap:           isSmallScreen ? verticalScale(5)   : verticalScale(8),
    policyFontSize:      isSmallScreen ? moderateScale(10)  : moderateScale(12),
    policyLineHeight:    isSmallScreen ? moderateScale(14)  : moderateScale(18),
    checkboxSize:        isSmallScreen ? scale(16)          : scale(20),
    signUpRowMarginTop:  isSmallScreen ? verticalScale(2)   : verticalScale(8),
    btnSize:             isSmallScreen ? scale(46)          : scale(52),
    signUpFontSize:      isSmallScreen ? moderateScale(18)  : moderateScale(22),
    socialGap:           isSmallScreen ? scale(4)           : scale(6),
    labelFontSize:       isSmallScreen ? moderateScale(10)  : moderateScale(11),
    loginFontSize:       isSmallScreen ? moderateScale(12)  : moderateScale(14),
    loginLineHeight:     isSmallScreen ? moderateScale(16)  : moderateScale(22),
  };

  return { screenWidth, screenHeight, isSmallScreen, isMediumScreen, isLargeScreen, rs };
};

export const useScreenSizes = (): ScreenSizes => {
  const [sizes, setSizes] = useState<ScreenSizes>(() => {
    const { height } = Dimensions.get('window');
    return computeSizes(height);
  });

  useEffect(() => {
    // Re-compute on rotation / resize
    const dimSub = Dimensions.addEventListener('change', ({ window }) => {
      setSizes(computeSizes(window.height));
    });

    // Re-compute when app comes back to foreground (covers edge cases on Android)
    const appSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        const { height } = Dimensions.get('window');
        setSizes(computeSizes(height));
      }
    });

    return () => {
      dimSub.remove();
      appSub.remove();
    };
  }, []);

  return sizes;
};
