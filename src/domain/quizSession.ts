import type { QuizSession, QuizSessionAction } from './types';

export const initialQuizSession: QuizSession = {
  index: 0,
  selected: null,
  checked: false,
  answers: [],
};

export function quizSessionReducer(state: QuizSession, action: QuizSessionAction): QuizSession {
  switch (action.type) {
    case 'select':
      if (state.checked || state.selected === action.option) return state;
      return { ...state, selected: action.option };
    case 'check':
      if (state.checked || state.selected === null) return state;
      return { ...state, checked: true, answers: [...state.answers, state.selected] };
    case 'next':
      if (!state.checked) return state;
      return { ...state, index: state.index + 1, selected: null, checked: false };
  }
}
