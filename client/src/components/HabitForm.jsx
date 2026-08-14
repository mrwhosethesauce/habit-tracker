import { useState } from 'react';
import { WEEKDAY_LABELS } from '../lib/habitSchedule';

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'days_of_week', label: 'Specific days' },
];

const inputClass =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100';

// `initialHabit` switches this into edit mode: fields are pre-populated
// from it and the submit button reads "Save changes" instead of "Create
// habit". Passing nothing (the default) is create mode.
export default function HabitForm({ onSubmit, onCancel, submitting, error, initialHabit }) {
  const isEditing = !!initialHabit;

  const [name, setName] = useState(initialHabit?.name ?? '');
  const [category, setCategory] = useState(initialHabit?.category ?? '');
  const [frequency, setFrequency] = useState(initialHabit?.frequency ?? 'daily');
  const [timesPerWeek, setTimesPerWeek] = useState(initialHabit?.timesPerWeek ?? 1);
  const [daysOfWeek, setDaysOfWeek] = useState(initialHabit?.daysOfWeek ?? []);
  const [countBased, setCountBased] = useState((initialHabit?.targetCount ?? 1) > 1);
  const [targetCount, setTargetCount] = useState(
    (initialHabit?.targetCount ?? 1) > 1 ? initialHabit.targetCount : 2
  );
  const [localError, setLocalError] = useState('');

  const toggleDay = (d) => {
    setDaysOfWeek((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');
    if (frequency === 'days_of_week' && daysOfWeek.length === 0) {
      setLocalError('Pick at least one day');
      return;
    }
    onSubmit({
      name,
      category,
      frequency,
      timesPerWeek: frequency === 'weekly' ? timesPerWeek : undefined,
      daysOfWeek: frequency === 'days_of_week' ? daysOfWeek : undefined,
      targetCount: countBased ? targetCount : 1,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Drink water"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Category (optional)</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
            placeholder="Health"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Frequency</label>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className={inputClass}>
            {FREQUENCIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {frequency === 'weekly' && (
        <div className="max-w-[10rem]">
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Times per week</label>
          <input
            type="number"
            min={1}
            max={7}
            value={timesPerWeek}
            onChange={(e) => setTimesPerWeek(Number(e.target.value))}
            className={inputClass}
          />
        </div>
      )}

      {frequency === 'days_of_week' && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Which days</label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAY_LABELS.map((label, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => toggleDay(idx)}
                className={`rounded-md border px-3 py-1.5 text-sm transition ${
                  daysOfWeek.includes(idx)
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input type="checkbox" checked={countBased} onChange={(e) => setCountBased(e.target.checked)} />
          Track a number instead of just done/not done (e.g. glasses of water)
        </label>
        {countBased && (
          <div className="mt-2 max-w-[10rem]">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Target per day</label>
            <input
              type="number"
              min={2}
              value={targetCount}
              onChange={(e) => setTargetCount(Number(e.target.value))}
              className={inputClass}
            />
          </div>
        )}
      </div>

      {(localError || error) && <p className="text-sm text-red-600 dark:text-red-400">{localError || error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? 'Saving…' : isEditing ? 'Save changes' : 'Create habit'}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
