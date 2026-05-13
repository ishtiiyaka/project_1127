import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { today, getStreakLength } from '../../lib/dateUtils';
import type { Goal } from '../../types';
import EntryModal from '../entry/EntryModal';
import Heatmap90 from '../shared/Heatmap90';

interface Props { goal: Goal }

export default function GoalCard({ goal }: Props) {
  const [showModal, setShowModal] = useState(false);
  const { entries, settings } = useAppStore();
  const todayStr = today();

  const goalEntries = entries.filter(e => e.goalId === goal.id);
  const todayEntry = goalEntries.find(e => e.date === todayStr);
  const realDates = new Set(goalEntries.filter(e => !e.isAutoFilled).map(e => e.date));
  const streak = settings ? getStreakLength(realDates, settings.startDate) : 0;

  const elapsed = settings
    ? Math.max(Math.floor((new Date(todayStr).getTime() - new Date(settings.startDate).getTime()) / 86400000), 1)
    : 1;
  const completionRate = Math.round((realDates.size / elapsed) * 100);
  const isLocked = todayEntry?.sealed;

  const priorityColors: Record<string, string> = {
    critical: 'var(--critical)', high: 'var(--high)',
    medium: 'var(--medium)', low: 'var(--low)',
  };

  return (
    <>
      <div className="card p-4 space-y-3" style={{ borderLeft: `2px solid ${priorityColors[goal.priority]}` }}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-mono text-sm text-text truncate">{goal.name}</div>
          </div>
          <span className={`text-xs font-mono border px-1.5 py-0.5 shrink-0 priority-${goal.priority}`}>
            {goal.priority.toUpperCase()}
          </span>
        </div>

        {/* Today's entry preview */}
        <div className="font-mono text-xs border-l border-border pl-2">
          {todayEntry ? (
            <span className={todayEntry.isAutoFilled ? 'text-muted' : 'text-text'}>
              {todayEntry.content.length > 80 ? todayEntry.content.slice(0, 80) + '…' : todayEntry.content}
            </span>
          ) : (
            <span className="text-muted italic">— not yet logged —</span>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1">
            <span className="text-muted">STREAK</span>
            <span className="text-accent font-bold">{streak}</span>
          </div>
          <div className="flex-1">
            <div className="flex justify-between mb-0.5">
              <span className="text-muted">COMPLETION</span>
              <span className="text-accent">{completionRate}%</span>
            </div>
            <div className="h-1 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Heatmap */}
        {settings && (
          <Heatmap90 goalId={goal.id} entries={goalEntries} startDate={settings.startDate} />
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            className={`btn-primary flex-1 py-2 text-xs ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}`}
            disabled={!!isLocked}
            onClick={() => !isLocked && setShowModal(true)}
          >
            {isLocked ? '✓ SEALED' : 'LOG TODAY'}
          </button>
          <Link
            to={`/entry/${goal.id}`}
            className="btn-ghost flex-1 py-2 text-xs text-center"
          >
            VIEW HISTORY
          </Link>
        </div>
      </div>

      {showModal && (
        <EntryModal goal={goal} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
