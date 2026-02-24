// src/features/feed/components/TransparentScorecard.tsx

import { MatchResult } from "@/features/standings/types";
import { format } from "date-fns";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

interface TransparentScorecardProps {
  match: MatchResult;
  previewScale?: number; // Scale factor for text/content in preview mode
}

export const TransparentScorecard: React.FC<TransparentScorecardProps> = ({
  match,
  previewScale,
}) => {
  // Scale helper - 30% of original size for preview (rendered directly at preview card size)
  const scale = (size: number) => (previewScale !== undefined ? Math.round(size * 0.3) : size);
  const isPreview = previewScale !== undefined;
  
  // Helper function to render player photo
  const renderPlayerPhoto = (player: any, size: number = 120) => {
    const scaledSize = scale(size);
    if (player.image) {
      return (
        <Image
          source={{ uri: player.image }}
          style={[
            styles.playerPhoto,
            { width: scaledSize, height: scaledSize, borderRadius: scaledSize / 2 },
          ]}
        />
      );
    }
    return (
      <View
        style={[
          styles.playerPhotoDefault,
          { width: scaledSize, height: scaledSize, borderRadius: scaledSize / 2 },
        ]}
      >
        <Text style={[styles.playerPhotoText, { fontSize: scaledSize * 0.4 }]}>
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

  const scores = match.gameScores || match.setScores || [];
  const isSingles = match.team1Players.length === 1;

  return (
    <View style={styles.scorecardContainer}>
      {/* Location/League Name */}
      <Text style={[styles.locationText, { fontSize: scale(56) }]}>
        {match.location || match.leagueName || "Friendly Match"}
      </Text>

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
          <Text style={[styles.teamName, { fontSize: scale(48) }]} numberOfLines={2}>
            {isSingles
              ? formatPlayerName(match.team1Players[0].name)
              : formatPlayerName(match.team1Players[0].name, true)}
          </Text>
        </View>

        {/* Score Display */}
        <View style={styles.scoreDisplay}>
          <Text style={[styles.scoreText, { fontSize: scale(140) }]}>{match.team1Score || 0}</Text>
          <Text style={[styles.scoreDivider, { fontSize: scale(120) }]}>-</Text>
          <Text style={[styles.scoreText, { fontSize: scale(140) }]}>{match.team2Score || 0}</Text>
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
          <Text style={[styles.teamName, { fontSize: scale(48) }]} numberOfLines={2}>
            {isSingles
              ? formatPlayerName(match.team2Players[0].name)
              : formatPlayerName(match.team2Players[0].name, true)}
          </Text>
        </View>
      </View>

      {/* Date */}
      <Text style={[styles.dateText, { fontSize: scale(40) }]}>
        {match.matchDate
          ? format(new Date(match.matchDate), "d MMMM yyyy")
          : ""}
      </Text>

      {/* Scores Table */}
      {scores.length > 0 && (
        <View style={styles.scoresTable}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={styles.tableHeaderCell}>
              <Text style={styles.tableHeaderText}></Text>
            </View>
            {scores.map((_, idx) => (
              <View key={idx} style={styles.tableHeaderCell}>
              <Text style={[styles.tableHeaderText, { fontSize: scale(38) }]}>
                  {idx + 1}
                  {idx === 0 ? "st" : idx === 1 ? "nd" : "rd"}
                </Text>
              </View>
            ))}
          </View>

          {/* Team 1 Row */}
          <View style={styles.tableRow}>
            <View style={styles.tableNameCell}>
              <Text style={[styles.tableNameText, { fontSize: scale(42) }]} numberOfLines={1}>
                {isSingles
                  ? formatPlayerName(match.team1Players[0].name)
                  : formatPlayerName(match.team1Players[0].name, true)}
              </Text>
            </View>
            {scores.map((score, idx) => (
              <View key={idx} style={styles.tableScoreCell}>
                <Text style={[styles.tableScoreText, { fontSize: scale(50) }]}>
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
              <Text style={[styles.tableNameText, { fontSize: scale(42) }]} numberOfLines={1}>
                {isSingles
                  ? formatPlayerName(match.team2Players[0].name)
                  : formatPlayerName(match.team2Players[0].name, true)}
              </Text>
            </View>
            {scores.map((score, idx) => (
              <View key={idx} style={styles.tableScoreCell}>
                <Text style={[styles.tableScoreText, { fontSize: scale(50) }]}>
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
    alignItems: "center",
    paddingVertical: 40,
  },
  locationText: {
    fontSize: 56,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 50,
    textAlign: "center",
  },
  mainScoreSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 60,
    paddingVertical: 40,
    width: "100%",
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
    borderColor: "#FFFFFF",
  },
  playerPhotoDefault: {
    backgroundColor: "#9CA3AF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  playerPhotoText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  teamName: {
    fontSize: 48,
    fontWeight: "600",
    color: "#FFFFFF",
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
    fontSize: 140,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  scoreDivider: {
    fontSize: 120,
    fontWeight: "300",
    color: "rgba(255, 255, 255, 0.6)",
    marginHorizontal: 30,
  },
  dateText: {
    fontSize: 40,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 20,
    marginBottom: 50,
    textAlign: "center",
  },
  scoresTable: {
    width: "100%",
    paddingHorizontal: 80,
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 20,
    borderBottomWidth: 2,
    borderBottomColor: "rgba(255, 255, 255, 0.3)",
  },
  tableHeaderCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tableHeaderText: {
    fontSize: 38,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 24,
  },
  tableNameCell: {
    flex: 1.5,
    justifyContent: "center",
    paddingRight: 20,
  },
  tableNameText: {
    fontSize: 42,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  tableScoreCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tableScoreText: {
    fontSize: 50,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
