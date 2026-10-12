import { mountHome, mountSoon } from './home.js';
import { mountPlay } from './play.js';
import { mountReplay } from './replay.js';
import { apply } from './settings.js';
import { icon, openSettings, toast } from './ui.js';
import { sound } from './sound.js';

apply();
const tile = n => `<span class="rt">${icon(n)}</span><span class="rl">`;
document.querySelectorAll('.rail [data-ic]').forEach(el => {
  const art = el.matches('a.ri');
  el.innerHTML = (art ? `<img class="rimg" src="assets/icons/${el.dataset.ic}.svg" alt=""><span class="rl">` : tile(el.dataset.ic)) + el.textContent + '</span>';
});
// flyouts: a short menu next to each section, with one line on what each thing is
const FLY = {
  play: [['plus', 'New game', 'Pick a time control and start', '#/play/new'], ['device', 'Pass and play', 'Both sides on this screen', '#/play'],
    ['users', 'Play a friend', 'Online room with a code', null, 'Step 3'], ['coach', 'Play the coach', 'Fair game or coaching game', null, 'Step 3'], ['cpu', 'Play Stockfish', 'Levels 1 to 20', null, 'Step 4']],
  replay: [['archive', 'All games', 'Every finished game', '#/replay'], ['chat', 'Review with coach', 'Chapters, lessons, chat', null, 'Step 6']],
  train: [['train', 'Puzzles from your games', 'Your own mistakes, replayed', null, 'Step 7'], ['bolt', 'Lesson cards', 'Ideas that come back at the right time', null, 'Step 7'], ['star', 'Skill path', 'What to learn next', null, 'Step 7']],
  journal: [['journal', 'Plans and notes', 'What you thought, what happened', null, 'Step 7']],
};
const fly = document.createElement('div'); fly.className = 'fly'; document.body.appendChild(fly);
let flyT;
const hideFly = () => { flyT = setTimeout(() => fly.classList.remove('open'), 120); };
document.querySelectorAll('.rail a.ri').forEach(a => {
  const items = FLY[a.dataset.r]; if (!items) return;
  a.addEventListener('mouseenter', () => {
    clearTimeout(flyT);
    const r = a.getBoundingClientRect(), c = a.style.getPropertyValue('--c');
    fly.style.setProperty('--c', c);
    fly.innerHTML = `<div class="fh">${a.textContent}</div>` + items.map(([ic, t, d, href, tag]) => `<${href ? `a href="${href}"` : 'div'} class="fi ${href ? '' : 'lock'}"><span class="fic">${icon(ic)}</span><span><b>${t}</b><small>${d}</small></span>${tag ? `<span class="tag">${tag}</span>` : ''}</${href ? 'a' : 'div'}>`).join('');
    fly.style.top = Math.min(r.top - 6, innerHeight - fly.offsetHeight - 12) + 'px';
    fly.style.left = r.right + 8 + 'px';
    fly.classList.add('open');
  });
  a.addEventListener('mouseleave', hideFly);
});
fly.addEventListener('mouseenter', () => clearTimeout(flyT));
fly.addEventListener('mouseleave', hideFly);
fly.addEventListener('click', e => { if (e.target.closest('a')) fly.classList.remove('open'); });
const col = document.getElementById('collapse');
const setMin = v => { document.body.classList.toggle('rail-min', v); localStorage.setItem('ponder.railMin', v ? '1' : ''); };
setMin(!!localStorage.getItem('ponder.railMin'));
col.onclick = () => setMin(!document.body.classList.contains('rail-min'));
document.getElementById('openSettings').onclick = openSettings;
const sb = document.getElementById('toggleSound');
const paintSound = () => { sb.innerHTML = tile(sound.on ? 'sound' : 'mute') + (sound.on ? 'Sound' : 'Muted') + '</span>'; sb.title = sound.on ? 'Sound on' : 'Muted'; };
paintSound();
sb.onclick = () => { sound.toggle(); paintSound(); toast(sound.on ? 'Sound on' : 'Sound off'); };

const root = document.getElementById('view');
let cleanup = null;
const ROUTES = {
  '': () => mountHome(root),
  play: arg => mountPlay(root, arg),
  replay: arg => mountReplay(root, arg),
  train: () => mountSoon(root, { ic: 'train', title: 'Training is on the way', text: 'Puzzles built from your own mistakes, creative challenges and lesson cards that come back right when you need them.' }),
  journal: () => mountSoon(root, { ic: 'journal', title: 'Your journal is on the way', text: 'Your plans, my notes, and what every game taught you, all in one place.' }),
};
function route() {
  const [name, arg] = location.hash.replace(/^#\/?/, '').split(/[/?]/);
  const r = ROUTES[name] ? name : '';
  cleanup?.(); cleanup = ROUTES[r](arg) || null;
  document.querySelectorAll('.rail a.ri').forEach(a => a.classList.toggle('on', a.dataset.r === r));
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
route();
