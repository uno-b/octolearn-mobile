import { addDays, lastNDays, toDayKey, weekdayIndexMon0 } from '../date';

describe('toDayKey', () => {
  it('uses local time and zero pads', () => {
    expect(toDayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(toDayKey(new Date(2026, 10, 15, 0, 0))).toBe('2026-11-15');
  });
});

describe('addDays', () => {
  it.each([
    ['2026-03-15', 1, '2026-03-16'],
    ['2026-03-15', 0, '2026-03-15'],
    ['2026-03-01', -1, '2026-02-28'],
    ['2026-01-31', 1, '2026-02-01'],
    ['2026-01-01', -1, '2025-12-31'],
    ['2025-12-31', 1, '2026-01-01'],
    ['2024-02-28', 1, '2024-02-29'],
    ['2024-03-01', -1, '2024-02-29'],
    // The US and EU DST changes of 2026, so a run in those time zones crosses them.
    ['2026-03-07', 2, '2026-03-09'],
    ['2026-03-29', -1, '2026-03-28'],
    ['2026-10-25', 1, '2026-10-26'],
    ['2026-11-01', 1, '2026-11-02'],
  ])('%s %i gives %s', (day, delta, expected) => {
    expect(addDays(day, delta)).toBe(expected);
  });
});

describe('lastNDays', () => {
  it('lists days oldest first, ending today', () => {
    expect(lastNDays('2026-03-02', 3)).toEqual(['2026-02-28', '2026-03-01', '2026-03-02']);
  });

  it('returns only today for 1 and nothing for 0', () => {
    expect(lastNDays('2026-03-02', 1)).toEqual(['2026-03-02']);
    expect(lastNDays('2026-03-02', 0)).toEqual([]);
  });
});

describe('weekdayIndexMon0', () => {
  it.each([
    ['2026-03-09', 0],
    ['2026-03-10', 1],
    ['2026-03-14', 5],
    ['2026-03-15', 6],
    ['2026-03-16', 0],
  ])('%s is %i', (day, index) => {
    expect(weekdayIndexMon0(day)).toBe(index);
  });
});
