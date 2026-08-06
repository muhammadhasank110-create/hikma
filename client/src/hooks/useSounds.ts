/**
 * useSounds — Duolingo-style sound effects using Web Audio API.
 * No external files needed — all sounds are synthesised programmatically.
 *
 * Sounds:
 * - click: soft button press
 * - navigate: page/section change
 * - success: correct answer / section complete
 * - error: wrong answer
 * - levelUp: lesson complete / achievement
 * - correct: quick positive ping
 * - incorrect: gentle buzz
 * - notification: soft chime
 * - focus: zen tone for focus mode
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx || ctx.state === "closed") {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  gainStart = 0.3,
  gainEnd = 0,
  delay = 0
) {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, c.currentTime + delay);
    gain.gain.setValueAtTime(gainStart, c.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.001, gainEnd),
      c.currentTime + delay + duration
    );
    osc.start(c.currentTime + delay);
    osc.stop(c.currentTime + delay + duration + 0.01);
  } catch { /* silent fail */ }
}

function playChord(notes: number[], duration: number, stagger = 0.05) {
  notes.forEach((freq, i) => playTone(freq, duration, "sine", 0.2, 0, i * stagger));
}

export const sounds = {
  click: () => {
    playTone(800, 0.06, "sine", 0.15, 0);
  },
  navigate: () => {
    playTone(440, 0.08, "sine", 0.12, 0);
    playTone(550, 0.08, "sine", 0.08, 0, 0.05);
  },
  success: () => {
    // Duolingo-style rising chord
    playTone(523, 0.12, "sine", 0.25, 0);
    playTone(659, 0.12, "sine", 0.2, 0, 0.1);
    playTone(784, 0.2, "sine", 0.25, 0, 0.2);
  },
  error: () => {
    // Gentle descending buzz
    playTone(300, 0.15, "sawtooth", 0.1, 0);
    playTone(250, 0.15, "sawtooth", 0.08, 0, 0.1);
  },
  levelUp: () => {
    // Celebratory arpeggio
    [523, 659, 784, 1047].forEach((freq, i) => {
      playTone(freq, 0.15, "sine", 0.3, 0, i * 0.08);
    });
    playChord([523, 659, 784], 0.4, 0.02);
  },
  correct: () => {
    playTone(880, 0.1, "sine", 0.2, 0);
    playTone(1100, 0.12, "sine", 0.15, 0, 0.08);
  },
  incorrect: () => {
    playTone(220, 0.2, "triangle", 0.15, 0);
  },
  notification: () => {
    playTone(660, 0.1, "sine", 0.15, 0);
    playTone(880, 0.15, "sine", 0.1, 0, 0.1);
  },
  focus: () => {
    // Soft zen bowl tone
    playTone(432, 0.8, "sine", 0.1, 0);
    playTone(540, 0.6, "sine", 0.05, 0, 0.1);
  },
  sectionStart: () => {
    playTone(523, 0.1, "sine", 0.15, 0);
    playTone(659, 0.1, "sine", 0.12, 0, 0.08);
  },
  questionAppear: () => {
    playTone(740, 0.08, "sine", 0.12, 0);
  },
};

export function useSounds() {
  return sounds;
}
