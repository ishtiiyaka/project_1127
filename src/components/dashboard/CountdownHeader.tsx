import { TOTAL_DAYS } from '../../types';

interface Props {
  dayNumber: number;
  daysRemaining: number;
  progress: number;
}

export default function CountdownHeader({ dayNumber, daysRemaining, progress }: Props) {
  return (
    <div className="sticky top-0 z-50 bg-black border-b border-border">
      {/* Progress bar */}
      <div className="h-0.5 bg-border">
        <div
          className="h-full bg-accent transition-all duration-1000"
          style={{ width: `${Math.min(progress, 100)}%`, boxShadow: '0 0 6px #00ff41' }}
        />
      </div>

      {/* Header content */}
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="font-display text-accent text-sm font-bold tracking-widest">
          PROJECT 1127
        </div>
        <div className="text-center">
          <div className="font-display text-white text-base font-bold tracking-wider">
            DAY <span className="text-accent">{dayNumber}</span>
            <span className="text-border mx-1">/</span>
            <span className="text-muted">{TOTAL_DAYS}</span>
          </div>
        </div>
        <div className="font-mono text-xs text-muted text-right">
          <div>{daysRemaining}</div>
          <div>REMAIN</div>
        </div>
      </div>
    </div>
  );
}
