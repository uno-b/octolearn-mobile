import {
  applyLessonCompleted,
  applyQuizSubmitted,
  EMPTY_PROGRESS,
  migratePersistedState,
  PERSIST_VERSION,
  scoreQuiz,
  summarizeChange,
} from '../progress';
import type { PersistedState } from '../types';
import { ALL_DONE, answers, fixture, progressWith, QUIZ_A, QUIZ_B, TODAY } from './fixtures';

const LATER = '2026-03-20';
const READY_FOR_QUIZ_A = progressWith(['a-l1', 'a-l2']);

function submitA(progress = READY_FOR_QUIZ_A, correct = 3, day = TODAY) {
  return applyQuizSubmitted(fixture, progress, QUIZ_A, answers(correct, 5), day).progress;
}

describe('applyLessonCompleted', () => {
  it('records the active lesson with the day, without mutating', () => {
    const before = progressWith([]);
    const after = applyLessonCompleted(fixture, before, 'a-l1', TODAY);
    expect(after.completedLessons).toEqual({ 'a-l1': TODAY });
    expect(before.completedLessons).toEqual({});
  });

  it('returns the same object and 0 XP when completing twice', () => {
    const once = applyLessonCompleted(fixture, EMPTY_PROGRESS, 'a-l1', TODAY);
    const twice = applyLessonCompleted(fixture, once, 'a-l1', LATER);
    expect(twice).toBe(once);
    expect(summarizeChange(fixture, once, twice).xpGained).toBe(0);
  });

  it('is a no-op for a locked lesson', () => {
    expect(applyLessonCompleted(fixture, EMPTY_PROGRESS, 'a-l2', TODAY)).toBe(EMPTY_PROGRESS);
  });

  it('is a no-op for an unknown lesson', () => {
    expect(applyLessonCompleted(fixture, EMPTY_PROGRESS, 'nope', TODAY)).toBe(EMPTY_PROGRESS);
  });

  it('is a no-op for a quiz id', () => {
    expect(applyLessonCompleted(fixture, READY_FOR_QUIZ_A, 'a-quiz', TODAY)).toBe(READY_FOR_QUIZ_A);
  });
});

describe('scoreQuiz', () => {
  it.each([
    ['3/5 passes', QUIZ_A, answers(3, 5), { correct: 3, total: 5, percent: 60, passed: true }],
    ['2/5 fails', QUIZ_A, answers(2, 5), { correct: 2, total: 5, percent: 40, passed: false }],
    ['2/3 passes', QUIZ_B, answers(2, 3), { correct: 2, total: 3, percent: 67, passed: true }],
    ['1/3 fails', QUIZ_B, answers(1, 3), { correct: 1, total: 3, percent: 33, passed: false }],
  ])('%s', (_, quiz, given, expected) => {
    expect(scoreQuiz(quiz, given)).toEqual(expected);
  });

  it('counts missing answers as wrong', () => {
    expect(scoreQuiz(QUIZ_A, [0, 0])).toEqual({ correct: 2, total: 5, percent: 40, passed: false });
    expect(scoreQuiz(QUIZ_A, [])).toEqual({ correct: 0, total: 5, percent: 0, passed: false });
  });
});

describe('applyQuizSubmitted', () => {
  it('records a first failed attempt', () => {
    expect(submitA(READY_FOR_QUIZ_A, 2).quizResults['a-quiz']).toEqual({
      attempts: 1,
      bestPercent: 40,
      lastPercent: 40,
      passedOn: null,
    });
  });

  it('sets passedOn on the first pass', () => {
    const failed = submitA(READY_FOR_QUIZ_A, 2);
    expect(submitA(failed, 3).quizResults['a-quiz']).toEqual({
      attempts: 2,
      bestPercent: 60,
      lastPercent: 60,
      passedOn: TODAY,
    });
  });

  it('keeps the pass, its day and the best percent when a retake fails', () => {
    const passed = submitA(READY_FOR_QUIZ_A, 4);
    expect(submitA(passed, 1, LATER).quizResults['a-quiz']).toEqual({
      attempts: 2,
      bestPercent: 80,
      lastPercent: 20,
      passedOn: TODAY,
    });
  });

  it('keeps the first pass day when a retake passes again', () => {
    const passed = submitA(READY_FOR_QUIZ_A, 3);
    expect(submitA(passed, 5, LATER).quizResults['a-quiz']).toEqual({
      attempts: 2,
      bestPercent: 100,
      lastPercent: 100,
      passedOn: TODAY,
    });
  });

  it('returns the score with the new progress, without mutating', () => {
    const { score } = applyQuizSubmitted(fixture, READY_FOR_QUIZ_A, QUIZ_A, answers(3, 5), TODAY);
    expect(score).toEqual({ correct: 3, total: 5, percent: 60, passed: true });
    expect(READY_FOR_QUIZ_A.quizResults).toEqual({});
  });

  it('is a no-op for a locked quiz, but still scores it', () => {
    const { progress, score } = applyQuizSubmitted(
      fixture,
      EMPTY_PROGRESS,
      QUIZ_A,
      answers(5, 5),
      TODAY,
    );
    expect(progress).toBe(EMPTY_PROGRESS);
    expect(score.passed).toBe(true);
  });
});

describe('summarizeChange', () => {
  it('reports +10 and the next lesson for a lesson', () => {
    const after = applyLessonCompleted(fixture, EMPTY_PROGRESS, 'a-l1', TODAY);
    expect(summarizeChange(fixture, EMPTY_PROGRESS, after)).toEqual({
      xpGained: 10,
      totalXp: 10,
      level: 1,
      leveledUp: false,
      unlocked: { id: 'a-l2', kind: 'lesson', unitNumber: 1 },
      courseCompleted: false,
    });
  });

  it('reports the quiz as unlocked after the last lesson of a unit', () => {
    const before = progressWith(['a-l1']);
    const after = applyLessonCompleted(fixture, before, 'a-l2', TODAY);
    expect(summarizeChange(fixture, before, after).unlocked).toEqual({
      id: 'a-quiz',
      kind: 'quiz',
      unitNumber: 1,
    });
  });

  it('reports +20 and the first lesson of the next unit on a first pass', () => {
    const after = submitA();
    expect(summarizeChange(fixture, READY_FOR_QUIZ_A, after)).toMatchObject({
      xpGained: 20,
      totalXp: 40,
      unlocked: { id: 'b-l1', kind: 'lesson', unitNumber: 2 },
    });
  });

  it('reports 0 XP and nothing unlocked for a failed attempt', () => {
    const after = submitA(READY_FOR_QUIZ_A, 2);
    expect(summarizeChange(fixture, READY_FOR_QUIZ_A, after)).toMatchObject({
      xpGained: 0,
      unlocked: null,
    });
  });

  it('reports 0 XP and nothing unlocked for a retake of a passed quiz', () => {
    const passed = progressWith(['a-l1', 'a-l2', 'b-l1'], ['a-quiz']);
    const retaken = submitA(passed, 5, LATER);
    expect(retaken).not.toBe(passed);
    expect(summarizeChange(fixture, passed, retaken)).toMatchObject({
      xpGained: 0,
      unlocked: null,
    });
  });

  it('reports leveledUp when reaching 50 XP', () => {
    const before = progressWith(['a-l1', 'a-l2'], ['a-quiz']);
    const after = applyLessonCompleted(fixture, before, 'b-l1', TODAY);
    expect(summarizeChange(fixture, before, after)).toMatchObject({
      totalXp: 50,
      level: 2,
      leveledUp: true,
    });
  });

  it('does not report leveledUp below 50 XP', () => {
    const after = submitA();
    expect(summarizeChange(fixture, READY_FOR_QUIZ_A, after).leveledUp).toBe(false);
  });

  it('reports courseCompleted only on the transition to complete', () => {
    const before = progressWith(['a-l1', 'a-l2', 'b-l1', 'b-l2'], ['a-quiz']);
    const { progress: after } = applyQuizSubmitted(fixture, before, QUIZ_B, answers(2, 3), TODAY);
    expect(summarizeChange(fixture, before, after)).toMatchObject({
      courseCompleted: true,
      unlocked: null,
    });
    expect(summarizeChange(fixture, after, after).courseCompleted).toBe(false);
    expect(summarizeChange(fixture, ALL_DONE, ALL_DONE).courseCompleted).toBe(false);
    expect(summarizeChange(fixture, EMPTY_PROGRESS, before).courseCompleted).toBe(false);
  });
});

describe('migratePersistedState', () => {
  const EMPTY_STATE = { user: null, progress: EMPTY_PROGRESS };
  const valid: PersistedState = {
    user: { name: 'Bold', avatarUrl: null, joinedOn: TODAY },
    progress: progressWith(['a-l1']),
  };

  it('keeps a valid state at the current version', () => {
    expect(migratePersistedState(valid, PERSIST_VERSION)).toBe(valid);
    const signedOut = { user: null, progress: EMPTY_PROGRESS };
    expect(migratePersistedState(signedOut, PERSIST_VERSION)).toBe(signedOut);
  });

  it('resets on a version mismatch', () => {
    expect(migratePersistedState(valid, PERSIST_VERSION + 1)).toEqual(EMPTY_STATE);
    expect(migratePersistedState(valid, 0)).toEqual(EMPTY_STATE);
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['a string', 'garbage'],
    ['a number', 42],
    ['an array', []],
    ['an empty object', {}],
    ['a missing user', { progress: EMPTY_PROGRESS }],
    ['a null progress', { user: null, progress: null }],
    ['a partial progress', { user: null, progress: { completedLessons: {} } }],
    ['an array of lessons', { user: null, progress: { completedLessons: [], quizResults: {} } }],
    ['a nameless user', { user: { joinedOn: TODAY }, progress: EMPTY_PROGRESS }],
  ])('resets on %s', (_, garbage) => {
    expect(migratePersistedState(garbage, PERSIST_VERSION)).toEqual(EMPTY_STATE);
  });
});
