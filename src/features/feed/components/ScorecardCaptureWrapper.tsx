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
import { Image, StyleSheet, View } from "react-native";

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
 * Renders as 1080x1080px square with company logo at the top.
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

  // Calculate dimensions for 1080x1080 output
  const CAPTURE_SIZE = 1080;
  const PADDING = 24;
  const CARD_WIDTH = CAPTURE_SIZE - PADDING * 2;

  // For display in feed, show at normal size. For capture, use full 1080x1080
  const isCapturing = backgroundStyle !== "white" || true; // Always render at capture size

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
          },
        ]}
      >
        {/* Company Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/images/scorecard-watermark.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Match Result Card */}
        <View style={styles.cardContainer}>
          <MatchResultCard
            match={match}
            index={0}
            totalResults={1}
            sportColors={sportColors}
            isPickleball={isPickleball}
            cardWidth={CARD_WIDTH}
            cardGap={0}
            expandedComments={new Set()}
            onToggleComments={() => {}}
            backgroundStyle={backgroundStyle}
          />
        </View>
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
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  logoContainer: {
    width: "100%",
    height: 70,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 200,
    height: 70,
  },
  cardContainer: {
    width: "100%",
    alignItems: "center",
  },
});
