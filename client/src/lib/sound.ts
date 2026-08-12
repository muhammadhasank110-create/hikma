/**
 * Hikma sound cues. Playback is deliberately optional, quiet, and resilient in
 * privacy-restricted browsers where Web Audio or localStorage are unavailable.
 */
let ctx: AudioContext | null = null;

function readStorage(key: string): string | null {
  try { return window.localStorage.getItem(key); } catch { return null; }
}

function writeStorage(key: string, value: string) {
  try { window.localStorage.setItem(key, value); } catch { /* preference storage is optional */ }
}

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx || ctx.state === "closed") {
    const constructor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!constructor) return null;
    ctx = new constructor();
  }
  return ctx;
}

const NOTES = { A3: 220, C4: 261.63, D4: 293.66, E4: 329.63, G4: 392, A4: 440, C5: 523.25, E5: 659.25 };

function tone(freq: number, start: number, duration: number, volume: number, type: OscillatorType = "sine") {
  try {
    const audio = getContext();
    if (!audio) return;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, audio.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(volume, audio.currentTime + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + start + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(audio.currentTime + start);
    oscillator.stop(audio.currentTime + start + duration + 0.05);
  } catch { /* never interrupt a learner action for an optional cue */ }
}

function announce(label: string) {
  const liveRegion = document.getElementById("sound-announcer");
  if (!liveRegion) return;
  liveRegion.textContent = label;
  window.setTimeout(() => { liveRegion.textContent = ""; }, 800);
}

const CUES: Record<string, (volume: number) => void> = {
  tap: volume => tone(NOTES.A4, 0, 0.06, 0.04 * volume),
  correct: volume => { tone(NOTES.E4, 0, 0.12, 0.1 * volume); tone(NOTES.A4, 0.08, 0.22, 0.1 * volume); announce("Correct"); },
  incorrect: volume => { tone(NOTES.D4, 0, 0.14, 0.07 * volume, "triangle"); announce("Try again"); },
  complete: volume => { [NOTES.A4, NOTES.C5, NOTES.E5].forEach((frequency, index) => tone(frequency, index * 0.09, 0.28, 0.08 * volume)); announce("Complete"); },
  achievement: volume => { [NOTES.A4, NOTES.C5, NOTES.E5].forEach((frequency, index) => tone(frequency, index * 0.08, 0.3, 0.08 * volume)); announce("Achievement"); },
  error: volume => { tone(NOTES.A3, 0, 0.22, 0.07 * volume, "triangle"); announce("Error"); },
  open: volume => tone(NOTES.C4, 0, 0.08, 0.04 * volume),
  close: volume => tone(NOTES.A3, 0, 0.08, 0.04 * volume),
  navigate: volume => { tone(NOTES.G4, 0, 0.06, 0.04 * volume); tone(NOTES.A4, 0.05, 0.08, 0.03 * volume); },
  questionAppear: volume => tone(NOTES.C5, 0, 0.07, 0.07 * volume),
  partiallyCorrect: volume => { tone(NOTES.E4, 0, 0.12, 0.08 * volume); announce("Partially correct"); },
};

function playCue(name: string, allowWhenDisabled = false) {
  if (!allowWhenDisabled && readStorage("hikma:sound") !== "on") return;
  const volume = Number(readStorage("hikma:volume") ?? 0.7);
  try {
    const audio = getContext();
    if (!audio) return;
    void audio.resume().then(() => CUES[name]?.(Number.isFinite(volume) ? volume : 0.7)).catch(() => undefined);
  } catch { /* optional cue */ }
}

export function playSound(name: keyof typeof CUES | string) { playCue(name); }
export function playTestSound() { playCue("navigate", true); }
export function isSoundEnabled() { return readStorage("hikma:sound") === "on"; }
export function setSoundEnabled(enabled: boolean) { writeStorage("hikma:sound", enabled ? "on" : "off"); }
export function getSoundVolume() { return Number(readStorage("hikma:volume") ?? 0.7); }
export function setSoundVolume(volume: number) { writeStorage("hikma:volume", String(Math.max(0, Math.min(1, volume)))); }
