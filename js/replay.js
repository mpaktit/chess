// ponder — Replay: archive list + simple game viewer (coach chat arrives in step 6)
import { Board } from './board.js';
import { sound } from './sound.js';
import { icon, toast, confirmBox, openSettings } from './ui.js';
import { NAME, moveListHTML, avatar, capsHTML, resultText, archive, gameFromRecord, gameRowHTML, download, copy, ago } from './parts.js';

export function mountReplay(root, id) {
  const rec = id && archive.get(id);
  if (!rec) return mountList(root, id);
  const game = gameFromRecord(rec);
  const spent = rec.spent || [];
  let auto = 0;
  root.innerHTML = `
  <div class="play">
    <div class="stage">
      <div class="strip" data-s="top"></div>
      <div id="board"></div>
      <div class="strip" data-s="bot"></div>
    </div>
    <aside class="panel">
      <div class="rphead">
        <a class="tb" href="#/replay" data-tip="All games">${icon('prev')}</a>
        <div><b>${rec.opening || 'Own path'}</b><small>${resultText(rec.result)} · ${rec.reason} · ${rec.tc === '—' ? 'No clock' : rec.tc} · ${ago(rec.ts)}</small></div>
      </div>
      <div class="pane on">
        <div class="mlist" id="mlist"></div>
        <div class="soonbox">${icon('chat', 20)}<div><b>Coach review lands in step 6</b><small>Chapters, your mistakes explained, “try it first” moments and a chat right here to ask about any move.</small></div></div>
        <div class="navbar" style="padding-top:10px">
          <div class="pill">
          <button class="nb" id="first" aria-label="First move">${icon('first')}</button><button class="nb" id="prev" aria-label="Previous move">${icon('prev')}</button>
          <button class="nb" id="auto" aria-label="Autoplay">${icon('autoplay')}</button>
          <button class="nb" id="next" aria-label="Next move">${icon('next')}</button><button class="nb" id="last" aria-label="Last move">${icon('last')}</button>
          </div>
        </div>
        <div class="tools">
          <button class="tb" id="pgn" data-tip="Copy PGN">${icon('copy')}</button>
          <button class="tb" id="dl" data-tip="Download PGN">${icon('download')}</button>
          <button class="tb" id="fen" data-tip="Copy FEN">${icon('fen')}</button>
          <button class="tb" id="del" data-tip="Delete game">${icon('trash')}</button>
          <span></span>
          <button class="tb" id="flip" data-tip="Flip board (F)">${icon('flip')}</button>
          <button class="tb" id="set" data-tip="Settings">${icon('settings')}</button>
        </div>
      </div>
    </aside>
  </div>`;
  const $ = s => root.querySelector(s);
  const board = new Board($('#board'), { orientation: 'w', canMove: () => false, dests: () => [] });
  const win = rec.result === '1-0' ? 'w' : rec.result === '0-1' ? 'b' : null;
  const strip = c => `${avatar(c)}<div class="pinfo"><div class="pname">${rec[c === 'w' ? 'white' : 'black'] || NAME[c]}${win === c ? `<span class="tag brass">Won</span>` : !win ? '<span class="tag">½</span>' : ''}</div><div class="caps">${capsHTML(game, c)}</div></div>`;
  function render(animate = true) {
    board.setPosition(game.fenAt(), { animate });
    board.setMarks({ last: game.lastMove(), check: game.checkSquare(), sel: null });
    const top = board.orientation === 'w' ? 'b' : 'w';
    $('[data-s=top]').innerHTML = strip(top); $('[data-s=bot]').innerHTML = strip(top === 'w' ? 'b' : 'w');
    const ml = $('#mlist');
    ml.innerHTML = moveListHTML(game.moves, game.view, spent, rec.opening) + `<div class="mres">${rec.result.replace('1/2', '½').replace('1/2', '½')} · ${rec.reason}</div>`;
    ml.querySelector('.mv.cur')?.scrollIntoView({ block: 'nearest' });
    $('#first').disabled = $('#prev').disabled = game.view === 0;
    $('#next').disabled = $('#last').disabled = game.view === game.ply;
  }
  function go(ply, user = true) {
    if (user) stopAuto();
    ply = Math.max(0, Math.min(game.ply, ply));
    if (ply === game.view) return;
    const step = Math.abs(ply - game.view) === 1;
    if (step && ply > game.view) sound.play(game.moves[ply - 1].captured ? 'capture' : 'move');
    game.view = ply; render(step);
  }
  function stopAuto() { if (auto) { clearInterval(auto); auto = 0; $('#auto').innerHTML = icon('autoplay'); $('#auto').classList.remove('on'); } }
  function toggleAuto() {
    if (auto) return stopAuto();
    if (game.view === game.ply) go(0, false);
    $('#auto').innerHTML = icon('pause'); $('#auto').classList.add('on');
    auto = setInterval(() => { if (game.view === game.ply) return stopAuto(); go(game.view + 1, false); }, 900);
  }
  $('#mlist').onclick = e => { const b = e.target.closest('.mv'); if (b) go(+b.dataset.ply); };
  $('#first').onclick = () => go(0); $('#prev').onclick = () => go(game.view - 1);
  $('#next').onclick = () => go(game.view + 1); $('#last').onclick = () => go(game.ply);
  $('#auto').onclick = toggleAuto;
  $('#flip').onclick = () => { board.flip(); render(false); };
  $('#set').onclick = openSettings;
  $('#pgn').onclick = () => copy(game.pgn(), toast, 'PGN');
  $('#fen').onclick = () => copy(game.fenAt(), toast, 'FEN');
  $('#dl').onclick = () => download(`ponder-${new Date(rec.ts).toISOString().slice(0, 10)}.pgn`, game.pgn());
  $('#del').onclick = async () => { if (await confirmBox('Delete this game?', 'It will be removed from your games on this device.', 'Delete')) { archive.remove(rec.id); location.hash = '#/replay'; } };
  const onKey = e => {
    if (document.querySelector('.modal')) return;
    const k = e.key;
    if (k === 'ArrowLeft') go(game.view - 1); else if (k === 'ArrowRight') go(game.view + 1);
    else if (k === 'ArrowUp') go(0); else if (k === 'ArrowDown') go(game.ply);
    else if (k === ' ') { toggleAuto(); e.preventDefault(); } else if (k.toLowerCase() === 'f') $('#flip').click(); else return;
    if (k.startsWith('Arrow')) e.preventDefault();
  };
  window.addEventListener('keydown', onKey);
  const onSet = e => { if (e.detail.k === 'pieces') render(false); };
  window.addEventListener('ponder:settings', onSet);
  render(false);
  return () => { stopAuto(); window.removeEventListener('keydown', onKey); window.removeEventListener('ponder:settings', onSet); };
}

function mountList(root, missing) {
  const list = archive.all();
  const n = { w: 0, b: 0, d: 0 };
  list.forEach(g => n[g.result === '1-0' ? 'w' : g.result === '0-1' ? 'b' : 'd']++);
  root.innerHTML = `<div class="rlist">
    <header><div><h1>Replays</h1><p>Every finished game, ready to step through. Coach reviews with chat arrive in step 6.</p></div>
      <a class="b3" href="#/play">${icon('play', 22)}Play a game</a></header>
    ${missing ? `<div class="soonbox">${icon('info', 20)}<div><b>That game isn’t on this device</b><small>Games are saved in this browser for now. Online sync comes with step 3.</small></div></div>` : ''}
    ${list.length ? `<div class="rstats"><div><b>${list.length}</b><span>games</span></div><div><b>${n.w}</b><span>White wins</span></div><div><b>${n.b}</b><span>Black wins</span></div><div><b>${n.d}</b><span>draws</span></div></div>
      <div class="rgrid">${list.map(gameRowHTML).join('')}</div>`
      : `<div class="mempty big"><b>No games yet</b>Finish a game and it shows up here.</div>`}
  </div>`;
}
