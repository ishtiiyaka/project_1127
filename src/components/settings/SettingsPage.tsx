import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { settings, saveSettings, resetAll } = useAppStore();
  const [confirmReset, setConfirmReset] = useState(0); // 0, 1, 2, 3 = triple confirm

  if (!settings) return null;

  async function handleSave(patch: Partial<import('../../types').AppSettings>) {
    await saveSettings({ ...settings!, ...patch });
  }

  async function handleReset() {
    if (confirmReset < 2) {
      setConfirmReset(c => c + 1);
      return;
    }
    await resetAll();
    navigate('/onboard');
  }

  return (
    <div className="min-h-screen bg-black page-enter pb-8">
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

        {/* Export link */}
        <Link to="/export" className="card p-4 flex items-center justify-between group block">
          <div>
            <div className="font-mono text-sm text-text">Export Data</div>
            <div className="font-mono text-xs text-muted">PDF, CSV, per-goal export</div>
          </div>
          <span className="font-mono text-xs text-muted group-hover:text-accent transition-colors">→</span>
        </Link>

        {/* Danger zone */}
        <div className="card p-4 space-y-3 border-critical/30">
          <div className="font-mono text-xs text-critical tracking-widest">DANGER ZONE</div>
          <p className="font-mono text-xs text-muted leading-relaxed">
            Voiding the contract will permanently delete all entries, goals, milestones, and settings.
            This action cannot be undone.
          </p>
          <button
            className="btn-danger w-full py-3 font-display tracking-widest"
            onClick={handleReset}
          >
            {confirmReset === 0 ? 'VOID THE CONTRACT' :
             confirmReset === 1 ? 'ARE YOU SURE? CLICK AGAIN' :
             'FINAL WARNING — CLICK TO CONFIRM DELETION'}
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
