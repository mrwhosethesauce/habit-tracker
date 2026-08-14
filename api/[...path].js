// Vercel Node functions accept a plain (req, res) handler, and an Express
// app is exactly that — so no adapter (e.g. serverless-http) is needed.
// This catch-all file means every request under /api/* is routed here,
// and Express does the internal routing from there.
//
// The Express app itself lives in ../server, not here — Vercel treats
// every file under api/ as its own serverless function candidate (it
// tried to deploy routes/, models/, even the *.test.js file as separate
// functions, blowing past the Hobby plan's 12-function cap). Keeping only
// this one file in api/ means Vercel sees exactly one function.
const app = require('../server/app');

module.exports = app;
