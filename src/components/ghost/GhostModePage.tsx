import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { getDayNumber, getStreakLength } from '../../lib/dateUtils';
import { projectAllMilestones, getRecentActivity, averageMood, totalWordsForGoal, getPaceSuggestion } from '../../lib/projectionEngine';
import { calculateReportCard, gradeColor } from '../../lib/reportCard';
import HeatmapFull from './HeatmapFull';
import { BarChart, Bar, ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';

export default function GhostModePage() {
  const { goals, entries, dailyLogs, settings, focusSessions } = useAppStore();
  const [weeklyTarget, setWeeklyTarget] = useState(settings?.weeklyTarget ?? 7);
  const [tab, setTab] = useState<'stats' | 'leaderboard' | 'heatmaps'>('stats');

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
    if ((curr.getTime() - prev.getTime()) / 86400000 === 1) { cur++; if (cur > longestStreak) longestStreak = cur; }
    else cur = 1;
  }
  if (cur > longestStreak) longestStreak = cur;

  const moods30 = dailyLogs.slice(-30).map((l, idx) => ({ day: idx + 1, mood: l.mood }));
  const moodAvg = averageMood(dailyLogs.map(l => l.mood));

  let currentStreak = 0;
  const checkDate = new Date();
  while (true) {
    const ds = `${checkDate.getFullYear()}-${String(checkDate.getMonth()+1).padStart(2,'0')}-${String(checkDate.getDate()).padStart(2,'0')}`;
    if (allRealDates.has(ds)) { currentStreak++; checkDate.setDate(checkDate.getDate() - 1); }
    else break;
  }

  // Total focus minutes
  const totalFocusMinutes = focusSessions.reduce((sum, s) => sum + s.durationMinutes, 0);

  // Leaderboard data
  const leaderboard = goals.map(g => {
    const realDates = new Set(entries.filter(e => e.goalId === g.id && !e.isAutoFilled).map(e => e.date));
    const streak = getStreakLength(realDates, settings.startDate);
    const elapsed = Math.max(dayNumber - 1, 1);
    const completionRate = Math.round((realDates.size / elapsed) * 100);
    const words = totalWordsForGoal(g.id, entries);
    const grade = calculateReportCard(g, entries, settings.startDate);
    return { goal: g, streak, completionRate, words, grade };
  }).sort((a, b) => b.grade.overallScore - a.grade.overallScore);

  return (
    <div className="min-h-screen bg-black page-enter" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 72px)' }}>
      <div className="sticky top-0 bg-black border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/" className="font-mono text-xs text-muted hover:text-accent">← BACK</Link>
        <div className="font-display text-accent text-sm tracking-widest">GHOST MODE</div>
      </div>

      {/* Tab bar */}
      <div className="max-w-2xl mx-auto px-4 pt-3">
        <div className="grid grid-cols-3 gap-1 mb-4">
          {(['stats', 'leaderboard', 'heatmaps'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-2 font-mono text-xs border transition-all ${
                tab === t ? 'border-accent text-accent bg-accent/10' : 'border-border text-muted'
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* ── STATS TAB ── */}
        {tab === 'stats' && (
          <div className="space-y-5">
            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'TOTAL ENTRIES', value: String(realEntries.length) },
                { label: 'TOTAL WORDS', value: String(totalWords) },
                { label: 'LONGEST STREAK', value: String(longestStreak) },
                { label: 'CURRENT STREAK', value: String(currentStreak) },
                { label: 'MOOD AVERAGE', value: String(moodAvg) },
                { label: 'FOCUS HOURS', value: `${Math.round(totalFocusMinutes / 60 * 10) / 10}h` },
              ].map(s => (
                <div key={s.label} className="card p-3 text-center">
                  <div className="font-display text-accent text-xl font-bold">{s.value}</div>
                  <div className="font-mono text-xs text-muted">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Per-goal word stats */}
            <div className="card p-4 space-y-2">
              <div className="font-mono text-xs text-muted tracking-widest">WORDS PER GOAL</div>
              {goals.map(g => {
                const words = totalWordsForGoal(g.id, entries);
                const realCount = entries.filter(e => e.goalId === g.id && !e.isAutoFilled).length;
                const avg = realCount > 0 ? Math.round(words / realCount) : 0;
                return (
                  <div key={g.id} className="space-y-1">
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-text truncate max-w-[60%]">{g.name}</span>
                      <span className="text-accent">{words}w <span className="text-muted">({avg} avg)</span></span>
                    </div>
                    <div className="h-1 bg-border rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-accent/60" style={{ width: `${Math.min((words / Math.max(totalWords, 1)) * 100 * goals.length, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Weekly target */}
            <div className="card p-4 space-y-3">
              <div className="font-mono text-xs text-muted tracking-widest">PROJECTION WEEKLY TARGET</div>
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
              {goals.map(goal => (
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

            {/* 14-day activity */}
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
          </div>
        )}

        {/* ── LEADERBOARD TAB ── */}
        {tab === 'leaderboard' && (
          <div className="space-y-3">
            <div className="font-mono text-xs text-muted tracking-widest">GOAL RANKINGS (BY PERFORMANCE)</div>
            {leaderboard.map((item, rank) => (
              <div
                key={item.goal.id}
                className="card p-4 space-y-3"
                style={{ borderLeft: `2px solid ${gradeColor(item.grade.overallGrade)}` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg" style={{ color: rank === 0 ? 'var(--medium)' : rank === 1 ? 'var(--text-muted)' : 'var(--high)' }}>
                        #{rank + 1}
                      </span>
                      <span className="font-mono text-sm text-text truncate">{item.goal.name}</span>
                    </div>
                  </div>
                  <div className="font-display text-xl font-bold shrink-0" style={{ color: gradeColor(item.grade.overallGrade) }}>
                    {item.grade.overallGrade}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                  <div className="text-center">
                    <div className="text-accent font-bold">{item.completionRate}%</div>
                    <div className="text-muted">COMPLETION</div>
                  </div>
                  <div className="text-center">
                    <div className="text-accent font-bold">{item.streak}</div>
                    <div className="text-muted">STREAK</div>
                  </div>
                  <div className="text-center">
                    <div className="text-accent font-bold">{item.words}</div>
                    <div className="text-muted">WORDS</div>
                  </div>
                </div>
                <div className="h-1.5 bg-border rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${item.grade.overallScore}%`, background: gradeColor(item.grade.overallGrade) }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── HEATMAPS TAB ── */}
        {tab === 'heatmaps' && (
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
        )}
      </div>
    </div>
  );
}
