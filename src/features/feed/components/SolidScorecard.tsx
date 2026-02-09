// src/features/feed/components/SolidScorecard.tsx

import { MatchResult, SportColors } from "@/features/standings/types";
import { format } from "date-fns";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

interface SolidScorecardProps {
  match: MatchResult;
  sportColors: SportColors;
}

export const SolidScorecard: React.FC<SolidScorecardProps> = ({
  match,
  sportColors,
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

  return (
    <View style={styles.scorecardContainer}>
      {/* League/Match Info Header */}
      <View
        style={[styles.header, { backgroundColor: sportColors.background }]}
      >
        <Text style={styles.leagueText}>
          {match.leagueName || "Friendly Match"}
        </Text>
        <Text style={styles.dateText}>
          {match.matchDate
            ? format(new Date(match.matchDate), "d MMM yyyy")
            : ""}
        </Text>
      </View>

      {/* Main Score Section */}
      <View style={styles.mainScoreSection}>
        {/* Team 1 */}
        <View style={styles.teamContainer}>
          <View style={styles.teamPhotos}>
            {isSingles ? (
              renderPlayerPhoto(match.team1Players[0], 140)
            ) : (
              <View style={styles.doublesPhotos}>
                {renderPlayerPhoto(match.team1Players[0], 120)}
                <View style={{ marginLeft: -30 }}>
                  {renderPlayerPhoto(match.team1Players[1], 120)}
                </View>
              </View>
            )}
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
            {isSingles
              ? formatPlayerName(match.team1Players[0].name)
              : `${formatPlayerName(match.team1Players[0].name, true)}, ${formatPlayerName(match.team1Players[1].name, true)}`}
          </Text>
        </View>

        {/* Score Display */}
        <View style={styles.scoreDisplay}>
          <Text style={styles.scoreText}>{match.team1Score || 0}</Text>
          <Text style={styles.scoreDivider}>-</Text>
          <Text style={styles.scoreText}>{match.team2Score || 0}</Text>
        </View>

        {/* Team 2 */}
        <View style={styles.teamContainer}>
          <View style={styles.teamPhotos}>
            {isSingles ? (
              renderPlayerPhoto(match.team2Players[0], 140)
            ) : (
              <View style={styles.doublesPhotos}>
                {renderPlayerPhoto(match.team2Players[0], 120)}
                <View style={{ marginLeft: -30 }}>
                  {renderPlayerPhoto(match.team2Players[1], 120)}
                </View>
              </View>
            )}
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
            {isSingles
              ? formatPlayerName(match.team2Players[0].name)
              : `${formatPlayerName(match.team2Players[0].name, true)}, ${formatPlayerName(match.team2Players[1].name, true)}`}
          </Text>
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
            <View style={styles.tableHeaderCell}>
              <Text style={styles.tableHeaderText}></Text>
            </View>
            {scores.map((_, idx) => (
              <View key={idx} style={styles.tableHeaderCell}>
                <Text style={styles.tableHeaderText}>{idx + 1}</Text>
              </View>
            ))}
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
            {scores.map((score, idx) => (
              <View key={idx} style={styles.tableScoreCell}>
                <Text style={styles.tableScoreText}>
                  {"team1Games" in score
                    ? score.team1Games
                    : "team1Points" in score
                      ? score.team1Points
                      : 0}
                </Text>
              </View>
            ))}
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
            {scores.map((score, idx) => (
              <View key={idx} style={styles.tableScoreCell}>
                <Text style={styles.tableScoreText}>
                  {"team2Games" in score
                    ? score.team2Games
                    : "team2Points" in score
                      ? score.team2Points
                      : 0}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
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
    alignItems: "center",
  },
  leagueText: {
    fontSize: 52,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  dateText: {
    fontSize: 36,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
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
    fontSize: 120,
    fontWeight: "700",
    color: "#1F2937",
  },
  scoreDivider: {
    fontSize: 100,
    fontWeight: "300",
    color: "#9CA3AF",
    marginHorizontal: 30,
  },
  scoresTable: {
    backgroundColor: "#F9FAFB",
    paddingBottom: 40,
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 24,
    paddingHorizontal: 60,
  },
  tableHeaderCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tableHeaderText: {
    fontSize: 42,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 20,
    paddingHorizontal: 60,
    borderBottomWidth: 2,
    borderBottomColor: "#E5E7EB",
  },
  tableNameCell: {
    flex: 2,
    justifyContent: "center",
    paddingRight: 20,
  },
  tableNameText: {
    fontSize: 40,
    fontWeight: "500",
    color: "#374151",
  },
  tableScoreCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tableScoreText: {
    fontSize: 48,
    fontWeight: "600",
    color: "#1F2937",
  },
});
