import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { requestNotificationPermission, scheduleReminderNotification, cancelReminderNotification } from '../../lib/notifications';
import type { Theme } from '../../types';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const THEMES: { id: Theme; label: string; accent: string }[] = [
  { id: 'dark-terminal', label: 'TERMINAL', accent: '#00ff41' },
  { id: 'amber-retro',   label: 'AMBER',    accent: '#ffb300' },
  { id: 'blue-ice',      label: 'ICE',      accent: '#00d4ff' },
  { id: 'red-alert',     label: 'ALERT',    accent: '#ff2222' },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { settings, patchSettings, resetAll, goals } = useAppStore();
  const [confirmReset, setConfirmReset] = useState(0);
  const [notifStatus, setNotifStatus] = useState<string | null>(null);

  if (!settings) return null;

  async function handleSave(patch: Partial<import('../../types').AppSettings>) {
    await patchSettings(patch);
  }

  async function handleTheme(theme: Theme) {
    await patchSettings({ theme });
    document.documentElement.setAttribute('data-theme', theme);
  }

  async function handleReset() {
    if (confirmReset < 2) { setConfirmReset(c => c + 1); return; }
    await resetAll();
    navigate('/onboard');
  }

  async function handleUseFreeze() {
    if (!settings) return;
    if (settings.streakFreezes <= 0) return;
    const today = new Date().toISOString().slice(0, 10);
    if (settings.freezedDates.includes(today)) return;
    await patchSettings({
      streakFreezes: settings.streakFreezes - 1,
      freezedDates: [...settings.freezedDates, today],
    });
  }

  async function handleToggleNotifications() {
    if (!settings) return;
    if (!settings.notificationsEnabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        setNotifStatus('Permission denied. Enable notifications in browser settings.');
        return;
      }
      const time = settings.reminderTime ?? '20:00';
      scheduleReminderNotification(time, goals.length);
      await patchSettings({ notificationsEnabled: true, reminderTime: time });
      setNotifStatus('Notifications enabled!');
    } else {
      cancelReminderNotification();
      await patchSettings({ notificationsEnabled: false });
      setNotifStatus(null);
    }
  }

  async function handleReminderTime(time: string) {
    if (!settings) return;
    await patchSettings({ reminderTime: time });
    if (settings.notificationsEnabled) {
      scheduleReminderNotification(time, goals.length);
    }
  }

  return (
    <div className="min-h-screen bg-black page-enter" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 72px)' }}>
      <div className="sticky top-0 bg-black border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/" className="font-mono text-xs text-muted hover:text-accent">← BACK</Link>
        <div className="font-display text-accent text-sm tracking-widest">SETTINGS</div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-5">

        {/* Journey info */}
        <div className="card p-4 space-y-2">
          <div className="font-mono text-xs text-muted tracking-widest">JOURNEY</div>
          <div className="flex justify-between font-mono text-sm">
            <span className="text-muted">START DATE</span>
            <span className="text-accent">{settings.startDate}</span>
          </div>
          <div className="flex justify-between font-mono text-sm">
            <span className="text-muted">GOAL COUNT</span>
            <span className="text-accent">{settings.goalCount}</span>
          </div>
          <div className="flex justify-between font-mono text-sm">
            <span className="text-muted">LEVEL</span>
            <span className="text-accent">{settings.level} ({settings.xp} XP)</span>
          </div>
        </div>

        {/* Theme */}
        <div className="card p-4 space-y-3">
          <div className="font-mono text-xs text-muted tracking-widest">THEME</div>
          <div className="grid grid-cols-4 gap-2">
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => handleTheme(t.id)}
                className="py-3 font-mono text-xs border transition-all flex flex-col items-center gap-1"
                style={{
                  borderColor: settings.theme === t.id ? t.accent : 'var(--border)',
                  color: settings.theme === t.id ? t.accent : 'var(--text-muted)',
                  background: settings.theme === t.id ? `${t.accent}15` : 'transparent',
                }}
              >
                <div className="w-4 h-4 rounded-full" style={{ background: t.accent }} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Weekly target */}
        <div className="card p-4 space-y-3">
          <div className="font-mono text-xs text-muted tracking-widest">WEEKLY LOGGING TARGET</div>
          <div className="flex items-center gap-4">
            <input
              type="range" min={1} max={7} value={settings.weeklyTarget}
              onChange={e => handleSave({ weeklyTarget: Number(e.target.value) })}
              className="flex-1 accent-accent"
            />
            <span className="font-display text-accent text-xl font-bold w-8 text-center">
              {settings.weeklyTarget}
            </span>
          </div>
          <p className="font-mono text-xs text-muted">
            {settings.weeklyTarget === 7 ? 'Every single day.' : `${settings.weeklyTarget} days per week.`}
          </p>
        </div>

        {/* Weekly review day */}
        <div className="card p-4 space-y-3">
          <div className="font-mono text-xs text-muted tracking-widest">WEEKLY REVIEW DAY</div>
          <div className="grid grid-cols-7 gap-1">
            {DAY_NAMES.map((name, i) => (
              <button
                key={i}
                onClick={() => handleSave({ weeklyReviewDay: i })}
                className={`py-2 text-xs font-mono border transition-all ${
                  settings.weeklyReviewDay === i
                    ? 'border-accent text-accent bg-accent/10'
                    : 'border-border text-muted hover:border-accent/50'
                }`}
              >
                {name.slice(0, 3).toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Sound */}
        <div className="card p-4 space-y-3">
          <div className="font-mono text-xs text-muted tracking-widest">SOUND EFFECTS</div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-text">Sound on seal, milestone, level up</span>
            <button
              onClick={() => {
                const next = !settings.soundEnabled;
                patchSettings({ soundEnabled: next });
                localStorage.setItem('soundEnabled', String(next));
              }}
              className={`font-mono text-xs border px-4 py-2 transition-all ${
                settings.soundEnabled
                  ? 'border-accent text-accent bg-accent/10'
                  : 'border-border text-muted'
              }`}
            >
              {settings.soundEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="card p-4 space-y-3">
          <div className="font-mono text-xs text-muted tracking-widest">DAILY REMINDER</div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-text">Push notification reminder</span>
            <button
              onClick={handleToggleNotifications}
              className={`font-mono text-xs border px-4 py-2 transition-all ${
                settings.notificationsEnabled
                  ? 'border-accent text-accent bg-accent/10'
                  : 'border-border text-muted'
              }`}
            >
              {settings.notificationsEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          {settings.notificationsEnabled && (
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-muted">REMINDER TIME</span>
              <input
                type="time"
                className="input w-auto text-xs"
                value={settings.reminderTime ?? '20:00'}
                onChange={e => handleReminderTime(e.target.value)}
              />
            </div>
          )}
          {notifStatus && (
            <div className="font-mono text-xs text-muted">{notifStatus}</div>
          )}
        </div>

        {/* Streak Freezes */}
        <div className="card p-4 space-y-3">
          <div className="font-mono text-xs text-muted tracking-widest">STREAK FREEZES</div>
          <p className="font-mono text-xs text-muted leading-relaxed">
            Use a freeze token to protect your streak on a missed day (sick, emergency).
            You have <span className="text-accent">{settings.streakFreezes}</span> freeze{settings.streakFreezes !== 1 ? 's' : ''} remaining.
          </p>
          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-8 h-8 border flex items-center justify-center font-mono text-sm transition-all"
                style={{
                  borderColor: i < settings.streakFreezes ? 'var(--low)' : 'var(--border)',
                  color: i < settings.streakFreezes ? 'var(--low)' : 'var(--text-muted)',
                  background: i < settings.streakFreezes ? 'rgba(0,191,255,0.1)' : 'transparent',
                }}
              >
                ❄
              </div>
            ))}
          </div>
          {settings.freezedDates.length > 0 && (
            <div className="font-mono text-xs text-muted">
              Used on: {settings.freezedDates.slice(-3).join(', ')}
            </div>
          )}
          <button
            className="btn-ghost w-full py-2 text-xs"
            disabled={settings.streakFreezes <= 0 || settings.freezedDates.includes(new Date().toISOString().slice(0, 10))}
            onClick={handleUseFreeze}
          >
            {settings.freezedDates.includes(new Date().toISOString().slice(0, 10))
              ? '✓ FREEZE USED TODAY'
              : settings.streakFreezes <= 0
              ? 'NO FREEZES REMAINING'
              : '❄ USE FREEZE FOR TODAY'}
          </button>
        </div>

        {/* Export & Backup */}
        <Link to="/export" className="card p-4 flex items-center justify-between group block">
          <div>
            <div className="font-mono text-sm text-text">Export & Backup</div>
            <div className="font-mono text-xs text-muted">PDF, CSV, JSON backup/restore</div>
          </div>
          <span className="font-mono text-xs text-muted group-hover:text-accent transition-colors">→</span>
        </Link>

        {/* Archive */}
        <Link to="/archive" className="card p-4 flex items-center justify-between group block">
          <div>
            <div className="font-mono text-sm text-text">Archive</div>
            <div className="font-mono text-xs text-muted">Browse all past entries</div>
          </div>
          <span className="font-mono text-xs text-muted group-hover:text-accent transition-colors">→</span>
        </Link>

        {/* Report Card */}
        <Link to="/report" className="card p-4 flex items-center justify-between group block">
          <div>
            <div className="font-mono text-sm text-text">Report Card</div>
            <div className="font-mono text-xs text-muted">Grades, scores, PNG export</div>
          </div>
          <span className="font-mono text-xs text-muted group-hover:text-accent transition-colors">→</span>
        </Link>

        {/* Danger zone */}
        <div className="card p-4 space-y-3 border-critical/30">
          <div className="font-mono text-xs text-critical tracking-widest">DANGER ZONE</div>
          <p className="font-mono text-xs text-muted leading-relaxed">
            Voiding the contract permanently deletes all entries, goals, milestones, and settings.
          </p>
          <button
            className="btn-danger w-full py-3 font-display tracking-widest"
            onClick={handleReset}
          >
            {confirmReset === 0 ? 'VOID THE CONTRACT' :
             confirmReset === 1 ? 'ARE YOU SURE? CLICK AGAIN' :
             'FINAL WARNING — CLICK TO CONFIRM'}
          </button>
          {confirmReset > 0 && (
            <button
              className="btn-ghost w-full py-2 text-xs"
              onClick={() => setConfirmReset(0)}
            >
              CANCEL
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
