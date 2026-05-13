import { create } from 'zustand';
import type {
  Goal, DayEntry, DailyLog, WeeklyReview,
  MilestoneRecord, AppSettings
} from '../types';
import {
  getAllGoals, saveGoal as dbSaveGoal, deleteGoal as dbDeleteGoal,
  getAllEntries, saveEntry as dbSaveEntry,
  getAllDailyLogs, saveDailyLog as dbSaveDailyLog,
  getAllReviews, saveReview as dbSaveReview,
  getAllMilestones, saveMilestone as dbSaveMilestone,
  getSettings, saveSettings as dbSaveSettings,
  clearAllData,
} from '../lib/db';
import { runAutoSeal } from '../lib/autoSeal';

interface AppState {
  // Data
  goals: Goal[];
  entries: DayEntry[];
  dailyLogs: DailyLog[];
  reviews: WeeklyReview[];
  milestones: MilestoneRecord[];
  settings: AppSettings | null;

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

  // Reset
  resetAll: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  goals: [],
  entries: [],
  dailyLogs: [],
  reviews: [],
  milestones: [],
  settings: null,
  initialized: false,
  showCelebration: false,
  celebrationDay: null,

  initialize: async () => {
    const [goals, entries, dailyLogs, reviews, milestones, settings] = await Promise.all([
      getAllGoals(),
      getAllEntries(),
      getAllDailyLogs(),
      getAllReviews(),
      getAllMilestones(),
      getSettings(),
    ]);

    set({ goals, entries, dailyLogs, reviews, milestones, settings: settings ?? null });

    // Run zero-skip enforcement if we have settings and goals
    if (settings && goals.length > 0) {
      const newEntries = await runAutoSeal(goals, settings);
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
  },

  dismissCelebration: () => {
    set({ showCelebration: false, celebrationDay: null });
  },

  saveSettings: async (settings) => {
    await dbSaveSettings(settings);
    set({ settings });
  },

  resetAll: async () => {
    await clearAllData();
    set({
      goals: [], entries: [], dailyLogs: [], reviews: [],
      milestones: [], settings: null,
      showCelebration: false, celebrationDay: null,
    });
  },
}));
