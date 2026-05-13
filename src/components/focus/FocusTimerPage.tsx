import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { today, uid } from '../../lib/dateUtils';
import { playFocusStart, playFocusEnd, playClick } from '../../lib/sounds';

const MODES = [
  { label: '25 MIN', minutes: 25 },
  { label: '50 MIN', minutes: 50 },
  { label: '10 MIN', minutes: 10 },
  { label: '5 MIN BREAK', minutes: 5 },
];

export default function FocusTimerPage() {
  const { goals, settings, addFocusSession } = useAppStore();
  const [selectedGoalId, setSelectedGoalId] = useState(goals[0]?.id ?? '');
  const [modeIdx, setModeIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(MODES[0].minutes * 60);
  const [sessionsToday, setSessionsToday] = useState(0);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const mode = MODES[modeIdx];
  const totalSeconds = mode.minutes * 60;

  useEffect(() => {
    setSecondsLeft(mode.minutes * 60);
    setRunning(false);
    setCompleted(false);
  }, [modeIdx, mode.minutes]);

  useEffect(() => {
    if (running) {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            setCompleted(true);
            handleSessionComplete();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]); // eslint-disable-line

  async function handleSessionComplete() {
    playFocusEnd();
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 60000);
    if (elapsed >= 1 && selectedGoalId && mode.label !== '5 MIN BREAK') {
      await addFocusSession({
        id: uid(),
        goalId: selectedGoalId,
        date: today(),
        durationMinutes: elapsed,
        completedAt: new Date().toISOString(),
      });
      setSessionsToday(s => s + 1);
    }
  }

  function handleStart() {
    if (!selectedGoalId && mode.label !== '5 MIN BREAK') return;
    playFocusStart();
    setCompleted(false);
    setRunning(true);
  }

  function handlePause() {
    playClick();
    setRunning(false);
  }

  function handleReset() {
    playClick();
    setRunning(false);
    setCompleted(false);
    setSecondsLeft(totalSeconds);
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const isBreak = mode.label === '5 MIN BREAK';

  if (!settings) return null;

  const todaySessions = useAppStore.getState().focusSessions.filter(s => s.date === today());
  const todayMinutes = todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0);

  return (
    <div className="min-h-screen bg-black page-enter pb-8">
      <div className="sticky top-0 bg-black border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/" className="font-mono text-xs text-muted hover:text-accent">← BACK</Link>
        <div className="font-display text-accent text-sm tracking-widest">FOCUS TIMER</div>
        <div className="ml-auto font-mono text-xs text-muted">{todayMinutes} MIN TODAY</div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-6">

        {/* Mode selector */}
        <div className="grid grid-cols-4 gap-2">
          {MODES.map((m, i) => (
            <button
              key={m.label}
              onClick={() => { playClick(); setModeIdx(i); }}
              className={`py-2 px-1 font-mono text-xs border transition-all ${
                modeIdx === i ? 'border-accent text-accent bg-accent/10' : 'border-border text-muted'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Goal selector */}
        {!isBreak && (
          <div className="space-y-2">
            <div className="font-mono text-xs text-muted tracking-widest">FOCUSING ON</div>
            <select
              className="input w-full"
              value={selectedGoalId}
              onChange={e => setSelectedGoalId(e.target.value)}
            >
              {goals.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Timer display */}
        <div className="card p-8 text-center space-y-6">
          {/* Circular progress */}
          <div className="relative mx-auto" style={{ width: 200, height: 200 }}>
            <svg width="200" height="200" viewBox="0 0 200 200" className="-rotate-90">
              <circle cx="100" cy="100" r="88" fill="none" stroke="var(--border)" strokeWidth="6" />
              <circle
                cx="100" cy="100" r="88"
                fill="none"
                stroke={isBreak ? 'var(--low)' : 'var(--accent)'}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 88}`}
                strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
                style={{ transition: 'stroke-dashoffset 1s linear', filter: `drop-shadow(0 0 6px ${isBreak ? 'var(--low)' : 'var(--accent)'})` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-display text-4xl font-bold tracking-widest" style={{ color: isBreak ? 'var(--low)' : 'var(--accent)' }}>
                {mm}:{ss}
              </div>
              <div className="font-mono text-xs text-muted mt-1">
                {isBreak ? 'BREAK' : running ? 'FOCUS' : completed ? 'DONE' : 'READY'}
              </div>
            </div>
          </div>

          {/* Completed message */}
          {completed && !isBreak && (
            <div className="font-mono text-xs text-accent border border-accent/30 px-3 py-2 animate-pulse">
              ✓ SESSION LOGGED — +XP EARNED
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-3 justify-center">
            {!running ? (
              <button
                className="btn-primary flex-1 py-3 text-sm"
                onClick={handleStart}
                disabled={!isBreak && !selectedGoalId}
              >
                {completed ? 'NEW SESSION' : secondsLeft < totalSeconds ? 'RESUME' : 'START'}
              </button>
            ) : (
              <button className="btn-ghost flex-1 py-3 text-sm" onClick={handlePause}>
                PAUSE
              </button>
            )}
            <button className="btn-ghost py-3 px-5" onClick={handleReset}>RESET</button>
          </div>
        </div>

        {/* Today's sessions */}
        {todaySessions.length > 0 && (
          <div className="card p-4 space-y-2">
            <div className="font-mono text-xs text-muted tracking-widest">TODAY'S SESSIONS</div>
            {todaySessions.map(s => {
              const goal = goals.find(g => g.id === s.goalId);
              return (
                <div key={s.id} className="flex justify-between font-mono text-xs">
                  <span className="text-text truncate max-w-[70%]">{goal?.name ?? 'Unknown'}</span>
                  <span className="text-accent">{s.durationMinutes} min</span>
                </div>
              );
            })}
            <div className="border-t border-border pt-2 flex justify-between font-mono text-xs">
              <span className="text-muted">TOTAL</span>
              <span className="text-accent font-bold">{todayMinutes} min</span>
            </div>
          </div>
        )}

        {/* Sessions count */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-3 text-center">
            <div className="font-display text-accent text-xl font-bold">{sessionsToday}</div>
            <div className="font-mono text-xs text-muted">SESSIONS TODAY</div>
          </div>
          <div className="card p-3 text-center">
            <div className="font-display text-accent text-xl font-bold">{todayMinutes}</div>
            <div className="font-mono text-xs text-muted">MINUTES TODAY</div>
          </div>
        </div>
      </div>
    </div>
  );
}
