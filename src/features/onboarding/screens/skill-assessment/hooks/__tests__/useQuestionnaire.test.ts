import { renderHook, act } from '@testing-library/react-native';
import { useQuestionnaire } from '../useQuestionnaire';

describe('useQuestionnaire', () => {
  describe('BUG 13: GO_BACK_HISTORY should preserve forward answers', () => {
    it('should keep responses from later questions when going back', () => {
      const { result } = renderHook(() => useQuestionnaire());

      // Simulate: user answers Q1, Q2, Q3 with history pushed at each step
      act(() => {
        // Set up questions
        result.current.actions.setQuestions([
          { key: 'q1', question: 'Q1', type: 'single_choice', options: ['A', 'B'] },
          { key: 'q2', question: 'Q2', type: 'single_choice', options: ['A', 'B'] },
          { key: 'q3', question: 'Q3', type: 'single_choice', options: ['A', 'B'] },
        ]);
      });

      // Answer Q1 and push history
      act(() => {
        result.current.actions.addResponse('q1', 'A');
        result.current.actions.pushHistory(
          result.current.state.questions,
          { q1: 'A' },
          0,
          { q1: 'A' }
        );
        result.current.actions.incrementPageIndex();
      });

      // Answer Q2 and push history
      act(() => {
        result.current.actions.addResponse('q2', 'B');
        result.current.actions.pushHistory(
          result.current.state.questions,
          { q1: 'A', q2: 'B' },
          1,
          { q2: 'B' }
        );
        result.current.actions.incrementPageIndex();
      });

      // Answer Q3
      act(() => {
        result.current.actions.addResponse('q3', 'A');
      });

      // Verify state before going back
      expect(result.current.state.responses).toEqual({ q1: 'A', q2: 'B', q3: 'A' });

      // Go back — should return to Q2's state but KEEP Q3's answer
      act(() => {
        result.current.actions.goBackHistory();
      });

      // BUG 13: Currently replaces ALL responses with history snapshot,
      // destroying Q3's answer. Should preserve it.
      expect(result.current.state.responses).toHaveProperty('q3', 'A');
      expect(result.current.state.responses).toHaveProperty('q1', 'A');
      expect(result.current.state.responses).toHaveProperty('q2', 'B');
    });
  });
});
