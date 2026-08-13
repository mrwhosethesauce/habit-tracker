const express = require('express');
const connectDB = require('../lib/db');
const Habit = require('../models/Habit');
const CheckIn = require('../models/CheckIn');
const requireAuth = require('../middleware/auth');
const { calculateStreaks, addDays } = require('../lib/streak');

const router = express.Router();
router.use(requireAuth);

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

// Day-by-day completion rate over the trailing `days` window. Scoped to
// 'daily' habits only — a weekly habit doesn't have a per-day target, so
// folding it into a daily rate would misrepresent both. Weekly habits show
// up in the leaderboard instead, via the streak function's week-based logic.
router.get('/completion', async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);
    await connectDB();

    const habits = await Habit.find({ userId: req.userId, frequency: 'daily' });
    const today = todayUTC();
    const start = addDays(today, -(days - 1));

    const habitIds = habits.map((h) => h._id);
    const checkIns = await CheckIn.find(
      { habitId: { $in: habitIds }, userId: req.userId, date: { $gte: start, $lte: today } },
      'habitId date'
    ).lean();

    const checkInSet = new Set(checkIns.map((c) => `${c.habitId}_${c.date}`));
    const createdDates = habits.map((h) => h.createdAt.toISOString().slice(0, 10));

    const series = [];
    for (let i = 0; i < days; i++) {
      const date = addDays(start, i);
      let total = 0;
      let completed = 0;
      for (let j = 0; j < habits.length; j++) {
        if (createdDates[j] > date) continue; // habit didn't exist yet
        total += 1;
        if (checkInSet.has(`${habits[j]._id}_${date}`)) completed += 1;
      }
      series.push({
        date,
        total,
        completed,
        // null (not 0) when no daily habit existed yet that day, so the
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

// Longest-streak leaderboard across every habit, daily and weekly alike —
// calculateStreaks already normalizes the two, so streak counts are
// comparable even though a 'day' means something different for each.
router.get('/leaderboard', async (req, res) => {
  try {
    await connectDB();
    const habits = await Habit.find({ userId: req.userId });
    const habitIds = habits.map((h) => h._id);
    const checkIns = await CheckIn.find({ habitId: { $in: habitIds } }, 'habitId date').lean();

    const datesByHabit = new Map();
    for (const c of checkIns) {
      const key = String(c.habitId);
      if (!datesByHabit.has(key)) datesByHabit.set(key, []);
      datesByHabit.get(key).push(c.date);
    }

    const today = todayUTC();
    const leaderboard = habits
      .map((h) => {
        const dates = datesByHabit.get(String(h._id)) || [];
        const { currentStreak, longestStreak } = calculateStreaks({
          checkInDates: dates,
          frequency: h.frequency,
          today,
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
