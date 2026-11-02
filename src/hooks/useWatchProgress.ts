import { useEventListener } from 'expo';
import type { VideoPlayer } from 'expo-video';
import { useRef, useState } from 'react';

import { accumulateWatched, INITIAL_WATCH, isWatchThresholdReached } from '@/domain/watch';

/** Expects the player's `timeUpdateEventInterval` to be WATCH_TICK_SEC. */
export function useWatchProgress(
  player: VideoPlayer,
  alreadyCompleted: boolean,
): { canFinish: boolean } {
  const watch = useRef(INITIAL_WATCH);
  const [canFinish, setCanFinish] = useState(alreadyCompleted);

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    watch.current = accumulateWatched(watch.current, currentTime);
    if (isWatchThresholdReached(watch.current, player.duration)) setCanFinish(true);
  });

  useEventListener(player, 'playToEnd', () => setCanFinish(true));

  return { canFinish };
}
