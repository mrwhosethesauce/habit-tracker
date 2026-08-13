const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const connectDB = require('../lib/db');
const User = require('../models/User');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
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

module.exports = router;
