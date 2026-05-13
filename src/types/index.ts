// ─── Core Types ────────────────────────────────────────────────────────────

export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type Mood = 1 | 2 | 3 | 4 | 5;
export type MilestoneDay = 100 | 250 | 500 | 750 | 1000 | 1127;

export const TOTAL_DAYS = 1127;
export const MILESTONE_DAYS: MilestoneDay[] = [100, 250, 500, 750, 1000, 1127];

export interface Goal {
  id: string;
  name: string;
  priority: Priority;
  createdAt: string; // ISO string
  locked: boolean;
  targetDays?: number;   // projected study days to complete this goal
  description?: string;  // optional short description
}

export interface DayEntry {
  id: string;
  goalId: string;
  date: string;        // YYYY-MM-DD
  content: string;     // max 280 chars; "Nothing" if auto-filled
  isAutoFilled: boolean;
  sealed: boolean;
  createdAt: string;
}

export interface DailyLog {
  date: string;        // YYYY-MM-DD
  reflection: string;  // max 500 chars
  mood: Mood;
  sealed: boolean;
}

export interface WeeklyReview {
  id: string;
  weekStart: string;   // YYYY-MM-DD (Monday)
  reflection: string;  // max 500 chars
  totalEntries: number;
  moodAverage: number;
  sealed: boolean;
  createdAt: string;
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
  startDate: string;             // YYYY-MM-DD
  goalCount: number;             // 1–7
  weeklyTarget: number;          // 1–7
  weeklyReviewDay: number;       // 0=Sun … 6=Sat
  notificationsEnabled: boolean;
  installBannerDismissed: boolean;
  theme: 'dark-terminal';
}

// ─── UI / helper types ────────────────────────────────────────────────────

export interface ProjectionResult {
  milestone: MilestoneDay;
  needed: number;
  projected: number;
  delta: number;               // positive = ahead, negative = behind
  status: 'on-track' | 'at-risk' | 'behind';
}
