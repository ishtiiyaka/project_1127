import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { getDayNumber } from '../../lib/dateUtils';
import { getMilestoneDays } from '../../types';

export default function MilestoneWall() {
  const { milestones, settings } = useAppStore();
  const totalDays = settings?.totalDays ?? 1127;
  const dayNumber = settings ? getDayNumber(settings.startDate, totalDays) : 0;
  const activeMilestones = getMilestoneDays(totalDays);

  return (
    <div className="min-h-screen bg-black page-enter pb-8">
      <div className="sticky top-0 bg-black border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/" className="font-mono text-xs text-muted hover:text-accent">← BACK</Link>
        <div className="font-display text-accent text-sm tracking-widest">THE MILESTONE WALL</div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {activeMilestones.map(ms => {
          const record = milestones.find(m => m.day === ms);
          const reached = dayNumber >= ms;
          const progress = Math.min(Math.round((dayNumber / ms) * 100), 100);

          return (
            <div
              key={ms}
              className={`card p-4 space-y-3 ${!reached ? 'opacity-50' : ''}`}
              style={{ borderLeft: reached ? '2px solid var(--accent)' : '2px solid var(--border)' }}
            >
              <div className="flex items-center justify-between">
                <div className="font-display text-sm tracking-widest" style={{ color: reached ? 'var(--accent)' : 'var(--text-muted)' }}>
                  DAY {ms}
                </div>
                {reached ? (
                  <span className="font-mono text-xs text-accent border border-accent px-2 py-0.5">UNLOCKED</span>
                ) : (
                  <span className="font-mono text-xs text-muted">{progress}% THERE</span>
                )}
              </div>

              {!reached && (
                <div className="h-1 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-accent-dim rounded-full" style={{ width: `${progress}%` }} />
                </div>
              )}

              {record && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Stat label="COMPLETION" value={`${record.completionRate}%`} />
                  <Stat label="TOTAL ENTRIES" value={String(record.totalEntries)} />
                  <Stat label="LONGEST STREAK" value={String(record.longestStreak)} />
                  <Stat label="MOOD AVG" value={String(record.moodAverage)} />
                </div>
              )}

              {record && (
                <div className="space-y-1 pt-1">
                  <div className="font-mono text-xs text-muted">GOAL SNAPSHOTS</div>
                  {record.goalSnapshots.map(snap => (
                    <div key={snap.goalId} className="flex justify-between font-mono text-xs">
                      <span className="text-text truncate max-w-[70%]">{snap.name}</span>
                      <span className="text-accent">{snap.completionRate}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-2 text-center">
      <div className="font-display text-accent text-base font-bold">{value}</div>
      <div className="font-mono text-xs text-muted">{label}</div>
    </div>
  );
}
