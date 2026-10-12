import { icon } from './ui.js';
const TIPS = [
  ['Count before you capture', 'Before taking a piece, count attackers and defenders on that square. More attackers usually means the capture works.'],
  ['Every move changes two things', 'A move adds something where the piece lands, and removes something from where it left. Ask what you just stopped guarding.'],
  ['Knights love outposts', 'A knight on a square that enemy pawns can never attack is often worth more than a rook.'],
  ['Ask what your opponent wants', 'Before your move, spend five seconds on theirs. What is their last move threatening?'],
];
export function mountHome(root) {
  const hour = new Date().getHours();
  const part = hour < 5 ? 'Late night' : hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  const [tt, tb] = TIPS[new Date().getDate() % TIPS.length];
  const hasGame = !!JSON.parse(localStorage.getItem('ponder.local') || 'null')?.sans?.length;
  root.innerHTML = `
  <div class="home">
    <div>
      <div class="hero"><div class="eyebrow">${part}</div><h1>Think first. Then move.</h1>
        <p>A place to learn chess by understanding it: plans, ideas and the person across the board.</p></div>
      <div class="modes">
        <a class="mode card" href="#/play" style="background:linear-gradient(180deg,#fff,#F7F8FF)">
          <div class="ic" style="background:var(--thinks);color:var(--think)">${icon('board', 22)}</div>
          <b>Practice board</b><span>Play both sides on this device. Every rule, arrows, sounds.</span>
          <div class="go" style="color:var(--think)">${hasGame ? 'Continue game →' : 'Open board →'}</div></a>
        <div class="mode card off"><span class="chip soon">Step 5</span>
          <div class="ic" style="background:var(--thinks);color:var(--think)">${icon('chat', 22)}</div>
          <b>Coaching game</b><span>I play, think out loud, and help when you ask.</span></div>
        <div class="mode card off"><span class="chip soon">Step 3</span>
          <div class="ic" style="background:var(--soft)">${icon('scale', 22)}</div>
          <b>Fair game</b><span>Full strength. No help. We talk after.</span></div>
        <div class="mode card off"><span class="chip soon">Step 3</span>
          <div class="ic" style="background:var(--goods);color:var(--good)">${icon('users', 22)}</div>
          <b>Invite a friend</b><span>Share a room code and play live.</span></div>
      </div>
    </div>
    <div class="rcol">
      <div class="card"><div class="eyebrow">Today’s idea</div><b>${tt}</b><p>${tb}</p></div>
      <div class="card"><div class="eyebrow">Building ponder</div>
        <ul class="steps">
          <li class="now"><i></i>Board and rules</li><li><i></i>Clocks and game controls</li><li><i></i>Online rooms</li>
          <li><i></i>Stockfish and analysis</li><li><i></i>Coaching game</li><li><i></i>Replay with coach chat</li><li><i></i>Puzzles, lesson cards, path</li>
        </ul></div>
    </div>
  </div>`;
}
export function mountSoon(root, { title, text, ic }) {
  root.innerHTML = `<div class="empty-page"><div class="ic">${icon(ic, 28)}</div><h1>${title}</h1><p>${text}</p><a class="btn dark" href="#/play">Open the practice board</a></div>`;
}
