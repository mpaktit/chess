// ponder — soft synthesized sounds (no audio files)
import { settings } from './settings.js';
let ctx = null;
function ac() { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); return ctx; }

function knock({ freq = 180, decay = 0.09, gain = 0.5, noise = 0.6, delay = 0 } = {}) {
  const c = ac(), t = c.currentTime + delay;
  // wooden body: short sine with pitch drop
  const o = c.createOscillator(), g = c.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(freq * 1.6, t);
  o.frequency.exponentialRampToValueAtTime(freq, t + 0.03);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  o.connect(g).connect(c.destination);
  o.start(t); o.stop(t + decay + 0.02);
  // click texture: filtered noise
  const len = Math.floor(c.sampleRate * 0.03), buf = c.createBuffer(1, len, c.sampleRate), data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const n = c.createBufferSource(), f = c.createBiquadFilter(), ng = c.createGain();
  n.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq * 9; f.Q.value = 1.2;
  ng.gain.value = noise * gain;
  n.connect(f).connect(ng).connect(c.destination);
  n.start(t);
}
function tone(freq, t0, dur, gain = 0.18, type = 'sine') {
  const c = ac(), t = c.currentTime + t0, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
}
export const sound = {
  get on() { return settings.get('sound'); },
  toggle() { settings.set('sound', !settings.get('sound')); return settings.get('sound'); },
  play(kind) {
    if (!settings.get('sound')) return;
    try {
      switch (kind) {
        case 'move': knock(); break;
        case 'capture': knock({ freq: 150, gain: 0.65, noise: 1.1, decay: 0.12 }); break;
        case 'castle': knock(); knock({ delay: 0.09, freq: 200 }); break;
        case 'check': knock({ freq: 210 }); tone(880, 0.02, 0.18, 0.08, 'triangle'); break;
        case 'promote': knock(); tone(660, 0.03, 0.2, 0.08); tone(990, 0.1, 0.25, 0.07); break;
        case 'illegal': tone(160, 0, 0.12, 0.1, 'triangle'); break;
        case 'end': tone(523, 0, 0.5, 0.12); tone(659, 0.12, 0.5, 0.1); tone(784, 0.24, 0.8, 0.1); break;
      }
    } catch (e) { /* audio unavailable */ }
  }
};
