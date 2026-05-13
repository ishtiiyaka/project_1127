import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { today, uid } from '../../lib/dateUtils';
import type { Goal } from '../../types';
import { playEntrySealed } from '../../lib/sounds';

interface Props {
  goal: Goal;
  onClose: () => void;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function EntryModal({ goal, onClose }: Props) {
  const { addEntry, updateEntry, entries, addXP } = useAppStore();
  const todayStr = today();
  const existing = entries.find(e => e.goalId === goal.id && e.date === todayStr);

  const [content, setContent] = useState(existing?.content ?? '');
  const [sealing, setSealing] = useState(false);

  const words = wordCount(content);
  const chars = content.length;

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
      wordCount: words,
    };
    if (existing) await updateEntry(entry);
    else {
      await addEntry(entry);
      await addXP(10); // +10 XP per real entry
    }
    playEntrySealed();
    onClose();
  }

  const priorityColors: Record<string, string> = {
    critical: 'var(--critical)', high: 'var(--high)',
    medium: 'var(--medium)', low: 'var(--low)',
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-end justify-center"
      onClick={onClose}
    >
      {/* Bottom sheet */}
      <div
        className="card w-full max-w-lg sheet-enter"
        style={{
          borderTop: `2px solid ${priorityColors[goal.priority]}`,
          paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag indicator */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display text-sm tracking-widest" style={{ color: priorityColors[goal.priority] }}>
                LOG ENTRY
              </div>
              <div className="font-mono text-xs text-muted mt-0.5 truncate max-w-[260px]">{goal.name}</div>
            </div>
            <button
              className="font-mono text-muted hover:text-text text-xl p-2 -mr-2"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Warning */}
          <div className="font-mono text-xs text-muted border border-border px-3 py-2">
            ⚠ Entries are <span className="text-critical">sealed on submission</span> — no editing after.
          </div>

          {/* Textarea */}
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
            <div className="flex justify-between mt-1.5 font-mono text-xs text-muted">
              <span>{words} {words === 1 ? 'word' : 'words'}</span>
              <span>{chars}/280 chars</span>
            </div>
          </div>

          {/* Word count progress bar */}
          {words > 0 && (
            <div className="h-0.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((words / 50) * 100, 100)}%`,
                  backgroundColor: words >= 50 ? 'var(--accent)' : words >= 25 ? 'var(--medium)' : 'var(--high)',
                }}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button className="btn-ghost flex-1 py-3" onClick={onClose}>CANCEL</button>
            <button
              className="btn-primary flex-1 py-3 font-display tracking-widest"
              disabled={!content.trim() || sealing}
              onClick={handleSeal}
            >
              {sealing ? 'SEALING...' : 'SEAL ENTRY'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
