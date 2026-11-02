import type { CourseContent, Lesson, Progress, Question, Quiz } from '../types';

export const TODAY = '2026-03-15';

function lesson(id: string): Lesson {
  return {
    id,
    title: id,
    description: id,
    videoUrl: `https://example.com/${id}.mp4`,
    durationSec: 10,
  };
}

/** Every answerIndex is 0, which is what `answers` relies on. */
function quiz(id: string, questionCount: number): Quiz {
  const questions: Question[] = Array.from({ length: questionCount }, (_, i) => ({
    id: `${id}-q${i + 1}`,
    text: `Question ${i + 1}`,
    options: ['right', 'wrong', 'wrong'],
    answerIndex: 0,
  }));
  return { id, passPercent: 60, questions };
}

export const QUIZ_A = quiz('a-quiz', 5);
export const QUIZ_B = quiz('b-quiz', 3);

export const fixture: CourseContent = {
  course: { id: 'test', title: 'Test course' },
  user: { name: 'Default', avatarUrl: null },
  units: [
    { id: 'a', title: 'Unit A', lessons: [lesson('a-l1'), lesson('a-l2')], quiz: QUIZ_A },
    { id: 'b', title: 'Unit B', lessons: [lesson('b-l1'), lesson('b-l2')], quiz: QUIZ_B },
  ],
};

/** `correct` right answers followed by wrong ones, `total` in all. */
export function answers(correct: number, total: number): number[] {
  return Array.from({ length: total }, (_, i) => (i < correct ? 0 : 1));
}

/** Progress with the given lessons completed and quizzes passed, all on `day`. */
export function progressWith(lessonIds: string[], quizIds: string[] = [], day = TODAY): Progress {
  return {
    completedLessons: Object.fromEntries(lessonIds.map((id) => [id, day])),
    quizResults: Object.fromEntries(
      quizIds.map((id) => [id, { attempts: 1, bestPercent: 100, lastPercent: 100, passedOn: day }]),
    ),
  };
}

export const ALL_DONE = progressWith(['a-l1', 'a-l2', 'b-l1', 'b-l2'], ['a-quiz', 'b-quiz']);
