// ponder — game state around chess.js
import { Chess } from './vendor/chess.js';
import { openingFor } from './openings.js';

const VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

export class Game {
  constructor(fen) { this.reset(fen); }
  reset(fen) {
    this.chess = fen ? new Chess(fen) : new Chess();
    this.startFen = this.chess.fen();
    this.moves = [];          // verbose moves
    this.fens = [this.startFen];
    this.view = 0;            // ply currently shown
    this.ended = null;        // {result, reason} for resign/agreed draw/timeout
  }
  get ply() { return this.moves.length; }
  get live() { return this.view === this.ply; }
  get turn() { return this.chess.turn(); }
  fenAt(i = this.view) { return this.fens[i]; }

  dests(sq) {
    if (!this.live || this.over) return [];
    return [...new Set(this.chess.moves({ square: sq, verbose: true }).map(m => m.to))];
  }
  isPromotion(from, to) {
    return this.chess.moves({ square: from, verbose: true }).some(m => m.to === to && m.promotion);
  }
  move(from, to, promotion) {
    let m;
    try { m = this.chess.move({ from, to, promotion: promotion || 'q' }); } catch { return null; }
    this.moves.push(m);
    this.fens.push(this.chess.fen());
    this.view = this.ply;
    return m;
  }
  undo() {
    if (!this.ply) return null;
    this.chess.undo(); this.moves.pop(); this.fens.pop();
    this.ended = null; this.view = this.ply;
  }
  resign(color) { this.ended = { result: color === 'w' ? '0-1' : '1-0', reason: (color === 'w' ? 'White' : 'Black') + ' resigned' }; }
  agreeDraw() { this.ended = { result: '1/2-1/2', reason: 'Draw agreed' }; }

  get over() { return !!this.status().over; }
  status() {
    const c = this.chess;
    if (this.ended) return { over: true, ...this.ended };
    if (c.isCheckmate()) return { over: true, result: c.turn() === 'w' ? '0-1' : '1-0', reason: 'Checkmate', check: true };
    if (c.isStalemate()) return { over: true, result: '1/2-1/2', reason: 'Stalemate' };
    if (c.isInsufficientMaterial()) return { over: true, result: '1/2-1/2', reason: 'Not enough material to mate' };
    if (c.isThreefoldRepetition()) return { over: true, result: '1/2-1/2', reason: 'Threefold repetition' };
    if (c.isDrawByFiftyMoves()) return { over: true, result: '1/2-1/2', reason: '50-move rule' };
    return { over: false, check: c.inCheck() };
  }
  /** King square in check for the shown position */
  checkSquare(i = this.view) {
    const c = new Chess(this.fens[i]);
    if (!c.inCheck()) return null;
    for (const row of c.board()) for (const p of row) if (p && p.type === 'k' && p.color === c.turn()) return p.square;
    return null;
  }
  lastMove(i = this.view) { const m = this.moves[i - 1]; return m ? [m.from, m.to] : []; }

  /** Captured pieces up to ply i, grouped by capturer, plus material lead. */
  material(i = this.view) {
    const cap = { w: [], b: [] };
    for (const m of this.moves.slice(0, i)) {
      if (m.captured) cap[m.color].push(m.captured);
      if (m.promotion) cap[m.color].push('promo:' + m.promotion);
    }
    const score = c => cap[c].reduce((s, p) => s + (p.startsWith('promo:') ? VALUE[p.slice(6)] - 1 : VALUE[p]), 0);
    const order = 'qrbnp';
    const clean = c => cap[c].filter(p => !p.startsWith('promo:')).sort((a, b) => order.indexOf(a) - order.indexOf(b));
    const diff = score('w') - score('b');
    return { w: clean('w'), b: clean('b'), lead: { w: Math.max(0, diff), b: Math.max(0, -diff) } };
  }
  opening() { return openingFor(this.moves.map(m => m.san)); }
  pgn(headers = {}) {
    const c = new Chess(this.startFen);
    for (const m of this.moves) c.move(m.san);
    const s = this.status();
    c.setHeader('Event', headers.event || 'ponder game');
    c.setHeader('Date', new Date().toISOString().slice(0, 10).replace(/-/g, '.'));
    c.setHeader('White', headers.white || 'White');
    c.setHeader('Black', headers.black || 'Black');
    c.setHeader('Result', s.over ? s.result : '*');
    return c.pgn();
  }
}
