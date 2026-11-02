import AsyncStorage from '@react-native-async-storage/async-storage';

import { content } from '@/content';
import { EMPTY_PROGRESS, PERSIST_VERSION } from '@/domain/progress';
import type { PersistedState } from '@/domain/types';

import { useProgressStore } from '../progressStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const STORAGE_KEY = 'octolearn/progress';
const { completeLesson, reset, signIn, submitQuiz } = useProgressStore.getState();

function completeUnitLessons(unitIndex: number) {
  content.units[unitIndex].lessons.forEach((lesson) => completeLesson(lesson.id));
}

function correctAnswers(unitIndex: number) {
  return content.units[unitIndex].quiz.questions.map((question) => question.answerIndex);
}

async function readStored(): Promise<{ state: PersistedState; version: number }> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return JSON.parse(raw ?? 'null');
}

beforeEach(async () => {
  await useProgressStore.persist.rehydrate();
  reset();
});

describe('persistence', () => {
  it('writes a completed lesson to storage, without the actions', async () => {
    completeLesson('u1-l1');
    const stored = await readStored();
    expect(stored.version).toBe(PERSIST_VERSION);
    expect(Object.keys(stored.state).sort()).toEqual(['progress', 'user']);
    expect(Object.keys(stored.state.progress.completedLessons)).toEqual(['u1-l1']);
  });

  it('restores saved progress on rehydrate', async () => {
    signIn('Болд');
    completeLesson('u1-l1');
    const saved = await AsyncStorage.getItem(STORAGE_KEY);

    reset();
    await AsyncStorage.setItem(STORAGE_KEY, saved as string);
    await useProgressStore.persist.rehydrate();

    const { user, progress } = useProgressStore.getState();
    expect(user?.name).toBe('Болд');
    expect(Object.keys(progress.completedLessons)).toEqual(['u1-l1']);
    expect(useProgressStore.persist.hasHydrated()).toBe(true);
  });

  it('starts empty when the stored version does not match', async () => {
    signIn('Болд');
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { old: 'shape' }, version: PERSIST_VERSION + 1 }),
    );
    await useProgressStore.persist.rehydrate();

    const { user, progress } = useProgressStore.getState();
    expect(user).toBeNull();
    expect(progress).toEqual(EMPTY_PROGRESS);
  });

  it('clears progress and user on reset, in storage too', async () => {
    signIn('Болд');
    completeLesson('u1-l1');
    reset();

    const { user, progress } = useProgressStore.getState();
    expect(user).toBeNull();
    expect(progress).toEqual(EMPTY_PROGRESS);
    expect((await readStored()).state).toEqual({ user: null, progress: EMPTY_PROGRESS });
  });
});

describe('signIn', () => {
  it('trims the name and sets joinedOn', () => {
    signIn('  Сараа ');
    expect(useProgressStore.getState().user).toEqual({
      name: 'Сараа',
      avatarUrl: null,
      joinedOn: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    });
  });

  it('falls back to the default name when empty', () => {
    signIn('   ');
    expect(useProgressStore.getState().user?.name).toBe(content.user.name);
  });
});

describe('completeLesson', () => {
  it('gives XP the first time and 0 the second time', () => {
    expect(completeLesson('u1-l1').xpGained).toBe(10);
    expect(completeLesson('u1-l1')).toMatchObject({ xpGained: 0, totalXp: 10, unlocked: null });
  });

  it('keeps the same progress object when nothing changed', () => {
    completeLesson('u1-l1');
    const before = useProgressStore.getState().progress;
    completeLesson('u1-l1');
    completeLesson('u3-l5');
    expect(useProgressStore.getState().progress).toBe(before);
  });
});

describe('submitQuiz', () => {
  it('returns the score and the change, and unlocks the next unit on a pass', () => {
    completeUnitLessons(0);
    expect(submitQuiz('u1-quiz', correctAnswers(0))).toMatchObject({
      correct: 5,
      total: 5,
      percent: 100,
      passed: true,
      xpGained: 20,
      totalXp: 70,
      level: 2,
      unlocked: { id: 'u2-l1', kind: 'lesson', unitNumber: 2 },
      courseCompleted: false,
    });
    expect(useProgressStore.getState().progress.quizResults['u1-quiz'].attempts).toBe(1);
  });

  it('scores a locked quiz without recording it', () => {
    const before = useProgressStore.getState().progress;
    expect(submitQuiz('u1-quiz', correctAnswers(0))).toMatchObject({ passed: true, xpGained: 0 });
    expect(useProgressStore.getState().progress).toBe(before);
  });

  it('throws on an unknown quiz', () => {
    expect(() => submitQuiz('nope', [])).toThrow('Unknown quiz: nope');
  });

  it('reports the course as completed after the last quiz', () => {
    [0, 1].forEach((unitIndex) => {
      completeUnitLessons(unitIndex);
      submitQuiz(content.units[unitIndex].quiz.id, correctAnswers(unitIndex));
    });
    completeUnitLessons(2);
    expect(submitQuiz('u3-quiz', correctAnswers(2))).toMatchObject({
      totalXp: 210,
      unlocked: null,
      courseCompleted: true,
    });
  });
});
