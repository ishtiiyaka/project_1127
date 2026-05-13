import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { today } from '../../lib/dateUtils';
import type { Mood } from '../../types';

const MOOD_LABELS: Record<Mood, string> = { 1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' };

export default function DailyReflection() {
  const { dailyLogs, saveDailyLog } = useAppStore();
  const todayStr = today();
  const existing = dailyLogs.find(l => l.date === todayStr);

  const [reflection, setReflection] = useState(existing?.reflection ?? '');
  const [mood, setMood] = useState<Mood>(existing?.mood ?? 3);
  const [saving, setSaving] = useState(false);

  const isSealed = existing?.sealed ?? false;

  async function handleSeal() {
    if (isSealed || !reflection.trim()) return;
    setSaving(true);
    await saveDailyLog({ date: todayStr, reflection: reflection.slice(0, 500), mood, sealed: true });
    setSaving(false);
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="font-mono text-xs text-muted tracking-widest">DAILY REFLECTION</div>

      {/* Mood selector */}
      <div className="flex gap-2 items-center">
        <span className="font-mono text-xs text-muted">MOOD</span>
        <div className="flex gap-1">
          {([1, 2, 3, 4, 5] as Mood[]).map(m => (
            <button
              key={m}
              disabled={isSealed}
              onClick={() => !isSealed && setMood(m)}
              className={`text-xl transition-all ${mood === m ? 'scale-125' : 'opacity-40 hover:opacity-70'} ${isSealed ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {MOOD_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Reflection text */}
      <textarea
        className="input resize-none text-xs leading-relaxed"
        rows={3}
        placeholder="How did today go?..."
        maxLength={500}
        disabled={isSealed}
        value={reflection}
        onChange={e => setReflection(e.target.value)}
      />

      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-muted">{reflection.length}/500</span>
        {isSealed ? (
          <span className="font-mono text-xs text-muted">✓ SEALED</span>
        ) : (
          <button
            className="btn-primary text-xs py-1.5 px-3"
            disabled={saving || !reflection.trim()}
            onClick={handleSeal}
          >
            {saving ? 'SEALING...' : 'SEAL REFLECTION'}
          </button>
        )}
      </div>
    </div>
  );
}
