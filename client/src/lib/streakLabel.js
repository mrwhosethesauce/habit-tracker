// 'weekly' habits accrue streaks in weeks, 'daily' (and any other/legacy
// value) in days — matches the unit calculateStreaks() itself counts in.
export function streakUnitLabel(count, frequency) {
  const unit = frequency === 'weekly' ? 'week' : 'day';
  return count === 1 ? unit : `${unit}s`;
}
