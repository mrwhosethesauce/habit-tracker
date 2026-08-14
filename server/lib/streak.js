// Pure streak-calculation logic. No I/O, no Date.now() — "today" is always
// passed in explicitly as a 'YYYY-MM-DD' UTC string, so this module has no
// hidden clock dependency and is trivially unit-testable.
//
// All date arithmetic is done by parsing 'YYYY-MM-DD' with an explicit 'Z'
// suffix, so results never depend on the host machine's local timezone.
//
// `checkInDates` is always the set of dates the habit was *satisfied* on —
// for count-based habits (targetCount > 1) that filtering (did that day's
// accumulated count reach the target) happens in the caller, not here, so
// this module only ever reasons about "satisfied or not," never counts.

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

// 0=Sunday..6=Saturday, matching JS Date#getUTCDay() — the same convention
// daysOfWeek arrays are stored in, so no translation is needed at the edges.
function weekdayOfUTC(dateStr) {
  return toUTCDate(dateStr).getUTCDay();
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
// where consecutive means exactly `unitDistance` days apart (1 for daily
// keys, 7 for weekly keys, since weekly keys are Mondays).
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
// one-unit grace period: if the most recent satisfied unit is one full
// unit behind `refKey` (yesterday for daily, last week for weekly), the
// streak is still "alive" — the current unit just hasn't happened yet. It
// only reads as broken once two full units have passed with nothing.
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

// Generalizes 'daily' and 'days_of_week': walk every calendar day from the
// earliest check-in through `today`, keep only the ones `isRequiredFn`
// says this habit actually needs (every day for daily; just the chosen
// weekdays for days_of_week) — non-required days are skipped entirely and
// can never break the streak, same idea as weekly skipping non-check-in
// days within a week. "Consecutive" is then consecutive *within that
// filtered sequence*, not consecutive calendar days.
function calculateDateBasedStreaks(sortedDates, today, isRequiredFn) {
  if (sortedDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const satisfiedSet = new Set(sortedDates);
  const requiredDates = [];
  let cursor = sortedDates[0];
  while (cursor <= today) {
    if (isRequiredFn(cursor)) requiredDates.push(cursor);
    cursor = addDays(cursor, 1);
  }
  if (requiredDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  let longest = 0;
  let run = 0;
  for (const d of requiredDates) {
    if (satisfiedSet.has(d)) {
      run += 1;
      if (run > longest) longest = run;
    } else {
      run = 0;
    }
  }

  const n = requiredDates.length;
  let current = 0;
  for (let i = n - 1; i >= 0; i--) {
    const d = requiredDates[i];
    if (satisfiedSet.has(d)) {
      current += 1;
    } else if (i === n - 1 && d === today) {
      // today is required and not done yet — it hasn't been missed, it's
      // just pending. Keep looking back instead of breaking.
      continue;
    } else {
      break;
    }
  }

  return { currentStreak: current, longestStreak: longest };
}

// Generalizes 'weekly': a week is satisfied once it has at least
// `requiredPerWeek` check-ins, any days. requiredPerWeek=1 is the original
// weekly behavior; >1 is "N times per week."
function calculateWeekBasedStreaks(sortedDates, today, requiredPerWeek) {
  const countsByWeek = new Map();
  for (const d of sortedDates) {
    const wk = mondayOfWeek(d);
    countsByWeek.set(wk, (countsByWeek.get(wk) || 0) + 1);
  }
  const satisfiedWeeks = uniqueSorted(
    [...countsByWeek.entries()].filter(([, count]) => count >= requiredPerWeek).map(([wk]) => wk)
  );
  const todayKey = mondayOfWeek(today);
  return {
    currentStreak: currentRun(satisfiedWeeks, todayKey, 7),
    longestStreak: longestRun(satisfiedWeeks, 7),
  };
}

function calculateStreaks({ checkInDates, frequency, today, daysOfWeek, timesPerWeek }) {
  const sortedDates = uniqueSorted(checkInDates || []);

  if (frequency === 'weekly') {
    return calculateWeekBasedStreaks(sortedDates, today, Math.max(1, timesPerWeek || 1));
  }

  if (frequency === 'days_of_week') {
    const allowed = new Set(daysOfWeek && daysOfWeek.length ? daysOfWeek : [0, 1, 2, 3, 4, 5, 6]);
    return calculateDateBasedStreaks(sortedDates, today, (date) => allowed.has(weekdayOfUTC(date)));
  }

  // 'daily' (also the default/fallback for any unrecognized frequency)
  return calculateDateBasedStreaks(sortedDates, today, () => true);
}

module.exports = {
  calculateStreaks,
  // exported for unit testing / reuse elsewhere (e.g. heatmap week grouping)
  toUTCDate,
  diffInDays,
  addDays,
  mondayOfWeek,
  weekdayOfUTC,
};
