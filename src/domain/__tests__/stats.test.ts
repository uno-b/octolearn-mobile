import { content } from '@/content';

import { EMPTY_PROGRESS } from '../progress';
import {
  getCourseProgress,
  getInitial,
  getLevel,
  getProfileStats,
  getStreak,
  getTotalXp,
  getWeeklyActivity,
  getXpByDay,
} from '../stats';
import type { Progress } from '../types';
import { ALL_DONE, fixture, progressWith, TODAY } from './fixtures';

function withQuizBests(...bests: number[]): Progress {
  const ids = ['a-quiz', 'b-quiz'];
  return {
    completedLessons: {},
    quizResults: Object.fromEntries(
      bests.map((best, i) => [
        ids[i],
        { attempts: 2, bestPercent: best, lastPercent: 0, passedOn: null },
      ]),
    ),
  };
}

describe('getTotalXp', () => {
  it('is 0 with no progress and 80 when the fixture is finished', () => {
    expect(getTotalXp(fixture, EMPTY_PROGRESS)).toBe(0);
    expect(getTotalXp(fixture, ALL_DONE)).toBe(80);
  });

  it('gives no XP for a failed quiz', () => {
    expect(getTotalXp(fixture, withQuizBests(40))).toBe(0);
  });

  it('only counts ids that exist in the content', () => {
    expect(getTotalXp(fixture, progressWith(['a-l1', 'gone'], ['gone-quiz']))).toBe(10);
  });

  it('reaches the maximum of 210 on the real course', () => {
    const lessons = content.units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id));
    const quizzes = content.units.map((unit) => unit.quiz.id);
    expect(getTotalXp(content, progressWith(lessons, quizzes))).toBe(210);
  });
});

describe('getXpByDay', () => {
  it('sums lessons and quizzes completed on the same day', () => {
    const xpByDay = getXpByDay(fixture, progressWith(['a-l1', 'a-l2'], ['a-quiz']));
    expect(xpByDay).toEqual({ [TODAY]: 40 });
  });

  it('keeps separate days separate and ignores unknown ids and failed quizzes', () => {
    const progress: Progress = {
      completedLessons: { 'a-l1': '2026-03-14', 'a-l2': '2026-03-15', gone: '2026-03-13' },
      quizResults: {
        'a-quiz': { attempts: 1, bestPercent: 40, lastPercent: 40, passedOn: null },
      },
    };
    expect(getXpByDay(fixture, progress)).toEqual({ '2026-03-14': 10, '2026-03-15': 10 });
  });
});

describe('getLevel', () => {
  it.each([
    [0, 1, 0, 0],
    [49, 1, 49, 0.98],
    [50, 2, 0, 0],
    [210, 5, 10, 0.2],
  ])('%i XP', (xp, level, xpIntoLevel, progress) => {
    expect(getLevel(xp)).toEqual({ level, xpIntoLevel, xpPerLevel: 50, progress });
  });
});

describe('getStreak', () => {
  it.each<[string, Record<string, number>, string, { count: number; activeToday: boolean }]>([
    ['no activity', {}, TODAY, { count: 0, activeToday: false }],
    ['today only', { '2026-03-15': 10 }, TODAY, { count: 1, activeToday: true }],
    ['yesterday only', { '2026-03-14': 10 }, TODAY, { count: 1, activeToday: false }],
    [
      'today and yesterday',
      { '2026-03-15': 10, '2026-03-14': 10 },
      TODAY,
      { count: 2, activeToday: true },
    ],
    [
      'a gap ends the count',
      { '2026-03-15': 10, '2026-03-13': 10, '2026-03-12': 10 },
      TODAY,
      { count: 1, activeToday: true },
    ],
    ['two days ago only', { '2026-03-13': 10 }, TODAY, { count: 0, activeToday: false }],
    ['a zero XP day is not active', { '2026-03-15': 0 }, TODAY, { count: 0, activeToday: false }],
    [
      'across a month boundary',
      { '2026-03-01': 10, '2026-02-28': 10, '2026-02-27': 10 },
      '2026-03-01',
      { count: 3, activeToday: true },
    ],
    [
      'across a year boundary',
      { '2026-01-01': 10, '2025-12-31': 10 },
      '2026-01-01',
      { count: 2, activeToday: true },
    ],
    [
      'from yesterday across a year boundary',
      { '2025-12-31': 10, '2025-12-30': 10 },
      '2026-01-01',
      { count: 2, activeToday: false },
    ],
  ])('%s', (_, xpByDay, today, expected) => {
    expect(getStreak(xpByDay, today)).toEqual(expected);
  });
});

describe('getWeeklyActivity', () => {
  // 2026-03-15 is a Sunday.
  const week = getWeeklyActivity(
    { '2026-03-15': 30, '2026-03-09': 10, '2026-03-08': 99, '2026-03-16': 99 },
    TODAY,
  );

  it('returns a window of 7 days with today last', () => {
    expect(week.map((day) => day.day)).toEqual([
      '2026-03-09',
      '2026-03-10',
      '2026-03-11',
      '2026-03-12',
      '2026-03-13',
      '2026-03-14',
      '2026-03-15',
    ]);
    expect(week.map((day) => day.isToday)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
      true,
    ]);
  });

  it('gives each day its Monday-first weekday index', () => {
    expect(week.map((day) => day.weekdayIndex)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('fills in XP and ignores days outside the window', () => {
    expect(week.map((day) => day.xp)).toEqual([10, 0, 0, 0, 0, 0, 30]);
  });
});

describe('getCourseProgress', () => {
  it('counts lessons for the percent and rounds it', () => {
    const lessons = content.units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id));
    expect(getCourseProgress(content, progressWith(lessons.slice(0, 7)))).toMatchObject({
      completedLessons: 7,
      totalLessons: 15,
      percent: 47,
    });
  });

  it('counts quizzes passed, not attempted', () => {
    expect(getCourseProgress(fixture, withQuizBests(40))).toMatchObject({
      quizzesPassed: 0,
      totalQuizzes: 2,
    });
    expect(getCourseProgress(fixture, progressWith([], ['a-quiz'])).quizzesPassed).toBe(1);
  });

  it('is complete only when every lesson and quiz is done', () => {
    const allLessons = progressWith(['a-l1', 'a-l2', 'b-l1', 'b-l2']);
    expect(getCourseProgress(fixture, allLessons)).toMatchObject({
      percent: 100,
      isComplete: false,
    });
    expect(getCourseProgress(fixture, ALL_DONE).isComplete).toBe(true);
    expect(getCourseProgress(fixture, EMPTY_PROGRESS)).toMatchObject({
      percent: 0,
      isComplete: false,
    });
  });
});

describe('getProfileStats', () => {
  it('has a null average with no attempts', () => {
    expect(getProfileStats(fixture, EMPTY_PROGRESS, TODAY).averageQuizPercent).toBeNull();
  });

  it('averages the best percent of each attempted quiz, rounded', () => {
    expect(getProfileStats(fixture, withQuizBests(40), TODAY).averageQuizPercent).toBe(40);
    expect(getProfileStats(fixture, withQuizBests(67, 100), TODAY).averageQuizPercent).toBe(84);
  });

  it('ignores results of quizzes that are not in the content', () => {
    const progress = progressWith([], ['gone-quiz']);
    expect(getProfileStats(fixture, progress, TODAY).averageQuizPercent).toBeNull();
  });

  it('derives every stat from the same progress', () => {
    const stats = getProfileStats(fixture, ALL_DONE, TODAY);
    expect(stats).toMatchObject({
      totalXp: 80,
      level: { level: 2, xpIntoLevel: 30 },
      streak: { count: 1, activeToday: true },
      course: { isComplete: true },
      averageQuizPercent: 100,
    });
    expect(stats.weekly).toHaveLength(7);
    expect(stats.weekly[6]).toMatchObject({ day: TODAY, xp: 80, isToday: true });
  });
});

describe('getInitial', () => {
  it.each([
    ['болд', 'Б'],
    ['  bold ', 'B'],
    ['Өлзий', 'Ө'],
    ['😀 smile', '😀'],
    ['', '?'],
    ['   ', '?'],
  ])('%j gives %s', (name, initial) => {
    expect(getInitial(name)).toBe(initial);
  });
});
