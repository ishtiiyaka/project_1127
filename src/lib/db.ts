import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Goal, DayEntry, DailyLog, WeeklyReview, MilestoneRecord, AppSettings, GoalNote, FocusSession } from '../types';

interface P1127DB extends DBSchema {
  goals: { key: string; value: Goal };
  entries: { key: string; value: DayEntry; indexes: { 'by-goal': string; 'by-date': string; 'by-goal-date': [string, string] } };
  dailyLogs: { key: string; value: DailyLog };
  weeklyReviews: { key: string; value: WeeklyReview };
  milestones: { key: number; value: MilestoneRecord };
  settings: { key: string; value: AppSettings };
  goalNotes: { key: string; value: GoalNote; indexes: { 'by-goal': string } };
  focusSessions: { key: string; value: FocusSession; indexes: { 'by-goal': string; 'by-date': string } };
}

let dbInstance: IDBPDatabase<P1127DB> | null = null;

export async function getDB(): Promise<IDBPDatabase<P1127DB>> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB<P1127DB>('project-1127', 2, {
    upgrade(db, oldVersion) {
      // Version 1 stores
      if (oldVersion < 1) {
        db.createObjectStore('goals', { keyPath: 'id' });
        const entryStore = db.createObjectStore('entries', { keyPath: 'id' });
        entryStore.createIndex('by-goal', 'goalId');
        entryStore.createIndex('by-date', 'date');
        entryStore.createIndex('by-goal-date', ['goalId', 'date']);
        db.createObjectStore('dailyLogs', { keyPath: 'date' });
        db.createObjectStore('weeklyReviews', { keyPath: 'id' });
        db.createObjectStore('milestones', { keyPath: 'day' });
        db.createObjectStore('settings', { keyPath: 'startDate' });
      }
      // Version 2 stores — new features
      if (oldVersion < 2) {
        const notesStore = db.createObjectStore('goalNotes', { keyPath: 'id' });
        notesStore.createIndex('by-goal', 'goalId');
        const focusStore = db.createObjectStore('focusSessions', { keyPath: 'id' });
        focusStore.createIndex('by-goal', 'goalId');
        focusStore.createIndex('by-date', 'date');
      }
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

// ─── Goal Notes ───────────────────────────────────────────────────────────────
export async function getAllNotes(): Promise<GoalNote[]> {
  return (await getDB()).getAll('goalNotes');
}
export async function getNotesForGoal(goalId: string): Promise<GoalNote[]> {
  return (await getDB()).getAllFromIndex('goalNotes', 'by-goal', goalId);
}
export async function saveNote(note: GoalNote): Promise<void> {
  await (await getDB()).put('goalNotes', note);
}
export async function deleteNote(id: string): Promise<void> {
  await (await getDB()).delete('goalNotes', id);
}

// ─── Focus Sessions ───────────────────────────────────────────────────────────
export async function getAllFocusSessions(): Promise<FocusSession[]> {
  return (await getDB()).getAll('focusSessions');
}
export async function saveFocusSession(session: FocusSession): Promise<void> {
  await (await getDB()).put('focusSessions', session);
}

// ─── Backup / Restore ────────────────────────────────────────────────────────
export interface FullBackup {
  version: number;
  exportedAt: string;
  goals: Goal[];
  entries: DayEntry[];
  dailyLogs: DailyLog[];
  weeklyReviews: WeeklyReview[];
  milestones: MilestoneRecord[];
  settings: AppSettings | undefined;
  goalNotes: GoalNote[];
  focusSessions: FocusSession[];
}

export async function exportBackup(): Promise<FullBackup> {
  const db = await getDB();
  const [goals, entries, dailyLogs, weeklyReviews, milestones, allSettings, goalNotes, focusSessions] = await Promise.all([
    db.getAll('goals'),
    db.getAll('entries'),
    db.getAll('dailyLogs'),
    db.getAll('weeklyReviews'),
    db.getAll('milestones'),
    db.getAll('settings'),
    db.getAll('goalNotes'),
    db.getAll('focusSessions'),
  ]);
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    goals, entries, dailyLogs, weeklyReviews, milestones,
    settings: allSettings[0],
    goalNotes, focusSessions,
  };
}

export async function importBackup(backup: FullBackup): Promise<void> {
  const db = await getDB();
  const stores = ['goals', 'entries', 'dailyLogs', 'weeklyReviews', 'milestones', 'settings', 'goalNotes', 'focusSessions'] as const;
  const clearTx = db.transaction(stores, 'readwrite');
  await Promise.all(stores.map(s => clearTx.objectStore(s).clear()));
  await clearTx.done;

  const tx = db.transaction(stores, 'readwrite');
  await Promise.all([
    ...backup.goals.map(r => tx.objectStore('goals').put(r)),
    ...backup.entries.map(r => tx.objectStore('entries').put(r)),
    ...backup.dailyLogs.map(r => tx.objectStore('dailyLogs').put(r)),
    ...backup.weeklyReviews.map(r => tx.objectStore('weeklyReviews').put(r)),
    ...backup.milestones.map(r => tx.objectStore('milestones').put(r)),
    ...(backup.settings ? [tx.objectStore('settings').put(backup.settings)] : []),
    ...(backup.goalNotes ?? []).map(r => tx.objectStore('goalNotes').put(r)),
    ...(backup.focusSessions ?? []).map(r => tx.objectStore('focusSessions').put(r)),
  ]);
  await tx.done;
}

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const stores = ['goals', 'entries', 'dailyLogs', 'weeklyReviews', 'milestones', 'settings', 'goalNotes', 'focusSessions'] as const;
  const tx = db.transaction(stores, 'readwrite');
  await Promise.all(stores.map(s => tx.objectStore(s).clear()));
  await tx.done;
}
