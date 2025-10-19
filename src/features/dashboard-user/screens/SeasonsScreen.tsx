import React from 'react';
import { ScrollView, Text, View, StyleSheet, Dimensions, Platform, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { NavBar } from '@/shared/components/layout';
import { SportDropdownHeader } from '@/shared/components/ui/SportDropdownHeader';
import * as Haptics from 'expo-haptics';
import CalendarIcon from '@/assets/icons/calendar-icon.svg';
import ClockIcon from '@/assets/icons/clock-icon.svg';
import DollarSignIcon from '@/assets/icons/dollarsign-icon.svg';
import { useActivePartnership } from '@/features/pairing/hooks';
import { PartnershipCard } from '@/features/pairing/components';
import { authClient } from '@/lib/auth-client';
import { getBackendBaseURL } from '@/config/network';

const { width, height } = Dimensions.get('window');

interface SeasonsScreenProps {
  category?: string;
  leagueName?: string;
  sport?: 'pickleball' | 'tennis';
  seasonId?: string;
  currentUserId?: string;
}

export default function SeasonsScreen({
  category = 'Men\'s Single',
  leagueName = 'PJ League',
  sport = 'pickleball',
  seasonId: propSeasonId,
  currentUserId
}: SeasonsScreenProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = React.useState(0); // 0: In Progress, 1: Upcoming, 2: Past
  const [seasonId, setSeasonId] = React.useState<string | null>(propSeasonId || null);
  const [loadingSeasons, setLoadingSeasons] = React.useState(false);

  // Fetch active season if not provided
  React.useEffect(() => {
    const fetchActiveSeason = async () => {
      if (propSeasonId) {
        setSeasonId(propSeasonId);
        return;
      }

      try {
        setLoadingSeasons(true);
        const backendUrl = getBackendBaseURL();
        const response = await authClient.$fetch(`${backendUrl}/api/season`, {
          method: 'GET',
        });

        if (response && (response as any).data) {
          const seasons = (response as any).data;
          // Find the first ACTIVE season
          const activeSeason = seasons.find((s: any) => s.status === 'ACTIVE');
          if (activeSeason) {
            console.log('Found active season:', activeSeason.name, activeSeason.id);
            setSeasonId(activeSeason.id);
          } else if (seasons.length > 0) {
            // Fallback to first season if no active one
            console.log('No active season, using first season:', seasons[0].name);
            setSeasonId(seasons[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching seasons:', error);
      } finally {
        setLoadingSeasons(false);
      }
    };

    fetchActiveSeason();
  }, [propSeasonId]);

  // Check for active partnership for doubles categories
  const isDoublesCategory = category.toLowerCase().includes('double');
  const { partnership, loading: partnershipLoading, refresh: refreshPartnership } = useActivePartnership(
    isDoublesCategory && seasonId ? seasonId : null,
    currentUserId
  );

  React.useEffect(() => {
    console.log('SeasonsScreen loaded successfully!');
    console.log('Category:', category, 'League:', leagueName, 'Sport:', sport);
    console.log('Season ID:', seasonId);
  }, [category, leagueName, sport, seasonId]);

  const handleTabPress = (tabIndex: number) => {
    console.log(`Tab ${tabIndex} pressed - ${['In Progress', 'Upcoming', 'Past'][tabIndex]}`);
    setActiveTab(tabIndex);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };


  const handleRegisterPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Register button pressed for category:', category);

    if (isDoublesCategory) {
      // Check if user already has an active partnership
      if (partnership) {
        const partnerName = partnership.player1Id === currentUserId
          ? partnership.player2.name
          : partnership.player1.name;

        Alert.alert(
          'Already Paired',
          `You are already paired with ${partnerName}. You cannot register for another doubles season while in a partnership.`,
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      // Navigate to Find Partner screen
      console.log('Doubles category detected - navigating to Find Partner');
      router.push(`/pairing/find-partner/${seasonId}`);
    } else {
      // For singles categories, navigate to regular registration
      console.log('Singles category detected - navigating to registration');
      // TODO: Navigate to regular registration screen
      // router.push(`/registration/${seasonId}`);
    }
  };

  const handleJoinWaitlistPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Join Waitlist button pressed');
    // TODO: Navigate to waitlist screen
  };

  const handleViewStandingsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('View Standings button pressed');
    // TODO: Navigate to standings screen
  };

  const tabs = ['In Progress', 'Upcoming', 'Past'];

  const renderSeasonCard = () => {
    const getSeasonData = () => {
      switch (activeTab) {
        case 0: // In Progress
          return {
            title: 'Winter Season 2025',
            badge: '🏆 S1',
            playerCount: '+95',
            duration: 'Duration: 1 Dec 2025 – 31 Jan 2026',
            lastRegistration: 'Last Registration: 27 Nov 2025',
            entryFee: 'RM59.90',
            buttonText: 'Register',
            buttonColor: '#863A73',
            buttonHandler: handleRegisterPress
          };
        case 1: // Upcoming
          return {
            title: 'Spring Season 2025',
            badge: '🌱 S2',
            playerCount: '+67',
            duration: 'Duration: 1 Mar 2025 – 30 Apr 2025',
            lastRegistration: 'Registration Opens: 15 Feb 2025',
            entryFee: 'RM59.90',
            buttonText: 'Join Waitlist',
            buttonColor: '#000000',
            buttonHandler: handleJoinWaitlistPress
          };
        case 2: // Past
          return {
            title: 'Fall Season 2024',
            badge: '🍂 S4',
            playerCount: '+89',
            duration: 'Duration: 1 Sep 2024 – 30 Nov 2024',
            lastRegistration: 'Season Ended: 30 Nov 2024',
            entryFee: 'RM59.90',
            buttonText: 'View Standings',
            buttonColor: '#B2B2B2',
            buttonHandler: handleViewStandingsPress
          };
        default:
          return null;
      }
    };

    const seasonData = getSeasonData();
    if (!seasonData) return null;

    return (
      <View style={styles.seasonCard}>
        <View style={styles.seasonCardHeader}>
          <Text style={styles.seasonTitle}>{seasonData.title}</Text>
          <View style={styles.seasonBadge}>
            <Text style={styles.seasonBadgeText}>{seasonData.badge}</Text>
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
            <Text style={styles.playerCountNumber}>{seasonData.playerCount}</Text> players registered
          </Text>
        </View>

        <View style={styles.seasonDetails}>
          <View style={styles.detailRow}>
            <CalendarIcon width={16} height={16} style={styles.detailIcon} />
            <Text style={styles.detailText}>{seasonData.duration}</Text>
          </View>
          <View style={styles.detailRow}>
            <ClockIcon width={16} height={16} style={styles.detailIcon} />
            <Text style={styles.detailText}>{seasonData.lastRegistration}</Text>
          </View>
          <View style={styles.detailRow}>
            <DollarSignIcon width={16} height={16} style={styles.detailIcon} />
            <Text style={styles.detailText}>
              Entry Fee: <Text style={styles.highlightText}>{seasonData.entryFee}</Text>
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.registerButton, { backgroundColor: seasonData.buttonColor }]}
          onPress={seasonData.buttonHandler}
          activeOpacity={0.8}
        >
          <Text style={styles.registerButtonText}>{seasonData.buttonText}</Text>
        </TouchableOpacity>
      </View>
    );
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
          {/* Partnership Status - Show only for doubles categories */}
          {isDoublesCategory && partnership && currentUserId && (
            <PartnershipCard
              partnership={partnership}
              currentUserId={currentUserId}
              onDissolve={refreshPartnership}
              showActions={true}
            />
          )}

          {/* Dynamic Season Card */}
          {renderSeasonCard()}
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
});
