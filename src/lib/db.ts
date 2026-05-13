import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Goal, DayEntry, DailyLog, WeeklyReview, MilestoneRecord, AppSettings } from '../types';

interface P1127DB extends DBSchema {
  goals: { key: string; value: Goal };
  entries: { key: string; value: DayEntry; indexes: { 'by-goal': string; 'by-date': string; 'by-goal-date': [string, string] } };
  dailyLogs: { key: string; value: DailyLog };
  weeklyReviews: { key: string; value: WeeklyReview };
  milestones: { key: number; value: MilestoneRecord };
  settings: { key: string; value: AppSettings };
}

let dbInstance: IDBPDatabase<P1127DB> | null = null;

export async function getDB(): Promise<IDBPDatabase<P1127DB>> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB<P1127DB>('project-1127', 1, {
    upgrade(db) {
      db.createObjectStore('goals', { keyPath: 'id' });

      const entryStore = db.createObjectStore('entries', { keyPath: 'id' });
      entryStore.createIndex('by-goal', 'goalId');
      entryStore.createIndex('by-date', 'date');
      entryStore.createIndex('by-goal-date', ['goalId', 'date']);

      db.createObjectStore('dailyLogs', { keyPath: 'date' });
      db.createObjectStore('weeklyReviews', { keyPath: 'id' });
      db.createObjectStore('milestones', { keyPath: 'day' });
      db.createObjectStore('settings', { keyPath: 'startDate' });
    },
  });
  return dbInstance;
}

// ─── Goals ───────────────────────────────────────────────────────────────────
export async function getAllGoals(): Promise<Goal[]> {
  return (await getDB()).getAll('goals');
}
export async function saveGoal(goal: Goal): Promise<void> {
  await (await getDB()).put('goals', goal);
}
export async function deleteGoal(id: string): Promise<void> {
  await (await getDB()).delete('goals', id);
}

// ─── Entries ─────────────────────────────────────────────────────────────────
export async function getAllEntries(): Promise<DayEntry[]> {
  return (await getDB()).getAll('entries');
}
export async function getEntriesForGoal(goalId: string): Promise<DayEntry[]> {
  return (await getDB()).getAllFromIndex('entries', 'by-goal', goalId);
}
export async function getEntryForGoalDate(goalId: string, date: string): Promise<DayEntry | undefined> {
  return (await getDB()).getFromIndex('entries', 'by-goal-date', [goalId, date]);
}
export async function saveEntry(entry: DayEntry): Promise<void> {
  await (await getDB()).put('entries', entry);
}

// ─── Daily Logs ──────────────────────────────────────────────────────────────
export async function getAllDailyLogs(): Promise<DailyLog[]> {
  return (await getDB()).getAll('dailyLogs');
}
export async function getDailyLog(date: string): Promise<DailyLog | undefined> {
  return (await getDB()).get('dailyLogs', date);
}
export async function saveDailyLog(log: DailyLog): Promise<void> {
  await (await getDB()).put('dailyLogs', log);
}

// ─── Weekly Reviews ───────────────────────────────────────────────────────────
export async function getAllReviews(): Promise<WeeklyReview[]> {
  return (await getDB()).getAll('weeklyReviews');
}
export async function saveReview(review: WeeklyReview): Promise<void> {
  await (await getDB()).put('weeklyReviews', review);
}

// ─── Milestones ───────────────────────────────────────────────────────────────
export async function getAllMilestones(): Promise<MilestoneRecord[]> {
  return (await getDB()).getAll('milestones');
}
export async function saveMilestone(milestone: MilestoneRecord): Promise<void> {
  await (await getDB()).put('milestones', milestone);
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export async function getSettings(): Promise<AppSettings | undefined> {
  const all = await (await getDB()).getAll('settings');
  return all[0];
}
export async function saveSettings(settings: AppSettings): Promise<void> {
  await (await getDB()).put('settings', settings);
}
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['goals', 'entries', 'dailyLogs', 'weeklyReviews', 'milestones', 'settings'], 'readwrite');
  await Promise.all([
    tx.objectStore('goals').clear(),
    tx.objectStore('entries').clear(),
    tx.objectStore('dailyLogs').clear(),
    tx.objectStore('weeklyReviews').clear(),
    tx.objectStore('milestones').clear(),
    tx.objectStore('settings').clear(),
  ]);
  await tx.done;
}
