// ponder — shared pieces of UI: figurine move list, player strips, game archive
import { pieceUrl } from './settings.js';
import { Game } from './game.js';

export const NAME = { w: 'White', b: 'Black' };
const ARCH = 'ponder.games';

/** SAN with a little piece drawing instead of the letter (Nf3 → [knight]f3) */
export function figSan(san, color) {
  const img = p => `<img class="fig" src="${pieceUrl('w' + p)}" alt="${p}">`;
  let h = san.replace(/=([QRBN])/, (_, p) => '=' + img(p));
  const m = h.match(/^([KQRBN])/);
  if (m) h = img(m[1]) + h.slice(1);
  return h;
}
export function fmtSpent(ms) {
  if (ms == null) return '';
  const s = ms / 1000;
  if (s < 10) return s.toFixed(1) + 's';
  if (s < 60) return Math.round(s) + 's';
  return `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
}
/** Move list rows. spent: ms per ply (optional). */
export function moveListHTML(moves, view, spent = []) {
  if (!moves.length) return `<div class="mempty"><b>No moves yet</b>Drag a piece or tap it, then tap where it should go.</div>`;
  const max = Math.max(1000, ...spent.filter(x => x != null));
  const bar = (i, c) => spent[i] == null ? '<span></span>' : `<span class="tbar ${c}"><em>${fmtSpent(spent[i])}</em><span class="trk"><i style="width:${Math.max(6, Math.round(spent[i] / max * 100))}%"></i></span></span>`;
  let h = '';
  for (let i = 0; i < moves.length; i += 2) {
    const a = moves[i], b = moves[i + 1];
    const cell = (m, p) => `<button class="mv ${view === p ? 'cur' : ''}" data-ply="${p}">${figSan(m.san, m.color)}</button>`;
    h += `<div class="mrow"><span class="n">${i / 2 + 1}.</span>${cell(a, i + 1)}${b ? cell(b, i + 2) : '<span></span>'}
      <span class="tcol">${bar(i, 'w')}${b ? bar(i + 1, 'b') : ''}</span></div>`;
  }
  return h;
}
export const avatar = c => `<div class="ava ${c}"><img src="${pieceUrl(c + 'K')}" alt=""></div>`;
export function capsHTML(game, c) {
  const mat = game.material(), opp = c === 'w' ? 'b' : 'w';
  let caps = '', prev = '';
  for (const p of mat[c]) { caps += `<i class="${prev && prev !== p ? 'gap' : ''}" style="background-image:url(${pieceUrl(opp + p.toUpperCase())})"></i>`; prev = p; }
  return caps + (mat.lead[c] ? `<b>+${mat.lead[c]}</b>` : '');
}
export const resultText = r => r === '1-0' ? 'White won' : r === '0-1' ? 'Black won' : 'Draw';

/* ---------- archive of finished games (localStorage) ---------- */
export const archive = {
  all() { try { return JSON.parse(localStorage.getItem(ARCH) || '[]'); } catch { return []; } },
  get(id) { return this.all().find(g => g.id === id); },
  put(rec) {
    const list = this.all().filter(g => g.id !== rec.id);
    list.unshift(rec);
    localStorage.setItem(ARCH, JSON.stringify(list.slice(0, 200)));
  },
  remove(id) { localStorage.setItem(ARCH, JSON.stringify(this.all().filter(g => g.id !== id))); },
};
export function gameFromRecord(rec) {
  const g = new Game();
  for (const s of rec.sans) { try { const m = g.chess.move(s); g.moves.push(m); g.fens.push(g.chess.fen()); } catch { break; } }
  g.view = 0;
  if (rec.ended) g.ended = rec.ended;
  return g;
}
export function ago(ts) {
  const d = (Date.now() - ts) / 1000;
  if (d < 60) return 'just now';
  if (d < 3600) return Math.floor(d / 60) + ' min ago';
  if (d < 86400) return Math.floor(d / 3600) + ' h ago';
  if (d < 86400 * 7) return Math.floor(d / 86400) + ' d ago';
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
export function gameRowHTML(rec) {
  const r = rec.result, chip = r === '1-0' ? ['1–0', 'w'] : r === '0-1' ? ['0–1', 'b'] : ['½', 'd'];
  return `<a class="grow" href="#/replay/${rec.id}">
    <span class="gres ${chip[1]}">${chip[0]}</span>
    <span class="gmeta"><b>${rec.opening || 'Own path'}</b><small>${rec.reason} · ${Math.ceil(rec.sans.length / 2)} moves</small></span>
    <span class="gside"><span class="tag">${rec.tc === '—' ? '∞' : rec.tc}</span><small>${ago(rec.ts)}</small></span></a>`;
}
export function download(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/x-chess-pgn' }));
  a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
export async function copy(text, toast, label) {
  try { await navigator.clipboard.writeText(text); toast(label + ' copied'); } catch { prompt('Copy:', text); }
}
