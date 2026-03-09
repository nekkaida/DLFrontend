import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { getSportColors, SportType } from '@/constants/SportsColor';
import axiosInstance from '@/lib/endpoints';
import BackButtonIcon from '@/assets/icons/back-button.svg';
import { scale, verticalScale, moderateScale } from '@/core/utils/responsive';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isTablet = width > 768;

interface DivisionData {
  id: string;
  name: string;
  gameType: string;
  genderCategory: string;
  season?: {
    id: string;
    name: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  };
  league?: {
    id: string;
    name: string;
  };
  _count?: {
    memberships: number;
    matches: number;
  };
  memberships?: Array<{
    id: string;
    userId: string;
    user?: {
      id: string;
      name: string;
      image?: string;
    };
  }>;
}

export default function GroupInfoScreen() {
  const params = useLocalSearchParams();
  const {
    threadId,
    divisionId,
    divisionName,
    sportType,
    leagueName,
    seasonName,
    gameType,
    genderCategory,
  } = params as {
    threadId: string;
    divisionId: string;
    divisionName: string;
    sportType: string;
    leagueName: string;
    seasonName: string;
    gameType: string;
    genderCategory: string;
  };

  const [division, setDivision] = useState<DivisionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  // Entry animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(30)).current;
  const hasPlayedAnimation = useRef(false);

  const sportColors = getSportColors((sportType || 'PICKLEBALL').toUpperCase() as SportType);

  useEffect(() => {
    fetchDivisionData();
  }, [divisionId]);

  useEffect(() => {
    if (!isLoading && !hasPlayedAnimation.current) {
      hasPlayedAnimation.current = true;
      Animated.stagger(80, [
        Animated.parallel([
          Animated.spring(headerOpacity, {
            toValue: 1,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(headerTranslateY, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.spring(contentOpacity, {
            toValue: 1,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(contentTranslateY, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [isLoading]);

  const fetchDivisionData = async () => {
    if (!divisionId) {
      setError('Division ID not provided');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await axiosInstance.get(`/api/division/${divisionId}`);
      const data = response.data?.data ?? response.data;
      setDivision(data);
    } catch (err) {
      console.error('Error fetching division:', err);
      setError('Failed to load group info');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getGameTypeLabel = (type?: string) => {
    if (!type) return gameType || 'Unknown';
    switch (type.toUpperCase()) {
      case 'SINGLES': return 'Singles';
      case 'DOUBLES': return 'Doubles';
      default: return type;
    }
  };

  const getGenderLabel = (gender?: string) => {
    if (!gender) return genderCategory || 'Open';
    switch (gender.toUpperCase()) {
      case 'MALE': case 'MEN': return "Men's";
      case 'FEMALE': case 'WOMEN': return "Women's";
      case 'MIXED': return 'Mixed';
      case 'OPEN': return 'Open';
      default: return gender;
    }
  };

  const renderMemberAvatars = () => {
    const members = division?.memberships?.slice(0, 8) || [];
    if (members.length === 0) return null;

    return (
      <View style={styles.avatarsContainer}>
        {members.map((member, index) => (
          <View
            key={member.id}
            style={[
              styles.avatarWrapper,
              index > 0 && { marginLeft: -12 },
            ]}
          >
            {member.user?.image ? (
              <Image source={{ uri: member.user.image }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {member.user?.name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </View>
        ))}
        {(division?._count?.memberships || 0) > 8 && (
          <View style={[styles.avatarWrapper, { marginLeft: -12 }]}>
            <View style={[styles.avatar, styles.avatarMore]}>
              <Text style={styles.avatarMoreText}>
                +{(division?._count?.memberships || 0) - 8}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={[sportColors.background, sportColors.buttonColor]}
          style={[styles.header, { paddingTop: insets.top }]}
        >
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <BackButtonIcon width={24} height={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Group Info</Text>
          <View style={styles.headerSpacer} />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={sportColors.background} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={[sportColors.background, sportColors.buttonColor]}
          style={[styles.header, { paddingTop: insets.top }]}
        >
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <BackButtonIcon width={24} height={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Group Info</Text>
          <View style={styles.headerSpacer} />
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>{error}</Text>
          <TouchableOpacity
            onPress={fetchDivisionData}
            style={[styles.retryButton, { backgroundColor: sportColors.background }]}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <Animated.View
        style={{
          opacity: headerOpacity,
          transform: [{ translateY: headerTranslateY }],
        }}
      >
        <LinearGradient
          colors={[sportColors.background, sportColors.buttonColor]}
          style={[styles.header, { paddingTop: insets.top }]}
        >
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <BackButtonIcon width={24} height={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Group Info</Text>
          <View style={styles.headerSpacer} />
        </LinearGradient>
      </Animated.View>

      {/* Content */}
      <Animated.ScrollView
        style={{
          opacity: contentOpacity,
          transform: [{ translateY: contentTranslateY }],
        }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Division Name Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: sportColors.background + '20' }]}>
              <Ionicons name="people" size={24} color={sportColors.background} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.divisionName}>{division?.name || divisionName}</Text>
              <Text style={styles.cardSubtitle}>
                {getGenderLabel(division?.genderCategory)} {getGameTypeLabel(division?.gameType)}
              </Text>
            </View>
          </View>
        </View>

        {/* League & Season Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>League & Season</Text>
          <View style={styles.infoRow}>
            <Ionicons name="trophy-outline" size={20} color="#6B7280" />
            <Text style={styles.infoLabel}>League</Text>
            <Text style={styles.infoValue}>{division?.league?.name || leagueName || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            <Text style={styles.infoLabel}>Season</Text>
            <Text style={styles.infoValue}>{division?.season?.name || seasonName || 'N/A'}</Text>
          </View>
          {division?.season?.startDate && (
            <View style={styles.infoRow}>
              <Ionicons name="play-outline" size={20} color="#6B7280" />
              <Text style={styles.infoLabel}>Start Date</Text>
              <Text style={styles.infoValue}>{formatDate(division.season.startDate)}</Text>
            </View>
          )}
          {division?.season?.endDate && (
            <View style={styles.infoRow}>
              <Ionicons name="flag-outline" size={20} color="#6B7280" />
              <Text style={styles.infoLabel}>End Date</Text>
              <Text style={styles.infoValue}>{formatDate(division.season.endDate)}</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: sportColors.background + '20' }]}>
                <Ionicons name="people" size={24} color={sportColors.background} />
              </View>
              <Text style={styles.statValue}>{division?._count?.memberships || 0}</Text>
              <Text style={styles.statLabel}>Players</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FEA04D20' }]}>
                <Ionicons name="tennisball" size={24} color="#FEA04D" />
              </View>
              <Text style={styles.statValue}>{division?._count?.matches || 0}</Text>
              <Text style={styles.statLabel}>Matches</Text>
            </View>
          </View>
        </View>

        {/* Members Preview */}
        {division?.memberships && division.memberships.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Members</Text>
            {renderMemberAvatars()}
            <Text style={styles.membersCount}>
              {division?._count?.memberships || division.memberships.length} players in this division
            </Text>
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(16),
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    flex: 1,
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSpacer: {
    width: scale(40),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(40),
  },
  errorTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#1F2937',
    marginTop: verticalScale(16),
    marginBottom: verticalScale(24),
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(8),
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  scrollContent: {
    padding: scale(16),
    paddingBottom: verticalScale(40),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: scale(16),
    marginBottom: verticalScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: scale(48),
    height: scale(48),
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: scale(12),
  },
  divisionName: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#1F2937',
  },
  cardSubtitle: {
    fontSize: moderateScale(14),
    color: '#6B7280',
    marginTop: verticalScale(2),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: verticalScale(16),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: moderateScale(14),
    color: '#6B7280',
    marginLeft: scale(12),
    flex: 1,
  },
  infoValue: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#1F2937',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statIconContainer: {
    width: scale(56),
    height: scale(56),
    borderRadius: moderateScale(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  statValue: {
    fontSize: moderateScale(24),
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: moderateScale(12),
    color: '#6B7280',
    marginTop: verticalScale(2),
  },
  avatarsContainer: {
    flexDirection: 'row',
    marginBottom: verticalScale(12),
  },
  avatarWrapper: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: moderateScale(20),
  },
  avatar: {
    width: scale(36),
    height: scale(36),
    borderRadius: moderateScale(18),
  },
  avatarPlaceholder: {
    backgroundColor: '#6de9a0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  avatarMore: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMoreText: {
    color: '#6B7280',
    fontSize: moderateScale(11),
    fontWeight: '600',
  },
  membersCount: {
    fontSize: moderateScale(13),
    color: '#6B7280',
  },
});
