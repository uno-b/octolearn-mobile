import { content } from '@/content';

describe('course.json', () => {
  const { units } = content;
  const lessons = units.flatMap((unit) => unit.lessons);
  const quizzes = units.map((unit) => unit.quiz);
  const questions = quizzes.flatMap((quiz) => quiz.questions);

  it('has 3 units of 5 lessons, each with a quiz', () => {
    expect(units).toHaveLength(3);
    for (const unit of units) {
      expect(unit.lessons).toHaveLength(5);
      expect(unit.quiz.questions).toHaveLength(5);
    }
  });

  it('uses the expected ids, in order', () => {
    units.forEach((unit, i) => {
      const prefix = `u${i + 1}`;
      expect(unit.id).toBe(prefix);
      expect(unit.quiz.id).toBe(`${prefix}-quiz`);
      expect(unit.lessons.map((lesson) => lesson.id)).toEqual(
        [1, 2, 3, 4, 5].map((n) => `${prefix}-l${n}`),
      );
    });
  });

  it('has unique ids across units, lessons, quizzes and questions', () => {
    const ids = [...units, ...lessons, ...quizzes, ...questions].map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unit titles without the "Бүлэг N" prefix', () => {
    for (const unit of units) {
      expect(unit.title).not.toBe('');
      expect(unit.title).not.toMatch(/Бүлэг/);
    }
  });

  it.each(lessons.map((lesson) => [lesson.id, lesson] as const))(
    'lesson %s is valid',
    (_, lesson) => {
      expect(lesson.title.trim()).not.toBe('');
      expect(lesson.description.trim()).not.toBe('');
      expect(lesson.durationSec).toBeGreaterThan(0);
      expect(lesson.videoUrl).toMatch(/^https:\/\//);
      expect(lesson.fallbackUrl).toMatch(/^https:\/\//);
      expect(lesson.fallbackUrl).not.toBe(lesson.videoUrl);
    },
  );

  it('avoids the video host that returns 403', () => {
    expect(JSON.stringify(content)).not.toContain('gtv-videos-bucket');
  });

  it('passes every quiz at 60 percent', () => {
    for (const quiz of quizzes) {
      expect(quiz.passPercent).toBe(60);
    }
  });

  it.each(questions.map((question) => [question.id, question] as const))(
    'question %s is valid',
    (_, question) => {
      expect(question.text.trim()).not.toBe('');
      expect(question.options).toHaveLength(3);
      expect(new Set(question.options).size).toBe(3);
      expect(question.answerIndex).toBeGreaterThanOrEqual(0);
      expect(question.answerIndex).toBeLessThan(question.options.length);
    },
  );

  it('varies the position of the correct answer', () => {
    expect(new Set(questions.map((question) => question.answerIndex))).toEqual(new Set([0, 1, 2]));
  });
});
