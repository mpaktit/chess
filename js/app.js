import { mountHome, mountSoon } from './home.js';
import { mountPlay } from './play.js';

const root = document.getElementById('view');
let cleanup = null;
const ROUTES = {
  '': () => mountHome(root),
  play: () => mountPlay(root),
  replay: () => mountSoon(root, { ic: 'replay', title: 'Replays are coming', text: 'After each game, we’ll walk through it together in chapters, with a chat so you can ask about any move.' }),
  train: () => mountSoon(root, { ic: 'target', title: 'Training is coming', text: 'Puzzles built from your own mistakes, creative challenges and lesson cards.' }),
  journal: () => mountSoon(root, { ic: 'book', title: 'Your journal is coming', text: 'Your plans, my notes and what each game taught you, all in one place.' }),
};
function route() {
  const name = location.hash.replace(/^#\/?/, '').split(/[/?]/)[0];
  cleanup?.(); cleanup = null;
  cleanup = (ROUTES[name] || ROUTES[''])() || null;
  document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('on', a.dataset.r === (ROUTES[name] ? name : '')));
}
window.addEventListener('hashchange', route);
route();
