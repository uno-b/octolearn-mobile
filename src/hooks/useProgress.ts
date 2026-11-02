import { useMemo } from 'react';

import { content } from '@/content';
import { toDayKey } from '@/domain/date';
import { buildPath, getNodeStatus } from '@/domain/path';
import { getProfileStats } from '@/domain/stats';
import type { CoursePath, NodeStatus, ProfileStats } from '@/domain/types';
import { useProgressStore } from '@/store/progressStore';

export function usePath(): CoursePath {
  const progress = useProgressStore((s) => s.progress);
  return useMemo(() => buildPath(content, progress), [progress]);
}

export function useStats(): ProfileStats {
  const progress = useProgressStore((s) => s.progress);
  // A dependency, so stats computed before midnight are not reused after it.
  const today = toDayKey(new Date());
  return useMemo(() => getProfileStats(content, progress, today), [progress, today]);
}

export function useNodeStatus(id: string): NodeStatus | null {
  const progress = useProgressStore((s) => s.progress);
  return useMemo(() => getNodeStatus(content, progress, id), [progress, id]);
}
