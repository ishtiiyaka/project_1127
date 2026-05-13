import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { today, uid } from '../../lib/dateUtils';
import type { Goal } from '../../types';

interface Props {
  goal: Goal;
  onClose: () => void;
}

export default function EntryModal({ goal, onClose }: Props) {
  const { addEntry, updateEntry, entries } = useAppStore();
  const todayStr = today();
  const existing = entries.find(e => e.goalId === goal.id && e.date === todayStr);

  const [content, setContent] = useState(existing?.content ?? '');
  const [sealing, setSealing] = useState(false);

  async function handleSeal() {
    if (!content.trim() || sealing) return;
    setSealing(true);
    const entry = {
      id: existing?.id ?? uid(),
      goalId: goal.id,
      date: todayStr,
      content: content.slice(0, 280),
      isAutoFilled: false,
      sealed: true,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    if (existing) await updateEntry(entry);
    else await addEntry(entry);
    onClose();
  }

  const priorityColors: Record<string, string> = {
    critical: 'var(--critical)', high: 'var(--high)',
    medium: 'var(--medium)', low: 'var(--low)',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4" onClick={onClose}>
      <div
        className="card w-full max-w-md p-5 space-y-4"
        style={{ borderTop: `2px solid ${priorityColors[goal.priority]}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display text-sm text-accent tracking-widest">LOG ENTRY</div>
            <div className="font-mono text-xs text-muted mt-0.5">{goal.name}</div>
          </div>
          <button className="font-mono text-muted hover:text-text text-lg" onClick={onClose}>✕</button>
        </div>

        {/* Warning */}
        <div className="font-mono text-xs text-muted border border-border p-2">
          ⚠ Entries are <span className="text-critical">sealed on submission</span> and cannot be edited.
        </div>

        {/* Text area */}
        <div>
          <textarea
            className="input resize-none text-sm leading-relaxed"
            rows={5}
            placeholder="What did you do today for this commitment?..."
            maxLength={280}
            value={content}
            onChange={e => setContent(e.target.value)}
            autoFocus
          />
          <div className="flex justify-between mt-1">
            <span className="font-mono text-xs text-muted">{content.length}/280</span>
            <span className="font-mono text-xs text-muted">{today()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button className="btn-ghost flex-1 py-2" onClick={onClose}>CANCEL</button>
          <button
            className="btn-primary flex-1 py-2 font-display tracking-widest"
            disabled={!content.trim() || sealing}
            onClick={handleSeal}
          >
            {sealing ? 'SEALING...' : 'SEAL ENTRY'}
          </button>
        </div>
      </div>
    </div>
  );
}
