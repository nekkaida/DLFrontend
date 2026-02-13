// src/features/feed/components/DarkThemeScorecard.tsx

import SCardDark from "@/assets/backgrounds/Scard-DARK VERSION.svg";
import { MatchResult, SportColors } from "@/features/standings/types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

interface DarkThemeScorecardProps {
  match: MatchResult;
  sportColors: SportColors;
  isFriendly?: boolean;
  matchType?: string;
}

// Map sport types to their icons using Ionicons (temporary solution)
const getSportIcon = (sportType: string | undefined) => {
  const normalizedType = sportType?.toUpperCase() || "TENNIS";
  const iconMap: { [key: string]: string } = {
    PICKLEBALL: "tennisball",
    TENNIS: "tennisball",
    PADEL: "tennisball",
  };
  return iconMap[normalizedType] || "tennisball";
};

export const DarkThemeScorecard: React.FC<DarkThemeScorecardProps> = ({
  match,
  sportColors,
  isFriendly = false,
  matchType = "SINGLES",
}) => {
  // Helper function to render player photo
  const renderPlayerPhoto = (player: any, size: number = 70) => {
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
      {/* Background Image */}
      <View style={styles.backgroundImage}>
        <SCardDark width="100%" height="100%" />
      </View>

      {/* Content Overlay */}
      <View style={styles.contentContainer}>
        {/* League/Match Info Header */}
        <View style={styles.header}>
          {/* Header with icon and badge */}
          <View style={styles.headerTopRow}>
            <View style={styles.headerContent}>
              <View style={styles.leagueRow}>
                <Ionicons
                  name={getSportIcon(match.sport) as any}
                  size={40}
                  color="#FFFFFF"
                  style={styles.sportIcon}
                />
                <Text style={styles.leagueText}>
                  {match.leagueName || "Match"}
                </Text>
              </View>

              {/* Season and Division */}
              {(seasonName || divisionName) && (
                <Text style={styles.seasonDivisionText}>
                  {seasonName}
                  {seasonName && divisionName && " • "}
                  {divisionName}
                </Text>
              )}
            </View>
            <View
              style={[
                styles.matchTypeBadge,
                {
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  borderColor: "#FFFFFF",
                },
              ]}
            >
              <Text style={styles.matchTypeText}>{matchTypeLabel}</Text>
            </View>
          </View>
        </View>

        {/* Main Score Section */}
        <View style={styles.mainScoreSection}>
          {/* Team 1 */}
          <View style={styles.teamContainer}>
            {isSingles ? (
              <>
                <View style={styles.teamPhotos}>
                  {renderPlayerPhoto(match.team1Players[0], 140)}
                </View>
                <Text
                  style={[
                    styles.teamName,
                    isTeam1Winner && {
                      color: "#FEA04D",
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
                  {renderPlayerPhoto(match.team1Players[0], 120)}
                  <View style={{ marginLeft: -30 }}>
                    {renderPlayerPhoto(match.team1Players[1], 120)}
                  </View>
                </View>
                <View style={styles.doublesNames}>
                  <Text
                    style={[
                      styles.doublesPlayerName,
                      isTeam1Winner && {
                        color: "#FEA04D",
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
                        color: "#FEA04D",
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
                  {renderPlayerPhoto(match.team2Players[0], 140)}
                </View>
                <Text
                  style={[
                    styles.teamName,
                    isTeam2Winner && {
                      color: "#FEA04D",
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
                  {renderPlayerPhoto(match.team2Players[0], 120)}
                  <View style={{ marginLeft: -30 }}>
                    {renderPlayerPhoto(match.team2Players[1], 120)}
                  </View>
                </View>
                <View style={styles.doublesNames}>
                  <Text
                    style={[
                      styles.doublesPlayerName,
                      isTeam2Winner && {
                        color: "#FEA04D",
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
                        color: "#FEA04D",
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

        {/* Scores Table */}
        {scores && scores.length > 0 && (
          <View style={styles.scoresTable}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={styles.tableNameHeaderCell}>
                <Text style={styles.tableHeaderText}>Sets</Text>
              </View>
              {scores?.map((_, idx) => {
                const ordinalMap = ["1st", "2nd", "3rd", "4th", "5th"];
                return (
                  <View key={idx} style={styles.tableScoreHeaderCell}>
                    <Text style={styles.tableHeaderText}>
                      {ordinalMap[idx] || `${idx + 1}th`}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Team 1 Row */}
            <View style={styles.tableRow}>
              <View style={styles.tableNameCell}>
                <Text style={styles.tableNameText} numberOfLines={1}>
                  {isSingles
                    ? formatPlayerName(match.team1Players[0].name, true)
                    : `${formatPlayerName(match.team1Players[0].name, true)}, ${formatPlayerName(match.team1Players[1].name, true)}`}
                </Text>
              </View>
              {scores?.map((score, idx) => {
                const team1Score =
                  (score as any).team1Points ?? (score as any).team1Games ?? 0;
                const team2Score =
                  (score as any).team2Points ?? (score as any).team2Games ?? 0;
                const isWinner = team1Score > team2Score;

                return (
                  <View key={idx} style={styles.tableScoreCell}>
                    <Text
                      style={[
                        styles.tableScoreText,
                        isWinner && styles.winningScoreText,
                      ]}
                    >
                      {team1Score}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Team 2 Row */}
            <View style={styles.tableRow}>
              <View style={styles.tableNameCell}>
                <Text style={styles.tableNameText} numberOfLines={1}>
                  {isSingles
                    ? formatPlayerName(match.team2Players[0].name, true)
                    : `${formatPlayerName(match.team2Players[0].name, true)}, ${formatPlayerName(match.team2Players[1].name, true)}`}
                </Text>
              </View>
              {scores?.map((score, idx) => {
                const team1Score =
                  (score as any).team1Points ?? (score as any).team1Games ?? 0;
                const team2Score =
                  (score as any).team2Points ?? (score as any).team2Games ?? 0;
                const isWinner = team2Score > team1Score;

                return (
                  <View key={idx} style={styles.tableScoreCell}>
                    <Text
                      style={[
                        styles.tableScoreText,
                        isWinner && styles.winningScoreText,
                      ]}
                    >
                      {team2Score}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* DEUCE Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>DEUCE</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scorecardContainer: {
    width: "100%",
    aspectRatio: 9 / 16, // 9:16 ratio for 1080x1920
    overflow: "hidden",
    position: "relative",
  },
  backgroundImage: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  contentContainer: {
    flex: 1,
    zIndex: 1,
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: "flex-start",
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
    marginBottom: 12,
  },
  headerContent: {
    flex: 1,
  },
  leagueRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sportIcon: {
    marginRight: 8,
  },
  leagueText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  seasonDivisionText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#E5E7EB",
  },
  matchTypeBadge: {
    width: 80,
    height: 28,
    borderRadius: 28,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  matchTypeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
  mainScoreSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 32,
    paddingVertical: 32,
  },
  teamContainer: {
    flex: 1,
    alignItems: "center",
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
    color: "#FFFFFF",
    marginVertical: 2,
  },
  playerPhoto: {
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  playerPhotoDefault: {
    backgroundColor: "#6DE9A0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  playerPhotoText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  teamName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    paddingHorizontal: 12,
  },
  scoreDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  scoreText: {
    fontSize: 96,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -4,
  },
  scoreDivider: {
    fontSize: 48,
    fontWeight: "300",
    color: "rgba(255, 255, 255, 0.6)",
    marginHorizontal: 16,
  },
  scoresTable: {
    paddingBottom: 32,
    paddingTop: 16,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginHorizontal: 24,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  tableNameHeaderCell: {
    flex: 2,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingVertical: 0,
    paddingLeft: 0,
  },
  tableScoreHeaderCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 0,
  },
  tableHeaderText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  tableNameCell: {
    flex: 2,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  tableNameText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  tableScoreCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tableScoreText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  winningScoreText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FEA04D",
  },
  logoContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FEA04D",
    letterSpacing: 3,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
