import { useEffect, useState } from 'react';

import * as haptics from '@/lib/haptics';

/**
 * The active id once it differs from the one the screen opened with, so opening the app never pops.
 * Progress only moves forward and a reset unmounts the screen, so the first id cannot come back.
 */
export function useUnlockedId(activeId: string | null): string | null {
  const [openedWithId] = useState(activeId);
  const unlockedId = activeId === openedWithId ? null : activeId;

  useEffect(() => {
    if (unlockedId !== null) haptics.tap();
  }, [unlockedId]);

  return unlockedId;
}
