import { mountHome, mountSoon } from './home.js';
import { mountPlay } from './play.js';
import { apply } from './settings.js';
import { icon, openSettings, toast } from './ui.js';
import { sound } from './sound.js';

apply();
document.querySelectorAll('[data-ic]').forEach(el => el.insertAdjacentHTML('afterbegin', icon(el.dataset.ic)));
document.getElementById('openSettings').onclick = openSettings;
const sb = document.getElementById('toggleSound');
const paintSound = () => { sb.innerHTML = icon(sound.on ? 'sound' : 'mute') + (sound.on ? 'Sound' : 'Muted'); };
paintSound();
sb.onclick = () => { sound.toggle(); paintSound(); toast(sound.on ? 'Sound on' : 'Sound off'); };

const root = document.getElementById('view');
let cleanup = null;
const ROUTES = {
  '': () => mountHome(root),
  play: () => mountPlay(root),
  replay: () => mountSoon(root, { ic: 'replay', title: 'Replays are on the way', text: 'After each game we’ll walk through it together in chapters, with a chat right next to the board so you can ask about any move.' }),
  train: () => mountSoon(root, { ic: 'train', title: 'Training is on the way', text: 'Puzzles built from your own mistakes, creative challenges and lesson cards that come back right when you need them.' }),
  journal: () => mountSoon(root, { ic: 'journal', title: 'Your journal is on the way', text: 'Your plans, my notes, and what every game taught you, all in one place.' }),
};
function route() {
  const name = location.hash.replace(/^#\/?/, '').split(/[/?]/)[0];
  const r = ROUTES[name] ? name : '';
  cleanup?.(); cleanup = ROUTES[r]() || null;
  document.querySelectorAll('.rail a.ri').forEach(a => a.classList.toggle('on', a.dataset.r === r));
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
route();
