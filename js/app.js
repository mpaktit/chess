import { mountHome, mountSoon } from './home.js';
import { mountPlay } from './play.js';
import { mountReplay } from './replay.js';
import { apply } from './settings.js';
import { icon, openSettings, toast } from './ui.js';
import { sound } from './sound.js';

apply();
const tile = n => `<span class="rt">${icon(n)}</span><span class="rl">`;
document.querySelectorAll('.rail [data-ic]').forEach(el => { el.innerHTML = tile(el.dataset.ic) + el.textContent + '</span>'; el.title = el.textContent; });
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
  play: () => mountPlay(root),
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
