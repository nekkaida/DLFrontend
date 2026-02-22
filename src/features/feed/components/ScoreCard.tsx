// src/features/feed/components/ScoreCard.tsx

import PaddleIcon from "@/assets/icons/sports/Paddle.svg";
import PickleballIcon from "@/assets/icons/sports/Pickleball.svg";
import TennisIcon from "@/assets/icons/sports/Tennis.svg";
import { MatchResult, SportColors } from "@/features/standings/types";
import { format } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, StyleSheet, Text, View, ViewStyle } from "react-native";

interface ScoreCardProps {
  match: MatchResult;
  sportColors: SportColors;
  isFriendly?: boolean;
  containerStyle?: ViewStyle;
  scoreHeaderRowStyle?: ViewStyle;
  previewScale?: number; 
}

// Map sport types to their icons
const getSportIcon = (
  sportType: string | undefined,
  color: string,
  size: number = 66,
) => {
  const normalizedType = sportType?.toUpperCase() || "TENNIS";

  switch (normalizedType) {
    case "PICKLEBALL":
      return <PickleballIcon width={size} height={size} fill={color} />;
    case "PADEL":
      return <PaddleIcon width={size} height={size} fill={color} />;
    case "TENNIS":
    default:
      return <TennisIcon width={size} height={size} fill={color} />;
  }
};

const PHOTO_SIZE = 80;
const NAME_COLUMN_WIDTH = 160;

// ─── Preview fixed sizes ──────────────────────────────────────────────────────
// All values here are the actual pixel sizes used when rendering the preview card.
// Adjust any of these to change how the preview looks.
const PREVIEW = {
  // Dimensions
  iconSize: 16,
  photoSize: 22,
  nameColWidth: 44,
  boxHeight: 13,
  doublesPhotoOverlap: -8,
  // Spacing overrides
  headerPadding: 5,
  mainSectionPaddingV: 3,
  mainSectionPaddingH: 5,
  mainSectionGap: 5,
  scoresSectionPaddingV: 4,
  scoresSectionPaddingH: 6,
  scoreHeaderPaddingV: 2,
  scoreHeaderPaddingH: 5,
  scoreHeaderBorderRadius: 5,
  scoresColumnsPaddingH: 3,
  doublesNamesMarginLeft: 3,
  titleContainerMarginLeft: 3,
  sportIconMarginRight: 2,
  singlesRowGap: 3,
  matchTypeBadgeMinWidth: 30,
  matchTypeBadgePaddingH: 4,
  matchTypeBadgePaddingV: 2,
  // Font sizes
  leagueText: 7,
  seasonDivisionText: 6,
  matchTypeText: 6,
  cardVenueName: 8,
  scoreText: 26,
  scoreDivider: 26,
  teamName: 7,
  winnerName: 7,
  loserName: 6,
  doublesPlayerName: 5,
  cardMatchDate: 6,
  setHeaderText: 6,
  nameColumnText: 7,
  setScoreText: 8,
  winningScoreText: 10,
};
// ─────────────────────────────────────────────────────────────────────────────

const ScoreCard: React.FC<ScoreCardProps> = ({
  match,
  sportColors,
  isFriendly = false,
  containerStyle,
  scoreHeaderRowStyle,
  previewScale,
}) => {
  const isPreview = previewScale !== undefined;
  
  // Helper function to render player photo
  const renderPlayerPhoto = (player: any, size: number = isPreview ? PREVIEW.photoSize : PHOTO_SIZE) => {
    if (player.image) {
      return (
        <Image
          source={{ uri: player.image }}
          style={[
            styles.playerPhoto,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        />
      );
    }
    return (
      <View
        style={[
          styles.playerPhotoDefault,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <Text style={[styles.playerPhotoText, { fontSize: size * 0.4 }]}>
          {player.name?.charAt(0).toUpperCase() || "P"}
        </Text>
      </View>
    );
  };

  // Format player names
  const formatPlayerName = (
    name: string | null,
    firstNameOnly: boolean = false,
  ) => {
    if (!name) return "Player";
    const parts = name.split(" ");
    if (firstNameOnly && parts.length > 1) {
      return parts[0];
    }
    return name;
  };

  const isTeam1Winner = match.outcome === "team1";
  const isTeam2Winner = match.outcome === "team2";

  // Handle different score structures for different sports
  // Pickleball uses gameScores with team1Points/team2Points
  // Tennis/Padel use setScores with team1Games/team2Games
  const scores =
    (match.gameScores?.length ?? 0) > 0
      ? match.gameScores
      : match.setScores || [];
  const isSingles = match.team1Players.length === 1;
  const matchTypeLabel = isFriendly ? "Friendly" : "League";

  // Get season and division info
  const seasonName =
    (match as any).division?.season?.name || (match as any).seasonName || "";
  const divisionName =
    (match as any).division?.name || (match as any).divisionName || "";

  return (
    <View style={[styles.cardContainer, containerStyle, isPreview && { maxWidth: 240, maxHeight: 180, borderRadius: 8 }]}>
      {/* League/Match Info Header */}
      <LinearGradient
        colors={[
          `rgba(${parseInt(sportColors.background.slice(1, 3), 16)}, ${parseInt(sportColors.background.slice(3, 5), 16)}, ${parseInt(sportColors.background.slice(5, 7), 16)}, 0.08)`,
          "#FFFFFF",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.header, isPreview && { padding: PREVIEW.headerPadding }]}
      >
        {/* Header with icon and badge */}
        <View style={[styles.header, isPreview && { padding: PREVIEW.headerPadding }]}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeft}>
              <View style={[styles.sportIcon, isPreview && { marginRight: PREVIEW.sportIconMarginRight }]}>
                {getSportIcon(match.sport, sportColors.background, isPreview ? PREVIEW.iconSize : 66)}
              </View>
              <View style={[styles.titleContainer, isPreview && { marginLeft: PREVIEW.titleContainerMarginLeft }]}>
                <Text style={[styles.leagueText, isPreview && { fontSize: PREVIEW.leagueText }]}>
                  {match.leagueName || "Match"}
                </Text>
                {(seasonName || divisionName) && (
                  <Text style={[styles.seasonDivisionText, isPreview && { fontSize: PREVIEW.seasonDivisionText }]}>
                    {seasonName}
                    {seasonName && divisionName && " • "}
                    {divisionName}
                  </Text>
                )}
              </View>
            </View>

            <View
              style={[
                styles.matchTypeBadge,
                { borderColor: isFriendly ? "#83CFF9" : "#FEA04D" },
                isPreview && { minWidth: PREVIEW.matchTypeBadgeMinWidth, paddingHorizontal: PREVIEW.matchTypeBadgePaddingH, paddingVertical: PREVIEW.matchTypeBadgePaddingV },
              ]}
            >
              <Text
                style={[
                  styles.matchTypeText,
                  { color: isFriendly ? "#83CFF9" : "#FEA04D" },
                  isPreview && { fontSize: PREVIEW.matchTypeText },
                ]}
              >
                {matchTypeLabel}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Venue Name */}
      <Text style={[styles.cardVenueName, isPreview && { fontSize: PREVIEW.cardVenueName, marginTop: 2, paddingHorizontal: 4 }]}>{match.location || "Venue TBD"}</Text>

      {/* Main Score Section */}
      <View style={[styles.mainScoreSection, isPreview && { paddingVertical: PREVIEW.mainSectionPaddingV, paddingHorizontal: PREVIEW.mainSectionPaddingH, gap: PREVIEW.mainSectionGap }]}>
        {/* Team 1 */}
        <View style={styles.teamContainer}>
          {isSingles ? (
            <>
              <View style={[styles.singlesRow, isPreview && { gap: PREVIEW.singlesRowGap }]}>
                {renderPlayerPhoto(match.team1Players[0])}
                <Text
                  style={[
                    styles.teamName,
                    isTeam1Winner ? styles.winnerName : styles.loserName,
                    isPreview && { fontSize: isTeam1Winner ? PREVIEW.winnerName : PREVIEW.loserName, marginTop: 2 },
                  ]}
                  numberOfLines={2}
                >
                  {formatPlayerName(match.team1Players[0].name)}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.doublesContainer}>
              <View style={styles.doublesPhotos}>
                {renderPlayerPhoto(match.team1Players[0])}
                <View style={{ marginLeft: isPreview ? PREVIEW.doublesPhotoOverlap : -30 }}>
                  {renderPlayerPhoto(match.team1Players[1])}
                </View>
              </View>
              <View style={[styles.doublesNames, isPreview && { marginLeft: PREVIEW.doublesNamesMarginLeft }]}>
                <Text
                  style={[
                    styles.doublesPlayerName,
                    isTeam1Winner ? styles.winnerName : styles.loserName,
                    isPreview && { fontSize: PREVIEW.doublesPlayerName },
                  ]}
                  numberOfLines={1}
                >
                  {formatPlayerName(match.team1Players[0].name, true)}
                </Text>
                <Text
                  style={[
                    styles.doublesPlayerName,
                    isTeam1Winner ? styles.winnerName : styles.loserName,
                    isPreview && { fontSize: PREVIEW.doublesPlayerName },
                  ]}
                  numberOfLines={1}
                >
                  {formatPlayerName(match.team1Players[1].name, true)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Score Display */}
        <View style={styles.scoreDisplay}>
          <Text style={[styles.scoreText, isPreview && { fontSize: PREVIEW.scoreText }]}>{match.team1Score || 0}</Text>
          <Text style={[styles.scoreDivider, isPreview && { fontSize: PREVIEW.scoreDivider }]}>-</Text>
          <Text style={[styles.scoreText, isPreview && { fontSize: PREVIEW.scoreText }]}>{match.team2Score || 0}</Text>
        </View>

        {/* Team 2 */}
        <View style={styles.teamContainer}>
          {isSingles ? (
            <>
              <View style={[styles.singlesRow, isPreview && { gap: PREVIEW.singlesRowGap }]}>
                {renderPlayerPhoto(match.team2Players[0])}
                <Text
                  style={[
                    styles.teamName,
                    isTeam2Winner ? styles.winnerName : styles.loserName,
                    isPreview && { fontSize: isTeam2Winner ? PREVIEW.winnerName : PREVIEW.loserName, marginTop: 2 },
                  ]}
                  numberOfLines={2}
                >
                  {formatPlayerName(match.team2Players[0].name)}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.doublesContainer}>
              <View style={styles.doublesPhotos}>
                {renderPlayerPhoto(match.team2Players[0])}
                <View style={{ marginLeft: isPreview ? PREVIEW.doublesPhotoOverlap : -30 }}>
                  {renderPlayerPhoto(match.team2Players[1])}
                </View>
              </View>
              <View style={[styles.doublesNames, isPreview && { marginLeft: PREVIEW.doublesNamesMarginLeft }]}>
                <Text
                  style={[
                    styles.doublesPlayerName,
                    isTeam2Winner ? styles.winnerName : styles.loserName,
                    isPreview && { fontSize: PREVIEW.doublesPlayerName },
                  ]}
                  numberOfLines={1}
                >
                  {formatPlayerName(match.team2Players[0].name, true)}
                </Text>
                <Text
                  style={[
                    styles.doublesPlayerName,
                    isTeam2Winner ? styles.winnerName : styles.loserName,
                    isPreview && { fontSize: PREVIEW.doublesPlayerName },
                  ]}
                  numberOfLines={1}
                >
                  {formatPlayerName(match.team2Players[1].name, true)}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Match Date */}
      <Text style={[styles.cardMatchDate, isPreview && { fontSize: PREVIEW.cardMatchDate, marginTop: 1 }]}>
        {format(new Date(match.matchDate), "d MMM yyyy, h:mm a")}
      </Text>
      {match.isWalkover && <Text style={styles.cardWalkover}>W/O</Text>}
      {/* Scores Columns */}
      {scores && scores.length > 0 && (
        <View style={[styles.scoresSection, isPreview && { paddingVertical: PREVIEW.scoresSectionPaddingV, paddingHorizontal: PREVIEW.scoresSectionPaddingH, marginTop: 2 }]}>
          {/* Header Row with rounded edges */}
          {(() => {
            const displayScores =
              scores.length === 2
                ? [...scores, { __placeholder: true }]
                : scores;
            return (
              <>
                <View
                  style={[
                    styles.scoreHeaderRow,
                    { backgroundColor: sportColors.background },
                    scoreHeaderRowStyle,
                    isPreview && { paddingVertical: PREVIEW.scoreHeaderPaddingV, paddingHorizontal: PREVIEW.scoreHeaderPaddingH, borderRadius: PREVIEW.scoreHeaderBorderRadius, marginBottom: 4 },
                  ]}
                >
                  <View style={[styles.nameColumnHeaderBox, isPreview && { width: PREVIEW.nameColWidth }]}>
                    <Text style={[styles.setHeaderText, isPreview && { fontSize: PREVIEW.setHeaderText }]}>Sets</Text>
                  </View>
                  {displayScores.map((_, idx) => (
                    <View
                      key={`header-${idx}`}
                      style={styles.setColumnHeaderBox}
                    >
                      <Text style={[styles.setHeaderText, isPreview && { fontSize: PREVIEW.setHeaderText }]}>
                        {["1st", "2nd", "3rd", "4th", "5th"][idx] ||
                          `${idx + 1}th`}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Spaced out scores section */}
                <View style={[styles.scoresColumns, isPreview && { paddingHorizontal: PREVIEW.scoresColumnsPaddingH }]}>
                  {/* Names Column */}
                  <View style={[styles.nameColumn, isPreview && { width: PREVIEW.nameColWidth }]}>
                    <Text style={[styles.nameColumnText, isPreview && { fontSize: PREVIEW.nameColumnText, height: PREVIEW.boxHeight, lineHeight: PREVIEW.boxHeight }]} numberOfLines={1}>
                      {isSingles
                        ? formatPlayerName(match.team1Players[0].name, true)
                        : `${formatPlayerName(match.team1Players[0].name, true)}, ${formatPlayerName(match.team1Players[1].name, true)}`}
                    </Text>
                    <Text style={[styles.nameColumnText, isPreview && { fontSize: PREVIEW.nameColumnText, height: PREVIEW.boxHeight, lineHeight: PREVIEW.boxHeight }]} numberOfLines={1}>
                      {isSingles
                        ? formatPlayerName(match.team2Players[0].name, true)
                        : `${formatPlayerName(match.team2Players[0].name, true)}, ${formatPlayerName(match.team2Players[1].name, true)}`}
                    </Text>
                  </View>

                  {/* Scores Map */}
                  {displayScores.map((score, idx) => {
                    const isPlaceholder = !!(score as any).__placeholder;
                    const team1Score = isPlaceholder
                      ? "-"
                      : ((score as any).team1Points ??
                        (score as any).team1Games ??
                        0);
                    const team2Score = isPlaceholder
                      ? "-"
                      : ((score as any).team2Points ??
                        (score as any).team2Games ??
                        0);
                    return (
                      <View key={idx} style={styles.setColumn}>
                        <View style={[styles.setScoreBox, isPreview && { height: PREVIEW.boxHeight }]}>
                          <Text
                            style={[
                              styles.setScoreText,
                              !isPlaceholder &&
                                (team1Score as number) >
                                  (team2Score as number) &&
                                styles.winningScoreText,
                              isPreview && { fontSize: !isPlaceholder && (team1Score as number) > (team2Score as number) ? PREVIEW.winningScoreText : PREVIEW.setScoreText },
                            ]}
                          >
                            {team1Score}
                          </Text>
                        </View>
                        <View style={[styles.setScoreBox, isPreview && { height: PREVIEW.boxHeight }]}>
                          <Text
                            style={[
                              styles.setScoreText,
                              !isPlaceholder &&
                                (team2Score as number) >
                                  (team1Score as number) &&
                                styles.winningScoreText,
                              isPreview && { fontSize: !isPlaceholder && (team2Score as number) > (team1Score as number) ? PREVIEW.winningScoreText : PREVIEW.setScoreText },
                            ]}
                          >
                            {team2Score}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>
            );
          })()}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 20,
  },
  sportIcon: {
    marginRight: 8,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  titleContainer: {
    flexDirection: "column",
    marginLeft: 12,
  },
  leagueText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
  },
  seasonDivisionText: {
    fontSize: 24,
    color: "#4C4C4B",
    fontWeight: "500",
  },
  cardContainer: {
    width: "100%",
    maxWidth: 850,
    height: "100%",
    maxHeight: 600,
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "#a1a2a5",
    overflow: "hidden",
    // NEW: This replaces ios shadow props and android elevation
    boxShadow: "0px 12px 24px rgba(0, 0, 0, 0.12)",
  },

  matchTypeBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    minWidth: 120, 
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 40,
    borderWidth: 1,
  },
  matchTypeText: {
    fontSize: 24,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  mainScoreSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    gap: 20,
  },
  cardVenueName: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1D1D1F",
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 12,
  },
  teamContainer: {
    flex: 1, 
    alignItems: "center",
  },
  singlesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  teamName: {
    fontSize: 26,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },
  winnerName: {
    color: "#1D1D1F",
    fontWeight: "900",
    fontSize: 28,
  },
  loserName: {
    color: "#1F2937",
    fontWeight: "600",
    fontSize: 24,
  },
  scoreDisplay: {
    flexDirection: "row",
    alignItems: "center",
  },
  scoreText: {
    fontSize: 100,
    fontWeight: "900",
    color: "1D1D1F",
  },
  scoreDivider: {
    fontSize: 100,
    color: "#1D1D1F",
    marginHorizontal: 8,
  },
  scoresSection: {
    backgroundColor: "transparent",
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginTop: 10,
  },
  scoreHeaderRow: {
    flexDirection: "row",
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  nameColumnHeaderBox: {
    width: NAME_COLUMN_WIDTH,
    paddingLeft: 8,
  },
  setColumnHeaderBox: {
    flex: 1,
    alignItems: "center",
  },
  scoresColumns: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
  },
  nameColumn: {
    width: NAME_COLUMN_WIDTH,
    justifyContent: "space-around",
    paddingLeft: 8,
  },
  nameColumnText: {
    fontSize: 26,
    fontWeight: "700",
    color: "#374151",
    height: 48,
    textAlignVertical: "center",
    lineHeight: 48,
  },
  setColumn: {
    flex: 1,
    alignItems: "center",
  },
  setScoreBox: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  setHeaderText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
  winningScoreText: {
    color: "#FEA04D",
    fontWeight: "900",
    fontSize: 32,
  },
  setScoreText: {
    fontSize: 30,
    fontWeight: "800",
    color: "#374151",
  },
  teamPhotos: {
    marginBottom: 12,
  },
  doublesPhotos: {
    flexDirection: "row",
    alignItems: "center",
  },
  doublesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  doublesNames: {
    flexDirection: "column",
    marginLeft: 12,
    alignItems: "flex-start",
  },
  doublesPlayerName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginVertical: 2,
  },
  playerPhoto: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  playerPhotoDefault: {
    backgroundColor: "#6DE9A0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  playerPhotoText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  cardMatchDate: {
    fontSize: 26,
    fontWeight: "500",
    color: "#86868B",
    marginTop: 4,
    textAlign: "center",
  },
  cardWalkover: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F59E0B",
    marginTop: 2,
    textAlign: "center",
  },
});

export default ScoreCard;
