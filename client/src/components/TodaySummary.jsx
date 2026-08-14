// Quick-glance strip above the habit list — everything here is derived
// from the already-loaded habits array, no extra requests.
export default function TodaySummary({ habits }) {
  const doneToday = habits.filter((h) => h.todayCheckedIn).length;
  const activeStreaks = habits.filter((h) => h.currentStreak > 0).length;
  const pct = habits.length ? Math.round((doneToday / habits.length) * 100) : 0;

  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {doneToday} of {habits.length} done today
        </span>
        <span className="text-gray-600 dark:text-gray-400">
          🔥 {activeStreaks} active {activeStreaks === 1 ? 'streak' : 'streaks'}
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
