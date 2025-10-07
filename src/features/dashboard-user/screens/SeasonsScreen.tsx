import React from 'react';
import { ScrollView, Text, View, StyleSheet, Dimensions, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { NavBar } from '@/shared/components/layout';
import * as Haptics from 'expo-haptics';
import CalendarIcon from '@/assets/icons/calendar-icon.svg';
import ClockIcon from '@/assets/icons/clock-icon.svg';
import DollarSignIcon from '@/assets/icons/dollarsign-icon.svg';

const { width, height } = Dimensions.get('window');

interface SeasonsScreenProps {
  category?: string;
  leagueName?: string;
  sport?: 'pickleball' | 'tennis';
}

export default function SeasonsScreen({ 
  category = 'Men\'s Single',
  leagueName = 'PJ League',
  sport = 'pickleball'
}: SeasonsScreenProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = React.useState(0); // 0: In Progress, 1: Upcoming, 2: Past
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = React.useState(false);
  const [headerTitleLayout, setHeaderTitleLayout] = React.useState<{ x: number; y: number; width: number; height: number } | null>(null);

  React.useEffect(() => {
    console.log('SeasonsScreen loaded successfully!');
    console.log('Category:', category, 'League:', leagueName, 'Sport:', sport);
  }, [category, leagueName, sport]);

  const handleTabPress = (tabIndex: number) => {
    console.log(`Tab ${tabIndex} pressed - ${['In Progress', 'Upcoming', 'Past'][tabIndex]}`);
    setActiveTab(tabIndex);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleRegisterPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Register button pressed');
    // TODO: Navigate to registration screen
  };

  const tabs = ['In Progress', 'Upcoming', 'Past'];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={sport === 'pickleball' ? ['#B98FAF', '#FFFFFF'] : ['#B3CFBC', '#FFFFFF']}
        locations={[0, 1]}
        style={styles.backgroundGradient}
      />
      
      <View style={styles.contentContainer}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={handleBackPress} activeOpacity={0.7}>
              <Text style={styles.backIcon}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerTitleRow}
              activeOpacity={0.7}
              onPress={() => setIsHeaderMenuOpen((v) => !v)}
              onLayout={(e) => setHeaderTitleLayout(e.nativeEvent.layout)}
            >
              <Text style={styles.headerTitleText}>Pickleball</Text>
              <Text style={styles.headerTitleCaret}>▾</Text>
            </TouchableOpacity>
          </View>
          
          {/* Category Title */}
          <View style={styles.categoryTitleContainer}>
            <Text style={styles.categoryTitleText}>{category}</Text>
          </View>
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
          {/* Season Card */}
          <View style={styles.seasonCard}>
            <View style={styles.seasonCardHeader}>
              <Text style={styles.seasonTitle}>Winter Season 2025</Text>
              <View style={styles.seasonBadge}>
                <Text style={styles.seasonBadgeText}>🏆 S1</Text>
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
                <Text style={styles.playerCountNumber}>+95</Text> players registered
              </Text>
            </View>

            <View style={styles.seasonDetails}>
              <View style={styles.detailRow}>
                <CalendarIcon width={16} height={16} style={styles.detailIcon} />
                <Text style={styles.detailText}>Duration: 1 Dec 2025 – 31 Jan 2026</Text>
              </View>
              <View style={styles.detailRow}>
                <ClockIcon width={16} height={16} style={styles.detailIcon} />
                <Text style={styles.detailText}>Last Registration: 27 Nov 2025</Text>
              </View>
              <View style={styles.detailRow}>
                <DollarSignIcon width={16} height={16} style={styles.detailIcon} />
                <Text style={styles.detailText}>
                  Entry Fee: <Text style={styles.highlightText}>RM59.90</Text>
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.registerButton}
              onPress={handleRegisterPress}
              activeOpacity={0.8}
            >
              <Text style={styles.registerButtonText}>Register</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
      
      <NavBar activeTab={2} onTabPress={() => {}} />

      {isHeaderMenuOpen && (
        <View style={styles.dropdownOverlay} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.dropdownBackdrop}
            activeOpacity={1}
            onPress={() => setIsHeaderMenuOpen(false)}
          />
          <View
            style={[
              styles.dropdownMenu,
              headerTitleLayout
                ? {
                    top: headerTitleLayout.y + headerTitleLayout.height + 40,
                    left: headerTitleLayout.x + 100,
                  }
                : undefined,
            ]}
          >
            <View style={styles.dropdownCard}>
              <TouchableOpacity
                style={styles.dropdownRow}
                onPress={() => { setIsHeaderMenuOpen(false); router.push('/user-dashboard/pickleball')}}
              >
                <Text style={styles.dropdownIconPickleball}>🏓</Text>
                <Text style={styles.dropdownLabelPickleball}>Pickleball</Text>
                <Text style={styles.dropdownCheckPickle}>✓</Text>
              </TouchableOpacity>
              <View style={styles.dropdownDivider} />
              <TouchableOpacity
                style={styles.dropdownRow}
                onPress={() => { setIsHeaderMenuOpen(false); router.push('/user-dashboard/tennis'); }}
              >
                <Text style={styles.dropdownIconTennis}>🎾</Text>
                <Text style={styles.dropdownLabelTennis}>Tennis</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
    marginTop: 10,
  },
  backIcon: {
    fontSize: 35,
    fontWeight: '600',
    color: '#111827',
    marginRight: 5,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  headerTitleText: {
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
    fontStyle: 'italic',
    fontWeight: '800',
    fontSize: 20,
    lineHeight: 20,
    color: '#863A73',
    marginRight: 6,
  },
  headerTitleCaret: {
    fontSize: 16,
    color: '#111827',
    marginTop: -1,
  },
  categoryTitleContainer: {
    marginTop: 30,
    alignItems: 'flex-start',
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
    backgroundColor: '#863A73',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  dropdownMenu: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 20,
    minWidth: 140,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    zIndex: 9999,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000,
    elevation: 30,
  },
  dropdownBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  dropdownCard: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dropdownIconPickleball: {
    fontSize: 16,
  },
  dropdownIconTennis: {
    fontSize: 16,
  },
  dropdownLabelPickleball: {
    fontSize: 14,
    fontWeight: '700',
    color: '#863A73',
    flex: 1,
  },
  dropdownLabelTennis: {
    fontSize: 14,
    fontWeight: '700',
    color: '#008000',
    flex: 1,
  },
  dropdownCheckPickle: {
    fontSize: 14,
    color: '#863A73',
  },
});
