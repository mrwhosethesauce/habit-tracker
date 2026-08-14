const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const connectDB = require('../lib/db');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../lib/email');
const requireAuth = require('../middleware/auth');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// The reset link must point at the frontend (a client-side route), which
// isn't always the same origin as the API — e.g. local dev runs Vite on
// :5173 and the API on :3000. APP_URL covers that; in production, where
// they're the same Vercel deployment, request headers are a safe fallback.
function resolveAppUrl(req) {
  return process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
}

router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'A valid email is required' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    await connectDB();

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email: normalizedEmail, password: hashed });

    const token = signToken(user._id.toString());
    res.status(201).json({ token, user: { id: user._id, email: user.email } });
  } catch (err) {
    console.error('signup error', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Same error for "no such user" and "wrong password" — don't leak
    // which one it was.
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user._id.toString());
    res.json({ token, user: { id: user._id, email: user.email } });
  } catch (err) {
    console.error('login error', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// POST /forgot-password { email } — always responds with the same generic
// message regardless of whether the email exists, so this endpoint can't
// be used to enumerate registered accounts.
router.post('/forgot-password', async (req, res) => {
  const GENERIC_MESSAGE = 'If an account exists for that email, a reset link has been sent.';
  try {
    const { email } = req.body || {};
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'A valid email is required' });
    }

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetTokenHash = hashToken(rawToken);
      user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await user.save();

      const resetUrl = `${resolveAppUrl(req)}/reset-password?token=${rawToken}`;
      try {
        await sendPasswordResetEmail(user.email, resetUrl);
      } catch (emailErr) {
        // Don't leak email-delivery failures to the client — that would
        // reveal whether the account exists just as much as a distinct
        // response would.
        console.error('password reset email failed', emailErr);
      }
    }

    res.json({ message: GENERIC_MESSAGE });
  } catch (err) {
    console.error('forgot-password error', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token) {
      return res.status(400).json({ error: 'Reset token is required' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    await connectDB();
    const user = await User.findOne({
      passwordResetTokenHash: hashToken(token),
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetTokenHash = null;
    user.passwordResetExpires = null;
    await user.save();

    res.json({ message: 'Password updated — you can now log in' });
  } catch (err) {
    console.error('reset-password error', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// PUT /password { currentPassword, newPassword } — the logged-in-user
// equivalent of reset-password. Requires the current password rather than
// a token, since there's no "forgot" step here — the user is already
// authenticated, but that alone shouldn't be enough to silently change
// the password (e.g. from a hijacked but not-yet-logged-out session).
router.put('/password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    await connectDB();
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error('change-password error', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
