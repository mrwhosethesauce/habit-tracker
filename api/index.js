// Vercel Node functions accept a plain (req, res) handler, and an Express
// app is exactly that — so no adapter (e.g. serverless-http) is needed.
//
// This is a plain file, not a `[...path].js` bracket catch-all: combined
// with a custom `rewrites` entry in vercel.json (`/api/:path*` -> this
// file), that's what actually routes every /api/* request here. The
// bracket-catch-all convention was tried first and looked right, but
// Vercel's build auto-generated a routing rule that only matched
// *single-segment* /api/* paths (e.g. /api/health) and explicitly 404'd
// anything deeper (e.g. /api/auth/login) — confirmed by inspecting
// .vercel/output/config.json after a local `vercel build`. The explicit
// rewrite avoids relying on that inference entirely.
//
// The Express app itself lives in ../server, not here — Vercel treats
// every file under api/ as its own serverless function candidate (it
// tried to deploy routes/, models/, even the *.test.js file as separate
// functions, blowing past the Hobby plan's 12-function cap). Keeping only
// this one file in api/ means Vercel sees exactly one function.
const app = require('../server/app');

module.exports = app;
