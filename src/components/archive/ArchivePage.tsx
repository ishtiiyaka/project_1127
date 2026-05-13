import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import type { Priority } from '../../types'; // reviews used inline below

const MOOD_EMOJIS: Record<number, string> = { 1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' };

export default function ArchivePage() {
  const { goals, entries, dailyLogs, settings } = useAppStore();

  const [filterGoal, setFilterGoal] = useState<string>('all');
  const [filterMood, setFilterMood] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const startDate = settings?.startDate;
  if (!startDate) return null;

  // All unique dates that have at least one entry
  const allDates = useMemo(() => {
    const dates = new Set(entries.map(e => e.date));
    dailyLogs.forEach(l => dates.add(l.date));
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  }, [entries, dailyLogs]);

  // Filter dates
  const filteredDates = useMemo(() => {
    return allDates.filter(date => {
      const dayEntries = entries.filter(e => e.date === date);

      if (filterGoal !== 'all' && !dayEntries.some(e => e.goalId === filterGoal)) return false;

      if (filterPriority !== 'all') {
        const goalIds = goals.filter(g => g.priority === filterPriority).map(g => g.id);
        if (!dayEntries.some(e => goalIds.includes(e.goalId))) return false;
      }

      const log = dailyLogs.find(l => l.date === date);
      if (filterMood !== 'all' && (!log || String(log.mood) !== filterMood)) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const entryMatch = dayEntries.some(e => e.content.toLowerCase().includes(q));
        const logMatch = log?.reflection.toLowerCase().includes(q) ?? false;
        if (!entryMatch && !logMatch) return false;
      }

      return true;
    });
  }, [allDates, entries, dailyLogs, goals, filterGoal, filterMood, filterPriority, search]);

  function toggleDate(date: string) {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-black page-enter pb-8">
      <div className="sticky top-0 bg-black border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/" className="font-mono text-xs text-muted hover:text-accent">← BACK</Link>
        <div className="font-display text-accent text-sm tracking-widest">THE ARCHIVE</div>
      </div>

      {/* Filters */}
      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-3">
        <input
          className="input text-xs w-full"
          placeholder="Search entries..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          <select className="input text-xs w-auto" value={filterGoal} onChange={e => setFilterGoal(e.target.value)}>
            <option value="all">ALL GOALS</option>
            {goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select className="input text-xs w-auto" value={filterMood} onChange={e => setFilterMood(e.target.value)}>
            <option value="all">ALL MOODS</option>
            {[1,2,3,4,5].map(m => <option key={m} value={m}>{MOOD_EMOJIS[m]} {m}</option>)}
          </select>
          <select className="input text-xs w-auto" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="all">ALL PRIORITIES</option>
            {(['critical','high','medium','low'] as Priority[]).map(p => (
              <option key={p} value={p}>{p.toUpperCase()}</option>
            ))}
          </select>
        </div>

        <div className="font-mono text-xs text-muted">{filteredDates.length} DAYS</div>

        {/* Day list */}
        <div className="space-y-2">
          {filteredDates.map(date => {
            const dayEntries = entries.filter(e => e.date === date);
            const log = dailyLogs.find(l => l.date === date);
            const isExpanded = expandedDates.has(date);
            const realCount = dayEntries.filter(e => !e.isAutoFilled).length;

            return (
              <div key={date} className="card">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                  onClick={() => toggleDate(date)}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted">{date}</span>
                    {log && <span className="text-base">{MOOD_EMOJIS[log.mood]}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-accent">{realCount}/{goals.length}</span>
                    <span className="font-mono text-xs text-muted">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                    {dayEntries.map(entry => {
                      const goal = goals.find(g => g.id === entry.goalId);
                      return (
                        <div key={entry.id} className={`space-y-1 ${entry.isAutoFilled ? 'opacity-50' : ''}`}>
                          <div className="flex items-center gap-2">
                            <span className={`font-mono text-xs priority-${goal?.priority ?? 'low'}`}>
                              {goal?.name ?? 'Unknown'}
                            </span>
                            {entry.isAutoFilled && (
                              <span className="font-mono text-xs text-muted border border-border px-1">AUTO</span>
                            )}
                          </div>
                          <p className="font-mono text-xs text-text leading-relaxed">{entry.content}</p>
                        </div>
                      );
                    })}
                    {log && (
                      <div className="border-t border-border pt-3 space-y-1">
                        <div className="font-mono text-xs text-muted">REFLECTION {MOOD_EMOJIS[log.mood]}</div>
                        <p className="font-mono text-xs text-text leading-relaxed">{log.reflection}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {filteredDates.length === 0 && (
            <p className="font-mono text-xs text-muted text-center py-12">No entries match your filters.</p>
          )}
        </div>
      </div>
    </div>
  );
}
