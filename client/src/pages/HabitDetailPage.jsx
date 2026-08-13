import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import Heatmap from '../components/Heatmap';

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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/" className="text-sm text-gray-500 hover:underline">
        ← Back to dashboard
      </Link>

      <div className="mt-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{habit.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 capitalize">{habit.frequency}</span>
            {habit.category && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5">{habit.category}</span>
            )}
          </div>
        </div>
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
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Current streak</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {stats.currentStreak} <span className="text-sm font-normal text-gray-500">
              {habit.frequency === 'weekly' ? 'weeks' : 'days'}
            </span>
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Longest streak</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {stats.longestStreak} <span className="text-sm font-normal text-gray-500">
              {habit.frequency === 'weekly' ? 'weeks' : 'days'}
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
