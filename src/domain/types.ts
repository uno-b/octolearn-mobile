/** 'YYYY-MM-DD' in device-local time. */
export type DayKey = string;

// ---------------------------------------------------------------------------
// Content (src/content/course.json)
// ---------------------------------------------------------------------------

export interface Lesson {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  /** Second host, used when a retry on videoUrl also fails. */
  fallbackUrl?: string;
  durationSec: number;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  answerIndex: number;
}

export interface Quiz {
  id: string;
  passPercent: number;
  questions: Question[];
}

export interface Unit {
  id: string;
  /** Without the "Бүлэг N" prefix: the UI renders that from the unit's position. */
  title: string;
  lessons: Lesson[];
  quiz: Quiz;
}

export interface UserProfile {
  name: string;
  avatarUrl: string | null;
}

export interface CourseContent {
  course: { id: string; title: string };
  units: Unit[];
  /** Default profile: pre-fills the login screen. */
  user: UserProfile;
}

// ---------------------------------------------------------------------------
// Persisted state: only what happened. Everything else is derived.
// ---------------------------------------------------------------------------

export interface QuizResult {
  attempts: number;
  bestPercent: number;
  lastPercent: number;
  /** Set on the first pass and never cleared, so a failed retake cannot re-lock anything. */
  passedOn: DayKey | null;
}

export interface Progress {
  /** lessonId -> day of first completion */
  completedLessons: Record<string, DayKey>;
  quizResults: Record<string, QuizResult>;
}

export interface Account extends UserProfile {
  joinedOn: DayKey;
}

export interface PersistedState {
  user: Account | null;
  progress: Progress;
}

// ---------------------------------------------------------------------------
// Derived
// ---------------------------------------------------------------------------

export type NodeKind = 'lesson' | 'quiz';
export type NodeStatus = 'completed' | 'active' | 'locked';

export interface PathNode {
  kind: NodeKind;
  id: string;
  title: string;
  unitIndex: number;
  /** 0-4 for lessons, 5 for the quiz. Drives the zigzag offset. */
  indexInUnit: number;
  status: NodeStatus;
}

export interface PathUnit {
  id: string;
  title: string;
  index: number;
  status: NodeStatus;
  nodes: PathNode[];
}

export interface CoursePath {
  units: PathUnit[];
  /** null when the whole course is finished. */
  active: PathNode | null;
}

export interface LessonLocation {
  unit: Unit;
  unitNumber: number;
  lesson: Lesson;
  lessonNumber: number;
  lessonCount: number;
}

export interface QuizLocation {
  unit: Unit;
  unitNumber: number;
  quiz: Quiz;
}

export interface QuizScore {
  correct: number;
  total: number;
  percent: number;
  passed: boolean;
}

export interface LevelInfo {
  level: number;
  xpIntoLevel: number;
  xpPerLevel: number;
  /** 0..1 progress towards the next level. */
  progress: number;
}

export interface StreakInfo {
  count: number;
  activeToday: boolean;
}

export interface DayActivity {
  day: DayKey;
  /** 0 = Monday ... 6 = Sunday. Indexes mn.profile.weekdays. */
  weekdayIndex: number;
  xp: number;
  isToday: boolean;
}

export interface CourseProgress {
  completedLessons: number;
  totalLessons: number;
  /** Rounded lesson percentage, as in "7 / 15 хичээл · 47%". */
  percent: number;
  quizzesPassed: number;
  totalQuizzes: number;
  /** All nodes done, including quizzes. */
  isComplete: boolean;
}

export interface ProfileStats {
  totalXp: number;
  level: LevelInfo;
  streak: StreakInfo;
  course: CourseProgress;
  /** Mean of each attempted quiz's best percent; null when no quiz was attempted. */
  averageQuizPercent: number | null;
  /** Last 7 days, oldest first, today last. */
  weekly: DayActivity[];
}

export interface UnlockedNode {
  id: string;
  kind: NodeKind;
  /** 1-based number of the unit that contains the node. */
  unitNumber: number;
}

/** Returned by store actions so the calling screen can show feedback. There is no event bus. */
export interface ChangeSummary {
  xpGained: number;
  totalXp: number;
  level: number;
  leveledUp: boolean;
  /** The new active node, when the action changed it. */
  unlocked: UnlockedNode | null;
  courseCompleted: boolean;
}

export interface WatchState {
  watchedSec: number;
  lastTime: number | null;
}

export interface QuizSession {
  index: number;
  selected: number | null;
  checked: boolean;
  answers: number[];
}

export type QuizSessionAction =
  { type: 'select'; option: number } | { type: 'check' } | { type: 'next' };
