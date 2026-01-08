import type { AnyQuestion, ExpandedQuestion, ShowIfCondition } from '../types/questionnaire.types';

/**
 * Expands skill matrix questions into individual single-choice questions.
 * This converts a skill matrix (multiple questions in one) into separate questions
 * for easier rendering and navigation.
 *
 * IMPORTANT: Propagates showIf conditions from parent skill_matrix to each sub-question.
 *
 * @param questions - Array of questions that may contain skill_matrix types
 * @returns Array of questions with skill matrices expanded
 */
export function expandSkillMatrixQuestions(questions: AnyQuestion[]): ExpandedQuestion[] {
  const expandedQuestions: ExpandedQuestion[] = [];

  questions.forEach(question => {
    if (question.type === 'skill_matrix' && question.sub_questions) {
      // Create individual questions for each skill
      Object.entries(question.sub_questions).forEach(([skillKey, skillData]) => {
        const skill = skillData as { question: string; options: string[]; tooltip?: string };
        const expandedQuestion: ExpandedQuestion = {
          key: `${question.key}_${skillKey}`,
          question: skill.question,
          type: 'single_choice' as const,
          options: skill.options,
          help_text: skill.tooltip,
          // Store the original question key for response mapping
          originalKey: question.key,
          skillKey: skillKey,
        };
        // Propagate showIf from parent skill_matrix to each sub-question
        if (question.showIf) {
          expandedQuestion.showIf = question.showIf;
        }
        expandedQuestions.push(expandedQuestion);
      });
    } else {
      expandedQuestions.push(question);
    }
  });

  return expandedQuestions;
}
