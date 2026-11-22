// Keyboard and mouse state for the page. The simulation never reads the
// DOM itself: main.js asks this module for a snapshot each step — the held
// keys as booleans and at most one click, converted to world coordinates.

import { HUD_H } from './config.js';

export function createInput(canvas) {
  const keys = { up: false, down: false, left: false, right: false, sneak: false };
  let pendingClick = null;
  let startPressed = false;
  let restartPressed = false;

  const keyMap = {
    ArrowUp: 'up',
    KeyW: 'up',
    ArrowDown: 'down',
    KeyS: 'down',
    ArrowLeft: 'left',
    KeyA: 'left',
    ArrowRight: 'right',
    KeyD: 'right',
    ShiftLeft: 'sneak',
    ShiftRight: 'sneak',
  };

  window.addEventListener('keydown', (event) => {
    const name = keyMap[event.code];
    if (name) {
      keys[name] = true;
      event.preventDefault();
    }
    if (event.code === 'Enter' || event.code === 'Space') startPressed = true;
    if (event.code === 'KeyR') restartPressed = true;
  });
  window.addEventListener('keyup', (event) => {
    const name = keyMap[event.code];
    if (name) keys[name] = false;
  });
  window.addEventListener('blur', () => {
    for (const name of Object.keys(keys)) keys[name] = false;
  });

  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    pendingClick = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY - HUD_H,
    };
    startPressed = true;
  });

  return {
    // The input for one simulation step; consumes the pending click and
    // the one-shot start/restart flags.
    snapshot() {
      const click = pendingClick;
      pendingClick = null;
      return { ...keys, click };
    },
    takeStart() {
      const was = startPressed;
      startPressed = false;
      return was;
    },
    takeRestart() {
      const was = restartPressed;
      restartPressed = false;
      return was;
    },
  };
}
