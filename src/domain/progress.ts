import { buildPath, getNodeStatus } from './path';
import { getLevel, getTotalXp, toPercent } from './stats';
import type {
  ChangeSummary,
  CourseContent,
  DayKey,
  PersistedState,
  Progress,
  Quiz,
  QuizResult,
  QuizScore,
} from './types';

export const PERSIST_VERSION = 1;

export const EMPTY_PROGRESS: Progress = { completedLessons: {}, quizResults: {} };

export function applyLessonCompleted(
  content: CourseContent,
  progress: Progress,
  lessonId: string,
  today: DayKey,
): Progress {
  const { active } = buildPath(content, progress);
  if (active?.kind !== 'lesson' || active.id !== lessonId) return progress;
  return {
    ...progress,
    completedLessons: { ...progress.completedLessons, [lessonId]: today },
  };
}

export function scoreQuiz(quiz: Quiz, answers: number[]): QuizScore {
  const total = quiz.questions.length;
  const correct = quiz.questions.filter(
    (question, index) => answers[index] === question.answerIndex,
  ).length;
  return {
    correct,
    total,
    percent: toPercent(correct, total),
    passed: total > 0 && correct * 100 >= quiz.passPercent * total,
  };
}

export function applyQuizSubmitted(
  content: CourseContent,
  progress: Progress,
  quiz: Quiz,
  answers: number[],
  today: DayKey,
): { progress: Progress; score: QuizScore } {
  const score = scoreQuiz(quiz, answers);
  const status = getNodeStatus(content, progress, quiz.id);
  if (status === null || status === 'locked') return { progress, score };

  const previous = progress.quizResults[quiz.id];
  const result: QuizResult = {
    attempts: (previous?.attempts ?? 0) + 1,
    bestPercent: Math.max(previous?.bestPercent ?? 0, score.percent),
    lastPercent: score.percent,
    passedOn: previous?.passedOn ?? (score.passed ? today : null),
  };
  return {
    progress: { ...progress, quizResults: { ...progress.quizResults, [quiz.id]: result } },
    score,
  };
}

export function summarizeChange(
  content: CourseContent,
  before: Progress,
  after: Progress,
): ChangeSummary {
  const xpBefore = getTotalXp(content, before);
  const totalXp = getTotalXp(content, after);
  const level = getLevel(totalXp).level;
  const activeBefore = buildPath(content, before).active;
  const activeAfter = buildPath(content, after).active;
  return {
    xpGained: totalXp - xpBefore,
    totalXp,
    level,
    leveledUp: level > getLevel(xpBefore).level,
    unlocked:
      activeAfter && activeAfter.id !== activeBefore?.id
        ? { id: activeAfter.id, kind: activeAfter.kind, unitNumber: activeAfter.unitIndex + 1 }
        : null,
    courseCompleted: activeBefore !== null && activeAfter === null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPersistedState(value: unknown): value is PersistedState {
  if (!isRecord(value) || !isRecord(value.progress)) return false;
  const { user, progress } = value;
  return (
    isRecord(progress.completedLessons) &&
    isRecord(progress.quizResults) &&
    (user === null ||
      (isRecord(user) && typeof user.name === 'string' && typeof user.joinedOn === 'string'))
  );
}

export function migratePersistedState(persisted: unknown, fromVersion: number): PersistedState {
  if (fromVersion !== PERSIST_VERSION || !isPersistedState(persisted)) {
    return { user: null, progress: EMPTY_PROGRESS };
  }
  return persisted;
}
