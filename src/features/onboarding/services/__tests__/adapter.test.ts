/**
 * BUG 18: Adapter crashes on malformed data
 */

jest.mock('../api', () => ({
  questionnaireAPI: {
    getQuestionnaire: jest.fn(),
    submitQuestionnaire: jest.fn(),
    getSportResponse: jest.fn(),
  },
}));

import { QuestionnaireBackendAdapter } from '../adapter';

describe('QuestionnaireBackendAdapter', () => {
  describe('convertToFrontendQuestions', () => {
    let adapter: QuestionnaireBackendAdapter;

    beforeEach(() => {
      // Reset singleton for clean tests
      adapter = QuestionnaireBackendAdapter.getInstance();
    });

    it('should convert single_choice questions', () => {
      const backendData = {
        sport: 'tennis',
        version: 1,
        questions: [{
          key: 'experience',
          question: 'How long?',
          type: 'single_choice' as const,
          options: [{ label: '1 year', value: '1' }, { label: '5 years', value: '5' }],
        }],
      };

      const result = adapter.convertToFrontendQuestions('tennis', backendData as any);
      expect(result[0].options).toEqual(['1 year', '5 years']);
    });

    // BUG-SPECIFIC TEST: should not crash on null options
    it('should not crash when skill_matrix subQuestion has null options', () => {
      const backendData = {
        sport: 'tennis',
        version: 1,
        questions: [{
          key: 'skills',
          question: 'Rate your skills',
          type: 'skill_matrix' as const,
          subQuestions: {
            forehand: { question: 'Forehand?', options: null as any },
          },
        }],
      };

      expect(() => {
        adapter.convertToFrontendQuestions('tennis', backendData as any);
      }).not.toThrow();
    });

    it('should not crash when skill_matrix subQuestion has undefined options', () => {
      const backendData = {
        sport: 'tennis',
        version: 1,
        questions: [{
          key: 'skills',
          question: 'Rate your skills',
          type: 'skill_matrix' as const,
          subQuestions: {
            forehand: { question: 'Forehand?', options: undefined as any },
          },
        }],
      };

      expect(() => {
        adapter.convertToFrontendQuestions('tennis', backendData as any);
      }).not.toThrow();

      const result = adapter.convertToFrontendQuestions('tennis', backendData as any);
      expect(result[0].sub_questions.forehand.options).toEqual([]);
    });

    it('should handle skill_matrix with valid options normally', () => {
      const backendData = {
        sport: 'tennis',
        version: 1,
        questions: [{
          key: 'skills',
          question: 'Rate your skills',
          type: 'skill_matrix' as const,
          subQuestions: {
            forehand: {
              question: 'Forehand?',
              options: [{ label: 'Beginner', value: '1' }, { label: 'Advanced', value: '3' }],
            },
          },
        }],
      };

      const result = adapter.convertToFrontendQuestions('tennis', backendData as any);
      expect(result[0].sub_questions.forehand.options).toEqual(['Beginner', 'Advanced']);
    });
  });
});
