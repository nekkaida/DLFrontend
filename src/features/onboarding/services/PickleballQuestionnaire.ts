export interface QuestionnaireResponse {
  [key: string]: string | number | { [key: string]: string };
}

export interface SkillQuestions {
  [key: string]: string;
}

export interface RatingResult {
  singles_rating: number;
  doubles_rating: number;
  confidence: 'low' | 'medium' | 'medium-high' | 'high';
  rating_deviation: number;
  source: 'dupr_conversion' | 'questionnaire' | 'default' | 'error_fallback';
  adjustment_detail?: any;
  error?: string;
  reliability_score?: number;
  pattern_flags?: string[];
  confidence_breakdown?: { [key: string]: number };
  original_dupr_singles?: number | null;
  original_dupr_doubles?: number | null;
  singles_reliability?: number | null;
  doubles_reliability?: number | null;
  pattern_analysis?: {
    more_reliable_format: string | null;
    confidence_adjustment: number;
    notes: string[];
  };
}

import { ShowIfCondition } from '../screens/skill-assessment/types/questionnaire.types';

export interface Question {
  key: string;
  question: string;
  type: 'single_choice' | 'number' | 'skill_matrix';
  options?: string[];
  sub_questions?: { [key: string]: { question: string; options: string[] } };
  min_value?: number;
  max_value?: number;
  step?: number;
  optional?: boolean;
  help_text?: string;
  conditional?: string;
  reliability_target?: string;
  showIf?: ShowIfCondition | ShowIfCondition[];
}

export class PickleballQuestionnaire {
  private BASE_RATING = 1500;
  private EXPERIENCE_RANGE = 300;
  private SPORTS_BACKGROUND_RANGE = 280;
  private FREQUENCY_RANGE = 150;
  private SKILL_RANGE = 320;
  private COMPETITIVE_RANGE = 200;

  private CONFIDENCE_WEIGHTS = {
    experience: 2.0,
    skills: 1.8,
    self_rating: 1.5,
    competitive_level: 1.3,
    sports_background: 1.2,
    frequency: 1.0,
    tournament: 1.0,
  };

  private RELIABILITY_ASSUMPTIONS = {
    singles_default: 25,
    doubles_default: 45,
    singles_penalty: 1.3,
    doubles_bonus: 0.9,
  };

  private MAX_RD = 350;
  private MIN_RD = 30;
  private HIGH_CONFIDENCE_RD = 150;
  private MEDIUM_CONFIDENCE_RD = 250;
  private LOW_CONFIDENCE_RD = 350;

  private questions = {
    has_dupr: {
      question: "Do you have a DUPR (Dynamic Universal Pickleball Rating)?",
      answers: {
        "Yes": true,
        "No": false,
        "Not sure what DUPR is": false,
      },
    },
    dupr_singles: {
      question: "What is your current DUPR Singles rating?",
      input_type: "number",
      min_value: 2.0,
      max_value: 8.0,
      step: 0.01,
      conditional: "has_dupr",
      optional: true,
      help_text: "Leave blank if you don't have a singles DUPR rating",
    },
    dupr_doubles: {
      question: "What is your current DUPR Doubles rating?",
      input_type: "number",
      min_value: 2.0,
      max_value: 8.0,
      step: 0.01,
      conditional: "has_dupr",
      optional: true,
      help_text: "Leave blank if you don't have a doubles DUPR rating",
    },
    dupr_singles_reliability: {
      question: "What is your DUPR Singles reliability score?",
      input_type: "number",
      min_value: 0,
      max_value: 100,
      step: 1,
      conditional: "has_dupr_singles",
      optional: true,
      help_text: "Your reliability percentage (0-100%). Leave blank if unsure - we'll use a default.",
    },
    dupr_doubles_reliability: {
      question: "What is your DUPR Doubles reliability score?",
      input_type: "number",
      min_value: 0,
      max_value: 100,
      step: 1,
      conditional: "has_dupr_doubles",
      optional: true,
      help_text: "Your reliability percentage (0-100%). Leave blank if unsure - we'll use a default.",
    },
    experience: {
      question: "How long have you been playing pickleball?",
      answers: {
        "Less than 3 month": -0.7,
        "3-6 months": -0.4,
        "6-12 months": 0.2,
        "1-2 years": 0.5,
        "More than 2 years": 1.0,
      },
    },
    sports_background: {
      question: "What is your background in racquet sports?",
      answers: {
        "No prior experience with racquet sports": -0.8,
        "Casual/recreational player of other racquet sports": -0.3,
        "Intermediate level in tennis or table tennis": 0.4,
        "Advanced/competitive player in other racquet sports": 0.9,
        "Professional or ex-professional athlete in racquet sports": 1.0,
      },
    },
    frequency: {
      question: "How often do you play pickleball?",
      answers: {
        "Less than once a month": -0.4,
        "1-2 times a month": 0.0,
        "Once a week": 0.3,
        "2-3 times a week": 0.7,
        "4+ times a week": 1.0,
      },
    },
    competitive_level: {
      question: "What is the highest level you usually play at?",
      answers: {
        "Recreational/social games": -0.4,
        "Club/DUPR match play": 0.2,
        "Novice/Intermediate Competitive tournaments": 0.7,
        "High-level competitive tournaments": 1.0,
      },
    },
    skills: {
      question: "Rate your pickleball skills:",
      sub_questions: {
        serving: {
          question: "Serving accuracy and consistency",
          answers: {
            "Beginner (learning basic serves)": -0.7,
            "Developing (consistent basic serves)": -0.2,
            "Intermediate (can place serves)": 0.3,
            "Advanced (variety of controlled serves)": 0.8,
          },
        },
        dinking: {
          question: "Dinking and soft game",
          answers: {
            "Beginner (learning to dink)": -0.7,
            "Developing (can sustain short rallies)": -0.2,
            "Intermediate (good control and placement)": 0.3,
            "Advanced (excellent control and strategy)": 0.8,
          },
        },
        volleys: {
          question: "Volleys and net play",
          answers: {
            "Beginner (learning basic volleys)": -0.7,
            "Developing (can sustain volley exchanges)": -0.2,
            "Intermediate (good reflexes and placement)": 0.3,
            "Advanced (excellent reflexes and strategy)": 0.8,
          },
        },
        positioning: {
          question: "Court positioning and strategy",
          answers: {
            "Beginner (learning basic positioning)": -0.7,
            "Developing (understand basic strategy)": -0.2,
            "Intermediate (good positioning and awareness)": 0.3,
            "Advanced (excellent strategy and adaptability)": 0.8,
          },
        },
      },
    },
    self_rating: {
      question: "How would you rate yourself as a pickleball player on a scale of 1.0 to 5.0?",
      answers: {
        "1.0-1.5 (Beginner)": -0.8,
        "2.0-2.5 (Lower Intermediate)": -0.4,
        "3.0-3.5 (Intermediate)": 0.0,
        "4.0-4.5 (Advanced)": 0.5,
        "5.0+ (Expert/Pro)": 1.0,
      },
    },
    tournament: {
      question: "Have you competed in pickleball tournaments?",
      answers: {
        "Never": -0.5,
        "Recreational/social tournaments": 0.0,
        "Competitive tournaments": 0.5,
        "Professional tournaments": 1.0,
      },
    },
  };

  shouldSkipQuestionnaire(responses: QuestionnaireResponse): boolean {
    const hasDupr = responses.has_dupr === 'Yes';
    const duprSingles = responses.dupr_singles;
    const duprDoubles = responses.dupr_doubles;

    if (hasDupr && (duprSingles || duprDoubles)) {
      let validSingles = false;
      let validDoubles = false;

      if (duprSingles) {
        try {
          const singlesFloat = parseFloat(duprSingles.toString());
          validSingles = singlesFloat >= 2.0 && singlesFloat <= 8.0;
        } catch {
          // Invalid input
        }
      }

      if (duprDoubles) {
        try {
          const doublesFloat = parseFloat(duprDoubles.toString());
          validDoubles = doublesFloat >= 2.0 && doublesFloat <= 8.0;
        } catch {
          // Invalid input
        }
      }

      return validSingles || validDoubles;
    }

    return false;
  }

  getConditionalQuestions(responses: QuestionnaireResponse): Question[] {
    if (!responses.has_dupr) {
      return [
        {
          key: 'has_dupr',
          question: this.questions.has_dupr.question,
          type: 'single_choice',
          options: Object.keys(this.questions.has_dupr.answers),
          help_text: 'DUPR is the official rating system used in competitive pickleball',
        },
      ];
    }

    if (responses.has_dupr === 'No' || responses.has_dupr === 'Not sure what DUPR is') {
      return this.getRemainingQuestionnaireQuestions(responses);
    }

    if (responses.has_dupr === 'Yes') {
      // DUPR rating questions
      if (!('dupr_singles' in responses)) {
        return [
          {
            key: 'dupr_singles',
            question: 'What is your DUPR Singles rating? (Leave blank if you don\'t play singles)',
            type: 'number',
            min_value: 2.0,
            max_value: 8.0,
            step: 0.01,
            optional: true,
            help_text: 'Your singles DUPR rating (e.g., 3.75). Skip if you don\'t have one.',
          },
        ];
      }

      if (!('dupr_doubles' in responses)) {
        return [
          {
            key: 'dupr_doubles',
            question: 'What is your DUPR Doubles rating? (Leave blank if you don\'t play doubles)',
            type: 'number',
            min_value: 2.0,
            max_value: 8.0,
            step: 0.01,
            optional: true,
            help_text: 'Your doubles DUPR rating (e.g., 4.12). Skip if you don\'t have one.',
          },
        ];
      }

      // DUPR singles reliability question
      if (responses.dupr_singles && 
          responses.dupr_singles.toString().trim() !== '' && 
          !('dupr_singles_reliability' in responses)) {
        return [
          {
            key: 'dupr_singles_reliability',
            question: 'What is your DUPR Singles reliability percentage?',
            type: 'number',
            min_value: 0,
            max_value: 100,
            step: 1,
            optional: true,
            help_text: 'The reliability percentage shown next to your DUPR singles rating (0-100%). Skip if you\'re not sure.',
          },
        ];
      }

      // DUPR doubles reliability question
      if (responses.dupr_doubles && 
          responses.dupr_doubles.toString().trim() !== '' && 
          !('dupr_doubles_reliability' in responses)) {
        return [
          {
            key: 'dupr_doubles_reliability',
            question: 'What is your DUPR Doubles reliability percentage?',
            type: 'number',
            min_value: 0,
            max_value: 100,
            step: 1,
            optional: true,
            help_text: 'The reliability percentage shown next to your DUPR doubles rating (0-100%). Skip if you\'re not sure.',
          },
        ];
      }

      if (this.shouldSkipQuestionnaire(responses)) {
        return [];
      }
    }

    return this.getRemainingQuestionnaireQuestions(responses);
  }

  /**
   * Returns ALL questions with showIf conditions for declarative filtering.
   * The UI evaluates showIf conditions in real-time based on responses.
   * This enables stable carousel data for smooth animations.
   */
  getAllQuestions(): Question[] {
    const q = this.questions;

    return [
      // Q1: DUPR gate question (always visible)
      {
        key: 'has_dupr',
        question: q.has_dupr.question,
        type: 'single_choice' as const,
        options: Object.keys(q.has_dupr.answers),
        help_text: 'DUPR is the official rating system used in competitive play',
      },

      // Q2: DUPR Singles rating (conditional on has_dupr = Yes)
      {
        key: 'dupr_singles',
        question: 'What is your DUPR Singles rating? (Leave blank if you don\'t play singles)',
        type: 'number' as const,
        min_value: 2.0,
        max_value: 8.0,
        step: 0.01,
        optional: true,
        help_text: 'Your singles DUPR rating (e.g., 3.75). Skip if you don\'t have one.',
        showIf: { key: 'has_dupr', operator: '==', value: 'Yes' },
      },

      // Q3: DUPR Doubles rating (conditional on has_dupr = Yes)
      {
        key: 'dupr_doubles',
        question: 'What is your DUPR Doubles rating? (Leave blank if you don\'t play doubles)',
        type: 'number' as const,
        min_value: 2.0,
        max_value: 8.0,
        step: 0.01,
        optional: true,
        help_text: 'Your doubles DUPR rating (e.g., 4.12). Skip if you don\'t have one.',
        showIf: { key: 'has_dupr', operator: '==', value: 'Yes' },
      },

      // Q4: DUPR Singles reliability (conditional on dupr_singles having a value)
      {
        key: 'dupr_singles_reliability',
        question: 'What is your DUPR Singles reliability percentage?',
        type: 'number' as const,
        min_value: 0,
        max_value: 100,
        step: 1,
        optional: true,
        help_text: 'The reliability percentage shown next to your DUPR singles rating (0-100%). Skip if unsure.',
        showIf: { key: 'dupr_singles', operator: 'exists' },
      },

      // Q5: DUPR Doubles reliability (conditional on dupr_doubles having a value)
      {
        key: 'dupr_doubles_reliability',
        question: 'What is your DUPR Doubles reliability percentage?',
        type: 'number' as const,
        min_value: 0,
        max_value: 100,
        step: 1,
        optional: true,
        help_text: 'The reliability percentage shown next to your DUPR doubles rating (0-100%). Skip if unsure.',
        showIf: { key: 'dupr_doubles', operator: 'exists' },
      },

      // Standard questionnaire questions (show when has_dupr != 'Yes')
      {
        key: 'experience',
        question: q.experience.question,
        type: 'single_choice' as const,
        options: Object.keys(q.experience.answers),
        showIf: { key: 'has_dupr', operator: '!=', value: 'Yes' },
      },
      {
        key: 'sports_background',
        question: q.sports_background.question,
        type: 'single_choice' as const,
        options: Object.keys(q.sports_background.answers),
        showIf: { key: 'has_dupr', operator: '!=', value: 'Yes' },
      },
      {
        key: 'frequency',
        question: q.frequency.question,
        type: 'single_choice' as const,
        options: Object.keys(q.frequency.answers),
        showIf: { key: 'has_dupr', operator: '!=', value: 'Yes' },
      },
      {
        key: 'competitive_level',
        question: q.competitive_level.question,
        type: 'single_choice' as const,
        options: Object.keys(q.competitive_level.answers),
        showIf: { key: 'has_dupr', operator: '!=', value: 'Yes' },
      },
      {
        key: 'skills',
        question: q.skills.question,
        type: 'skill_matrix' as const,
        sub_questions: Object.fromEntries(
          Object.entries(q.skills.sub_questions).map(([skillKey, skillData]) => [
            skillKey,
            { question: skillData.question, options: Object.keys(skillData.answers) },
          ])
        ),
        showIf: { key: 'has_dupr', operator: '!=', value: 'Yes' },
      },
      {
        key: 'self_rating',
        question: q.self_rating.question,
        type: 'single_choice' as const,
        options: Object.keys(q.self_rating.answers),
        showIf: { key: 'has_dupr', operator: '!=', value: 'Yes' },
      },
      {
        key: 'tournament',
        question: q.tournament.question,
        type: 'single_choice' as const,
        options: Object.keys(q.tournament.answers),
        showIf: { key: 'has_dupr', operator: '!=', value: 'Yes' },
      },
    ];
  }

  private getRemainingQuestionnaireQuestions(responses: QuestionnaireResponse): Question[] {
    const remainingQuestions: Question[] = [];
    const questionnaireKeys = [
      'experience',
      'sports_background', 
      'frequency',
      'competitive_level',
      'skills',
      'self_rating',
      'tournament',
    ];

    for (const key of questionnaireKeys) {
      if (!(key in responses)) {
        const questionData = this.questions[key as keyof typeof this.questions] as any;
        if (key === 'skills' && questionData.sub_questions) {
          remainingQuestions.push({
            key,
            question: questionData.question,
            type: 'skill_matrix' as const,
            sub_questions: Object.fromEntries(
              Object.entries(questionData.sub_questions).map(([skillKey, skillData]: [string, any]) => [
                skillKey,
                {
                  question: skillData.question,
                  options: Object.keys(skillData.answers),
                },
              ])
            ),
          });
        } else if (questionData && 'answers' in questionData) {
          remainingQuestions.push({
            key,
            question: questionData.question,
            type: 'single_choice' as const,
            options: Object.keys(questionData.answers),
            help_text: questionData.help_text,
          });
        }
      }
    }

    return remainingQuestions;
  }

  calculateInitialRating(responses: QuestionnaireResponse): RatingResult {
    try {
      if (!responses || Object.keys(responses).length === 0) {
        return {
          singles_rating: this.BASE_RATING,
          doubles_rating: this.BASE_RATING,
          confidence: 'low',
          rating_deviation: this.LOW_CONFIDENCE_RD,
          source: 'default',
        };
      }

      if (this.shouldSkipQuestionnaire(responses)) {
        const duprSingles = responses.dupr_singles ? parseFloat(responses.dupr_singles.toString()) : null;
        const duprDoubles = responses.dupr_doubles ? parseFloat(responses.dupr_doubles.toString()) : null;
        const singlesReliability = responses.dupr_singles_reliability ? parseInt(responses.dupr_singles_reliability.toString()) : null;
        const doublesReliability = responses.dupr_doubles_reliability ? parseInt(responses.dupr_doubles_reliability.toString()) : null;
        
        const result = this.convertDuprToDmr(duprSingles, duprDoubles, singlesReliability, doublesReliability);
        if (result) {
          return result;
        }

        return {
          singles_rating: this.BASE_RATING,
          doubles_rating: this.BASE_RATING,
          confidence: 'low',
          rating_deviation: this.LOW_CONFIDENCE_RD,
          source: 'error_fallback',
        };
      }

      let ratingAdjustment = 0;
      let weightedConfidenceScore = 0;
      let maxWeightedConfidence = 0;

      const categories: Array<keyof typeof this.CONFIDENCE_WEIGHTS> = [
        'experience',
        'sports_background',
        'frequency',
        'competitive_level',
        'self_rating',
        'tournament',
      ];

      for (const category of categories) {
        const answer = responses[category];
        if (typeof answer === 'string') {
          const questionData = this.questions[category];
          const weight = (questionData as any)?.answers?.[answer] ?? 0;

          if (category === 'experience') {
            ratingAdjustment += weight * this.EXPERIENCE_RANGE;
          } else if (category === 'sports_background') {
            ratingAdjustment += weight * this.SPORTS_BACKGROUND_RANGE;
          } else if (category === 'frequency') {
            ratingAdjustment += weight * this.FREQUENCY_RANGE;
          } else if (category === 'competitive_level') {
            ratingAdjustment += weight * this.COMPETITIVE_RANGE;
          } else if (category === 'self_rating') {
            ratingAdjustment += weight * this.SKILL_RANGE * 0.7;
          } else if (category === 'tournament') {
            ratingAdjustment += weight * this.SKILL_RANGE * 0.5;
          }

          weightedConfidenceScore += Math.abs(weight) * this.CONFIDENCE_WEIGHTS[category];
          maxWeightedConfidence += this.CONFIDENCE_WEIGHTS[category];
        }
      }

      if (responses.skills && typeof responses.skills === 'object') {
        const skillResponses = responses.skills as SkillQuestions;
        const skillWeights: number[] = [];

        for (const [skill, answer] of Object.entries(skillResponses)) {
          const skillQuestion = this.questions.skills.sub_questions[skill as keyof typeof this.questions.skills.sub_questions];
          if (skillQuestion) {
            const weight = (skillQuestion as any).answers[answer] ?? 0;
            skillWeights.push(weight);
          }
        }

        if (skillWeights.length > 0) {
          const avgSkillWeight = skillWeights.reduce((sum, value) => sum + value, 0) / skillWeights.length;
          ratingAdjustment += avgSkillWeight * this.SKILL_RANGE;
          weightedConfidenceScore += Math.abs(avgSkillWeight) * this.CONFIDENCE_WEIGHTS.skills;
          maxWeightedConfidence += this.CONFIDENCE_WEIGHTS.skills;
        }
      }

      const confidenceRatio = maxWeightedConfidence > 0 ? Math.min(weightedConfidenceScore / maxWeightedConfidence, 1) : 0;
      let confidence: 'low' | 'medium' | 'high';
      let rd: number;

      if (confidenceRatio < 0.4) {
        confidence = 'low';
        rd = this.LOW_CONFIDENCE_RD;
      } else if (confidenceRatio < 0.7) {
        confidence = 'medium';
        rd = this.MEDIUM_CONFIDENCE_RD;
      } else {
        confidence = 'high';
        rd = this.HIGH_CONFIDENCE_RD;
      }

      let singlesRating = Math.round(this.BASE_RATING + ratingAdjustment);
      let doublesRating = Math.round(singlesRating + (ratingAdjustment < 0 ? 50 : 0));

      const clampRating = (rating: number) => Math.max(1000, Math.min(8000, rating));
      singlesRating = clampRating(singlesRating);
      doublesRating = clampRating(doublesRating);

      return {
        singles_rating: singlesRating,
        doubles_rating: doublesRating,
        confidence,
        rating_deviation: rd,
        source: 'questionnaire',
      };
    } catch (error) {
      return {
        singles_rating: this.BASE_RATING,
        doubles_rating: this.BASE_RATING,
        confidence: 'low',
        rating_deviation: this.LOW_CONFIDENCE_RD,
        source: 'error_fallback',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private validateDuprInput(duprValue: any, ratingType: string = 'singles'): [number | null, string | null] {
    if (!duprValue || duprValue.toString().trim() === '') {
      return [null, null];
    }

    try {
      const duprFloat = parseFloat(duprValue.toString().trim());

      if (duprFloat < 2.0) {
        return [null, `DUPR ${ratingType} ratings start at 2.0. Did you mean 2.${duprFloat.toString().split('.')[1] || '0'}?`];
      } else if (duprFloat > 8.0) {
        return [null, `DUPR ${ratingType} ratings rarely exceed 8.0. Please double-check your rating.`];
      }

      return [duprFloat, null];
    } catch {
      return [null, `Please enter a valid number for DUPR ${ratingType} (e.g., 3.75)`];
    }
  }

  private validateReliabilityInput(reliabilityValue: any): [number | null, string | null] {
    if (!reliabilityValue || reliabilityValue.toString().trim() === '') {
      return [null, null];
    }

    try {
      const reliabilityInt = parseInt(parseFloat(reliabilityValue.toString().trim()).toString());

      if (reliabilityInt < 0) {
        return [null, 'Reliability score cannot be negative'];
      } else if (reliabilityInt > 100) {
        return [null, 'Reliability score cannot exceed 100%'];
      }

      return [reliabilityInt, null];
    } catch {
      return [null, 'Please enter a whole number between 0 and 100'];
    }
  }

  private detectDuprReliabilityPattern(
    duprSingles: number | null,
    duprDoubles: number | null,
    singlesReliability: number | null,
    doublesReliability: number | null
  ): { more_reliable_format: string | null; confidence_adjustment: number; notes: string[] } {
    const patternAnalysis = {
      more_reliable_format: null as string | null,
      confidence_adjustment: 1.0,
      notes: [] as string[],
    };

    if (duprSingles && duprDoubles) {
      const singlesHigher = duprSingles > duprDoubles;
      const difference = Math.abs(duprSingles - duprDoubles);

      if (singlesHigher && difference > 0.15) {
        patternAnalysis.more_reliable_format = 'doubles';
        patternAnalysis.notes.push('Singles higher than doubles - common pattern');
        patternAnalysis.notes.push('Doubles likely more accurate due to higher play volume');

        if (doublesReliability && doublesReliability > 50) {
          patternAnalysis.confidence_adjustment = 1.2;
          patternAnalysis.notes.push('High doubles reliability confirms pattern');
        }

        if (singlesReliability && singlesReliability < 40) {
          patternAnalysis.confidence_adjustment = 1.3;
          patternAnalysis.notes.push('Low singles reliability supports doubles as more accurate');
        }
      } else if (!singlesHigher && difference > 0.2) {
        patternAnalysis.more_reliable_format = 'singles';
        patternAnalysis.notes.push('Doubles higher than singles - less common pattern');
        patternAnalysis.notes.push('May indicate specialized doubles player');
        patternAnalysis.confidence_adjustment = 0.9;
      }
    }

    return patternAnalysis;
  }

  private skillAwareEstimation(knownDupr: number, knownFormat: string, reliabilityScore: number | null = null): number {
    if (knownFormat === 'doubles') {
      const baseOffsets: Array<[number, number]> = [
        [2.5, 0.05],
        [3.5, 0.15],
        [4.5, 0.25],
        [6.0, 0.15],
        [8.0, 0.05],
      ];

      let offset = 0.15;
      for (const [threshold, off] of baseOffsets) {
        if (knownDupr <= threshold) {
          offset = off;
          break;
        }
      }

      if (reliabilityScore && reliabilityScore > 70) {
        offset *= 1.2;
      } else if (reliabilityScore && reliabilityScore < 30) {
        offset *= 0.7;
      }

      return Math.min(8.0, knownDupr + offset);
    } else {
      const baseOffsets: Array<[number, number]> = [
        [2.5, 0.05],
        [3.5, 0.1],
        [4.5, 0.2],
        [6.0, 0.15],
        [8.0, 0.05],
      ];

      let offset = 0.15;
      for (const [threshold, off] of baseOffsets) {
        if (knownDupr <= threshold) {
          offset = off;
          break;
        }
      }

      if (reliabilityScore && reliabilityScore < 40) {
        offset *= 1.3;
      } else if (reliabilityScore && reliabilityScore > 80) {
        offset *= 0.8;
      }

      return Math.max(2.0, knownDupr - offset);
    }
  }

  private calculateReliabilityAdjustedRd(
    baseRd: number,
    reliabilityScore: number | null,
    formatType: string,
    hasBothRatings: boolean = false
  ): number {
    let reliability = reliabilityScore;
    if (reliability === null) {
      if (formatType === 'singles') {
        reliability = this.RELIABILITY_ASSUMPTIONS.singles_default;
      } else {
        reliability = this.RELIABILITY_ASSUMPTIONS.doubles_default;
      }
    }

    let multiplier: number;
    if (reliability >= 85) {
      multiplier = 0.6;
    } else if (reliability >= 70) {
      multiplier = 0.8;
    } else if (reliability >= 50) {
      multiplier = 1.0;
    } else if (reliability >= 30) {
      multiplier = 1.4;
    } else {
      multiplier = 1.8;
    }

    if (formatType === 'singles') {
      multiplier *= this.RELIABILITY_ASSUMPTIONS.singles_penalty;
    } else if (formatType === 'doubles') {
      multiplier *= this.RELIABILITY_ASSUMPTIONS.doubles_bonus;
    }

    if (!hasBothRatings) {
      multiplier *= 1.1;
    }

    return Math.min(350, Math.round(baseRd * multiplier));
  }

  private convertDuprToDmr(
    duprSingles: number | null = null,
    duprDoubles: number | null = null,
    singlesReliability: number | null = null,
    doublesReliability: number | null = null
  ): RatingResult | null {
    const duprToDmrConversion = (duprRating: number | null): number | null => {
      if (duprRating === null) return null;

      const dupr = Math.max(2.0, Math.min(8.0, duprRating));

      let dmrRating: number;
      if (dupr <= 3.0) {
        dmrRating = 1000 + (dupr - 2.0) * 900;
      } else if (dupr <= 4.0) {
        dmrRating = 1900 + (dupr - 3.0) * 1000;
      } else if (dupr <= 5.0) {
        dmrRating = 2900 + (dupr - 4.0) * 1000;
      } else if (dupr <= 6.0) {
        dmrRating = 3900 + (dupr - 5.0) * 800;
      } else {
        dmrRating = 4700 + (dupr - 6.0) * 650;
      }

      return Math.round(dmrRating);
    };

    // Validate inputs
    if (duprSingles) {
      const [validatedSingles, error] = this.validateDuprInput(duprSingles, 'singles');
      if (error) throw new Error(`Invalid DUPR Singles: ${error}`);
      duprSingles = validatedSingles;
    }

    if (duprDoubles) {
      const [validatedDoubles, error] = this.validateDuprInput(duprDoubles, 'doubles');
      if (error) throw new Error(`Invalid DUPR Doubles: ${error}`);
      duprDoubles = validatedDoubles;
    }

    if (singlesReliability) {
      const [validatedSinglesRel, error] = this.validateReliabilityInput(singlesReliability);
      if (error) throw new Error(`Invalid Singles Reliability: ${error}`);
      singlesReliability = validatedSinglesRel;
    }

    if (doublesReliability) {
      const [validatedDoublesRel, error] = this.validateReliabilityInput(doublesReliability);
      if (error) throw new Error(`Invalid Doubles Reliability: ${error}`);
      doublesReliability = validatedDoublesRel;
    }

    // Analyze DUPR pattern
    const patternAnalysis = this.detectDuprReliabilityPattern(
      duprSingles,
      duprDoubles,
      singlesReliability,
      doublesReliability
    );

    // Convert ratings
    let singlesDmr = duprToDmrConversion(duprSingles);
    let doublesDmr = duprToDmrConversion(duprDoubles);

    const hasBothRatings = Boolean(singlesDmr && doublesDmr);

    let confidence: 'low' | 'medium' | 'medium-high' | 'high';
    let rd: number;
    let sourceDetail: string;

    // Handle missing ratings
    if (singlesDmr && !doublesDmr) {
      const estimatedDuprDoubles = this.skillAwareEstimation(duprSingles!, 'singles', singlesReliability);
      doublesDmr = duprToDmrConversion(estimatedDuprDoubles);
      confidence = 'medium';

      const baseRd = 130;
      rd = this.calculateReliabilityAdjustedRd(baseRd, singlesReliability, 'singles', hasBothRatings);

      sourceDetail = `DUPR Singles: ${duprSingles} (reliability: ${singlesReliability || 'low-assumed'}%), Doubles estimated: ${estimatedDuprDoubles.toFixed(2)}`;
    } else if (doublesDmr && !singlesDmr) {
      const estimatedDuprSingles = this.skillAwareEstimation(duprDoubles!, 'doubles', doublesReliability);
      singlesDmr = duprToDmrConversion(estimatedDuprSingles);
      confidence = 'medium-high';

      const baseRd = 110;
      rd = this.calculateReliabilityAdjustedRd(baseRd, doublesReliability, 'doubles', hasBothRatings);

      sourceDetail = `DUPR Doubles: ${duprDoubles} (reliability: ${doublesReliability || 'medium-assumed'}%), Singles estimated: ${estimatedDuprSingles.toFixed(2)}`;
    } else if (singlesDmr && doublesDmr) {
      if (patternAnalysis.more_reliable_format === 'doubles') {
        confidence = 'high';
        const baseRd = 65;
        rd = Math.round(baseRd / patternAnalysis.confidence_adjustment);
        rd = this.calculateReliabilityAdjustedRd(rd, doublesReliability, 'both', hasBothRatings);
      } else if (patternAnalysis.more_reliable_format === 'singles') {
        confidence = 'medium-high';
        const baseRd = 75;
        rd = Math.round(baseRd / patternAnalysis.confidence_adjustment);
        rd = this.calculateReliabilityAdjustedRd(rd, singlesReliability, 'both', hasBothRatings);
      } else {
        confidence = 'high';
        const reliabilities = [singlesReliability, doublesReliability].filter(r => r !== null) as number[];
        const primaryReliability = reliabilities.length > 0 ? reliabilities.reduce((a, b) => a + b, 0) / reliabilities.length : null;
        const baseRd = 70;
        rd = Math.round(baseRd / patternAnalysis.confidence_adjustment);
        rd = this.calculateReliabilityAdjustedRd(rd, primaryReliability, 'both', hasBothRatings);
      }

      const patternNotes = patternAnalysis.notes.length > 0 ? patternAnalysis.notes.join(' | ') : 'Standard pattern';
      sourceDetail = `DUPR Singles: ${duprSingles} (reliability: ${singlesReliability || 'unknown'}%), Doubles: ${duprDoubles} (reliability: ${doublesReliability || 'unknown'}%) | ${patternNotes}`;
    } else {
      return null;
    }

    return {
      singles_rating: singlesDmr!,
      doubles_rating: doublesDmr!,
      confidence,
      rating_deviation: rd,
      source: 'dupr_conversion',
      original_dupr_singles: duprSingles,
      original_dupr_doubles: duprDoubles,
      singles_reliability: singlesReliability,
      doubles_reliability: doublesReliability,
      pattern_analysis: patternAnalysis,
      adjustment_detail: {
        dupr_source: sourceDetail,
        has_both_ratings: hasBothRatings,
        more_reliable_format: patternAnalysis.more_reliable_format,
        confidence_adjustment: patternAnalysis.confidence_adjustment,
      },
    };
  }

  private convertDuprToRating(duprSingles: number | null, duprDoubles: number | null): RatingResult {
    const duprToRatingConversion = (dupr: number): number => {
      const clampedDupr = Math.max(2.0, Math.min(8.0, dupr));
      
      if (clampedDupr <= 3.0) {
        return 1000 + (clampedDupr - 2.0) * 900;
      } else if (clampedDupr <= 4.0) {
        return 1900 + (clampedDupr - 3.0) * 1000;
      } else if (clampedDupr <= 5.0) {
        return 2900 + (clampedDupr - 4.0) * 1000;
      } else if (clampedDupr <= 6.0) {
        return 3900 + (clampedDupr - 5.0) * 800;
      } else {
        return 4700 + (clampedDupr - 6.0) * 650;
      }
    };

    let singlesRating = duprSingles ? Math.round(duprToRatingConversion(duprSingles)) : null;
    let doublesRating = duprDoubles ? Math.round(duprToRatingConversion(duprDoubles)) : null;

    // Estimate missing ratings
    if (singlesRating && !doublesRating) {
      const estimatedDuprDoubles = Math.max(2.0, duprSingles! - 0.15);
      doublesRating = Math.round(duprToRatingConversion(estimatedDuprDoubles));
    } else if (doublesRating && !singlesRating) {
      const estimatedDuprSingles = Math.min(8.0, duprDoubles! + 0.15);
      singlesRating = Math.round(duprToRatingConversion(estimatedDuprSingles));
    }

    return {
      singles_rating: singlesRating || this.BASE_RATING,
      doubles_rating: doublesRating || this.BASE_RATING,
      confidence: 'high',
      rating_deviation: 110,
      source: 'dupr_conversion',
    };
  }

  generateFeedback(ratingData: RatingResult): string {
    const singlesRating = ratingData.singles_rating;
    const confidence = ratingData.confidence;
    const source = ratingData.source;

    // Determine skill level label based on rating
    let level: string;
    let description: string;

    if (singlesRating < 1200) {
      level = 'Beginner';
      description = "You're just starting your pickleball journey. Focus on learning the basic rules and shots.";
    } else if (singlesRating < 1500) {
      level = 'Advanced Beginner';
      description = 'You understand the basics and are developing consistency. Work on your dinking and third shot drops.';
    } else if (singlesRating < 1800) {
      level = 'Lower Intermediate';
      description = 'You have decent consistency and are developing better shot selection. Focus on strategy and positioning.';
    } else if (singlesRating < 2200) {
      level = 'Intermediate';
      description = 'You have good consistency and shot variety. Work on reducing unforced errors and improving your net game.';
    } else if (singlesRating < 2800) {
      level = 'Upper Intermediate';
      description = 'You have strong fundamentals and good strategy. Focus on adding more finesse to your soft game and shot placement.';
    } else if (singlesRating < 3500) {
      level = 'Advanced';
      description = 'You have excellent control, strategy, and shot selection. Work on adding more deception and adaptability to your game.';
    } else if (singlesRating < 4500) {
      level = 'Expert';
      description = 'You show mastery of all aspects of pickleball. Keep refining your game and working on mental toughness.';
    } else {
      level = 'Professional';
      description = 'You compete at the highest levels of pickleball. Focus on maintaining peak performance and strategic innovation.';
    }

    let confidenceNote: string;
    if (source === 'dupr_conversion') {
      confidenceNote = 'Your ratings were converted from your DUPR ratings. This provides a highly accurate starting point.';
    } else {
      if (confidence === 'low') {
        confidenceNote = "Since you're new to pickleball or have limited experience, your initial rating might change significantly as you play more matches.";
      } else if (confidence === 'medium') {
        confidenceNote = 'Based on your responses, we have a moderate level of confidence in this rating. It may adjust somewhat as you play more matches.';
      } else {
        confidenceNote = 'Based on your detailed responses, we have high confidence in this rating, but it will still be refined as you play matches.';
      }
    }

    return `Based on your ${source === 'dupr_conversion' ? 'DUPR ratings' : 'questionnaire responses'}, your initial rating is:

Singles DMR: ${singlesRating}
Doubles DMR: ${ratingData.doubles_rating}

Skill Level: ${level}

${description}

${confidenceNote}

Your rating will automatically adjust as you play matches in the app, becoming more accurate over time.`;
  }
}
