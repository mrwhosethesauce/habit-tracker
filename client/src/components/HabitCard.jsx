import { Link } from 'react-router-dom';
import { streakUnitLabel } from '../lib/streakLabel';
import { describeFrequency } from '../lib/habitSchedule';

export default function HabitCard({ habit, onToggle, onAdjustCount, onDelete, toggling }) {
  const isCountBased = habit.targetCount > 1;

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
      <div className="min-w-0">
        <Link to={`/habits/${habit._id}`} className="font-medium text-gray-900 hover:underline">
          {habit.name}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span className="rounded-full bg-gray-100 px-2 py-0.5">{describeFrequency(habit)}</span>
          {habit.category && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5">{habit.category}</span>
          )}
          <span>
            🔥 {habit.currentStreak} {streakUnitLabel(habit.currentStreak, habit.frequency)} streak
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isCountBased ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAdjustCount(habit, 'decrement')}
              disabled={toggling || habit.todayCount === 0}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              aria-label="Decrease"
            >
              −
            </button>
            <span
              className={`min-w-[3.5rem] text-center text-sm font-medium ${
                habit.todayCheckedIn ? 'text-green-700' : 'text-gray-700'
              }`}
            >
              {habit.todayCount} / {habit.targetCount}
            </span>
            <button
              onClick={() => onAdjustCount(habit, 'increment')}
              disabled={toggling}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              aria-label="Increase"
            >
              +
            </button>
          </div>
        ) : (
          <button
            onClick={() => onToggle(habit)}
            disabled={toggling}
            aria-pressed={habit.todayCheckedIn}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${
              habit.todayCheckedIn
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {habit.todayCheckedIn ? 'Done today' : 'Mark done'}
          </button>
        )}
        <button
          onClick={() => onDelete(habit)}
          className="text-xs text-gray-400 hover:text-red-600"
          title="Delete habit"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
