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
    enum: ['daily', 'weekly'],
    required: true,
    default: 'daily',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.Habit || mongoose.model('Habit', habitSchema);
