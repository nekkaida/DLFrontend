import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Linking,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '../OnboardingContext';
import Svg, { G, Path, Defs, ClipPath, Rect } from 'react-native-svg';
import { BackgroundGradient } from '../components';
import * as Location from 'expo-location';
import { questionnaireAPI, LocationSearchResult } from '../services/api';
import { useSession } from '@/lib/auth-client';
import { toast } from 'sonner-native';

const LocationIcon = ({ color = "#6C7278" }: { color?: string }) => (
  <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <Path
      d="M9 1.5C5.685 1.5 3 4.185 3 7.5C3 11.25 9 16.5 9 16.5C9 16.5 15 11.25 15 7.5C15 4.185 12.315 1.5 9 1.5Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 9.75C10.2426 9.75 11.25 8.74264 11.25 7.5C11.25 6.25736 10.2426 5.25 9 5.25C7.75736 5.25 6.75 6.25736 6.75 7.5C6.75 8.74264 7.75736 9.75 9 9.75Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SearchIcon = ({ color = "#FEA04D" }: { color?: string }) => (
  <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <Path
      d="M16.6 18L10.3 11.7C9.8 12.1 9.225 12.4167 8.575 12.65C7.925 12.8833 7.23333 13 6.5 13C4.68333 13 3.14583 12.3708 1.8875 11.1125C0.629167 9.85417 0 8.31667 0 6.5C0 4.68333 0.629167 3.14583 1.8875 1.8875C3.14583 0.629167 4.68333 0 6.5 0C8.31667 0 9.85417 0.629167 11.1125 1.8875C12.3708 3.14583 13 4.68333 13 6.5C13 7.23333 12.8833 7.925 12.65 8.575C12.4167 9.225 12.1 9.8 11.7 10.3L18 16.6L16.6 18ZM6.5 11C7.75 11 8.8125 10.5625 9.6875 9.6875C10.5625 8.8125 11 7.75 11 6.5C11 5.25 10.5625 4.1875 9.6875 3.3125C8.8125 2.4375 7.75 2 6.5 2C5.25 2 4.1875 2.4375 3.3125 3.3125C2.4375 4.1875 2 5.25 2 6.5C2 7.75 2.4375 8.8125 3.3125 9.6875C4.1875 10.5625 5.25 11 6.5 11Z"
      fill={color}
      fillOpacity="0.9"
    />
  </Svg>
);

const ClearIcon = ({ color = "rgba(254, 160, 77, 0.9)" }: { color?: string }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6L18 18"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const NavigationIcon: React.FC<{ filled?: boolean }> = ({ filled = false }) => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <Path
      d="M0.319584 10.1107C0.6662 10.4573 1.01282 10.5664 1.69675 10.5664L9.19632 10.6061C9.26564 10.6061 9.32482 10.6061 9.35483 10.6454C9.38442 10.675 9.39415 10.7346 9.39415 10.7942L9.42373 18.3037C9.43388 18.9872 9.54294 19.3338 9.88955 19.6804C10.3554 20.156 11.0093 20.0769 11.4945 19.6014C11.7524 19.3435 11.9604 18.9179 12.1485 18.5214L19.7275 2.17558C20.1236 1.34372 20.0741 0.729132 19.6683 0.322927C19.2714 -0.0731328 18.6572 -0.122588 17.8254 0.273473L1.47863 7.8523C1.08214 8.0404 0.656478 8.24836 0.39863 8.5062C-0.07691 8.99145 -0.155955 9.6352 0.319584 10.1107Z"
      fill={filled ? "#4DABFE" : "#BABABA"}
      fillOpacity="0.9"
    />
  </Svg>
);


const LocationScreen = () => {
  const { data, updateData } = useOnboarding();
  const { data: session } = useSession();
  const [location, setLocation] = useState(data.location || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSearchingLocations, setIsSearchingLocations] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSearchResult[]>([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [locationServicesEnabled, setLocationServicesEnabled] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [currentLocationData, setCurrentLocationData] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);
  const textInputRef = useRef<TextInput>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Check location permission status on mount
  useEffect(() => {
    const checkInitialPermissions = async () => {
      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        setLocationServicesEnabled(servicesEnabled);

        const { status } = await Location.getForegroundPermissionsAsync();
        const permissionGranted = status === 'granted';
        setLocationPermissionGranted(permissionGranted);

        // If services are disabled or permission not granted, reset useCurrentLocation
        if (!servicesEnabled || !permissionGranted) {
          setUseCurrentLocation(false);
        }
      } catch (error) {
        console.log('Error checking initial permissions:', error);
        setUseCurrentLocation(false);
      }
    };

    checkInitialPermissions();
  }, []);

  /**
   * Search for locations using the API
   *
   * BACKEND IMPLEMENTATION NEEDED:
   * Create endpoint: GET /api/locations/search?q={query}&limit={limit}
   *
   * Recommended Services:
   * 1. Google Places API (Autocomplete) - Most accurate, requires API key
   *    - Provides: formatted_address, geometry (lat/lng), components (city, postcode, state)
   *    - Format: "Bandar Sunway, 47500 Selangor"
   *
   * 2. Mapbox Geocoding API - Good alternative, requires API key
   *    - Similar structure to Google Places
   *
   * 3. Nominatim (OpenStreetMap) - Free, but less detailed
   *    - No API key needed, but rate-limited
   *
   * Expected Response Format:
   * {
   *   success: true,
   *   results: [{
   *     id: string,
   *     formatted_address: "Bandar Sunway, 47500 Selangor",
   *     geometry: { location: { lat: number, lng: number } },
   *     components: { city: string, postcode: string, state: string }
   *   }]
   * }
   */
  const searchLocations = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setLocationSuggestions([]);
      return;
    }

    try {
      setIsSearchingLocations(true);
      console.log('🔍 Searching locations for:', query);

      const response = await questionnaireAPI.searchLocations(query.trim(), 5);

      if (response.success && response.results) {
        console.log(`✅ Found ${response.results.length} locations via API`);
        setLocationSuggestions(response.results);
      } else {
        console.log('⚠️ API returned no locations, using fallback');
        useFallbackLocationSearch(query);
      }
    } catch (error) {
      console.error('❌ Error searching locations via API, using fallback:', error);
      useFallbackLocationSearch(query);
    } finally {
      setIsSearchingLocations(false);
    }
  };

  // Fallback location search - show no results if API fails
  const useFallbackLocationSearch = (query: string) => {
    console.log('🔄 API failed, showing no results');
    setLocationSuggestions([]);
  };

  // Debounced search function
  const debouncedSearch = (query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(query);
    }, 300); // 300ms delay
  };

  // Fallback reverse geocoding using expo-location
  const fallbackReverseGeocode = async (latitude: number, longitude: number) => {
    try {
      console.log('🔄 Using expo-location fallback for reverse geocoding...');
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode && reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        console.log('✅ Expo-location reverse geocode result:', address);

        // Format: "City, Postcode State" (e.g., "Bandar Sunway, 47500 Selangor")
        const city = address.city || address.subregion || address.district || '';
        const postcode = address.postalCode || '';
        const state = address.region || '';

        let formattedAddress = '';
        if (city && postcode && state) {
          formattedAddress = `${city}, ${postcode} ${state}`;
        } else if (city && state) {
          formattedAddress = `${city}, ${state}`;
        } else if (city) {
          formattedAddress = city;
        } else {
          formattedAddress = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        }

        console.log('✅ Formatted address:', formattedAddress);

        setCurrentLocationData({
          latitude,
          longitude,
          address: formattedAddress,
        });

        setLocation(formattedAddress);
        setShowSuggestions(false);
      } else {
        console.log('⚠️ Expo-location also returned no address, using coordinates');
        setCurrentLocationData({
          latitude,
          longitude,
        });
        
        setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }
    } catch (fallbackError) {
      console.log('⚠️ Expo-location fallback also failed, using coordinates:', fallbackError);
      setCurrentLocationData({
        latitude,
        longitude,
      });
      
      setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    }
  };

  // Function to check if location services are enabled
  const checkLocationServices = async () => {
    try {
      const isEnabled = await Location.hasServicesEnabledAsync();
      console.log('📍 Location services enabled:', isEnabled);
      return isEnabled;
    } catch (error) {
      console.log('⚠️ Could not check location services status:', error);
      return true; // Assume enabled if we can't check
    }
  };

  // Function to request location permissions and fetch current location
  const getCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);
      console.log('🔍 Starting location permission request...');

      // First check if location services are enabled
      const servicesEnabled = await checkLocationServices();
      setLocationServicesEnabled(servicesEnabled);

      if (!servicesEnabled) {
        console.log('❌ Location services are disabled');
        setUseCurrentLocation(false);
        setLocationPermissionGranted(false);
        setIsLoadingLocation(false);

        // Show alert with option to open settings
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services in your device settings to use your current location.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
        return;
      }

      // Check current permission status
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
      console.log('📍 Current permission status:', currentStatus);

      let finalStatus = currentStatus;

      // Request permission if not already granted
      if (currentStatus !== 'granted') {
        console.log('🔐 Requesting location permission...');
        const { status: requestStatus } = await Location.requestForegroundPermissionsAsync();
        finalStatus = requestStatus;
        console.log('📍 Permission request result:', requestStatus);
      }

      setLocationPermissionGranted(finalStatus === 'granted');

      if (finalStatus !== 'granted') {
        console.log('❌ Location permission denied');
        setUseCurrentLocation(false);
        setIsLoadingLocation(false);

        // Show alert with option to open settings
        Alert.alert(
          'Location Permission Required',
          'Location permission is required to use your current location. Please enable location access in your app settings.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
        return;
      }

      console.log('✅ Location permission granted, fetching location...');

      // Get current position
      console.log('📡 Getting GPS coordinates...');
      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = locationResult.coords;
      console.log('📍 GPS coordinates:', latitude, longitude);
      
      // Reverse geocode to get address - prioritize expo-location for better results
      console.log('🗺️ Converting coordinates to address...');
      
      // Try expo-location first since it gives better results
      try {
        await fallbackReverseGeocode(latitude, longitude);
      } catch (expoError) {
        console.log('⚠️ Expo-location failed, trying API fallback:', expoError);
        
        // Fallback to API if expo-location fails
        try {
          const reverseGeocodeResponse = await questionnaireAPI.reverseGeocode(latitude, longitude);
          
          if (reverseGeocodeResponse.success && reverseGeocodeResponse.address) {
            console.log('✅ API reverse geocode result:', reverseGeocodeResponse.address);
            
            setCurrentLocationData({
              latitude,
              longitude,
              address: reverseGeocodeResponse.address,
            });
            
            setLocation(reverseGeocodeResponse.address);
            setShowSuggestions(false);
          } else {
            console.log('⚠️ API also returned no address, using coordinates');
            setCurrentLocationData({
              latitude,
              longitude,
            });
            
            setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        } catch (apiError) {
          console.log('⚠️ API also failed, using coordinates:', apiError);
          setCurrentLocationData({
            latitude,
            longitude,
          });
          
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
      }

    } catch (error: any) {
      console.error('❌ Error getting location:', error);
      
      let errorMessage = 'Unable to get your current location. Please try again or enter your location manually.';
      let errorTitle = 'Location Error';
      
      // Handle specific error cases
      if (error.message?.includes('location services are enabled')) {
        errorTitle = 'Location Services Disabled';
        errorMessage = 'Please enable location services in your device settings and try again.';
      } else if (error.message?.includes('timeout')) {
        errorTitle = 'Location Timeout';
        errorMessage = 'Location request timed out. Please check your GPS signal and try again.';
      } else if (error.message?.includes('network')) {
        errorTitle = 'Network Error';
        errorMessage = 'Network error while getting location. Please check your internet connection.';
      }
      
      toast.error(errorTitle, {
        description: errorMessage,
      });
      setUseCurrentLocation(false);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Helper function to parse location string into components
  const parseLocationString = (locationString: string) => {
    // Handle common location formats: "City, State Country" or "City, State" or "City"
    const parts = locationString.split(',').map(part => part.trim());
    
    if (parts.length >= 3) {
      // Format: "City, State, Country"
      return {
        city: parts[0],
        state: parts[1],
        country: parts.slice(2).join(', ')
      };
    } else if (parts.length === 2) {
      // Format: "City, State" (country unknown - do not assume)
      return {
        city: parts[0],
        state: parts[1],
        country: ''
      };
    } else {
      // Format: "City" only
      return {
        city: parts[0],
        state: 'Unknown',
        country: 'Unknown'
      };
    }
  };

  // Function to save location to backend
  const saveLocationToBackend = async (locationString: string, coordinates?: { latitude: number; longitude: number }) => {
    try {
      if (!session?.user?.id) {
        console.warn('No user session available, skipping backend save');
        return;
      }

      const parsedLocation = parseLocationString(locationString);
      
      // Only send city and state data
      let locationData = {
        city: parsedLocation.city || '',
        state: parsedLocation.state || '',
        ...(coordinates && {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        })
      };

      console.log('Saving location data:', locationData);

      await questionnaireAPI.saveUserLocation(session.user.id, locationData);
      console.log('Location saved to backend successfully');
    } catch (error) {
      console.error('Failed to save location to backend:', error);
      // Don't block the user flow if backend save fails
    }
  };

  // Update context when local state changes
  useEffect(() => {
    const updateDataWithCoordinates = {
      location,
      useCurrentLocation,
      ...(currentLocationData && {
        latitude: currentLocationData.latitude,
        longitude: currentLocationData.longitude,
      })
    };
    updateData(updateDataWithCoordinates);
  }, [location, useCurrentLocation, currentLocationData]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Animate suggestions container
  useEffect(() => {
    if (showSuggestions && locationSuggestions.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [showSuggestions, locationSuggestions.length]);

  // Clear input function
  const clearInput = () => {
    setLocation('');
    setShowSuggestions(false);
    setLocationSuggestions([]);
    textInputRef.current?.focus();
  };

  const handleNext = async () => {
    if (location || useCurrentLocation) {
      const finalData = {
        location,
        useCurrentLocation,
        ...(currentLocationData && {
          latitude: currentLocationData.latitude,
          longitude: currentLocationData.longitude,
        })
      };
      
      // Update local context
      updateData(finalData);
      
      // Save to backend (don't block navigation if this fails)
      if (location) {
        await saveLocationToBackend(
          location, 
          currentLocationData ? {
            latitude: currentLocationData.latitude,
            longitude: currentLocationData.longitude
          } : undefined
        );
      }
      
      // Mark basic onboarding as completed (personal info + location)
      try {
        if (session?.user?.id) {
          await questionnaireAPI.completeOnboarding(session.user.id);
          console.log('Basic onboarding completed (personal info + location)');
        }
      } catch (error) {
        console.error('Error completing basic onboarding:', error);
      }

      // Navigate to sport assessment (optional step)
      router.push('/onboarding/game-select');
    }
  };

  const selectLocation = (locationResult: LocationSearchResult) => {
    setLocation(locationResult.formatted_address);
    setShowSuggestions(false);
    setUseCurrentLocation(false);

    // Set coordinates from the selected location
    setCurrentLocationData({
      latitude: locationResult.geometry.location.lat,
      longitude: locationResult.geometry.location.lng,
      address: locationResult.formatted_address,
    });

    // If structured components are provided, persist immediately
    if (locationResult.components && session?.user?.id) {
      questionnaireAPI
        .saveUserLocation(session.user.id, {
          state: locationResult.components.state || '',
          city: locationResult.components.city || '',
          latitude: locationResult.geometry.location.lat,
          longitude: locationResult.geometry.location.lng,
        })
        .then(() => console.log('Location saved to backend successfully'))
        .catch((e) => console.error('Failed to save location to backend:', e));
    }
  };

  // Handle current location button press
  const handleCurrentLocationPress = async () => {
    console.log('👆 Current location button pressed');
    const newUseCurrentLocation = !useCurrentLocation;
    console.log('🔄 Toggling useCurrentLocation to:', newUseCurrentLocation);
    
    if (newUseCurrentLocation) {
      // User wants to use current location - fetch it
      console.log('📍 User wants to use current location');
      setUseCurrentLocation(true);
      setLocation('');
      setShowSuggestions(false);
      await getCurrentLocation();
    } else {
      // User is turning off current location
      console.log('❌ User is turning off current location');
      setUseCurrentLocation(false);
      setCurrentLocationData(null);
      setLocation('');
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <BackgroundGradient />

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <Path
            d="M22.5 27L13.5 18L22.5 9"
            stroke="#000000"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Svg width="35" height="37" viewBox="0 0 67 71" fill="none">
          <Defs>
            <ClipPath id="clip0_1273_1964">
              <Rect width="67" height="71" fill="white"/>
            </ClipPath>
          </Defs>
          <G clipPath="url(#clip0_1273_1964)">
            <Path d="M66.9952 35.2153C66.9769 35.9135 66.9083 36.6208 66.7848 37.3281C64.9275 48.0714 50.9017 59.5725 19.7851 70.9404C18.9983 71.2252 18.2846 70.5086 18.4676 69.6911C23.399 47.3457 22.7586 14.6934 18.1382 1.29534C17.8729 0.537481 18.646 -0.19282 19.4145 0.0506138C47.9694 9.11738 67.3521 21.482 66.9952 35.2153Z" fill="#44A7DE"/>
            <Path d="M20.6226 35.2153V37.3282H21.1303V35.2153H20.6226Z" stroke="#ED2124" strokeMiterlimit="10"/>
            <Path d="M22.3879 8.15321C21.6972 7.8271 20.9973 7.50558 20.2836 7.18866C14.5973 4.6303 8.22489 2.24649 1.31263 0.0509927C0.548666 -0.192441 -0.1787 0.519488 0.0363074 1.29572C6.46823 24.6929 7.2139 47.4425 0.365681 69.6914C0.118651 70.4906 0.900912 71.2255 1.68317 70.9408C8.74182 68.3595 14.9267 65.7735 20.2836 63.1876C21.0018 62.8477 21.7017 62.4987 22.3879 62.1542C39.2088 53.7029 47.3059 45.3067 48.6875 37.3285C48.811 36.6212 48.8796 35.9138 48.8979 35.2157C49.1587 25.2211 38.9664 15.9523 22.3879 8.15321ZM22.3879 46.8408C21.9808 47.0108 21.5599 47.1761 21.1299 47.3461V37.3285H20.6221V35.2157H21.1299V24.8812C21.5599 25.0879 21.9762 25.2946 22.3879 25.5013C28.7878 28.7119 33.0377 31.9454 34.0349 35.2157C34.25 35.9184 34.3186 36.6212 34.2179 37.3285C33.7879 40.461 30.1694 43.6348 22.3879 46.8408Z" fill="#195E9A"/>
            <Path d="M34.0349 35.2148C34.2499 35.9176 34.3185 36.6203 34.2179 37.3277H20.6221V35.2148H34.0349Z" fill="white"/>
            <Path d="M66.9952 35.2148C66.9769 35.913 66.9082 36.6203 66.7847 37.3277H48.6875C48.811 36.6203 48.8796 35.913 48.8979 35.2148H66.9952Z" fill="white"/>
            <Path d="M22.388 8.15254V62.1535C21.7018 62.498 21.0019 62.8471 20.2837 63.187V7.18799C20.9973 7.50491 21.6973 7.82643 22.388 8.15254Z" fill="white"/>
          </G>
        </Svg>
      </View>

      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Where would you like to play?</Text>
        <Text style={styles.subtitle}>Find matches near you...</Text>
        {useCurrentLocation && isLoadingLocation && (
          <Text style={styles.helpText}>
            Make sure location services are enabled in your device settings
          </Text>
        )}
      </View>

      {/* Search Input with Icons */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <View style={styles.inputGroup}>
            <View style={[
              styles.inputWithIcon,
              isInputFocused && styles.inputWithIconFocused,
              location && styles.inputWithIconFilled
            ]}>
              {/* Left: GPS/Location Icon */}
              <TouchableOpacity
                style={styles.locationIconContainer}
                onPress={handleCurrentLocationPress}
                disabled={isLoadingLocation}
              >
                {isLoadingLocation ? (
                  <ActivityIndicator size="small" color="rgba(77, 171, 254, 0.9)" />
                ) : (
                  <NavigationIcon filled={locationServicesEnabled && locationPermissionGranted && useCurrentLocation} />
                )}
              </TouchableOpacity>

              {/* Center: Text Input */}
              <TextInput
                ref={textInputRef}
                style={styles.input}
                placeholder="Search or enter postcode..."
                placeholderTextColor="#BABABA"
                value={location}
                onChangeText={(text) => {
                  if (useCurrentLocation) {
                    setUseCurrentLocation(false);
                    setCurrentLocationData(null);
                  }
                  setLocation(text);
                  setShowSuggestions(text.trim().length > 0);

                  // Trigger debounced search
                  debouncedSearch(text);
                }}
                onFocus={() => {
                  setIsInputFocused(true);
                  if (useCurrentLocation) {
                    setUseCurrentLocation(false);
                    setCurrentLocationData(null);
                  }
                  if (location.trim()) {
                    setShowSuggestions(true);
                  }
                }}
                onBlur={() => {
                  setIsInputFocused(false);
                }}
                editable={!isLoadingLocation}
              />

              {/* Right: Search Icon or Clear Icon */}
              {location.length > 0 ? (
                <TouchableOpacity
                  onPress={clearInput}
                  style={styles.clearIconContainer}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <ClearIcon />
                </TouchableOpacity>
              ) : (
                <View style={styles.searchIconContainer}>
                  <SearchIcon />
                </View>
              )}
            </View>
          </View>
        </View>
        {/* Suggestions appear directly below input */}
        {showSuggestions && !useCurrentLocation && (
          <Animated.View 
            style={[
              styles.suggestionsContainer,
              { opacity: fadeAnim }
            ]}
          >
            <ScrollView 
              style={styles.suggestionsList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {isSearchingLocations && (
                <View style={styles.suggestionItem}>
                  <ActivityIndicator size="small" color="#FE9F4D" />
                  <Text style={styles.suggestionText}>Searching locations...</Text>
                </View>
              )}
              {!isSearchingLocations && locationSuggestions.length > 0 && locationSuggestions.map((item, index) => {
                // Format: "City, Postcode, State"
                const formatLocationText = () => {
                  if (item.components) {
                    const { city, state } = item.components;
                    // Try to extract postcode from formatted_address
                    const postcodeMatch = item.formatted_address.match(/\b\d{5,6}\b/);
                    const postcode = postcodeMatch ? postcodeMatch[0] : '';

                    if (city && postcode && state) {
                      return `${city}, ${postcode}, ${state}`;
                    }
                  }
                  return item.formatted_address;
                };

                return (
                  <TouchableOpacity
                    key={`${item.id}-${index}`}
                    style={[
                      styles.suggestionItem,
                      index === locationSuggestions.length - 1 && styles.suggestionItemLast
                    ]}
                    onPress={() => selectLocation(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.suggestionText}>{formatLocationText()}</Text>
                  </TouchableOpacity>
                );
              })}
              {!isSearchingLocations && locationSuggestions.length === 0 && location.trim().length >= 2 && (
                <View style={styles.suggestionItem}>
                  <Text style={styles.noResultsText}>No locations found</Text>
                  <Text style={styles.noResultsSubtext}>Try a different search term</Text>
                </View>
              )}
            </ScrollView>
          </Animated.View>
        )}

      </View>

          {/* Confirm Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                (!location && !useCurrentLocation) && styles.buttonDisabled
              ]}
              disabled={!location && !useCurrentLocation}
              onPress={handleNext}
            >
              <Text style={styles.buttonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    position: 'absolute',
    top: 62,
    left: 19,
    width: 36,
    height: 36,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  buttonContainer: {
    paddingHorizontal: 71,
    marginTop: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    fontSize: 24, // theme.typography.fontSize['2xl']
    fontWeight: '700', // theme.typography.fontWeight.heavy
    fontStyle: 'italic',
    color: '#FE9F4D',
    fontFamily: 'Inter',
  },
  headerContainer: {
    paddingHorizontal: 37,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 40,
    marginBottom: 10,
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FE9F4D',
    lineHeight: 30,
    letterSpacing: -0.01,
    fontFamily: 'Inter',
  },
  helpText: {
    fontSize: 12, // theme.typography.fontSize.sm
    fontWeight: '400', // theme.typography.fontWeight.regular
    color: '#FE9F4D',
    lineHeight: 20, // theme.typography.lineHeight.normal
    marginTop: 10,
    fontStyle: 'italic',
    fontFamily: 'Inter',
  },
  inputContainer: {
    paddingHorizontal: 37,
  },
  locationIconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  inputWrapper: {
    position: 'relative',
  },
  inputGroup: {
    marginBottom: 0,
  },
  label: {
    fontSize: 12, // theme.typography.fontSize.sm
    fontWeight: '500', // theme.typography.fontWeight.medium
    color: '#4B5563',
    marginBottom: 10,
    letterSpacing: -0.01,
    fontFamily: 'Inter',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: '#BABABA',
    borderRadius: 28,
    paddingVertical: 5,
    paddingHorizontal: 0,
    backgroundColor: '#FFFFFF',
  },
  inputWithIconFocused: {
    borderColor: '#BABABA',
    borderWidth: 1,
  },
  inputWithIconFilled: {
    borderColor: '#BABABA',
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: '#1A1C1E',
    paddingHorizontal: 20,
    fontWeight: '400',
    fontFamily: 'Roboto',
    letterSpacing: 0.5,
  },
  searchIconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  clearIconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  suggestionsContainer: {
    backgroundColor: 'rgba(22, 94, 153, 0.05)',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopWidth: 0,
    borderColor: '#BABABA',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    maxHeight: 240,
    marginTop: 0,
    marginLeft: 24,
    marginRight: 24,
    overflow: 'hidden',
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    paddingHorizontal: 28,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#BABABA',
    minHeight: 32,
    justifyContent: 'center',
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  suggestionText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: -0.01,
    fontFamily: 'Inter',
  },
  noResultsText: {
    fontSize: 14, // theme.typography.fontSize.base
    color: '#6B7280',
    fontWeight: '600', // theme.typography.fontWeight.semibold (RN compatible)
    textAlign: 'center',
    paddingVertical: 10,
    fontFamily: 'Inter',
  },
  noResultsSubtext: {
    fontSize: 12, // theme.typography.fontSize.sm
    color: '#9CA3AF',
    fontWeight: '400', // theme.typography.fontWeight.regular
    textAlign: 'center',
    marginTop: 4,
    fontFamily: 'Inter',
  },
  button: {
    height: 40,
    backgroundColor: '#FE9F4D',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 24,
  },
});

export default LocationScreen;