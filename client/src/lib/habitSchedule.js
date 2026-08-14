export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// One-line human description of a habit's schedule, used on the dashboard
// card and detail page instead of just the raw frequency value.
export function describeFrequency(habit) {
  if (habit.frequency === 'weekly') {
    const n = habit.timesPerWeek || 1;
    return n === 1 ? 'Weekly' : `${n}x per week`;
  }
  if (habit.frequency === 'days_of_week') {
    const days = (habit.daysOfWeek || []).slice().sort((a, b) => a - b);
    return days.map((d) => WEEKDAY_LABELS[d]).join('/') || 'Specific days';
  }
  return 'Daily';
}
