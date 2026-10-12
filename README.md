# ponder ♞

**Think first. Then move.** A chess app for learning by understanding, not memorizing.

Live: https://mpaktit.github.io/chess/

## What works now (steps 1–2)
- Full rules: castling, en passant, promotion picker, check, checkmate, stalemate, threefold repetition, 50-move rule, not enough material
- Drag-and-drop or click-to-move, legal move dots, last-move and check highlights
- Smooth piece animation and soft synthesized sounds
- Right-click arrows and circles (Shift = green, Alt = red)
- Move list, step through moves (← →), take back, flip board, auto-flip
- Captured pieces with material count, opening names, PGN copy
- Game saved in your browser, so a refresh keeps it
- Clocks: bullet, blitz, rapid, increment, no clock; low-time warning, time-out rules
- Resign, draw, takeback, rematch, game-over card
- Settings: 6 board themes, 6 piece sets, sounds, coordinates, legal-move dots, animation, auto-queen

## Roadmap
1. ✅ Board and rules
2. ✅ Clocks and game controls
3. Online rooms (Supabase): fair games and friend games
4. Stockfish and analysis
5. Coaching game: coach chat, plan box, candidate moves, ghost pieces, hints
6. Replay with coach chat: chapters, "try it first", "what if…"
7. Mistake puzzles, lesson cards, skill path, journal

## Tech
Plain HTML, CSS and JavaScript modules: no build step, hosted on GitHub Pages.

## Credits
- Chess rules: [chess.js](https://github.com/jhlywa/chess.js) (BSD-2-Clause)
- Pieces via [lichess](https://github.com/lichess-org/lila): Staunty (sadsnake1, CC BY-NC-SA 4.0), cburnett & Merida (GPLv2+), Alpha, Maestro & California (see lichess COPYING.md)
- Fonts: Bricolage Grotesque and Inter (SIL Open Font License)
