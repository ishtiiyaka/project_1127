import { TOTAL_DAYS as DEFAULT_TOTAL_DAYS } from '../types';

/** Today as YYYY-MM-DD */
export function today(): string {
  return formatDate(new Date());
}

/** Format a Date to YYYY-MM-DD */
export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse YYYY-MM-DD to a local Date (midnight) */
export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** 1-based day number in the journey */
export function getDayNumber(startDate: string, totalDays = DEFAULT_TOTAL_DAYS): number {
  const start = parseDate(startDate);
  const now = parseDate(today());
  const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(Math.max(diff + 1, 1), totalDays);
}

/** Days remaining in the journey */
export function getDaysRemaining(startDate: string, totalDays = DEFAULT_TOTAL_DAYS): number {
  return Math.max(totalDays - getDayNumber(startDate, totalDays) + 1, 0);
}

/** All dates from startDate up to and including yesterday (YYYY-MM-DD[]) */
export function getPastDates(startDate: string): string[] {
  const start = parseDate(startDate);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dates: string[] = [];
  const cursor = new Date(start);
  while (cursor <= yesterday) {
    dates.push(formatDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

/** Monday of the week containing date */
export function getWeekStart(date: string): string {
  const d = parseDate(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return formatDate(d);
}

/**
 * Streak: consecutive days (ending today or yesterday) where
 * the given set of logged dates contains an entry
 */
export function getStreakLength(loggedDates: Set<string>, startDate: string): number {
  let streak = 0;
  const start = parseDate(startDate);
  const todayStr = today();
  const cursor = parseDate(todayStr);

  // Check if today has an entry; if not, start from yesterday
  if (!loggedDates.has(todayStr)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (cursor >= start) {
    const ds = formatDate(cursor);
    if (loggedDates.has(ds)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/** Longest ever streak in a set of logged dates */
export function getLongestStreak(loggedDates: Set<string>, startDate: string): number {
  const past = getPastDates(startDate);
  const todayDates = [...past, today()];
  let longest = 0;
  let current = 0;
  for (const d of todayDates) {
    if (loggedDates.has(d)) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 0;
    }
  }
  return longest;
}

/** Completion rate 0–100 for a goal based on real (non-auto) entries */
export function getCompletionRate(realEntryDates: Set<string>, startDate: string): number {
  const dayNum = getDayNumber(startDate);
  if (dayNum <= 1) return 0;
  const elapsed = dayNum - 1; // days that have fully passed
  return Math.round((realEntryDates.size / elapsed) * 100);
}

/** Whether today is a given weekday (0=Sun … 6=Sat) */
export function isTodayWeekday(weekday: number): boolean {
  return new Date().getDay() === weekday;
}

/** Generate a unique id */
export function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
