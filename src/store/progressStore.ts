import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist, type PersistStorage } from 'zustand/middleware';

import { content } from '@/content';
import { toDayKey } from '@/domain/date';
import { findQuiz } from '@/domain/path';
import {
  applyLessonCompleted,
  applyQuizSubmitted,
  EMPTY_PROGRESS,
  migratePersistedState,
  PERSIST_VERSION,
  summarizeChange,
} from '@/domain/progress';
import type { ChangeSummary, PersistedState, QuizScore } from '@/domain/types';

interface ProgressState extends PersistedState {
  signIn(name: string): void;
  completeLesson(lessonId: string): ChangeSummary;
  submitQuiz(quizId: string, answers: number[]): QuizScore & ChangeSummary;
  reset(): void;
}

const jsonStorage = createJSONStorage<PersistedState>(() => AsyncStorage)!;

/**
 * zustand never finishes hydrating when a read throws, which would hold the splash screen forever.
 * Unreadable data is treated as no data, so the worst case is a fresh start.
 */
const storage: PersistStorage<PersistedState> = {
  ...jsonStorage,
  async getItem(name) {
    try {
      return await jsonStorage.getItem(name);
    } catch {
      return null;
    }
  },
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      user: null,
      progress: EMPTY_PROGRESS,

      signIn(name) {
        set({
          user: {
            name: name.trim() || content.user.name,
            avatarUrl: content.user.avatarUrl,
            joinedOn: toDayKey(new Date()),
          },
        });
      },

      completeLesson(lessonId) {
        const before = get().progress;
        const after = applyLessonCompleted(content, before, lessonId, toDayKey(new Date()));
        if (after !== before) set({ progress: after });
        return summarizeChange(content, before, after);
      },

      submitQuiz(quizId, answers) {
        const location = findQuiz(content, quizId);
        // Screens only submit a quiz they found in the content, so this is a programming error.
        if (!location) throw new Error(`Unknown quiz: ${quizId}`);
        const before = get().progress;
        const { progress: after, score } = applyQuizSubmitted(
          content,
          before,
          location.quiz,
          answers,
          toDayKey(new Date()),
        );
        if (after !== before) set({ progress: after });
        return { ...score, ...summarizeChange(content, before, after) };
      },

      reset() {
        set({ user: null, progress: EMPTY_PROGRESS });
      },
    }),
    {
      name: 'octolearn/progress',
      version: PERSIST_VERSION,
      storage,
      partialize: ({ user, progress }): PersistedState => ({ user, progress }),
      migrate: migratePersistedState,
      // zustand only calls migrate across versions, so same-version data is validated here.
      merge: (persisted, current) => ({
        ...current,
        ...migratePersistedState(persisted, PERSIST_VERSION),
      }),
    },
  ),
);

export function useHydrated(): boolean {
  return useSyncExternalStore(
    useProgressStore.persist.onFinishHydration,
    useProgressStore.persist.hasHydrated,
  );
}
