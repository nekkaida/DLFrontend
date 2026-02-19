import { getSportColors, SportType } from "@/constants/SportsColor";
import { useSession } from "@/lib/auth-client";
import axiosInstance, { endpoints } from "@/lib/endpoints";
import { MatchCardSkeleton } from "@/src/components/MatchCardSkeleton";
import { getBackendBaseURL } from "@/src/config/network";
import { AnimatedFilterChip } from "@/src/shared/components/ui/AnimatedFilterChip";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useMyGamesStore } from "../stores/MyGamesStore";

// Cache key for match summary
const MATCH_SUMMARY_CACHE_KEY = "my_matches_summary";

import {
  FilterBottomSheet,
  FilterBottomSheetRef,
  FilterOptions,
  FilterTab,
  formatMatchDate,
  formatMatchTime,
  getMatchTime,
  InvitationCard,
  Match,
  MatchCard,
  MatchInvitation,
  MyGamesScreenProps,
  styles,
} from "./my-games";

export default function MyGamesScreen({
  sport = "pickleball",
  initialTab,
}: MyGamesScreenProps) {
  const { data: session } = useSession();
  const [matches, setMatches] = useState<Match[]>([]);
  const [invitations, setInvitations] = useState<MatchInvitation[]>([]);

  // Convert to uppercase for getSportColors (expects 'PICKLEBALL', 'TENNIS', 'PADEL')
  const sportType = sport.toUpperCase() as SportType;
  const sportColors = getSportColors(sportType);
  const filterBottomSheetRef = useRef<FilterBottomSheetRef>(null);

  // Entry animation values
  const contentEntryOpacity = useRef(new Animated.Value(0)).current;
  const contentEntryTranslateY = useRef(new Animated.Value(30)).current;
  const hasPlayedEntryAnimation = useRef(false);

  const [refreshing, setRefreshing] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const hasInitializedRef = useRef(false);

  // Filter states
  const [activeTab, setActiveTab] = useState<FilterTab>(initialTab || "ALL");
  const [upcomingPastTab, setUpcomingPastTab] = useState<"UPCOMING" | "PAST">(
    "UPCOMING",
  );

  // Handle initialTab changes from navigation
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [filters, setFilters] = useState<FilterOptions>({
    sport: null,
    division: null,
    season: null,
    matchType: null,
    gameType: null,
    status: null,
  });

  // Check if there's new content by comparing summary with cache
  const checkForNewContent = useCallback(async (): Promise<boolean> => {
    if (!session?.user?.id) return false;

    try {
      const backendUrl = getBackendBaseURL();
      const response = await fetch(`${backendUrl}/api/match/my/summary`, {
        headers: { "x-user-id": session.user.id },
      });

      if (!response.ok) return true; // If summary fails, assume new content

      const newSummary = await response.json();
      const cachedSummaryStr = await AsyncStorage.getItem(
        MATCH_SUMMARY_CACHE_KEY,
      );

      if (!cachedSummaryStr) {
        // First time - store and show skeleton
        await AsyncStorage.setItem(
          MATCH_SUMMARY_CACHE_KEY,
          JSON.stringify(newSummary),
        );
        return true;
      }

      const cachedSummary = JSON.parse(cachedSummaryStr);

      // Check if anything changed
      const hasNewContent =
        newSummary.count !== cachedSummary.count ||
        newSummary.latestUpdatedAt !== cachedSummary.latestUpdatedAt;

      // Update cache with new summary
      await AsyncStorage.setItem(
        MATCH_SUMMARY_CACHE_KEY,
        JSON.stringify(newSummary),
      );

      return hasNewContent;
    } catch (error) {
      console.error("Error checking for new content:", error);
      return true; // On error, assume new content to be safe
    }
  }, [session?.user?.id]);

  const fetchMyMatches = useCallback(
    async (isManualRefresh = false) => {
      if (!session?.user?.id) {
        console.log(`[MyGamesScreen] No session or user ID available`, { session });
        return;
      }

      console.log(`[MyGamesScreen] Starting fetchMyMatches`, {
        userId: session.user.id,
        sessionExists: !!session,
        userExists: !!session.user,
        isManualRefresh,
      });

      // Only show skeleton on very first initialization, not on tab switches
      if (!hasInitializedRef.current) {
        // First load ever - check if we have cached data
        const cachedSummaryStr = await AsyncStorage.getItem(
          MATCH_SUMMARY_CACHE_KEY,
        );
        if (!cachedSummaryStr) {
          // No cache = truly first time, show skeleton
          setShowSkeleton(true);
        } else {
          // Has cache = check for new content
          const hasNewContent = await checkForNewContent();
          if (hasNewContent) {
            setShowSkeleton(true);
          }
        }
        hasInitializedRef.current = true;
      } else if (!isManualRefresh) {
        // Subsequent automatic loads - check for new content
        const hasNewContent = await checkForNewContent();
        if (hasNewContent) {
          setShowSkeleton(true);
        }
      }
      // Manual refresh - never show skeleton

      try {
        const backendUrl = getBackendBaseURL();
        const response = await fetch(`${backendUrl}/api/match/my`, {
          headers: {
            "x-user-id": session.user.id,
          },
        });

        // console.log(`[MyGamesScreen] API Response status: ${response.status}`);

        if (response.ok) {
          const data = await response.json();
     
          // Fix: API returns data in data.data.matches structure
          const matchesData = data.data?.matches || data.matches || data.data || data;
          const finalMatches = Array.isArray(matchesData) ? matchesData : [];
          // console.log(`[MyGamesScreen] Fetched ${finalMatches.length} matches`, {
          //   activeTab,
          //   upcomingPastTab,
          //   matchStatuses: finalMatches.map(m => m?.status || 'unknown'),
          //   rawData: matchesData,
          //   apiStructure: {
          //     hasData: !!data.data,
          //     hasMatches: !!data.data?.matches,
          //     matchesLength: data.data?.matches?.length || 0,
          //   }
          // });
          setMatches(finalMatches);
        } else {
          const errorText = await response.text();
          console.error("Failed to fetch matches:", {
            status: response.status,
            statusText: response.statusText,
            errorBody: errorText
          });
          setMatches([]);
        }
      } catch (error) {
        console.error("Error fetching my matches:", error);
        setMatches([]);
      } finally {
        setRefreshing(false);
        setShowSkeleton(false);
      }
    },
    [session?.user?.id, checkForNewContent],
  );

  const fetchPendingInvitations = useCallback(async () => {
    if (!session?.user?.id) {
      console.log(`[MyGamesScreen] No session for invitations`, { session });
      return;
    }

    console.log(`[MyGamesScreen] Fetching pending invitations for user:`, session.user.id);

    try {
      const response = await axiosInstance.get(
        endpoints.match.getPendingInvitations,
      );
      console.log(`[MyGamesScreen] Invitations response:`, response.data);
      setInvitations(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error(
        "Error fetching invitations:",
        error?.response?.status,
        error?.response?.data,
        error?.message,
      );
      setInvitations([]);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchMyMatches();
    fetchPendingInvitations();
  }, [fetchMyMatches, fetchPendingInvitations]);

  // Entry animation effect - trigger when loading is done, regardless of data
  useEffect(() => {
    if (
      !showSkeleton &&
      hasInitializedRef.current &&
      !hasPlayedEntryAnimation.current
    ) {
      hasPlayedEntryAnimation.current = true;
      Animated.parallel([
        Animated.spring(contentEntryOpacity, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: false,
        }),
        Animated.spring(contentEntryTranslateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: false,
        }),
      ]).start();
    } else if (!showSkeleton && !hasInitializedRef.current) {
      // Fallback: Show content immediately if not initialized properly
      contentEntryOpacity.setValue(1);
      contentEntryTranslateY.setValue(0);
    }
  }, [
    showSkeleton,
    matches,
    invitations,
    contentEntryOpacity,
    contentEntryTranslateY,
  ]);

  // Listen for refresh signal from match-details (after submit/confirm/join/cancel)
  const { shouldRefresh, clearRefresh } = useMyGamesStore();

  useEffect(() => {
    if (shouldRefresh) {
      fetchMyMatches(true); // Manual refresh style (no skeleton)
      fetchPendingInvitations();
      clearRefresh();
    }
  }, [shouldRefresh, clearRefresh, fetchMyMatches, fetchPendingInvitations]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyMatches(true);
    fetchPendingInvitations();
  };

  // Extract unique values for filters
  const uniqueSports = useMemo(() => {
    const sports = new Set(
      matches
        .map((m) => m.sport || m.division?.league?.sportType)
        .filter(Boolean),
    );
    return Array.from(sports) as string[];
  }, [matches]);

  const uniqueDivisions = useMemo(() => {
    const divisions = new Set(
      matches.map((m) => m.division?.name).filter(Boolean),
    );
    return Array.from(divisions) as string[];
  }, [matches]);

  const uniqueSeasons = useMemo(() => {
    const seasons = new Set(
      matches.map((m) => m.division?.season?.name).filter(Boolean),
    );
    return Array.from(seasons) as string[];
  }, [matches]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(
      matches.map((m) => m.status.toUpperCase()).filter(Boolean),
    );
    return Array.from(statuses) as string[];
  }, [matches]);

  // Filter matches based on all criteria
  const filteredMatches = useMemo(() => {
    let filtered = [...matches];

    // Filter by the currently selected sport from the dashboard
    filtered = filtered.filter((match) => {
      const matchSport = (
        match.sport ||
        match.division?.league?.sportType ||
        ""
      ).toUpperCase();
      return matchSport === sportType;
    });

    // Exclude DRAFT matches where user's invitation is still PENDING
    // (these should appear in INVITES tab instead)
    filtered = filtered.filter((match) => {
      if (
        match.status.toUpperCase() === "DRAFT" &&
        match.invitationStatus === "PENDING"
      ) {
        // Check if user is the creator - creators should see their DRAFT matches
        const isCreator = match.createdById === session?.user?.id;
        if (!isCreator) {
          return false; // Hide from non-creators who haven't responded yet
        }
      }
      return true;
    });

    console.log(`[MyGamesScreen] Filtering matches`, {
      totalMatches: matches.length,
      activeTab,
      upcomingPastTab,
      beforeFiltering: filtered.length,
      sportType,
    });

    // Filter by Upcoming/Past tab
    if (upcomingPastTab === "UPCOMING") {
      filtered = filtered.filter((m) =>
        ["OPEN", "SCHEDULED", "ONGOING", "IN_PROGRESS", "DRAFT"].includes(
          m.status.toUpperCase(),
        ),
      );
    } else if (upcomingPastTab === "PAST") {
      filtered = filtered.filter((m) =>
        ["COMPLETED", "FINISHED", "CANCELLED", "VOID", "UNFINISHED"].includes(
          m.status.toUpperCase(),
        ),
      );
    }

    console.log(`[MyGamesScreen] After time filtering: ${filtered.length} matches`, {
      statuses: filtered.map(m => m.status),
    });

    // Filter by ALL/LEAGUE/FRIENDLY tab
    if (activeTab === "LEAGUE") {
      filtered = filtered.filter((m) => m.isFriendly !== true);
    } else if (activeTab === "FRIENDLY") {
      filtered = filtered.filter((m) => m.isFriendly === true);
    }

    // Filter by sport (from bottom sheet)
    if (filters.sport) {
      filtered = filtered.filter(
        (m) => (m.sport || m.division?.league?.sportType) === filters.sport,
      );
    }

    // Filter by division (from bottom sheet)
    if (filters.division) {
      filtered = filtered.filter((m) => m.division?.name === filters.division);
    }

    // Filter by season (from bottom sheet)
    if (filters.season) {
      filtered = filtered.filter(
        (m) => m.division?.season?.name === filters.season,
      );
    }

    // Filter by match type (League vs Friendly)
    if (filters.matchType) {
      if (filters.matchType === "FRIENDLY") {
        filtered = filtered.filter((m) => m.isFriendly === true);
      } else if (filters.matchType === "LEAGUE") {
        filtered = filtered.filter((m) => m.isFriendly !== true);
      }
    }

    // Filter by game type (Singles vs Doubles)
    if (filters.gameType) {
      filtered = filtered.filter(
        (m) => m.matchType?.toUpperCase() === filters.gameType,
      );
    }

    // Filter by status (from bottom sheet - overrides tab filter if set)
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((m) =>
        filters.status!.includes(m.status.toUpperCase()),
      );
    }

    console.log(`[MyGamesScreen] Final filtered matches: ${filtered.length}`, {
      activeTab,
      upcomingPastTab,
      matches: filtered.map(m => ({ id: m.id, status: m.status, sport: m.sport })),
    });

    return filtered;
  }, [
    matches,
    activeTab,
    upcomingPastTab,
    filters,
    session?.user?.id,
    sportType,
  ]);

  const handleApplyFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  // Filter invitations by the currently selected sport
  const filteredInvitations = useMemo(() => {
    return invitations.filter((invitation) => {
      const invitationSport = (invitation.match?.sport || "").toUpperCase();
      return invitationSport === sportType;
    });
  }, [invitations, sportType]);

  const hasActiveFilters = Object.values(filters).some(Boolean);

  // Get filter button color based on selected sport filter
  const getFilterButtonColor = (): string => {
    if (!hasActiveFilters) return "#A04DFE";

    if (filters.sport) {
      const sportType = filters.sport.toUpperCase() as SportType;
      const colors = getSportColors(sportType);
      return colors.background;
    }

    return "#6B7280";
  };

  const filterButtonColor = getFilterButtonColor();

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      await axiosInstance.post(
        endpoints.match.respondToInvitation(invitationId),
        {
          accept: true,
        },
      );
      Alert.alert("Success", "Invitation accepted!");
      fetchPendingInvitations();
      fetchMyMatches();
    } catch (error) {
      console.error("Error accepting invitation:", error);
      Alert.alert("Error", "Failed to accept invitation");
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    Alert.alert(
      "Decline Invitation",
      "Are you sure you want to decline this invitation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: async () => {
            try {
              await axiosInstance.post(
                endpoints.match.respondToInvitation(invitationId),
                {
                  accept: false,
                  declineReason: "Not available",
                },
              );
              Alert.alert("Success", "Invitation declined");
              fetchPendingInvitations();
            } catch (error) {
              console.error("Error declining invitation:", error);
              Alert.alert("Error", "Failed to decline invitation");
            }
          },
        },
      ],
    );
  };

  const handleMatchPress = (match: Match) => {
    const matchTime = getMatchTime(match);

    router.push({
      pathname: "/match/match-details" as any,
      params: {
        matchId: match.id,
        matchType: match.matchType,
        date: formatMatchDate(matchTime),
        time: formatMatchTime(matchTime),
        location: match.location || "TBD",
        sportType: match.sport || sport,
        leagueName: match.isFriendly
          ? "Friendly Match"
          : match.division?.league?.name || "League Match",
        season: match.division?.season?.name || "Season",
        division: match.division?.name || "Division",
        status: match.status,
        participants: JSON.stringify(match.participants || []),
        divisionId: match.division?.id || "",
        seasonId: match.division?.season?.id || "",
        fee: match.fee || "",
        feeAmount: match.feeAmount?.toString() || "",
        description: match.notes || match.description || "",
        courtBooked: match.courtBooked ? "true" : "false",
        isFriendly: match.isFriendly ? "true" : "false",
        genderRestriction: match.genderRestriction || "",
        skillLevels: JSON.stringify(match.skillLevels || []),
      },
    });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>No matches found</Text>
      <Text style={styles.emptyText}>
        You haven't joined any matches yet. Start by browsing available matches
        or create your own!
      </Text>
    </View>
  );

  const renderEmptyInvitationsState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="mail-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>No pending invitations</Text>
      <Text style={styles.emptyText}>
        You don't have any pending match invitations at the moment.
      </Text>
    </View>
  );

  return (
    <View style={localStyles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={[
          "#FFFFFF",
          `${sportColors.background}79`,
          sportColors.background,
        ]}
        style={localStyles.headerGradient}
      >
        <View style={localStyles.headerContent}>
          {/* My Games Title */}
          <Text style={localStyles.title}>My Games</Text>

          {/* Filter Chips: All, League, Friendly, Invites */}
          <View style={localStyles.chipsContainer}>
            <AnimatedFilterChip
              label="All"
              isActive={activeTab === "ALL"}
              activeColor="#000000"
              onPress={() => setActiveTab("ALL")}
            />
            <AnimatedFilterChip
              label="League"
              isActive={activeTab === "LEAGUE"}
              activeColor="#FFA500"
              onPress={() => setActiveTab("LEAGUE")}
            />
            <AnimatedFilterChip
              label="Friendly"
              isActive={activeTab === "FRIENDLY"}
              activeColor="#83CFF9"
              onPress={() => setActiveTab("FRIENDLY")}
            />
            <AnimatedFilterChip
              label="Invites"
              isActive={activeTab === "INVITES"}
              activeColor="#A04DFE"
              onPress={() => setActiveTab("INVITES")}
            />
          </View>
        </View>
      </LinearGradient>

      {/* Upcoming/Past Tabs - Only show when not in INVITES mode */}
      <View style={localStyles.roundedContainer}>
        {activeTab !== "INVITES" && (
          <View style={localStyles.tabsContainer}>
            <TouchableOpacity
              style={[
                localStyles.tab,
                upcomingPastTab === "UPCOMING" && localStyles.activeTab,
              ]}
              onPress={() => setUpcomingPastTab("UPCOMING")}
            >
              <Text
                style={[
                  localStyles.tabText,
                  upcomingPastTab === "UPCOMING" && localStyles.activeTabText,
                ]}
              >
                Upcoming
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                localStyles.tab,
                upcomingPastTab === "PAST" && localStyles.activeTab,
              ]}
              onPress={() => setUpcomingPastTab("PAST")}
            >
              <Text
                style={[
                  localStyles.tabText,
                  upcomingPastTab === "PAST" && localStyles.activeTabText,
                ]}
              >
                Past
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Content wrapper */}
        <View style={styles.contentWrapper}>
          {/* Match List - Animated */}
          <Animated.View
            style={[
              styles.matchListWrapper,
              {
                opacity: contentEntryOpacity,
                transform: [{ translateY: contentEntryTranslateY }],
              },
            ]}
          >
            {/* Skeleton Loading - Only when new content detected */}
            {showSkeleton ? (
              <MatchCardSkeleton count={4} />
            ) : activeTab === "INVITES" ? (
              <FlatList
                data={filteredInvitations || []}
                keyExtractor={(item) => item?.id || Math.random().toString()}
                renderItem={({ item }) => {
                  if (!item) return null;
                  return (
                    <InvitationCard
                      invitation={item}
                      defaultSport={sport}
                      onAccept={handleAcceptInvitation}
                      onDecline={handleDeclineInvitation}
                    />
                  );
                }}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={renderEmptyInvitationsState}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={sportColors.background}
                  />
                }
              />
            ) : (
              <FlatList
                data={filteredMatches || []}
                renderItem={({ item }) => {
                  if (!item) return null;
                  return (
                    <MatchCard match={item} onPress={handleMatchPress} />
                  );
                }}
                keyExtractor={(item) => item?.id || Math.random().toString()}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={renderEmptyState}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={sportColors.background}
                  />
                }
              />
            )}
          </Animated.View>

          {/* Filter Bottom Sheet */}
          <FilterBottomSheet
            ref={filterBottomSheetRef}
            onClose={() => {}}
            onApply={handleApplyFilters}
            uniqueSports={uniqueSports}
            uniqueDivisions={uniqueDivisions}
            uniqueSeasons={uniqueSeasons}
            uniqueStatuses={uniqueStatuses}
            currentFilters={filters}
            sportColor={sportColors.background}
          />
        </View>
      </View>
    </View>
  );
}

// Local styles for this component
const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginBottom: 24,
    height: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1C1E",
    marginBottom: 12,
    marginTop: 24,
  },
  chipsContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  roundedContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -10,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "transparent",
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#4CAF50",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#9CA3AF",
  },
  activeTabText: {
    fontWeight: "600",
    color: "#1A1C1E",
  },
});
