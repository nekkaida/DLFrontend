import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Dimensions,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSession } from '@/lib/auth-client';
import { getBackendBaseURL } from '@/src/config/network';
import { getSportColors, SportType } from '@/constants/SportsColor';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

interface Match {
  id: string;
  matchType: string;
  status: string;
  scheduledTime?: string;
  scheduledStartTime?: string;
  location?: string;
  sport: string;
  division?: {
    id: string;
    name: string;
    season?: {
      name: string;
    };
    league?: {
      name: string;
      sportType: string;
    };
  };
  participants: Array<{
    userId: string;
    role: string;
    invitationStatus: string;
    user: {
      id: string;
      name: string;
      image?: string;
    };
  }>;
}

interface MyGamesScreenProps {
  sport?: 'pickleball' | 'tennis' | 'padel';
}

type FilterTab = 'ALL' | 'UPCOMING' | 'PAST';

export default function MyGamesScreen({ sport = 'pickleball' }: MyGamesScreenProps) {
  const { data: session } = useSession();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);

  const fetchMyMatches = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const backendUrl = getBackendBaseURL();
      const response = await fetch(`${backendUrl}/api/match/my`, {
        headers: {
          'x-user-id': session.user.id,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const matchesData = data.matches || data.data || data;
        setMatches(Array.isArray(matchesData) ? matchesData : []);
      } else {
        console.error('Failed to fetch matches:', response.status);
        setMatches([]);
      }
    } catch (error) {
      console.error('Error fetching my matches:', error);
      setMatches([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchMyMatches();
  }, [fetchMyMatches]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyMatches();
  };

  // Extract unique values for filters
  const uniqueSports = useMemo(() => {
    const sports = new Set(matches.map(m => m.sport || m.division?.league?.sportType).filter(Boolean));
    return Array.from(sports);
  }, [matches]);

  const uniqueDivisions = useMemo(() => {
    const divisions = new Set(matches.map(m => m.division?.name).filter(Boolean));
    return Array.from(divisions);
  }, [matches]);

  const uniqueSeasons = useMemo(() => {
    const seasons = new Set(matches.map(m => m.division?.season?.name).filter(Boolean));
    return Array.from(seasons);
  }, [matches]);

  // Filter matches based on all criteria
  const filteredMatches = useMemo(() => {
    let filtered = [...matches];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(match => 
        match.division?.league?.name?.toLowerCase().includes(query) ||
        match.location?.toLowerCase().includes(query) ||
        match.division?.name?.toLowerCase().includes(query) ||
        match.division?.season?.name?.toLowerCase().includes(query)
      );
    }

    // Filter by tab (status)
    if (activeTab === 'UPCOMING') {
      filtered = filtered.filter(m => 
        ['OPEN', 'SCHEDULED', 'ONGOING', 'IN_PROGRESS'].includes(m.status.toUpperCase())
      );
    } else if (activeTab === 'PAST') {
      filtered = filtered.filter(m => 
        ['COMPLETED', 'FINISHED', 'CANCELLED'].includes(m.status.toUpperCase())
      );
    }

    // Filter by sport
    if (selectedSport) {
      filtered = filtered.filter(m => 
        (m.sport || m.division?.league?.sportType) === selectedSport
      );
    }

    // Filter by division
    if (selectedDivision) {
      filtered = filtered.filter(m => m.division?.name === selectedDivision);
    }

    // Filter by season
    if (selectedSeason) {
      filtered = filtered.filter(m => m.division?.season?.name === selectedSeason);
    }

    return filtered;
  }, [matches, searchQuery, activeTab, selectedSport, selectedDivision, selectedSeason]);

  // Clear all advanced filters
  const clearAdvancedFilters = () => {
    setSelectedSport(null);
    setSelectedDivision(null);
    setSelectedSeason(null);
  };

  // Check if any advanced filter is active
  const hasActiveFilters = selectedSport || selectedDivision || selectedSeason;

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SCHEDULED':
        return { bg: '#FEF3C7', text: '#92400E', label: 'Scheduled' };
      case 'ONGOING':
      case 'IN_PROGRESS':
        return { bg: '#D1FAE5', text: '#065F46', label: 'Ongoing' };
      case 'COMPLETED':
      case 'FINISHED':
        return { bg: '#E5E7EB', text: '#374151', label: 'Completed' };
      case 'CANCELLED':
        return { bg: '#FEE2E2', text: '#991B1B', label: 'Cancelled' };
      default:
        return { bg: '#DBEAFE', text: '#1E40AF', label: 'Open' };
    }
  };

  const formatMatchDate = (dateString?: string) => {
    if (!dateString) return 'TBD';
    try {
      // Parse the date from backend (already in Malaysia time)
      const date = new Date(dateString);
      return format(date, 'MMM dd, yyyy');
    } catch {
      return 'TBD';
    }
  };

  const formatMatchTime = (dateString?: string) => {
    if (!dateString) return '';
    try {
      // Parse the time from backend (already in Malaysia time)
      const date = new Date(dateString);
      return format(date, 'h:mm a');
    } catch {
      return '';
    }
  };

  const handleMatchPress = (match: Match) => {
    const sportColors = getSportColors((match.sport || sport) as SportType);
    
    // Use scheduledStartTime if available, fallback to scheduledTime
    const matchTime = match.scheduledStartTime || match.scheduledTime;
    
    // Navigate to match details
    router.push({
      pathname: '/match/match-details' as any,
      params: {
        matchId: match.id,
        matchType: match.matchType,
        date: formatMatchDate(matchTime),
        time: formatMatchTime(matchTime),
        location: match.location || 'TBD',
        sportType: match.sport || sport,
        leagueName: match.division?.league?.name || 'League Match',
        season: match.division?.season?.name || 'Season',
        division: match.division?.name || 'Division',
        status: match.status,
        participants: JSON.stringify(match.participants || []),
        divisionId: match.division?.id || '',
        seasonId: match.division?.season?.name || '',
      },
    });
  };

  const renderParticipants = (participants: Match['participants']) => {
    const acceptedParticipants = participants.filter(p => p.invitationStatus === 'ACCEPTED');
    const displayParticipants = acceptedParticipants.slice(0, 3);
    const remaining = acceptedParticipants.length - 3;

    return (
      <View style={styles.participantsContainer}>
        {displayParticipants.map((participant, index) => (
          <View
            key={participant.userId}
            style={[
              styles.participantAvatar,
              index > 0 && styles.participantAvatarOverlap,
            ]}
          >
            {participant.user.image ? (
              <Image
                source={{ uri: participant.user.image }}
                style={styles.participantImage}
              />
            ) : (
              <View style={styles.defaultParticipantAvatar}>
                <Text style={styles.defaultParticipantText}>
                  {participant.user.name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </View>
        ))}
        {remaining > 0 && (
          <View style={[styles.participantAvatar, styles.participantAvatarOverlap, styles.remainingBadge]}>
            <Text style={styles.remainingText}>+{remaining}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderMatchCard = ({ item }: { item: Match }) => {
    const statusInfo = getStatusColor(item.status);
    const sportColors = getSportColors((item.sport || sport) as SportType);

    return (
      <TouchableOpacity
        style={styles.matchCard}
        onPress={() => handleMatchPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.matchCardHeader}>
          <View style={styles.matchCardHeaderLeft}>
            <Text style={styles.matchType}>
              {item.matchType === 'DOUBLES' ? 'Doubles' : 'Singles'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
              <Text style={[styles.statusText, { color: statusInfo.text }]}>
                {statusInfo.label}
              </Text>
            </View>
          </View>
          <View style={[styles.sportBadge, { backgroundColor: sportColors.background }]}>
            <Text style={[styles.sportBadgeText, { color: '#FFFFFF' }]}>
              {sportColors.label}
            </Text>
          </View>
        </View>

        <View style={styles.matchCardBody}>
          <View style={styles.matchInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>
                {formatMatchDate(item.scheduledStartTime || item.scheduledTime)}
                {(item.scheduledStartTime || item.scheduledTime) && ` • ${formatMatchTime(item.scheduledStartTime || item.scheduledTime)}`}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>{item.location || 'TBD'}</Text>
            </View>
            {item.division && (
              <View style={styles.infoRow}>
                <Ionicons name="trophy-outline" size={16} color="#6B7280" />
                <Text style={styles.infoText} numberOfLines={1}>
                  {item.division.league?.name} - {item.division.name}
                </Text>
              </View>
            )}
          </View>

          {renderParticipants(item.participants)}
        </View>

        <View style={styles.matchCardFooter}>
          <Text style={styles.viewDetailsText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color="#6B7280" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No Matches Yet</Text>
      <Text style={styles.emptyText}>
        You haven't joined any matches yet. Start by browsing available matches or create your own!
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#863A73" />
        <Text style={styles.loadingText}>Loading your matches...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search matches, leagues, or locations..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Filter Button */}
        <TouchableOpacity 
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter" size={20} color={hasActiveFilters ? "#FFFFFF" : "#4B5563"} />
          {hasActiveFilters && <View style={styles.filterBadge} />}
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'ALL' && styles.tabActive]}
          onPress={() => setActiveTab('ALL')}
        >
          <Text style={[styles.tabText, activeTab === 'ALL' && styles.tabTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'UPCOMING' && styles.tabActive]}
          onPress={() => setActiveTab('UPCOMING')}
        >
          <Text style={[styles.tabText, activeTab === 'UPCOMING' && styles.tabTextActive]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'PAST' && styles.tabActive]}
          onPress={() => setActiveTab('PAST')}
        >
          <Text style={[styles.tabText, activeTab === 'PAST' && styles.tabTextActive]}>
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {/* Matches List */}
      <FlatList
        data={filteredMatches}
        renderItem={renderMatchCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Matches</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Sport Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Sport</Text>
                <View style={styles.filterOptions}>
                  {uniqueSports.map((sportName) => (
                    <TouchableOpacity
                      key={sportName}
                      style={[
                        styles.filterOption,
                        selectedSport === sportName && styles.filterOptionActive
                      ]}
                      onPress={() => setSelectedSport(selectedSport === sportName ? null : sportName)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        selectedSport === sportName && styles.filterOptionTextActive
                      ]}>
                        {sportName}
                      </Text>
                      {selectedSport === sportName && (
                        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Division Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Division</Text>
                <View style={styles.filterOptions}>
                  {uniqueDivisions.map((division) => (
                    <TouchableOpacity
                      key={division}
                      style={[
                        styles.filterOption,
                        selectedDivision === division && styles.filterOptionActive
                      ]}
                      onPress={() => setSelectedDivision(selectedDivision === division ? null : division)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        selectedDivision === division && styles.filterOptionTextActive
                      ]}>
                        {division}
                      </Text>
                      {selectedDivision === division && (
                        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Season Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Season</Text>
                <View style={styles.filterOptions}>
                  {uniqueSeasons.map((season) => (
                    <TouchableOpacity
                      key={season}
                      style={[
                        styles.filterOption,
                        selectedSeason === season && styles.filterOptionActive
                      ]}
                      onPress={() => setSelectedSeason(selectedSeason === season ? null : season)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        selectedSeason === season && styles.filterOptionTextActive
                      ]}>
                        {season}
                      </Text>
                      {selectedSeason === season && (
                        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={clearAdvancedFilters}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: isSmallScreen ? 16 : 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#863A73',
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: isSmallScreen ? 16 : 20,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#863A73',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  listContent: {
    padding: isSmallScreen ? 16 : 20,
    paddingBottom: 100,
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: isSmallScreen ? 16 : 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  matchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  matchCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  matchType: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sportBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sportBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  matchCardBody: {
    marginBottom: 16,
  },
  matchInfo: {
    marginBottom: 16,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  participantAvatarOverlap: {
    marginLeft: -12,
  },
  participantImage: {
    width: '100%',
    height: '100%',
  },
  defaultParticipantAvatar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#6de9a0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultParticipantText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  remainingBadge: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  matchCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  filterOptionActive: {
    backgroundColor: '#863A73',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#863A73',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
