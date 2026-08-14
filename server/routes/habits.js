const express = require('express');
const connectDB = require('../lib/db');
const Habit = require('../models/Habit');
const CheckIn = require('../models/CheckIn');
const requireAuth = require('../middleware/auth');
const { calculateStreaks } = require('../lib/streak');

const router = express.Router();
router.use(requireAuth);

const FREQUENCIES = ['daily', 'weekly', 'days_of_week'];

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

// Shared by POST (create) and PUT (update) — only validates fields that
// are actually present in the request, since PUT allows partial updates.
function validateFrequencyFields({ frequency, daysOfWeek, timesPerWeek, targetCount }) {
  if (frequency !== undefined && !FREQUENCIES.includes(frequency)) {
    return `frequency must be one of: ${FREQUENCIES.join(', ')}`;
  }
  if (frequency === 'days_of_week') {
    if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
      return 'daysOfWeek must be a non-empty array of weekday numbers (0=Sun..6=Sat) when frequency is days_of_week';
    }
  }
  if (daysOfWeek !== undefined) {
    if (!Array.isArray(daysOfWeek) || !daysOfWeek.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) {
      return 'daysOfWeek values must be integers 0-6 (Sun-Sat)';
    }
  }
  if (timesPerWeek !== undefined && (!Number.isInteger(timesPerWeek) || timesPerWeek < 1 || timesPerWeek > 7)) {
    return 'timesPerWeek must be an integer between 1 and 7';
  }
  if (targetCount !== undefined && (!Number.isInteger(targetCount) || targetCount < 1)) {
    return 'targetCount must be an integer of at least 1';
  }
  return null;
}

function streakParamsFor(habit) {
  return { frequency: habit.frequency, daysOfWeek: habit.daysOfWeek, timesPerWeek: habit.timesPerWeek };
}

// List view is enriched with today's check-in status + current streak so
// the dashboard can render toggles in one request instead of one call per
// habit (N+1). Full history + longest streak lives behind /:id/stats,
// which only the habit detail page needs.
router.get('/', async (req, res) => {
  try {
    await connectDB();
    const habits = await Habit.find({ userId: req.userId }).sort({ createdAt: -1 });

    const habitIds = habits.map((h) => h._id);
    const checkIns = await CheckIn.find({ habitId: { $in: habitIds } }, 'habitId date count').lean();

    const checkInsByHabit = new Map();
    for (const c of checkIns) {
      const key = String(c.habitId);
      if (!checkInsByHabit.has(key)) checkInsByHabit.set(key, []);
      checkInsByHabit.get(key).push(c);
    }

    const today = todayUTC();
    const enriched = habits.map((h) => {
      const habitCheckIns = checkInsByHabit.get(String(h._id)) || [];
      const todayEntry = habitCheckIns.find((c) => c.date === today);
      const todayCount = todayEntry ? todayEntry.count : 0;
      const satisfiedDates = habitCheckIns.filter((c) => c.count >= h.targetCount).map((c) => c.date);

      const { currentStreak } = calculateStreaks({ checkInDates: satisfiedDates, today, ...streakParamsFor(h) });
      return {
        ...h.toObject(),
        todayCheckedIn: todayCount >= h.targetCount,
        todayCount,
        currentStreak,
      };
    });

    res.json(enriched);
  } catch (err) {
    console.error('list habits error', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, category, frequency, daysOfWeek, timesPerWeek, targetCount } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Habit name is required' });
    }
    const validationError = validateFrequencyFields({ frequency, daysOfWeek, timesPerWeek, targetCount });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    await connectDB();
    const habit = await Habit.create({
      userId: req.userId,
      name: name.trim(),
      category: (category || '').trim(),
      frequency: frequency || 'daily',
      daysOfWeek: frequency === 'days_of_week' ? daysOfWeek : undefined,
      timesPerWeek: timesPerWeek !== undefined ? timesPerWeek : undefined,
      targetCount: targetCount !== undefined ? targetCount : undefined,
    });
    res.status(201).json(habit);
  } catch (err) {
    console.error('create habit error', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Full check-in history + computed streaks for one habit — powers the
// detail page's heatmap and stats cards.
router.get('/:id/stats', async (req, res) => {
  try {
    await connectDB();
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    const checkIns = await CheckIn.find({ habitId: habit._id }).sort({ date: 1 });
    const checkInDates = checkIns.map((c) => c.date); // presence, for the heatmap
    const satisfiedDates = checkIns.filter((c) => c.count >= habit.targetCount).map((c) => c.date);

    const today = todayUTC();
    const todayEntry = checkIns.find((c) => c.date === today);
    const todayCount = todayEntry ? todayEntry.count : 0;

    const { currentStreak, longestStreak } = calculateStreaks({
      checkInDates: satisfiedDates,
      today,
      ...streakParamsFor(habit),
    });

    res.json({
      habit,
      checkInDates,
      todayCheckedIn: todayCount >= habit.targetCount,
      todayCount,
      currentStreak,
      longestStreak,
    });
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ error: 'Habit not found' });
    console.error('habit stats error', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    await connectDB();
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });
    res.json(habit);
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ error: 'Habit not found' });
    console.error('get habit error', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, category, frequency, daysOfWeek, timesPerWeek, targetCount } = req.body || {};
    const validationError = validateFrequencyFields({ frequency, daysOfWeek, timesPerWeek, targetCount });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ error: 'Habit name cannot be empty' });
    }

    await connectDB();
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    if (name !== undefined) habit.name = name.trim();
    if (category !== undefined) habit.category = category.trim();
    if (frequency !== undefined) habit.frequency = frequency;
    if (daysOfWeek !== undefined) habit.daysOfWeek = daysOfWeek;
    if (timesPerWeek !== undefined) habit.timesPerWeek = timesPerWeek;
    if (targetCount !== undefined) habit.targetCount = targetCount;

    await habit.save();
    res.json(habit);
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ error: 'Habit not found' });
    console.error('update habit error', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await connectDB();
    const habit = await Habit.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    // Cascade delete — otherwise these rows sit in the collection forever,
    // pointing at a habit that no longer exists.
    await CheckIn.deleteMany({ habitId: habit._id });

    res.status(204).end();
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ error: 'Habit not found' });
    console.error('delete habit error', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
