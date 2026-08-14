import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import Heatmap from '../components/Heatmap';
import { streakUnitLabel } from '../lib/streakLabel';
import { describeFrequency } from '../lib/habitSchedule';
import { habitColor } from '../lib/habitColor';
import { milestoneFor } from '../lib/milestones';

export default function HabitDetailPage() {
  const { id } = useParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState(false);

  const loadStats = async () => {
    try {
      const { data } = await api.get(`/habits/${id}/stats`);
      setStats(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load habit');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleToggle = async () => {
    setToggling(true);
    try {
      if (stats.todayCheckedIn) {
        await api.delete('/checkins', { params: { habitId: id } });
      } else {
        await api.post('/checkins', { habitId: id });
      }
      await loadStats();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update check-in');
    } finally {
      setToggling(false);
    }
  };

  const handleAdjustCount = async (mode) => {
    setToggling(true);
    try {
      if (mode === 'increment') {
        await api.post('/checkins', { habitId: id });
      } else {
        await api.delete('/checkins', { params: { habitId: id } });
      }
      await loadStats();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update check-in');
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-8 text-sm text-gray-600 dark:text-gray-400">Loading…</div>;
  }

  if (error && !stats) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <Link to="/" className="mt-4 inline-block text-sm text-gray-700 hover:underline dark:text-gray-300">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const { habit } = stats;
  const isCountBased = habit.targetCount > 1;
  const color = habitColor(habit._id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/" className="text-sm text-gray-700 hover:underline dark:text-gray-300">
        ← Back to dashboard
      </Link>

      <div className="mt-2 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{habit.name}</h1>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 pl-[1.375rem] text-xs text-gray-600 dark:text-gray-400">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 dark:bg-gray-700">{describeFrequency(habit)}</span>
            {habit.category && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 dark:bg-gray-700">{habit.category}</span>
            )}
          </div>
        </div>

        {isCountBased ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleAdjustCount('decrement')}
              disabled={toggling || stats.todayCount === 0}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              aria-label="Decrease"
            >
              −
            </button>
            <span
              className={`min-w-[4rem] text-center text-sm font-semibold ${
                stats.todayCheckedIn ? 'text-green-700 dark:text-green-400' : 'text-gray-800 dark:text-gray-200'
              }`}
            >
              {stats.todayCount} / {habit.targetCount}
            </span>
            <button
              onClick={() => handleAdjustCount('increment')}
              disabled={toggling}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              aria-label="Increase"
            >
              +
            </button>
          </div>
        ) : (
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`rounded-md px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
              stats.todayCheckedIn
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'border border-gray-300 text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {stats.todayCheckedIn ? 'Done today' : 'Mark done'}
          </button>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">Current streak</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {milestoneFor(stats.currentStreak) && (
              <span title={milestoneFor(stats.currentStreak).label}>{milestoneFor(stats.currentStreak).icon} </span>
            )}
            {stats.currentStreak} <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
              {streakUnitLabel(stats.currentStreak, habit.frequency)}
            </span>
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">Longest streak</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {milestoneFor(stats.longestStreak) && (
              <span title={milestoneFor(stats.longestStreak).label}>{milestoneFor(stats.longestStreak).icon} </span>
            )}
            {stats.longestStreak} <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
              {streakUnitLabel(stats.longestStreak, habit.frequency)}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <p className="mb-3 text-sm font-medium text-gray-800 dark:text-gray-200">Activity</p>
        <Heatmap checkInDates={stats.checkInDates} color={color} />
      </div>
    </div>
  );
}
