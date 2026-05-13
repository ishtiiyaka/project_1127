// ─── Core Types ────────────────────────────────────────────────────────────

export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type Mood = 1 | 2 | 3 | 4 | 5;
export type MilestoneDay = 100 | 250 | 500 | 750 | 1000 | 1127;
export type Theme = 'dark-terminal' | 'amber-retro' | 'blue-ice' | 'red-alert' | 'neon-cyber' | 'paper-light';
export type Frequency = 'daily' | '5x' | '3x' | 'weekdays';

export const TOTAL_DAYS = 1127; // default fallback only
export const MILESTONE_DAYS: MilestoneDay[] = [100, 250, 500, 750, 1000, 1127];

/** Compute milestone checkpoints scaled to a custom total duration */
export function getMilestoneDays(totalDays: number): number[] {
  if (totalDays <= 100) return [Math.round(totalDays * 0.5), totalDays];
  const pcts = [0.089, 0.222, 0.444, 0.666, 0.888, 1.0]; // same ratios as 1127
  return pcts.map(p => Math.round(totalDays * p)).filter((v, i, a) => a.indexOf(v) === i);
}

export const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 3800,
  4700, 5700, 6800, 8000, 9300, 10700, 12200, 13800, 15500, 17300,
  19200, 21200, 23300, 25500, 27800, 30200, 32700, 35300, 38000, 40800,
  43700, 46700, 49800, 53000, 56300, 59700, 63200, 66800, 70500, 74300,
  78200, 82200, 86300, 90500, 94800, 99200, 103700, 108300, 113000, 117800,
];

export interface Goal {
  id: string;
  name: string;
  priority: Priority;
  createdAt: string;
  locked: boolean;
  targetDays?: number;
  description?: string;
  frequency?: Frequency;
  scheduleSlots?: ScheduleSlot[];  // timetable slots
}

export interface ScheduleSlot {
  day: number;       // 0=Sun … 6=Sat
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
}

export interface DayEntry {
  id: string;
  goalId: string;
  date: string;
  content: string;
  isAutoFilled: boolean;
  sealed: boolean;
  createdAt: string;
  wordCount?: number;
  focusMinutes?: number;
}

export interface DailyLog {
  date: string;
  reflection: string;
  mood: Mood;
  sealed: boolean;
}

export interface WeeklyReview {
  id: string;
  weekStart: string;
  reflection: string;
  totalEntries: number;
  moodAverage: number;
  sealed: boolean;
  createdAt: string;
  challenge?: string;
}

export interface GoalSnapshot {
  goalId: string;
  name: string;
  completionRate: number;
}

export interface MilestoneRecord {
  day: MilestoneDay;
  unlockedAt: string;
  completionRate: number;
  totalEntries: number;
  longestStreak: number;
  moodAverage: number;
  goalSnapshots: GoalSnapshot[];
}

export interface AppSettings {
  startDate: string;
  goalCount: number;
  totalDays: number;        // user-chosen challenge duration (default 1127)
  weeklyTarget: number;
  weeklyReviewDay: number;
  notificationsEnabled: boolean;
  installBannerDismissed: boolean;
  theme: Theme;
  // XP / Level
  xp: number;
  level: number;
  // Streak Freezes
  streakFreezes: number;
  freezedDates: string[];
  // Notifications
  reminderTime: string | null;
  // Sound
  soundEnabled: boolean;
}

// ─── New feature types ────────────────────────────────────────────────────

export interface GoalNote {
  id: string;
  goalId: string;
  content: string;
  createdAt: string;
  pinned: boolean;
}

export interface FocusSession {
  id: string;
  goalId: string;
  date: string;
  durationMinutes: number;
  completedAt: string;
}

// ─── UI / helper types ────────────────────────────────────────────────────

export interface ProjectionResult {
  milestone: MilestoneDay;
  needed: number;
  projected: number;
  delta: number;
  status: 'on-track' | 'at-risk' | 'behind';
}

export interface ReportCardGrade {
  goalId: string;
  goalName: string;
  completionRate: number;
  streakScore: number;
  consistencyScore: number;
  overallGrade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  overallScore: number;
}
