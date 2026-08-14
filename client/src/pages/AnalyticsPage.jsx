import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import api from '../api/client';
import { habitColor } from '../lib/habitColor';
import { useTheme } from '../context/ThemeContext';

// Validated light- and dark-mode tokens from the dataviz skill's reference
// palette. Recharts styling is applied via inline JS props (not CSS classes),
// so dark mode needs its own explicit token set rather than an automatic flip.
const LIGHT_COLORS = {
  series: '#2a78d6', // categorical slot 1 / sequential blue
  grid: '#e1e0d9', // hairline gridline
  axis: '#898781', // muted axis/label ink
  ink: '#52514e', // secondary ink
};

const DARK_COLORS = {
  series: '#5b9bd8', // lightened for contrast against dark surface
  grid: '#374151', // gray-700 hairline gridline
  axis: '#9ca3af', // gray-400 muted axis/label ink
  ink: '#d1d5db', // gray-300 secondary ink
};

const RANGES = [30, 90];

function formatTick(dateStr) {
  const [, m, d] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}`;
}

function CompletionTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;
  if (point.rate === null) {
    return (
      <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <p className="font-medium text-gray-900 dark:text-gray-100">{formatTick(label)}</p>
        <p className="text-gray-600 dark:text-gray-400">No daily habits yet</p>
      </div>
    );
  }
  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <p className="font-medium text-gray-900 dark:text-gray-100">{formatTick(label)}</p>
      <p className="text-gray-600 dark:text-gray-400">
        {point.rate}% &middot; {point.completed}/{point.total} habits
      </p>
    </div>
  );
}

function CompletionChart({ series, colors }) {
  if (series.every((p) => p.rate === null)) {
    return <p className="text-sm text-gray-600 dark:text-gray-400">No daily habits to chart yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={series} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={colors.grid} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={formatTick}
          tick={{ fill: colors.axis, fontSize: 11 }}
          axisLine={{ stroke: colors.grid }}
          tickLine={false}
          minTickGap={32}
        />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fill: colors.axis, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={44}
        />
        <Tooltip content={<CompletionTooltip />} />
        <Line
          type="monotone"
          dataKey="rate"
          stroke={colors.series}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
          connectNulls={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function Leaderboard({ entries }) {
  if (entries.length === 0) {
    return <p className="text-sm text-gray-600 dark:text-gray-400">No habits yet.</p>;
  }
  const max = Math.max(1, ...entries.map((e) => e.longestStreak));
  return (
    <div className="space-y-3">
      {entries.map((entry, i) => {
        const color = habitColor(entry.habitId);
        return (
          <Link
            key={entry.habitId}
            to={`/habits/${entry.habitId}`}
            className="block rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <div className="flex items-center gap-3 px-1 py-1.5">
              <span className="w-5 shrink-0 text-right text-sm font-medium text-gray-600 dark:text-gray-400">{i + 1}</span>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{entry.name}</span>
                  <span className="shrink-0 text-xs text-gray-600 dark:text-gray-400">
                    {entry.longestStreak} {entry.frequency === 'weekly' ? 'wk' : 'day'} best
                    {entry.currentStreak > 0 && (
                      <span className="ml-2 text-gray-600 dark:text-gray-400">· {entry.currentStreak} current</span>
                    )}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(entry.longestStreak / max) * 100}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
  const [days, setDays] = useState(30);
  const [series, setSeries] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.get('/analytics/completion', { params: { days } }),
      api.get('/analytics/leaderboard'),
    ])
      .then(([completionRes, leaderboardRes]) => {
        if (cancelled) return;
        setSeries(completionRes.data.series);
        setLeaderboard(leaderboardRes.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error || 'Failed to load analytics');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">Analytics</h1>

      {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Daily habit completion rate</p>
          <div className="flex rounded-md border border-gray-200 p-0.5 dark:border-gray-700">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setDays(r)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                  days === r ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {r} days
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading…</p>
        ) : (
          <CompletionChart series={series} colors={colors} />
        )}
      </div>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Longest-streak leaderboard</p>
        {loading ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading…</p>
        ) : (
          <Leaderboard entries={leaderboard} />
        )}
      </div>
    </div>
  );
}
