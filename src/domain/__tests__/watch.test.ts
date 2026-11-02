import { accumulateWatched, INITIAL_WATCH, isWatchThresholdReached } from '../watch';

function play(...times: number[]) {
  return times.reduce(accumulateWatched, INITIAL_WATCH);
}

describe('accumulateWatched', () => {
  it('adds nothing on the first tick, even when starting mid-video', () => {
    expect(play(30)).toEqual({ watchedSec: 0, lastTime: 30 });
  });

  it('counts normal ticks', () => {
    expect(play(0, 0.5, 1, 1.5)).toEqual({ watchedSec: 1.5, lastTime: 1.5 });
  });

  it('counts a tick exactly at the maximum gap', () => {
    expect(play(0, 1.5).watchedSec).toBe(1.5);
  });

  it('ignores a forward seek and keeps counting from there', () => {
    expect(play(0, 0.5, 40)).toEqual({ watchedSec: 0.5, lastTime: 40 });
    expect(play(0, 0.5, 40, 40.5).watchedSec).toBe(1);
  });

  it('ignores a jump just over the maximum gap', () => {
    expect(play(0, 1.75).watchedSec).toBe(0);
  });

  it('ignores a backward jump and keeps counting from there', () => {
    expect(play(10, 10.5, 2)).toEqual({ watchedSec: 0.5, lastTime: 2 });
    expect(play(10, 10.5, 2, 2.5).watchedSec).toBe(1);
  });

  it('returns the same state when the time has not moved', () => {
    const state = play(0, 0.5);
    expect(accumulateWatched(state, 0.5)).toBe(state);
  });
});

describe('isWatchThresholdReached', () => {
  const watched = (watchedSec: number) => ({ watchedSec, lastTime: watchedSec });

  it('is false at 0.89 and true at 0.9', () => {
    expect(isWatchThresholdReached(watched(89), 100)).toBe(false);
    expect(isWatchThresholdReached(watched(90), 100)).toBe(true);
    expect(isWatchThresholdReached(watched(100), 100)).toBe(true);
  });

  it.each([[0], [NaN], [-1]])('is false for a duration of %d', (duration) => {
    expect(isWatchThresholdReached(watched(90), duration)).toBe(false);
  });
});
