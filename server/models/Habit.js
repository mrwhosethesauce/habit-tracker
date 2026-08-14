const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    default: '',
    trim: true,
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'days_of_week'],
    required: true,
    default: 'daily',
  },
  // Only meaningful when frequency === 'weekly'. Defaults to 1, so
  // existing habits (created before this field existed) keep their
  // original "at least once a week" behavior unchanged.
  timesPerWeek: {
    type: Number,
    min: 1,
    max: 7,
    default: 1,
  },
  // Only meaningful when frequency === 'days_of_week'. 0=Sunday..6=Saturday
  // (matches JS Date#getUTCDay(), which the streak calculator also uses).
  daysOfWeek: {
    type: [Number],
    default: [],
    validate: {
      validator: (arr) => arr.every((d) => Number.isInteger(d) && d >= 0 && d <= 6),
      message: 'daysOfWeek values must be integers 0-6 (Sun-Sat)',
    },
  },
  // 1 = a plain done/not-done habit (the original behavior). >1 makes it
  // count-based: check-ins accumulate a count per day, and the day only
  // counts toward the streak once the count reaches this target.
  targetCount: {
    type: Number,
    min: 1,
    default: 1,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.Habit || mongoose.model('Habit', habitSchema);
