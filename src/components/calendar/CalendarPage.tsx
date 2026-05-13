import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function CalendarPage() {
  const { entries, goals, dailyLogs, settings } = useAppStore();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  if (!settings) return null;

  // Build calendar grid
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // Mon=0
  const daysInMonth = lastDay.getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function fmt(d: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  function getDayColor(date: string): string {
    const dayEntries = entries.filter(e => e.date === date);
    const real = dayEntries.filter(e => !e.isAutoFilled);
    if (real.length === 0 && dayEntries.length === 0) return 'transparent';
    if (real.length === 0) return 'var(--accent-dim)'; // all auto-filled
    const rate = real.length / goals.length;
    if (rate >= 1) return 'var(--accent)';
    if (rate >= 0.6) return 'color-mix(in srgb, var(--accent) 70%, transparent)';
    if (rate >= 0.3) return 'color-mix(in srgb, var(--accent) 40%, transparent)';
    return 'color-mix(in srgb, var(--accent) 20%, transparent)';
  }

  function getDayInfo(date: string) {
    const dayEntries = entries.filter(e => e.date === date && !e.isAutoFilled);
    const log = dailyLogs.find(l => l.date === date);
    return { dayEntries, log };
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  }

  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const selectedInfo = selectedDate ? getDayInfo(selectedDate) : null;
  const MOOD_EMOJIS: Record<number, string> = { 1:'😞', 2:'😕', 3:'😐', 4:'🙂', 5:'😄' };

  // Month stats
  const monthDates = Array.from({ length: daysInMonth }, (_, i) => fmt(i + 1));
  const monthReal = entries.filter(e => monthDates.includes(e.date) && !e.isAutoFilled);
  const perfectDays = monthDates.filter(d => {
    const r = entries.filter(e => e.date === d && !e.isAutoFilled);
    return r.length === goals.length && goals.length > 0;
  }).length;

  return (
    <div className="min-h-screen bg-black page-enter pb-8">
      <div className="sticky top-0 bg-black border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/" className="font-mono text-xs text-muted hover:text-accent">← BACK</Link>
        <div className="font-display text-accent text-sm tracking-widest">CALENDAR</div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">

        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <button className="btn-ghost px-4 py-2" onClick={prevMonth}>←</button>
          <div className="font-display text-accent text-base tracking-widest">
            {MONTH_NAMES[month]} {year}
          </div>
          <button className="btn-ghost px-4 py-2" onClick={nextMonth}>→</button>
        </div>

        {/* Month stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="card p-2 text-center">
            <div className="font-display text-accent text-lg font-bold">{monthReal.length}</div>
            <div className="font-mono text-xs text-muted">ENTRIES</div>
          </div>
          <div className="card p-2 text-center">
            <div className="font-display text-accent text-lg font-bold">{perfectDays}</div>
            <div className="font-mono text-xs text-muted">PERFECT DAYS</div>
          </div>
          <div className="card p-2 text-center">
            <div className="font-display text-accent text-lg font-bold">
              {daysInMonth > 0 ? Math.round((perfectDays / daysInMonth) * 100) : 0}%
            </div>
            <div className="font-mono text-xs text-muted">FILL RATE</div>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="card p-3">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center font-mono text-xs text-muted py-1">{d}</div>
            ))}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) => {
              if (!day) return <div key={idx} />;
              const date = fmt(day);
              const color = getDayColor(date);
              const isToday = date === todayStr;
              const isSelected = date === selectedDate;
              const isFuture = date > todayStr;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(isSelected ? null : date)}
                  disabled={isFuture}
                  className="relative flex items-center justify-center rounded transition-all"
                  style={{
                    aspectRatio: '1',
                    backgroundColor: color,
                    border: isSelected ? '1.5px solid var(--accent)' : isToday ? '1.5px solid var(--accent-dim)' : '1px solid transparent',
                    opacity: isFuture ? 0.2 : 1,
                  }}
                >
                  <span className="font-mono text-xs" style={{
                    color: color === 'transparent' ? 'var(--text-muted)' : 'var(--bg)',
                  }}>
                    {day}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-3 mt-3 justify-center font-mono text-xs text-muted">
            {[
              { color: 'var(--accent)', label: '100%' },
              { color: 'color-mix(in srgb, var(--accent) 70%, transparent)', label: '60%+' },
              { color: 'color-mix(in srgb, var(--accent) 40%, transparent)', label: '30%+' },
              { color: 'color-mix(in srgb, var(--accent) 20%, transparent)', label: '<30%' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
                <span>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected day detail */}
        {selectedDate && selectedInfo && (
          <div className="card p-4 space-y-3 sheet-enter">
            <div className="flex items-center justify-between">
              <div className="font-mono text-xs text-accent">{selectedDate}</div>
              {selectedInfo.log && (
                <span className="text-lg">{MOOD_EMOJIS[selectedInfo.log.mood]}</span>
              )}
            </div>

            {selectedInfo.dayEntries.length === 0 ? (
              <p className="font-mono text-xs text-muted italic">No entries for this day.</p>
            ) : (
              <div className="space-y-2">
                {selectedInfo.dayEntries.map(entry => {
                  const goal = goals.find(g => g.id === entry.goalId);
                  return (
                    <div key={entry.id} className="space-y-0.5">
                      <div className={`font-mono text-xs priority-${goal?.priority ?? 'low'}`}>{goal?.name}</div>
                      <p className="font-mono text-xs text-text leading-relaxed line-clamp-3">{entry.content}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedInfo.log?.reflection && (
              <div className="border-t border-border pt-2 space-y-1">
                <div className="font-mono text-xs text-muted">REFLECTION</div>
                <p className="font-mono text-xs text-text leading-relaxed line-clamp-3">{selectedInfo.log.reflection}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
