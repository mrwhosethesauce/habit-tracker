# Habit Tracker

MERN habit tracker with streaks and analytics — React/Vite/Tailwind frontend,
Express backend adapted as a single Vercel serverless function, MongoDB Atlas
via Mongoose, JWT auth.

## Structure

```
api/            Deployed to Vercel as serverless functions
  index.js      the ONLY file here — entry point, requires ../server/app.
                 Routed to by vercel.json's "/api/:path*" -> "/api" rewrite
                 (a bracket catch-all filename here, e.g. [...path].js,
                 was tried first but made Vercel's build auto-generate a
                 routing rule that only matched single-segment /api/*
                 paths — /api/health worked, /api/auth/login didn't. The
                 explicit rewrite avoids relying on that inference.)
server/         Express app and everything it needs (not deployed directly —
                 imported by api/index.js). Vercel treats every file under
                 api/ as its own serverless function candidate, so shared
                 code lives here instead, off Vercel's Hobby-plan
                 12-function cap.
  app.js        Express app, mounts routers below
  routes/       auth, habits, checkins, analytics
  middleware/   JWT auth guard
  models/       User, Habit, CheckIn (Mongoose schemas)
  lib/          db connection, streak calculation (pure function)
client/         React + Vite + Tailwind frontend
scripts/        local dev helper (outside api/ so Vercel won't treat it as a function)
vercel.json     build + routing config
```

## Local development

1. Copy the env file and fill in real values:
   ```
   cp .env.example .env
   ```
   - `MONGODB_URI` — your MongoDB Atlas connection string (see below)
   - `JWT_SECRET` — any long random string, e.g. `openssl rand -hex 32`
   - `JWT_EXPIRES_IN` — token lifetime, e.g. `7d`

2. Install dependencies:
   ```
   npm run install:all
   ```

3. Run the app. Two options:

   - **Plain Node + Vite** (no Vercel CLI needed) — run in two terminals:
     ```
     npm run dev:api      # Express on http://localhost:3000
     npm run dev:client   # Vite on http://localhost:5173, proxies /api to :3000
     ```
     Open http://localhost:5173.

   - **Vercel dev** (closer to production, requires `vercel login` once):
     ```
     npm run dev
     ```

4. Run backend tests (streak calculation logic):
   ```
   npm test
   ```

## Deploying to Vercel

### 1. Set up MongoDB Atlas

1. Sign in at https://cloud.mongodb.com and create a free **M0** cluster.
2. **Security → Database Access** — add a database user (password auth,
   "Read and write to any database").
3. **Security → Network Access** — add `0.0.0.0/0` ("Allow Access from
   Anywhere"). Vercel serverless functions don't have static IPs, so the
   cluster must accept connections from any address; access is still gated
   by the database username/password.
4. **Database → Connect → Drivers (Node.js)** — copy the connection string
   and add a database name before the query string, e.g.:
   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/habittracker?retryWrites=true&w=majority
   ```

### 2. Set up Resend (password-reset emails)

1. Sign up at https://resend.com.
2. **API Keys** (left sidebar) → **Create API Key** → "Sending access" is
   enough. Copy the key (starts with `re_`) — shown once.
3. Without a verified domain, Resend's sandbox only delivers to the email
   address the Resend account itself signed up with — fine for a
   single-user deployment. Verify a domain under **Domains** to send to
   other users' emails too.

### 3. Push this repo to GitHub (or GitLab/Bitbucket)

Vercel deploys from a git provider.

### 4. Import the project in Vercel

1. https://vercel.com/new → import the repo.
2. **Leave Root Directory as the repo root** — do *not* point it at `client/`.
   `vercel.json` at the root already tells Vercel how to build `client/` and
   where `api/` is; pointing Root Directory at `client/` would hide `api/`
   from Vercel entirely and the backend wouldn't deploy.
3. Framework Preset: Vercel will read `vercel.json`'s `buildCommand` /
   `outputDirectory` — no framework preset needed (set to "Other" if asked).

### 5. Set environment variables

In the Vercel project → **Settings → Environment Variables**, add for
**Production**, **Preview**, and **Development**:

| Key | Value |
|---|---|
| `MONGODB_URI` | the Atlas connection string from step 1 |
| `JWT_SECRET` | a long random string (use a *different* one than local dev) |
| `JWT_EXPIRES_IN` | `7d` (or your preferred token lifetime) |
| `RESEND_API_KEY` | the API key from step 2 |

`RESEND_FROM_EMAIL` and `APP_URL` are optional — see `.env.example` for
when you'd need them.

### 6. Deploy

Trigger a deploy (push to the connected branch, or click Deploy in the
dashboard). Vercel runs `installCommand` and `buildCommand` from
`vercel.json`, serves `client/dist` as static output, and deploys
`api/index.js` as the serverless function handling everything under
`/api/*`.

### 7. Verify

- `https://<your-app>.vercel.app/api/health` → `{"ok":true}`
- Load the app, sign up, create a habit, check it off, and confirm the
  dashboard/heatmap/analytics pages populate correctly.

## Notes

- `.env` is git-ignored — never commit real credentials. `.env.example`
  (root) and `client/.env.example` document the required variables without
  values.
- The frontend's `VITE_API_BASE_URL` defaults to `/api`, which works
  unchanged in production since the frontend and API are served from the
  same Vercel deployment/domain.
