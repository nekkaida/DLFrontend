// src/features/feed/components/SolidScorecard.tsx

import { MatchResult, SportColors } from "@/features/standings/types";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

interface SolidScorecardProps {
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

export const SolidScorecard: React.FC<SolidScorecardProps> = ({
  match,
  sportColors,
  isFriendly = false,
  matchType = "SINGLES",
}) => {
  // Helper function to render player photo
  const renderPlayerPhoto = (player: any, size: number = 120) => {
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
  const scores = match.gameScores || match.setScores || [];
  const isSingles = match.team1Players.length === 1;
  const matchTypeLabel = isFriendly ? "Friendly" : "League";

  // Get season and division info
  const seasonName =
    (match as any).division?.season?.name || (match as any).seasonName || "";
  const divisionName =
    (match as any).division?.name || (match as any).divisionName || "";

  return (
    <View style={styles.scorecardContainer}>
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
        <View style={styles.headerTopRow}>
          <View style={styles.headerContent}>
            <View style={styles.leagueRow}>
              <Ionicons
                name={getSportIcon((match as any).sportType)}
                size={80}
                color={sportColors.background}
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
                backgroundColor: isFriendly ? "#E0E7FF" : "#FFFFFF",
                borderColor: isFriendly ? "#83CFF9" : "#FEA04D",
              },
            ]}
          >
            <Text
              style={[
                styles.matchTypeText,
                {
                  color: isFriendly ? "#83CFF9" : "#FEA04D",
                },
              ]}
            >
              {matchTypeLabel}
            </Text>
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
                {renderPlayerPhoto(match.team1Players[0], 140)}
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
                {renderPlayerPhoto(match.team2Players[0], 140)}
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

      {/* Scores Table */}
      {scores.length > 0 && (
        <View style={styles.scoresTable}>
          {/* Table Header */}
          <View
            style={[
              styles.tableHeader,
              { backgroundColor: sportColors.background },
            ]}
          >
            <View style={styles.tableNameHeaderCell}>
              <Text style={styles.tableHeaderText}>Sets</Text>
            </View>
            {scores.map((_, idx) => {
              const ordinalMap = ['1st', '2nd', '3rd', '4th', '5th'];
              return (
                <View key={idx} style={styles.tableScoreHeaderCell}>
                  <Text style={styles.tableHeaderText}>{ordinalMap[idx] || `${idx + 1}th`}</Text>
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
            {scores.map((score, idx) => {
              const team1Score = "team1Games" in score ? score.team1Games : "team1Points" in score ? score.team1Points : 0;
              const team2Score = "team2Games" in score ? score.team2Games : "team2Points" in score ? score.team2Points : 0;
              const isWinner = team1Score > team2Score;
              
              return (
                <View key={idx} style={styles.tableScoreCell}>
                  <Text style={[
                    styles.tableScoreText,
                    isWinner && styles.winningScoreText
                  ]}>
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
            {scores.map((score, idx) => {
              const team1Score = "team1Games" in score ? score.team1Games : "team1Points" in score ? score.team1Points : 0;
              const team2Score = "team2Games" in score ? score.team2Games : "team2Points" in score ? score.team2Points : 0;
              const isWinner = team2Score > team1Score;
              
              return (
                <View key={idx} style={styles.tableScoreCell}>
                  <Text style={[
                    styles.tableScoreText,
                    isWinner && styles.winningScoreText
                  ]}>
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
  );
};

const styles = StyleSheet.create({
  scorecardContainer: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  header: {
    paddingVertical: 40,
    paddingHorizontal: 60,
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
    marginRight: 12,
  },
  leagueText: {
    fontSize: 48,
    fontWeight: "700",
    color: "#111827",
  },
  seasonDivisionText: {
    fontSize: 36,
    fontWeight: "500",
    color: "#6B7280",
  },
  matchTypeBadge: {
    width: 240, // Doubled size
    height: 80, // Doubled size
    borderRadius: 40,
    borderWidth: 4, // Thicker border for visibility
    justifyContent: "center", // Vertical center
    alignItems: "center", // Horizontal center
  },
  matchTypeText: {
    fontSize: 32, // Much larger
    fontWeight: "800", // Heavier weight
    textTransform: "uppercase", // Usually looks better for export labels
  },
  mainScoreSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 60,
    paddingVertical: 60,
    backgroundColor: "#FFFFFF",
  },
  teamContainer: {
    flex: 1,
    alignItems: "center",
  },
  teamPhotos: {
    marginBottom: 24,
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
    marginLeft: 20,
    alignItems: "flex-start",
  },
  doublesPlayerName: {
    fontSize: 36,
    fontWeight: "600",
    color: "#1F2937",
    marginVertical: 4,
  },
  playerPhoto: {
    borderWidth: 4,
    borderColor: "#E5E7EB",
  },
  playerPhotoDefault: {
    backgroundColor: "#6DE9A0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#E5E7EB",
  },
  playerPhotoText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  teamName: {
    fontSize: 44,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  scoreDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  scoreText: {
    fontSize: 220,
    fontWeight: "900",
    color: "#111827",
    letterSpacing: -10,
  },
  scoreDivider: {
    fontSize: 120,
    fontWeight: "300",
    color: "#9CA3AF",
    marginHorizontal: 30,
  },
  // scoresTable: {
  //   backgroundColor: "#F9FAFB",
  //   paddingBottom: 40,
  // },
  // tableHeader: {
  //   flexDirection: "row",
  //   paddingVertical: 24,
  //   paddingHorizontal: 60,
  //   borderRadius: 60,
  //   marginHorizontal: 20,
  //   marginTop: 20,
  // },
  tableNameHeaderCell: {
    flex: 2,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingVertical: 30,
    paddingLeft: 0,
  },
  tableScoreHeaderCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },
  // tableHeaderText: {
  //   fontSize: 42,
  //   fontWeight: "700",
  //   color: "#FFFFFF",
  // },
  // tableRow: {
  //   flexDirection: "row",
  //   paddingVertical: 20,
  //   paddingHorizontal: 60,
  //   borderBottomWidth: 2,
  //   borderBottomColor: "#E5E7EB",
  // },
  tableNameCell: {
    flex: 2,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  // tableNameText: {
  //   fontSize: 40,
  //   fontWeight: "500",
  //   color: "#374151",
  // },
  tableScoreCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  // tableScoreText: {
  //   fontSize: 48,
  //   fontWeight: "600",
  //   color: "#1F2937",
  // },

  scoresTable: {
    backgroundColor: "#F3F4F6",
    paddingBottom: 60,
    paddingTop: 20,
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 30,
    paddingHorizontal: 60,
    borderRadius: 30,
    marginHorizontal: 40,
  },
  tableHeaderText: {
    fontSize: 48,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 35,
    paddingHorizontal: 60,
  },
  tableNameText: {
    fontSize: 44,
    fontWeight: "700",
    color: "#374151",
  },
  tableScoreText: {
    fontSize: 54,
    fontWeight: "800",
    color: "#111827",
  },
  winningScoreText: {
    fontSize: 64,
    fontWeight: "900",
    color: "#FEA04D",
  },
  logoContainer: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#FFFFFF",
  },
  logoText: {
    fontSize: 48,
    fontWeight: "900",
    color: "#FEA04D",
    letterSpacing: 4,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
