import { Question, QuestionnaireResponse } from '@/src/features/onboarding/services/PickleballQuestionnaire';
import { TennisQuestion, TennisQuestionnaireResponse } from '@/src/features/onboarding/services/TennisQuestionnaire';
import { PadelQuestion, PadelQuestionnaireResponse } from '@/src/features/onboarding/services/PadelQuestionnaire';

// Expand skill matrix questions into individual questions
export const expandSkillMatrixQuestions = (
  questions: Question[] | TennisQuestion[] | PadelQuestion[]
): (Question | TennisQuestion | PadelQuestion)[] => {
  const expanded: (Question | TennisQuestion | PadelQuestion)[] = [];
  
  questions.forEach(question => {
    if (question.type === 'skill_matrix' && (question as any).sub_questions) {
      const subQuestions = (question as any).sub_questions;
      Object.entries(subQuestions).forEach(([key, subQ]: [string, any]) => {
        expanded.push({
          key: `${question.key}_${key}`,
          question: subQ.question,
          type: 'single_choice' as const,
          options: subQ.options || [],
          help_text: question.help_text,
          originalKey: question.key,
          skillKey: key,
        } as Question | TennisQuestion | PadelQuestion);
      });
    } else {
      expanded.push(question);
    }
  });
  
  return expanded;
};

// Calculate total questions and current progress
export const getQuestionProgress = (
  currentQuestionnaireType: 'pickleball' | 'tennis' | 'padel' | null,
  responses: QuestionnaireResponse | TennisQuestionnaireResponse | PadelQuestionnaireResponse,
  currentPageAnswers: { [key: string]: any },
  pickleballQuestionnaire: any,
  tennisQuestionnaire: any,
  padelQuestionnaire: any,
  expandSkillMatrixQuestions: (questions: any[]) => any[]
) => {
  if (!currentQuestionnaireType) {
    return { current: 1, total: 1 };
  }
  
  const questionnaire = currentQuestionnaireType === 'pickleball' ? pickleballQuestionnaire : 
                       currentQuestionnaireType === 'tennis' ? tennisQuestionnaire : padelQuestionnaire;
  
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
  
  const allResponses = { ...responses, ...currentPageAnswers };
  
  // Calculate total questions
  let totalQuestions = 0;
  let tempResponses: QuestionnaireResponse = {};
  const processedKeys = new Set<string>();
  
  while (true) {
    const questionsForThisStep = questionnaire.getConditionalQuestions(tempResponses);
    if (questionsForThisStep.length === 0) break;
    
    const newQuestions = questionsForThisStep.filter((q: Question | TennisQuestion | PadelQuestion) => !processedKeys.has(q.key));
    if (newQuestions.length === 0) {
      break;
    }
    
    const expanded = expandSkillMatrixQuestions(newQuestions);
    totalQuestions += expanded.length;
    
    for (const q of newQuestions as (Question | TennisQuestion | PadelQuestion)[]) {
      processedKeys.add(q.key);
      if (allResponses[q.key] !== undefined) {
        tempResponses[q.key] = allResponses[q.key];
      } else {
        if (q.type === 'single_choice') {
          tempResponses[q.key] = q.options?.[0] || '';
        } else if (q.type === 'number') {
          tempResponses[q.key] = (q as any).min_value !== undefined ? (q as any).min_value : 0;
        } else if (q.type === 'skill_matrix' && (q as any).sub_questions) {
          const skillResp: { [key: string]: string } = {};
          for (const [sk, sd] of Object.entries((q as any).sub_questions)) {
            skillResp[sk] = (sd as any).options[0] || '';
          }
          tempResponses[q.key] = skillResp;
        }
      }
    }
  }
  
  // current never exceeds total
  const current = Math.min(answeredQuestions + 1, totalQuestions);
  return { current, total: Math.max(current, totalQuestions) };
};

