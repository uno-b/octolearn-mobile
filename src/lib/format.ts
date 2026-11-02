/** 80 -> "1:20". Non-finite or negative input reads as "0:00". */
export function formatDuration(totalSec: number): string {
  const sec = Number.isFinite(totalSec) ? Math.max(0, Math.round(totalSec)) : 0;
  const minutes = Math.floor(sec / 60);
  return `${minutes}:${String(sec % 60).padStart(2, '0')}`;
}
