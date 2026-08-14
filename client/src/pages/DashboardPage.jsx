import { useEffect, useState } from 'react';
import api from '../api/client';
import HabitCard from '../components/HabitCard';
import HabitForm from '../components/HabitForm';

export default function DashboardPage() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  // null = form hidden. 'new' = create mode. A habit object = edit mode
  // for that habit.
  const [formTarget, setFormTarget] = useState(null);
  const [saving, setSaving] = useState(false);
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

  const closeForm = () => {
    setFormTarget(null);
    setFormError('');
  };

  const handleSave = async (values) => {
    setFormError('');
    setSaving(true);
    try {
      if (formTarget && formTarget !== 'new') {
        await api.put(`/habits/${formTarget._id}`, values);
      } else {
        await api.post('/habits', values);
      }
      closeForm();
      await loadHabits();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save habit');
    } finally {
      setSaving(false);
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

  // For a count-based habit, "toggle" isn't binary — mode picks +1 or -1.
  const handleAdjustCount = async (habit, mode) => {
    setTogglingId(habit._id);
    try {
      if (mode === 'increment') {
        await api.post('/checkins', { habitId: habit._id });
      } else {
        await api.delete('/checkins', { params: { habitId: habit._id } });
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

  const showForm = formTarget !== null;
  const editingHabit = formTarget && formTarget !== 'new' ? formTarget : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Your habits</h1>
        <button
          onClick={() => (showForm ? closeForm() : setFormTarget('new'))}
          className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          {showForm ? 'Cancel' : '+ Add habit'}
        </button>
      </div>

      {showForm && (
        <HabitForm
          key={editingHabit?._id ?? 'new'}
          onSubmit={handleSave}
          onCancel={closeForm}
          submitting={saving}
          error={formError}
          initialHabit={editingHabit}
        />
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
              onAdjustCount={handleAdjustCount}
              onEdit={setFormTarget}
              onDelete={handleDelete}
              toggling={togglingId === habit._id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
