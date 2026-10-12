import { Board } from './board.js';
import { icon } from './ui.js';
import { Game } from './game.js';
import { archive, gameRowHTML } from './parts.js';
import { openingFor } from './openings.js';
const IDEAS = [
  { t: 'Count before you capture', b: 'Before taking, count attackers and defenders on that square. More attackers usually means the capture works.',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R', arrows: [['f3', 'e5', 'think'], ['c6', 'e5', 'warn']] },
  { t: 'f7 is the weak spot', b: 'Early on, only the king guards f7. That is why so many quick attacks aim right there.',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR', arrows: [['c4', 'f7', 'warn'], ['f3', 'f7', 'warn']] },
  { t: 'Knights love outposts', b: 'A knight on a square no enemy pawn can attack is often worth more than a rook.',
    fen: 'r4rk1/pp3ppp/3p4/2pNp3/2P1P3/8/PP3PPP/R4RK1', arrows: [], circles: ['d5'] },
];
const QUICK = [
  ['1+0', 'Bullet', 'bolt'], ['2+1', 'Bullet', 'bolt'], ['3+0', 'Blitz', 'fire'], ['3+2', 'Blitz', 'fire'],
  ['5+0', 'Blitz', 'fire'], ['10+0', 'Rapid', 'timer'], ['15+10', 'Rapid', 'timer'], ['30+0', 'Rapid', 'timer'],
];
const qlabel = k => k.endsWith('+0') ? k.split('+')[0] + ' min' : k;
export function mountHome(root) {
  const idea = IDEAS[new Date().getDate() % IDEAS.length];
  const saved = JSON.parse(localStorage.getItem('ponder.local') || 'null');
  const going = saved?.sans?.length && !saved?.ended;
  const games = archive.all();
  const n = { w: 0, b: 0, d: 0 }; let plies = 0;
  games.forEach(g => { n[g.result === '1-0' ? 'w' : g.result === '0-1' ? 'b' : 'd']++; plies += g.sans.length; });
  const fmt = ms => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const cont = going ? (() => {
    const g = new Game(); for (const m of saved.sans) { try { g.chess.move(m); } catch { break; } }
    const turn = g.chess.turn() === 'w' ? 'White' : 'Black';
    return `<a class="hcont" href="#/play">
      <div class="hcb" id="cboard"></div>
      <div class="hci"><span class="k">${icon('play', 14)}Game in progress</span><b>${openingFor(saved.sans) || 'Your own path'}</b>
        <small>Move ${Math.ceil(saved.sans.length / 2)} · ${turn} to move${saved.tc && saved.tc !== '—' ? ` · ${saved.tc}` : ''}</small>
        ${saved.times && saved.tc !== '—' ? `<div class="hclk"><span><i class="w"></i>${fmt(saved.times.w)}</span><span><i class="b"></i>${fmt(saved.times.b)}</span></div>` : ''}
        <span class="b3 sm">Continue game</span></div></a>`;
  })() : '';
  root.innerHTML = `
  <div class="home">
    <div class="hmain">
      <section class="hhero">
        <div class="hh-top"><div><h1>Play</h1><p>Pick a time and the board is ready. One screen, both sides, for now.</p></div>
          <a class="b3 alt sm" href="#/play/new">${icon('plus', 18)}Custom game</a></div>
        ${cont}
        <div class="quick">${QUICK.map(([k, n, ic]) => `<a class="qb" href="#/play/start:${k}"><span class="qi">${icon(ic, 18)}</span><b>${qlabel(k)}</b><small>${n}</small></a>`).join('')}</div>
      </section>
      <section class="hcard">
        <div class="hc-h"><h3>Recent games</h3>${games.length ? `<a href="#/replay">See all ${icon('next', 14)}</a>` : ''}</div>
        ${games.length ? `<div class="hrec">${games.slice(0, 5).map(gameRowHTML).join('')}</div>`
          : `<div class="hempty">${icon('archive', 22)}<div><b>Nothing here yet</b><small>Finished games show up here, ready to replay move by move.</small></div></div>`}
      </section>
      <section class="hnext">
        <div class="hn"><span class="hni" style="--c:var(--think)">${icon('chat')}</span><div><b>Coaching game</b><small>I play, think out loud, and help when you ask.</small></div><span class="tag">Step 5</span></div>
        <div class="hn"><span class="hni" style="--c:var(--brass)">${icon('flag')}</span><div><b>Fair game vs me</b><small>Full strength, no help. We talk after.</small></div><span class="tag">Step 3</span></div>
        <div class="hn"><span class="hni" style="--c:var(--good)">${icon('users')}</span><div><b>Play a friend</b><small>Share a room code and play live.</small></div><span class="tag">Step 3</span></div>
      </section>
    </div>
    <aside class="hside">
      <section class="hcard">
        <div class="hc-h"><h3>Your record</h3><span class="muted">this device</span></div>
        <div class="hstats"><div><b>${games.length}</b><span>Games</span></div><div><b>${n.w}</b><span>White won</span></div><div><b>${n.b}</b><span>Black won</span></div><div><b>${n.d}</b><span>Draws</span></div></div>
        ${games.length ? `<div class="hbar"><i class="w" style="flex:${n.w || 0}"></i><i class="d" style="flex:${n.d || 0}"></i><i class="b" style="flex:${n.b || 0}"></i></div><small class="muted">Average length: ${Math.round(plies / games.length / 2)} moves</small>` : ''}
      </section>
      <section class="hcard">
        <div class="hc-h"><h3>Idea of the day</h3></div>
        <div id="iboard" class="ib2"></div>
        <b class="it">${idea.t}</b><p class="ip">${idea.b}</p>
      </section>
      <section class="hcard">
        <div class="hc-h"><h3>Building ponder</h3><span class="muted">3 of 8</span></div>
        <ul class="roadmap">
          <li class="done"><i>${icon('check', 12)}</i>Board and rules</li><li class="done"><i>${icon('check', 12)}</i>Clocks, controls, replays</li><li class="now"><i>3</i>Online rooms</li>
          <li><i>4</i>Stockfish and analysis</li><li><i>5</i>Coaching game</li><li><i>6</i>Replay with coach chat</li><li><i>7</i>Puzzles, lesson cards, path</li></ul>
      </section>
    </aside>
  </div>`;
  if (going) { const cb = new Board(root.querySelector('#cboard'), { coords: false, orientation: saved.orientation || 'w' }); cb.setPosition(fenFromSaved(), { animate: false }); }
  const ib = new Board(root.querySelector('#iboard'), { coords: false });
  ib.setPosition(idea.fen, { animate: false });
  ib.setDrawings([...idea.arrows.map(([f, t, c]) => ({ type: 'arrow', from: f, to: t, color: c })), ...(idea.circles || []).map(s => ({ type: 'circle', from: s, to: s, color: 'think' }))]);
  function fenFromSaved() { const g = new Game(); for (const m of saved.sans) { try { g.chess.move(m); } catch { break; } } return g.chess.fen(); }
}
export function mountSoon(root, { title, text, ic }) {
  root.innerHTML = `<div class="soon"><img class="sim" src="assets/icons/${ic}.svg" alt=""><h1>${title}</h1><p>${text}</p><a class="b3" href="#/play">${icon('play', 22)}Play a game</a></div>`;
}
