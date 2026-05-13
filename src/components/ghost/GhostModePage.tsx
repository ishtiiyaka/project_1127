import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { getDayNumber } from '../../lib/dateUtils';
import { projectAllMilestones, getRecentActivity, averageMood, totalWordsForGoal, getPaceSuggestion } from '../../lib/projectionEngine';
import HeatmapFull from './HeatmapFull';
import { BarChart, Bar, ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';

export default function GhostModePage() {
  const { goals, entries, dailyLogs, settings } = useAppStore();
  const [weeklyTarget, setWeeklyTarget] = useState(settings?.weeklyTarget ?? 7);

  if (!settings) return null;

  const dayNumber = getDayNumber(settings.startDate);
  const realEntries = entries.filter(e => !e.isAutoFilled);
  const totalWords = goals.reduce((sum, g) => sum + totalWordsForGoal(g.id, entries), 0);

  const allRealDates = new Set(realEntries.map(e => e.date));
  let longestStreak = 0; let cur = 0;
  const sortedDates = Array.from(allRealDates).sort();
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) { cur = 1; continue; }
    const prev = new Date(sortedDates[i - 1] + 'T00:00:00');
    const curr = new Date(sortedDates[i] + 'T00:00:00');
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) { cur++; if (cur > longestStreak) longestStreak = cur; }
    else cur = 1;
  }
  if (cur > longestStreak) longestStreak = cur;

  const moods30 = dailyLogs.slice(-30).map((l, idx) => ({ day: idx + 1, mood: l.mood }));
  const moodAvg = averageMood(dailyLogs.map(l => l.mood));

  // Current streak
  let currentStreak = 0;
  const checkDate = new Date();
  while (true) {
    const ds = `${checkDate.getFullYear()}-${String(checkDate.getMonth()+1).padStart(2,'0')}-${String(checkDate.getDate()).padStart(2,'0')}`;
    if (allRealDates.has(ds)) { currentStreak++; checkDate.setDate(checkDate.getDate() - 1); }
    else break;
  }

  return (
    <div className="min-h-screen bg-black page-enter pb-8">
      <div className="sticky top-0 bg-black border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/" className="font-mono text-xs text-muted hover:text-accent">← BACK</Link>
        <div className="font-display text-accent text-sm tracking-widest">GHOST MODE</div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-6">

        {/* Stats panel */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'TOTAL ENTRIES', value: String(realEntries.length) },
            { label: 'TOTAL WORDS', value: String(totalWords) },
            { label: 'LONGEST STREAK', value: String(longestStreak) },
            { label: 'CURRENT STREAK', value: String(currentStreak) },
            { label: 'MOOD AVERAGE', value: String(moodAvg) },
            { label: 'DAY NUMBER', value: String(dayNumber) },
          ].map(s => (
            <div key={s.label} className="card p-3 text-center">
              <div className="font-display text-accent text-xl font-bold">{s.value}</div>
              <div className="font-mono text-xs text-muted">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Weekly target adjuster */}
        <div className="card p-4 space-y-3">
          <div className="font-mono text-xs text-muted tracking-widest">ADJUST WEEKLY TARGET</div>
          <div className="flex items-center gap-4">
            <input type="range" min={1} max={7} value={weeklyTarget}
              onChange={e => setWeeklyTarget(Number(e.target.value))}
              className="flex-1 accent-accent"
            />
            <span className="font-display text-accent text-xl font-bold w-8 text-center">{weeklyTarget}</span>
          </div>
        </div>

        {/* Projections */}
        <div className="space-y-3">
          <div className="font-mono text-xs text-muted tracking-widest">MILESTONE PROJECTIONS</div>
          {goals.slice(0, 1).length > 0 && goals.map(goal => (
            <div key={goal.id} className="card p-4 space-y-2">
              <div className="font-mono text-xs text-text truncate">{goal.name}</div>
              <p className="font-mono text-xs text-muted italic">{getPaceSuggestion(goal, entries, settings.startDate, weeklyTarget)}</p>
              <div className="space-y-1">
                {projectAllMilestones(goal.id, entries, settings.startDate, weeklyTarget).map(p => (
                  <div key={p.milestone} className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-muted w-16">DAY {p.milestone}</span>
                    <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        width: `${Math.min((p.projected / p.needed) * 100, 100)}%`,
                        backgroundColor: p.status === 'on-track' ? 'var(--accent)' : p.status === 'at-risk' ? 'var(--medium)' : 'var(--critical)',
                      }} />
                    </div>
                    <span style={{ color: p.status === 'on-track' ? 'var(--accent)' : p.status === 'at-risk' ? 'var(--medium)' : 'var(--critical)' }}>
                      {p.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Per-goal sparklines */}
        <div className="space-y-3">
          <div className="font-mono text-xs text-muted tracking-widest">14-DAY ACTIVITY</div>
          {goals.map(goal => {
            const activity = getRecentActivity(goal.id, entries, 14);
            return (
              <div key={goal.id} className="card p-4 space-y-2">
                <div className="font-mono text-xs text-text truncate">{goal.name}</div>
                <ResponsiveContainer width="100%" height={40}>
                  <BarChart data={activity} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Bar dataKey="value" fill="var(--accent)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );
          })}
        </div>

        {/* Mood trend */}
        {moods30.length > 0 && (
          <div className="card p-4 space-y-2">
            <div className="font-mono text-xs text-muted tracking-widest">MOOD TREND (30 DAYS)</div>
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={moods30} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <Line type="monotone" dataKey="mood" stroke="var(--accent)" dot={false} strokeWidth={2} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', fontFamily: 'Share Tech Mono' }}
                  labelStyle={{ color: 'var(--text-muted)' }}
                  itemStyle={{ color: 'var(--accent)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Full heatmaps */}
        <div className="space-y-4">
          <div className="font-mono text-xs text-muted tracking-widest">FULL JOURNEY HEATMAPS</div>
          {goals.map(goal => (
            <div key={goal.id} className="card p-4 space-y-2">
              <div className="font-mono text-xs text-text truncate">{goal.name}</div>
              <HeatmapFull
                goalId={goal.id}
                entries={entries.filter(e => e.goalId === goal.id)}
                startDate={settings.startDate}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
