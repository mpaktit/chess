// ponder — Play view (step 1: one-device game with full rules)
import { Board, PIECE_URL } from './board.js';
import { Game } from './game.js';
import { sound } from './sound.js';
import { toast, icon } from './ui.js';

const NAMES = { w: 'White', b: 'Black' };

export function mountPlay(root) {
  const saved = JSON.parse(localStorage.getItem('ponder.local') || 'null');
  const game = new Game();
  if (saved?.sans?.length) { for (const s of saved.sans) { const c = game.chess; try { const m = c.move(s); game.moves.push(m); game.fens.push(c.fen()); } catch { break; } } game.view = game.ply; }
  let autoFlip = saved?.autoFlip ?? false;

  root.innerHTML = `
  <div class="play">
    <div class="stage">
      <div class="pbar" data-p="top"></div>
      <div id="board" aria-label="Chess board"></div>
      <div class="pbar" data-p="bottom"></div>
    </div>
    <div class="side card">
      <div class="sh"><div><b>Practice board</b><small>Both sides on this device. Online play comes next.</small></div>
        <div class="tools"><button class="chip" id="autoflip" title="Turn the board after every move">Auto-flip</button>
        <button class="tbtn" id="snd" title="Sound" aria-label="Toggle sound">${icon(sound.on ? 'sound' : 'mute', 16)}</button>
        <button class="tbtn" id="pgn" title="Copy PGN" aria-label="Copy PGN">${icon('copy', 16)}</button></div></div>
      <div class="status" id="status"><span class="d"></span><span class="t"></span></div>
      <div class="opening" id="opening"></div>
      <div class="moves" id="moves"></div>
      <div class="viewbar" id="viewbar"><span>Looking back at an earlier move</span><button class="btn dark" style="min-height:34px;padding:0 12px" id="golive">Back to game</button></div>
      <div class="tip-keys"><kbd>←</kbd> <kbd>→</kbd> step through moves · <kbd>F</kbd> flip · right-click to draw arrows (<kbd>Shift</kbd> green, <kbd>Alt</kbd> red)</div>
      <div class="ctl">
        <button class="btn line icon" id="first" title="First move" aria-label="First move">${icon('first')}</button>
        <button class="btn line icon" id="prev" title="Previous move" aria-label="Previous move">${icon('prev')}</button>
        <button class="btn line icon" id="next" title="Next move" aria-label="Next move">${icon('next')}</button>
        <button class="btn line icon" id="last" title="Latest move" aria-label="Latest move">${icon('last')}</button>
        <span class="sp"></span>
        <button class="btn line icon" id="flip" title="Flip board (F)" aria-label="Flip board">${icon('flip')}</button>
        <button class="btn line icon" id="undo" title="Take back" aria-label="Take back">${icon('undo')}</button>
        <button class="btn dark" id="new">New game</button>
      </div>
    </div>
  </div>`;
  const $ = s => root.querySelector(s);

  const board = new Board($('#board'), {
    orientation: saved?.orientation || 'w',
    canMove: sq => game.live && !game.over && board.pos[sq]?.[0] === game.turn,
    dests: sq => game.dests(sq),
    onMove: async (from, to) => {
      let promo;
      if (game.isPromotion(from, to)) {
        promo = await board.askPromotion(to, game.turn);
        if (!promo) { board.setPosition(game.fenAt(), { animate: false }); return; }
      }
      const m = game.move(from, to, promo);
      if (!m) { sound.play('illegal'); board.setPosition(game.fenAt()); return; }
      afterMove(m);
    }
  });

  function afterMove(m) {
    const st = game.status();
    sound.play(st.over ? 'end' : st.check ? 'check' : m.promotion ? 'promote' : m.flags.includes('k') || m.flags.includes('q') ? 'castle' : m.captured ? 'capture' : 'move');
    if (autoFlip && !st.over) setTimeout(() => board.setOrientation(game.turn), 260);
    render();
    save();
  }

  function playerBar(color) {
    const mat = game.material();
    const caps = mat[color].map(p => `<i style="background-image:url(${PIECE_URL((color === 'w' ? 'b' : 'w') + p.toUpperCase())})"></i>`).join('');
    const lead = mat.lead[color] ? `<span>+${mat.lead[color]}</span>` : '';
    const st = game.status();
    const toMove = !st.over && game.turn === color;
    return `<div class="who"><div class="pa ${color}">${color === 'w' ? 'W' : 'B'}</div><div><b>${NAMES[color]}</b><div class="mat">${caps}${lead}</div></div></div>
            <div class="turn ${toMove ? 'on' : ''}">${toMove ? 'To move' : ''}</div>`;
  }

  function renderMoves() {
    const el = $('#moves');
    if (!game.ply) { el.innerHTML = `<div class="empty">Make the first move. Every move you play will show up here.</div>`; return; }
    let h = '';
    for (let i = 0; i < game.ply; i += 2) {
      const a = game.moves[i], b = game.moves[i + 1];
      h += `<div class="mrow"><span class="n">${i / 2 + 1}.</span>
        <button class="mv ${game.view === i + 1 ? 'cur' : ''}" data-ply="${i + 1}">${a.san}</button>
        ${b ? `<button class="mv ${game.view === i + 2 ? 'cur' : ''}" data-ply="${i + 2}">${b.san}</button>` : '<span></span>'}</div>`;
    }
    el.innerHTML = h;
    const cur = el.querySelector('.mv.cur');
    if (cur) cur.scrollIntoView({ block: 'nearest' });
  }

  function render({ animate = true } = {}) {
    board.setPosition(game.fenAt(), { animate });
    board.setMarks({ last: game.lastMove(), check: game.checkSquare(), sel: null });
    board.setView(!game.live);
    const top = board.orientation === 'w' ? 'b' : 'w';
    $('[data-p=top]').innerHTML = playerBar(top);
    $('[data-p=bottom]').innerHTML = playerBar(top === 'w' ? 'b' : 'w');
    const st = game.status(), s = $('#status');
    s.className = 'status' + (st.over ? ' over' : st.check ? ' check' : '');
    s.querySelector('.t').textContent = st.over ? `${st.reason} · ${resultText(st.result)}` : st.check ? `${NAMES[game.turn]} is in check` : `${NAMES[game.turn]} to move`;
    const op = game.opening();
    $('#opening').textContent = op ? op : '';
    $('#opening').style.display = op ? '' : 'none';
    renderMoves();
    $('#viewbar').classList.toggle('show', !game.live);
    $('#first').disabled = $('#prev').disabled = game.view === 0;
    $('#next').disabled = $('#last').disabled = game.live;
    $('#undo').disabled = !game.ply;
    $('#autoflip').classList.toggle('think', autoFlip);
    if (st.over && game.live) showEnd(st); else board.clearOverlay();
  }
  const resultText = r => r === '1-0' ? 'White wins' : r === '0-1' ? 'Black wins' : 'Draw';

  function showEnd(st) {
    const card = board.overlay(`<div class="eyebrow">${st.reason}</div><h2>${resultText(st.result)}</h2>
      <p>${st.result === '1/2-1/2' ? 'Nobody could break through.' : 'Game over after ' + Math.ceil(game.ply / 2) + ' moves.'} Soon you’ll be able to replay it here with your coach.</p>
      <div class="acts"><button class="btn line" data-a="look">Look at board</button><button class="btn dark" data-a="new">New game</button></div>`);
    card.querySelector('[data-a=new]').onclick = newGame;
    card.querySelector('[data-a=look]').onclick = () => board.clearOverlay();
  }

  function go(ply) {
    ply = Math.max(0, Math.min(game.ply, ply));
    if (ply === game.view) return;
    const step = Math.abs(ply - game.view) === 1;
    const fwd = ply > game.view;
    game.view = ply;
    if (step && fwd) {
      const m = game.moves[ply - 1];
      sound.play(m.captured ? 'capture' : 'move');
    }
    render({ animate: step });
  }
  function newGame() {
    game.reset();
    board.setDrawings([]);
    if (autoFlip) board.setOrientation('w');
    render({ animate: false });
    save();
  }
  function save() {
    localStorage.setItem('ponder.local', JSON.stringify({ sans: game.moves.map(m => m.san), orientation: board.orientation, autoFlip }));
  }

  $('#moves').addEventListener('click', e => { const b = e.target.closest('.mv'); if (b) go(+b.dataset.ply); });
  $('#first').onclick = () => go(0);
  $('#prev').onclick = () => go(game.view - 1);
  $('#next').onclick = () => go(game.view + 1);
  $('#last').onclick = () => go(game.ply);
  $('#golive').onclick = () => go(game.ply);
  $('#flip').onclick = () => { board.flip(); render({ animate: false }); save(); };
  $('#undo').onclick = () => { game.undo(); render(); save(); };
  $('#new').onclick = () => { if (!game.ply || game.over || confirm('Start a new game? This one will be cleared.')) newGame(); };
  $('#snd').onclick = e => { const on = sound.toggle(); e.currentTarget.innerHTML = icon(on ? 'sound' : 'mute', 16); toast(on ? 'Sound on' : 'Sound off'); };
  $('#autoflip').onclick = () => { autoFlip = !autoFlip; if (autoFlip) board.setOrientation(game.turn); render({ animate: false }); save(); toast(autoFlip ? 'Board turns after each move' : 'Auto-flip off'); };
  $('#pgn').onclick = async () => { try { await navigator.clipboard.writeText(game.pgn()); toast('PGN copied'); } catch { prompt('Copy the PGN:', game.pgn()); } };

  const onKey = e => {
    if (e.target.closest('input,textarea')) return;
    if (e.key === 'ArrowLeft') { go(game.view - 1); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { go(game.view + 1); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { go(0); e.preventDefault(); }
    else if (e.key === 'ArrowDown') { go(game.ply); e.preventDefault(); }
    else if (e.key.toLowerCase() === 'f') { $('#flip').click(); }
  };
  window.addEventListener('keydown', onKey);
  render({ animate: false });
  // expose for automation (coach & tests)
  window.ponder = { game, board, go, render };
  return () => window.removeEventListener('keydown', onKey);
}
