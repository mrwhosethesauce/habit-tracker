// Pure streak-calculation logic. No I/O, no Date.now() — "today" is always
// passed in explicitly as a 'YYYY-MM-DD' UTC string, so this module has no
// hidden clock dependency and is trivially unit-testable.
//
// All date arithmetic is done by parsing 'YYYY-MM-DD' with an explicit 'Z'
// suffix, so results never depend on the host machine's local timezone.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toUTCDate(dateStr) {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function diffInDays(fromDateStr, toDateStr) {
  return Math.round((toUTCDate(toDateStr) - toUTCDate(fromDateStr)) / MS_PER_DAY);
}

function addDays(dateStr, n) {
  const d = toUTCDate(dateStr);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Monday of the ISO week containing dateStr, as a 'YYYY-MM-DD' string.
// Used as a grouping key for weekly habits: two check-ins in the same
// Mon-Sun window map to the same key, regardless of which day they fall on.
function mondayOfWeek(dateStr) {
  const d = toUTCDate(dateStr);
  const dayNum = (d.getUTCDay() + 6) % 7; // Mon=0 ... Sun=6
  d.setUTCDate(d.getUTCDate() - dayNum);
  return d.toISOString().slice(0, 10);
}

function uniqueSorted(strings) {
  return Array.from(new Set(strings)).sort();
}

// Longest run of consecutive units in a sorted, deduped array of keys,
// where `step(a, b)` returns the distance from a to b in "units" (1 day for
// daily habits, 7 days for weekly habits — since weekly keys are Mondays).
function longestRun(sortedKeys, unitDistance) {
  if (sortedKeys.length === 0) return 0;
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sortedKeys.length; i++) {
    if (diffInDays(sortedKeys[i - 1], sortedKeys[i]) === unitDistance) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
  }
  return longest;
}

// Current run ending at `refKey` (today's day-key or week-key), with a
// one-unit grace period: if the most recent check-in is one full unit
// behind `refKey` (yesterday for daily, last week for weekly), the streak
// is still "alive" — the current unit just hasn't happened yet. It only
// reads as broken once two full units have passed with no check-in.
function currentRun(sortedKeys, refKey, unitDistance) {
  if (sortedKeys.length === 0) return 0;
  const last = sortedKeys[sortedKeys.length - 1];
  const gap = diffInDays(last, refKey) / unitDistance;
  if (gap > 1) return 0;

  let run = 1;
  for (let i = sortedKeys.length - 1; i > 0; i--) {
    if (diffInDays(sortedKeys[i - 1], sortedKeys[i]) === unitDistance) {
      run += 1;
    } else {
      break;
    }
  }
  return run;
}

function calculateStreaks({ checkInDates, frequency, today }) {
  const sortedDates = uniqueSorted(checkInDates || []);

  if (frequency === 'weekly') {
    const weekKeys = uniqueSorted(sortedDates.map(mondayOfWeek));
    const todayKey = mondayOfWeek(today);
    return {
      currentStreak: currentRun(weekKeys, todayKey, 7),
      longestStreak: longestRun(weekKeys, 7),
    };
  }

  // 'daily' (also the default/fallback for any unrecognized frequency)
  return {
    currentStreak: currentRun(sortedDates, today, 1),
    longestStreak: longestRun(sortedDates, 1),
  };
}

module.exports = {
  calculateStreaks,
  // exported for unit testing / reuse elsewhere (e.g. heatmap week grouping)
  toUTCDate,
  diffInDays,
  addDays,
  mondayOfWeek,
};
