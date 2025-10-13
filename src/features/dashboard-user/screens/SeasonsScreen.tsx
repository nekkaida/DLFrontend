import React from 'react';
import { ScrollView, Text, View, StyleSheet, Dimensions, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { NavBar } from '@/shared/components/layout';
import { SportDropdownHeader } from '@/shared/components/ui/SportDropdownHeader';
import * as Haptics from 'expo-haptics';
import CalendarIcon from '@/assets/icons/calendar-icon.svg';
import ClockIcon from '@/assets/icons/clock-icon.svg';
import DollarSignIcon from '@/assets/icons/dollarsign-icon.svg';
import { SeasonService, Season } from '@/src/features/dashboard-user/services/SeasonService';

const { width, height } = Dimensions.get('window');

interface SeasonsScreenProps {
  category?: string;
  categoryId?: string;
  leagueId?: string;
  leagueName?: string;
  sport?: 'pickleball' | 'tennis';
}

export default function SeasonsScreen({ 
  category = 'Men\'s Single',
  categoryId,
  leagueId,
  leagueName = 'PJ League',
  sport = 'pickleball'
}: SeasonsScreenProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = React.useState(0); // 0: In Progress, 1: Upcoming, 2: Past
  const [seasons, setSeasons] = React.useState<Season[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    console.log('SeasonsScreen loaded successfully!');
    console.log('Category:', category, 'League:', leagueName, 'Sport:', sport);
    console.log('CategoryId:', categoryId, 'LeagueId:', leagueId);
    
    // Fetch seasons if we have the necessary IDs
    if (categoryId || leagueId) {
      fetchSeasons();
    } else {
      setIsLoading(false);
    }
  }, [category, leagueName, sport, categoryId, leagueId]);

  const fetchSeasons = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching seasons...');
      
      let fetchedSeasons: Season[] = [];
      
      if (categoryId) {
        // Fetch seasons for specific category
        fetchedSeasons = await SeasonService.fetchSeasonsByCategory(categoryId);
        console.log('Fetched seasons by category:', fetchedSeasons);
      } else if (leagueId) {
        // Fetch seasons for specific league
        fetchedSeasons = await SeasonService.fetchSeasonsByLeague(leagueId);
        console.log('Fetched seasons by league:', fetchedSeasons);
      } else {
        // Fetch all seasons
        fetchedSeasons = await SeasonService.fetchAllSeasons();
        console.log('Fetched all seasons:', fetchedSeasons);
      }
      
      setSeasons(fetchedSeasons);
    } catch (err) {
      console.error('Error fetching seasons:', err);
      setError('Failed to load seasons');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabPress = (tabIndex: number) => {
    console.log(`Tab ${tabIndex} pressed - ${['In Progress', 'Upcoming', 'Past'][tabIndex]}`);
    setActiveTab(tabIndex);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };


  const handleRegisterPress = (season: Season) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Register button pressed for season:', season.name);

    // Check if season is doubles (from league gameType)
    const isDoublesSeason = season.league?.gameType === 'DOUBLES';

    if (isDoublesSeason) {
      // For doubles seasons, navigate to Find Partner screen
      console.log('Doubles season detected - navigating to Find Partner');
      router.push(`/pairing/find-partner/${season.id}`);
    } else {
      // For singles seasons, navigate to regular registration
      console.log('Singles season detected - navigating to registration');
      // TODO: Navigate to regular registration screen
      // router.push(`/registration/${season.id}`);
    }
  };

  const handleJoinWaitlistPress = (season: Season) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Join Waitlist button pressed for season:', season.name);
    // TODO: Navigate to waitlist screen
    // router.push(`/waitlist/${season.id}`);
  };

  const handleViewStandingsPress = (season: Season) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('View Standings button pressed for season:', season.name);
    // TODO: Navigate to standings screen
    // router.push(`/standings/${season.id}`);
  };

  const tabs = ['In Progress', 'Upcoming', 'Past'];

  const renderSeasonCards = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#863A73" />
          <Text style={styles.loadingText}>Loading seasons...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchSeasons}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const { active, upcoming, finished } = SeasonService.groupSeasonsByStatus(seasons);
    
    let currentSeasons: Season[] = [];
    let buttonHandler: (season: Season) => void = () => {};

    switch (activeTab) {
      case 0: // In Progress
        currentSeasons = active;
        buttonHandler = handleRegisterPress;
        break;
      case 1: // Upcoming
        currentSeasons = upcoming;
        buttonHandler = handleJoinWaitlistPress;
        break;
      case 2: // Past
        currentSeasons = finished;
        buttonHandler = handleViewStandingsPress;
        break;
    }

    if (currentSeasons.length === 0) {
      const emptyMessages = [
        'No active seasons available',
        'No upcoming seasons available',
        'No past seasons available'
      ];
      
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{emptyMessages[activeTab]}</Text>
          <Text style={styles.emptySubtext}>
            Seasons will appear here once they are created by the league administrator.
          </Text>
        </View>
      );
    }

    return currentSeasons.map((season) => {
      const buttonText = SeasonService.getButtonText(season.status);
      const buttonColor = SeasonService.getButtonColor(season.status);
      const seasonBadge = SeasonService.getSeasonBadge(season.status, season.name);
      const duration = SeasonService.formatDateRange(season.startDate, season.endDate);
      const registrationDeadline = season.regiDeadline 
        ? `Last Registration: ${SeasonService.formatDate(season.regiDeadline)}`
        : 'Registration: Open';
      const entryFee = typeof season.entryFee === 'string' 
        ? `RM${parseFloat(season.entryFee).toFixed(2)}`
        : `RM${season.entryFee.toFixed(2)}`;

      return (
        <View key={season.id} style={styles.seasonCard}>
          <View style={styles.seasonCardHeader}>
            <Text style={styles.seasonTitle}>{season.name}</Text>
            <View style={styles.seasonBadge}>
              <Text style={styles.seasonBadgeText}>{seasonBadge} S{activeTab + 1}</Text>
            </View>
          </View>
          
          <View style={styles.playerCountRow}>
            <View style={styles.playerAvatars}>
              <View style={styles.playerAvatar} />
              <View style={styles.playerAvatar} />
              <View style={styles.playerAvatar} />
              <View style={styles.playerAvatar} />
              <View style={styles.playerAvatar} />
            </View>
            <Text style={styles.playerCountText}>
              <Text style={styles.playerCountNumber}>+{season.registeredUserCount}</Text> players registered
            </Text>
          </View>

          <View style={styles.seasonDetails}>
            <View style={styles.detailRow}>
              <CalendarIcon width={16} height={16} style={styles.detailIcon} />
              <Text style={styles.detailText}>Duration: {duration}</Text>
            </View>
            <View style={styles.detailRow}>
              <ClockIcon width={16} height={16} style={styles.detailIcon} />
              <Text style={styles.detailText}>{registrationDeadline}</Text>
            </View>
            <View style={styles.detailRow}>
              <DollarSignIcon width={16} height={16} style={styles.detailIcon} />
              <Text style={styles.detailText}>
                Entry Fee: <Text style={styles.highlightText}>{entryFee}</Text>
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.registerButton, { backgroundColor: buttonColor }]}
            onPress={() => buttonHandler(season)}
            activeOpacity={0.8}
          >
            <Text style={styles.registerButtonText}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      );
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={sport === 'pickleball' ? ['#B98FAF', '#FFFFFF'] : ['#B3CFBC', '#FFFFFF']}
        locations={[0, 1]}
        style={styles.backgroundGradient}
      />
      
      <View style={styles.contentContainer}>
        {/* Header Section */}
        <SportDropdownHeader 
          currentSport={sport}
          sportName={sport === 'pickleball' ? 'Pickleball' : 'Tennis'}
          sportColor={sport === 'pickleball' ? '#863A73' : '#008000'}
        />
        
        {/* Category Title */}
        <View style={styles.categoryTitleContainer}>
          <Text style={styles.categoryTitleText}>{category}</Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {tabs.map((tab, index) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === index && styles.activeTab]}
              onPress={() => handleTabPress(index)}
            >
              <Text style={[styles.tabText, activeTab === index && styles.activeTabText]}>
                {tab}
              </Text>
              {activeTab === index && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Dynamic Season Cards */}
          {renderSeasonCards()}
        </ScrollView>
      </View>
      
      <NavBar activeTab={2} onTabPress={() => {}} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.35,
  },
  contentContainer: {
    flex: 1,
    zIndex: 1,
  },
  categoryTitleContainer: {
    marginTop: 30,
    alignItems: 'flex-start',
    paddingHorizontal: 24,
  },
  categoryTitleText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'left',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    justifyContent: 'flex-start',
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    position: 'relative',
    marginRight: 24,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  activeTab: {
    // Active tab styling - can be empty or add specific styles
  },
  activeTabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: -2,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#863A73',
    borderRadius: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  seasonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    borderColor: '#E3E3E3',
    borderWidth: 1,
  },
  seasonCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seasonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  seasonBadge: {
    backgroundColor: '#863A73',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#863A73',
  },
  seasonBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  playerCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  playerAvatars: {
    flexDirection: 'row',
    marginRight: 12,
  },
  playerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    marginLeft: -4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  playerCountText: {
    fontSize: 14,
    color: '#6B7280',
  },
  playerCountNumber: {
    color: '#863A73',
    fontWeight: '600',
  },
  seasonDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    marginRight: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  highlightText: {
    color: '#863A73',
    fontWeight: '600',
  },
  registerButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#863A73',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
