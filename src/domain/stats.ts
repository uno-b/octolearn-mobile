import { XP_PER_LESSON, XP_PER_LEVEL, XP_PER_QUIZ_PASS } from './constants';
import { addDays, lastNDays, weekdayIndexMon0 } from './date';
import { isNodeDone, listNodes } from './path';
import type {
  CourseContent,
  CourseProgress,
  DayActivity,
  DayKey,
  LevelInfo,
  ProfileStats,
  Progress,
  StreakInfo,
} from './types';

/** Rounded integer percentage; 0 when there is nothing to divide by. */
export function toPercent(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part * 100) / total);
}

export function getXpByDay(content: CourseContent, progress: Progress): Record<DayKey, number> {
  const xpByDay: Record<DayKey, number> = {};
  for (const { kind, id } of listNodes(content)) {
    const [day, xp] =
      kind === 'lesson'
        ? [progress.completedLessons[id], XP_PER_LESSON]
        : [progress.quizResults[id]?.passedOn, XP_PER_QUIZ_PASS];
    if (day) xpByDay[day] = (xpByDay[day] ?? 0) + xp;
  }
  return xpByDay;
}

export function getTotalXp(content: CourseContent, progress: Progress): number {
  return Object.values(getXpByDay(content, progress)).reduce((total, xp) => total + xp, 0);
}

export function getLevel(xp: number): LevelInfo {
  const xpIntoLevel = xp % XP_PER_LEVEL;
  return {
    level: Math.floor(xp / XP_PER_LEVEL) + 1,
    xpIntoLevel,
    xpPerLevel: XP_PER_LEVEL,
    progress: xpIntoLevel / XP_PER_LEVEL,
  };
}

export function getStreak(xpByDay: Record<DayKey, number>, today: DayKey): StreakInfo {
  const isActive = (day: DayKey) => (xpByDay[day] ?? 0) > 0;
  const activeToday = isActive(today);
  let count = 0;
  let day = activeToday ? today : addDays(today, -1);
  while (isActive(day)) {
    count += 1;
    day = addDays(day, -1);
  }
  return { count, activeToday };
}

export function getWeeklyActivity(xpByDay: Record<DayKey, number>, today: DayKey): DayActivity[] {
  return lastNDays(today, 7).map((day) => ({
    day,
    weekdayIndex: weekdayIndexMon0(day),
    xp: xpByDay[day] ?? 0,
    isToday: day === today,
  }));
}

export function getCourseProgress(content: CourseContent, progress: Progress): CourseProgress {
  const nodes = listNodes(content);
  const lessons = nodes.filter((node) => node.kind === 'lesson');
  const quizzes = nodes.filter((node) => node.kind === 'quiz');
  const completedLessons = lessons.filter((node) => isNodeDone(progress, node)).length;
  const quizzesPassed = quizzes.filter((node) => isNodeDone(progress, node)).length;
  return {
    completedLessons,
    totalLessons: lessons.length,
    percent: toPercent(completedLessons, lessons.length),
    quizzesPassed,
    totalQuizzes: quizzes.length,
    isComplete: completedLessons === lessons.length && quizzesPassed === quizzes.length,
  };
}

function getAverageQuizPercent(content: CourseContent, progress: Progress): number | null {
  const bests = content.units.flatMap((unit) => {
    const result = progress.quizResults[unit.quiz.id];
    return result ? [result.bestPercent] : [];
  });
  if (bests.length === 0) return null;
  return Math.round(bests.reduce((sum, best) => sum + best, 0) / bests.length);
}

export function getProfileStats(
  content: CourseContent,
  progress: Progress,
  today: DayKey,
): ProfileStats {
  const xpByDay = getXpByDay(content, progress);
  const totalXp = getTotalXp(content, progress);
  return {
    totalXp,
    level: getLevel(totalXp),
    streak: getStreak(xpByDay, today),
    course: getCourseProgress(content, progress),
    averageQuizPercent: getAverageQuizPercent(content, progress),
    weekly: getWeeklyActivity(xpByDay, today),
  };
}

export function getInitial(name: string): string {
  const [first] = Array.from(name.trim());
  return first ? first.toUpperCase() : '?';
}
