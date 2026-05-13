import type { Goal, DayEntry, AppSettings } from '../types';
import { getPastDates, uid } from './dateUtils';
import { getEntryForGoalDate, saveEntry } from './db';

/**
 * Run on every app mount.
 * For every past date (startDate → yesterday), for every goal,
 * if no entry exists → create a sealed "Nothing" auto-fill entry.
 */
export async function runAutoSeal(goals: Goal[], settings: AppSettings): Promise<DayEntry[]> {
  const newEntries: DayEntry[] = [];
  const pastDates = getPastDates(settings.startDate);

  for (const date of pastDates) {
    for (const goal of goals) {
      const existing = await getEntryForGoalDate(goal.id, date);
      if (!existing) {
        const entry: DayEntry = {
          id: uid(),
          goalId: goal.id,
          date,
          content: 'Nothing',
          isAutoFilled: true,
          sealed: true,
          createdAt: new Date().toISOString(),
        };
        await saveEntry(entry);
        newEntries.push(entry);
      }
    }
  }

  return newEntries;
}
