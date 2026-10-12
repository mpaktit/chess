// ponder — Play screen
import { Board } from './board.js';
import { Game } from './game.js';
import { Clock } from './clock.js';
import { sound } from './sound.js';
import { settings, pieceUrl } from './settings.js';
import { icon, toast, confirmBox, openSettings } from './ui.js';

const NAME = { w: 'White', b: 'Black' };
const TCS = [
  { k: '1+0', base: 60, inc: 0, g: 'bolt' }, { k: '2+1', base: 120, inc: 1, g: 'bolt' }, { k: '3+0', base: 180, inc: 0, g: 'fire' },
  { k: '3+2', base: 180, inc: 2, g: 'fire' }, { k: '5+0', base: 300, inc: 0, g: 'fire' }, { k: '5+3', base: 300, inc: 3, g: 'fire' },
  { k: '10+0', base: 600, inc: 0, g: 'timer' }, { k: '15+10', base: 900, inc: 10, g: 'timer' }, { k: '30+0', base: 1800, inc: 0, g: 'timer' },
];
const KEY = 'ponder.local';

export function mountPlay(root) {
  const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
  let tc = saved?.tc ?? '10+0';           // '—' = unlimited
  const game = new Game();
  if (saved?.sans) for (const s of saved.sans) { try { const m = game.chess.move(s); game.moves.push(m); game.fens.push(game.chess.fen()); } catch { break; } }
  game.view = game.ply;
  if (saved?.ended) game.ended = saved.ended;
  let clock = makeClock(tc);
  if (saved?.times) clock.t = { ...saved.times };
  let tab = game.ply ? 'moves' : 'new';

  root.innerHTML = `
  <div class="play">
    <div class="stage">
      <div class="strip" data-s="top"></div>
      <div id="board"></div>
      <div class="strip" data-s="bot"></div>
    </div>
    <aside class="panel">
      <div class="tabs" role="tablist">
        <button class="tab" data-tab="new">${icon('plus')}New game</button>
        <button class="tab" data-tab="moves">${icon('list')}Moves</button>
        <button class="tab" data-tab="coach">${icon('chat')}Coach</button>
      </div>
      <section class="pane" data-pane="new"><div class="ng">
        <div><h3>${icon('timer')}Time control</h3><div class="tc">${TCS.map(t => `<button class="tcb" data-tc="${t.k}">${t.k}</button>`).join('')}</div>
          <div class="tc" style="margin-top:8px;grid-template-columns:1fr"><button class="tcb" data-tc="—">No clock</button></div></div>
        <div><h3>${icon('users')}Opponent</h3><div class="opp">
          <button class="oc on" data-opp="local"><span class="oi">${icon('device')}</span><span><b>Pass and play</b><small>Both sides, one screen</small></span></button>
          <div class="oc lock"><span class="tag">Step 3</span><span class="oi">${icon('users')}</span><span><b>A friend</b><small>Online with a room code</small></span></div>
          <div class="oc lock"><span class="tag">Step 3</span><span class="oi">${icon('coach')}</span><span><b>Coach</b><small>Fair game, full strength</small></span></div>
          <div class="oc lock"><span class="tag">Step 4</span><span class="oi">${icon('cpu')}</span><span><b>Stockfish</b><small>Levels 1 to 20</small></span></div>
        </div></div>
        <button class="b3 go" id="start">Start game</button>
      </div></section>
      <section class="pane" data-pane="moves">
        <div class="ophead">${icon('book')}<span id="opening">Starting position</span><span class="st tag" id="st"></span></div>
        <div class="mlist" id="mlist"></div>
        <div class="viewing" id="viewing">${icon('replay', 18)}Looking at an earlier move<button class="b3 sm" id="golive">Back to game</button></div>
        <div class="navrow">
          <button class="nb" id="first" aria-label="First move">${icon('first')}</button><button class="nb" id="prev" aria-label="Previous move">${icon('prev')}</button>
          <button class="nb" id="next" aria-label="Next move">${icon('next')}</button><button class="nb" id="last" aria-label="Latest move">${icon('last')}</button>
        </div>
        <div class="actrow">
          <button class="ib" id="undo" title="Take back">${icon('undo')}Takeback</button>
          <button class="ib" id="draw" title="Offer draw">${icon('draw')}Draw</button>
          <button class="ib" id="resign" title="Resign">${icon('flag')}Resign</button>
          <span style="flex:1"></span>
          <button class="ib" id="flip" title="Flip board (F)" aria-label="Flip board">${icon('flip')}</button>
          <button class="ib" id="pgn" title="Copy PGN" aria-label="Copy PGN">${icon('share')}</button>
          <button class="ib" id="set" title="Settings" aria-label="Settings">${icon('settings')}</button>
        </div>
      </section>
      <section class="pane" data-pane="coach"><div class="cpane">
        <div class="chead"><div class="ava">${icon('coach', 24)}</div><div><b>Your coach</b><small>Arrives in step 5</small></div></div>
        <div class="cbub">In coaching games I’ll sit right here. You’ll be able to ask me anything mid-game, and I’ll answer with words and arrows on the board.</div>
        <ul class="clist"><li>My thought process on every move, including what I rejected</li><li>Hints in three levels: nudge, idea, answer</li>
          <li>A plan box and candidate moves, so you think before you move</li><li>Ghost pieces that show the line you’re imagining</li></ul>
      </div></section>
    </aside>
  </div>`;
  const $ = s => root.querySelector(s);

  const board = new Board($('#board'), {
    orientation: saved?.orientation || 'w',
    canMove: sq => game.live && !game.over && board.pos[sq]?.[0] === game.turn,
    dests: sq => game.dests(sq),
    onMove: async (from, to) => {
      let promo;
      if (game.isPromotion(from, to)) {
        promo = settings.get('autoQueen') ? 'q' : await board.askPromotion(to, game.turn);
        if (!promo) { board.setPosition(game.fenAt(), { animate: false }); return; }
      }
      const mover = game.turn;
      const m = game.move(from, to, promo);
      if (!m) { sound.play('illegal'); board.setPosition(game.fenAt()); return; }
      if (!game.over) clock.press(mover, game.ply > 1); else clock.stop();
      const st = game.status();
      sound.play(st.over ? 'end' : st.check ? 'check' : m.promotion ? 'promote' : /[kq]/.test(m.flags) ? 'castle' : m.captured ? 'capture' : 'move');
      if (tab !== 'moves') setTab('moves');
      render(); save();
    }
  });

  function makeClock(k) {
    const t = TCS.find(x => x.k === k);
    return new Clock(t ? { base: t.base, inc: t.inc } : { base: 0 }, () => renderClocks(), c => {
      game.timeout(c); sound.play('end'); render(); save();
    });
  }
  const avatar = c => `<div class="ava ${c}"><img src="${pieceUrl(c + 'K')}" alt=""></div>`;
  function strip(c) {
    const mat = game.material(), opp = c === 'w' ? 'b' : 'w';
    let caps = '', prev = '';
    for (const p of mat[c]) { caps += `<i class="${prev && prev !== p ? 'gap' : ''}" style="background-image:url(${pieceUrl(opp + p.toUpperCase())})"></i>`; prev = p; }
    return `${avatar(c)}<div class="pinfo"><div class="pname">${NAME[c]}</div><div class="caps">${caps}${mat.lead[c] ? `<b>+${mat.lead[c]}</b>` : ''}</div></div>
      <div class="clock ${clock.unlimited ? 'none' : ''}" data-clock="${c}">${icon('spin')}<span></span></div>`;
  }
  function renderClocks() {
    for (const c of ['w', 'b']) {
      const el = root.querySelector(`[data-clock="${c}"]`); if (!el) continue;
      const ms = clock.remaining(c);
      el.querySelector('span').textContent = clock.unlimited ? '∞' : Clock.fmt(ms);
      const on = !game.over && game.turn === c && (clock.running === c || clock.unlimited);
      el.classList.toggle('on', on);
      el.classList.toggle('low', !clock.unlimited && ms < 20000 && ms < clock.base * 1000 * 0.2 + 1);
    }
  }
  function renderMoves() {
    const el = $('#mlist');
    if (!game.ply) { el.innerHTML = `<div class="mempty"><b>No moves yet</b>Drag a piece or tap it, then tap where it should go.</div>`; return; }
    let h = '';
    for (let i = 0; i < game.ply; i += 2) {
      const a = game.moves[i], b = game.moves[i + 1];
      h += `<div class="mrow"><span class="n">${i / 2 + 1}.</span><button class="mv ${game.view === i + 1 ? 'cur' : ''}" data-ply="${i + 1}">${a.san}</button>${b ? `<button class="mv ${game.view === i + 2 ? 'cur' : ''}" data-ply="${i + 2}">${b.san}</button>` : '<span></span>'}</div>`;
    }
    el.innerHTML = h;
    el.querySelector('.mv.cur')?.scrollIntoView({ block: 'nearest' });
  }
  function render({ animate = true } = {}) {
    board.setPosition(game.fenAt(), { animate });
    board.setMarks({ last: game.lastMove(), check: game.checkSquare(), sel: null });
    board.setView(!game.live);
    const top = board.orientation === 'w' ? 'b' : 'w';
    $('[data-s=top]').innerHTML = strip(top);
    $('[data-s=bot]').innerHTML = strip(top === 'w' ? 'b' : 'w');
    renderClocks();
    const st = game.status();
    $('#opening').textContent = game.opening() || (game.ply ? 'Your own path' : 'Starting position');
    const stEl = $('#st');
    stEl.textContent = st.over ? resultShort(st.result) : st.check ? 'Check' : `${NAME[game.turn]} to move`;
    stEl.className = 'st tag ' + (st.check && !st.over ? 'brass' : '');
    renderMoves();
    $('#viewing').classList.toggle('show', !game.live);
    $('#first').disabled = $('#prev').disabled = game.view === 0;
    $('#next').disabled = $('#last').disabled = game.live;
    $('#undo').disabled = !game.ply;
    $('#draw').disabled = $('#resign').disabled = st.over || !game.ply;
    root.querySelectorAll('.tcb').forEach(b => b.classList.toggle('on', b.dataset.tc === tc));
    if (st.over && game.live) showOver(st); else hideOver();
  }
  const resultShort = r => r === '1-0' ? 'White won' : r === '0-1' ? 'Black won' : 'Draw';

  function showOver(st) {
    if ($('.gover')) return;
    const draw = st.result === '1/2-1/2', win = st.result === '1-0' ? 'w' : 'b';
    const g = document.createElement('div');
    g.className = 'gover';
    g.innerHTML = `<div class="gcard" style="position:relative"><button class="ib gclose" aria-label="Close">${icon('x')}</button>
      <div class="ghead ${draw ? 'draw' : ''}"><h2>${draw ? 'Draw' : NAME[win] + ' won'}</h2><p>${st.reason}</p></div>
      <div class="gvs"><div class="gp ${!draw && win === 'w' ? 'win' : ''}">${avatar('w')}White</div><div class="sc">${draw ? '½ – ½' : win === 'w' ? '1 – 0' : '0 – 1'}</div><div class="gp ${!draw && win === 'b' ? 'win' : ''}">${avatar('b')}Black</div></div>
      <div class="gacts"><button class="b3" data-a="rematch">Rematch</button>
        <div class="row"><button class="b3 sm alt" data-a="new">New game</button><button class="b3 sm alt" disabled>Review <span class="tag">Step 6</span></button></div></div></div>`;
    g.addEventListener('pointerdown', e => e.stopPropagation());
    g.querySelector('.gclose').onclick = () => g.remove();
    g.querySelector('[data-a=rematch]').onclick = () => newGame();
    g.querySelector('[data-a=new]').onclick = () => { g.remove(); setTab('new'); };
    $('#board').appendChild(g);
  }
  const hideOver = () => $('.gover')?.remove();

  function go(ply) {
    ply = Math.max(0, Math.min(game.ply, ply));
    if (ply === game.view) return;
    const step = Math.abs(ply - game.view) === 1, fwd = ply > game.view;
    game.view = ply;
    if (step && fwd) sound.play(game.moves[ply - 1].captured ? 'capture' : 'move');
    render({ animate: step });
  }
  function newGame() {
    clock.stop();
    game.reset(); clock = makeClock(tc);
    board.setDrawings([]); hideOver();
    setTab('moves'); render({ animate: false }); save();
  }
  function save() {
    localStorage.setItem(KEY, JSON.stringify({ sans: game.moves.map(m => m.san), orientation: board.orientation, tc, times: { w: clock.remaining('w'), b: clock.remaining('b') }, ended: game.ended }));
  }
  function setTab(t) {
    tab = t;
    root.querySelectorAll('.tab').forEach(b => { b.classList.toggle('on', b.dataset.tab === t); b.setAttribute('aria-selected', b.dataset.tab === t); });
    root.querySelectorAll('.pane').forEach(p => p.classList.toggle('on', p.dataset.pane === t));
  }

  root.querySelector('.tabs').onclick = e => { const b = e.target.closest('.tab'); if (b) setTab(b.dataset.tab); };
  root.querySelectorAll('.tcb').forEach(b => b.onclick = () => { tc = b.dataset.tc; render({ animate: false }); });
  $('#start').onclick = async () => { if (game.ply && !game.over && !(await confirmBox('Start a new game?', 'The current game will be cleared.', 'Start new'))) return; newGame(); toast(tc === '—' ? 'No clock. Take your time.' : `${tc} · White moves first`); };
  $('#mlist').onclick = e => { const b = e.target.closest('.mv'); if (b) go(+b.dataset.ply); };
  $('#first').onclick = () => go(0); $('#prev').onclick = () => go(game.view - 1);
  $('#next').onclick = () => go(game.view + 1); $('#last').onclick = () => go(game.ply);
  $('#golive').onclick = () => go(game.ply);
  $('#flip').onclick = () => { board.flip(); render({ animate: false }); save(); };
  $('#undo').onclick = () => { if (game.over) { game.ended = null; } game.undo(); if (clock.running) clock.start(game.turn); render(); save(); };
  $('#draw').onclick = async () => { if (await confirmBox('Agree to a draw?', 'On a shared screen, both players agree by pressing yes.', 'Agree draw')) { game.agreeDraw(); clock.stop(); sound.play('end'); render(); save(); } };
  $('#resign').onclick = async () => { const c = game.turn; if (await confirmBox(`Resign as ${NAME[c]}?`, 'The game ends and your opponent wins.', 'Resign')) { game.resign(c); clock.stop(); sound.play('end'); render(); save(); } };
  $('#pgn').onclick = async () => { try { await navigator.clipboard.writeText(game.pgn()); toast('PGN copied'); } catch { prompt('Copy the PGN:', game.pgn()); } };
  $('#set').onclick = openSettings;

  const onKey = e => {
    if (e.target.closest('input,textarea') || document.querySelector('.modal')) return;
    const k = e.key;
    if (k === 'ArrowLeft') { go(game.view - 1); e.preventDefault(); }
    else if (k === 'ArrowRight') { go(game.view + 1); e.preventDefault(); }
    else if (k === 'ArrowUp') { go(0); e.preventDefault(); }
    else if (k === 'ArrowDown') { go(game.ply); e.preventDefault(); }
    else if (k.toLowerCase() === 'f') $('#flip').click();
  };
  window.addEventListener('keydown', onKey);
  const onSet = e => { if (e.detail.k === 'pieces') render({ animate: false }); };
  window.addEventListener('ponder:settings', onSet);
  setTab(tab);
  render({ animate: false });
  window.ponder = { game, board, go, get clock() { return clock; } };
  return () => { clock.stop(); window.removeEventListener('keydown', onKey); window.removeEventListener('ponder:settings', onSet); };
}
