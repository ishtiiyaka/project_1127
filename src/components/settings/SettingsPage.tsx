import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { requestNotificationPermission, scheduleReminderNotification, cancelReminderNotification } from '../../lib/notifications';
import { uid } from '../../lib/dateUtils';
import type { Theme, Goal, Priority } from '../../types';

const PRIORITIES: Priority[] = ['critical', 'high', 'medium', 'low'];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const THEMES: { id: Theme; label: string; accent: string; bg: string; description: string }[] = [
  { id: 'dark-terminal', label: 'TERMINAL', accent: '#00ff41', bg: '#000000', description: 'Matrix green on black' },
  { id: 'amber-retro',   label: 'AMBER',    accent: '#ffb300', bg: '#0d0800', description: 'Old CRT monitor' },
  { id: 'blue-ice',      label: 'ICE',      accent: '#00d4ff', bg: '#00080f', description: 'Arctic blue haze' },
  { id: 'red-alert',     label: 'ALERT',    accent: '#ff2222', bg: '#0d0000', description: 'Critical system mode' },
  { id: 'neon-cyber',    label: 'CYBER',    accent: '#cc00ff', bg: '#0a0015', description: 'Cyberpunk purple glow' },
  { id: 'paper-light',   label: 'PAPER',    accent: '#1a6b3c', bg: '#fafaf8', description: 'Clean minimal light' },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { settings, patchSettings, resetAll, goals, addGoal, updateGoal, removeGoal } = useAppStore();
  const [confirmReset, setConfirmReset] = useState(0);
  const [notifStatus, setNotifStatus] = useState<string | null>(null);

  // Goal management state
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalPriority, setNewGoalPriority] = useState<Priority>('high');
  const [newGoalTargetDays, setNewGoalTargetDays] = useState(365);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showAddGoal, setShowAddGoal] = useState(false);

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

  // Goal management handlers
  function startEditGoal(goal: Goal) {
    setEditingGoal(goal);
    setNewGoalName(goal.name);
    setNewGoalPriority(goal.priority);
    setNewGoalTargetDays(goal.targetDays ?? 365);
    setShowAddGoal(false);
  }

  function cancelGoalEdit() {
    setEditingGoal(null);
    setShowAddGoal(false);
    setNewGoalName('');
    setNewGoalPriority('high');
    setNewGoalTargetDays(365);
  }

  async function handleSaveGoal() {
    if (!newGoalName.trim()) return;
    if (editingGoal) {
      await updateGoal({
        ...editingGoal,
        name: newGoalName.trim(),
        priority: newGoalPriority,
        targetDays: newGoalTargetDays,
      });
    } else {
      await addGoal({
        id: uid(),
        name: newGoalName.trim(),
        priority: newGoalPriority,
        createdAt: new Date().toISOString(),
        locked: false,
        targetDays: newGoalTargetDays,
      });
      await patchSettings({ goalCount: goals.length + 1 });
    }
    cancelGoalEdit();
  }

  async function handleDeleteGoal(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    await removeGoal(id);
    await patchSettings({ goalCount: Math.max(goals.length - 1, 1) });
    setConfirmDeleteId(null);
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

        {/* Goal Management */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-mono text-xs text-muted tracking-widest">MANAGE GOALS</div>
            {goals.length < 7 && !showAddGoal && !editingGoal && (
              <button
                className="font-mono text-xs text-accent hover:text-accent/70 transition-colors"
                onClick={() => { setShowAddGoal(true); setEditingGoal(null); setNewGoalName(''); setNewGoalPriority('high'); setNewGoalTargetDays(365); }}
              >
                + ADD GOAL
              </button>
            )}
          </div>

          {/* Add / Edit form */}
          {(showAddGoal || editingGoal) && (
            <div className="border border-border p-3 space-y-3">
              <div className="font-mono text-xs text-accent">{editingGoal ? 'EDIT GOAL' : 'NEW GOAL'}</div>
              <input
                className="input text-sm"
                placeholder="Goal name..."
                maxLength={80}
                value={newGoalName}
                onChange={e => setNewGoalName(e.target.value)}
                autoFocus
              />
              <div className="space-y-1">
                <div className="font-mono text-xs text-muted">PRIORITY</div>
                <div className="flex gap-1">
                  {PRIORITIES.map(p => (
                    <button
                      key={p}
                      onClick={() => setNewGoalPriority(p)}
                      className={`text-xs font-mono border px-2 py-1 transition-all priority-${p} ${newGoalPriority === p ? 'bg-current/10' : 'opacity-40'}`}
                    >
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted shrink-0">TARGET DAYS</span>
                <input
                  type="number"
                  min={30}
                  max={1127}
                  className="input w-20 text-sm text-center"
                  value={newGoalTargetDays}
                  onChange={e => setNewGoalTargetDays(Math.max(30, Math.min(1127, Number(e.target.value))))}
                />
              </div>
              <div className="flex gap-2">
                <button className="btn-ghost flex-1 py-2 text-xs" onClick={cancelGoalEdit}>CANCEL</button>
                <button
                  className="btn-primary flex-1 py-2 text-xs"
                  disabled={!newGoalName.trim()}
                  onClick={handleSaveGoal}
                >
                  {editingGoal ? 'SAVE CHANGES' : 'ADD GOAL'}
                </button>
              </div>
            </div>
          )}

          {/* Goals list */}
          <div className="space-y-2">
            {goals.map(goal => (
              <div
                key={goal.id}
                className="flex items-center gap-2 border border-border px-3 py-2"
                style={{ borderLeft: `2px solid var(--${goal.priority === 'critical' ? 'critical' : goal.priority === 'high' ? 'high' : goal.priority === 'medium' ? 'medium' : 'low'})` }}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs text-text truncate">{goal.name}</div>
                  <div className="font-mono text-xs text-muted">{goal.priority.toUpperCase()} · {goal.targetDays ?? 365}d target</div>
                </div>
                <button
                  className="font-mono text-xs text-muted hover:text-accent transition-colors px-2 py-1 shrink-0"
                  onClick={() => startEditGoal(goal)}
                >
                  EDIT
                </button>
                <button
                  className={`font-mono text-xs px-2 py-1 shrink-0 transition-colors ${confirmDeleteId === goal.id ? 'text-critical border border-critical' : 'text-muted hover:text-critical'}`}
                  onClick={() => handleDeleteGoal(goal.id)}
                  disabled={goals.length <= 1}
                  title={goals.length <= 1 ? 'Cannot delete last goal' : ''}
                >
                  {confirmDeleteId === goal.id ? 'CONFIRM?' : 'DEL'}
                </button>
              </div>
            ))}
            {confirmDeleteId && (
              <div className="flex justify-end">
                <button className="font-mono text-xs text-muted hover:text-text px-2" onClick={() => setConfirmDeleteId(null)}>
                  cancel delete
                </button>
              </div>
            )}
          </div>
          <div className="font-mono text-xs text-muted">
            {goals.length}/7 goals · Deleting a goal keeps its entry history in the archive.
          </div>
        </div>

        {/* Theme */}
        <div className="card p-4 space-y-3">
          <div className="font-mono text-xs text-muted tracking-widest">THEME</div>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => handleTheme(t.id)}
                className="py-3 px-2 font-mono text-xs border transition-all flex flex-col items-center gap-1.5"
                style={{
                  borderColor: settings.theme === t.id ? t.accent : 'var(--border)',
                  color: settings.theme === t.id ? t.accent : 'var(--text-muted)',
                  background: settings.theme === t.id ? `${t.accent}18` : 'transparent',
                }}
              >
                {/* Mini preview swatch */}
                <div className="w-10 h-6 flex items-center justify-center" style={{ background: t.bg, border: `1px solid ${t.accent}`, borderRadius: 3 }}>
                  <div className="w-5 h-1 rounded-full" style={{ background: t.accent }} />
                </div>
                <span className="font-display font-bold" style={{ fontSize: '10px' }}>{t.label}</span>
                <span className="text-center leading-tight opacity-60" style={{ fontSize: '8px' }}>{t.description}</span>
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
