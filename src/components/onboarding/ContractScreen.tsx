import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import GoalConfigurator from './GoalConfigurator';
import type { AppSettings, Goal } from '../../types';
import { today, uid } from '../../lib/dateUtils';

type Step = 'welcome' | 'duration' | 'goals' | 'target' | 'reviewDay' | 'confirm';

const PRESET_DURATIONS = [
  { days: 365,  label: '365 DAYS',  sub: '1 Year' },
  { days: 500,  label: '500 DAYS',  sub: 'Power Year' },
  { days: 730,  label: '730 DAYS',  sub: '2 Years' },
  { days: 1000, label: '1000 DAYS', sub: 'The Thousand' },
  { days: 1127, label: '1127 DAYS', sub: 'The Original' },
  { days: 0,    label: 'CUSTOM',    sub: 'Set your own' },
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Default goals with projected timelines based on content depth & criticality
const DEFAULT_GOALS: Goal[] = [
  {
    id: uid(),
    name: 'AI Engineering Full Masterclass',
    priority: 'critical',
    createdAt: new Date().toISOString(),
    locked: false,
    targetDays: 600,
    description: 'Deep ML/DL, LLMs, MLOps, deployment pipelines — full stack AI engineer path',
  },
  {
    id: uid(),
    name: 'Chinese (HSK 4)',
    priority: 'critical',
    createdAt: new Date().toISOString(),
    locked: false,
    targetDays: 500,
    description: 'Vocabulary, grammar, reading & listening — HSK 1 through 4 progression',
  },
  {
    id: uid(),
    name: 'Finance for Business & Trading',
    priority: 'critical',
    createdAt: new Date().toISOString(),
    locked: false,
    targetDays: 400,
    description: 'Business finance fundamentals, trading strategies, market analysis',
  },
  {
    id: uid(),
    name: 'Robotics',
    priority: 'high',
    createdAt: new Date().toISOString(),
    locked: false,
    targetDays: 550,
    description: 'Mechanics, kinematics, ROS2, control systems, sensor integration',
  },
  {
    id: uid(),
    name: 'Embedded Systems',
    priority: 'medium',
    createdAt: new Date().toISOString(),
    locked: false,
    targetDays: 350,
    description: 'Microcontrollers, RTOS, firmware, protocols (I2C/SPI/UART)',
  },
];

export default function ContractScreen() {
  const navigate = useNavigate();
  const { saveSettings, addGoal } = useAppStore();

  const [step, setStep] = useState<Step>('welcome');
  const [goals, setGoals] = useState<Goal[]>(DEFAULT_GOALS);
  const [weeklyTarget, setWeeklyTarget] = useState(7);
  const [reviewDay, setReviewDay] = useState(1); // Monday
  const [duration, setDuration] = useState(1127);
  const [customDuration, setCustomDuration] = useState(1127);
  const [useCustom, setUseCustom] = useState(false);
  const [signing, setSigning] = useState(false);

  async function handleSign() {
    setSigning(true);
    const settings: AppSettings = {
      startDate: today(),
      goalCount: goals.length,
      totalDays: duration,
      weeklyTarget,
      weeklyReviewDay: reviewDay,
      notificationsEnabled: false,
      installBannerDismissed: false,
      theme: 'dark-terminal',
      xp: 0,
      level: 1,
      streakFreezes: 3,
      freezedDates: [],
      reminderTime: null,
      soundEnabled: true,
    };
    for (const goal of goals) await addGoal(goal);
    await saveSettings(settings);
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 page-enter">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="font-display text-accent text-2xl sm:text-4xl font-black tracking-widest text-glow mb-2">
          PROJECT {duration}
        </div>
        <div className="font-mono text-muted text-xs tracking-widest">
          {duration.toLocaleString()} DAYS. NO EXCEPTIONS.
        </div>
      </div>

      {/* Step: Welcome */}
      {step === 'welcome' && (
        <div className="max-w-md w-full text-center space-y-8">
          <div className="card p-8 space-y-6">
            <p className="font-mono text-sm text-text leading-relaxed">
              You are about to commit to deliberate effort, every single day.
            </p>
            <p className="font-mono text-xs text-muted leading-relaxed">
              Every day will be logged. Every missed day will be recorded as{' '}
              <span className="text-critical">"Nothing"</span>. There are no exceptions.
              There is no editing after the fact. This is a contract with yourself.
            </p>
            <div className="border-t border-border pt-4 font-mono text-xs text-muted">
              ARE YOU READY TO SIGN?
            </div>
          </div>
          <button className="btn-primary w-full py-4 text-sm font-display tracking-widest" onClick={() => setStep('duration')}>
            BEGIN →
          </button>
        </div>
      )}

      {/* Step: Duration */}
      {step === 'duration' && (
        <div className="max-w-md w-full space-y-6">
          <div className="font-mono text-xs text-muted tracking-widest text-center mb-4">
            STEP 0 OF 4 — CHOOSE YOUR DURATION
          </div>
          <div className="card p-6 space-y-4">
            <p className="font-mono text-xs text-muted">
              How many days is your commitment? You can't change this after signing.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_DURATIONS.filter(p => p.days > 0).map(p => (
                <button
                  key={p.days}
                  onClick={() => { setDuration(p.days); setUseCustom(false); }}
                  className={`py-3 px-2 font-mono text-xs border transition-all flex flex-col items-center gap-1 ${
                    duration === p.days && !useCustom
                      ? 'border-accent text-accent bg-accent/10'
                      : 'border-border text-muted'
                  }`}
                >
                  <span className="font-display text-sm font-bold">{p.label}</span>
                  <span className="text-xs opacity-70">{p.sub}</span>
                </button>
              ))}
              <button
                onClick={() => setUseCustom(true)}
                className={`py-3 px-2 font-mono text-xs border transition-all flex flex-col items-center gap-1 ${
                  useCustom ? 'border-accent text-accent bg-accent/10' : 'border-border text-muted'
                }`}
              >
                <span className="font-display text-sm font-bold">CUSTOM</span>
                <span className="text-xs opacity-70">Set your own</span>
              </button>
            </div>

            {useCustom && (
              <div className="space-y-2">
                <div className="font-mono text-xs text-muted">CUSTOM DAYS (30–3650)</div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={30}
                    max={3650}
                    className="input flex-1"
                    value={customDuration}
                    onChange={e => {
                      const v = Math.max(30, Math.min(3650, Number(e.target.value)));
                      setCustomDuration(v);
                      setDuration(v);
                    }}
                  />
                  <span className="font-mono text-xs text-muted">days</span>
                </div>
                <div className="font-mono text-xs text-muted">
                  ≈ {(customDuration / 365).toFixed(1)} years
                </div>
              </div>
            )}

            <div className="border-t border-border pt-3 font-mono text-xs text-accent text-center">
              SELECTED: {duration.toLocaleString()} DAYS
            </div>
          </div>
          <div className="flex gap-3">
            <button className="btn-ghost flex-1" onClick={() => setStep('welcome')}>← BACK</button>
            <button className="btn-primary flex-1" onClick={() => setStep('goals')}>NEXT →</button>
          </div>
        </div>
      )}

      {/* Step: Goals */}
      {step === 'goals' && (
        <div className="max-w-lg w-full space-y-6">
          <div className="font-mono text-xs text-muted tracking-widest text-center mb-4">
            STEP 1 OF 4 — DEFINE YOUR COMMITMENTS
          </div>
          <GoalConfigurator goals={goals} onChange={setGoals} />
          <div className="flex gap-3">
            <button className="btn-ghost flex-1" onClick={() => setStep('welcome')}>← BACK</button>
            <button
              className="btn-primary flex-1"
              disabled={goals.length === 0}
              onClick={() => setStep('target')}
            >
              NEXT →
            </button>
          </div>
        </div>
      )}

      {/* Step: Weekly Target */}
      {step === 'target' && (
        <div className="max-w-md w-full space-y-6">
          <div className="font-mono text-xs text-muted tracking-widest text-center mb-4">
            STEP 2 OF 4 — SET WEEKLY TARGET
          </div>
          <div className="card p-6 space-y-4">
            <p className="font-mono text-xs text-muted">
              How many days per week do you commit to logging?
            </p>
            <div className="flex items-center gap-4">
              <input
                type="range" min={1} max={7} value={weeklyTarget}
                onChange={e => setWeeklyTarget(Number(e.target.value))}
                className="flex-1 accent-accent"
              />
              <span className="font-display text-accent text-2xl font-bold w-8 text-center">
                {weeklyTarget}
              </span>
            </div>
            <p className="font-mono text-xs text-muted">
              {weeklyTarget === 7 ? 'Every single day.' : `${weeklyTarget} day${weeklyTarget > 1 ? 's' : ''} per week.`}
            </p>
          </div>
          <div className="flex gap-3">
            <button className="btn-ghost flex-1" onClick={() => setStep('goals')}>← BACK</button>
            <button className="btn-primary flex-1" onClick={() => setStep('reviewDay')}>NEXT →</button>
          </div>
        </div>
      )}

      {/* Step: Review Day */}
      {step === 'reviewDay' && (
        <div className="max-w-md w-full space-y-6">
          <div className="font-mono text-xs text-muted tracking-widest text-center mb-4">
            STEP 3 OF 4 — WEEKLY REVIEW DAY
          </div>
          <div className="card p-6 space-y-4">
            <p className="font-mono text-xs text-muted">
              Which day of the week should trigger your weekly review?
            </p>
            <div className="grid grid-cols-7 gap-1">
              {DAY_NAMES.map((name, i) => (
                <button
                  key={i}
                  onClick={() => setReviewDay(i)}
                  className={`py-2 text-xs font-mono border transition-all ${
                    reviewDay === i
                      ? 'border-accent text-accent bg-accent/10'
                      : 'border-border text-muted hover:border-accent/50'
                  }`}
                >
                  {name.slice(0, 3).toUpperCase()}
                </button>
              ))}
            </div>
            <p className="font-mono text-xs text-muted">
              Selected: <span className="text-accent">{DAY_NAMES[reviewDay]}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <button className="btn-ghost flex-1" onClick={() => setStep('target')}>← BACK</button>
            <button className="btn-primary flex-1" onClick={() => setStep('confirm')}>NEXT →</button>
          </div>
        </div>
      )}

      {/* Step: Confirm */}
      {step === 'confirm' && (
        <div className="max-w-md w-full space-y-6">
          <div className="font-mono text-xs text-muted tracking-widest text-center mb-4">
            STEP 4 OF 4 — REVIEW YOUR CONTRACT
          </div>
          <div className="card p-6 space-y-4">
            <div className="space-y-2">
              <div className="font-mono text-xs text-muted">COMMITMENTS</div>
              {goals.map(g => (
                <div key={g.id} className="flex items-center justify-between border-b border-border pb-2">
                  <span className="font-mono text-sm text-text">{g.name}</span>
                  <span className={`text-xs font-mono border px-2 py-0.5 priority-${g.priority}`}>
                    {g.priority.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-2 space-y-1 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-muted">WEEKLY TARGET</span>
                <span className="text-accent">{weeklyTarget} DAYS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">REVIEW DAY</span>
                <span className="text-accent">{DAY_NAMES[reviewDay].toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">DURATION</span>
                <span className="text-accent">{duration.toLocaleString()} DAYS</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="btn-ghost flex-1" onClick={() => setStep('reviewDay')}>← BACK</button>
            <button
              className="btn-primary flex-1 py-4 font-display tracking-widest"
              disabled={signing}
              onClick={handleSign}
            >
              {signing ? 'EXECUTING...' : 'EXECUTE CONTRACT'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
