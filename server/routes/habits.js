const express = require('express');
const connectDB = require('../lib/db');
const Habit = require('../models/Habit');
const CheckIn = require('../models/CheckIn');
const requireAuth = require('../middleware/auth');
const { calculateStreaks } = require('../lib/streak');

const router = express.Router();
router.use(requireAuth);

const FREQUENCIES = ['daily', 'weekly'];

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
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
    const checkIns = await CheckIn.find({ habitId: { $in: habitIds } }, 'habitId date').lean();

    const datesByHabit = new Map();
    for (const c of checkIns) {
      const key = String(c.habitId);
      if (!datesByHabit.has(key)) datesByHabit.set(key, []);
      datesByHabit.get(key).push(c.date);
    }

    const today = todayUTC();
    const enriched = habits.map((h) => {
      const dates = datesByHabit.get(String(h._id)) || [];
      const { currentStreak } = calculateStreaks({ checkInDates: dates, frequency: h.frequency, today });
      return {
        ...h.toObject(),
        todayCheckedIn: dates.includes(today),
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
    const { name, category, frequency } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Habit name is required' });
    }
    if (frequency && !FREQUENCIES.includes(frequency)) {
      return res.status(400).json({ error: `frequency must be one of: ${FREQUENCIES.join(', ')}` });
    }

    await connectDB();
    const habit = await Habit.create({
      userId: req.userId,
      name: name.trim(),
      category: (category || '').trim(),
      frequency: frequency || 'daily',
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
    const checkInDates = checkIns.map((c) => c.date);
    const today = todayUTC();
    const { currentStreak, longestStreak } = calculateStreaks({
      checkInDates,
      frequency: habit.frequency,
      today,
    });

    res.json({
      habit,
      checkInDates,
      todayCheckedIn: checkInDates.includes(today),
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
    const { name, category, frequency } = req.body || {};
    if (frequency && !FREQUENCIES.includes(frequency)) {
      return res.status(400).json({ error: `frequency must be one of: ${FREQUENCIES.join(', ')}` });
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
