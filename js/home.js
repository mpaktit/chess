import { Board } from './board.js';
import { icon } from './ui.js';
import { Game } from './game.js';
const IDEAS = [
  { t: 'Count before you capture', b: 'Before taking, count attackers and defenders on that square. More attackers usually means the capture works.',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R', arrows: [['f3', 'e5', 'think'], ['c6', 'e5', 'warn']] },
  { t: 'f7 is the weak spot', b: 'Early on, only the king guards f7. That is why so many quick attacks aim right there.',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR', arrows: [['c4', 'f7', 'warn'], ['f3', 'f7', 'warn']] },
  { t: 'Knights love outposts', b: 'A knight on a square no enemy pawn can attack is often worth more than a rook.',
    fen: 'r4rk1/pp3ppp/3p4/2pNp3/2P1P3/8/PP3PPP/R4RK1', arrows: [], circles: ['d5'] },
];
export function mountHome(root) {
  const idea = IDEAS[new Date().getDate() % IDEAS.length];
  const saved = JSON.parse(localStorage.getItem('ponder.local') || 'null');
  const going = saved?.sans?.length && !saved?.ended;
  root.innerHTML = `
  <div class="home">
    <div>
      <section class="hplay">
        <div id="hboard"></div>
        <div style="position:relative">
          <h1>Think first.<br>Then move.</h1>
          <p>Learn chess by understanding it: plans, ideas, and the person across the board. No memorizing.</p>
          <div class="btns"><a class="b3" href="#/play">${icon('play', 22)}${going ? 'Continue game' : 'Play now'}</a>
            <a class="b3 alt" href="#/play">${icon('plus', 20)}New game</a></div>
        </div>
      </section>
      <div class="tiles">
        <div class="tile"><span class="tag">Step 5</span><div class="ti" style="color:var(--think)">${icon('chat')}</div><b>Coaching game</b><span>I play, think out loud, and help when you ask.</span></div>
        <div class="tile"><span class="tag">Step 3</span><div class="ti" style="color:var(--brass)">${icon('flag')}</div><b>Fair game</b><span>Full strength, no help. We talk after.</span></div>
        <div class="tile"><span class="tag">Step 3</span><div class="ti" style="color:var(--good)">${icon('users')}</div><b>Play a friend</b><span>Share a room code and play live.</span></div>
      </div>
    </div>
    <div class="hcol">
      <div class="box"><div class="k">${icon('bolt', 16)}Idea of the day</div>
        <div class="idea"><div id="iboard"></div><div><h3>${idea.t}</h3><p>${idea.b}</p></div></div></div>
      <div class="box"><div class="k">${icon('list', 16)}Building ponder</div><ul class="roadmap">
        <li class="done"><i>${icon('check', 12)}</i>Board and rules</li><li class="now"><i>2</i>Clocks and game controls</li><li><i>3</i>Online rooms</li>
        <li><i>4</i>Stockfish and analysis</li><li><i>5</i>Coaching game</li><li><i>6</i>Replay with coach chat</li><li><i>7</i>Puzzles, lesson cards, path</li></ul></div>
    </div>
  </div>`;
  const hb = new Board(root.querySelector('#hboard'), { coords: false });
  hb.setPosition(saved?.sans?.length ? fenFromSaved() : 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R', { animate: false });
  const ib = new Board(root.querySelector('#iboard'), { coords: false });
  ib.setPosition(idea.fen, { animate: false });
  ib.setDrawings([...idea.arrows.map(([f, t, c]) => ({ type: 'arrow', from: f, to: t, color: c })), ...(idea.circles || []).map(s => ({ type: 'circle', from: s, to: s, color: 'think' }))]);
  function fenFromSaved() { const g = new Game(); for (const m of saved.sans) { try { g.chess.move(m); } catch { break; } } return g.chess.fen(); }
}
export function mountSoon(root, { title, text, ic }) {
  root.innerHTML = `<div class="soon"><div class="si">${icon(ic)}</div><h1>${title}</h1><p>${text}</p><a class="b3" href="#/play">${icon('play', 22)}Play a game</a></div>`;
}
