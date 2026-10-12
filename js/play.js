// ponder — Play screen
import { Board } from './board.js';
import { Game } from './game.js';
import { Clock } from './clock.js';
import { sound } from './sound.js';
import { settings } from './settings.js';
import { icon, toast, confirmBox, openSettings } from './ui.js';
import { NAME, moveListHTML, avatar, capsHTML, resultText, archive, gameRowHTML, download, copy } from './parts.js';

const TCS = [
  { k: '1+0', base: 60, inc: 0, n: 'Bullet' }, { k: '1+1', base: 60, inc: 1, n: 'Bullet' }, { k: '2+1', base: 120, inc: 1, n: 'Bullet' },
  { k: '3+0', base: 180, inc: 0, n: 'Blitz' }, { k: '3+2', base: 180, inc: 2, n: 'Blitz' }, { k: '5+0', base: 300, inc: 0, n: 'Blitz' },
  { k: '10+0', base: 600, inc: 0, n: 'Rapid' }, { k: '15+10', base: 900, inc: 10, n: 'Rapid' }, { k: '30+0', base: 1800, inc: 0, n: 'Rapid' },
];
const KEY = 'ponder.local';
const tcLabel = k => k === '—' ? 'No clock' : `${k.split('+')[0]} min${k.endsWith('+0') ? '' : ' + ' + k.split('+')[1] + 's'}`;

export function mountPlay(root, arg) {
  const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
  let tc = saved?.tc ?? '10+0';
  const game = new Game();
  if (saved?.sans) for (const s of saved.sans) { try { const m = game.chess.move(s); game.moves.push(m); game.fens.push(game.chess.fen()); } catch { break; } }
  game.view = game.ply;
  if (saved?.ended) game.ended = saved.ended;
  let spent = (saved?.spent || []).slice(0, game.ply);
  let meta = { id: saved?.id || newId(), started: saved?.started || Date.now(), archived: !!saved?.archived };
  let clock = makeClock(tc);
  if (saved?.times) clock.t = { ...saved.times };
  let turnAt = performance.now();
  let tab = 'moves', auto = 0;

  root.innerHTML = `
  <div class="play">
    <div class="stage">
      <div class="strip" data-s="top"></div>
      <div id="board"></div>
      <div class="strip" data-s="bot"></div>
    </div>
    <aside class="panel">
      <header class="phd">
        <div class="phd-top">
          <span class="chip">${icon('device', 15)}Pass and play</span><span class="chip" id="tcchip"></span>
          <span class="grow1"></span>
          <button class="tb" id="newbtn" data-tip="New game">${icon('plus')}</button>
          <button class="tb" id="more" data-tip="More">${icon('dots')}</button>
        </div>
        <div class="phd-op"><b id="opening"></b><span class="turn" id="st"></span></div>
      </header>
      <div class="seg" role="tablist">
        <button class="sg" data-tab="moves">Moves</button><button class="sg" data-tab="coach">Coach</button><button class="sg" data-tab="games">Games</button><button class="sg" data-tab="info">Info</button>
      </div>
      <section class="pane" data-pane="moves">
        <div class="mlist" id="mlist"></div>
        <div class="viewing" id="viewing">${icon('replay', 18)}Looking at an earlier move<button class="b3 sm" id="golive">Back to game</button></div>
      </section>
      <section class="pane" data-pane="coach"><div class="cpane">
        <div class="chead"><div class="ava">${icon('coach', 24)}</div><div><b>Your coach</b><small>Arrives in step 5</small></div></div>
        <div class="cbub">In coaching games I’ll sit right here. You’ll be able to ask me anything mid-game, and I’ll answer with words and arrows on the board.</div>
        <ul class="clist"><li>My thought process on every move, including what I rejected</li><li>Hints in three levels: nudge, idea, answer</li>
          <li>A plan box and candidate moves, so you think before you move</li><li>Ghost pieces that show the line you’re imagining</li></ul>
      </div></section>
      <section class="pane" data-pane="games"><div class="glist" id="glist"></div></section>
      <section class="pane" data-pane="info"><div class="info" id="info"></div></section>
      <div class="dock" id="dock"></div>
      <div class="navbar">
        <div class="pill">
          <button class="nb" id="first" aria-label="First move">${icon('first')}</button><button class="nb" id="prev" aria-label="Previous move">${icon('prev')}</button>
          <button class="nb play" id="auto" aria-label="Autoplay">${icon('autoplay')}</button>
          <button class="nb" id="next" aria-label="Next move">${icon('next')}</button><button class="nb" id="last" aria-label="Latest move">${icon('last')}</button>
        </div>
        <button class="tb" id="flip" data-tip="Flip board (F)">${icon('flip')}</button>
      </div>
      <div class="sheet" id="setup">
        <div class="shd"><h3>New game</h3><button class="tb" id="closeSetup" data-tip="Close">${icon('x')}</button></div>
        <div class="ng">
          <div><h4>${icon('users', 16)}Opponent</h4>
            <div class="olist">
              <button class="orow on" data-opp="local"><span class="oi c1">${icon('device')}</span><span class="ot"><b>Pass and play</b><small>Both sides on this screen</small></span><span class="radio"></span></button>
              <div class="orow lock"><span class="oi c3">${icon('coach')}</span><span class="ot"><b>The coach</b><small>Fair game at full strength, or a coaching game</small></span><span class="tag">Step 3</span></div>
              <div class="orow lock"><span class="oi c2">${icon('users')}</span><span class="ot"><b>A friend</b><small>Online room with a code</small></span><span class="tag">Step 3</span></div>
              <div class="orow lock"><span class="oi c4">${icon('cpu')}</span><span class="ot"><b>Stockfish</b><small>Levels 1 to 20</small></span><span class="tag">Step 4</span></div>
            </div></div>
          <div><h4>${icon('clock', 16)}Time control</h4>
          ${['Bullet', 'Blitz', 'Rapid'].map(n => `<div class="tcrow"><span class="tcn">${icon(n === 'Bullet' ? 'bolt' : n === 'Blitz' ? 'fire' : 'timer', 15)}${n}</span><div class="tc">${TCS.filter(t => t.n === n).map(t => `<button class="tcb" data-tc="${t.k}">${t.k.endsWith('+0') ? t.k.split('+')[0] + ' min' : t.k}</button>`).join('')}</div></div>`).join('')}
          <div class="tcrow"><span class="tcn">${icon('inf', 15)}Untimed</span><div class="tc one"><button class="tcb" data-tc="—">No clock</button></div></div></div>
        </div>
        <div class="shf"><div class="sum" id="sum"></div><button class="b3 go" id="start">${icon('play', 22)}Start game</button></div>
      </div>
      <div class="menu" id="menu">
        <button data-act="pgn">${icon('copy')}Copy PGN</button><button data-act="dl">${icon('download')}Download PGN</button>
        <button data-act="fen">${icon('fen')}Copy position (FEN)</button><hr>
        <button data-act="flip">${icon('flip')}Flip board</button><button data-act="set">${icon('settings')}Board and pieces</button>
      </div>
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
      const now = performance.now(); spent[game.ply - 1] = Math.round(now - turnAt); turnAt = now;
      if (!game.over) clock.press(mover, game.ply > 1); else clock.stop();
      const st = game.status();
      sound.play(st.over ? 'end' : st.check ? 'check' : m.promotion ? 'promote' : /[kq]/.test(m.flags) ? 'castle' : m.captured ? 'capture' : 'move');
      if (tab !== 'moves') setTab('moves');
      render(); save();
    }
  });

  function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function makeClock(k) {
    const t = TCS.find(x => x.k === k);
    return new Clock(t ? { base: t.base, inc: t.inc } : { base: 0 }, () => renderClocks(), c => {
      game.timeout(c); sound.play('end'); render(); save();
    });
  }
  function strip(c, pos) {
    return `${avatar(c)}<div class="pinfo"><div class="pname">${NAME[c]}</div><div class="caps">${capsHTML(game, c)}</div></div>
      <div class="clock ${clock.unlimited ? 'none' : ''}" data-clock="${c}">${icon('clock')}<span></span></div>`;
  }
  function renderClocks() {
    for (const c of ['w', 'b']) {
      const el = root.querySelector(`[data-clock="${c}"]`); if (!el) continue;
      const ms = clock.remaining(c);
      el.querySelector('span').textContent = clock.unlimited ? '∞' : Clock.fmt(ms);
      const on = !game.over && game.turn === c && (clock.running === c || clock.unlimited || game.ply < 2);
      el.classList.toggle('on', on);
      el.classList.toggle('low', !clock.unlimited && ms < 20000 && ms < clock.base * 1000 * 0.2 + 1);
    }
  }
  function renderInfo(st) {
    const row = (k, v) => `<div class="irow"><span>${k}</span><b>${v}</b></div>`;
    $('#info').innerHTML = `
      ${row('Mode', 'Pass and play')}${row('Time control', tcLabel(tc))}
      ${row('Started', new Date(meta.started).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }))}
      ${row('Moves', Math.ceil(game.ply / 2))}${row('Opening', game.opening() || '—')}
      ${row('Status', st.over ? `${resultText(st.result)} · ${st.reason}` : `${NAME[game.turn]} to move`)}
      <div class="ibox"><div class="ik"><span>FEN</span><button class="tb sm" data-act="fen" data-tip="Copy FEN">${icon('copy')}</button></div><code>${game.fenAt()}</code></div>
      <div class="ibox"><div class="ik"><span>PGN</span><button class="tb sm" data-act="pgn" data-tip="Copy PGN">${icon('copy')}</button></div><code>${game.pgn().split('\n\n')[1] || '—'}</code></div>`;
  }
  function renderDock(st) {
    const el = $('#dock');
    if (!st.over) {
      el.className = 'dock';
      el.innerHTML = `<button class="ab" data-act="undo" ${game.ply ? '' : 'disabled'}>${icon('undo')}Takeback</button>
        <button class="ab" data-act="draw" ${game.ply ? '' : 'disabled'}>${icon('draw')}Draw</button>
        <button class="ab warn" data-act="resign" ${game.ply ? '' : 'disabled'}>${icon('flag')}Resign</button>`;
      return;
    }
    const draw = st.result === '1/2-1/2';
    el.className = 'dock end';
    el.innerHTML = `<div class="gline"><span class="gres ${draw ? 'd' : st.result === '1-0' ? 'w' : 'b'}">${draw ? '½–½' : st.result.replace('-', '–')}</span><div><b>${resultText(st.result)}</b><small>${st.reason}</small></div></div>
      <a class="b3 review" href="#/replay/${meta.id}">${icon('star', 22)}Review game</a>
      <div class="row"><button class="b3 sm alt" data-act="new">${icon('plus', 18)}New ${tc === '—' ? 'game' : tc}</button><button class="b3 sm alt" data-act="rematch">${icon('replay', 18)}Rematch</button></div>`;
  }
  function renderGames() {
    const list = archive.all();
    $('#glist').innerHTML = list.length ? `<div class="ghead2"><b>Finished games</b><span>${list.length}</span></div>${list.map(gameRowHTML).join('')}`
      : `<div class="mempty"><b>No finished games yet</b>Every game you finish lands here, ready to replay move by move.</div>`;
  }
  function render({ animate = true } = {}) {
    board.setPosition(game.fenAt(), { animate });
    board.setMarks({ last: game.lastMove(), check: game.checkSquare(), sel: null });
    board.setView(!game.live);
    const top = board.orientation === 'w' ? 'b' : 'w';
    $('[data-s=top]').innerHTML = strip(top, 'top');
    $('[data-s=bot]').innerHTML = strip(top === 'w' ? 'b' : 'w', 'bot');
    const live = !game.over;
    $('[data-s=top]').classList.toggle('turn-on', live && game.turn === top);
    $('[data-s=bot]').classList.toggle('turn-on', live && game.turn !== top);
    renderClocks();
    const st = game.status();
    if (st.over && !meta.archived) archiveGame(st);
    const op = game.opening();
    $('#opening').textContent = op || (game.ply ? 'Your own path' : 'Starting position');
    const t = TCS.find(x => x.k === tc);
    $('#sum').innerHTML = `${t ? `${t.n} · ${tcLabel(tc)}` : 'No clock'} · Pass and play`;
    $('#tcchip').innerHTML = t ? `${icon(t.n === 'Bullet' ? 'bolt' : t.n === 'Blitz' ? 'fire' : 'timer', 15)}${t.n} · ${tcLabel(tc)}` : `${icon('inf', 15)}No clock`;
    const stEl = $('#st');
    stEl.innerHTML = st.over ? resultText(st.result) : `<i class="${game.turn}"></i>${st.check ? 'Check · ' : ''}${NAME[game.turn]} to move`;
    stEl.className = 'turn' + (st.check && !st.over ? ' check' : '') + (st.over ? ' over' : '');
    const ml = $('#mlist');
    ml.innerHTML = moveListHTML(game.moves, game.view, spent, op);
    ml.querySelector('.mv.cur')?.scrollIntoView({ block: 'nearest' });
    if (tab === 'info') renderInfo(st);
    renderDock(st);
    $('#viewing').classList.toggle('show', !game.live && !st.over);
    $('#first').disabled = $('#prev').disabled = game.view === 0;
    $('#next').disabled = $('#last').disabled = game.live;
    $('#auto').disabled = !game.ply;
    root.querySelectorAll('.tcb').forEach(b => b.classList.toggle('on', b.dataset.tc === tc));
    if (st.over && game.live) showOver(st); else hideOver();
  }
  function archiveGame(st) {
    if (!game.ply) return;
    meta.archived = true;
    archive.put({ id: meta.id, ts: Date.now(), started: meta.started, tc, mode: 'local', white: 'White', black: 'Black',
      result: st.result, reason: st.reason, sans: game.moves.map(m => m.san), spent, opening: game.opening() || null, ended: game.ended });
    if (tab === 'games') renderGames();
  }

  function showOver(st) {
    if ($('.gover')) return;
    const draw = st.result === '1/2-1/2', win = st.result === '1-0' ? 'w' : 'b';
    const g = document.createElement('div');
    g.className = 'gover';
    g.innerHTML = `<div class="gcard" style="position:relative"><button class="ib gclose" aria-label="Close">${icon('x')}</button>
      <div class="ghead ${draw ? 'draw' : ''}"><h2>${draw ? 'Draw' : NAME[win] + ' won'}</h2><p>${st.reason}</p></div>
      <div class="gvs"><div class="gp ${!draw && win === 'w' ? 'win' : ''}">${avatar('w')}White</div><div class="sc">${draw ? '½ – ½' : win === 'w' ? '1 – 0' : '0 – 1'}</div><div class="gp ${!draw && win === 'b' ? 'win' : ''}">${avatar('b')}Black</div></div>
      <div class="gacts"><a class="b3 review" href="#/replay/${meta.id}">${icon('star', 22)}Review game</a>
        <div class="row"><button class="b3 sm alt" data-a="new">New ${tc === '—' ? 'game' : tc}</button><button class="b3 sm alt" data-a="rematch">Rematch</button></div></div></div>`;
    g.addEventListener('pointerdown', e => e.stopPropagation());
    g.querySelector('.gclose').onclick = () => g.remove();
    g.querySelector('[data-a=rematch]').onclick = () => newGame();
    g.querySelector('[data-a=new]').onclick = () => newGame();
    $('#board').appendChild(g);
  }
  const hideOver = () => $('.gover')?.remove();

  function go(ply, user = true) {
    if (user) stopAuto();
    ply = Math.max(0, Math.min(game.ply, ply));
    if (ply === game.view) return;
    const step = Math.abs(ply - game.view) === 1, fwd = ply > game.view;
    game.view = ply;
    if (step && fwd) sound.play(game.moves[ply - 1].captured ? 'capture' : 'move');
    render({ animate: step });
  }
  function stopAuto() { if (auto) { clearInterval(auto); auto = 0; $('#auto').innerHTML = icon('autoplay'); $('#auto').classList.remove('on'); } }
  function toggleAuto() {
    if (auto) return stopAuto();
    if (game.live) go(0, false);
    $('#auto').innerHTML = icon('pause'); $('#auto').classList.add('on');
    auto = setInterval(() => { if (game.live) return stopAuto(); go(game.view + 1, false); }, 900);
  }
  function newGame() {
    stopAuto(); clock.stop();
    game.reset(); clock = makeClock(tc); spent = []; turnAt = performance.now();
    meta = { id: newId(), started: Date.now(), archived: false };
    board.setDrawings([]); hideOver();
    openSetup(false); setTab('moves'); render({ animate: false }); save();
  }
  function save() {
    localStorage.setItem(KEY, JSON.stringify({ sans: game.moves.map(m => m.san), orientation: board.orientation, tc, times: { w: clock.remaining('w'), b: clock.remaining('b') },
      ended: game.ended, spent, ...meta }));
  }
  function setTab(t) {
    tab = t;
    root.querySelectorAll('.sg').forEach(b => { b.classList.toggle('on', b.dataset.tab === t); b.setAttribute('aria-selected', b.dataset.tab === t); });
    root.querySelectorAll('.pane').forEach(p => p.classList.toggle('on', p.dataset.pane === t));
    if (t === 'games') renderGames();
    if (t === 'info') renderInfo(game.status());
  }
  const openSetup = v => { $('#setup').classList.toggle('open', v); };
  const doFlip = () => { board.flip(); render({ animate: false }); save(); };
  const actions = {
    flip: doFlip, set: openSettings, new: () => newGame(), rematch: () => { newGame(); toast('Rematch · same time control'); },
    fen: () => copy(game.fenAt(), toast, 'FEN'), pgn: () => copy(game.pgn(), toast, 'PGN'),
    dl: () => { download(`ponder-${new Date(meta.started).toISOString().slice(0, 10)}.pgn`, game.pgn()); toast('PGN downloaded'); },
    undo: () => { if (game.over) game.ended = null; game.undo(); spent.length = game.ply; turnAt = performance.now(); if (clock.running) clock.start(game.turn); render(); save(); },
    draw: async () => { if (await confirmBox('Agree to a draw?', 'On a shared screen, both players agree by pressing yes.', 'Agree draw')) { game.agreeDraw(); clock.stop(); sound.play('end'); render(); save(); } },
    resign: async () => { const c = game.turn; if (await confirmBox(`Resign as ${NAME[c]}?`, 'The game ends and your opponent wins.', 'Resign')) { game.resign(c); clock.stop(); sound.play('end'); render(); save(); } },
  };

  root.querySelector('.seg').onclick = e => { const b = e.target.closest('.sg'); if (b) setTab(b.dataset.tab); };
  $('.play').addEventListener('click', e => {
    const a = e.target.closest('[data-act]');
    if (!e.target.closest('#more')) $('#menu').classList.remove('open');
    if (a && !a.disabled && actions[a.dataset.act]) actions[a.dataset.act]();
  });
  $('#more').onclick = () => $('#menu').classList.toggle('open');
  $('#newbtn').onclick = () => openSetup(true);
  $('#closeSetup').onclick = () => openSetup(false);
  root.querySelectorAll('.tcb').forEach(b => b.onclick = () => { tc = b.dataset.tc; render({ animate: false }); });
  $('#start').onclick = async () => { if (game.ply && !game.over && !(await confirmBox('Start a new game?', 'The current game will be cleared.', 'Start new'))) return; newGame(); toast(tc === '—' ? 'No clock. Take your time.' : `${tcLabel(tc)} · White moves first`); };
  $('#mlist').onclick = e => { const b = e.target.closest('.mv'); if (b) go(+b.dataset.ply); };
  $('#first').onclick = () => go(0); $('#prev').onclick = () => go(game.view - 1);
  $('#next').onclick = () => go(game.view + 1); $('#last').onclick = () => go(game.ply);
  $('#auto').onclick = toggleAuto;
  $('#golive').onclick = () => go(game.ply);
  $('#flip').onclick = doFlip;

  const onKey = e => {
    if (e.target.closest('input,textarea') || document.querySelector('.modal')) return;
    const k = e.key;
    if (k === 'Escape') { $('#menu').classList.remove('open'); openSetup(false); return; }
    if (k === 'ArrowLeft') { go(game.view - 1); e.preventDefault(); }
    else if (k === 'ArrowRight') { go(game.view + 1); e.preventDefault(); }
    else if (k === 'ArrowUp') { go(0); e.preventDefault(); }
    else if (k === 'ArrowDown') { go(game.ply); e.preventDefault(); }
    else if (k.toLowerCase() === 'f') doFlip();
  };
  window.addEventListener('keydown', onKey);
  const onSet = e => { if (e.detail.k === 'pieces') render({ animate: false }); };
  window.addEventListener('ponder:settings', onSet);
  setTab(tab);
  if (arg?.startsWith('start:')) {
    history.replaceState(null, '', '#/play');
    const k = arg.slice(6);
    (async () => {
      if (game.ply && !game.over && !(await confirmBox('Start a new game?', 'Your current game will be cleared.', 'Start new'))) return;
      tc = TCS.some(t => t.k === k) ? k : tc; newGame(); toast(`${tcLabel(tc)} · White moves first`);
    })();
  } else if (!game.ply || arg === 'new') openSetup(true);
  render({ animate: false });
  window.ponder = { game, board, go, get clock() { return clock; } };
  return () => { stopAuto(); clock.stop(); window.removeEventListener('keydown', onKey); window.removeEventListener('ponder:settings', onSet); };
}
