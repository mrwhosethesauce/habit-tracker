import { useState } from 'react';
import { WEEKDAY_LABELS } from '../lib/habitSchedule';

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'days_of_week', label: 'Specific days' },
];

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none';

export default function HabitForm({ onSubmit, submitting, error }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [timesPerWeek, setTimesPerWeek] = useState(1);
  const [daysOfWeek, setDaysOfWeek] = useState([]);
  const [countBased, setCountBased] = useState(false);
  const [targetCount, setTargetCount] = useState(2);
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
    <form onSubmit={handleSubmit} className="mb-6 space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Drink water"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Category (optional)</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
            placeholder="Health"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Frequency</label>
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
          <label className="mb-1 block text-sm font-medium text-gray-700">Times per week</label>
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
          <label className="mb-1 block text-sm font-medium text-gray-700">Which days</label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAY_LABELS.map((label, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => toggleDay(idx)}
                className={`rounded-md border px-3 py-1.5 text-sm transition ${
                  daysOfWeek.includes(idx)
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={countBased} onChange={(e) => setCountBased(e.target.checked)} />
          Track a number instead of just done/not done (e.g. glasses of water)
        </label>
        {countBased && (
          <div className="mt-2 max-w-[10rem]">
            <label className="mb-1 block text-sm font-medium text-gray-700">Target per day</label>
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

      {(localError || error) && <p className="text-sm text-red-600">{localError || error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {submitting ? 'Creating…' : 'Create habit'}
      </button>
    </form>
  );
}
