import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions, Platform } from 'react-native';
import { League } from '../services/LeagueService';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Responsive design helpers
const isSmallScreen = width < 375;
const isTablet = width > 768;

interface LeagueCardProps {
  league: League;
  onJoinPress?: (leagueId: string) => void;
  variant?: 'featured' | 'regular';
  size?: 'compact' | 'large';
  sport?: 'pickleball' | 'tennis' | 'padel';
}

interface LeagueGridProps {
  leagues: League[];
  onJoinPress?: (leagueId: string) => void;
}

export function LeagueGrid({ leagues, onJoinPress }: LeagueGridProps) {
  if (leagues.length === 2) {
    return (
      <View style={styles.gridContainer}>
        {leagues.map((league) => (
          <LeagueCard 
            key={league.id} 
            league={league} 
            onJoinPress={onJoinPress} 
            variant="regular" 
          />
        ))}
      </View>
    );
  }
  
  return (
    <>
      {leagues.map((league) => (
        <LeagueCard 
          key={league.id} 
          league={league} 
          onJoinPress={onJoinPress} 
          variant="regular" 
        />
      ))}
    </>
  );
}

export function LeagueCard({ league, onJoinPress, variant = 'regular', size = 'compact', sport = 'pickleball' }: LeagueCardProps) {
  const handleJoinPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onJoinPress) {
      onJoinPress(league.id);
    } else {
      // Default navigation to league details screen
      router.push('/user-dashboard/league-details');
    }
  };

  const getGradientColors = (sport: 'pickleball' | 'tennis' | 'padel'): [string, string] => {
    switch (sport) {
      case 'tennis':
        return ['#A2E047', '#252721'];
      case 'padel':
        return ['#4DABFE', '#212427'];
      case 'pickleball':
      default:
        return ['#A04DFE', '#212427'];
    }
  };

  const getRegularCardColor = (sport: 'pickleball' | 'tennis' | 'padel'): string => {
    switch (sport) {
      case 'tennis':
        return '#A2E047';
      case 'padel':
        return '#4DABFE';
      case 'pickleball':
      default:
        return '#A04DFE';
    }
  };

  // Format location names
  // const formatLocation = (location: string) => {
  //   if (!location) return '';
    
  //   const formatted = location
  //     .split('-')
  //     .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
  //     .join(' ');
    
  //   return formatted;
  // };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'ONGOING':
        return '#10B981'; // green
      case 'UPCOMING':
        return '#F59E0B'; // amber
      case 'FINISHED':
        return '#6B7280'; // gray
      case 'CANCELLED':
        return '#EF4444'; // red
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'ONGOING':
        return 'Ongoing';
      case 'UPCOMING':
        return 'Upcoming';
      case 'FINISHED':
        return 'Finished';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  if (variant === 'featured') {
    return (
      <TouchableOpacity activeOpacity={0.9} style={styles.featuredCard} onPress={handleJoinPress}>
        <LinearGradient
          colors={getGradientColors(sport)}
          style={styles.featuredWhiteCard}
        >
          <View style={styles.featuredContent}>
            {/* Header with league name */}
            <View style={styles.featuredHeader}>
              <View style={styles.featuredTitleSection}>
                <Text style={styles.featuredLeagueName}>{league.name}</Text>
                {/* Categories chips */}
                {league.categories && league.categories.length > 0 && (
                  <View style={styles.categoriesContainer}>
                    {league.categories.map((category) => (
                      <View key={category.id} style={styles.categoryChip}>
                        <Text style={styles.categoryText}>{category.name}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              {/* Comment out status badge */}
              {/* <View style={[styles.statusBadge, { backgroundColor: getStatusColor(league.status) }]}>
                <Text style={styles.statusText}>{getStatusText(league.status)}</Text>
              </View> */}
            </View>
            
            {/* Profile pictures section below categories */}
            {league.memberships && league.memberships.length > 0 && (
              <View style={styles.profilePicturesSection}>
                <View style={styles.profilePicturesContainer}>
                  {league.memberships.slice(0, 6).map((membership: NonNullable<League['memberships']>[0], index: number) => {
                    if (!membership.user) return null;
                    return (
                      <View key={membership.id} style={[styles.profilePicture, index > 0 && styles.profilePictureOverlap]}>
                        {membership.user.image ? (
                          <Image 
                            source={{ uri: membership.user.image }}
                            style={styles.profileImage}
                          />
                        ) : (
                          <View style={styles.defaultProfileImage}>
                            <Text style={styles.defaultProfileText}>
                              {membership.user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                  {league.totalSeasonMemberships && league.totalSeasonMemberships > 6 && (
                    <View style={[styles.remainingCount, styles.profilePictureOverlap]}>
                      <Text style={styles.remainingCountText}>
                        +{league.totalSeasonMemberships - 6}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
            
            {/* Bottom section with stats and CTA */}
            <View style={styles.featuredBottom}>
              <View style={styles.statsRow}>
                <View style={styles.statusCircle} />
                <Text style={styles.memberCountText}>
                  {league.totalSeasonMemberships || 0} players
                </Text>
              </View>
              
              {/* Comment out CTA section */}
              {/* <View style={styles.ctaSection}>
                <Text style={styles.registrationText}>Registration open</Text>
                <TouchableOpacity 
                  style={styles.featuredCta} 
                  onPress={handleJoinPress}
                >
                  <Text style={styles.featuredCtaText}>Join Now</Text>
                </TouchableOpacity>
              </View> */}
              <View style={styles.ctaSection}>
                <Text style={styles.registrationText}>Registration open</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const cardContentStyle = size === 'large' ? styles.regularCardContentLarge : styles.regularCardContent;
  const leagueNameStyle = size === 'large' ? styles.regularLeagueNameLarge : styles.regularLeagueName;
  const registrationTextStyle = size === 'large' ? styles.regularRegistrationTextLarge : styles.regularRegistrationText;
  const registrationSectionStyle = size === 'large' ? styles.regularRegistrationSectionLarge : styles.regularRegistrationSection;
  const playerCountStyle = size === 'large' ? styles.regularPlayerCountLarge : styles.regularPlayerCount;

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      style={[styles.regularCard, { backgroundColor: getRegularCardColor(sport) }]}
      onPress={handleJoinPress}
    >
      <View style={cardContentStyle}>
        {/* Header with league name and status */}
        <View style={styles.regularHeader}>
          <View style={styles.regularTitleSection}>
            <Text style={leagueNameStyle}>{league.name}</Text>
            {/* Comment out category chip */}
            {/* <View style={styles.gameTypeChip}>
              <Text style={styles.gameTypeText}>{league.gameType}</Text>
            </View> */}
          </View>
          {/* Comment out status chip */}
          {/* <View style={[styles.statusBadge, { backgroundColor: getStatusColor(league.status) }]}>
            <Text style={styles.statusText}>{getStatusText(league.status)}</Text>
          </View> */}
        </View>
        
        {/* Comment out description */}
        {/* <View style={styles.regularInfo}>
          {league.description && (
            <Text style={styles.regularDescription} numberOfLines={1}>
              {league.description}
            </Text>
          )}
        </View> */}
        
        {/* Player count with green circle */}
        <View style={playerCountStyle}>
          <View style={styles.statusCircle} />
          <Text style={styles.regularPlayerCountText}>
            {league.totalSeasonMemberships || 0} players
          </Text>
        </View>
        
        {/* Profile pictures section */}
        {league.memberships && league.memberships.length > 0 && (
          <View style={styles.regularProfilePicturesSection}>
            <View style={styles.regularProfilePicturesContainer}>
              {league.memberships.slice(0, 6).map((membership: NonNullable<League['memberships']>[0], index: number) => {
                if (!membership.user) return null;
                return (
                  <View key={membership.id} style={[styles.regularProfilePicture, index > 0 && styles.regularProfilePictureOverlap]}>
                    {membership.user.image ? (
                      <Image 
                        source={{ uri: membership.user.image }}
                        style={styles.regularProfileImage}
                      />
                    ) : (
                      <View style={styles.regularDefaultProfileImage}>
                        <Text style={styles.regularDefaultProfileText}>
                          {membership.user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
              {league.totalSeasonMemberships && league.totalSeasonMemberships > 6 && (
                <View style={[styles.regularRemainingCount, styles.regularProfilePictureOverlap]}>
                  <Text style={styles.regularRemainingCountText}>
                    +{league.totalSeasonMemberships - 6}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
        
        {/* Registration open text */}
        <View style={registrationSectionStyle}>
          <Text style={registrationTextStyle}>Registration open</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  featuredCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  featuredWhiteCard: {
    width: '100%',
    height: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featuredContent: {
    padding: isSmallScreen ? 14 : isTablet ? 20 : 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  featuredTitleSection: {
    flex: 1,
    marginRight: 8,
  },
  featuredLeagueName: {
    color: '#FDFDFD',
    fontSize: isSmallScreen ? 16 : isTablet ? 20 : 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  gameTypeChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    paddingTop: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  gameTypeText: {
    color: '#6B7280',
    fontSize: isSmallScreen ? 10 : isTablet ? 12 : 11,
    fontWeight: '600',
  },
  featuredInfo: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  featuredLocation: {
    color: '#6B7280',
    fontSize: isSmallScreen ? 11 : isTablet ? 14 : 12,
    fontWeight: '500',
  },
  featuredDescription: {
    color: '#9CA3AF',
    fontSize: isSmallScreen ? 11 : isTablet ? 13 : 12,
    lineHeight: isSmallScreen ? 16 : isTablet ? 18 : 16,
  },
  featuredBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberCountText: {
    color: '#FDFDFD',
    fontSize: isSmallScreen ? 11 : isTablet ? 14 : 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6EC531',
  },
  profilePicturesSection: {
    marginTop: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profilePicturesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  profilePicture: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  profilePictureOverlap: {
    marginLeft: -10,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  defaultProfileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6de9a0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultProfileText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  remainingCount: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  remainingCountText: {
    color: '#1C1A1A',
    fontSize: 11,
    fontWeight: '700',
  },
  ctaSection: {
    alignItems: 'flex-end',
  },
  registrationText: {
    color: '#F2F2F2',
    fontSize: isSmallScreen ? 10 : isTablet ? 12 : 11,
    fontWeight: '500',
    marginBottom: 8,
  },
  featuredCta: {
    backgroundColor: '#FEA04D',
    paddingHorizontal: isSmallScreen ? 16 : isTablet ? 24 : 20,
    paddingVertical: isSmallScreen ? 8 : isTablet ? 12 : 10,
    borderRadius: 12,
    marginLeft: 12,
  },
  featuredCtaText: {
    color: '#1C1A1A',
    fontSize: isSmallScreen ? 11 : isTablet ? 14 : 12,
    fontWeight: '700',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  categoryChip: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryText: {
    color: '#FEA04D',
    fontSize: isSmallScreen ? 10 : isTablet ? 12 : 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Regular card styles
  regularCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    flex: 1,
  },
  regularCardContent: {
    paddingHorizontal: isSmallScreen ? 14 : isTablet ? 18 : 16,
    paddingVertical: isSmallScreen ? 10 : isTablet ? 14 : 12,
  },
  regularCardContentLarge: {
    paddingHorizontal: isSmallScreen ? 16 : isTablet ? 22 : 20,
    paddingVertical: isSmallScreen ? 14 : isTablet ? 18 : 16,
  },
  regularHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  regularTitleSection: {
    flex: 1,
    marginRight: 8,
  },
  regularLeagueName: {
    fontSize: isSmallScreen ? 13 : isTablet ? 16 : 14,
    fontWeight: '700',
    color: '#0F0F0F',
    marginBottom: 2,
  },
  regularLeagueNameLarge: {
    fontSize: isSmallScreen ? 15 : isTablet ? 18 : 16,
    fontWeight: '700',
    color: '#0F0F0F',
    marginBottom: 2,
  },
  regularInfo: {
    marginBottom: 8,
  },
  regularLocation: {
    fontSize: isSmallScreen ? 10 : isTablet ? 13 : 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  regularDescription: {
    fontSize: isSmallScreen ? 10 : isTablet ? 12 : 11,
    color: '#9CA3AF',
  },
  regularPlayerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  regularPlayerCountLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  regularPlayerCountText: {
    color: '#FFFFFF',
    fontSize: isSmallScreen ? 11 : isTablet ? 14 : 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  regularProfilePicturesSection: {
    marginBottom: 8,
  },
  regularProfilePicturesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  regularProfilePicture: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  regularProfilePictureOverlap: {
    marginLeft: -8,
  },
  regularProfileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  regularDefaultProfileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6de9a0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  regularDefaultProfileText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  regularRemainingCount: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  regularRemainingCountText: {
    color: '#1C1A1A',
    fontSize: 10,
    fontWeight: '700',
  },
  regularRegistrationSection: {
    marginBottom: 8,
  },
  regularRegistrationSectionLarge: {
    marginTop: 10,
    marginBottom: 8,
    alignItems: 'center',
  },
  regularRegistrationText: {
    color: '#0F0F0F',
    fontSize: isSmallScreen ? 10 : isTablet ? 12 : 11,
    fontWeight: '500',
  },
  regularRegistrationTextLarge: {
    color: '#0F0F0F',
    fontSize: isSmallScreen ? 11 : isTablet ? 13 : 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  regularBottom: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  regularCta: {
    backgroundColor: '#FEA04D',
    paddingHorizontal: isSmallScreen ? 12 : isTablet ? 16 : 14,
    paddingVertical: isSmallScreen ? 6 : isTablet ? 8 : 7,
    borderRadius: 12,
  },
  regularCtaText: {
    color: '#1C1A1A',
    fontSize: isSmallScreen ? 10 : isTablet ? 13 : 11,
    fontWeight: '700',
  },
  
  // Shared styles
  statusBadge: {
    paddingHorizontal: isSmallScreen ? 6 : isTablet ? 10 : 8,
    paddingVertical: isSmallScreen ? 2 : isTablet ? 4 : 3,
    borderRadius: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: isSmallScreen ? 9 : isTablet ? 12 : 10,
    fontWeight: '600',
  },
});

