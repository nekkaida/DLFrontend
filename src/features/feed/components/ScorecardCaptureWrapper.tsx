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
import { DarkThemeScorecard } from "./DarkThemeScorecard";
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
 * for different capture scenarios (white, transparent, or dark backgrounds).
 * Renders as 1080x1920px (9:16 ratio) for optimal sharing quality.
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

  // Calculate dimensions for 1080x1920 (9:16 ratio) optimal quality output
  const CAPTURE_WIDTH = 1080;
  const CAPTURE_HEIGHT = 1920;
  const PADDING = 0; // No padding for full bleed backgrounds
  const CARD_WIDTH = CAPTURE_WIDTH;

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
            width: CAPTURE_WIDTH,
            height: CAPTURE_HEIGHT,
            backgroundColor:
              backgroundStyle === "dark"
                ? "transparent"
                : backgroundStyle === "white"
                  ? "transparent"
                  : "transparent",
            padding: PADDING,
          },
        ]}
      >
        {/* Render appropriate scorecard based on background style */}
        {backgroundStyle === "white" ? (
          <SolidScorecard match={match} sportColors={sportColors} />
        ) : backgroundStyle === "dark" ? (
          <DarkThemeScorecard match={match} sportColors={sportColors} />
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
    left: -10000,
    top: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
