import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { today, getWeekStart, uid } from '../../lib/dateUtils';
import { generateWeeklyChallenge } from '../../lib/reportCard';
import type { Mood } from '../../types';

export default function WeeklyReviewPage() {
  const navigate = useNavigate();
  const { reviews, entries, dailyLogs, goals, settings, saveWeeklyReview } = useAppStore();

  const todayStr = today();
  const weekStart = getWeekStart(todayStr);
  const existingReview = reviews.find(r => r.weekStart === weekStart);

  const [reflection, setReflection] = useState(existingReview?.reflection ?? '');
  const [sealing, setSealing] = useState(false);

  // Week stats
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart + 'T00:00:00');
    d.setDate(d.getDate() + i);
    weekDates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }

  const weekEntries = entries.filter(e => weekDates.includes(e.date) && !e.isAutoFilled);
  const weekMoods = dailyLogs.filter(l => weekDates.includes(l.date)).map(l => l.mood);
  const moodAvg = weekMoods.length
    ? Math.round((weekMoods.reduce((a, b) => a + b, 0) / weekMoods.length) * 10) / 10
    : 0;

  const isSealed = existingReview?.sealed ?? false;

  const challenge = settings ? generateWeeklyChallenge(goals, entries, settings.startDate) : null;

  async function handleSeal() {
    if (!reflection.trim() || sealing) return;
    setSealing(true);
    await saveWeeklyReview({
      id: existingReview?.id ?? uid(),
      weekStart,
      reflection: reflection.slice(0, 500),
      totalEntries: weekEntries.length,
      moodAverage: moodAvg,
      sealed: true,
      createdAt: existingReview?.createdAt ?? new Date().toISOString(),
      challenge: challenge ?? undefined,
    });
    navigate('/');
  }

  const MOOD_EMOJIS: Record<number, string> = { 1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' };

  return (
    <div className="min-h-screen bg-black page-enter pb-8">
      <div className="sticky top-0 bg-black border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/" className="font-mono text-xs text-muted hover:text-accent">← SKIP</Link>
        <div className="font-display text-accent text-sm tracking-widest">WEEKLY REVIEW</div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-5">
        <div className="font-mono text-xs text-muted">Week of {weekStart}</div>

        {/* Week stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 text-center">
            <div className="font-display text-accent text-xl font-bold">{weekEntries.length}</div>
            <div className="font-mono text-xs text-muted">ENTRIES</div>
          </div>
          <div className="card p-3 text-center">
            <div className="font-display text-accent text-xl font-bold">{moodAvg || '—'}</div>
            <div className="font-mono text-xs text-muted">MOOD AVG</div>
          </div>
          <div className="card p-3 text-center">
            <div className="font-display text-accent text-xl font-bold">
              {weekMoods.length > 0 ? MOOD_EMOJIS[Math.round(moodAvg) as Mood] : '—'}
            </div>
            <div className="font-mono text-xs text-muted">FEELING</div>
          </div>
        </div>

        {/* Per-goal streaks this week */}
        <div className="card p-4 space-y-2">
          <div className="font-mono text-xs text-muted tracking-widest">GOAL ACTIVITY THIS WEEK</div>
          {goals.map(goal => {
            // count used as reference; per-goal dot grid shows activity
            const _count = weekEntries.filter(e => e.goalId === goal.id).length; void _count;
            return (
              <div key={goal.id} className="flex justify-between items-center font-mono text-xs">
                <span className="text-text truncate max-w-[70%]">{goal.name}</span>
                <div className="flex gap-1">
                  {weekDates.map(date => {
                    const e = entries.find(en => en.goalId === goal.id && en.date === date);
                    return (
                      <div key={date} style={{
                        width: 10, height: 10,
                        backgroundColor: e && !e.isAutoFilled ? 'var(--accent)' : e?.isAutoFilled ? 'var(--accent-dim)' : 'var(--border)',
                        borderRadius: 2,
                      }} />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Weekly Challenge */}
        {challenge && (
          <div className="card p-4 space-y-2" style={{ borderLeft: '2px solid var(--accent)' }}>
            <div className="font-mono text-xs text-accent tracking-widest">THIS WEEK'S CHALLENGE</div>
            <p className="font-mono text-sm text-text leading-relaxed">{challenge}</p>
            <div className="font-mono text-xs text-muted">Auto-generated based on your weakest area</div>
          </div>
        )}

        {/* Reflection */}
        <div className="card p-4 space-y-3">
          <div className="font-mono text-xs text-muted tracking-widest">WEEKLY REFLECTION</div>
          <textarea
            className="input resize-none text-sm leading-relaxed"
            rows={5}
            placeholder="How was this week? What worked? What needs to change?..."
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
                className="btn-primary text-xs py-1.5 px-4"
                disabled={sealing || !reflection.trim()}
                onClick={handleSeal}
              >
                {sealing ? 'SEALING...' : 'SEAL REVIEW'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
