// src/features/feed/components/SolidScorecard.tsx

import SCardPadel from "@/assets/backgrounds/Scard-Padel.svg";
import SCardPickleball from "@/assets/backgrounds/Scard-Pickleball.svg";
import SCardTennis from "@/assets/backgrounds/Scard-Tennis.svg";
import PaddleIcon from "@/assets/icons/sports/Paddle.svg";
import PickleballIcon from "@/assets/icons/sports/Pickleball.svg";
import TennisIcon from "@/assets/icons/sports/Tennis.svg";
import { MatchResult, SportColors } from "@/features/standings/types";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

interface SolidScorecardProps {
  match: MatchResult;
  sportColors: SportColors;
  isFriendly?: boolean;
  isSingles?: boolean;
  matchType?: string;
}

const PHOTO_SIZE = 80;
const NAME_COLUMN_WIDTH = 160;
// Map sport types to their icons
const getSportIcon = (sportType: string | undefined, color: string, size: number = 66) => {
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

// Map sport types to their background images
const getSportBackground = (sportType: string | undefined) => {
  const normalizedType = sportType?.toUpperCase() || "TENNIS";
  console.log(
    "[SolidScorecard] Sport:",
    sportType,
    "→ Normalized:",
    normalizedType,
  );
  switch (normalizedType) {
    case "PICKLEBALL":
      return <SCardPickleball width="100%" height="100%" />;
    case "PADEL":
      return <SCardPadel width="100%" height="100%" />;
    case "TENNIS":
    default:
      return <SCardTennis width="100%" height="100%" />;
  }
};

export const SolidScorecard: React.FC<SolidScorecardProps> = ({
  match,
  sportColors,
  isFriendly = false,
  matchType = "SINGLES",
}) => {

  // Helper function to render player photo
  const renderPlayerPhoto = (player: any, size: number = PHOTO_SIZE) => {
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
    <View style={styles.scorecardContainer}>
      {/* Sport Background Image */}
      <View style={styles.backgroundImage}>
        {getSportBackground(match.sport)}
      </View>

      {/* Content Overlay */}
      <View style={styles.contentContainer}>
        <View style={styles.cardContainer}>
          {/* League/Match Info Header */}
          <LinearGradient
            colors={[
              `rgba(${parseInt(sportColors.background.slice(1, 3), 16)}, ${parseInt(sportColors.background.slice(3, 5), 16)}, ${parseInt(sportColors.background.slice(5, 7), 16)}, 0.08)`,
              "#FFFFFF",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.header}
          >
            {/* Header with icon and badge */}
         <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <View style={styles.headerLeft}>
                <View style={styles.sportIcon}>
                  {getSportIcon(match.sport, sportColors.background, 66)}
                </View>
                <View style={styles.titleContainer}>
                  <Text style={styles.leagueText}>{match.leagueName || "Match"}</Text>
                  {(seasonName || divisionName) && (
                    <Text style={styles.seasonDivisionText}>
                      {seasonName}{seasonName && divisionName && " • "}{divisionName}
                    </Text>
                  )}
                </View>
              </View>

              <View style={[styles.matchTypeBadge, { borderColor: isFriendly ? "#83CFF9" : "#FEA04D" }]}>
                <Text style={[styles.matchTypeText, { color: isFriendly ? "#83CFF9" : "#FEA04D" }]}>
                  {matchTypeLabel}
                </Text>
              </View>
            </View>
          </View>
          </LinearGradient>

          {/* Main Score Section */}
          <View style={styles.mainScoreSection}>
            {/* Team 1 */}
            <View style={styles.teamContainer}>
              {isSingles ? (
                <>
                  <View style={styles.teamPhotos}>
                    {renderPlayerPhoto(match.team1Players[0], PHOTO_SIZE)}
                  </View>
                  <Text
                    style={[
                      styles.teamName,
                      isTeam1Winner && {
                        color: sportColors.background,
                        fontWeight: "700",
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {formatPlayerName(match.team1Players[0].name)}
                  </Text>
                </>
              ) : (
                <View style={styles.doublesContainer}>
                  <View style={styles.doublesPhotos}>
                    {renderPlayerPhoto(match.team1Players[0], PHOTO_SIZE)}
                    <View style={{ marginLeft: -30 }}>
                      {renderPlayerPhoto(match.team1Players[1], PHOTO_SIZE)}
                    </View>
                  </View>
                  <View style={styles.doublesNames}>
                    <Text
                      style={[
                        styles.doublesPlayerName,
                        isTeam1Winner && {
                          color: sportColors.background,
                          fontWeight: "700",
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {formatPlayerName(match.team1Players[0].name, true)}
                    </Text>
                    <Text
                      style={[
                        styles.doublesPlayerName,
                        isTeam1Winner && {
                          color: sportColors.background,
                          fontWeight: "700",
                        },
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
              <Text style={styles.scoreText}>{match.team1Score || 0}</Text>
              <Text style={styles.scoreDivider}>-</Text>
              <Text style={styles.scoreText}>{match.team2Score || 0}</Text>
            </View>

            {/* Team 2 */}
            <View style={styles.teamContainer}>
              {isSingles ? (
                <>
                  <View style={styles.teamPhotos}>
                    {renderPlayerPhoto(match.team2Players[0], PHOTO_SIZE)}
                  </View>
                  <Text
                    style={[
                      styles.teamName,
                      isTeam2Winner && {
                        color: sportColors.background,
                        fontWeight: "700",
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {formatPlayerName(match.team2Players[0].name)}
                  </Text>
                </>
              ) : (
                <View style={styles.doublesContainer}>
                  <View style={styles.doublesPhotos}>
                    {renderPlayerPhoto(match.team2Players[0], PHOTO_SIZE)}
                    <View style={{ marginLeft: -30 }}>
                      {renderPlayerPhoto(match.team2Players[1], PHOTO_SIZE)}
                    </View>
                  </View>
                  <View style={styles.doublesNames}>
                    <Text
                      style={[
                        styles.doublesPlayerName,
                        isTeam2Winner && {
                          color: sportColors.background,
                          fontWeight: "700",
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {formatPlayerName(match.team2Players[0].name, true)}
                    </Text>
                    <Text
                      style={[
                        styles.doublesPlayerName,
                        isTeam2Winner && {
                          color: sportColors.background,
                          fontWeight: "700",
                        },
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

          {/* Scores Columns */}
          {scores && scores.length > 0 && (
            <View style={styles.scoresSection}>
              {/* 2. The Header Row with rounded edges */}
              <View
                style={[
                  styles.scoreHeaderRow,
                  { backgroundColor: sportColors.background },
                ]}
              >
                <View style={styles.nameColumnHeaderBox}>
                  <Text style={styles.setHeaderText}>Sets</Text>
                </View>
                {scores.map((_, idx) => (
                  <View key={`header-${idx}`} style={styles.setColumnHeaderBox}>
                    <Text style={styles.setHeaderText}>
                      {["1st", "2nd", "3rd", "4th", "5th"][idx] ||
                        `${idx + 1}th`}
                    </Text>
                  </View>
                ))}
              </View>

              {/* 3. Spaced out scores section */}
              <View style={styles.scoresColumns}>
                {/* Names Column */}
                <View style={styles.nameColumn}>
                  <Text style={styles.nameColumnText} numberOfLines={1}>
                    {isSingles
                      ? formatPlayerName(match.team1Players[0].name, true)
                      : `${formatPlayerName(match.team1Players[0].name, true)}, ${formatPlayerName(match.team1Players[1].name, true)}`}
                  </Text>
                  <Text style={styles.nameColumnText} numberOfLines={1}>
                    {isSingles
                      ? formatPlayerName(match.team2Players[0].name, true)
                      : `${formatPlayerName(match.team2Players[0].name, true)}, ${formatPlayerName(match.team2Players[1].name, true)}`}
                  </Text>
                </View>

                {/* Scores Map */}
                {scores.map((score, idx) => {
                  const team1Score =
                    (score as any).team1Points ??
                    (score as any).team1Games ??
                    0;
                  const team2Score =
                    (score as any).team2Points ??
                    (score as any).team2Games ??
                    0;
                  return (
                    <View key={idx} style={styles.setColumn}>
                      <View style={styles.setScoreBox}>
                        <Text
                          style={[
                            styles.setScoreText,
                            team1Score > team2Score && styles.winningScoreText,
                          ]}
                        >
                          {team1Score}
                        </Text>
                      </View>
                      <View style={styles.setScoreBox}>
                        <Text
                          style={[
                            styles.setScoreText,
                            team2Score > team1Score && styles.winningScoreText,
                          ]}
                        >
                          {team2Score}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 20,
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
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
  },
  seasonDivisionText: {
    fontSize: 20,
    color: "#6B7280",
    fontWeight: "500",
  },
  scorecardContainer: {
    width: "100%",
    aspectRatio: 9 / 16,
    overflow: "hidden",
  },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContainer: {
    width: "100%",
    maxWidth: 850,
    height: "100%",
    maxHeight: 550,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#d9dbe0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  matchTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  matchTypeText: {
    fontSize: 20,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  mainScoreSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
  },
  teamContainer: {
    flex: 1,
    alignItems: "center",
  },
  teamName: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },
  scoreDisplay: {
    flexDirection: "row",
    alignItems: "center",
  },
  scoreText: {
    fontSize: 100,
    fontWeight: "900",
    color: "#111827",
  },
  scoreDivider: {
    fontSize: 64,
    color: "#2c2c2c",
    marginHorizontal: 8,
  },
  scoresSection: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginTop: 10,
  },
  scoreHeaderRow: {
    flexDirection: "row",
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 16,
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
    fontSize: 24,
    fontWeight: "700",
    color: "#374151",
    height: 40,
    textAlignVertical: "center",
    lineHeight: 40,
  },
  setColumn: {
    flex: 1,
    alignItems: "center",
  },
  setScoreBox: {
    height: 40,
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
  },
  setScoreText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#374151",
  },
  headerContent: {
    flex: 1,
  },
  leagueRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  sportIcon: {
    marginRight: 8,
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
});
