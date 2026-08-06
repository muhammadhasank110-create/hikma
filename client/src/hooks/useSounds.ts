/**
 * useSounds — Duolingo-inspired sound effects using Web Audio API.
 * Musical, warm, and rewarding. No external files needed.
 * Issue #18: Every sound has a visual equivalent for deaf/HoH users.
 */

/** Visual flash — brief colour pulse on the body for deaf/HoH users */
function visualFlash(colour: string, label: string) {
  // Announce to screen reader
  const live = document.getElementById("sound-announcer");
  if (live) { live.textContent = label; setTimeout(() => { live.textContent = ""; }, 1000); }
  // Brief body border flash
  const el = document.createElement("div");
  el.style.cssText = `position:fixed;inset:0;pointer-events:none;z-index:9998;border:3px solid ${colour};border-radius:0;opacity:0.6;transition:opacity 0.3s`;
  document.body.appendChild(el);
  requestAnimationFrame(() => { el.style.opacity = "0"; });
  setTimeout(() => el.remove(), 400);
}

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx || ctx.state === "closed") {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.2, delay = 0) {
  try {
    const c = getCtx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.connect(g);
    g.connect(c.destination);
    o.type = type;
    o.frequency.setValueAtTime(freq, c.currentTime + delay);
    g.gain.setValueAtTime(vol, c.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + dur);
    o.start(c.currentTime + delay);
    o.stop(c.currentTime + delay + dur + 0.01);
  } catch { /* silent */ }
}

export const sounds = {
  /** Soft tap — button press, focus move */
  click: () => {
    tone(1200, 0.04, "sine", 0.08);
  },

  /** Two-note chime — section/page navigation */
  navigate: () => { visualFlash("#22c55e", "Navigated");
    tone(587, 0.08, "sine", 0.12);
    tone(784, 0.1, "sine", 0.1, 0.06);
  },

  /** Rising major chord — correct answer, section complete */
  success: () => {
    tone(523, 0.12, "triangle", 0.2);
    tone(659, 0.12, "triangle", 0.18, 0.08);
    tone(784, 0.18, "triangle", 0.2, 0.16);
  },

  /** Gentle low buzz — wrong answer */
  error: () => {
    tone(220, 0.12, "sawtooth", 0.06);
    tone(196, 0.12, "sawtooth", 0.05, 0.08);
  },

  /** Celebratory arpeggio — lesson complete, achievement */
  levelUp: () => {
    [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.15, "sine", 0.2, i * 0.06));
    // Shimmer chord at the end
    setTimeout(() => {
      tone(1047, 0.4, "sine", 0.1);
      tone(1319, 0.4, "sine", 0.08, 0.02);
      tone(1568, 0.4, "sine", 0.06, 0.04);
    }, 350);
  },

  /** Quick bright ping — correct */
  correct: () => {
    tone(880, 0.06, "sine", 0.15);
    tone(1175, 0.08, "sine", 0.12, 0.05);
  },

  /** Soft descending — incorrect */
  incorrect: () => {
    tone(330, 0.15, "triangle", 0.1);
    tone(262, 0.15, "triangle", 0.08, 0.1);
  },

  /** Notification chime */
  notification: () => {
    tone(698, 0.08, "sine", 0.12);
    tone(880, 0.12, "sine", 0.1, 0.08);
  },

  /** Zen bowl — focus mode activation */
  focus: () => {
    tone(396, 0.8, "sine", 0.08);
    tone(528, 0.6, "sine", 0.04, 0.1);
  },

  /** Section start chime */
  sectionStart: () => {
    tone(587, 0.06, "sine", 0.1);
    tone(784, 0.08, "sine", 0.08, 0.05);
  },

  /** Question appears — curious rising tone */
  questionAppear: () => {
    tone(440, 0.06, "sine", 0.1);
    tone(554, 0.06, "sine", 0.08, 0.05);
    tone(659, 0.08, "sine", 0.1, 0.1);
  },
};

export function useSounds() {
  return sounds;
}
