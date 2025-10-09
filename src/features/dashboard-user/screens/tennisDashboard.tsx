import React from 'react';
import { ScrollView, Text, View, StyleSheet, Dimensions, Platform, Image, TouchableOpacity, ImageBackground, Animated, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useDashboard } from '../DashboardContext';
import { NavBar } from '@/shared/components/layout';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { SportDropdownHeader } from '@/src/shared/components/ui/SportDropdownHeader';

const { width, height } = Dimensions.get('window');

export default function DashboardScreen() {
  const { userName } = useDashboard();
  const [activeTab, setActiveTab] = React.useState(2);
  const [locationFilterOpen, setLocationFilterOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const scrollY = React.useRef(new Animated.Value(0)).current;

  console.log(`DashboardScreen: Current activeTab is ${activeTab}`);

  const handleTabPress = (tabIndex: number) => {
    console.log(`Tab ${tabIndex} pressed - ${['Favourite', 'Friendly', 'Leagues', 'My Games', 'Chat'][tabIndex]}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  React.useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
              <LinearGradient
          colors={['#B3CFBC', '#FFFFFF']}
          locations={[0, 1]}
          style={styles.backgroundGradient}
        />
      
      
      <View style={styles.contentContainer}>
        <SportDropdownHeader 
          currentSport="tennis"
          sportName="Tennis"
          sportColor="#008000"
        />

        
        
        <Animated.ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
                  >
          
            <View style={styles.recommendedHeaderRow}>
              <Text style={styles.sportSelectionText}>Recommended league:</Text>
              <TouchableOpacity style={styles.locationFilter} onPress={() => setLocationFilterOpen(!locationFilterOpen)}>
                <Text style={styles.locationFilterText}>Based on your location</Text>
                <Text style={styles.locationFilterChevron}>▾</Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={styles.featuredSkeleton} />
            ) : (
            <TouchableOpacity activeOpacity={0.9} style={styles.featuredCard}>
              <Animated.View style={[styles.parallaxWrapper, {
                transform: [
                  { translateY: scrollY.interpolate({ inputRange: [-100, 0, 200], outputRange: [-30, 0, 20], extrapolate: 'clamp' }) },
                  { scale: scrollY.interpolate({ inputRange: [-100, 0], outputRange: [1.05, 1], extrapolate: 'clamp' }) }
                ]
              }]}>
                <ImageBackground
                  source={require('@/assets/images/leaguetennis3.png')}
                  style={styles.featuredImage}
                  imageStyle={styles.featuredImageRadius}
                >
                  <View style={styles.featuredOverlay} />
                  <View style={styles.featuredContent}>
                    <View style={styles.featuredTopRow}>
                      <Text style={styles.featuredLeagueName}>PJ League</Text>
                      <View style={styles.trophyBadge}>
                        <Text style={styles.trophyText}>🏆 S1</Text>
                      </View>
                    </View>
                    <View style={styles.featuredMetaRow}>
                      <View style={styles.avatarsRow}>
                        <Image
                          source={require('@/assets/images/icon1.png')}
                          style={[styles.avatarImage, { zIndex: 3 }]}
                        />
                        <Image
                          source={require('@/assets/images/icon2.png')}
                          style={[styles.avatarImage, { marginLeft: -10, zIndex: 2 }]}
                        />
                        <Image
                          source={require('@/assets/images/icon3.png')}
                          style={[styles.avatarImage, { marginLeft: -10, zIndex: 1 }]}
                        />
                        <Text style={styles.moreCountText}>+23</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.featuredCta} 
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          router.push('/user-dashboard/category');
                        }}
                      >
                        <Text style={styles.featuredCtaText}>Join Now</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ImageBackground>
              </Animated.View>
            </TouchableOpacity>
            )}

            <View style={styles.otherLeaguesHeaderRow}>
              <Text style={styles.sectionTitle}>Other leagues near you</Text>
              <Text style={styles.arrowText}>→</Text>
            </View>

            <View style={styles.otherLeagueCard}>
              <ImageBackground
                source={require('@/assets/images/leaguetennis1.png')}
                style={styles.otherLeagueImage}
                imageStyle={styles.otherLeagueImageRadius}
              />
              <View style={styles.otherLeagueInfoRow}>
                <View>
                  <Text style={styles.otherLeagueName}>KL League</Text>
                  <Text style={styles.otherLeagueSub}>120 players joined</Text>
                </View>
                <TouchableOpacity 
                  style={styles.otherLeagueCta} 
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/user-dashboard/category');
                  }}
                >
                  <Text style={styles.otherLeagueCtaText}>Join</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.otherLeagueCard}>
              <ImageBackground
                source={require('@/assets/images/leaguetennis2.png')}
                style={styles.otherLeagueImage}
                imageStyle={styles.otherLeagueImageRadius}
              />
              <View style={styles.otherLeagueInfoRow}>
                <View>
                  <Text style={styles.otherLeagueName}>Subang League</Text>
                  <Text style={styles.otherLeagueSub}>96 players joined</Text>
                </View>
                <TouchableOpacity 
                  style={styles.otherLeagueCta} 
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/user-dashboard/category');
                  }}
                >
                  <Text style={styles.otherLeagueCtaText}>Join</Text>
                </TouchableOpacity>
              </View>
            </View>

           

        </Animated.ScrollView>
      </View>
      
      {/* Bottom Navigation Bar */}
      <NavBar activeTab={activeTab} onTabPress={handleTabPress} />
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  recommendedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sportSelectionText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: '#1A1C1E',
  },
  locationFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  locationFilterText: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 6,
  },
  locationFilterChevron: {
    fontSize: 12,
    color: '#6B7280',
  },
  featuredCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: 180,
    justifyContent: 'flex-end',
  },
  featuredImageRadius: {
    borderRadius: 16,
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  featuredContent: {
    padding: 16,
  },
  featuredTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  featuredLeagueName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  trophyBadge: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)'
  },
  trophyText: {
    fontSize: 12,
  },
  featuredMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  moreCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  featuredCta: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)'
  },
  featuredCtaText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },
  otherLeaguesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  arrowText: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  sectionTitle: {
    fontSize: 18,
    color: '#333333',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  otherLeagueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  otherLeagueImage: {
    width: '100%',
    height: 140,
  },
  otherLeagueImageRadius: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  otherLeagueInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  otherLeagueName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  otherLeagueSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  otherLeagueCta: {
    backgroundColor: '#111827',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  otherLeagueCtaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  parallaxWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  featuredSkeleton: {
    height: 180,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginBottom: 20,
  },
});