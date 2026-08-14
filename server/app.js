const express = require('express');
const cors = require('cors');

const app = express();

// Vercel puts the app behind a proxy — without this, req.protocol always
// reports 'http', which would build password-reset links with the wrong
// scheme when APP_URL isn't set.
app.set('trust proxy', true);

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/habits', require('./routes/habits'));
app.use('/api/checkins', require('./routes/checkins'));
app.use('/api/analytics', require('./routes/analytics'));

module.exports = app;
