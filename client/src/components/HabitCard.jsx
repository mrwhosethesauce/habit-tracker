import { Link } from 'react-router-dom';

export default function HabitCard({ habit, onToggle, onDelete, toggling }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
      <div className="min-w-0">
        <Link to={`/habits/${habit._id}`} className="font-medium text-gray-900 hover:underline">
          {habit.name}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span className="rounded-full bg-gray-100 px-2 py-0.5 capitalize">{habit.frequency}</span>
          {habit.category && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5">{habit.category}</span>
          )}
          <span>
            🔥 {habit.currentStreak} {habit.currentStreak === 1 ? 'day' : 'days'} streak
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
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
