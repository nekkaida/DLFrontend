import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { MatchResult, SportColors } from "../types";
import { formatPlayerName } from "../utils";

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

export type CardBackgroundStyle = "white" | "transparent" | "dark";

interface MatchResultCardProps {
  match: MatchResult;
  index: number;
  totalResults: number;
  sportColors: SportColors;
  isPickleball: boolean;
  cardWidth: number;
  cardGap: number;
  expandedComments: Set<string>;
  onToggleComments: (matchId: string) => void;
  onSharePress?: (matchId: string) => void;
  backgroundStyle?: CardBackgroundStyle;
}

export const MatchResultCard: React.FC<MatchResultCardProps> = ({
  match,
  index,
  totalResults,
  sportColors,
  isPickleball,
  cardWidth,
  cardGap,
  expandedComments,
  onToggleComments,
  onSharePress,
  backgroundStyle = "white",
}) => {
  const isTeam1Winner = match.outcome === "team1";
  const isTeam2Winner = match.outcome === "team2";

  // Handle different score structures for different sports
  // Pickleball uses gameScores with team1Points/team2Points
  // Tennis/Padel use setScores with team1Games/team2Games
  const scores =
    match.gameScores?.length > 0 ? match.gameScores : match.setScores || [];
  const totalSets = scores?.length || 0;
  const isExpanded = expandedComments.has(match.id);
  const isSingles = match.team1Players.length === 1;
  const isFriendly =
    (match as any).isFriendly || (match as any).matchType === "FRIENDLY";
  const matchTypeLabel = isFriendly ? "Friendly" : "League";

  // Get season and division info
  const seasonName =
    (match as any).division?.season?.name || (match as any).seasonName || "";
  const divisionName =
    (match as any).division?.name || (match as any).divisionName || "";

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

  const renderScoresTable = () => {
    if (!scores || scores.length === 0) return null;

    return (
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
          {scores.map((score, idx) => {
            // Handle both gameScores (pickleball) and setScores (tennis/padel)
            const team1Score = score.team1Points ?? score.team1Games ?? 0;
            const team2Score = score.team2Points ?? score.team2Games ?? 0;
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
          {scores.map((score, idx) => {
            // Handle both gameScores (pickleball) and setScores (tennis/padel)
            const team1Score = score.team1Points ?? score.team1Games ?? 0;
            const team2Score = score.team2Points ?? score.team2Games ?? 0;
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
    );
  };

  const renderComments = () => {
    if (!match.comments || match.comments.length === 0) {
      // Fallback to old resultComment if no comments array
      if (match.resultComment) {
        return (
          <View style={styles.cardCommentSection}>
            <Ionicons
              name="thumbs-up"
              size={16}
              color={sportColors.background}
            />
            <Text style={styles.cardCommentText} numberOfLines={2}>
              {match.resultComment}
            </Text>
          </View>
        );
      }
      return null;
    }

    const displayedComments = isExpanded
      ? match.comments
      : match.comments.slice(0, 2);

    return (
      <View style={styles.cardCommentsContainer}>
        {displayedComments.map((commentItem) => (
          <View key={commentItem.id} style={styles.cardCommentItem}>
            <Ionicons
              name="thumbs-up"
              size={14}
              color={sportColors.background}
              style={styles.cardCommentThumb}
            />
            {commentItem.user.image ? (
              <Image
                source={{ uri: commentItem.user.image }}
                style={styles.cardCommentAvatar}
              />
            ) : (
              <View
                style={[
                  styles.cardCommentAvatar,
                  styles.cardCommentDefaultAvatar,
                ]}
              >
                <Text style={styles.cardCommentDefaultAvatarText}>
                  {commentItem.user.name?.charAt(0)?.toUpperCase() || "?"}
                </Text>
              </View>
            )}
            <Text style={styles.cardCommentText} numberOfLines={2}>
              <Text style={styles.cardCommentAuthor}>
                {commentItem.user.name.split(" ")[0]}:
              </Text>{" "}
              {commentItem.comment}
            </Text>
          </View>
        ))}
        {match.comments.length > 2 && (
          <TouchableOpacity
            style={styles.viewMoreCommentsButton}
            onPress={() => onToggleComments(match.id)}
          >
            <Text
              style={[
                styles.viewMoreCommentsText,
                { color: sportColors.background },
              ]}
            >
              {isExpanded
                ? "View less"
                : `View ${match.comments.length - 2} more comment${match.comments.length - 2 > 1 ? "s" : ""}`}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const cardStyle: ViewStyle = {
    width: cardWidth,
    marginLeft: index === 0 ? 0 : cardGap,
    ...(index === totalResults - 1 && { marginRight: 0 }),
    backgroundColor:
      backgroundStyle === "transparent" ? "transparent" : "#FEFEFE",
    ...(backgroundStyle === "transparent" && {
      borderWidth: 0,
      shadowOpacity: 0,
      elevation: 0,
    }),
  };

  console.log("match", match);
  return (
    <View style={[styles.resultCardNew, cardStyle]}>
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
                size={20}
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
                backgroundColor: "transparent",
                borderColor: isFriendly ? "#83CFF9" : "#FEA04D",
                borderWidth: 1,
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

      {/* Venue Name */}
      <Text style={styles.cardVenueName}>{match.location || "Venue TBD"}</Text>

      {/* Main Score Section */}
      <View style={styles.mainScoreSection}>
        {/* Team 1 */}
        <View style={styles.teamContainer}>
          {isSingles ? (
            <>
              <View style={styles.teamPhotos}>
                {renderPlayerPhoto(match.team1Players[0], 45)}
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
                {renderPlayerPhoto(match.team1Players[0], 38)}
                <View style={{ marginLeft: -10 }}>
                  {renderPlayerPhoto(match.team1Players[1], 38)}
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
                {renderPlayerPhoto(match.team2Players[0], 45)}
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
                {renderPlayerPhoto(match.team2Players[0], 38)}
                <View style={{ marginLeft: -10 }}>
                  {renderPlayerPhoto(match.team2Players[1], 38)}
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

      {/* Match Date */}
      <Text style={styles.cardMatchDate}>
        {format(new Date(match.matchDate), "d MMM yyyy")}
      </Text>
      {match.isWalkover && <Text style={styles.cardWalkover}>W/O</Text>}

      {/* Set Scores Table */}
      {renderScoresTable()}

      {/* Comments Section */}
      {renderComments()}
    </View>
  );
};

const styles = StyleSheet.create({
  resultCardNew: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "flex-start",
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
    marginBottom: 4,
  },
  headerContent: {
    flex: 1,
  },
  leagueRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  sportIcon: {
    marginRight: 6,
  },
  leagueText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  seasonDivisionText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6B7280",
  },
  matchTypeBadge: {
    backgroundColor: "transparent",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  matchTypeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  mainScoreSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
  },
  teamContainer: {
    flex: 1,
    alignItems: "center",
  },
  teamPhotos: {
    marginBottom: 8,
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
    marginLeft: 8,
    alignItems: "flex-start",
  },
  doublesPlayerName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1F2937",
    marginVertical: 1,
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
  teamName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
    paddingHorizontal: 8,
  },
  scoreDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#111827",
    letterSpacing: -2,
  },
  scoreDivider: {
    fontSize: 40,
    fontWeight: "600",
    color: "#000000",
    marginHorizontal: 8,
  },
  scoresTable: {
    backgroundColor: "#ffffff",
    paddingBottom: 12,
    paddingTop: 4,
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 50,
    marginHorizontal: 16,

    marginTop: 20,
    marginBottom: 10,
    alignItems: "center",
  },
  tableNameHeaderCell: {
    flex: 2,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingVertical: 8,
    paddingLeft: 0,
  },
  tableScoreHeaderCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  tableNameCell: {
    flex: 2,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  tableNameText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
  },
  tableScoreCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tableScoreText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  winningScoreText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FEA04D",
  },
  cardVenueName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#86868B",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 18,
  },
  cardMatchDate: {
    fontSize: 10,
    fontWeight: "400",
    color: "#86868B",
    marginTop: 4,
    textAlign: "center",
  },
  cardWalkover: {
    fontSize: 8,
    fontWeight: "600",
    color: "#F59E0B",
    marginTop: 2,
    textAlign: "center",
  },
  cardCommentSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  cardCommentsContainer: {
    marginTop: 12,
    marginHorizontal: 18,
    gap: 10,
  },
  cardCommentItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  cardCommentThumb: {
    marginTop: 2,
  },
  cardCommentAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
  },
  cardCommentDefaultAvatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardCommentDefaultAvatarText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6B7280",
  },
  cardCommentAuthor: {
    fontWeight: "700",
    color: "#374151",
  },
  cardCommentText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "400",
    color: "#868686",
    lineHeight: 16,
  },
  viewMoreCommentsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 4,
    gap: 4,
  },
  viewMoreCommentsText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

export default MatchResultCard;
