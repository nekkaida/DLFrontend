// API service for questionnaires
import { patchNativeOAuthSessionUser } from '@/lib/native-social-auth';
import { OnboardingStorage } from '@/src/core/storage';
import axiosInstance from '@/lib/endpoints';

export interface QuestionOption {
  label: string;
  weight?: number;
  value?: boolean | number;
}

export interface Question {
  key: string;
  question: string;
  type: 'single_choice' | 'number' | 'skill_matrix';
  options?: QuestionOption[];
  subQuestions?: {
    [key: string]: {
      question: string;
      options: QuestionOption[];
    };
  };
  min?: number;
  max?: number;
  step?: number;
  optional?: boolean;
  helptext?: string;
  visible_if?: {
    key: string;
    op: string;
    value: any;
  }[];
}

export interface QuestionnaireData {
  sport: string;
  version: number;
  questions: Question[];
}

export interface QuestionnaireResponse {
  [key: string]: string | number | { [key: string]: string };
}

export interface RatingResult {
  source: string;
  singles: number;
  doubles: number;
  rd: number;
  confidence: string;
  detail?: any;
}

export interface SubmissionResult {
  responseId: number;
  version: number;
  qHash: string;
  result: RatingResult;
  sport: string;
  success: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  gender?: string;
  dateOfBirth?: string;
  area?: string;
  createdAt: string;
}

export interface UserProfileUpdate {
  name: string;
  gender: 'male' | 'female';
  dateOfBirth: string;
}

export interface UserLocationUpdate {
  city: string;
  state?: string;
  latitude?: number;
  longitude?: number;
}

export interface LocationSearchResult {
  id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  place_id: string;
  types: string[];
  // Optional structured address components from backend
  components?: {
    suburb?: string;
    city?: string;
    postcode?: string;
    state?: string;
  };
  // Raw address details if provided
  address?: any;
}

export interface LocationSearchResponse {
  success: boolean;
  results: LocationSearchResult[];
  query: string;
  count: number;
}

export interface ReverseGeocodeResponse {
  success: boolean;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  address_details?: any;
  components?: {
    country: string;
    state: string;
    city: string;
  };
}

export class QuestionnaireAPI {
  async getQuestionnaire(sport: string): Promise<QuestionnaireData> {
    try {
      if (__DEV__) {
        console.log('📤 getQuestionnaire: Fetching questionnaire for sport:', sport);
      }

      const response = await axiosInstance.get(`/api/onboarding/${sport}/questions`);

      if (__DEV__) {
        console.log('📥 getQuestionnaire: Response status:', response.status);
      }

      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      if (__DEV__) {
        console.error('❌ getQuestionnaire: Failed with:', errorMessage);
      }
      console.error('Error fetching questionnaire:', error);
      throw error;
    }
  }

  async submitQuestionnaire(sport: string, answers: QuestionnaireResponse, userId: string): Promise<SubmissionResult> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      if (__DEV__) {
        console.log('📤 submitQuestionnaire: Submitting for user:', userId, 'sport:', sport);
      }

      const response = await axiosInstance.post(`/api/onboarding/${sport}/submit`, {
        userId: userId,
        answers
      });

      if (__DEV__) {
        console.log('📥 submitQuestionnaire: Response status:', response.status);
      }

      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      if (__DEV__) {
        console.error('❌ submitQuestionnaire: Failed with:', errorMessage);
      }
      console.error('Error submitting questionnaire:', error);
      throw error;
    }
  }

  async getUserResponses(userId: string): Promise<{ responses: any[]; success: boolean }> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      if (__DEV__) {
        console.log('📤 getUserResponses: Fetching responses for user:', userId);
      }

      const response = await axiosInstance.get(`/api/onboarding/responses/${userId}`);

      if (__DEV__) {
        console.log('📥 getUserResponses: Response status:', response.status);
      }

      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      if (__DEV__) {
        console.error('❌ getUserResponses: Failed with:', errorMessage);
      }
      console.error('Error fetching user responses:', error);
      throw error;
    }
  }

  async getSportResponse(sport: string, userId: string): Promise<{ response: any; success: boolean } | null> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      if (__DEV__) {
        console.log('📤 getSportResponse: Fetching for user:', userId, 'sport:', sport);
      }

      const response = await axiosInstance.get(`/api/onboarding/responses/${userId}/${sport}`);

      if (__DEV__) {
        console.log('📥 getSportResponse: Response status:', response.status);
      }

      return response.data;
    } catch (error: any) {
      // Handle 404 as null (no response found for this sport)
      if (error.response?.status === 404) {
        return null;
      }
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      if (__DEV__) {
        console.error('❌ getSportResponse: Failed with:', errorMessage);
      }
      console.error('Error fetching sport response:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, profileData: UserProfileUpdate): Promise<{ user: UserProfile; success: boolean }> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      if (__DEV__) {
        console.log('📤 updateUserProfile: Updating profile for user:', userId);
      }

      // Use axiosInstance which has proper auth handling via interceptors
      const response = await axiosInstance.put(`/api/onboarding/profile/${userId}`, profileData);

      if (__DEV__) {
        console.log('📥 updateUserProfile: Response status:', response.status);
      }

      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      if (__DEV__) {
        console.error('❌ updateUserProfile: Failed with:', errorMessage);
      }
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  async getUserProfile(userId: string): Promise<{ user: UserProfile; success: boolean }> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      if (__DEV__) {
        console.log('📤 getUserProfile: Fetching profile for user:', userId);
      }

      // Use axiosInstance which has proper auth handling via interceptors
      const response = await axiosInstance.get(`/api/onboarding/profile/${userId}`);

      if (__DEV__) {
        console.log('📥 getUserProfile: Response status:', response.status);
      }

      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      if (__DEV__) {
        console.error('❌ getUserProfile: Failed with:', errorMessage);
      }
      console.error('Error fetching user profile:', error);
      throw new Error(`Failed to fetch profile: ${errorMessage}`);
    }
  }

  async saveUserLocation(userId: string, locationData: UserLocationUpdate): Promise<{ success: boolean; location: any }> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      if (__DEV__) {
        console.log('📤 saveUserLocation: Saving location for user:', userId);
      }

      const response = await axiosInstance.post(`/api/onboarding/location/${userId}`, locationData);

      if (__DEV__) {
        console.log('📥 saveUserLocation: Response status:', response.status);
      }

      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      if (__DEV__) {
        console.error('❌ saveUserLocation: Failed with:', errorMessage);
      }
      console.error('Error saving user location:', error);
      throw new Error(errorMessage || 'Failed to save location');
    }
  }

  async searchLocations(query: string, limit: number = 10): Promise<LocationSearchResponse> {
    try {
      if (!query || query.trim().length < 2) {
        throw new Error('Query must be at least 2 characters long');
      }

      if (__DEV__) {
        console.log('🔍 searchLocations: Searching for:', query);
      }

      const response = await axiosInstance.get(`/api/onboarding/locations/search`, {
        params: { q: query.trim(), limit }
      });

      if (__DEV__) {
        console.log('📥 searchLocations: Response status:', response.status);
      }

      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      if (__DEV__) {
        console.error('❌ searchLocations: Failed with:', errorMessage);
      }
      console.error('Error searching locations:', error);
      throw new Error(errorMessage || 'Failed to search locations');
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodeResponse> {
    try {
      if (__DEV__) {
        console.log('🌐 reverseGeocode: Reverse geocoding:', latitude, longitude);
      }

      const response = await axiosInstance.get(`/api/locations/reverse-geocode`, {
        params: { lat: latitude, lng: longitude }
      });

      if (__DEV__) {
        console.log('📥 reverseGeocode: Response status:', response.status);
      }

      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      if (__DEV__) {
        console.error('❌ reverseGeocode: Failed with:', errorMessage);
      }
      console.error('Error reverse geocoding:', error);
      throw new Error(errorMessage || 'Failed to reverse geocode');
    }
  }

  async completeOnboarding(userId: string): Promise<{ success: boolean; message: string; completedOnboarding: boolean }> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      if (__DEV__) {
        console.log('📤 completeOnboarding: Completing onboarding for user:', userId);
      }

      const response = await axiosInstance.post(`/api/onboarding/complete/${userId}`);

      if (__DEV__) {
        console.log('📥 completeOnboarding: Response status:', response.status);
      }

      const payload = response.data?.data || response.data;

      if (payload?.completedOnboarding) {
        await Promise.allSettled([
          patchNativeOAuthSessionUser({
            completedOnboarding: true,
            onboardingStep: 'PROFILE_PICTURE',
          }),
          OnboardingStorage.clearData(),
          OnboardingStorage.clearProgress(),
        ]);
      }

      return payload;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      if (__DEV__) {
        console.error('❌ completeOnboarding: Failed with:', errorMessage);
      }
      console.error('Error completing onboarding:', error);
      throw new Error(errorMessage || 'Failed to complete onboarding');
    }
  }

  async updateOnboardingStep(userId: string, step: string): Promise<{ success: boolean; onboardingStep: string }> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const validSteps = [
        'PERSONAL_INFO',
        'LOCATION',
        'GAME_SELECT',
        'SKILL_ASSESSMENT',
        'ASSESSMENT_RESULTS',
        'PROFILE_PICTURE',
      ];

      if (!validSteps.includes(step)) {
        throw new Error(`Invalid step: ${step}. Must be one of: ${validSteps.join(', ')}`);
      }

      if (__DEV__) {
        console.log('📤 updateOnboardingStep: Updating step for user:', userId, 'step:', step);
      }

      const response = await axiosInstance.put(`/api/onboarding/step/${userId}`, { step });

      if (__DEV__) {
        console.log('📥 updateOnboardingStep: Response status:', response.status);
      }

      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      if (__DEV__) {
        console.error('❌ updateOnboardingStep: Failed with:', errorMessage);
      }
      console.error('Error updating onboarding step:', error);
      throw new Error(errorMessage || 'Failed to update onboarding step');
    }
  }

  async getAssessmentStatus(userId: string): Promise<{ hasCompletedAssessment: boolean; assessmentCount: number; success: boolean }> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      if (__DEV__) {
        console.log('📤 getAssessmentStatus: Fetching for user:', userId);
      }

      const response = await axiosInstance.get(`/api/onboarding/assessment-status/${userId}`);

      if (__DEV__) {
        console.log('📥 getAssessmentStatus: Response status:', response.status);
      }

      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      if (__DEV__) {
        console.error('❌ getAssessmentStatus: Failed with:', errorMessage);
      }
      console.error('Error getting assessment status:', error);
      throw new Error(errorMessage || 'Failed to get assessment status');
    }
  }

  async saveSports(userId: string, sports: string[]): Promise<{ success: boolean; message: string; sports: string[] }> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      if (!Array.isArray(sports) || sports.length === 0) {
        throw new Error('Sports array is required and must not be empty');
      }

      if (__DEV__) {
        console.log('📤 saveSports: Saving sports for user:', userId, 'sports:', sports);
      }

      const response = await axiosInstance.post(`/api/onboarding/sports/${userId}`, { sports });

      if (__DEV__) {
        console.log('📥 saveSports: Response status:', response.status);
      }

      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      if (__DEV__) {
        console.error('❌ saveSports: Failed with:', errorMessage);
      }
      console.error('Error saving sports:', error);
      throw new Error(errorMessage || 'Failed to save sports');
    }
  }

  /**
   * Save user's self-assessed sport skill levels
   * Maps frontend sport keys to backend field names
   */
  async saveSkillLevels(userId: string, skillLevels: {
    pickleball?: string;
    tennis?: string;
    padel?: string;
  }): Promise<{ success: boolean; message: string; data: any }> {
    try {
      if (!userId) {
        throw new Error('User ID is required to save skill levels');
      }

      // Map frontend sport keys to backend field names
      const payload: Record<string, string | undefined> = {};
      if (skillLevels.tennis) payload.tennisSkillLevel = skillLevels.tennis;
      if (skillLevels.pickleball) payload.pickleballSkillLevel = skillLevels.pickleball;
      if (skillLevels.padel) payload.padelSkillLevel = skillLevels.padel;

      if (__DEV__) {
        console.log('📤 saveSkillLevels: Saving skill levels for user:', userId, 'payload:', payload);
      }

      const response = await axiosInstance.put(`/api/onboarding/skill-levels/${userId}`, payload);

      if (__DEV__) {
        console.log('📥 saveSkillLevels: Response status:', response.status);
      }

      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      if (__DEV__) {
        console.error('❌ saveSkillLevels: Failed with:', errorMessage);
      }
      console.error('Error saving skill levels:', error);
      throw new Error(errorMessage || 'Failed to save skill levels');
    }
  }
}

export const questionnaireAPI = new QuestionnaireAPI();
