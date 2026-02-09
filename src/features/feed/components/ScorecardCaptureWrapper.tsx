// src/features/feed/components/ScorecardCaptureWrapper.tsx

import {
  MatchResultCard,
  type CardBackgroundStyle,
} from "@/features/standings/components";
import { MatchResult, SportColors } from "@/features/standings/types";
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { StyleSheet, View } from "react-native";
import { SolidScorecard } from "./SolidScorecard";
import { TransparentScorecard } from "./TransparentScorecard";

interface ScorecardCaptureWrapperProps {
  match: MatchResult;
  sportColors: SportColors;
  isPickleball: boolean;
  cardWidth: number;
}

export interface ScorecardCaptureRef {
  viewRef: View | null;
  setBackgroundStyle: (style: CardBackgroundStyle) => void;
}

/**
 * Wrapper component for MatchResultCard that allows dynamic background style changes
 * for different capture scenarios (white vs transparent backgrounds).
 * Renders as 2048x2048px square with company logo at the top for maximum sharpness.
 */
export const ScorecardCaptureWrapper = forwardRef<
  ScorecardCaptureRef,
  ScorecardCaptureWrapperProps
>(({ match, sportColors, isPickleball, cardWidth }, ref) => {
  const [backgroundStyle, setBackgroundStyle] =
    useState<CardBackgroundStyle>("white");
  const viewRef = useRef<View>(null);

  // Expose both the view ref and the style setter to parent
  useImperativeHandle(ref, () => ({
    get viewRef() {
      return viewRef.current;
    },
    setBackgroundStyle,
  }));

  // Calculate dimensions for 2048x2048 maximum quality output
  const CAPTURE_SIZE = 2048;
  const PADDING = 80;
  const LOGO_HEIGHT = 180;
  const LOGO_MARGIN_BOTTOM = 60;
  const TOP_PADDING = 80;
  const BOTTOM_PADDING = 80;
  const CARD_WIDTH = CAPTURE_SIZE - PADDING * 2;

  return (
    <>
      {/* Display version - shown in feed */}
      <View style={{ width: cardWidth }}>
        <MatchResultCard
          match={match}
          index={0}
          totalResults={1}
          sportColors={sportColors}
          isPickleball={isPickleball}
          cardWidth={cardWidth}
          cardGap={0}
          expandedComments={new Set()}
          onToggleComments={() => {}}
          backgroundStyle="white"
        />
      </View>

      {/* Capture version - hidden from view, used only for sharing */}
      <View
        ref={viewRef}
        collapsable={false}
        style={[
          styles.captureContainer,
          {
            width: CAPTURE_SIZE,
            height: CAPTURE_SIZE,
            backgroundColor:
              backgroundStyle === "white" ? "#FFFFFF" : "transparent",
            paddingTop: TOP_PADDING,
            paddingBottom: BOTTOM_PADDING,
            paddingHorizontal: PADDING,
          },
        ]}
      >
        {/* Company Logo */}
        {/* <View
          style={[
            styles.logoContainer,
            { height: LOGO_HEIGHT, marginBottom: LOGO_MARGIN_BOTTOM },
          ]}
        >
          <Image
            source={require("@/assets/images/scorecard-watermark.png")}
            style={[styles.logo, { height: LOGO_HEIGHT }]}
            resizeMode="contain"
          />
        </View> */}

        {/* Render appropriate scorecard based on background style */}
        {backgroundStyle === "white" ? (
          <SolidScorecard match={match} sportColors={sportColors} />
        ) : (
          <TransparentScorecard match={match} />
        )}
      </View>
    </>
  );
});

ScorecardCaptureWrapper.displayName = "ScorecardCaptureWrapper";

const styles = StyleSheet.create({
  captureContainer: {
    position: "absolute",
    left: -10000, // Hide off-screen
    top: 0,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  logoContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 500,
  },
  cardContainer: {
    width: "100%",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
});
