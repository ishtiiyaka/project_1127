import type { DayEntry } from '../../types';

interface Props {
  goalId?: string;
  entries: DayEntry[];
  startDate?: string;
}

export default function Heatmap90({ entries }: Props) {
  const cells: { date: string; value: number }[] = [];
  const today = new Date();

  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const entry = entries.find(e => e.date === date);
    cells.push({
      date,
      value: entry ? (entry.isAutoFilled ? 0.3 : 1) : 0,
    });
  }

  return (
    <div className="flex flex-wrap gap-0.5" style={{ maxWidth: '100%' }}>
      {cells.map(cell => (
        <div
          key={cell.date}
          title={cell.date}
          style={{
            width: 7, height: 7,
            borderRadius: 1,
            backgroundColor:
              cell.value === 1 ? 'var(--accent)' :
              cell.value === 0.3 ? 'var(--accent-dim)' :
              'var(--border)',
            opacity: cell.value === 0 ? 0.5 : 1,
          }}
        />
      ))}
    </div>
  );
}
