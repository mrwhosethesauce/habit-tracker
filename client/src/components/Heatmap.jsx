import { cloneElement, useEffect, useRef } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';

const EMPTY_FILL = '#ebedf0';

// GitHub-style contribution heatmap. `checkInDates` is the raw list of
// 'YYYY-MM-DD' UTC date strings from the stats endpoint. `color` fills the
// checked-in cells — pass a habit's own color (see lib/habitColor.js) so
// different habits are visually distinguishable at a glance, including
// when several of these are stacked together in the "all habits" overview.
// `days` controls the window shown (defaults to a full year).
export default function Heatmap({ checkInDates, color = '#16a34a', days = 365, showWeekdayLabels = true }) {
  const containerRef = useRef(null);

  // The library's <svg> only ever sets a `viewBox`, no width/height — left
  // alone, a block-level SVG with no intrinsic size stretches to fill its
  // container and scales everything inside it (cells, text) up to match.
  // That's fine for a wide card with a full year (many columns), but badly
  // wrong for a short window (e.g. 90 days) in the same wide container:
  // fewer columns means a smaller natural aspect ratio, so the stretch
  // factor — and the resulting cell/text size — balloons. Reading the
  // viewBox after render and pinning width/height to it directly renders
  // every heatmap on the page at the same natural scale, independent of
  // its container's width; a container narrower than that scrolls instead.
  useEffect(() => {
    const svg = containerRef.current?.querySelector('svg.react-calendar-heatmap');
    if (!svg) return;
    const viewBox = svg.getAttribute('viewBox');
    if (!viewBox) return;
    const parts = viewBox.split(' ').map(Number);
    const width = parts[2];
    const height = parts[3];
    if (width > 0 && height > 0) {
      svg.style.width = `${width}px`;
      svg.style.height = `${height}px`;
    }
  }, [checkInDates, days, showWeekdayLabels]);

  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));

  const values = checkInDates.map((date) => ({ date, count: 1 }));

  return (
    <div className="habit-heatmap" ref={containerRef}>
      <CalendarHeatmap
        startDate={start}
        endDate={today}
        values={values}
        classForValue={() => 'color-empty'}
        transformDayElement={(element, value) =>
          cloneElement(element, { style: { fill: value ? color : EMPTY_FILL } })
        }
        showWeekdayLabels={showWeekdayLabels}
        titleForValue={(value) => (value ? `${value.date} — done` : undefined)}
      />
    </div>
  );
}
