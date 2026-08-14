const express = require('express');
const connectDB = require('../lib/db');
const Habit = require('../models/Habit');
const CheckIn = require('../models/CheckIn');
const requireAuth = require('../middleware/auth');
const { calculateStreaks, addDays, weekdayOfUTC } = require('../lib/streak');

const router = express.Router();
router.use(requireAuth);

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function streakParamsFor(habit) {
  return { frequency: habit.frequency, daysOfWeek: habit.daysOfWeek, timesPerWeek: habit.timesPerWeek };
}

// Is `date` a day this habit actually needs a check-in on? 'weekly'
// habits don't have a per-day target (they're evaluated per week instead,
// via the leaderboard's streak calculation), so they're excluded upstream.
function isRequiredOn(habit, date) {
  if (habit.frequency === 'days_of_week') {
    return (habit.daysOfWeek || []).includes(weekdayOfUTC(date));
  }
  return true; // 'daily'
}

// Day-by-day completion rate over the trailing `days` window. Scoped to
// 'daily' and 'days_of_week' habits — both have a genuine per-day target.
// 'weekly' habits don't (any day in the week could be "the" day), so they
// show up in the leaderboard instead, via the streak function's week-based
// logic.
router.get('/completion', async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);
    await connectDB();

    const habits = await Habit.find({ userId: req.userId, frequency: { $in: ['daily', 'days_of_week'] } });
    const today = todayUTC();
    const start = addDays(today, -(days - 1));

    const habitIds = habits.map((h) => h._id);
    const checkIns = await CheckIn.find(
      { habitId: { $in: habitIds }, userId: req.userId, date: { $gte: start, $lte: today } },
      'habitId date count'
    ).lean();

    // A day only counts as "completed" once its count reaches the habit's
    // target — for a plain (non-count-based) habit, targetCount is 1, so
    // any check-in already satisfies that.
    const targetByHabit = new Map(habits.map((h) => [String(h._id), h.targetCount]));
    const satisfiedSet = new Set(
      checkIns.filter((c) => c.count >= targetByHabit.get(String(c.habitId))).map((c) => `${c.habitId}_${c.date}`)
    );
    const createdDates = habits.map((h) => h.createdAt.toISOString().slice(0, 10));

    const series = [];
    for (let i = 0; i < days; i++) {
      const date = addDays(start, i);
      let total = 0;
      let completed = 0;
      for (let j = 0; j < habits.length; j++) {
        if (createdDates[j] > date) continue; // habit didn't exist yet
        if (!isRequiredOn(habits[j], date)) continue; // e.g. not one of this habit's chosen weekdays
        total += 1;
        if (satisfiedSet.has(`${habits[j]._id}_${date}`)) completed += 1;
      }
      series.push({
        date,
        total,
        completed,
        // null (not 0) when no habit required a check-in that day, so the
        // frontend can render it as a gap instead of a misleading 0%.
        rate: total > 0 ? Math.round((completed / total) * 100) : null,
      });
    }

    res.json({ days, series });
  } catch (err) {
    console.error('completion analytics error', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Longest-streak leaderboard across every habit, all frequencies alike —
// calculateStreaks already normalizes them, so streak counts are
// comparable even though a "unit" means something different for each.
router.get('/leaderboard', async (req, res) => {
  try {
    await connectDB();
    const habits = await Habit.find({ userId: req.userId });
    const habitIds = habits.map((h) => h._id);
    const checkIns = await CheckIn.find({ habitId: { $in: habitIds } }, 'habitId date count').lean();

    const checkInsByHabit = new Map();
    for (const c of checkIns) {
      const key = String(c.habitId);
      if (!checkInsByHabit.has(key)) checkInsByHabit.set(key, []);
      checkInsByHabit.get(key).push(c);
    }

    const today = todayUTC();
    const leaderboard = habits
      .map((h) => {
        const habitCheckIns = checkInsByHabit.get(String(h._id)) || [];
        const satisfiedDates = habitCheckIns.filter((c) => c.count >= h.targetCount).map((c) => c.date);
        const { currentStreak, longestStreak } = calculateStreaks({
          checkInDates: satisfiedDates,
          today,
          ...streakParamsFor(h),
        });
        return {
          habitId: h._id,
          name: h.name,
          frequency: h.frequency,
          category: h.category,
          currentStreak,
          longestStreak,
        };
      })
      .sort((a, b) => b.longestStreak - a.longestStreak);

    res.json(leaderboard);
  } catch (err) {
    console.error('leaderboard analytics error', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
