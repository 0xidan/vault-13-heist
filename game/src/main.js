// VAULT 13 — page bootstrap. Wires the canvas, the input and the fixed-step
// simulation together, and handles the two ways the page is opened:
//   play mode    — no query: title screen, then the live game loop
//   screenshot   — ?shot=sneak|loot|alarm|win&seed=13: one staged scene,
//                  drawn once and left frozen for the maker's screenshots

import { CANVAS_H, CANVAS_W } from './config.js';
import { createGame, startRun, updateGame } from './game.js';
import { createInput } from './input.js';
import { drawGame } from './render.js';
import { stageShot } from './shots.js';

const STEP = 1 / 120; // fixed simulation step, seconds

function boot() {
  const canvas = document.getElementById('game');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d');

  const params = new URLSearchParams(window.location.search);
  const seed = Number(params.get('seed') ?? 13) || 13;
  const shot = params.get('shot');

  if (shot) {
    const game = stageShot(createGame(seed), shot);
    drawGame(ctx, game);
    window.addEventListener('resize', () => drawGame(ctx, game));
    return;
  }

  let game = createGame(seed);
  const input = createInput(canvas);
  let last = performance.now();
  let owed = 0;

  function frame(now) {
    owed += Math.min(0.1, (now - last) / 1000);
    last = now;

    if (game.status === 'title') {
      input.snapshot(); // discard any click that belongs to the title
      if (input.takeStart()) startRun(game);
      owed = 0;
    } else if (game.status === 'playing') {
      let snapshot = input.snapshot();
      while (owed >= STEP) {
        updateGame(game, STEP, snapshot);
        snapshot = { ...snapshot, click: null }; // a click throws one coin
        owed -= STEP;
        if (game.status !== 'playing') { owed = 0; break; }
      }
    } else {
      owed = 0;
      if (input.takeRestart()) {
        game = createGame(seed);
        startRun(game);
      }
    }

    drawGame(ctx, game);
    window.requestAnimationFrame(frame);
  }
  window.requestAnimationFrame(frame);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}
