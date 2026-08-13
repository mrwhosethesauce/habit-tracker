// Vercel Node functions accept a plain (req, res) handler, and an Express
// app is exactly that — so no adapter (e.g. serverless-http) is needed.
// This catch-all file means every request under /api/* is routed here,
// and Express does the internal routing from there.
const app = require('./app');

module.exports = app;
