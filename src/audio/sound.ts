let audioCtx: AudioContext | null = null;
let bgmOscillators: OscillatorNode[] = [];
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

export function startBGM() {
  if (isBgmPlaying || bgmOscillators.length > 0) return;
  const ctx = getAudioContext();
  const freqs = [196, 220, 261, 293];
  const gains = [0.015, 0.012, 0.01, 0.008];
  bgmGain = ctx.createGain();
  bgmGain.gain.setValueAtTime(0.3, ctx.currentTime);
  bgmGain.connect(ctx.destination);

  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gains[i], ctx.currentTime);
    osc.connect(gain);
    gain.connect(bgmGain!);
    osc.start(ctx.currentTime);
    bgmOscillators.push(osc);
  });

  isBgmPlaying = true;
}

export function stopBGM() {
  bgmOscillators.forEach(osc => {
    try { osc.stop(); } catch {}
  });
  bgmOscillators = [];
  if (bgmGain) {
    try { bgmGain.disconnect(); } catch {}
    bgmGain = null;
  }
  isBgmPlaying = false;
}

export function isPlayingBGM(): boolean {
  return isBgmPlaying;
}
