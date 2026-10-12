// ponder — chess clock with increment
export class Clock {
  constructor({ base = 600, inc = 0 } = {}, onTick = () => {}, onFlag = () => {}) {
    this.base = base; this.inc = inc; this.onTick = onTick; this.onFlag = onFlag;
    this.unlimited = !base;
    this.t = { w: base * 1000, b: base * 1000 };
    this.running = null; this.since = 0; this.raf = 0;
  }
  remaining(c) { return this.running === c ? Math.max(0, this.t[c] - (performance.now() - this.since)) : this.t[c]; }
  start(c) {
    if (this.unlimited) return;
    this.stop(); this.running = c; this.since = performance.now();
    const loop = () => {
      const left = this.remaining(c);
      this.onTick();
      if (left <= 0) { this.t[c] = 0; this.running = null; this.onFlag(c); return; }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }
  /** Called after color c completes a move */
  press(c, addInc = true) {
    if (this.unlimited) return;
    if (this.running === c) this.t[c] = this.remaining(c);
    if (addInc) this.t[c] += this.inc * 1000;
    this.start(c === 'w' ? 'b' : 'w');
  }
  stop() { if (this.running) this.t[this.running] = this.remaining(this.running); this.running = null; cancelAnimationFrame(this.raf); }
  static fmt(ms) {
    if (ms >= 3600e3) { const h = Math.floor(ms / 3600e3), m = Math.floor(ms % 3600e3 / 60e3); return `${h}:${String(m).padStart(2, '0')}`; }
    const s = ms / 1000;
    if (s < 10) return `0:0${Math.floor(s)}.${Math.floor((ms % 1000) / 100)}`;
    const m = Math.floor(s / 60), r = Math.floor(s % 60);
    return `${m}:${String(r).padStart(2, '0')}`;
  }
}
