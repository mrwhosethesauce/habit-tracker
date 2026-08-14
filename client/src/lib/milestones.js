// Tiers are generic counts, not specifically "days" — a weekly habit's
// streak counts weeks, so a tier of 7 there means 7 consecutive weeks, not
// 7 days. That's intentional: the tiers mark "consistency for a while,"
// "a long while," and "exceptional," in whatever unit the habit uses.
const TIERS = [
  { min: 100, icon: '👑', label: '100+ streak' },
  { min: 30, icon: '🏆', label: '30+ streak' },
  { min: 7, icon: '🔥', label: '7+ streak' },
];

export function milestoneFor(streak) {
  return TIERS.find((t) => streak >= t.min) || null;
}
