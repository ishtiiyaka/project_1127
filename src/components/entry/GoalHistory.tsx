import { useParams, Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import HeatmapFull from '../ghost/HeatmapFull';

export default function GoalHistory() {
  const { goalId } = useParams<{ goalId: string }>();
  const { goals, entries, settings } = useAppStore();

  const goal = goals.find(g => g.id === goalId);
  const goalEntries = entries
    .filter(e => e.goalId === goalId)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (!goal) return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="font-mono text-muted">Goal not found.</span>
    </div>
  );

  const realCount = goalEntries.filter(e => !e.isAutoFilled).length;
  const totalWords = goalEntries
    .filter(e => !e.isAutoFilled)
    .reduce((sum, e) => sum + e.content.trim().split(/\s+/).filter(Boolean).length, 0);

  return (
    <div className="min-h-screen bg-black page-enter pb-8">
      {/* Header */}
      <div className="sticky top-0 bg-black border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/" className="font-mono text-xs text-muted hover:text-accent">← BACK</Link>
        <div className="flex-1">
          <div className="font-display text-accent text-sm tracking-widest truncate">{goal.name}</div>
        </div>
        <span className={`text-xs font-mono border px-2 py-0.5 priority-${goal.priority}`}>
          {goal.priority.toUpperCase()}
        </span>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-3 text-center">
            <div className="font-display text-accent text-xl font-bold">{realCount}</div>
            <div className="font-mono text-xs text-muted">REAL ENTRIES</div>
          </div>
          <div className="card p-3 text-center">
            <div className="font-display text-accent text-xl font-bold">{totalWords}</div>
            <div className="font-mono text-xs text-muted">WORDS WRITTEN</div>
          </div>
        </div>

        {/* Full heatmap */}
        {settings && (
          <div className="card p-4 space-y-2">
            <div className="font-mono text-xs text-muted tracking-widest">FULL JOURNEY HEATMAP</div>
            <HeatmapFull goalId={goal.id} entries={goalEntries} startDate={settings.startDate} />
          </div>
        )}

        {/* Entry list */}
        <div className="space-y-2">
          <div className="font-mono text-xs text-muted tracking-widest">ALL ENTRIES</div>
          {goalEntries.map(entry => (
            <div key={entry.id} className={`card p-3 space-y-1 ${entry.isAutoFilled ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted">{entry.date}</span>
                <div className="flex gap-2">
                  {entry.isAutoFilled && (
                    <span className="font-mono text-xs text-muted border border-border px-1">AUTO</span>
                  )}
                  {entry.sealed && (
                    <span className="font-mono text-xs text-accent-dim border border-accent-dim px-1">SEALED</span>
                  )}
                </div>
              </div>
              <p className="font-mono text-sm text-text leading-relaxed">{entry.content}</p>
            </div>
          ))}
          {goalEntries.length === 0 && (
            <p className="font-mono text-xs text-muted text-center py-8">No entries yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
