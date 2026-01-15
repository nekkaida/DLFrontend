import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  scale,
  verticalScale,
  moderateScale,
} from '@/core/utils/responsive';
import { SPORT_COLORS, getSportColors } from "@/constants/SportsColor";

interface FriendlyMatchRequestAttachmentProps {
  isFromCurrentUser?: boolean;
  sportType?: "PICKLEBALL" | "TENNIS" | "PADEL" | null;
}

const getSportColor = (sportType: string | null | undefined): string => {
  const colors = getSportColors(sportType as any);
  return colors.background;
};

export const FriendlyMatchRequestAttachment: React.FC<FriendlyMatchRequestAttachmentProps> = ({
  isFromCurrentUser = false,
  sportType,
}) => {
  const iconColor = getSportColor(sportType);

  return (
    <View style={styles.container}>
      <Ionicons name="tennisball" size={moderateScale(14)} color={iconColor} style={styles.icon} />
      <Text style={styles.text}>
        {isFromCurrentUser ? "You sent a friendly match request" : "Sent a friendly match request"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: scale(6),
  },
  text: {
    fontSize: moderateScale(14),
    color: "#6B7280",
    lineHeight: verticalScale(20),
  },
});
