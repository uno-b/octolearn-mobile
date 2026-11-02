import { initialQuizSession, quizSessionReducer } from '../quizSession';
import type { QuizSession } from '../types';

const selected: QuizSession = { ...initialQuizSession, selected: 2 };
const checked: QuizSession = { index: 0, selected: 2, checked: true, answers: [2] };

describe('quizSessionReducer', () => {
  describe('select', () => {
    it('sets the selection and can change it before checking', () => {
      expect(quizSessionReducer(initialQuizSession, { type: 'select', option: 2 }).selected).toBe(
        2,
      );
      expect(quizSessionReducer(selected, { type: 'select', option: 0 }).selected).toBe(0);
    });

    it('returns the same state when the option is already selected', () => {
      expect(quizSessionReducer(selected, { type: 'select', option: 2 })).toBe(selected);
    });

    it('is ignored once checked', () => {
      expect(quizSessionReducer(checked, { type: 'select', option: 0 })).toBe(checked);
    });
  });

  describe('check', () => {
    it('is a no-op without a selection', () => {
      expect(quizSessionReducer(initialQuizSession, { type: 'check' })).toBe(initialQuizSession);
    });

    it('records the answer', () => {
      expect(quizSessionReducer(selected, { type: 'check' })).toEqual(checked);
    });

    it('does not record the answer twice', () => {
      expect(quizSessionReducer(checked, { type: 'check' })).toBe(checked);
    });
  });

  describe('next', () => {
    it('is a no-op before check', () => {
      expect(quizSessionReducer(selected, { type: 'next' })).toBe(selected);
    });

    it('advances, clears the selection and keeps the answers', () => {
      expect(quizSessionReducer(checked, { type: 'next' })).toEqual({
        index: 1,
        selected: null,
        checked: false,
        answers: [2],
      });
    });
  });

  it('collects answers across a whole session without mutating', () => {
    const steps = [
      { type: 'select', option: 1 },
      { type: 'check' },
      { type: 'next' },
      { type: 'select', option: 0 },
      { type: 'check' },
    ] as const;
    const state = steps.reduce(quizSessionReducer, initialQuizSession);
    expect(state).toEqual({ index: 1, selected: 0, checked: true, answers: [1, 0] });
    expect(initialQuizSession.answers).toEqual([]);
  });
});
