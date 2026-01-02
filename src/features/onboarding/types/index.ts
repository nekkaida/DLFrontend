/**
 * Onboarding Types and Interfaces
 * 
 * This file contains all TypeScript types and interfaces used throughout
 * the onboarding flow to ensure type safety and consistency.
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type SportType = 'pickleball' | 'tennis' | 'padel';

export type GenderType = 'male' | 'female';

// Self-assessed skill levels for sports (matches backend SkillLevel enum)
export type SkillLevel =
  | 'BEGINNER'
  | 'IMPROVER'
  | 'INTERMEDIATE'
  | 'UPPER_INTERMEDIATE'
  | 'ADVANCED'
  | 'EXPERT';

// Display labels for skill levels
export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  BEGINNER: 'Beginner',
  IMPROVER: 'Improver',
  INTERMEDIATE: 'Intermediate',
  UPPER_INTERMEDIATE: 'Upper Intermediate',
  ADVANCED: 'Advanced',
  EXPERT: 'Expert',
};

// Ordered array of skill levels for UI display
export const SKILL_LEVELS_ORDERED: SkillLevel[] = [
  'BEGINNER',
  'IMPROVER',
  'INTERMEDIATE',
  'UPPER_INTERMEDIATE',
  'ADVANCED',
  'EXPERT',
];

// ============================================================================
// ONBOARDING DATA STRUCTURE
// ============================================================================

/**
 * Complete onboarding data structure that flows through the entire process
 */
export interface OnboardingData {
  // Personal Information
  fullName: string;
  gender: GenderType | null;
  dateOfBirth: Date | null;

  // Location Data
  location: string;
  useCurrentLocation: boolean;
  latitude?: number;
  longitude?: number;

  // Sport Selection
  selectedSports: SportType[];

  // Self-assessed skill levels per sport (selected during game selection)
  sportSkillLevels: Partial<Record<SportType, SkillLevel>>;

  // Skill Assessment Results
  skillAssessments: Partial<Record<SportType, SkillAssessmentResult>>;

  // Profile
  profileImage?: string;
}

// ============================================================================
// SKILL ASSESSMENT TYPES
// ============================================================================

/**
 * Result of a skill assessment for a specific sport
 */
export interface SkillAssessmentResult {
  sport: SportType;
  rating: number;
  confidence: string;
  rd: number;
  feedback: string[];
  responses: Record<string, any>;
  completedAt: Date;
}

/**
 * Generic question structure for all sports
 */
export interface BaseQuestion {
  id: string;
  text: string;
  type: 'single_choice' | 'multiple_choice' | 'number_input' | 'yes_no';
  required: boolean;
  helpText?: string;
}

/**
 * Single choice question (radio buttons)
 */
export interface SingleChoiceQuestion extends BaseQuestion {
  type: 'single_choice';
  options: QuestionOption[];
}

/**
 * Multiple choice question (checkboxes)
 */
export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice';
  options: QuestionOption[];
  maxSelections?: number;
}

/**
 * Number input question
 */
export interface NumberInputQuestion extends BaseQuestion {
  type: 'number_input';
  min?: number;
  max?: number;
  placeholder?: string;
}

/**
 * Yes/No question
 */
export interface YesNoQuestion extends BaseQuestion {
  type: 'yes_no';
}

/**
 * Union type for all question types
 */
export type Question = SingleChoiceQuestion | MultipleChoiceQuestion | NumberInputQuestion | YesNoQuestion;

/**
 * Question option for choice-based questions
 */
export interface QuestionOption {
  id: string;
  text: string;
  value: any;
  helpText?: string;
}

// ============================================================================
// SPORT-SPECIFIC QUESTION TYPES
// ============================================================================

/**
 * Pickleball-specific question types
 */
export interface PickleballQuestion extends BaseQuestion {
  sport: 'pickleball';
}

/**
 * Tennis-specific question types
 */
export interface TennisQuestion extends BaseQuestion {
  sport: 'tennis';
}

/**
 * Padel-specific question types
 */
export interface PadelQuestion extends BaseQuestion {
  sport: 'padel';
}

// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================

/**
 * Props for sport selection components
 */
export interface SportSelectionProps {
  selectedSports: SportType[];
  onSportSelect: (sport: SportType) => void;
  onSportDeselect: (sport: SportType) => void;
}

/**
 * Props for skill assessment components
 */
export interface SkillAssessmentProps {
  sport: SportType;
  questions: Question[];
  responses: Record<string, any>;
  onResponseChange: (questionId: string, response: any) => void;
  onComplete: (result: SkillAssessmentResult) => void;
}

/**
 * Props for form input components
 */
export interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
}

// ============================================================================
// NAVIGATION TYPES
// ============================================================================

/**
 * Onboarding screen navigation parameters
 */
export interface OnboardingScreenParams {
  'personal-info': undefined;
  'location': undefined;
  'game-select': undefined;
  'skill-assessment': {
    sport: SportType;
    sportIndex: number;
  };
  'assessment-results': {
    sport: SportType;
    result: SkillAssessmentResult;
  };
  'profile-picture': undefined;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Form validation error structure
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * API response structure for location suggestions
 */
export interface LocationSuggestion {
  id: string;
  city: string;
  state: string;
  country: string;
  formatted: string;
}

/**
 * Progress tracking for onboarding steps
 */
export interface OnboardingProgress {
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  isComplete: boolean;
}