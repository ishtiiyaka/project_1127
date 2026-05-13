import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface Props {
  day: number;
  onDismiss: () => void;
}

export default function MilestoneCelebration({ day, onDismiss }: Props) {
  useEffect(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#00ff41', '#007a1f', '#00bfff'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#00ff41', '#007a1f', '#ffd700'],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center px-4 page-enter"
      onClick={onDismiss}
    >
      <div className="text-center space-y-6" onClick={e => e.stopPropagation()}>
        {/* Glow ring */}
        <div className="relative inline-block">
          <div className="font-display text-7xl sm:text-9xl font-black text-accent text-glow"
            style={{ textShadow: '0 0 20px #00ff41, 0 0 60px #007a1f' }}
          >
            {day}
          </div>
          <div className="font-display text-lg text-text tracking-widest mt-2">
            DAY MILESTONE
          </div>
        </div>

        <div className="font-mono text-sm text-muted max-w-xs leading-relaxed">
          You have reached <span className="text-accent">Day {day}</span> of your 1,127-day commitment.
          This milestone has been permanently recorded.
        </div>

        <button className="btn-primary px-8 py-3 font-display tracking-widest" onClick={onDismiss}>
          CONTINUE THE JOURNEY
        </button>
      </div>
    </div>
  );
}
