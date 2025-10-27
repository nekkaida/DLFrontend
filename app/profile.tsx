import { useNavigationManager } from '@core/navigation';
import { theme } from '@core/theme/theme';
import * as Haptics from 'expo-haptics';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { CircularImageCropper } from '../src/features/onboarding/components';
import { EloProgressGraph, InlineDropdown, MatchHistoryButton, ProfileAchievementsCard, ProfileHeaderWithCurve, ProfileInfoCard, ProfileLeagueStatsCard, ProfilePictureSection, ProfileSkillLevelCard } from '../src/features/profile/components';
// import { mockEloData, userData, gameTypeOptions } from '../src/features/profile/data/mockData'; // Team lead's original mock data - commented for API implementation
import { getBackendBaseURL } from '@/config/network';
import { authClient, useSession } from '@/lib/auth-client';
import * as SecureStore from 'expo-secure-store';
import { toast } from 'sonner-native';
import { useProfileHandlers } from '../src/features/profile/hooks/useProfileHandlers';
import { useProfileState } from '../src/features/profile/hooks/useProfileState';
import { ProfileDataTransformer } from '../src/features/profile/services/ProfileDataTransformer';

const { width } = Dimensions.get('window');

const CURVE_CONFIG = {
  HEIGHT: 200,
  DEPTH: 0,
  START_Y: 130,
} as const;

const SPORT_COLORS = {
  Tennis: '#A2E047',
  Pickleball: '#A04DFE',
  Padel: '#4DABFE',
} as const;

const generateCurvePath = (width: number): string => {
  const { HEIGHT, DEPTH, START_Y } = CURVE_CONFIG;
  
  // Safety check for width to prevent NaN issues
  const safeWidth = !isNaN(width) && width > 0 ? width : 300; // Default fallback width
  
  return `M0,${HEIGHT} L0,${START_Y} Q${safeWidth/2},${DEPTH} ${safeWidth},${START_Y} L${safeWidth},${START_Y} L${safeWidth},${HEIGHT} Z`;
};

// Match Details Box Component
const MatchDetailsBox: React.FC<{ match: any; profileData: any }> = ({ match, profileData }) => {
  if (!match) {
    return (
      <View style={styles.matchDetailsBox}>
        <View style={styles.emptyMatchDetails}>
          <Text style={styles.emptyMatchDetailsText}>Click a point on the graph to view match details</Text>
        </View>
      </View>
    );
  }


  return (
    <View style={styles.matchDetailsBox}>
      <View style={styles.matchDetailsContent}>
        {/* Top Row: Date (left) and Rating Change (right) */}
        <View style={styles.matchTopRow}>
          <Text style={styles.matchDateText}>{match.date}</Text>
          <View style={styles.matchRatingChangeContainer}>
            <Text style={[styles.matchRatingChangeText, { color: match.ratingChange > 0 ? '#34C759' : '#FF3B30' }]}>
              {match.ratingChange > 0 ? '+' : ''}{match.ratingChange} pts
            </Text>
            {match.ratingChange > 0 && (
              <Text style={styles.matchRatingChangeArrow}>↗</Text>
            )}
          </View>
        </View>
        
        {/* Players and Sets */}
        <View style={styles.matchPlayersContainer}>
          {/* Player Names Column with Profile Icons */}
          <View style={styles.matchPlayerColumn}>
            <View style={styles.matchPlayerRow}>
              {profileData?.image ? (
                <Image
                  source={{ uri: profileData.image }}
                  style={styles.matchProfileImage}
                  onError={() => console.log('Profile image failed to load')}
                />
              ) : (
                <View style={styles.matchDefaultProfileIcon}>
                  <Text style={styles.matchProfileIconText}>{match.player1?.charAt(0) || 'Y'}</Text>
                </View>
              )}
              <Text style={styles.matchPlayerName}>{match.player1 || 'You'}</Text>
            </View>
            <View style={styles.matchPlayerRow}>
              <View style={styles.matchDefaultProfileIcon}>
                <Text style={styles.matchProfileIconText}>{match.player2?.charAt(0) || 'O'}</Text>
              </View>
              <Text style={styles.matchPlayerName}>{match.player2 || 'Opponent'}</Text>
            </View>
          </View>
          
          {/* Set 1 */}
          <View style={styles.matchSetColumn}>
            <Text style={styles.matchSetHeader}>Set 1</Text>
            <Text style={styles.matchScore}>
              {match.scores?.set1?.player1 !== null ? match.scores.set1.player1 : '-'}
            </Text>
            <Text style={styles.matchScore}>
              {match.scores?.set1?.player2 !== null ? match.scores.set1.player2 : '-'}
            </Text>
          </View>
          
          {/* Set 2 */}
          <View style={styles.matchSetColumn}>
            <Text style={styles.matchSetHeader}>Set 2</Text>
            <Text style={styles.matchScore}>
              {match.scores?.set2?.player1 !== null ? match.scores.set2.player1 : '-'}
            </Text>
            <Text style={styles.matchScore}>
              {match.scores?.set2?.player2 !== null ? match.scores.set2.player2 : '-'}
            </Text>
          </View>
          
          {/* Set 3 */}
          <View style={styles.matchSetColumn}>
            <Text style={styles.matchSetHeader}>Set 3</Text>
            <Text style={styles.matchScore}>
              {match.scores?.set3?.player1 !== null ? match.scores.set3.player1 : '-'}
            </Text>
            <Text style={styles.matchScore}>
              {match.scores?.set3?.player2 !== null ? match.scores.set3.player2 : '-'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// ELO Progress Graph Component

// Custom Edit Icon SVG Component

export default function ProfileAdaptedScreen() {
  const { data: session } = useSession();
  const { navigateTo } = useNavigationManager();
  const [profileData, setProfileData] = useState<any>(null);
  const [matchHistory, setMatchHistory] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedBefore, setHasLoadedBefore] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  
  const {
    activeTab,
    selectedGame,
    modalVisible,
    selectedGameType,
    setActiveTab,
    setSelectedGame,
    setModalVisible,
    setSelectedGameType,
  } = useProfileState();

  const {
    handleSettingsPress,
    handleEditPress,
    handleGameTypeSelect,
    handleLeagueSelect,
    handleTabPress,
    handleGamePointPress: originalHandleGamePointPress,
    handleModalClose,
    handleMatchHistoryPress,
  } = useProfileHandlers({
    setSelectedGameType,
    setActiveTab,
    setSelectedGame,
    setModalVisible,
  });

  // Enhanced game point press handler to also set selected match
  const handleGamePointPress = (game: any) => {
    originalHandleGamePointPress(game);
    setSelectedMatch(game);
  };
  
  // API functions to fetch real data from backend
  const fetchAchievements = async () => {
    try {
      if (!session?.user?.id) {
        console.log('No session user ID available for achievements');
        return;
      }

      const backendUrl = getBackendBaseURL();
      console.log('Fetching achievements from:', `${backendUrl}/api/player/profile/achievements`);
      
      const response = await authClient.$fetch(`${backendUrl}/api/player/profile/achievements`, {
        method: 'GET',
      });
      
      console.log('Achievements API response:', response);
      
      if (response && (response as any).data && (response as any).data.achievements) {
        console.log('Setting achievements data:', (response as any).data.achievements);
        setAchievements((response as any).data.achievements);
      } else {
        console.log('No achievements data found, setting empty array');
        setAchievements([]);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
      setAchievements([]); // Set empty array on error
      toast.error('Error', {
        description: 'Failed to load achievements. Please try again.',
      });
    }
  };

  const fetchProfileData = async () => {
    try {
      if (!session?.user?.id) {
        console.log('No session user ID available');
        return;
      }
      
    
      
      const backendUrl = getBackendBaseURL();
      console.log('Fetching profile data from:', `${backendUrl}/api/player/profile/me`);
      
      // Use authClient.$fetch as primary method for better session handling
      const authResponse = await authClient.$fetch(`${backendUrl}/api/player/profile/me`, {
        method: 'GET',
      });
      
      console.log('Profile API response:', authResponse);
      
      if (authResponse && (authResponse as any).data && (authResponse as any).data.data) {
        console.log('Setting profile data:', (authResponse as any).data.data);
        setProfileData((authResponse as any).data.data);
      } else if (authResponse && (authResponse as any).data) {
        console.log('Setting profile data (direct):', (authResponse as any).data);
        setProfileData((authResponse as any).data);
      } else {
        console.error('No profile data received from authClient');
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast.error('Error', {
        description: 'Failed to load profile data. Please try again.',
      });
    }
  };

  const fetchMatchHistory = async () => {
    try {
      if (!session?.user?.id) return;
      
      const backendUrl = getBackendBaseURL();
      console.log('Fetching match history from:', `${backendUrl}/api/player/profile/matches`);
      
      // Use authClient's internal fetch method for proper session handling
      const response = await authClient.$fetch(`${backendUrl}/api/player/profile/matches`, {
        method: 'GET',
      });
      
      console.log('Match history data received:', response);
      
      if (response && (response as any).data) {
        setMatchHistory((response as any).data);
      } else if (response && (response as any).error && (response as any).error.status === 404) {
        console.log('No match history found for user (404) - this is normal for new users');
        setMatchHistory([]);
      } else {
        console.error('No match history data received');
        setMatchHistory([]);
      }
    } catch (error) {
      console.error('Error fetching match history:', error);
      toast.error('Error', {
        description: 'Failed to load match history. Please try again.',
      });
      
      // Fallback to regular fetch with proper headers if authClient.$fetch fails
      try {
        const backendUrl = getBackendBaseURL();
        const response = await fetch(`${backendUrl}/api/player/profile/matches`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            // Get session token from storage and include it
            'Authorization': `Bearer ${await SecureStore.getItemAsync('deuceleague.sessionToken')}`,
          },
        });
        
        if (response.ok) {
          const result = await response.json();
          setMatchHistory(result.data || []);
        } else if (response.status === 404) {
          console.log('No match history found (fallback 404) - normal for new users');
          setMatchHistory([]);
        }
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError);
        setMatchHistory([]); // Set empty array as final fallback
      }
    }
  };

  // Image upload functions
  const uploadProfileImage = async (imageUri: string) => {
    try {
      setIsUploadingImage(true);
      
      const backendUrl = getBackendBaseURL();
      const formData = new FormData();
      
      // Get file extension from URI
      const fileExtension = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeTypes: { [key: string]: string } = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
      };
      const mimeType = mimeTypes[fileExtension] || 'image/jpeg';

      // Create file object for upload with correct extension
      const file = {
        uri: imageUri,
        type: mimeType,
        name: `profile-${Date.now()}.${fileExtension}`,
      } as any;
      
      formData.append('image', file);
      
      console.log('Uploading profile image:', imageUri);
      
      const response = await authClient.$fetch(`${backendUrl}/api/player/profile/upload-image`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Upload response:', response);
      
      // Handle different possible response structures
      let imageUrl = null;
      
      if (response && (response as any).data) {
        const responseData = (response as any).data;
        // Try different possible paths for the image URL
        imageUrl = responseData.imageUrl || responseData.image || responseData.url || responseData.data?.imageUrl || responseData.data?.image;
      }
      
      if (imageUrl) {
        console.log('Image URL received:', imageUrl);
        
        // Update profile data with new image URL
        setProfileData((prev: any) => {
          const updated = {
            ...prev,
            image: imageUrl
          };
          console.log('Updated profile data:', updated);
          return updated;
        });
        
        // Also refresh profile data from server to ensure consistency
        setTimeout(async () => {
          try {
            await fetchProfileData();
          } catch (error) {
            console.error('Error refreshing profile data after upload:', error);
          }
        }, 1000);
        
        toast.success('Success', {
          description: 'Profile picture updated successfully!',
        });
      } else {
        console.error('No image URL found in response:', response);
        toast.error('Error', {
          description: 'Upload successful but no image URL received.',
        });
      }
    } catch (error) {
      console.error('Error uploading profile image:', error);
      toast.error('Error', {
        description: 'Failed to upload profile picture. Please try again.',
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const pickImage = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your photo library to upload a profile picture.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Show action sheet
      Alert.alert(
        'Select Profile Picture',
        'Choose how you want to select your profile picture',
        [
          {
            text: 'Camera',
            onPress: () => openCamera(),
          },
          {
            text: 'Photo Library',
            onPress: () => openImageLibrary(),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error picking image:', error);
      toast.error('Error', {
        description: 'Failed to open image picker. Please try again.',
      });
    }
  };

  const normalizeImageOrientation = async (imageUri: string) => {
    try {
      console.log('=== NORMALIZING CAMERA IMAGE ===');
      console.log('Original URI:', imageUri);

      // Get original dimensions before normalization
      return new Promise((resolve) => {
        Image.getSize(imageUri, async (width, height) => {
          console.log('Original dimensions:', { width, height });
          console.log('Original aspect ratio:', width / height);

          // Use manipulateAsync with no operations to normalize EXIF orientation
          const normalized = await manipulateAsync(
            imageUri,
            [], // No operations, just normalize
            { compress: 1.0, format: SaveFormat.JPEG }
          );

          console.log('Normalized URI:', normalized.uri);

          // Get dimensions after normalization
          Image.getSize(normalized.uri, (normWidth, normHeight) => {
            console.log('Normalized dimensions:', { width: normWidth, height: normHeight });
            console.log('Normalized aspect ratio:', normWidth / normHeight);
            console.log('Dimensions changed:', normWidth !== width || normHeight !== height);
            console.log('================================');
            resolve(normalized.uri);
          });
        }, (error) => {
          console.error('Error getting image size:', error);
          resolve(imageUri);
        });
      });
    } catch (error) {
      console.error('Error normalizing image orientation:', error);
      return imageUri;
    }
  };

  const openCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your camera to take a profile picture.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1.0,
        exif: false, // Don't include EXIF to avoid rotation issues
      });

      if (!result.canceled && result.assets[0]) {
        console.log('=== CAMERA PHOTO TAKEN ===');
        console.log('Raw camera URI:', result.assets[0].uri);
        console.log('Camera result width:', result.assets[0].width);
        console.log('Camera result height:', result.assets[0].height);
        console.log('Has EXIF:', result.assets[0].exif !== undefined);
        console.log('==========================');

        // Normalize EXIF rotation BEFORE showing cropper
        // This ensures the displayed image matches what will be cropped
        console.log('Normalizing camera image before cropper...');
        const normalized = await manipulateAsync(
          result.assets[0].uri,
          [],
          { compress: 1, format: SaveFormat.JPEG }
        );
        console.log('Normalized URI for cropper:', normalized.uri);

        setSelectedImageUri(normalized.uri);
        setShowCropper(true);
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      toast.error('Error', {
        description: 'Failed to open camera. Please try again.',
      });
    }
  };

  const openImageLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1.0,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('=== PHOTO LIBRARY IMAGE SELECTED ===');
        console.log('Library image URI:', result.assets[0].uri);
        console.log('Library result width:', result.assets[0].width);
        console.log('Library result height:', result.assets[0].height);
        console.log('Has EXIF:', result.assets[0].exif !== undefined);
        console.log('====================================');

        // Normalize EXIF rotation BEFORE showing cropper
        // This ensures the displayed image matches what will be cropped
        console.log('Normalizing library image before cropper...');
        const normalized = await manipulateAsync(
          result.assets[0].uri,
          [],
          { compress: 1, format: SaveFormat.JPEG }
        );
        console.log('Normalized URI for cropper:', normalized.uri);

        setSelectedImageUri(normalized.uri);
        setShowCropper(true);
      }
    } catch (error) {
      console.error('Error opening image library:', error);
      toast.error('Error', {
        description: 'Failed to open photo library. Please try again.',
      });
    }
  };

  const handleCropComplete = async (croppedUri: string) => {
    setShowCropper(false);
    await uploadProfileImage(croppedUri);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setSelectedImageUri(null);
  };

  // Use useFocusEffect to refresh data every time the screen comes into focus
  const loadData = useCallback(async () => {
    if (session?.user?.id) {
      setIsLoading(true);
      try {
        // Fetch profile data and achievements
        await fetchProfileData();
        await fetchAchievements();
        // await fetchMatchHistory(); // Commented until match system is ready
        
        // Show success toast only if this is a refresh (not initial load)
        if (hasLoadedBefore) {
          // toast.success('Profile Updated', {
          //   description: 'Your profile data has been refreshed.',
          // });
        } else {
          setHasLoadedBefore(true);
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
        toast.error('Error', {
          description: 'Failed to load profile data. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    }
  }, [session?.user?.id, hasLoadedBefore]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

    console.log('Current session:', session?.user.id);
  // Refresh function for pull-to-refresh
  const onRefresh = useCallback(async () => {
    console.log('ProfileScreen: Refreshing profile data...');
    setRefreshing(true);
    
    try {
      // Add haptic feedback for refresh
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Fetch fresh profile data and achievements
      await fetchProfileData();
      await fetchAchievements();
      
      console.log('ProfileScreen: Profile data refreshed successfully');
      
    } catch (error) {
      console.error('ProfileScreen: Error refreshing profile data:', error);
      toast.error('Error', {
        description: 'Failed to refresh profile data. Please try again.',
      });
    } finally {
      setRefreshing(false);
    }
  }, [session?.user?.id]);
  
  
  // Fallback data using team lead's original mock data for when API is not available
  // const { mockEloData, userData, gameTypeOptions } = require('../src/features/profile/data/mockData');
  
  // Transform API data to match frontend expectations using ProfileDataTransformer
  console.log('Transforming profile data:', profileData);
  console.log('Sports from API:', profileData?.sports);
  console.log('Skill ratings:', profileData?.skillRatings);
  
  const userData: any = ProfileDataTransformer.transformProfileToUserData(profileData, achievements);
  
  console.log('Final userData:', userData);
  
  // Update activeTab to user's first sport when userData is loaded (only on initial load)
  useEffect(() => {
    if (userData?.sports && userData.sports.length > 0 && userData.sports[0] !== 'No sports yet' && !hasLoadedBefore) {
      setActiveTab(userData.sports[0]);
    }
  }, [userData?.sports, hasLoadedBefore]);
  
  // Helper function to get rating values from skillRatings
  const getRatingForType = (sport: string, type: 'singles' | 'doubles') => {
    if (userData?.skillRatings && userData.skillRatings[sport.toLowerCase()]) {
      const rating = userData.skillRatings[sport.toLowerCase()];
      
      // Check for specific singles/doubles rating first
      if (type === 'singles' && rating.singles) {
        return Math.round(rating.singles * 1000); // Convert to display format
      } else if (type === 'doubles' && rating.doubles) {
        return Math.round(rating.doubles * 1000); // Convert to display format
      } else if (rating.rating) {
        // Fallback to general rating if specific type not available
        return Math.round(rating.rating * 1000);
      }
    }
    return 0; // Default to 0 if no rating available
  };
  
  const gameTypeOptions = ['Singles', 'Doubles']; // Static options
  
  // Calculate win rate from match history - placeholder until match system is implemented
  const calculateWinRate = () => {
    if (userData.name === 'Loading...') return 0; // Still loading
    
    // Check if user has match data
    const hasMatches = profileData?.totalMatches && profileData.totalMatches > 0;
    if (hasMatches) {
      // TODO: Calculate actual win rate from match history when matches exist
      return 0; // For now, return 0 until we have match data
    }
    return 0; // No matches yet
  };
  
  // Create ELO data based on actual rating values only
  const createEloData = () => {
    const currentSport = activeTab || userData.sports?.[0] || 'pickleball';
    const currentGameType = selectedGameType.toLowerCase();
    const currentRating = getRatingForType(currentSport, currentGameType as 'singles' | 'doubles');
    
    // Return single point with current rating if no matches played
    return [{
      date: 'Current Rating',
      time: '',
      rating: currentRating || 1400, // Use actual rating or default
      opponent: 'No matches played',
      result: '-' as any,
      score: '-',
      ratingChange: 0,
      league: `${currentSport} ${currentGameType}`,
      player1: userData.name || 'You',
      player2: 'No opponent',
      scores: { 
        set1: { player1: null, player2: null }, 
        set2: { player1: null, player2: null }, 
        set3: { player1: null, player2: null } 
      },
      status: 'upcoming' as const
    }];
  };
  
  const mockEloData = createEloData();
  
  // Using real API data instead of mock data


  // Show loading state while fetching data
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6de9a0"
            colors={["#6de9a0"]}
            progressBackgroundColor="#ffffff"
          />
        }
      >
        {/* Orange Header Background with Curved Bottom */}
        <ProfileHeaderWithCurve
          onBack={() => router.back()}
          onSettings={handleSettingsPress}
          showSettings={true}
        />

        {/* White Background */}
        <View style={styles.whiteBackground}>
          {/* Profile Picture Section */}
          <ProfilePictureSection
            imageUri={profileData?.image}
            isUploading={isUploadingImage}
            onPickImage={pickImage}
            isEditable={true}
          />

          {/* Profile Info Card */}
          <ProfileInfoCard
            name={userData.name}
            username={userData.username}
            bio={userData.bio}
            location={userData.location}
            gender={userData.gender}
            sports={userData.sports || []}
            activeSports={userData.activeSports || []}
            showActionButtons={false}
          />

          {/* Achievements */}
          <ProfileAchievementsCard
            achievements={userData.achievements || []}
          />

          {/* Sports */}
          <View style={styles.section}>
            <View style={styles.sportsHeader}>
              <Text style={styles.sectionTitle}>Sports</Text>
              <View style={styles.tabs}>
                {userData.sports?.map((sport) => (
                  <Pressable
                    key={sport}
                    style={[
                      styles.tab,
                      activeTab === sport && styles.tabActive
                    ]}
                    onPress={() => handleTabPress(sport)}
                  >
                    <Text style={[
                      styles.tabText,
                      activeTab === sport && styles.tabTextActive
                    ]}>
                      {sport}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* Skill Level */}
          <ProfileSkillLevelCard
            skillLevel={userData.skillLevel}
          />

          {/* DMR */}
          <View style={styles.skillLevelSection}>
            <View style={styles.dmrContainer}>
              {/* DMR Label and Ratings */}
              <View style={styles.dmrHeader}>
                <Text style={styles.skillLabel}>DMR - {activeTab}</Text>
                <View style={styles.dmrRatingsRow}>
                  <View style={styles.dmrItemVertical}>
                    <Text style={styles.dmrTypeLabel}>Singles</Text>
                    <View style={styles.ratingCircleSmall}>
                      <Text style={styles.ratingTextSmall}>
                        {getRatingForType(activeTab || 'pickleball', 'singles') || 'N/A'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.dmrItemVertical}>
                    <Text style={styles.dmrTypeLabel}>Doubles</Text>
                    <View style={styles.ratingCircleSmall}>
                      <Text style={styles.ratingTextSmall}>
                        {getRatingForType(activeTab || 'pickleball', 'doubles') || 'N/A'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              
              {/* Dropdown above graph */}
              <View style={styles.dropdownSection}>
                <InlineDropdown
                  options={gameTypeOptions}
                  selectedValue={selectedGameType}
                  onSelect={(value) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleGameTypeSelect(value);
                  }}
                />
              </View>
              
              {/* Match Details Box */}
              <MatchDetailsBox match={selectedMatch} profileData={profileData} />
              
              {/* ELO Progress Graph */}
              <EloProgressGraph 
                data={mockEloData} 
                onPointPress={handleGamePointPress}
              />
            </View>
          </View>

          <MatchHistoryButton
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigateTo('/match-history');
            }}
          />

          {/* League Stats Section */}
          <ProfileLeagueStatsCard
            activeTab={activeTab}
            selectedGameType={selectedGameType}
            gameTypeOptions={gameTypeOptions}
            onGameTypeSelect={handleGameTypeSelect}
            winRate={calculateWinRate()}
          />
        </View>
      </ScrollView>
      
      {/* Match Details Modal */}
      {/* {modalVisible && selectedGame && (
        <MatchDetailsModal
          match={selectedGame}
          onClose={handleModalClose}
        />
      )} */}

      {/* Circular Image Cropper Modal */}
      {selectedImageUri && (
        <CircularImageCropper
          visible={showCropper}
          imageUri={selectedImageUri}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.gray[50],
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    height: 290, // Adjusted height for the more concave curve
    position: 'relative',
  },
  orangeHeader: {
    height: 290,
    position: 'relative',
  },
  safeHeader: {
    flex: 1,
    paddingBottom: 150, // Space for the concave curve
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
    padding: theme.spacing.sm,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
    padding: theme.spacing.sm,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  concaveCurve: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  whiteBackground: {
    backgroundColor: theme.colors.neutral.gray[50], // Original gray background
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    marginTop: -1, // Slight overlap to ensure no gap
  },
  profileSection: {
    alignItems: 'center',
    marginTop: -180, // Position profile section higher for modern look
    position: 'relative',
    zIndex: 15,
    marginBottom: theme.spacing.lg,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  profileImageWrapper: {
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.neutral.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: theme.colors.neutral.white,
    shadowColor: theme.colors.neutral.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  defaultProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: theme.colors.neutral.white,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.neutral.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  editImageButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.neutral.white,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.neutral.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  profileInfoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.neutral.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    flex: 1,
  },
  genderIcon: {
    marginLeft: theme.spacing.xs,
  },
  actionIconsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionIcon: {
    padding: theme.spacing.sm,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  addFriendIcon: {
    borderColor: '#20659d',
    backgroundColor: '#f0f8ff',
  },
  name: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    fontFamily: theme.typography.fontFamily.primary,
    letterSpacing: -0.3,
  },
  username: {
    color: '#6b7280',
    marginBottom: theme.spacing.sm,
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: '500' as const,
  },
  bio: {
    color: '#9ca3af',
    marginBottom: theme.spacing.md,
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.primary,
    lineHeight: 18,
    fontWeight: '400' as any,
  },
  locationSportsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    flex: 1,
  },
  locationText: {
    color: '#9ca3af',
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: '400' as any,
  },
  sportsContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  sportsLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: theme.colors.neutral.gray[500],
    marginBottom: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sportsPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    justifyContent: 'flex-end',
  },
  sportPill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 6,
    alignItems: 'center',
  },
  sportPillText: {
    color: theme.colors.neutral.white,
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: '600' as const,
    opacity: 0.95,
  },
  moreSportsText: {
    color: theme.colors.neutral.gray[500],
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: '500' as const,
    marginLeft: theme.spacing.xs,
    alignSelf: 'center',
  },
  section: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.fontFamily.primary,
    letterSpacing: -0.3,
  },
  achievementContainer: {
    backgroundColor: '#ffffff',
    padding: theme.spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: theme.colors.neutral.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  achievementsContent: {
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  achievementItem: {
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
  },
  achievementTextContainer: {
    marginTop: theme.spacing.xs,
    alignItems: 'center',
  },
  achievementText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.neutral.gray[600],
    fontFamily: theme.typography.fontFamily.primary,
    textAlign: 'center',
  },
  achievementYear: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.neutral.gray[400],
    fontFamily: theme.typography.fontFamily.primary,
  },
  achievementChevron: {
    marginLeft: theme.spacing.sm,
  },
  noAchievementsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
  },
  noAchievementsText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.neutral.gray[600],
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: theme.typography.fontWeight.medium,
    marginTop: theme.spacing.sm,
  },
  noAchievementsSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.neutral.gray[400],
    fontFamily: theme.typography.fontFamily.primary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  sportsHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing.xl,
  },
  tabs: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginLeft: theme.spacing.md,
  },
  tab: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    position: 'relative',
    borderRadius: theme.borderRadius.sm,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    color: '#9ca3af',
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: '500' as const,
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: '600' as const,
  },
  skillContainer: {
    backgroundColor: '#ffffff',
    padding: theme.spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xl * 3,
    shadowColor: theme.colors.neutral.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  dmrContainer: {
    backgroundColor: '#ffffff',
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: theme.colors.neutral.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  skillLevelSection: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  dmrValues: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.xl * 2,
    marginTop: theme.spacing.md,
  },
  dmrItem: {
    alignItems: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  doublesItem: {
    marginLeft: theme.spacing.sm,
  },
  dropdownSection: {
    marginTop: theme.spacing.md,
  },
  dropdown: {
    backgroundColor: theme.colors.neutral.white,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.neutral.gray[300],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: 80,
    position: 'absolute',
    bottom: theme.spacing.md,
    left: theme.spacing.xl,
  },
  dmrHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
    paddingLeft: theme.spacing.md,
  },
  dmrRatingsRow: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginRight: theme.spacing.md,
  },
  dmrItemVertical: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  dmrTypeLabel: {
    color: theme.colors.neutral.gray[600],
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: theme.typography.fontWeight.medium as any,
    marginBottom: theme.spacing.xs,
  },
  dmrItemHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  ratingCircleSmall: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fef7f0',
    borderWidth: 2,
    borderColor: '#fea04d',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#fea04d',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  ratingTextSmall: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700' as const,
    fontFamily: theme.typography.fontFamily.primary,
  },
  ratingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.neutral.gray[50],
    borderWidth: 3,
    borderColor: '#fea04d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingText: {
    color: theme.colors.neutral.gray[700],
    fontSize: theme.typography.fontSize.base,
    fontWeight: 'bold' as const,
    fontFamily: theme.typography.fontFamily.primary,
  },
  skillLabel: {
    color: '#111827',
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: '600' as const,
  },
  dmrLabel: {
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  skillValue: {
    color: '#6b7280',
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: '500' as const,
  },
  statsSection: {
    marginTop: theme.spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: theme.colors.neutral.gray[50],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.neutral.gray[700],
    fontFamily: theme.typography.fontFamily.primary,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.neutral.gray[500],
    marginTop: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily.primary,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.neutral.gray[200],
  },
  matchHistoryContainer: {
    backgroundColor: theme.colors.neutral.white,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.neutral.gray[100],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchHistoryText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '500' as const,
    color: theme.colors.neutral.gray[600],
    fontFamily: theme.typography.fontFamily.primary,
    marginLeft: theme.spacing.sm,
  },
  // Graph styles
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.lg,
    width: '100%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.neutral.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalContentLarge: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.lg,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.neutral.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalScrollView: {
    flexGrow: 1,
  },
  modalScrollContent: {
    paddingBottom: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.gray[100],
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.neutral.gray[700],
    fontFamily: theme.typography.fontFamily.primary,
  },
  modalCloseButton: {
    padding: theme.spacing.xs,
  },
  modalBody: {
    padding: theme.spacing.lg,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.gray[50],
  },
  modalLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.neutral.gray[500],
    fontFamily: theme.typography.fontFamily.primary,
  },
  modalValue: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.neutral.gray[700],
    fontWeight: theme.typography.fontWeight.medium as any,
    fontFamily: theme.typography.fontFamily.primary,
  },
  modalValueLarge: {
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold as any,
    fontFamily: theme.typography.fontFamily.primary,
  },
  resultBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  winBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  lossBadge: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  resultText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold as any,
    fontFamily: theme.typography.fontFamily.primary,
  },
  // Match Details Card Styles (compact version for modal)
  matchDetailsCard: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomLeftRadius: theme.borderRadius.lg,
    borderBottomRightRadius: theme.borderRadius.lg,
  },
  leagueNameContainer: {
    backgroundColor: '#feecdb',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.md,
    alignSelf: 'flex-start',
  },
  leagueName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.primary,
  },
  scoreboardContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  profileIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.neutral.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    height: 28,
    marginBottom: theme.spacing.xs,
  },
  playerColumn: {
    flex: 2,
    justifyContent: 'flex-end',
  },
  setColumn: {
    flex: 0.8,
    alignItems: 'center',
  },
  playerName: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.neutral.gray[700],
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  setHeader: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.neutral.gray[500],
    fontFamily: theme.typography.fontFamily.primary,
    marginBottom: theme.spacing.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  score: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.neutral.gray[700],
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: theme.typography.fontWeight.bold,
    height: 28,
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.neutral.gray[200],
    marginVertical: theme.spacing.md,
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  dateTimeContainer: {
    flexDirection: 'column',
  },
  dateText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.neutral.gray[600],
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  timeText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.neutral.gray[500],
    fontFamily: theme.typography.fontFamily.primary,
    marginTop: 2,
  },
  statusContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    fontFamily: theme.typography.fontFamily.primary,
    textTransform: 'uppercase',
  },
  ratingChangeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    paddingBottom: 0,
    marginBottom: 0,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.gray[100],
  },
  ratingChangeLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.neutral.gray[600],
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: 0,
  },
  ratingChangeValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    fontFamily: theme.typography.fontFamily.primary,
    marginBottom: 0,
  },
  // League Stats Styles  
  leagueStatsContainer: {
    backgroundColor: '#ffffff',
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: theme.colors.neutral.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
  },
  winRateContainer: {
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  winRateLegend: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.neutral.gray[700],
    fontFamily: theme.typography.fontFamily.primary,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.neutral.gray[600],
    fontFamily: theme.typography.fontFamily.primary,
  },
  uploadingContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: theme.colors.neutral.white,
  },
  // Match Details Box Styles
  matchDetailsBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: theme.colors.neutral.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  matchDetailsContent: {
    padding: theme.spacing.md,
  },
  emptyMatchDetails: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMatchDetailsText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.neutral.gray[500],
    fontFamily: theme.typography.fontFamily.primary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  matchTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  matchDateText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.neutral.gray[600],
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  matchRatingChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchRatingChangeText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    fontFamily: theme.typography.fontFamily.primary,
  },
  matchRatingChangeArrow: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: theme.typography.fontWeight.bold,
  },
  matchPlayersContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  matchPlayerColumn: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  matchPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  matchProfileImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  matchDefaultProfileIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.neutral.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchProfileIconText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: theme.colors.neutral.white,
    fontFamily: theme.typography.fontFamily.primary,
  },
  matchPlayerName: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: theme.colors.neutral.gray[700],
    fontFamily: theme.typography.fontFamily.primary,
  },
  matchSetColumn: {
    alignItems: 'center',
    gap: theme.spacing.xs,
    minWidth: 50,
  },
  matchSetHeader: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: theme.colors.neutral.gray[600],
    fontFamily: theme.typography.fontFamily.primary,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
  },
  matchScore: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: theme.colors.neutral.gray[700],
    fontFamily: theme.typography.fontFamily.primary,
    textAlign: 'center',
    minHeight: 20,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.neutral.white,
    borderRadius: 6,
    minWidth: 36,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
});