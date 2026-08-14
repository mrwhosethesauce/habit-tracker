const express = require('express');
const connectDB = require('../lib/db');
const CheckIn = require('../models/CheckIn');
const Habit = require('../models/Habit');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

async function loadOwnedHabit(habitId, userId) {
  return Habit.findOne({ _id: habitId, userId });
}

// GET /api/checkins?habitId=xxx&from=YYYY-MM-DD&to=YYYY-MM-DD
// `from`/`to` are optional (inclusive) — used by the heatmap/analytics views
// to pull a bounded range instead of a habit's entire history.
router.get('/', async (req, res) => {
  try {
    const { habitId, from, to } = req.query;
    if (!habitId) return res.status(400).json({ error: 'habitId query param is required' });
    if (from && !DATE_RE.test(from)) return res.status(400).json({ error: 'from must be in YYYY-MM-DD format' });
    if (to && !DATE_RE.test(to)) return res.status(400).json({ error: 'to must be in YYYY-MM-DD format' });

    await connectDB();
    const habit = await loadOwnedHabit(habitId, req.userId);
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    const query = { habitId, userId: req.userId };
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }

    const checkIns = await CheckIn.find(query).sort({ date: 1 });
    res.json(checkIns);
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ error: 'Habit not found' });
    console.error('list checkins error', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// POST /api/checkins  { habitId, date? } — mark done (or +1 for a
// count-based habit). `date` defaults to today (UTC). Future dates are
// rejected; past dates are allowed (backfilling a missed day is normal).
router.post('/', async (req, res) => {
  try {
    const { habitId } = req.body || {};
    const date = (req.body && req.body.date) || todayUTC();

    if (!habitId) return res.status(400).json({ error: 'habitId is required' });
    if (!DATE_RE.test(date)) return res.status(400).json({ error: 'date must be in YYYY-MM-DD format' });
    if (date > todayUTC()) return res.status(400).json({ error: 'Cannot check in for a future date' });

    await connectDB();
    const habit = await loadOwnedHabit(habitId, req.userId);
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    // A check-in dated before the habit existed would otherwise vanish from
    // the completion-rate denominator (which only counts habits active as
    // of that day) while still existing as a "completed" row — an
    // uncountable check-in. Reject at the source instead.
    const createdDate = habit.createdAt.toISOString().slice(0, 10);
    if (date < createdDate) {
      return res.status(400).json({ error: 'Cannot check in before the habit was created' });
    }

    if (habit.targetCount > 1) {
      // Count-based habit: each POST is a "+1" for that day. Atomic
      // upsert-and-increment avoids a duplicate-key race between two
      // concurrent requests both trying to create the first entry.
      const checkIn = await CheckIn.findOneAndUpdate(
        { habitId, date },
        { $inc: { count: 1 }, $setOnInsert: { habitId, userId: req.userId, date } },
        { upsert: true, new: true }
      );
      return res.status(200).json(checkIn);
    }

    const checkIn = await CheckIn.create({ habitId, userId: req.userId, date });
    res.status(201).json(checkIn);
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ error: 'Habit not found' });
    // Unique index on {habitId, date} — a double-click or retried request
    // on a non-count-based habit lands here instead of creating a second
    // check-in for the same day.
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Already checked in for this date' });
    }
    console.error('create checkin error', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// DELETE /api/checkins?habitId=xxx&date=YYYY-MM-DD — undo (or -1 for a
// count-based habit, removing the row once it reaches 0). `date` defaults
// to today (UTC). Query params, not a body, since DELETE bodies aren't
// reliably forwarded by every client/proxy.
router.delete('/', async (req, res) => {
  try {
    const { habitId } = req.query;
    const date = req.query.date || todayUTC();

    if (!habitId) return res.status(400).json({ error: 'habitId query param is required' });
    if (!DATE_RE.test(date)) return res.status(400).json({ error: 'date must be in YYYY-MM-DD format' });

    await connectDB();
    const habit = await loadOwnedHabit(habitId, req.userId);
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    const existing = await CheckIn.findOne({ habitId, userId: req.userId, date });
    if (!existing) return res.status(404).json({ error: 'No check-in found for this date' });

    if (habit.targetCount > 1 && existing.count > 1) {
      existing.count -= 1;
      await existing.save();
      return res.status(200).json(existing);
    }

    await CheckIn.deleteOne({ _id: existing._id });
    res.status(204).end();
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ error: 'Habit not found' });
    console.error('delete checkin error', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
