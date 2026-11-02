# OctoLearn mobile: agent guide

Expo SDK 58 / React Native 0.88 / React 19.3 prototype of a Duolingo-style video course app.
No backend: content is bundled JSON, progress lives in AsyncStorage. UI copy is Mongolian, code and
comments are English.

## Expo has changed: do not trust your training data

Expo ships breaking changes every SDK release. Before writing code that touches an Expo, EAS or
React Native API, check the installed types in `node_modules/<package>/build/*.d.ts` or fetch
`https://docs.expo.dev/versions/v58.0.0/`. Never answer from memory.

## Commands

```bash
yarn check            # typecheck + lint + jest. Run before declaring a task done
yarn typecheck        # tsc --noEmit
yarn lint             # expo lint (add --fix through: yarn expo lint --fix)
yarn test             # jest (domain tests only)
yarn check:videos     # checks every video URL in course.json
yarn start            # dev server (Expo Go)
```

Never use the global `expo` binary (deprecated). Never use the `@expo/vector-icons` root import for
anything but `Ionicons` inside `src/components/Icon.tsx`. Only the orchestrator adds dependencies
(`yarn expo install`), and only the orchestrator commits.

## Layout

```
src/app/                 Routes only. Screens compose components and hooks.
src/content/             course.json + typed `content` export
src/domain/              Pure TypeScript. No react, react-native or expo imports. Fully unit-tested.
src/store/               useProgressStore (zustand + persist) and useHydrated
src/hooks/               React glue over the store and the player
src/components/          Flat folder of shared UI
src/theme/index.ts       Design tokens (frozen)
src/i18n/mn.ts           All UI copy
src/lib/                 haptics, format helpers
```

## Hard rules

- **Tokens only.** No hard-coded colours, font sizes or radii outside `src/theme`. Layout numbers
  that are not design tokens (a chart height, a zigzag amplitude) get a named constant.
- **Copy only through `mn`** from `@/i18n/mn`. No Mongolian literals in components or screens. If a
  string is missing, add it to the matching section of `src/i18n/mn.ts` with a small edit.
- **Text goes through `AppText`** so font family, scaling cap and Android padding stay consistent.
- **Never set `fontWeight`.** Android ignores it on custom fonts. `type` tokens set `fontFamily`.
- **Text in a brand colour uses `primaryDark`**, never `primary`. No text on `coral` or `gold` fills.
- **Tap targets are at least 48** (`size.tap`). Use `hitSlop` for small icons.
- **Safe area:** `SafeAreaView` from `react-native-safe-area-context` with explicit `edges`, always
  including `left` and `right`. Stacked screens handle the bottom through `BottomBar`. Android is
  edge-to-edge, so insets matter there too.
- **No `Intl`** (Hermes locale data is unreliable). Format dates and numbers by hand.
- **Zustand selectors never build objects or arrays.** That causes an infinite render loop in v5.
  Select `s.progress`, then derive with `useMemo`. The hooks in `src/hooks/useProgress.ts` do this.
- **Reanimated in React code:** use `sv.get()` and `sv.set()`, not `.value` (React Compiler
  compatibility). Honour `useReducedMotion()` for looping or decorative motion.
- **Do not use `https://commondatastorage.googleapis.com/gtv-videos-bucket/...`.** It returns 403.
- **Domain functions never mutate.** When nothing changes they return the same object reference.
- Keep it simple. No extra abstractions, no speculative options, no new dependencies.

## Rules of the course (source of truth for the code)

- Ordered node list: u1-l1 … u1-l5, u1-quiz, u2-l1 … A lesson is done when its id is in
  `completedLessons`. A quiz is done when `passedOn` is set. **Active** is the first node that is
  not done. Done nodes are `completed`, the rest are `locked`. A unit is `completed` when all its
  nodes are done, `active` when it contains the active node, otherwise `locked`.
- XP: lesson +10 on first completion, quiz +20 on first pass, otherwise 0. XP is derived from
  progress, never stored. Maximum 210.
- Pass: `correct * 100 >= passPercent * total` (integer maths, 3/5 passes). Missing answers count as
  wrong. A failed retake never removes a pass. Retakes update attempts, best and last percent.
- Level: `floor(xp / 50) + 1`.
- Streak: a day is active when its XP is above 0. Count back from today, or from yesterday when today
  is not active yet. A gap ends the count. Nothing recent means 0.
- Watch rule: play ticks arrive every 0.5 s. A tick counts only when it is at most 1.5 s after the
  previous one, so seeks add nothing. Finish enables at `watchedSec / duration >= 0.9` or on
  `playToEnd`, and stays enabled. A lesson that is already completed can finish at once for 0 XP.
- Course percent counts lessons. `isComplete` needs every lesson and quiz done.
- Reset wipes progress and user, which returns the app to the login screen.

## Domain API (`src/domain`, types in `types.ts`)

```ts
// constants.ts
XP_PER_LESSON = 10; XP_PER_QUIZ_PASS = 20; XP_PER_LEVEL = 50; WATCH_THRESHOLD = 0.9;
WATCH_TICK_SEC = 0.5; WATCH_MAX_GAP_SEC = 1.5;

// date.ts
toDayKey(date: Date): DayKey                // local time, zero padded
addDays(day: DayKey, delta: number): DayKey // from date parts, DST safe
lastNDays(today: DayKey, n: number): DayKey[] // oldest first
weekdayIndexMon0(day: DayKey): number       // 0 = Monday

// path.ts
listNodes(content): Omit<PathNode, 'status'>[]
isNodeDone(progress, node: { kind: NodeKind; id: string }): boolean
buildPath(content, progress): CoursePath
getNodeStatus(content, progress, nodeId): NodeStatus | null   // null = unknown id
getLessonLocation(content, lessonId): LessonLocation | null   // 1-based numbers
findQuiz(content, quizId): QuizLocation | null

// stats.ts
getTotalXp(content, progress): number       // only counts ids that exist in content
getXpByDay(content, progress): Record<DayKey, number>
getLevel(xp): LevelInfo
getStreak(xpByDay, today): StreakInfo
getWeeklyActivity(xpByDay, today): DayActivity[]              // 7 items, today last
getCourseProgress(content, progress): CourseProgress
getProfileStats(content, progress, today): ProfileStats
getInitial(name): string                    // first code point, uppercased, '?' when empty
toPercent(part, total): number              // rounded integer, 0 when total is 0

// progress.ts
EMPTY_PROGRESS: Progress; PERSIST_VERSION = 1;
applyLessonCompleted(content, progress, lessonId, today): Progress   // no-op if locked or done
scoreQuiz(quiz, answers: number[]): QuizScore
applyQuizSubmitted(content, progress, quiz, answers, today): { progress: Progress; score: QuizScore }
                                                                     // no-op if the quiz is locked
summarizeChange(content, before: Progress, after: Progress): ChangeSummary
migratePersistedState(persisted: unknown, fromVersion: number): PersistedState

// quizSession.ts
initialQuizSession: QuizSession
quizSessionReducer(state, action: QuizSessionAction): QuizSession
// select: ignored once checked. check: no-op without a selection, records the answer.
// next: no-op before check, advances and clears selection.

// watch.ts
INITIAL_WATCH: WatchState
accumulateWatched(state: WatchState, currentTime: number): WatchState
isWatchThresholdReached(state: WatchState, duration: number): boolean // false for 0 or NaN duration
```

## Store and hooks

```ts
// src/store/progressStore.ts
useProgressStore: state = PersistedState & {
  signIn(name: string): void;              // trims; empty falls back to content.user.name; sets joinedOn
  completeLesson(lessonId: string): ChangeSummary;
  submitQuiz(quizId: string, answers: number[]): QuizScore & ChangeSummary;
  reset(): void;                           // user = null, progress = EMPTY_PROGRESS
}
useHydrated(): boolean

// src/hooks/useProgress.ts
usePath(): CoursePath
useStats(): ProfileStats
useNodeStatus(id: string): NodeStatus | null
```

Actions return what the calling screen needs for feedback. Home animates by comparing values.

## Routes

Files live under `src/app/`. Every stacked screen sets its own header through `ScreenHeader`.

| Route               | File                    | Notes                                                                                                                                                                                |
| ------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/login`            | `login.tsx`             | Only reachable when signed out                                                                                                                                                       |
| `/`                 | `(tabs)/index.tsx`      | Pathway                                                                                                                                                                              |
| `/profile`          | `(tabs)/profile.tsx`    |                                                                                                                                                                                      |
| `/lesson/[id]`      | `lesson/[id]/index.tsx` | Pushed from Home                                                                                                                                                                     |
| `/lesson/[id]/done` | `lesson/[id]/done.tsx`  | `router.replace` with params `xp`, `next` (`lesson`\|`quiz`\|`none`), `level` (new level, or empty)                                                                                  |
| `/quiz/[id]`        | `quiz/[id]/index.tsx`   | Pushed from Home                                                                                                                                                                     |
| `/quiz/[id]/result` | `quiz/[id]/result.tsx`  | `router.replace` with params `correct`, `total`, `percent`, `passed` (`1`\|`0`), `xp`, `unlockedUnit` (number or empty), `courseCompleted` (`1`\|`0`), `level` (new level, or empty) |

The root layout owns `Stack.Protected`, so signing in or resetting navigates by itself. Continue on a
success screen is `router.back()`, which lands on the tabs because the screen was reached by replace.

## UI kit (`src/components`, default to named exports)

The visual language: **tappables are chunky**. Button, PathNode and OptionCard have a 4 px darker
bottom edge (`size.edge`) and the face sinks 4 px when pressed, through the Pressable `pressed` state.
**Static cards are flat:** `surface` fill, 2 px `border`, no shadow.

| Component      | Props                                                                                                                                                      | Behaviour                                                                                                                                                                                                                                                                                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AppText`      | `variant: TypeVariant`, `color?`, `align?`, `numberOfLines?`, `style?`, `maxFontSizeMultiplier?`                                                           | Default variant `body`, colour `text`. Defaults `maxFontSizeMultiplier` 1.3, `includeFontPadding: false`                                                                                                                                                                                                                                                     |
| `Icon`         | `name`, `size?`, `color?`                                                                                                                                  | Only file importing Ionicons. Export the name type                                                                                                                                                                                                                                                                                                           |
| `Button`       | `label`, `onPress`, `variant?: primary\|outline\|danger`, `disabled?`, `icon?`                                                                             | Full width, face `size.btn` high plus edge. Disabled: `locked` face, `textMuted` label, no edge. One-line label with `adjustsFontSizeToFit`. `danger` is an outline with a `dangerDark` label                                                                                                                                                                |
| `Pill`         | `tone: primary\|coral\|gold\|success`, `icon?`, `label`, `bumpKey?`, `accessibilityLabel?`                                                                 | 36 high, tint background, dark text. Scale bump when `bumpKey` changes                                                                                                                                                                                                                                                                                       |
| `ProgressBar`  | `value` 0..1, `color?`, `height?` (14)                                                                                                                     | Animated width with `withTiming` (`motion.slow`), `border` track, soft highlight strip on the fill                                                                                                                                                                                                                                                           |
| `PathNode`     | `status`, `kind`, `bubbleSide?: left\|right`, `celebrate?`, `onPress`, `onLockedPress`, `accessibilityLabel`                                               | Chunky coin, `size.node` (quiz `size.quizNode`). Completed: `primary` + check. Active lesson: white face, `primary` ring + play icon + expanding halo pulse + ink "Эхлэх ›" bubble on `bubbleSide`. Locked: `locked` + lock icon. Quiz: gold star when active or completed. Locked press shakes then calls `onLockedPress`. Pops when `celebrate` turns true |
| `UnitHeader`   | `index`, `title`, `locked?`                                                                                                                                | Unlocked: `primary` banner, white micro eyebrow and headline title. Locked: flat card, muted text, lock icon, `mn.home.unitLocked` caption                                                                                                                                                                                                                   |
| `OptionCard`   | `label`, `state: idle\|selected\|correct\|wrong\|dim`, `onPress`, `disabled?`                                                                              | Chunky, min height 56. Selected: `primary` border + `primaryTint`. Correct: success + check icon + bump. Wrong: danger + close icon + shake. Dim: 50% opacity                                                                                                                                                                                                |
| `StatCard`     | `icon`, `tone`, `value`, `label`                                                                                                                           | Flat card. Icon in tinted 36 circle, `h1` value, label up to 2 lines                                                                                                                                                                                                                                                                                         |
| `Avatar`       | `name`, `uri?`                                                                                                                                             | Image, or initial from `getInitial` on a `primaryTint` circle with `primaryDark` text                                                                                                                                                                                                                                                                        |
| `WeeklyChart`  | `days: DayActivity[]`                                                                                                                                      | Seven flex columns of plain Views. Height = xp / max × chart height, minimum 4 px stub. Today: `primary` bar and bold label. Other days: `primaryMid`, or `borderStrong` when empty. Labels from `mn.profile.weekdays[weekdayIndex]`                                                                                                                         |
| `Confetti`     | none                                                                                                                                                       | Reanimated burst of 26 pieces from top-centre on mount. One shared progress drives each piece: `x = vx·s`, `y = vy·s + 700·s²`, spin, fade after 75%. `pointerEvents="none"`. Renders nothing under reduced motion                                                                                                                                           |
| `ScreenHeader` | `left: back\|close`, `onLeft`, `title?`, `children?`                                                                                                       | 56 high. 44×44 icon button. Centre holds title or children                                                                                                                                                                                                                                                                                                   |
| `BottomBar`    | `children`, `hint?`                                                                                                                                        | Sticky action area. `paddingBottom: max(insets.bottom, space.lg)`, surface, hairline top border, optional caption hint above children                                                                                                                                                                                                                        |
| `StateView`    | `kind: loading\|error\|empty`, `title?`, `message?`, `actionLabel?`, `onAction?`, `dark?`, `icon?`                                                         | Centred spinner or icon, text, optional Button. `dark` is the variant inside the black video box                                                                                                                                                                                                                                                             |
| `Toast`        | `message`, `showKey`                                                                                                                                       | Shows for 2200 ms. Owned by each screen. Ink background, white text, `FadeInDown` / `FadeOutDown`, hides itself. `showKey` of 0 renders nothing                                                                                                                                                                                                              |
| `Celebration`  | `icon`, `iconBg`, `iconEdge`, `iconColor`, `title`, `subtitle?`, `xp?`, `confetti?`, `primary: {label, onPress}`, `secondary?: {label, onPress}`, `extra?` | Shared layout for success screens. Circle `ZoomIn.springify()`, title `FadeInDown`, XP pill, buttons in `BottomBar` stacked with the outline above the primary. Circle 128, or 96 when the window height is under 700                                                                                                                                        |

Shared internals: `ChunkyFace` is the edge and sinking face used by Button, OptionCard, PathNode and
Celebration. `useFeedbackMotion()` in `src/lib/feedbackMotion.ts` returns a transform `style` plus
one-shot `bump()` and `shake()`.

Also `src/lib/haptics.ts` (`tap`, `select`, `success`, `error`, `warn`, fire-and-forget, using
`performAndroidHapticsAsync` on Android) and `src/lib/format.ts` (`formatDuration(80)` returns `1:20`).

Usage notes:

- `PathNode` shows the start bubble only when it is active **and** `bubbleSide` is passed.
- `Toast` needs a new non-zero `showKey` each time, and an absolutely positionable parent.
- `StatCard.value` is a string and the card is `flex: 1`, so it expects a row parent.
- `AppText` also accepts React Native `TextProps`.
