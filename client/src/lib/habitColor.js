// Fixed categorical palette (validated for colorblind-safe adjacent
// contrast) — assigned in this exact order, never reshuffled per render.
// See the dataviz skill's reference palette; values are the light-mode
// steps, used here as fills/dots (marks), never as text color.
export const HABIT_PALETTE = [
  '#2a78d6', // blue
  '#eb6834', // orange
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#e87ba4', // magenta
  '#008300', // green
  '#4a3aa7', // violet
  '#e34948', // red
];

// A habit's color is derived from its own (immutable) id, not its
// position in whatever list happens to be rendering it — so a habit's
// color stays the same across reloads and regardless of other habits
// being added or deleted. Repeats only past 8 habits.
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function habitColor(habitId) {
  const idx = hashString(String(habitId)) % HABIT_PALETTE.length;
  return HABIT_PALETTE[idx];
}
