import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Heatmap from './Heatmap';
import { habitColor } from '../lib/habitColor';
import { describeFrequency } from '../lib/habitSchedule';

const OVERVIEW_DAYS = 90;

// Stacked per-habit heatmaps, all aligned to the same date range and each
// colored with that habit's own color — lets you see every habit's
// activity at once and compare them, rather than opening one at a time.
export default function HabitsOverview({ habits }) {
  const [checkInsByHabit, setCheckInsByHabit] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all(habits.map((h) => api.get(`/habits/${h._id}/stats`)))
      .then((responses) => {
        if (cancelled) return;
        const map = {};
        responses.forEach((res, i) => {
          map[habits[i]._id] = res.data.checkInDates;
        });
        setCheckInsByHabit(map);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error || 'Failed to load activity');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits.map((h) => h._id).join(',')]);

  if (loading) {
    return <p className="text-sm text-gray-600">Loading…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-600">Last {OVERVIEW_DAYS} days, all habits</p>
      {habits.map((habit) => {
        const color = habitColor(habit._id);
        return (
          <div key={habit._id} className="flex items-start gap-3 border-t border-gray-100 pt-4 first:border-t-0 first:pt-0">
            <div className="w-36 shrink-0">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
                <Link to={`/habits/${habit._id}`} className="truncate text-sm font-medium text-gray-900 hover:underline">
                  {habit.name}
                </Link>
              </div>
              <p className="mt-0.5 pl-[1.125rem] text-xs text-gray-600">{describeFrequency(habit)}</p>
            </div>
            <div className="min-w-0 flex-1 overflow-x-auto">
              <Heatmap
                checkInDates={checkInsByHabit[habit._id] || []}
                color={color}
                days={OVERVIEW_DAYS}
                showWeekdayLabels={false}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
