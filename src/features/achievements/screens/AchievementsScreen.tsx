import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { theme } from '@core/theme/theme';
import { authClient, useSession } from '@/lib/auth-client';
import { getBackendBaseURL } from '@/config/network';
import { toast } from 'sonner-native';
import { AchievementCard } from '../components/AchievementCard';
import { AchievementUnlockSheet } from '../components/AchievementUnlockSheet';
import { useAchievementSocket } from '../hooks/useAchievementSocket';
import type { AchievementData } from '../components/AchievementCard';
import type { AchievementUnlockPayload, AchievementRevokedPayload } from '../hooks/useAchievementSocket';

const CATEGORIES = [
  { key: 'ALL', label: 'All' },
  { key: 'MATCH_COUNTER', label: 'Matches' },
  { key: 'LEAGUE_SEASON', label: 'Seasons' },
  { key: 'WINNING', label: 'Winning' },
  { key: 'MULTI_SPORT', label: 'Multi-Sport' },
  { key: 'MATCH_STREAK', label: 'Streak' },
];

interface AchievementsResponse {
  achievements: AchievementData[];
  completedCount: number;
  totalCount: number;
  totalPoints: number;
}

export default function AchievementsScreen() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [achievements, setAchievements] = useState<AchievementData[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Achievement unlock state
  const [pendingUnlocks, setPendingUnlocks] = useState<AchievementData[]>([]);
  const [showUnlockSheet, setShowUnlockSheet] = useState(false);
  const needsAchievementRefresh = useRef(false);

  // Listen for real-time achievement unlocks via socket
  const handleAchievementUnlock = useCallback((payload: AchievementUnlockPayload) => {
    const unlockData: AchievementData = {
      id: payload.achievementId,
      title: payload.title,
      description: payload.description,
      icon: payload.icon,
      tier: payload.tier,
      category: payload.category,
      scope: '',
      threshold: 1,
      sportFilter: null,
      gameTypeFilter: null,
      sortOrder: 0,
      isHidden: false,
      points: payload.points,
      progress: 1,
      isCompleted: true,
      unlockedAt: new Date().toISOString(),
    };
    setPendingUnlocks((prev) => [...prev, unlockData]);
    setShowUnlockSheet(true);
    // Flag for refresh on next render cycle
    needsAchievementRefresh.current = true;
  }, []);

  const fetchAchievements = useCallback(async () => {
    try {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }

      const backendUrl = getBackendBaseURL();
      const response = await authClient.$fetch(
        `${backendUrl}/api/player/profile/achievements`,
        { method: 'GET' }
      );

      const raw = response as any;
      const payload = raw?.data?.data ?? raw?.data ?? raw;
      if (payload?.achievements) {
        setAchievements(payload.achievements || []);
        setCompletedCount(payload.completedCount || 0);
        setTotalCount(payload.totalCount || 0);
        setTotalPoints(payload.totalPoints || 0);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
      toast.error('Error', {
        description: 'Failed to load achievements. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // Handle revoked achievements (e.g., match streak broken)
  const handleAchievementRevoked = useCallback((_payload: AchievementRevokedPayload) => {
    needsAchievementRefresh.current = true;
    fetchAchievements();
  }, [fetchAchievements]);

  useAchievementSocket(handleAchievementUnlock, handleAchievementRevoked);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  // Refresh achievements when socket event triggers
  useEffect(() => {
    if (needsAchievementRefresh.current) {
      needsAchievementRefresh.current = false;
      fetchAchievements();
    }
  }, [showUnlockSheet, fetchAchievements]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const minDelay = new Promise((resolve) => setTimeout(resolve, 600));
    await Promise.all([fetchAchievements(), minDelay]);
    setRefreshing(false);
  }, [fetchAchievements]);

  // Apply badge grouping: for badgeGroup achievements, show only the highest unlocked tier
  // (or lowest tier if none unlocked). For match_streak, hide entirely if no tier completed.
  const groupedAchievements = React.useMemo(() => {
    const groups = new Map<string, AchievementData[]>();
    const ungrouped: AchievementData[] = [];

    for (const a of achievements) {
      if (a.badgeGroup) {
        const group = groups.get(a.badgeGroup) || [];
        group.push(a);
        groups.set(a.badgeGroup, group);
      } else {
        ungrouped.push(a);
      }
    }

    const result: AchievementData[] = [...ungrouped];

    for (const [groupKey, items] of groups) {
      // Sort by threshold ascending so tier order is correct
      items.sort((a, b) => a.threshold - b.threshold);

      const completed = items.filter(i => i.isCompleted);
      if (completed.length > 0) {
        // Show the highest completed tier
        result.push(completed[completed.length - 1]);
      } else if (groupKey === 'match_streak') {
        // Match streak: hide entirely when no tier is completed (streak broken)
        continue;
      } else {
        // Show the lowest tier (locked)
        result.push(items[0]);
      }
    }

    return result;
  }, [achievements]);

  // Filter achievements by category
  const filteredAchievements = React.useMemo(
    () =>
      selectedCategory === 'ALL'
        ? groupedAchievements
        : groupedAchievements.filter((a) => a.category === selectedCategory),
    [groupedAchievements, selectedCategory]
  );

  // Sort: completed first (by unlockedAt desc), then locked (by sortOrder)
  const sortedAchievements = React.useMemo(
    () =>
      [...filteredAchievements].sort((a, b) => {
        if (a.isCompleted && !b.isCompleted) return -1;
        if (!a.isCompleted && b.isCompleted) return 1;
        if (a.isCompleted && b.isCompleted) {
          const dateA = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
          const dateB = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;
          return dateB - dateA;
        }
        return a.sortOrder - b.sortOrder;
      }),
    [filteredAchievements]
  );

  const progressPercent =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/profile');
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: AchievementData }) => (
      <AchievementCard achievement={item} />
    ),
    []
  );

  const keyExtractor = useCallback((item: AchievementData) => item.id, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading achievements...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </Pressable>
        <Text style={styles.headerTitle}>Achievements</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>
            {completedCount} of {totalCount} unlocked
          </Text>
          {totalPoints > 0 && (
            <Text style={styles.pointsText}>{totalPoints} pts</Text>
          )}
        </View>
        <View style={styles.summaryProgressTrack}>
          <View
            style={[
              styles.summaryProgressFill,
              { width: `${progressPercent}%` },
            ]}
          />
        </View>
      </View>

      {/* Category filter chips */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <Pressable
                key={cat.key}
                style={[
                  styles.filterChip,
                  isActive && styles.filterChipActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedCategory(cat.key);
                }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Grid */}
      <FlatList
        data={sortedAchievements}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        contentContainerStyle={[
          styles.gridContent,
          sortedAchievements.length === 0 && styles.emptyGridContent,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="trophy-outline"
              size={64}
              color={theme.colors.neutral.gray[300]}
            />
            <Text style={styles.emptyTitle}>No Achievements</Text>
            <Text style={styles.emptyText}>
              No achievements found in this category.
            </Text>
          </View>
        }
      />

      {/* Achievement Unlock Celebration Sheet */}
      <AchievementUnlockSheet
        achievements={pendingUnlocks}
        visible={showUnlockSheet}
        onDismiss={() => {
          setShowUnlockSheet(false);
          setPendingUnlocks([]);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.neutral.gray[600],
    fontFamily: theme.typography.fontFamily.primary,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    fontFamily: theme.typography.fontFamily.primary,
  },
  headerSpacer: {
    width: 40,
  },
  summaryBar: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    fontFamily: theme.typography.fontFamily.primary,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FE9F4D',
    fontFamily: theme.typography.fontFamily.primary,
  },
  summaryProgressTrack: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  summaryProgressFill: {
    height: '100%',
    backgroundColor: '#FE9F4D',
    borderRadius: 2,
  },
  filterContainer: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  filterChipActive: {
    backgroundColor: '#FE9F4D',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.neutral.gray[600],
    fontFamily: theme.typography.fontFamily.primary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  gridContent: {
    padding: 12,
    paddingBottom: 40,
  },
  emptyGridContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.neutral.gray[700],
    marginTop: 16,
    marginBottom: 8,
    fontFamily: theme.typography.fontFamily.primary,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.neutral.gray[600],
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.primary,
  },
});
