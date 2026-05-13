import type { DayEntry, Goal, MilestoneDay, ProjectionResult } from '../types';
import { getDayNumber } from './dateUtils';

const MILESTONE_DAYS: MilestoneDay[] = [100, 250, 500, 750, 1000, 1127];

/**
 * For a given goal and weekly target, forecast completion at each milestone.
 */
export function projectAllMilestones(
  goalId: string,
  entries: DayEntry[],
  startDate: string,
  weeklyTarget: number,
): ProjectionResult[] {
  const realEntries = entries.filter(e => e.goalId === goalId && !e.isAutoFilled);
  const currentDay = getDayNumber(startDate);
  const elapsed = Math.max(currentDay - 1, 1);
  const realCount = realEntries.length;
  const dailyRate = weeklyTarget / 7;
  void elapsed; // suppress unused warning — kept for future use

  return MILESTONE_DAYS.map(milestone => {
    const needed = Math.round(milestone * dailyRate);
    const daysLeft = Math.max(milestone - currentDay, 0);
    const projected = Math.round(realCount + daysLeft * dailyRate);
    const delta = projected - needed;

    let status: ProjectionResult['status'];
    if (delta >= 0) status = 'on-track';
    else if (delta >= -Math.ceil(milestone * 0.05)) status = 'at-risk';
    else status = 'behind';

    return { milestone, needed, projected, delta, status };
  });
}

/**
 * Overall completion rate for a goal at a given day number.
 */
export function goalCompletionRateAtDay(
  goalId: string,
  entries: DayEntry[],
  startDate: string,
  atDay?: number,
): number {
  const dayNum = atDay ?? getDayNumber(startDate);
  const elapsed = Math.max(dayNum - 1, 1);
  const real = entries.filter(e => e.goalId === goalId && !e.isAutoFilled).length;
  return Math.round((real / elapsed) * 100);
}

/**
 * Pace-based suggestion string for a goal.
 */
export function getPaceSuggestion(
  goal: Goal,
  entries: DayEntry[],
  startDate: string,
  weeklyTarget: number,
): string {
  const projections = projectAllMilestones(goal.id, entries, startDate, weeklyTarget);
  const nextMissed = projections.find(p => p.status !== 'on-track');
  if (!nextMissed) return `On track for all milestones.`;
  const gap = Math.abs(nextMissed.delta);
  return `At current rate, you will miss Day ${nextMissed.milestone} target by ${gap} ${gap === 1 ? 'entry' : 'entries'}.`;
}

/**
 * Average mood from a list of mood values.
 */
export function averageMood(moods: number[]): number {
  if (moods.length === 0) return 0;
  return Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10;
}

/**
 * Count total words written across all real entries for a goal.
 */
export function totalWordsForGoal(goalId: string, entries: DayEntry[]): number {
  return entries
    .filter(e => e.goalId === goalId && !e.isAutoFilled)
    .reduce((sum, e) => sum + e.content.trim().split(/\s+/).filter(Boolean).length, 0);
}

/**
 * Last N days activity array for a goal (1 = real entry, 0.3 = auto, 0 = missing).
 */
export function getRecentActivity(
  goalId: string,
  entries: DayEntry[],
  days: number,
): { date: string; value: number }[] {
  const result: { date: string; value: number }[] = [];
  const cursor = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(cursor);
    d.setDate(cursor.getDate() - i);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const entry = entries.find(e => e.goalId === goalId && e.date === date);
    result.push({
      date,
      value: entry ? (entry.isAutoFilled ? 0.3 : 1) : 0,
    });
  }
  return result;
}
