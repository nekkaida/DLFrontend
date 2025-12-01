import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axiosInstance from '@/lib/endpoints';
import { format } from 'date-fns';
import { getSportColors, SportType } from '@/constants/sportColors';

interface Match {
  id: string;
  matchType: 'SINGLES' | 'DOUBLES';
  status: string;
  scheduledTime: string;
  location?: string;
  venue?: string;
  courtBooked?: boolean;
  participants: Array<{
    user: {
      id: string;
      name: string;
      image?: string;
    };
    role: string;
    team?: string;
  }>;
  division?: {
    id: string;
    name: string;
    season?: {
      id: string;
      name: string;
      startDate?: string;
      endDate?: string;
    };
  };
}

export default function AllMatchesScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'full'>('all');
  
  // Get params from navigation
  const divisionId = params.divisionId as string;
  const sportType = (params.sportType as string) as SportType;
  const leagueName = (params.leagueName as string) || 'League';
  const seasonName = (params.seasonName as string) || 'Season 1 (2025)';

  useEffect(() => {
    if (divisionId) {
      fetchMatches();
    }
  }, [divisionId]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/match/available/${divisionId}`);
      console.log('📥 Matches fetched:', response.data);
      
      // Handle different response structures
      const matchesData = response.data?.data || response.data || [];
      setMatches(Array.isArray(matchesData) ? matchesData : []);
    } catch (error) {
      console.error('❌ Error fetching matches:', error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const groupMatchesByDate = (matches: Match[]) => {
    const grouped: { [key: string]: Match[] } = {};
    
    if (!Array.isArray(matches)) {
      console.warn('⚠️ Matches is not an array:', matches);
      return grouped;
    }
    
    matches.forEach((match) => {
      if (!match.scheduledTime) return;
      
      const date = new Date(match.scheduledTime);
      const dateKey = format(date, 'EEEE, d MMMM yyyy');
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(match);
    });
    
    return grouped;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return '#F59E0B';
      case 'completed':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const renderMatchCard = (match: Match) => {
    const team1Participants = match.participants.filter(p => p.team === 'team1');
    const team2Participants = match.participants.filter(p => p.team === 'team2');
    
    // For singles, just split by index
    const player1 = team1Participants[0] || match.participants[0];
    const player2 = team2Participants[0] || match.participants[1];

    const formatTime = (dateString: string) => {
      const date = new Date(dateString);
      return format(date, 'h:mm a');
    };

    const calculateEndTime = (startDate: string) => {
      const date = new Date(startDate);
      date.setHours(date.getHours() + 2); // Assuming 2 hour duration
      return format(date, 'h:mm a');
    };

    return (
      <View key={match.id} style={styles.matchCard}>
        {/* Players Row */}
        <View style={styles.playersRow}>
          {/* Player 1 */}
          <View style={styles.playerSection}>
            <View style={styles.playerAvatar}>
              {player1?.user?.image ? (
                <Image source={{ uri: player1.user.image }} style={styles.avatarImage} />
              ) : (
                <View style={styles.defaultAvatar}>
                  <Text style={styles.defaultAvatarText}>
                    {player1?.user?.name?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.playerName} numberOfLines={1}>
              {player1?.user?.name || 'Unknown'}
            </Text>
          </View>

          {/* VS Divider */}
          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>1 set left</Text>
          </View>

          {/* Player 2 */}
          <View style={styles.playerSection}>
            <View style={styles.playerAvatar}>
              {player2?.user?.image ? (
                <Image source={{ uri: player2.user.image }} style={styles.avatarImage} />
              ) : (
                <View style={styles.defaultAvatar}>
                  <Text style={styles.defaultAvatarText}>
                    {player2?.user?.name?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.playerName} numberOfLines={1}>
              {player2?.user?.name || 'Unknown'}
            </Text>
          </View>
        </View>

        {/* Match Details */}
        <View style={styles.matchDetails}>
          <Text style={styles.matchTitle}>
            {match.matchType === 'DOUBLES' ? 'Doubles' : 'Singles'} League Match
          </Text>
          <Text style={styles.matchTime}>
            {formatTime(match.scheduledTime)} - {calculateEndTime(match.scheduledTime)}, {format(new Date(match.scheduledTime), 'd MMMM yyyy')}
          </Text>
          <Text style={styles.matchLocation}>
            {match.location || match.venue || 'Padela Nayan'}
          </Text>
          <Text style={styles.matchFee}>Split • INR/00 per player</Text>
        </View>

        {/* Status Badge */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(match.status) }]}>
            <Text style={styles.statusText}>{match.status}</Text>
          </View>
          {match.courtBooked && (
            <View style={styles.courtBookedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              <Text style={styles.courtBookedText}>Court booked</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const groupedMatches = groupMatchesByDate(matches);
  const sportColors = getSportColors(sportType);
  
  // Get season dates from first match if available
  const seasonStartDate = matches[0]?.division?.season?.startDate 
    ? format(new Date(matches[0].division.season.startDate), 'd MMMM yyyy')
    : '1 February 2025';
  const seasonEndDate = matches[0]?.division?.season?.endDate
    ? format(new Date(matches[0].division.season.endDate), 'd MMMM yyyy')
    : '1 April 2025';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: sportColors.badgeColor }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.seasonTitle}>{seasonName}</Text>
            <Text style={styles.leagueTitle}>{leagueName}</Text>
            <View style={styles.dateRange}>
              <Text style={styles.dateText}>Start date: {seasonStartDate}</Text>
              <Text style={styles.dateText}>End date: {seasonEndDate}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Matches Section */}
      <View style={styles.matchesSection}>
        <Text style={styles.matchesLabel}>Matches</Text>
        <View style={styles.matchesControls}>
          <View style={styles.tabButtons}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]}
              onPress={() => setActiveTab('all')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'all' && styles.tabButtonTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'open' && styles.tabButtonActive]}
              onPress={() => setActiveTab('open')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'open' && styles.tabButtonTextActive]}>
                Open
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'full' && styles.tabButtonActive]}
              onPress={() => setActiveTab('full')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'full' && styles.tabButtonTextActive]}>
                Full
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="filter-outline" size={20} color="#F59E0B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={sportColors.background} />
          <Text style={styles.loadingText}>Loading matches...</Text>
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No matches found</Text>
          <Text style={styles.emptyDescription}>Check back later for upcoming matches</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {Object.entries(groupedMatches).map(([dateKey, dateMatches]) => (
            <View key={dateKey} style={styles.dateSection}>
              <View style={styles.dateDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dateLabel}>{dateKey}</Text>
                <View style={styles.dividerLine} />
              </View>
              {dateMatches.map(renderMatchCard)}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
    marginTop: 4,
  },
  headerContent: {
    flex: 1,
  },
  seasonTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  leagueTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 6,
  },
  dateRange: {
    flexDirection: 'row',
    gap: 24,
  },
  dateText: {
    fontSize: 11,
    color: '#6B7280',
  },
  matchesSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  matchesLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  matchesControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabButtons: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    padding: 3,
    gap: 4,
  },
  tabButton: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 18,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabButtonTextActive: {
    color: '#111827',
  },
  filterButton: {
    padding: 6,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  dateSection: {
    marginBottom: 16,
  },
  dateDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  playerSection: {
    alignItems: 'center',
    flex: 1,
  },
  playerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 8,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  defaultAvatar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  playerName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  vsContainer: {
    paddingHorizontal: 16,
  },
  vsText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  matchDetails: {
    marginBottom: 12,
  },
  matchTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  matchTime: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  matchLocation: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  matchFee: {
    fontSize: 13,
    color: '#6B7280',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  courtBookedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
  },
  courtBookedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
});
