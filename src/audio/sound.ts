let audioCtx: AudioContext | null = null;
let bgmNodes: AudioNode[] = [];
let bgmTimers: number[] = [];
let bgmGain: GainNode | null = null;
let isBgmPlaying = false;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export function playClickSound() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
}

export function playWaterSound() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.2);
  osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.4);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.4);
}

export function playBloomSound() {
  const ctx = getAudioContext();
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
    gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.1 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.1);
    osc.stop(ctx.currentTime + i * 0.1 + 0.3);
  });
}

export function playUnlockSound() {
  const ctx = getAudioContext();
  const notes = [440, 554, 659, 880];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
    gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.08 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.08);
    osc.stop(ctx.currentTime + i * 0.08 + 0.25);
  });
}

export function playErrorSound() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.2);
}

/**
 * Garden ambient — a quiet generative piece for solo flower-watching.
 *
 * Layers, all routed through a feedback delay + light low-pass for an
 * airy, far-away quality:
 *   1. Pad   — a Dm9 chord held on three soft sine + triangle voices,
 *              very slow LFO on each voice's gain to make the chord
 *              breathe.
 *   2. Chime — a bell-tone melody (FM-shaped: sine carrier modulated by
 *              a 2x sine), notes drawn from a D minor pentatonic scale
 *              (D F G A C). Sparse, irregular timing — never identical
 *              twice — so it feels meditative rather than looping.
 *   3. Wind  — filtered noise puff every 12–20s for ambience.
 */

// D minor pentatonic across two octaves (Hz). Calm, neither happy nor sad.
const PENTATONIC = [
  146.83, 174.61, 196.00, 220.00, 261.63, // D3 F3 G3 A3 C4
  293.66, 349.23, 392.00, 440.00, 523.25, // D4 F4 G4 A4 C5
  587.33, 698.46,                          // D5 F5
];

// Pad chord: D, A, C, E, F — Dm9 voicing, soft and open.
const PAD_FREQS = [146.83, 220.00, 261.63, 329.63, 174.61];

function startPad(ctx: AudioContext, dest: AudioNode) {
  PAD_FREQS.forEach((freq, i) => {
    const sine = ctx.createOscillator();
    sine.type = 'sine';
    sine.frequency.value = freq;

    const tri = ctx.createOscillator();
    tri.type = 'triangle';
    tri.frequency.value = freq * 2.0; // octave shimmer
    const triGain = ctx.createGain();
    triGain.gain.value = 0.04;
    tri.connect(triGain);

    const voiceGain = ctx.createGain();
    voiceGain.gain.value = 0.0;
    sine.connect(voiceGain);
    triGain.connect(voiceGain);
    voiceGain.connect(dest);

    // Fade in
    voiceGain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 4 + i * 0.6);

    // Slow LFO so each voice breathes independently — gives the chord life.
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.04 + i * 0.015; // 14–25 second cycles
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 0.04;
    lfo.connect(lfoDepth);
    lfoDepth.connect(voiceGain.gain);

    sine.start();
    tri.start();
    lfo.start();
    bgmNodes.push(sine, tri, lfo, voiceGain, triGain, lfoDepth);
  });
}

// Bell-shaped chime: sine carrier with a 2x sine modulator into the
// carrier's frequency. Quick attack, long exponential decay.
function playChime(ctx: AudioContext, dest: AudioNode, freq: number, when: number, amp: number) {
  const carrier = ctx.createOscillator();
  carrier.type = 'sine';
  carrier.frequency.setValueAtTime(freq, when);

  const modulator = ctx.createOscillator();
  modulator.type = 'sine';
  modulator.frequency.setValueAtTime(freq * 2, when);

  const modDepth = ctx.createGain();
  // Decaying FM index — gives the bell its initial "ting" then settles.
  modDepth.gain.setValueAtTime(freq * 1.4, when);
  modDepth.gain.exponentialRampToValueAtTime(0.01, when + 0.6);

  modulator.connect(modDepth);
  modDepth.connect(carrier.frequency);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0, when);
  env.gain.linearRampToValueAtTime(amp, when + 0.01);
  env.gain.exponentialRampToValueAtTime(0.001, when + 4.5);

  carrier.connect(env);
  env.connect(dest);

  carrier.start(when);
  modulator.start(when);
  carrier.stop(when + 4.6);
  modulator.stop(when + 4.6);
}

function scheduleChimes(ctx: AudioContext, dest: AudioNode) {
  let lastIndex = 4;
  const tick = () => {
    if (!isBgmPlaying) return;
    // Walk the scale by small, occasionally larger steps — feels melodic
    // without ever resolving into a fixed phrase.
    const step = Math.floor((Math.random() - 0.5) * 5);
    lastIndex = Math.max(2, Math.min(PENTATONIC.length - 1, lastIndex + step));
    const freq = PENTATONIC[lastIndex];
    const amp = 0.06 + Math.random() * 0.05;
    playChime(ctx, dest, freq, ctx.currentTime + 0.05, amp);

    // ~25% of the time, layer a soft octave-up grace note for sparkle.
    if (Math.random() < 0.25 && lastIndex < PENTATONIC.length - 3) {
      playChime(ctx, dest, PENTATONIC[lastIndex + 3], ctx.currentTime + 0.18, amp * 0.55);
    }

    // 2.6–6.4 seconds between notes — sparse and unhurried.
    const next = 2600 + Math.random() * 3800;
    bgmTimers.push(window.setTimeout(tick, next));
  };
  // First note arrives a few seconds in, after the pad has bloomed.
  bgmTimers.push(window.setTimeout(tick, 3500));
}

// Soft band-passed noise puff — like distant breeze through leaves.
function playWind(ctx: AudioContext, dest: AudioNode) {
  const bufferSize = ctx.sampleRate * 3;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;

  const src = ctx.createBufferSource();
  src.buffer = buffer;

  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 700 + Math.random() * 400;
  bp.Q.value = 0.7;

  const env = ctx.createGain();
  const t = ctx.currentTime;
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(0.025, t + 0.8);
  env.gain.linearRampToValueAtTime(0.018, t + 1.6);
  env.gain.linearRampToValueAtTime(0, t + 2.8);

  src.connect(bp);
  bp.connect(env);
  env.connect(dest);
  src.start(t);
  src.stop(t + 3);
}

function scheduleWind(ctx: AudioContext, dest: AudioNode) {
  const tick = () => {
    if (!isBgmPlaying) return;
    playWind(ctx, dest);
    const next = 12000 + Math.random() * 8000;
    bgmTimers.push(window.setTimeout(tick, next));
  };
  bgmTimers.push(window.setTimeout(tick, 6000));
}

export function startBGM() {
  if (isBgmPlaying) return;
  const ctx = getAudioContext();

  // Master bus
  bgmGain = ctx.createGain();
  bgmGain.gain.setValueAtTime(0, ctx.currentTime);
  bgmGain.gain.linearRampToValueAtTime(0.85, ctx.currentTime + 2.5);

  // Gentle low-pass to round off harsh edges.
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 3200;
  lp.Q.value = 0.5;

  // Feedback delay — "spaciousness". Each tap loses ~55%.
  const delay = ctx.createDelay(2.0);
  delay.delayTime.value = 0.42;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.45;
  const wet = ctx.createGain();
  wet.gain.value = 0.35;

  // wiring: voices → lp → (dry to master) and (wet via delay loop → master)
  lp.connect(bgmGain);
  lp.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(wet);
  wet.connect(bgmGain);

  bgmGain.connect(ctx.destination);

  isBgmPlaying = true;

  startPad(ctx, lp);
  scheduleChimes(ctx, lp);
  scheduleWind(ctx, lp);

  bgmNodes.push(lp, delay, feedback, wet);
}

export function stopBGM() {
  isBgmPlaying = false;
  bgmTimers.forEach(t => clearTimeout(t));
  bgmTimers = [];
  if (bgmGain && audioCtx) {
    const t = audioCtx.currentTime;
    bgmGain.gain.cancelScheduledValues(t);
    bgmGain.gain.setValueAtTime(bgmGain.gain.value, t);
    bgmGain.gain.linearRampToValueAtTime(0, t + 0.6);
  }
  const masterGain = bgmGain;
  const nodes = bgmNodes;
  bgmNodes = [];
  bgmGain = null;
  // Hard-stop oscillators after the fade so we don't leak them.
  setTimeout(() => {
    nodes.forEach(n => {
      try {
        if ((n as OscillatorNode).stop) (n as OscillatorNode).stop();
      } catch {}
      try { n.disconnect(); } catch {}
    });
    if (masterGain) {
      try { masterGain.disconnect(); } catch {}
    }
  }, 700);
}

export function isPlayingBGM(): boolean {
  return isBgmPlaying;
}
