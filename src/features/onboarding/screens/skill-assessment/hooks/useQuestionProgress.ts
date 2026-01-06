import { useMemo } from 'react';
import type { QuestionnaireResponse } from '../types/questionnaire.types';
import { filterVisibleQuestions } from '../utils/showIfEvaluator';

interface QuestionnaireService {
  getAllQuestions: () => any[];
  getConditionalQuestions?: (responses: any) => any[];
}

interface ProgressResult {
  current: number;
  total: number;
}

/**
 * Custom hook to calculate questionnaire progress.
 * Uses getAllQuestions() with showIf filtering for accurate progress.
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

    // Merge current page answers with saved responses
    const allResponses = { ...responses, ...currentPageAnswers };

    // Get all questions, expand skill matrices, then filter to visible
    const allQuestions = questionnaire.getAllQuestions();
    const expandedQuestions = expandSkillMatrixQuestions(allQuestions);
    const visibleQuestions = filterVisibleQuestions(expandedQuestions, allResponses);

    // Count answered questions from visible set only
    let answeredQuestions = 0;
    for (const question of visibleQuestions) {
      const key = question.key;
      // Check in merged responses
      const value = allResponses[key];
      if (value !== undefined && value !== null && value !== '') {
        answeredQuestions += 1;
      }
    }

    const totalQuestions = visibleQuestions.length;

    // Current is answered + 1 (the question being worked on), capped at total
    const current = Math.min(answeredQuestions + 1, totalQuestions);
    return { current, total: Math.max(current, totalQuestions) };
  }, [questionnaireType, questionnaire, responses, currentPageAnswers, expandSkillMatrixQuestions]);
}
