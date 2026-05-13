import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { getDayNumber, getDaysRemaining, today, isTodayWeekday, getWeekStart, getStreakLength } from '../../lib/dateUtils';
import { getQuoteForDay } from '../../lib/quotes';
import { MILESTONE_DAYS, TOTAL_DAYS } from '../../types';
// dailyLogs used indirectly via store
import CountdownHeader from './CountdownHeader';
import GoalCard from './GoalCard';
import DailyReflection from './DailyReflection';
import InstallBanner from './InstallBanner';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { settings, goals, entries, milestones, unlockMilestone } = useAppStore();

  const dayNumber = settings ? getDayNumber(settings.startDate) : 1;
  const daysRemaining = settings ? getDaysRemaining(settings.startDate) : TOTAL_DAYS;
  const quote = getQuoteForDay(dayNumber);
  const todayStr = today();

  // Check if weekly review is needed
  useEffect(() => {
    if (!settings) return;
    const isReviewDay = isTodayWeekday(settings.weeklyReviewDay);
    if (!isReviewDay) return;
    const weekStart = getWeekStart(todayStr);
    const { reviews } = useAppStore.getState();
    const hasReview = reviews.some(r => r.weekStart === weekStart);
    if (!hasReview) navigate('/weekly-review');
  }, [settings, navigate, todayStr]);

  // Check milestone unlocks
  useEffect(() => {
    if (!settings) return;
    for (const ms of MILESTONE_DAYS) {
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

  // Global streak
  const allRealEntryDates = new Set(entries.filter(e => !e.isAutoFilled).map(e => e.date));
  const globalStreak = settings ? getStreakLength(allRealEntryDates, settings.startDate) : 0;

  const progress = ((dayNumber - 1) / TOTAL_DAYS) * 100;

  return (
    <div className="min-h-screen bg-black page-enter pb-24">
      <CountdownHeader dayNumber={dayNumber} daysRemaining={daysRemaining} progress={progress} />

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-5">
        {/* Quote */}
        <div className="font-mono text-xs text-muted italic border-l-2 border-accent-dim pl-3 py-1">
          "{quote}"
        </div>

        {/* Global streak */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted">GLOBAL STREAK</span>
          <span className="font-display text-accent font-bold text-lg">{globalStreak}</span>
          <span className="font-mono text-xs text-muted">CONSECUTIVE DAYS</span>
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

      {/* Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-border">
        <div className="max-w-2xl mx-auto flex justify-around py-2">
          {[
            { to: '/', label: 'LOG' },
            { to: '/archive', label: 'ARCHIVE' },
            { to: '/ghost', label: 'GHOST' },
            { to: '/milestones', label: 'MILESTONES' },
            { to: '/settings', label: 'SETTINGS' },
          ].map(({ to, label }) => (
            <Link key={to} to={to} className="font-mono text-xs text-muted hover:text-accent transition-colors px-2 py-1">
              {label}
            </Link>
          ))}
        </div>
      </nav>

      <InstallBanner />
    </div>
  );
}
