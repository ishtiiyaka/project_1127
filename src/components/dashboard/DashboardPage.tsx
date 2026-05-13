import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore, getLevelFromXP, getXPForNextLevel, getXPForCurrentLevel } from '../../store/useAppStore';
import { getDayNumber, getDaysRemaining, today, isTodayWeekday, getWeekStart, getStreakLength } from '../../lib/dateUtils';
import { getQuoteForDay } from '../../lib/quotes';
import { getDailyGeneralTip } from '../../lib/tips';
import { MILESTONE_DAYS, getMilestoneDays } from '../../types';
import CountdownHeader from './CountdownHeader';
import GoalCard from './GoalCard';
import DailyReflection from './DailyReflection';
import InstallBanner from './InstallBanner';

const NAV_ITEMS = [
  { to: '/',           label: 'LOG',      icon: '📋' },
  { to: '/calendar',   label: 'CAL',      icon: '📅' },
  { to: '/focus',      label: 'FOCUS',    icon: '⏱' },
  { to: '/ghost',      label: 'STATS',    icon: '📊' },
  { to: '/milestones', label: 'MILES',    icon: '🏆' },
  { to: '/settings',   label: 'MORE',     icon: '⚙️' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { settings, goals, entries, milestones, unlockMilestone } = useAppStore();

  const totalDays = settings?.totalDays ?? 1127;
  const dayNumber = settings ? getDayNumber(settings.startDate, totalDays) : 1;
  const daysRemaining = settings ? getDaysRemaining(settings.startDate, totalDays) : totalDays;
  const quote = getQuoteForDay(dayNumber);
  const todayStr = today();
  const tip = getDailyGeneralTip(dayNumber);

  // XP / Level
  const xp = settings?.xp ?? 0;
  const level = settings ? getLevelFromXP(xp) : 1;
  const xpForCurrent = getXPForCurrentLevel(level);
  const xpForNext = getXPForNextLevel(level);
  const xpInLevel = xp - xpForCurrent;
  const xpNeeded = xpForNext - xpForCurrent;
  const xpPct = Math.min(Math.round((xpInLevel / xpNeeded) * 100), 100);

  // Check weekly review
  useEffect(() => {
    if (!settings) return;
    const isReviewDay = isTodayWeekday(settings.weeklyReviewDay);
    if (!isReviewDay) return;
    const weekStart = getWeekStart(todayStr);
    const { reviews } = useAppStore.getState();
    const hasReview = reviews.some(r => r.weekStart === weekStart);
    if (!hasReview) navigate('/weekly-review');
  }, [settings, navigate, todayStr]);

  // Milestone unlocks
  useEffect(() => {
    if (!settings) return;
    const activeMilestones = getMilestoneDays(totalDays);
    for (const ms of activeMilestones) {
      if (dayNumber >= ms && !milestones.find(m => m.day === ms)) {
        const realEntries = entries.filter(e => !e.isAutoFilled);
        const totalElapsed = Math.max(dayNumber - 1, 1);
        const completionRate = Math.round((realEntries.length / (totalElapsed * goals.length || 1)) * 100);
        const moods = useAppStore.getState().dailyLogs.map(l => l.mood);
        const moodAvg = moods.length ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10 : 0;
        const loggedDates = new Set(realEntries.map(e => e.date));
        const longestStreak = Array.from(loggedDates).length;
        unlockMilestone({
          day: ms,
          unlockedAt: new Date().toISOString(),
          completionRate,
          totalEntries: realEntries.length,
          longestStreak,
          moodAverage: moodAvg,
          goalSnapshots: goals.map(g => ({
            goalId: g.id, name: g.name,
            completionRate: Math.round((entries.filter(e => e.goalId === g.id && !e.isAutoFilled).length / totalElapsed) * 100),
          })),
        });
        break;
      }
    }
  }, [dayNumber, milestones, entries, goals, settings, unlockMilestone]);

  const allRealEntryDates = new Set(entries.filter(e => !e.isAutoFilled).map(e => e.date));
  const globalStreak = settings ? getStreakLength(allRealEntryDates, settings.startDate) : 0;
  const progress = ((dayNumber - 1) / totalDays) * 100;

  return (
    <div className="min-h-screen bg-black page-enter" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 72px)' }}>
      <CountdownHeader dayNumber={dayNumber} daysRemaining={daysRemaining} progress={progress} totalDays={totalDays} />

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">

        {/* XP / Level bar */}
        <div className="card px-4 py-3 space-y-1.5">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-accent font-bold">LVL {level}</span>
            <span className="text-muted">{xpInLevel} / {xpNeeded} XP</span>
            <span className="text-muted">LVL {Math.min(level + 1, 50)}</span>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div className="xp-bar-fill h-full rounded-full" style={{ width: `${xpPct}%` }} />
          </div>
        </div>

        {/* Quote */}
        <div className="font-mono text-xs text-muted italic border-l-2 border-accent-dim pl-3 py-1">
          "{quote}"
        </div>

        {/* Global streak */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted">GLOBAL STREAK</span>
          <span className="font-display text-accent font-bold text-lg">{globalStreak}</span>
          <span className="font-mono text-xs text-muted">DAYS</span>
          <Link to="/report" className="ml-auto font-mono text-xs text-muted hover:text-accent transition-colors">
            REPORT CARD →
          </Link>
        </div>

        {/* Daily tip */}
        <div className="font-mono text-xs text-muted border border-border px-3 py-2 leading-relaxed">
          💡 {tip}
        </div>

        {/* Daily Reflection */}
        <DailyReflection />

        {/* Goal Cards */}
        <div className="space-y-3">
          <div className="font-mono text-xs text-muted tracking-widest">
            COMMITMENTS — DAY {dayNumber}
          </div>
          {goals.map(goal => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      </div>

      {/* Bottom nav — Android/iOS optimized */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-border bottom-nav">
        <div className="max-w-2xl mx-auto grid grid-cols-6">
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center justify-center py-2 gap-0.5 font-mono text-muted hover:text-accent transition-colors"
              style={{ minHeight: 52 }}
            >
              <span className="text-base leading-none">{icon}</span>
              <span className="text-xs tracking-wider" style={{ fontSize: '9px' }}>{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      <InstallBanner />
    </div>
  );
}
