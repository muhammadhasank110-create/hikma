/**
 * Hikma Sound Effects — Web Audio API
 * A minor pentatonic scale. OFF by default.
 * Toggle: localStorage 'hikma:sound' === 'on'
 * Volume: localStorage 'hikma:volume' (0–1, default 0.7)
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx || ctx.state === "closed") {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return ctx;
}

// A minor pentatonic scale — all cues live in this family so they feel cohesive
const NOTES = {
  A3: 220,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  G4: 392,
  A4: 440,
  C5: 523.25,
  E5: 659.25,
};

function tone(
  freq: number,
  start: number,
  dur: number,
  vol: number,
  type: OscillatorType = "sine"
) {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    // Soft attack + exponential release — no clicks, nothing startling
    gain.gain.setValueAtTime(0.0001, c.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(vol, c.currentTime + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(c.currentTime + start);
    osc.stop(c.currentTime + start + dur + 0.05);
  } catch {
    // silent — audio context may not be available
  }
}

/** Visual twin — brief border flash for deaf/HoH users */
function visualFlash(color: string, label: string) {
  // Announce to screen reader
  const live = document.getElementById("sound-announcer");
  if (live) {
    live.textContent = label;
    setTimeout(() => { live.textContent = ""; }, 1000);
  }
  // Brief border flash
  const el = document.createElement("div");
  el.className = "sound-flash";
  el.style.border = `3px solid ${color}`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 450);
}

const CUES: Record<string, (vol: number) => void> = {
  tap: (v) => tone(NOTES.A4, 0, 0.06, 0.05 * v, "sine"),

  correct: (v) => {
    tone(NOTES.E4, 0, 0.14, 0.12 * v);
    tone(NOTES.A4, 0.09, 0.28, 0.12 * v);
    visualFlash("#22c55e", "Correct!");
  },

  incorrect: (v) => {
    // Soft and neutral — never punitive
    tone(NOTES.D4, 0, 0.16, 0.09 * v, "triangle");
    tone(NOTES.A3, 0.1, 0.3, 0.08 * v, "triangle");
    visualFlash("#f59e0b", "Try again");
  },

  complete: (v) => {
    [NOTES.A4, NOTES.C5, NOTES.E5].forEach((f, i) =>
      tone(f, i * 0.1, 0.4, 0.1 * v)
    );
    visualFlash("#22c55e", "Complete!");
  },

  achievement: (v) => {
    [NOTES.A4, NOTES.C5, NOTES.E5, NOTES.A4 * 2].forEach((f, i) =>
      tone(f, i * 0.08, 0.5, 0.1 * v)
    );
    visualFlash("#f59e0b", "Achievement!");
  },

  error: (v) => {
    tone(NOTES.A3, 0, 0.3, 0.1 * v, "triangle");
    visualFlash("#ef4444", "Error");
  },

  open: (v) => tone(NOTES.C4, 0, 0.1, 0.05 * v),

  close: (v) => tone(NOTES.A3, 0, 0.1, 0.05 * v),

  navigate: (v) => {
    tone(NOTES.G4, 0, 0.08, 0.06 * v);
    tone(NOTES.A4, 0.06, 0.1, 0.05 * v);
  },

  questionAppear: (v) => {
    tone(NOTES.A4, 0, 0.06, 0.1 * v);
    tone(NOTES.C5, 0.05, 0.06, 0.08 * v);
    tone(NOTES.E5, 0.1, 0.08, 0.1 * v);
  },
};

export function playSound(name: keyof typeof CUES | string) {
  // OFF by default — only plays if user explicitly turned it on
  const enabled = localStorage.getItem("hikma:sound") === "on";
  if (!enabled) return;
  const vol = Number(localStorage.getItem("hikma:volume") ?? 0.7);
  try {
    const c = getCtx();
    c.resume().then(() => {
      CUES[name]?.(vol);
    });
  } catch {
    // silent
  }
}

export function isSoundEnabled(): boolean {
  return localStorage.getItem("hikma:sound") === "on";
}

export function setSoundEnabled(on: boolean) {
  localStorage.setItem("hikma:sound", on ? "on" : "off");
}

export function getSoundVolume(): number {
  return Number(localStorage.getItem("hikma:volume") ?? 0.7);
}

export function setSoundVolume(vol: number) {
  localStorage.setItem("hikma:volume", String(Math.max(0, Math.min(1, vol))));
}
