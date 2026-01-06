// Type definitions for skill assessment questionnaire
export type SportType = 'pickleball' | 'tennis' | 'padel' | 'basketball' | 'soccer' | 'volleyball';

export type QuestionType = 'single_choice' | 'number' | 'skill_matrix';

// Conditional visibility for questions
export interface ShowIfCondition {
  key: string;
  operator: '==' | '!=' | 'exists' | 'not_exists';
  value?: any;
}

// Sport-specific question types
export interface Question {
  key: string;
  showIf?: ShowIfCondition | ShowIfCondition[]; // AND logic for arrays
  question: string;
  type: QuestionType;
  options?: string[];
  help_text?: string;
  min_value?: number;
  max_value?: number;
  optional?: boolean;
  sub_questions?: {
    [key: string]: {
      question: string;
      options: string[];
      tooltip?: string;
    };
  };
}

export interface ExpandedQuestion extends Question {
  originalKey?: string;
  skillKey?: string;
}

export interface QuestionnaireResponse {
  [key: string]: string | number | { [key: string]: string };
}

export interface SkillQuestions {
  [key: string]: string;
}

// Tennis types
export interface TennisQuestion {
  key: string;
  showIf?: ShowIfCondition | ShowIfCondition[]; // AND logic for arrays
  question: string;
  type: QuestionType;
  options?: string[];
  help_text?: string;
  min_value?: number;
  max_value?: number;
  optional?: boolean;
  sub_questions?: {
    [key: string]: {
      question: string;
      options: string[];
      tooltip?: string;
    };
  };
}

export interface TennisQuestionnaireResponse {
  [key: string]: string | number | { [key: string]: string };
}

export interface TennisSkillQuestions {
  [key: string]: string;
}

// Padel types
export interface PadelQuestion {
  key: string;
  showIf?: ShowIfCondition | ShowIfCondition[]; // AND logic for arrays
  question: string;
  type: QuestionType;
  options?: string[];
  help_text?: string;
  min_value?: number;
  max_value?: number;
  optional?: boolean;
  sub_questions?: {
    [key: string]: {
      question: string;
      options: string[];
      tooltip?: string;
    };
  };
}

export interface PadelQuestionnaireResponse {
  [key: string]: string | number | { [key: string]: string };
}

export interface PadelSkillQuestions {
  [key: string]: string;
}

// Union types for generic handling
export type AnyQuestion = Question | TennisQuestion | PadelQuestion;
export type AnyQuestionnaireResponse = QuestionnaireResponse | TennisQuestionnaireResponse | PadelQuestionnaireResponse;
export type AnySkillQuestions = SkillQuestions | TennisSkillQuestions | PadelSkillQuestions;

// Questionnaire service interface
export interface QuestionnaireService {
  getConditionalQuestions: (responses: any) => AnyQuestion[];
  getAllQuestions: () => AnyQuestion[]; // Returns ALL questions with showIf conditions
  calculateInitialRating: (responses: any) => any;
  generateFeedback: (rating: any) => string;
}

// Question history entry
export interface QuestionHistoryEntry {
  questions: AnyQuestion[];
  responses: AnyQuestionnaireResponse;
}
