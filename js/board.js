// ponder — interactive chess board (no dependencies)
const FILES = 'abcdefgh';
import { pieceUrl } from './settings.js';
export const PIECE_URL = code => pieceUrl(code); // code like "wN"

const ARROW_COLORS = { think: '#F0A43A', good: '#5FB563', warn: '#E5533B', blue: '#6F8CFF' };

export function sqToXY(sq, orientation) {
  const f = FILES.indexOf(sq[0]), r = +sq[1] - 1;
  return orientation === 'w' ? [f, 7 - r] : [7 - f, r];
}
function xyToSq(x, y, orientation) {
  return orientation === 'w' ? FILES[x] + (8 - y) : FILES[7 - x] + (y + 1);
}
/** Parse placement part of FEN into {sq: "wN"} */
export function parsePlacement(fen) {
  const map = {};
  fen.split(' ')[0].split('/').forEach((row, ri) => {
    let f = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) { f += +ch; continue; }
      map[FILES[f] + (8 - ri)] = (ch === ch.toUpperCase() ? 'w' : 'b') + ch.toUpperCase();
      f++;
    }
  });
  return map;
}

export class Board {
  /**
   * opts: { orientation, coords, onMove(from,to) => void, canMove(from) => bool, dests(from) => [sq], onUserDraw }
   */
  constructor(el, opts = {}) {
    this.el = el;
    this.o = Object.assign({ orientation: 'w', coords: true, canMove: () => false, dests: () => [], onMove: () => {} }, opts);
    this.orientation = this.o.orientation;
    this.pos = {};
    this.pieceEls = new Map(); // sq -> element
    this.marks = { last: [], check: null, sel: null, premove: [] };
    this.drawings = []; // {type:'arrow'|'circle', from, to, color}
    this.ghosts = [];
    this.view = false;
    this.build();
    window.addEventListener('ponder:settings', e => { if (e.detail.k === 'pieces') this.refreshPieces(); });
  }
  refreshPieces() { for (const el of this.pieceEls.values()) el.style.backgroundImage = `url(${PIECE_URL(el.dataset.code)})`; }

  build() {
    this.el.classList.add('board');
    this.el.innerHTML = '<div class="squares"></div><div class="pieces"></div><svg class="draw"></svg>';
    this.sqLayer = this.el.querySelector('.squares');
    this.pcLayer = this.el.querySelector('.pieces');
    this.svg = this.el.querySelector('svg.draw');
    this.renderSquares();
    this.bindPointer();
    new ResizeObserver(() => this.el.style.setProperty('--sq', this.el.clientWidth / 8 + 'px')).observe(this.el);
  }

  renderSquares() {
    this.sqLayer.innerHTML = '';
    this.sqEls = {};
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const sq = xyToSq(x, y, this.orientation);
      const d = document.createElement('div');
      const light = (x + y) % 2 === 0;
      d.className = 'sq ' + (light ? 'l' : 'd');
      if (this.o.coords) {
        if (x === 0) d.insertAdjacentHTML('beforeend', `<i class="co r">${sq[1]}</i>`);
        if (y === 7) d.insertAdjacentHTML('beforeend', `<i class="co f">${sq[0]}</i>`);
      }
      this.sqEls[sq] = d;
      this.sqLayer.appendChild(d);
    }
    this.applyMarks();
  }

  setOrientation(c) {
    if (c === this.orientation) return;
    this.orientation = c;
    this.renderSquares();
    for (const [sq, el] of this.pieceEls) this.placeEl(el, sq);
    this.renderDrawings();
  }
  flip() { this.setOrientation(this.orientation === 'w' ? 'b' : 'w'); }

  placeEl(el, sq) {
    const [x, y] = sqToXY(sq, this.orientation);
    el.style.transform = `translate(${x * 100}%, ${y * 100}%)`;
  }
  makePiece(code, sq) {
    const el = document.createElement('div');
    el.className = 'pc';
    el.style.backgroundImage = `url(${PIECE_URL(code)})`;
    el.dataset.code = code;
    this.placeEl(el, sq);
    return el;
  }

  /** Set position with smooth animation of moved pieces. */
  setPosition(fen, { animate = true } = {}) {
    const next = parsePlacement(fen);
    const prev = this.pos;
    const removed = [], added = [];
    for (const sq in prev) if (prev[sq] !== next[sq]) removed.push(sq);
    for (const sq in next) if (prev[sq] !== next[sq]) added.push(sq);
    const newEls = new Map();
    for (const [sq, el] of this.pieceEls) if (prev[sq] === next[sq]) { newEls.set(sq, el); this.placeEl(el, sq); }
    const pool = removed.map(sq => ({ sq, code: prev[sq], el: this.pieceEls.get(sq) }));
    for (const sq of added) {
      const code = next[sq];
      // match nearest removed piece of same code
      let best = -1, bd = 99;
      pool.forEach((p, i) => {
        if (p && p.code === code) {
          const [ax, ay] = sqToXY(p.sq, 'w'), [bx, by] = sqToXY(sq, 'w');
          const d = Math.abs(ax - bx) + Math.abs(ay - by);
          if (d < bd) { bd = d; best = i; }
        }
      });
      let el;
      if (best >= 0 && animate) { el = pool[best].el; pool[best] = null; }
      else {
        el = this.makePiece(code, sq);
        if (animate) { el.classList.add('fade'); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('fade'))); }
        this.pcLayer.appendChild(el);
      }
      if (!animate) el.style.transition = 'none';
      this.placeEl(el, sq);
      if (!animate) requestAnimationFrame(() => (el.style.transition = ''));
      newEls.set(sq, el);
    }
    for (const p of pool) if (p && p.el) {
      if (animate) { p.el.style.zIndex = 0; p.el.classList.add('fade'); setTimeout(() => p.el.remove(), 220); }
      else p.el.remove();
    }
    this.pos = next;
    this.pieceEls = newEls;
  }

  setMarks(m) { Object.assign(this.marks, m); this.applyMarks(); }
  applyMarks() {
    if (!this.sqEls) return;
    for (const sq in this.sqEls) this.sqEls[sq].classList.remove('last', 'check', 'sel', 'dot', 'cap', 'premove', 'hover');
    (this.marks.last || []).forEach(s => this.sqEls[s]?.classList.add('last'));
    (this.marks.premove || []).forEach(s => this.sqEls[s]?.classList.add('premove'));
    if (this.marks.check) this.sqEls[this.marks.check]?.classList.add('check');
    if (this.marks.sel) {
      this.sqEls[this.marks.sel]?.classList.add('sel');
      for (const d of this.o.dests(this.marks.sel)) this.sqEls[d]?.classList.add(this.pos[d] ? 'cap' : 'dot');
    }
  }
  setView(v) { this.view = v; this.el.classList.toggle('view', v); }

  /* ---------- pointer interaction ---------- */
  sqFromPoint(cx, cy) {
    const r = this.el.getBoundingClientRect();
    const x = Math.floor(((cx - r.left) / r.width) * 8), y = Math.floor(((cy - r.top) / r.height) * 8);
    if (x < 0 || x > 7 || y < 0 || y > 7) return null;
    return xyToSq(x, y, this.orientation);
  }
  bindPointer() {
    const el = this.el;
    el.addEventListener('contextmenu', e => e.preventDefault());
    el.addEventListener('pointerdown', e => {
      if (this.promoOpen) return;
      const sq = this.sqFromPoint(e.clientX, e.clientY);
      if (!sq) return;
      if (e.button === 2) { this.drawStart = { sq, color: e.shiftKey ? 'good' : e.altKey ? 'warn' : 'think' }; return; }
      if (e.button !== 0) return;
      if (this.drawings.length) { this.drawings = []; this.renderDrawings(); }
      const sel = this.marks.sel;
      // click-to-move onto a destination
      if (sel && sel !== sq && this.o.dests(sel).includes(sq)) { this.commit(sel, sq); return; }
      if (this.pos[sq] && this.o.canMove(sq)) {
        const wasSel = sel === sq;
        this.setMarks({ sel: sq });
        const pe = this.pieceEls.get(sq);
        this.drag = { from: sq, el: pe, sx: e.clientX, sy: e.clientY, moved: false, wasSel };
        el.setPointerCapture(e.pointerId);
      } else if (sel) this.setMarks({ sel: null });
    });
    el.addEventListener('pointermove', e => {
      const d = this.drag;
      if (!d) return;
      if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 4) return;
      d.moved = true;
      const r = el.getBoundingClientRect(), s = r.width / 8;
      d.el.classList.add('drag');
      d.el.style.transform = `translate(${e.clientX - r.left - s / 2}px, ${e.clientY - r.top - s / 2}px)`;
      const over = this.sqFromPoint(e.clientX, e.clientY);
      if (over !== d.over) {
        if (d.over) this.sqEls[d.over]?.classList.remove('hover');
        d.over = over;
        if (over && this.o.dests(d.from).includes(over)) this.sqEls[over].classList.add('hover');
      }
    });
    const end = e => {
      if (this.drawStart && e.button === 2) {
        const to = this.sqFromPoint(e.clientX, e.clientY);
        if (to) this.toggleDrawing(this.drawStart.sq, to, this.drawStart.color);
        this.drawStart = null;
        return;
      }
      const d = this.drag;
      if (!d) return;
      this.drag = null;
      d.el.classList.remove('drag');
      if (d.over) this.sqEls[d.over]?.classList.remove('hover');
      const to = this.sqFromPoint(e.clientX, e.clientY);
      if (d.moved && to && to !== d.from && this.o.dests(d.from).includes(to)) {
        // drop: place instantly at target, no slide
        d.el.style.transition = 'none';
        this.placeEl(d.el, to);
        requestAnimationFrame(() => (d.el.style.transition = ''));
        this.commit(d.from, to, true);
        return;
      }
      this.placeEl(d.el, d.from);
      if (!d.moved && d.wasSel) this.setMarks({ sel: null });
      else if (d.moved && to !== d.from) this.setMarks({ sel: null });
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', () => { if (this.drag) { this.placeEl(this.drag.el, this.drag.from); this.drag = null; } });
  }
  commit(from, to, dropped = false) {
    this.setMarks({ sel: null });
    this.o.onMove(from, to, { dropped });
  }

  /* ---------- drawings (arrows / circles) ---------- */
  toggleDrawing(from, to, color) {
    const type = from === to ? 'circle' : 'arrow';
    const i = this.drawings.findIndex(d => d.from === from && d.to === to);
    if (i >= 0) { const same = this.drawings[i].color === color; this.drawings.splice(i, 1); if (same) return this.renderDrawings(); }
    this.drawings.push({ type, from, to, color });
    this.renderDrawings();
    this.o.onUserDraw?.(this.drawings);
  }
  setDrawings(list) { this.drawings = list.slice(); this.renderDrawings(); }
  renderDrawings() {
    const S = 100; // viewBox units per square
    this.svg.style.opacity = 1;
    const c = s => { const [x, y] = sqToXY(s, this.orientation); return [x * S + S / 2, y * S + S / 2]; };
    let out = '';
    for (const d of this.drawings) {
      const col = ARROW_COLORS[d.color] || d.color, op = d.opacity ?? 0.82;
      if (d.type === 'circle') {
        const [x, y] = c(d.from);
        out += `<circle cx="${x}" cy="${y}" r="${S * 0.44}" fill="none" stroke="${col}" stroke-width="${S * 0.07}" opacity="${op}"/>`;
      } else {
        const [x1, y1] = c(d.from), [x2, y2] = c(d.to);
        const ang = Math.atan2(y2 - y1, x2 - x1), len = Math.hypot(x2 - x1, y2 - y1) - S * 0.26;
        const w = S * (d.width || 0.16), hl = w * 1.9;
        const ex = x1 + Math.cos(ang) * len, ey = y1 + Math.sin(ang) * len;
        const hx = x1 + Math.cos(ang) * (len - hl), hy = y1 + Math.sin(ang) * (len - hl);
        const px = -Math.sin(ang) * w * 1.35, py = Math.cos(ang) * w * 1.35;
        const dash = d.dash ? ` stroke-dasharray="${d.dash}"` : '';
        out += `<g opacity="${op}"><line x1="${x1}" y1="${y1}" x2="${hx}" y2="${hy}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"${dash}/>` +
               `<path d="M${ex},${ey} L${hx + px},${hy + py} L${hx - px},${hy - py}Z" fill="${col}" stroke="${col}" stroke-width="${w * 0.3}" stroke-linejoin="round"/></g>`;
      }
    }
    this.svg.setAttribute('viewBox', `0 0 ${S * 8} ${S * 8}`);
    this.svg.innerHTML = out;
  }

  /* ---------- promotion picker ---------- */
  askPromotion(sq, color) {
    return new Promise(resolve => {
      this.promoOpen = true;
      const [x, y] = sqToXY(sq, this.orientation);
      const down = y === 0; // list grows downward from top edge
      const wrap = document.createElement('div');
      wrap.className = 'promo';
      const col = document.createElement('div');
      col.className = 'col';
      col.style.left = x * 12.5 + '%';
      col.style[down ? 'top' : 'bottom'] = '0';
      for (const p of ['Q', 'N', 'R', 'B']) {
        const b = document.createElement('button');
        b.style.backgroundImage = `url(${PIECE_URL(color + p)})`;
        b.setAttribute('aria-label', { Q: 'Queen', N: 'Knight', R: 'Rook', B: 'Bishop' }[p]);
        b.onclick = ev => { ev.stopPropagation(); close(p.toLowerCase()); };
        col.appendChild(b);
      }
      wrap.appendChild(col);
      const close = v => { this.promoOpen = false; wrap.remove(); resolve(v); };
      wrap.addEventListener('pointerdown', ev => { if (ev.target === wrap) { ev.stopPropagation(); close(null); } });
      this.el.appendChild(wrap);
    });
  }

  overlay(html) {
    this.clearOverlay();
    const d = document.createElement('div');
    d.className = 'card endcard';
    d.innerHTML = html;
    d.addEventListener('pointerdown', e => e.stopPropagation());
    this.el.appendChild(d);
    this.ov = d;
    return d;
  }
  clearOverlay() { this.ov?.remove(); this.ov = null; }
}
