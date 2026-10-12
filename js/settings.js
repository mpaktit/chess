// ponder — user settings (board theme, pieces, behavior)
export const THEMES = {
  slate:  { name: 'Slate',  l: '#E4E8EE', d: '#8193B2', ll: '#F3E3A6', ld: '#C9B26C', sl: '#C9D3FF', sd: '#8C9BEA' },
  brass:  { name: 'Brass',  l: '#F1E4C8', d: '#B98B58', ll: '#F6E58D', ld: '#D3AE4E', sl: '#F7D29A', sd: '#C99649' },
  forest: { name: 'Forest', l: '#EBECD0', d: '#739552', ll: '#F5F682', ld: '#B9CA43', sl: '#F5F682', sd: '#B9CA43' },
  ink:    { name: 'Ink',    l: '#E6E8EE', d: '#4B5874', ll: '#F2E3A0', ld: '#8E8A5C', sl: '#C4CCF5', sd: '#6672A8' },
  rose:   { name: 'Rose',   l: '#F3E6E2', d: '#B37C86', ll: '#F6E3A8', ld: '#D1A770', sl: '#F0C9D6', sd: '#B97B92' },
  sky:    { name: 'Sky',    l: '#EEF1F4', d: '#6A9BDA', ll: '#F4E9A8', ld: '#B9C37A', sl: '#CFE0FA', sd: '#4F84CC' },
  stone:  { name: 'Stone',  l: '#DEDBD4', d: '#8E8A82', ll: '#EBDC9E', ld: '#B3A46A', sl: '#D3D6EC', sd: '#9096BC' },
};
export const PIECE_SETS = { ponder: 'Classic', pirouetti2: 'Pirouetti', tatiana: 'Tatiana', staunty: 'Staunty', cburnett: 'Cburnett', merida: 'Merida', alpha: 'Alpha', maestro: 'Maestro', california: 'California' };
const DEFAULTS = { v: 2, theme: 'slate', pieces: 'ponder', sound: true, coords: true, dots: true, autoQueen: false, animate: true };
const KEY = 'ponder.settings';
let S = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
if ((S.v || 1) < 2) { S.pieces = 'ponder'; S.v = 2; localStorage.setItem(KEY, JSON.stringify(S)); }

export const settings = {
  get: k => S[k],
  all: () => ({ ...S }),
  set(k, v) { S[k] = v; localStorage.setItem(KEY, JSON.stringify(S)); apply(); window.dispatchEvent(new CustomEvent('ponder:settings', { detail: { k, v } })); },
};
const CKEY = 'ponder.customPieces';
let CUSTOM = JSON.parse(localStorage.getItem(CKEY) || 'null');
export const customPieces = {
  get: () => CUSTOM,
  set(map) { CUSTOM = map; if (map) localStorage.setItem(CKEY, JSON.stringify(map)); else localStorage.removeItem(CKEY); },
};
export const pieceUrl = (code, set = S.pieces) => set === 'custom' && CUSTOM?.[code] ? CUSTOM[code] : `assets/pieces/${set === 'custom' ? 'ponder' : set}/${code}.svg`;
export function apply() {
  const t = THEMES[S.theme] || THEMES.slate, r = document.documentElement.style;
  r.setProperty('--sq-light', t.l); r.setProperty('--sq-dark', t.d);
  r.setProperty('--sq-last-l', t.ll); r.setProperty('--sq-last-d', t.ld);
  r.setProperty('--sq-sel-l', t.sl); r.setProperty('--sq-sel-d', t.sd);
  r.setProperty('--anim', S.animate ? '.2s' : '0s');
  document.body.classList.toggle('nocoords', !S.coords);
  document.body.classList.toggle('nodots', !S.dots);
}
