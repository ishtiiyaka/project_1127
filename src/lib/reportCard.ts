import type { DayEntry, Goal, ReportCardGrade } from '../types';
import { getDayNumber, getStreakLength } from './dateUtils';

export function calculateReportCard(
  goal: Goal,
  entries: DayEntry[],
  startDate: string,
): ReportCardGrade {
  const dayNum = getDayNumber(startDate);
  const elapsed = Math.max(dayNum - 1, 1);
  const realEntries = entries.filter(e => e.goalId === goal.id && !e.isAutoFilled);
  const realDates = new Set(realEntries.map(e => e.date));

  // Completion rate 0-100
  const completionRate = Math.round((realDates.size / elapsed) * 100);

  // Streak score 0-100 (current streak / elapsed * 200, capped at 100)
  const streakLen = getStreakLength(realDates, startDate);
  const streakScore = Math.min(Math.round((streakLen / Math.max(elapsed, 1)) * 200), 100);

  // Consistency score: count weeks with ≥1 entry
  const weekSet = new Set(realEntries.map(e => {
    const d = new Date(e.date + 'T00:00:00');
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }));
  const totalWeeks = Math.max(Math.ceil(elapsed / 7), 1);
  const consistencyScore = Math.round((weekSet.size / totalWeeks) * 100);

  // Overall score weighted
  const overallScore = Math.round(completionRate * 0.5 + streakScore * 0.25 + consistencyScore * 0.25);

  let overallGrade: ReportCardGrade['overallGrade'];
  if (overallScore >= 95) overallGrade = 'A+';
  else if (overallScore >= 87) overallGrade = 'A';
  else if (overallScore >= 80) overallGrade = 'B+';
  else if (overallScore >= 72) overallGrade = 'B';
  else if (overallScore >= 65) overallGrade = 'C+';
  else if (overallScore >= 55) overallGrade = 'C';
  else if (overallScore >= 40) overallGrade = 'D';
  else overallGrade = 'F';

  return { goalId: goal.id, goalName: goal.name, completionRate, streakScore, consistencyScore, overallGrade, overallScore };
}

export function gradeColor(grade: ReportCardGrade['overallGrade']): string {
  switch (grade) {
    case 'A+': case 'A': return 'var(--accent)';
    case 'B+': case 'B': return 'var(--low)';
    case 'C+': case 'C': return 'var(--medium)';
    case 'D': return 'var(--high)';
    default: return 'var(--critical)';
  }
}

export function generateWeeklyChallenge(
  goals: Goal[],
  entries: DayEntry[],
  startDate: string,
): string {
  if (goals.length === 0) return 'Log at least one entry every day this week.';

  // Find weakest goal by completion rate
  const dayNum = getDayNumber(startDate);
  const elapsed = Math.max(dayNum - 1, 1);

  const withRates = goals.map(g => {
    const real = entries.filter(e => e.goalId === g.id && !e.isAutoFilled).length;
    return { goal: g, rate: real / elapsed };
  });

  withRates.sort((a, b) => a.rate - b.rate);
  const weakest = withRates[0];

  const challenges = [
    `Log "${weakest.goal.name}" every single day this week — no excuses.`,
    `Write at least 50 words per entry for "${weakest.goal.name}" this week.`,
    `Complete "${weakest.goal.name}" before 10 AM every day this week.`,
    `Achieve a 7-day streak on "${weakest.goal.name}" starting today.`,
    `Focus 25 minutes on "${weakest.goal.name}" using the timer every day.`,
  ];

  const idx = new Date().getDate() % challenges.length;
  return challenges[idx];
}
