import { useEffect, useState } from 'react';
import api from '../api/client';
import HabitCard from '../components/HabitCard';

const FREQUENCIES = ['daily', 'weekly'];

export default function DashboardPage() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const loadHabits = async () => {
    try {
      const { data } = await api.get('/habits');
      setHabits(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load habits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHabits();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setCreating(true);
    try {
      await api.post('/habits', { name, category, frequency });
      setName('');
      setCategory('');
      setFrequency('daily');
      setShowForm(false);
      await loadHabits();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create habit');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (habit) => {
    setTogglingId(habit._id);
    try {
      if (habit.todayCheckedIn) {
        await api.delete('/checkins', { params: { habitId: habit._id } });
      } else {
        await api.post('/checkins', { habitId: habit._id });
      }
      await loadHabits();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update check-in');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (habit) => {
    if (!window.confirm(`Delete "${habit.name}"? This also removes its check-in history.`)) return;
    try {
      await api.delete(`/habits/${habit._id}`);
      await loadHabits();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete habit');
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Your habits</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          {showForm ? 'Cancel' : '+ Add habit'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 space-y-3 rounded-lg border border-gray-200 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                placeholder="Drink water"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Category (optional)</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                placeholder="Health"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              >
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {creating ? 'Creating…' : 'Create habit'}
          </button>
        </form>
      )}

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : habits.length === 0 ? (
        <p className="text-sm text-gray-500">No habits yet — add your first one above.</p>
      ) : (
        <div className="space-y-3">
          {habits.map((habit) => (
            <HabitCard
              key={habit._id}
              habit={habit}
              onToggle={handleToggle}
              onDelete={handleDelete}
              toggling={togglingId === habit._id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
