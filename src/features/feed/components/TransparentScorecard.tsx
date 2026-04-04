// src/features/feed/components/TransparentScorecard.tsx

import { getSportColors, SportType } from "@/constants/SportsColor";
import { MatchResult } from "@/features/standings/types";
import React from "react";
import { StyleSheet, View } from "react-native";
import { GlassScoreCard } from "./GlassScoreCard";

interface TransparentScorecardProps {
  match: MatchResult;
  isFriendly?: boolean;
  previewScale?: number;
}

export const TransparentScorecard: React.FC<TransparentScorecardProps> = ({
  match,
  isFriendly = false,
  previewScale,
}) => {
  const sportColors = getSportColors(
    (match.sport?.toUpperCase() || "TENNIS") as SportType,
  );

  return (
    <View
      style={[
        styles.container,
        previewScale !== undefined && {
          aspectRatio: undefined,
          width: "100%",
          height: "100%",
        },
      ]}
    >
      <GlassScoreCard
        match={match}
        sportColors={sportColors}
        isFriendly={isFriendly}
        previewScale={previewScale}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    aspectRatio: 9 / 16,
    overflow: "hidden",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
});
