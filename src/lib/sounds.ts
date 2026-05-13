/**
 * Sound effects using Web Audio API — no external files needed.
 * All sounds are synthesized programmatically.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function isSoundEnabled(): boolean {
  try {
    const raw = localStorage.getItem('soundEnabled');
    return raw === null ? true : raw !== 'false';
  } catch { return true; }
}

function beep(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.15) {
  if (!isSoundEnabled()) return;
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    gain.gain.setValueAtTime(volume, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration);
  } catch { /* ignore */ }
}

export function playEntrySealed() {
  // Two-tone confirm
  beep(880, 0.08, 'square', 0.12);
  setTimeout(() => beep(1320, 0.12, 'square', 0.1), 90);
}

export function playStreakBonus() {
  // Rising arpeggio
  [440, 554, 659, 880].forEach((f, i) => setTimeout(() => beep(f, 0.1, 'sine', 0.15), i * 80));
}

export function playMilestoneUnlock() {
  // Fanfare
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.2, 'sine', 0.18), i * 120));
  setTimeout(() => beep(1047, 0.4, 'sine', 0.2), 480);
}

export function playLevelUp() {
  // Level up jingle
  [523, 784, 1047, 1568].forEach((f, i) => setTimeout(() => beep(f, 0.15, 'triangle', 0.18), i * 100));
}

export function playFocusStart() {
  beep(440, 0.15, 'sine', 0.12);
  setTimeout(() => beep(880, 0.15, 'sine', 0.1), 160);
}

export function playFocusEnd() {
  [880, 784, 659, 523].forEach((f, i) => setTimeout(() => beep(f, 0.15, 'sine', 0.15), i * 100));
}

export function playClick() {
  beep(1200, 0.04, 'square', 0.06);
}
