import {
  buildPath,
  findQuiz,
  getLessonLocation,
  getNodeStatus,
  isNodeDone,
  listNodes,
} from '../path';
import { EMPTY_PROGRESS } from '../progress';
import type { Progress } from '../types';
import { ALL_DONE, fixture, progressWith, QUIZ_A } from './fixtures';

function statuses(progress: Progress) {
  return Object.fromEntries(
    buildPath(fixture, progress)
      .units.flatMap((unit) => unit.nodes)
      .map((node) => [node.id, node.status]),
  );
}

function unitStatuses(progress: Progress) {
  return buildPath(fixture, progress).units.map((unit) => unit.status);
}

const failedQuizA: Progress = {
  completedLessons: progressWith(['a-l1', 'a-l2']).completedLessons,
  quizResults: { 'a-quiz': { attempts: 1, bestPercent: 40, lastPercent: 40, passedOn: null } },
};

describe('listNodes', () => {
  it('lists lessons then the quiz, unit by unit, with positions', () => {
    expect(listNodes(fixture)).toEqual([
      { kind: 'lesson', id: 'a-l1', title: 'a-l1', unitIndex: 0, indexInUnit: 0 },
      { kind: 'lesson', id: 'a-l2', title: 'a-l2', unitIndex: 0, indexInUnit: 1 },
      { kind: 'quiz', id: 'a-quiz', title: 'Unit A', unitIndex: 0, indexInUnit: 2 },
      { kind: 'lesson', id: 'b-l1', title: 'b-l1', unitIndex: 1, indexInUnit: 0 },
      { kind: 'lesson', id: 'b-l2', title: 'b-l2', unitIndex: 1, indexInUnit: 1 },
      { kind: 'quiz', id: 'b-quiz', title: 'Unit B', unitIndex: 1, indexInUnit: 2 },
    ]);
  });
});

describe('isNodeDone', () => {
  it('treats a lesson as done when its id is completed', () => {
    const progress = progressWith(['a-l1']);
    expect(isNodeDone(progress, { kind: 'lesson', id: 'a-l1' })).toBe(true);
    expect(isNodeDone(progress, { kind: 'lesson', id: 'a-l2' })).toBe(false);
  });

  it('treats a quiz as done only when passedOn is set', () => {
    expect(isNodeDone(failedQuizA, { kind: 'quiz', id: 'a-quiz' })).toBe(false);
    expect(isNodeDone(progressWith([], ['a-quiz']), { kind: 'quiz', id: 'a-quiz' })).toBe(true);
  });
});

describe('buildPath', () => {
  it('starts with only the first lesson active', () => {
    expect(statuses(EMPTY_PROGRESS)).toEqual({
      'a-l1': 'active',
      'a-l2': 'locked',
      'a-quiz': 'locked',
      'b-l1': 'locked',
      'b-l2': 'locked',
      'b-quiz': 'locked',
    });
    expect(buildPath(fixture, EMPTY_PROGRESS).active?.id).toBe('a-l1');
    expect(unitStatuses(EMPTY_PROGRESS)).toEqual(['active', 'locked']);
  });

  it('moves the active node from lesson to lesson', () => {
    expect(buildPath(fixture, progressWith(['a-l1'])).active?.id).toBe('a-l2');
  });

  it('moves to the quiz after the last lesson of a unit', () => {
    const path = buildPath(fixture, progressWith(['a-l1', 'a-l2']));
    expect(path.active).toMatchObject({ id: 'a-quiz', kind: 'quiz', status: 'active' });
    expect(statuses(progressWith(['a-l1', 'a-l2']))['b-l1']).toBe('locked');
  });

  it('keeps a failed quiz active and the next unit locked', () => {
    expect(buildPath(fixture, failedQuizA).active?.id).toBe('a-quiz');
    expect(statuses(failedQuizA)['b-l1']).toBe('locked');
    expect(unitStatuses(failedQuizA)).toEqual(['active', 'locked']);
  });

  it('unlocks the next unit when the quiz is passed', () => {
    const progress = progressWith(['a-l1', 'a-l2'], ['a-quiz']);
    expect(buildPath(fixture, progress).active).toMatchObject({ id: 'b-l1', unitIndex: 1 });
    expect(unitStatuses(progress)).toEqual(['completed', 'active']);
  });

  it('has no active node when everything is done', () => {
    const path = buildPath(fixture, ALL_DONE);
    expect(path.active).toBeNull();
    expect(unitStatuses(ALL_DONE)).toEqual(['completed', 'completed']);
  });

  it('shows out-of-order data as completed and keeps the first undone node active', () => {
    const progress = progressWith(['b-l1']);
    expect(statuses(progress)).toMatchObject({
      'a-l1': 'active',
      'b-l1': 'completed',
      'b-l2': 'locked',
    });
    expect(unitStatuses(progress)).toEqual(['active', 'locked']);
  });
});

describe('getNodeStatus', () => {
  it('returns the status of lessons and quizzes', () => {
    const progress = progressWith(['a-l1', 'a-l2']);
    expect(getNodeStatus(fixture, progress, 'a-l1')).toBe('completed');
    expect(getNodeStatus(fixture, progress, 'a-quiz')).toBe('active');
    expect(getNodeStatus(fixture, progress, 'b-l1')).toBe('locked');
  });

  it('returns null for an unknown id', () => {
    expect(getNodeStatus(fixture, EMPTY_PROGRESS, 'nope')).toBeNull();
  });
});

describe('getLessonLocation', () => {
  it('returns 1-based numbers', () => {
    expect(getLessonLocation(fixture, 'b-l2')).toMatchObject({
      unit: { id: 'b' },
      unitNumber: 2,
      lesson: { id: 'b-l2' },
      lessonNumber: 2,
      lessonCount: 2,
    });
  });

  it('returns null for an unknown id', () => {
    expect(getLessonLocation(fixture, 'nope')).toBeNull();
  });
});

describe('findQuiz', () => {
  it('returns the quiz with its 1-based unit number', () => {
    expect(findQuiz(fixture, 'a-quiz')).toEqual({
      unit: fixture.units[0],
      unitNumber: 1,
      quiz: QUIZ_A,
    });
  });

  it('returns null for an unknown id', () => {
    expect(findQuiz(fixture, 'nope')).toBeNull();
  });
});
