import { useMemo } from 'react';
import type { QuestionnaireResponse } from '../types/questionnaire.types';

interface QuestionnaireService {
  getConditionalQuestions: (responses: any) => any[];
}

interface ProgressResult {
  current: number;
  total: number;
}

/**
 * Custom hook to calculate questionnaire progress.
 * Simulates the full questionnaire flow to determine total questions
 * and counts answered questions for current progress.
 */
export function useQuestionProgress(
  questionnaireType: 'pickleball' | 'tennis' | 'padel' | null,
  questionnaire: QuestionnaireService | null,
  responses: QuestionnaireResponse,
  currentPageAnswers: { [key: string]: any },
  expandSkillMatrixQuestions: (questions: any[]) => any[]
): ProgressResult {
  return useMemo(() => {
    if (!questionnaireType || !questionnaire) {
      return { current: 1, total: 1 };
    }

    // Count answered questions
    let answeredQuestions = 0;
    for (const [key, value] of Object.entries(responses)) {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'object' && !Array.isArray(value)) {
          answeredQuestions += Object.keys(value).length;
        } else {
          answeredQuestions += 1;
        }
      }
    }

    // Merge current answers
    const allResponses = { ...responses, ...currentPageAnswers };

    // Simulate total questions by walking through the questionnaire flow
    let totalQuestions = 0;
    let tempResponses: QuestionnaireResponse = {};
    const processedKeys = new Set<string>();

    while (true) {
      const questionsForThisStep = questionnaire.getConditionalQuestions(tempResponses);
      if (questionsForThisStep.length === 0) break;

      const newQuestions = questionsForThisStep.filter(q => !processedKeys.has(q.key));
      if (newQuestions.length === 0) break;

      const expanded = expandSkillMatrixQuestions(newQuestions);
      totalQuestions += expanded.length;

      for (const q of newQuestions) {
        processedKeys.add(q.key);
        if (allResponses[q.key] !== undefined) {
          tempResponses[q.key] = allResponses[q.key];
        } else {
          // Provide dummy answer for simulation
          if (q.type === 'single_choice') {
            tempResponses[q.key] = q.options?.[0] || '';
          } else if (q.type === 'number') {
            tempResponses[q.key] = q.min_value !== undefined ? q.min_value : 0;
          } else if (q.type === 'skill_matrix' && q.sub_questions) {
            const skillResp: { [key: string]: string } = {};
            for (const [sk, sd] of Object.entries(q.sub_questions)) {
              skillResp[sk] = (sd as any).options[0] || '';
            }
            tempResponses[q.key] = skillResp;
          }
        }
      }
    }

    // Ensure current never exceeds total
    const current = Math.min(answeredQuestions + 1, totalQuestions);
    return { current, total: Math.max(current, totalQuestions) };
  }, [questionnaireType, questionnaire, responses, currentPageAnswers, expandSkillMatrixQuestions]);
}
