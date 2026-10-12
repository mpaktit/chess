// ponder — user settings (board theme, pieces, behavior)
export const THEMES = {
  slate:  { name: 'Slate',  l: '#E4E8EE', d: '#8193B2', ll: '#F3E3A6', ld: '#C9B26C', sl: '#C9D3FF', sd: '#8C9BEA' },
  brass:  { name: 'Brass',  l: '#F1E4C8', d: '#B98B58', ll: '#F6E58D', ld: '#D3AE4E', sl: '#F7D29A', sd: '#C99649' },
  forest: { name: 'Forest', l: '#EBECD0', d: '#739552', ll: '#F5F682', ld: '#B9CA43', sl: '#F5F682', sd: '#B9CA43' },
  ink:    { name: 'Ink',    l: '#E6E8EE', d: '#4B5874', ll: '#F2E3A0', ld: '#8E8A5C', sl: '#C4CCF5', sd: '#6672A8' },
  rose:   { name: 'Rose',   l: '#F3E6E2', d: '#B37C86', ll: '#F6E3A8', ld: '#D1A770', sl: '#F0C9D6', sd: '#B97B92' },
  stone:  { name: 'Stone',  l: '#DEDBD4', d: '#8E8A82', ll: '#EBDC9E', ld: '#B3A46A', sl: '#D3D6EC', sd: '#9096BC' },
};
export const PIECE_SETS = { staunty: 'Staunty', cburnett: 'Classic', merida: 'Merida', alpha: 'Alpha', maestro: 'Maestro', california: 'California' };
const DEFAULTS = { theme: 'slate', pieces: 'staunty', sound: true, coords: true, dots: true, autoQueen: false, animate: true };
const KEY = 'ponder.settings';
let S = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };

export const settings = {
  get: k => S[k],
  all: () => ({ ...S }),
  set(k, v) { S[k] = v; localStorage.setItem(KEY, JSON.stringify(S)); apply(); window.dispatchEvent(new CustomEvent('ponder:settings', { detail: { k, v } })); },
};
export const pieceUrl = (code, set = S.pieces) => `assets/pieces/${set}/${code}.svg`;
export function apply() {
  const t = THEMES[S.theme] || THEMES.slate, r = document.documentElement.style;
  r.setProperty('--sq-light', t.l); r.setProperty('--sq-dark', t.d);
  r.setProperty('--sq-last-l', t.ll); r.setProperty('--sq-last-d', t.ld);
  r.setProperty('--sq-sel-l', t.sl); r.setProperty('--sq-sel-d', t.sd);
  r.setProperty('--anim', S.animate ? '.2s' : '0s');
  document.body.classList.toggle('nocoords', !S.coords);
  document.body.classList.toggle('nodots', !S.dots);
}
