import { describe, it, expect } from 'vitest';
import { calculateStreaks, diffInDays, addDays, mondayOfWeek } from './streak.js';

describe('helpers', () => {
  it('diffInDays counts whole UTC days regardless of host timezone', () => {
    expect(diffInDays('2026-08-10', '2026-08-13')).toBe(3);
    expect(diffInDays('2026-08-13', '2026-08-10')).toBe(-3);
    expect(diffInDays('2026-08-13', '2026-08-13')).toBe(0);
  });

  it('diffInDays is correct across a month/year boundary', () => {
    expect(diffInDays('2026-01-31', '2026-02-01')).toBe(1);
    expect(diffInDays('2025-12-31', '2026-01-01')).toBe(1);
  });

  it('addDays rolls over month boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('mondayOfWeek maps every day in a Mon-Sun window to the same Monday', () => {
    // 2026-08-10 is a Monday
    expect(mondayOfWeek('2026-08-10')).toBe('2026-08-10');
    expect(mondayOfWeek('2026-08-11')).toBe('2026-08-10');
    expect(mondayOfWeek('2026-08-16')).toBe('2026-08-10'); // Sunday
    expect(mondayOfWeek('2026-08-17')).toBe('2026-08-17'); // next Monday
  });
});

describe('calculateStreaks — daily', () => {
  it('is 0/0 with no check-ins', () => {
    expect(calculateStreaks({ checkInDates: [], frequency: 'daily', today: '2026-08-13' }))
      .toEqual({ currentStreak: 0, longestStreak: 0 });
  });

  it('counts a run ending today', () => {
    const r = calculateStreaks({
      checkInDates: ['2026-08-11', '2026-08-12', '2026-08-13'],
      frequency: 'daily',
      today: '2026-08-13',
    });
    expect(r).toEqual({ currentStreak: 3, longestStreak: 3 });
  });

  it('grace period: yesterday checked in, today not yet — streak still current', () => {
    const r = calculateStreaks({
      checkInDates: ['2026-08-11', '2026-08-12'],
      frequency: 'daily',
      today: '2026-08-13',
    });
    expect(r.currentStreak).toBe(2);
  });

  it('breaks once a full day is missed (gap of 2+)', () => {
    const r = calculateStreaks({
      checkInDates: ['2026-08-10', '2026-08-11'],
      frequency: 'daily',
      today: '2026-08-13', // last check-in is 2 days back — one full missed day
    });
    expect(r.currentStreak).toBe(0);
  });

  it('longest streak can exceed the current (broken) streak', () => {
    const r = calculateStreaks({
      checkInDates: ['2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04', '2026-08-05', '2026-08-13'],
      frequency: 'daily',
      today: '2026-08-13',
    });
    expect(r).toEqual({ currentStreak: 1, longestStreak: 5 });
  });

  it('dedupes duplicate dates and ignores input order', () => {
    const r = calculateStreaks({
      checkInDates: ['2026-08-13', '2026-08-11', '2026-08-12', '2026-08-12', '2026-08-11'],
      frequency: 'daily',
      today: '2026-08-13',
    });
    expect(r).toEqual({ currentStreak: 3, longestStreak: 3 });
  });

  it('a single check-in today is a streak of 1', () => {
    const r = calculateStreaks({ checkInDates: ['2026-08-13'], frequency: 'daily', today: '2026-08-13' });
    expect(r).toEqual({ currentStreak: 1, longestStreak: 1 });
  });
});

describe('calculateStreaks — weekly', () => {
  // Mondays in range: 2026-07-27, 2026-08-03, 2026-08-10, 2026-08-17
  it('one check-in anywhere in the week satisfies that week', () => {
    const r = calculateStreaks({
      checkInDates: ['2026-08-10', '2026-08-12', '2026-08-14'], // all same Mon-Sun week
      frequency: 'weekly',
      today: '2026-08-13',
    });
    expect(r).toEqual({ currentStreak: 1, longestStreak: 1 });
  });

  it('does not break the streak on days within the week that have no check-in', () => {
    // Checked in once last week (Mon) and once this week (Wed) — no gap in
    // *weeks*, even though most days in between are unchecked.
    const r = calculateStreaks({
      checkInDates: ['2026-08-03', '2026-08-12'],
      frequency: 'weekly',
      today: '2026-08-13', // Thursday, in the 2026-08-10 week
    });
    expect(r.currentStreak).toBe(2);
  });

  it('grace period: last week checked in, this week not yet — streak still current', () => {
    const r = calculateStreaks({
      checkInDates: ['2026-08-03', '2026-08-04'], // both in the 2026-08-03 week
      frequency: 'weekly',
      today: '2026-08-13', // in the following 2026-08-10 week, no check-in yet
    });
    expect(r.currentStreak).toBe(1);
  });

  it('breaks once a full week is skipped', () => {
    const r = calculateStreaks({
      checkInDates: ['2026-07-27'], // week of 07-27 only
      frequency: 'weekly',
      today: '2026-08-13', // week of 08-10 — one full week (08-03) skipped in between
    });
    expect(r.currentStreak).toBe(0);
  });

  it('longest streak spans multiple consecutive weeks', () => {
    const r = calculateStreaks({
      checkInDates: ['2026-07-27', '2026-08-05', '2026-08-10'],
      frequency: 'weekly',
      today: '2026-08-13',
    });
    expect(r).toEqual({ currentStreak: 3, longestStreak: 3 });
  });
});
