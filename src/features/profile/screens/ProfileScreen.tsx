import { useNavigationManager } from '@core/navigation';
import { theme } from '@core/theme/theme';
import * as Haptics from 'expo-haptics';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState, useRef } from 'react';
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
import { CircularImageCropper } from '../../onboarding/components';
import {
  EloProgressGraph,
  InlineDropdown,
  MatchHistoryButton,
  ProfileAchievementsCard,
  ProfileHeaderWithCurve,
  ProfileInfoCard,
  ProfileLeagueStatsCard,
  ProfilePictureSection,
  ProfileSkillLevelCard,
  ProfileSportsSection,
  ProfileDMRCard,
} from '../components';
import { getBackendBaseURL } from '@/config/network';
import { authClient, useSession } from '@/lib/auth-client';
import * as SecureStore from 'expo-secure-store';
import { toast } from 'sonner-native';
import { useProfileHandlers } from '../hooks/useProfileHandlers';
import { useProfileState } from '../hooks/useProfileState';
import { ProfileDataTransformer } from '../services/ProfileDataTransformer';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const hasInitializedSport = useRef(false);

  // Profile state and handlers
  const {
    activeTab,
    selectedGameType,
    selectedMatch,
    gameTypeOptions,
    modalVisible,
    setActiveTab,
    setSelectedGameType,
    setSelectedGame,
    setModalVisible,
  } = useProfileState();

  const {
    handleSettingsPress,
    handleTabPress,
    handleGameTypeSelect,
    handleGamePointPress,
  } = useProfileHandlers({
    setActiveTab,
    setSelectedGameType,
    setSelectedGame,
    setModalVisible,
  });

  const { navigateTo } = useNavigationManager();

  // Fetch profile data
  const fetchProfileData = useCallback(async () => {
    try {
      if (!session?.user?.id) {
        console.log('No user session');
        setIsLoading(false);
        return;
      }

      const backendUrl = getBackendBaseURL();

      // Fetch profile and achievements in parallel
      const [profileResponse, achievementsResponse] = await Promise.all([
        authClient.$fetch(`${backendUrl}/api/player/profile/me`, { method: 'GET' }),
        authClient.$fetch(`${backendUrl}/api/player/profile/achievements`, { method: 'GET' })
      ]);

      // API response structure: response.data.data contains the actual profile
      if (profileResponse && (profileResponse as any).data?.data) {
        console.log('Setting profile data (nested):', (profileResponse as any).data.data);
        setProfileData((profileResponse as any).data.data);
      } else if (profileResponse && (profileResponse as any).data) {
        console.log('Setting profile data (direct):', (profileResponse as any).data);
        setProfileData((profileResponse as any).data);
      }

      if (achievementsResponse && (achievementsResponse as any).data?.achievements) {
        setAchievements((achievementsResponse as any).data.achievements);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Error', {
        description: 'Failed to load profile data',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [fetchProfileData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfileData();
    setRefreshing(false);
  }, [fetchProfileData]);

  // Transform profile data for display
  const userData = ProfileDataTransformer.transformProfileToUserData(profileData, achievements);

  // Auto-select first available sport when profile data loads
  useEffect(() => {
    if (!hasInitializedSport.current && userData?.sports && userData.sports.length > 0 && userData.sports[0] !== 'No sports yet') {
      const firstSport = userData.sports[0];
      // Only update if the current activeTab is the default 'Tennis' or not in the sports list
      if (activeTab === 'Tennis' || !userData.sports.includes(activeTab)) {
        setActiveTab(firstSport);
        hasInitializedSport.current = true;
      }
    }
  }, [userData?.sports, activeTab, setActiveTab]);

  // Image handling functions
  const handleCropComplete = async (croppedImageUri: string) => {
    setSelectedImageUri(null);
    setShowCropper(false);
    await uploadProfilePicture(croppedImageUri);
  };

  const handleCropCancel = () => {
    setSelectedImageUri(null);
    setShowCropper(false);
  };

  const uploadProfilePicture = async (imageUri: string) => {
    try {
      setIsUploadingImage(true);
      const backendUrl = getBackendBaseURL();

      const formData = new FormData();
      const imageFile: any = {
        uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
        type: 'image/jpeg',
        name: 'profile-picture.jpg',
      };
      formData.append('image', imageFile);

      const response = await fetch(`${backendUrl}/api/player/profile/picture`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${await SecureStore.getItemAsync('better-auth.session_token')}`,
        },
      });

      const result = await response.json();

      if (response.ok && result.data?.url) {
        setProfileData((prev: any) => ({
          ...prev,
          image: result.data.url,
        }));
        toast.success('Success', {
          description: 'Profile picture updated successfully!',
        });
      } else {
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
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your photo library to upload a profile picture.',
          [{ text: 'OK' }]
        );
        return;
      }

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
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        const normalized = await manipulateAsync(
          result.assets[0].uri,
          [],
          { compress: 1, format: SaveFormat.JPEG }
        );
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
        setSelectedImageUri(result.assets[0].uri);
        setShowCropper(true);
      }
    } catch (error) {
      console.error('Error opening image library:', error);
      toast.error('Error', {
        description: 'Failed to open image library. Please try again.',
      });
    }
  };

  // Helper functions
  const getRatingForType = (sport: string, type: 'singles' | 'doubles') => {
    const normalizedSport = sport.toLowerCase();
    const rating = profileData?.skillRatings?.[normalizedSport]?.[type];
    // Ratings are stored divided by 1000 in the database, multiply by 1000 to display
    if (rating !== undefined && rating !== null) {
      return Math.round(rating * 1000);
    }
    return 0;
  };

  const calculateWinRate = () => {
    const stats = userData.leagueStats?.[activeTab]?.[selectedGameType];
    if (!stats || stats.totalMatches === 0) return 0;
    return Math.round((stats.wins / stats.totalMatches) * 100);
  };

  const createEloData = () => {
    const currentSport = activeTab || userData.sports?.[0] || 'pickleball';
    const currentGameType = selectedGameType.toLowerCase();
    const currentRating = getRatingForType(currentSport, currentGameType as 'singles' | 'doubles');

    return [{
      date: 'Current Rating',
      time: '',
      rating: currentRating || 1400,
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
        {/* Header with Curve */}
        <ProfileHeaderWithCurve
          onBack={() => router.back()}
          onSettings={handleSettingsPress}
          showSettings={true}
        />

        {/* Content */}
        <View style={styles.whiteBackground}>
          {/* Profile Picture */}
          <ProfilePictureSection
            imageUri={profileData?.image}
            isUploading={isUploadingImage}
            onPickImage={pickImage}
            isEditable={true}
          />

          {/* Profile Info */}
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

          {/* Sports Tabs */}
          <ProfileSportsSection
            sports={userData.sports || []}
            activeTab={activeTab}
            onTabPress={(sport) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleTabPress(sport);
            }}
          />

          {/* Skill Level */}
          <ProfileSkillLevelCard
            skillLevel={userData.skillLevel}
          />

          {/* DMR with Graph */}
          <ProfileDMRCard
            activeTab={activeTab}
            selectedGameType={selectedGameType}
            gameTypeOptions={gameTypeOptions}
            onGameTypeSelect={handleGameTypeSelect}
            getRatingForType={getRatingForType}
            eloData={mockEloData}
            onPointPress={handleGamePointPress}
            selectedMatch={selectedMatch}
            profileData={profileData}
          />

          {/* Match History Button */}
          <MatchHistoryButton
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigateTo('/match-history');
            }}
          />

          {/* League Stats */}
          <ProfileLeagueStatsCard
            activeTab={activeTab}
            selectedGameType={selectedGameType}
            gameTypeOptions={gameTypeOptions}
            onGameTypeSelect={handleGameTypeSelect}
            winRate={calculateWinRate()}
          />
        </View>
      </ScrollView>

      {/* Image Cropper Modal */}
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.neutral.gray[600],
    fontFamily: theme.typography.fontFamily.primary,
  },
  whiteBackground: {
    backgroundColor: '#ffffff',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing['2xl'],
    minHeight: '100%',
  },
});
