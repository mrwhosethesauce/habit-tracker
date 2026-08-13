import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';

// GitHub-style contribution heatmap for the last 12 months. `checkInDates`
// is the raw list of 'YYYY-MM-DD' UTC date strings from the stats endpoint.
export default function Heatmap({ checkInDates }) {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 364);

  const values = checkInDates.map((date) => ({ date, count: 1 }));

  return (
    <div className="habit-heatmap">
      <CalendarHeatmap
        startDate={start}
        endDate={today}
        values={values}
        classForValue={(value) => (!value ? 'color-empty' : 'color-filled')}
        showWeekdayLabels
        titleForValue={(value) => (value ? `${value.date} — done` : undefined)}
      />
    </div>
  );
}
