import type { DayKey } from './types';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function toDayKey(date: Date): DayKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Built from date parts rather than by adding milliseconds, because a DST day is not 24 hours. */
function toLocalDate(day: DayKey, delta = 0): Date {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date + delta);
}

export function addDays(day: DayKey, delta: number): DayKey {
  return toDayKey(toLocalDate(day, delta));
}

/** Oldest first, `today` last. */
export function lastNDays(today: DayKey, n: number): DayKey[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - n + 1));
}

/** 0 = Monday ... 6 = Sunday. */
export function weekdayIndexMon0(day: DayKey): number {
  return (toLocalDate(day).getDay() + 6) % 7;
}
