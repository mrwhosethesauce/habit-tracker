const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema({
  habitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  // Stored as a 'YYYY-MM-DD' string (UTC calendar date), not a JS Date.
  // A Date object still carries a time/offset and invites timezone drift
  // the moment anything touches it (driver, timezone-aware tooling, a
  // future serverless region change). A plain date-only string sidesteps
  // that entirely and is what streak math actually wants to compare.
  date: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/,
  },
  // For a plain (non-count-based) habit this is always 1 — one row means
  // "done." For a count-based habit it accumulates toward the habit's
  // targetCount (e.g. glasses of water that day).
  count: {
    type: Number,
    min: 1,
    default: 1,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// One check-in per habit per day — enforced at the DB level so a duplicate
// request (double-click, retry) can't silently create a second check-in.
checkInSchema.index({ habitId: 1, date: 1 }, { unique: true });

module.exports = mongoose.models.CheckIn || mongoose.model('CheckIn', checkInSchema);
