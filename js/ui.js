// ponder — UI helpers: icons, toast, modal, confirm, settings sheet
import { settings, THEMES, PIECE_SETS, pieceUrl } from './settings.js';
const P = {
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  play: '<path d="M9 3h6l-1 4h2l-2 5h3l-1 9H8l-1-9h3L8 7h2z"/>',
  replay: '<path d="M4 12a8 8 0 1 0 3-6.2"/><path d="M4 4v4h4"/><path d="M11 9v4l3 2"/>',
  train: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8" fill="currentColor"/>',
  journal: '<path d="M6 3h11a2 2 0 0 1 2 2v16H8a2 2 0 0 1-2-2z"/><path d="M6 17a2 2 0 0 1 2-2h11"/><path d="M10 7h5M10 10h5"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2.5 12h3M18.5 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  first: '<path d="M6 5v14M18 6l-8 6 8 6z"/>', prev: '<path d="M15 5l-7 7 7 7"/>', next: '<path d="M9 5l7 7-7 7"/>', last: '<path d="M18 5v14M6 6l8 6-8 6z"/>',
  flip: '<path d="M7 4v14M4 15l3 3 3-3M17 20V6M14 9l3-3 3 3"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  draw: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 9.5l2 0M8 15l8-6M13.5 14.5h2.5"/>',
  share: '<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
  sound: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
  mute: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8"/>',
  book: '<path d="M4 5c3-1.5 5.5-1.5 8 0v15c-2.5-1.5-5-1.5-8 0z"/><path d="M12 5c2.5-1.5 5-1.5 8 0v15c-3-1.5-5.5-1.5-8 0"/>',
  bolt: '<path d="M13 3L5 13h6l-1 8 8-10h-6z"/>', fire: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 1.5 1 2 2 3 3 0-2 0-4 0-6z"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>', inf: '<path d="M7 9a3 3 0 1 0 0 6c3 0 7-6 10-6a3 3 0 1 1 0 6c-3 0-7-6-10-6z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2 .6 3.5 2.9 3.5 6"/>',
  device: '<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M4 12h16"/>',
  cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
  coach: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/><path d="M16 4l3-2"/>',
  boardic: '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M3.5 9.2h17M3.5 14.8h17M9.2 3.5v17M14.8 3.5v17"/>',
  archive: '<rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13h4"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  fen: '<path d="M4 7h16M4 12h10M4 17h7"/><circle cx="18" cy="16" r="3"/>',
  autoplay: '<path d="M7 5l12 7-12 7z" fill="currentColor"/>', pause: '<path d="M8 5v14M16 5v14"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  collapse: '<path d="M15 6l-6 6 6 6"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>', check: '<path d="M5 12l5 5 9-10"/>', spin: '<path d="M12 3a9 9 0 1 0 9 9"/>',
};
export function icon(name, size) {
  const s = size ? ` width="${size}" height="${size}"` : '';
  return `<svg${s} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;
}
let tt;
export function toast(msg) {
  let el = document.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = msg; el.classList.add('show');
  clearTimeout(tt); tt = setTimeout(() => el.classList.remove('show'), 1800);
}
export function modal(title, bodyHtml, { onClose } = {}) {
  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = `<div class="mcard" role="dialog" aria-label="${title}"><div class="mhead"><h2>${title}</h2><button class="ib" data-x aria-label="Close">${icon('x')}</button></div><div class="mbody">${bodyHtml}</div></div>`;
  const close = () => { m.remove(); document.removeEventListener('keydown', esc); onClose?.(); };
  const esc = e => e.key === 'Escape' && close();
  m.addEventListener('pointerdown', e => { if (e.target === m) close(); });
  m.querySelector('[data-x]').onclick = close;
  document.addEventListener('keydown', esc);
  document.body.appendChild(m);
  return { el: m, close };
}
export function confirmBox(title, text, yes = 'Yes', no = 'Cancel') {
  return new Promise(res => {
    const { el, close } = modal(title, `<div class="confirm" style="display:flex;flex-direction:column;gap:20px"><p>${text}</p><div class="row"><button class="b3 sm alt" data-n>${no}</button><button class="b3 sm" data-y>${yes}</button></div></div>`, { onClose: () => res(false) });
    el.querySelector('[data-y]').onclick = () => { res(true); el.remove(); };
    el.querySelector('[data-n]').onclick = close;
  });
}
export function openSettings() {
  const S = settings.all();
  const themes = Object.entries(THEMES).map(([k, t]) => `<div><button class="th ${S.theme === k ? 'on' : ''}" data-theme="${k}" aria-label="${t.name}">
    <i style="background:${t.l}"></i><i style="background:${t.d}"></i><i style="background:${t.d}"></i><i style="background:${t.l}"></i></button><div class="thn">${t.name}</div></div>`).join('');
  const sets = Object.entries(PIECE_SETS).map(([k, n]) => `<div><button class="set ${S.pieces === k ? 'on' : ''}" data-set="${k}" aria-label="${n}"><img src="${pieceUrl('wN', k)}" alt=""></button><div class="thn">${n}</div></div>`).join('');
  const tog = (k, t, d) => `<div class="tog"><div><b>${t}</b><small>${d}</small></div><button class="sw ${S[k] ? 'on' : ''}" data-tog="${k}" role="switch" aria-checked="${!!S[k]}" aria-label="${t}"></button></div>`;
  const { el } = modal('Settings', `
    <div><h3>Board</h3><div class="themes">${themes}</div></div>
    <div><h3>Pieces</h3><div class="sets">${sets}</div></div>
    <div><h3>Play</h3>
      ${tog('sound', 'Sounds', 'Moves, captures, checks and the clock')}
      ${tog('dots', 'Show legal moves', 'Dots on squares a piece can go to')}
      ${tog('coords', 'Coordinates', 'Letters and numbers on the board edge')}
      ${tog('animate', 'Piece animation', 'Pieces glide instead of jumping')}
      ${tog('autoQueen', 'Auto-queen', 'Promote to a queen without asking')}
    </div>`);
  el.addEventListener('click', e => {
    const th = e.target.closest('[data-theme]'), st = e.target.closest('[data-set]'), tg = e.target.closest('[data-tog]');
    if (th) { settings.set('theme', th.dataset.theme); el.querySelectorAll('.th').forEach(b => b.classList.toggle('on', b === th)); }
    if (st) { settings.set('pieces', st.dataset.set); el.querySelectorAll('.set').forEach(b => b.classList.toggle('on', b === st)); }
    if (tg) { const k = tg.dataset.tog, v = !settings.get(k); settings.set(k, v); tg.classList.toggle('on', v); tg.setAttribute('aria-checked', v); }
  });
}
