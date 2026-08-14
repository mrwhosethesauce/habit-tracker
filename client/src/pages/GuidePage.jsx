const SECTIONS = [
  {
    q: 'What are the frequency types?',
    a: (
      <>
        <p><strong>Daily</strong> — required every day.</p>
        <p><strong>Weekly</strong> — required a set number of times per week (you choose, e.g. 3x), on any days you like.</p>
        <p><strong>Specific days</strong> — required only on the weekdays you pick, e.g. Mon/Wed/Fri.</p>
      </>
    ),
  },
  {
    q: 'How does the streak grace period work?',
    a: (
      <p>
        A streak only breaks once a full day (or week, for weekly habits) has passed with nothing logged.
        If you checked in yesterday but haven't yet today, your streak still shows as current — today just
        hasn't happened yet. For "specific days" habits, days that aren't on your schedule never count
        against you at all.
      </p>
    ),
  },
  {
    q: "What's the difference between current and longest streak?",
    a: (
      <p>
        <strong>Current streak</strong> is how many days/weeks in a row you've kept up, right up to today.
        <strong> Longest streak</strong> is the best run you've ever had for that habit, even if it's since
        been broken.
      </p>
    ),
  },
  {
    q: 'What are count-based habits?',
    a: (
      <p>
        Instead of a plain done/not-done toggle, a count-based habit (e.g. "drink 8 glasses of water") lets
        you log progress with +1/−1 through the day. It only counts toward your streak once you hit the
        target for that day.
      </p>
    ),
  },
  {
    q: 'Can I back-date a check-in?',
    a: (
      <p>
        Only within the habit's lifetime — you can mark a past day done (e.g. you forgot to log yesterday),
        but not before the habit was created, and never for a future date.
      </p>
    ),
  },
  {
    q: 'What do the 🔥 🏆 👑 icons mean?',
    a: (
      <p>
        Milestone markers for a streak: 🔥 at 7+, 🏆 at 30+, 👑 at 100+. For a weekly habit these count
        weeks, not days.
      </p>
    ),
  },
  {
    q: 'Why is each habit a different color?',
    a: (
      <p>
        Every habit gets its own fixed color (based on the habit itself, so it never changes) — used
        consistently on its card, detail page, heatmap, and the analytics leaderboard, so you can recognize
        it at a glance in any view.
      </p>
    ),
  },
  {
    q: "What's the difference between List and Overview on the dashboard?",
    a: (
      <p>
        <strong>List</strong> is the everyday check-off view. <strong>Overview</strong> stacks every habit's
        last 90 days side by side, each in its own color, so you can compare activity across all your habits
        at once.
      </p>
    ),
  },
  {
    q: 'Why does the Analytics completion chart skip some habits?',
    a: (
      <p>
        The daily completion-rate chart only includes Daily and Specific-days habits, since those are the
        ones with an actual per-day target. Weekly habits don't have a "the" day they're due, so they show
        up in the streak leaderboard instead.
      </p>
    ),
  },
  {
    q: 'I forgot my password / want to change it — what do I do?',
    a: (
      <p>
        Not logged in: use "Forgot password?" on the login page — a reset link is emailed to you. Already
        logged in: use the <strong>Settings</strong> page to change your password directly.
      </p>
    ),
  },
];

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">Guide</h1>
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">How the habit tracker's features work.</p>

      <div className="space-y-3">
        {SECTIONS.map((s) => (
          <div key={s.q} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <p className="font-medium text-gray-900 dark:text-gray-100">{s.q}</p>
            <div className="mt-1.5 space-y-1.5 text-sm text-gray-700 dark:text-gray-300">{s.a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
