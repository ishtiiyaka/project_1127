import { create } from 'zustand';
import type {
  Goal, DayEntry, DailyLog, WeeklyReview,
  MilestoneRecord, AppSettings, GoalNote, FocusSession
} from '../types';
import { LEVEL_THRESHOLDS } from '../types';
import {
  getAllGoals, saveGoal as dbSaveGoal, deleteGoal as dbDeleteGoal,
  getAllEntries, saveEntry as dbSaveEntry,
  getAllDailyLogs, saveDailyLog as dbSaveDailyLog,
  getAllReviews, saveReview as dbSaveReview,
  getAllMilestones, saveMilestone as dbSaveMilestone,
  getSettings, saveSettings as dbSaveSettings,
  getAllNotes, saveNote as dbSaveNote, deleteNote as dbDeleteNote,
  getAllFocusSessions, saveFocusSession as dbSaveFocusSession,
  clearAllData,
} from '../lib/db';
import { runAutoSeal } from '../lib/autoSeal';

// ─── XP helpers ──────────────────────────────────────────────────────────────
export function getLevelFromXP(xp: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return Math.min(level, 50);
}
export function getXPForNextLevel(level: number): number {
  return LEVEL_THRESHOLDS[Math.min(level, 49)] ?? LEVEL_THRESHOLDS[49];
}
export function getXPForCurrentLevel(level: number): number {
  return LEVEL_THRESHOLDS[Math.min(level - 1, 49)] ?? 0;
}

interface AppState {
  // Data
  goals: Goal[];
  entries: DayEntry[];
  dailyLogs: DailyLog[];
  reviews: WeeklyReview[];
  milestones: MilestoneRecord[];
  settings: AppSettings | null;
  notes: GoalNote[];
  focusSessions: FocusSession[];

  // UI state
  initialized: boolean;
  showCelebration: boolean;
  celebrationDay: number | null;

  // Init
  initialize: () => Promise<void>;

  // Goals
  addGoal: (goal: Goal) => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;

  // Entries
  addEntry: (entry: DayEntry) => Promise<void>;
  updateEntry: (entry: DayEntry) => Promise<void>;

  // Daily logs
  saveDailyLog: (log: DailyLog) => Promise<void>;

  // Weekly reviews
  saveWeeklyReview: (review: WeeklyReview) => Promise<void>;

  // Milestones
  unlockMilestone: (record: MilestoneRecord) => Promise<void>;
  dismissCelebration: () => void;

  // Settings
  saveSettings: (settings: AppSettings) => Promise<void>;
  patchSettings: (patch: Partial<AppSettings>) => Promise<void>;

  // XP
  addXP: (amount: number) => Promise<void>;

  // Notes
  addNote: (note: GoalNote) => Promise<void>;
  updateNote: (note: GoalNote) => Promise<void>;
  removeNote: (id: string) => Promise<void>;

  // Focus sessions
  addFocusSession: (session: FocusSession) => Promise<void>;

  // Reset
  resetAll: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  goals: [],
  entries: [],
  dailyLogs: [],
  reviews: [],
  milestones: [],
  settings: null,
  notes: [],
  focusSessions: [],
  initialized: false,
  showCelebration: false,
  celebrationDay: null,

  initialize: async () => {
    const [goals, entries, dailyLogs, reviews, milestones, settings, notes, focusSessions] = await Promise.all([
      getAllGoals(),
      getAllEntries(),
      getAllDailyLogs(),
      getAllReviews(),
      getAllMilestones(),
      getSettings(),
      getAllNotes(),
      getAllFocusSessions(),
    ]);

    // Migrate old settings that lack new fields
    let migratedSettings = settings ?? null;
    if (migratedSettings) {
      let changed = false;
      if (migratedSettings.xp === undefined) { (migratedSettings as AppSettings).xp = 0; changed = true; }
      if (migratedSettings.level === undefined) { (migratedSettings as AppSettings).level = 1; changed = true; }
      if (migratedSettings.streakFreezes === undefined) { (migratedSettings as AppSettings).streakFreezes = 3; changed = true; }
      if (migratedSettings.freezedDates === undefined) { (migratedSettings as AppSettings).freezedDates = []; changed = true; }
      if (migratedSettings.reminderTime === undefined) { (migratedSettings as AppSettings).reminderTime = null; changed = true; }
      if (migratedSettings.soundEnabled === undefined) { (migratedSettings as AppSettings).soundEnabled = true; changed = true; }
      if (migratedSettings.totalDays === undefined) { (migratedSettings as AppSettings).totalDays = 1127; changed = true; }
      if (changed) await dbSaveSettings(migratedSettings);
    }

    set({ goals, entries, dailyLogs, reviews, milestones, settings: migratedSettings, notes, focusSessions });

    if (migratedSettings && goals.length > 0) {
      const newEntries = await runAutoSeal(goals, migratedSettings);
      if (newEntries.length > 0) {
        set(state => ({ entries: [...state.entries, ...newEntries] }));
      }
    }

    set({ initialized: true });
  },

  addGoal: async (goal) => {
    await dbSaveGoal(goal);
    set(state => ({ goals: [...state.goals, goal] }));
  },

  updateGoal: async (goal) => {
    await dbSaveGoal(goal);
    set(state => ({ goals: state.goals.map(g => g.id === goal.id ? goal : g) }));
  },

  removeGoal: async (id) => {
    await dbDeleteGoal(id);
    set(state => ({ goals: state.goals.filter(g => g.id !== id) }));
  },

  addEntry: async (entry) => {
    await dbSaveEntry(entry);
    set(state => ({ entries: [...state.entries, entry] }));
  },

  updateEntry: async (entry) => {
    await dbSaveEntry(entry);
    set(state => ({ entries: state.entries.map(e => e.id === entry.id ? entry : e) }));
  },

  saveDailyLog: async (log) => {
    await dbSaveDailyLog(log);
    set(state => ({
      dailyLogs: state.dailyLogs.find(l => l.date === log.date)
        ? state.dailyLogs.map(l => l.date === log.date ? log : l)
        : [...state.dailyLogs, log]
    }));
  },

  saveWeeklyReview: async (review) => {
    await dbSaveReview(review);
    set(state => ({
      reviews: state.reviews.find(r => r.id === review.id)
        ? state.reviews.map(r => r.id === review.id ? review : r)
        : [...state.reviews, review]
    }));
  },

  unlockMilestone: async (record) => {
    await dbSaveMilestone(record);
    set(state => ({
      milestones: [...state.milestones.filter(m => m.day !== record.day), record],
      showCelebration: true,
      celebrationDay: record.day,
    }));
    // Award XP for milestone
    await get().addXP(200);
  },

  dismissCelebration: () => {
    set({ showCelebration: false, celebrationDay: null });
  },

  saveSettings: async (settings) => {
    await dbSaveSettings(settings);
    set({ settings });
  },

  patchSettings: async (patch) => {
    const current = get().settings;
    if (!current) return;
    const updated = { ...current, ...patch };
    await dbSaveSettings(updated);
    set({ settings: updated });
  },

  addXP: async (amount) => {
    const s = get().settings;
    if (!s) return;
    const newXP = s.xp + amount;
    const newLevel = getLevelFromXP(newXP);
    const updated = { ...s, xp: newXP, level: newLevel };
    await dbSaveSettings(updated);
    set({ settings: updated });
  },

  addNote: async (note) => {
    await dbSaveNote(note);
    set(state => ({ notes: [...state.notes, note] }));
  },

  updateNote: async (note) => {
    await dbSaveNote(note);
    set(state => ({ notes: state.notes.map(n => n.id === note.id ? note : n) }));
  },

  removeNote: async (id) => {
    await dbDeleteNote(id);
    set(state => ({ notes: state.notes.filter(n => n.id !== id) }));
  },

  addFocusSession: async (session) => {
    await dbSaveFocusSession(session);
    set(state => ({ focusSessions: [...state.focusSessions, session] }));
    // Award XP: 5 XP per focus minute (capped at 25min session = 125 XP)
    await get().addXP(Math.min(session.durationMinutes * 5, 125));
  },

  resetAll: async () => {
    await clearAllData();
    set({
      goals: [], entries: [], dailyLogs: [], reviews: [],
      milestones: [], settings: null, notes: [], focusSessions: [],
      showCelebration: false, celebrationDay: null,
    });
  },
}));
