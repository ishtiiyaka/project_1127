export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function scheduleReminderNotification(time: string, goalCount: number): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const [hh, mm] = time.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hh, mm, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);

  const msUntil = target.getTime() - now.getTime();
  // Store timeout ID in localStorage so it survives navigation
  const existingId = localStorage.getItem('reminderTimeoutId');
  if (existingId) clearTimeout(Number(existingId));

  const id = window.setTimeout(() => {
    new Notification('PROJECT 1127', {
      body: `Time to log your ${goalCount} commitment${goalCount !== 1 ? 's' : ''}. Don't break the streak.`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'daily-reminder',
    });
    // Re-schedule for tomorrow
    scheduleReminderNotification(time, goalCount);
  }, msUntil);

  localStorage.setItem('reminderTimeoutId', String(id));
}

export function cancelReminderNotification(): void {
  const existingId = localStorage.getItem('reminderTimeoutId');
  if (existingId) clearTimeout(Number(existingId));
  localStorage.removeItem('reminderTimeoutId');
}
