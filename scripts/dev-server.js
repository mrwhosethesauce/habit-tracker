// Plain local dev server for the Express app — lets you develop without
// the Vercel CLI. `npm run dev` (which runs `vercel dev`) is still the
// closer-to-production option; this is the quick/manual alternative,
// paired with client/vite.config.js's proxy of /api to this port.
require('dotenv').config();

const app = require('../server/app');

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API dev server listening on http://localhost:${port}`);
});
