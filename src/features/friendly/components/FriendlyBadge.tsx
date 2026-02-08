import React from "react";
import { StyleSheet, Text, View } from "react-native";

const FRIENDLY_BADGE_COLOR = "#83CFF9";

interface FriendlyBadgeProps {
  style?: any;
}

export const FriendlyBadge: React.FC<FriendlyBadgeProps> = ({ style }) => {
  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.badgeText}>FRIENDLY</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: FRIENDLY_BADGE_COLOR,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#83CFF9",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.25,
  },
});

export default FriendlyBadge;
