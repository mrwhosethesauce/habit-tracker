const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    // bcrypt hash, never the plaintext password
    type: String,
    required: true,
  },
  // SHA-256 hash of the reset token, never the raw token — same reasoning
  // as the password itself. The raw token only ever exists in the email
  // link and the incoming request; if the DB were ever read, a stored
  // token would otherwise be as good as a live password-reset link.
  passwordResetTokenHash: {
    type: String,
    default: null,
  },
  passwordResetExpires: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
