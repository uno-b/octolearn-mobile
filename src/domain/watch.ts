import { WATCH_MAX_GAP_SEC, WATCH_THRESHOLD } from './constants';
import type { WatchState } from './types';

export const INITIAL_WATCH: WatchState = { watchedSec: 0, lastTime: null };

export function accumulateWatched(state: WatchState, currentTime: number): WatchState {
  if (currentTime === state.lastTime) return state;
  const delta = state.lastTime === null ? 0 : currentTime - state.lastTime;
  const isPlayTick = delta > 0 && delta <= WATCH_MAX_GAP_SEC;
  return {
    watchedSec: isPlayTick ? state.watchedSec + delta : state.watchedSec,
    lastTime: currentTime,
  };
}

export function isWatchThresholdReached(state: WatchState, duration: number): boolean {
  return duration > 0 && state.watchedSec / duration >= WATCH_THRESHOLD;
}
