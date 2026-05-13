import type { DayEntry } from '../../types';

interface Props {
  goalId?: string;
  entries: DayEntry[];
  startDate: string;
}

export default function HeatmapFull({ entries, startDate }: Props) {
  const cells: { date: string; value: number; isFuture: boolean }[] = [];
  const start = new Date(startDate + 'T00:00:00');
  const today = new Date();

  for (let i = 0; i < 1127; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const isFuture = d > today;
    const entry = entries.find(e => e.date === date);
    cells.push({
      date,
      value: entry ? (entry.isAutoFilled ? 0.3 : 1) : 0,
      isFuture,
    });
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex flex-wrap gap-0.5" style={{ minWidth: 200 }}>
        {cells.map(cell => (
          <div
            key={cell.date}
            title={cell.date}
            style={{
              width: 6, height: 6,
              borderRadius: 1,
              backgroundColor: cell.isFuture
                ? 'transparent'
                : cell.value === 1
                  ? 'var(--accent)'
                  : cell.value === 0.3
                    ? 'var(--accent-dim)'
                    : 'var(--border)',
              border: cell.isFuture ? '1px solid var(--border)' : 'none',
              opacity: cell.isFuture ? 0.2 : 1,
            }}
          />
        ))}
      </div>
    </div>
  );
}
