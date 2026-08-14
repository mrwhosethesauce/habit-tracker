import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import Heatmap from '../components/Heatmap';
import { streakUnitLabel } from '../lib/streakLabel';
import { describeFrequency } from '../lib/habitSchedule';

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
    return <div className="mx-auto max-w-4xl px-4 py-8 text-sm text-gray-500">Loading…</div>;
  }

  if (error && !stats) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-sm text-red-600">{error}</p>
        <Link to="/" className="mt-4 inline-block text-sm text-gray-600 hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const { habit } = stats;
  const isCountBased = habit.targetCount > 1;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/" className="text-sm text-gray-500 hover:underline">
        ← Back to dashboard
      </Link>

      <div className="mt-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{habit.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="rounded-full bg-gray-100 px-2 py-0.5">{describeFrequency(habit)}</span>
            {habit.category && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5">{habit.category}</span>
            )}
          </div>
        </div>

        {isCountBased ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleAdjustCount('decrement')}
              disabled={toggling || stats.todayCount === 0}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              aria-label="Decrease"
            >
              −
            </button>
            <span
              className={`min-w-[4rem] text-center text-sm font-medium ${
                stats.todayCheckedIn ? 'text-green-700' : 'text-gray-700'
              }`}
            >
              {stats.todayCount} / {habit.targetCount}
            </span>
            <button
              onClick={() => handleAdjustCount('increment')}
              disabled={toggling}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
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
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {stats.todayCheckedIn ? 'Done today' : 'Mark done'}
          </button>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Current streak</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {stats.currentStreak} <span className="text-sm font-normal text-gray-500">
              {streakUnitLabel(stats.currentStreak, habit.frequency)}
            </span>
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Longest streak</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {stats.longestStreak} <span className="text-sm font-normal text-gray-500">
              {streakUnitLabel(stats.longestStreak, habit.frequency)}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
        <p className="mb-3 text-sm font-medium text-gray-700">Activity</p>
        <Heatmap checkInDates={stats.checkInDates} />
      </div>
    </div>
  );
}
