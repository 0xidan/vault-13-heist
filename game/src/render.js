// Canvas rendering for VAULT 13: the hall, the cover, the loot, the vision
// cones, the thief and the guards, and the HUD band with TAKE, TIME, COINS
// and the alarm meter. Everything is drawn from the game state alone, so a
// staged screenshot scene renders exactly the frame it describes.

import {
  CANVAS_H,
  CANVAS_W,
  COINS_PER_RUN,
  COIN_FLIGHT_SECONDS,
  GUARD_SIGHT_HALF_ANGLE,
  GUARD_SIGHT_RANGE,
  HUD_H,
  WALL,
  WORLD_H,
  WORLD_W,
} from './config.js';
import { visionConePolygon } from './vision.js';

const INK = '#10182b';
const PAPER = '#f3ead2';
const GOLD = '#c9a227';
const CARPET = '#7a2230';

export function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = String(Math.floor(total / 60)).padStart(2, '0');
  const rest = String(total % 60).padStart(2, '0');
  return `${minutes}:${rest}`;
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFloor(ctx, game) {
  ctx.fillStyle = '#e6dcc0';
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  // Subtle checker of marble tiles.
  const tile = 40;
  ctx.fillStyle = 'rgba(120, 100, 60, 0.07)';
  for (let ty = 0; ty < WORLD_H / tile; ty++) {
    for (let tx = 0; tx < WORLD_W / tile; tx++) {
      if ((tx + ty) % 2 === 0) ctx.fillRect(tx * tile, ty * tile, tile, tile);
    }
  }
  // A burgundy carpet runner crossing the hall through the diamond.
  ctx.fillStyle = CARPET;
  ctx.fillRect(WALL, 296, WORLD_W - 2 * WALL, 48);
  ctx.fillRect(456, WALL, 48, WORLD_H - 2 * WALL);
  ctx.fillStyle = 'rgba(201, 162, 39, 0.5)';
  ctx.fillRect(WALL, 296, WORLD_W - 2 * WALL, 3);
  ctx.fillRect(WALL, 341, WORLD_W - 2 * WALL, 3);
  // Entry mat in the south-west corner.
  ctx.fillStyle = '#2e4a38';
  ctx.fillRect(44, 540, 56, 52);
  ctx.fillStyle = PAPER;
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('IN', 72, 570);
}

function drawWallsAndExit(ctx, game) {
  ctx.fillStyle = '#1c2a44';
  ctx.fillRect(0, 0, WORLD_W, WALL);
  ctx.fillRect(0, WORLD_H - WALL, WORLD_W, WALL);
  ctx.fillRect(0, 0, WALL, WORLD_H);
  ctx.fillRect(WORLD_W - WALL, 0, WALL, WORLD_H);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.strokeRect(WALL - 3, WALL - 3, WORLD_W - 2 * WALL + 6, WORLD_H - 2 * WALL + 6);

  // The EXIT door in the east wall: lit green once the diamond is in hand.
  const exit = game.level.exitZone;
  ctx.fillStyle = game.hasDiamond ? '#37d67a' : '#274b63';
  ctx.fillRect(WORLD_W - WALL, exit.y, WALL, exit.h);
  ctx.fillStyle = PAPER;
  ctx.save();
  ctx.translate(WORLD_W - WALL / 2, exit.y + exit.h / 2);
  ctx.rotate(Math.PI / 2);
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', 0, 4);
  ctx.restore();
}

function drawCover(ctx, game) {
  for (const cover of game.level.covers) {
    if (cover.kind === 'pillar') {
      ctx.fillStyle = '#8f897c';
      ctx.fillRect(cover.x, cover.y, cover.w, cover.h);
      ctx.strokeStyle = '#6d675c';
      ctx.lineWidth = 2;
      ctx.strokeRect(cover.x + 2, cover.y + 2, cover.w - 4, cover.h - 4);
    } else {
      // A glass display case: dark wood frame, pale glass, a glint, and a
      // small artifact resting inside.
      ctx.fillStyle = '#4a3220';
      ctx.fillRect(cover.x, cover.y, cover.w, cover.h);
      ctx.fillStyle = 'rgba(190, 227, 234, 0.85)';
      ctx.fillRect(cover.x + 5, cover.y + 5, cover.w - 10, cover.h - 10);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.beginPath();
      ctx.moveTo(cover.x + 10, cover.y + cover.h - 7);
      ctx.lineTo(cover.x + cover.w * 0.45, cover.y + 6);
      ctx.lineTo(cover.x + cover.w * 0.62, cover.y + 6);
      ctx.lineTo(cover.x + 26, cover.y + cover.h - 7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = GOLD;
      circle(ctx, cover.x + cover.w / 2, cover.y + cover.h / 2, 3.5);
      ctx.fill();
    }
  }
}

function drawPedestal(ctx, pedestal, time) {
  const { x, y } = pedestal;
  ctx.fillStyle = '#5b5348';
  ctx.fillRect(x - 13, y - 6, 26, 20);
  ctx.fillStyle = '#776e5f';
  ctx.fillRect(x - 16, y + 12, 32, 5);
  if (pedestal.taken) {
    ctx.strokeStyle = 'rgba(90, 84, 72, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y - 8, 11, Math.PI, 0);
    ctx.stroke();
    return;
  }
  if (pedestal.kind === 'diamond') {
    // The Aurora Diamond: a cyan gem under a glass dome, with a slow
    // breathing glow so the eye finds it from anywhere in the hall.
    const glow = 16 + Math.sin(time * 2.4) * 4;
    const gradient = ctx.createRadialGradient(x, y - 10, 2, x, y - 10, glow + 12);
    gradient.addColorStop(0, 'rgba(111, 243, 255, 0.55)');
    gradient.addColorStop(1, 'rgba(111, 243, 255, 0)');
    ctx.fillStyle = gradient;
    circle(ctx, x, y - 10, glow + 12);
    ctx.fill();
    ctx.fillStyle = '#6ff3ff';
    ctx.beginPath();
    ctx.moveTo(x, y - 24);
    ctx.lineTo(x + 9, y - 12);
    ctx.lineTo(x, y - 2);
    ctx.lineTo(x - 9, y - 12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#d9fbff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 9, y - 12);
    ctx.lineTo(x + 9, y - 12);
    ctx.moveTo(x, y - 24);
    ctx.lineTo(x, y - 2);
    ctx.stroke();
  } else {
    // A small pile of gold bars.
    ctx.fillStyle = '#f2c14e';
    ctx.fillRect(x - 10, y - 12, 20, 6);
    ctx.fillRect(x - 7, y - 18, 14, 6);
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 10, y - 12, 20, 6);
    ctx.strokeRect(x - 7, y - 18, 14, 6);
  }
  ctx.strokeStyle = 'rgba(70, 64, 54, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y - 8, 13, Math.PI, 0);
  ctx.stroke();
}

function drawCoin(ctx, coin) {
  let x = coin.x;
  let y = coin.y;
  let lift = 0;
  if (!coin.landed) {
    const t = 1 - Math.max(0, coin.flightLeft) / COIN_FLIGHT_SECONDS;
    x = coin.fromX + (coin.x - coin.fromX) * t;
    y = coin.fromY + (coin.y - coin.fromY) * t;
    lift = Math.sin(t * Math.PI) * 26;
  }
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.beginPath();
  ctx.ellipse(x, y + 3, 6, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2c14e';
  circle(ctx, x, y - lift, 6);
  ctx.fill();
  ctx.strokeStyle = '#b8860b';
  ctx.lineWidth = 1.5;
  circle(ctx, x, y - lift, 6);
  ctx.stroke();
  ctx.fillStyle = '#b8860b';
  ctx.font = 'bold 8px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('$', x, y - lift + 3);
}

function drawCone(ctx, game, eyeX, eyeY, facing, halfAngle, range, seesThief, isCamera) {
  const polygon = visionConePolygon(eyeX, eyeY, facing, halfAngle, range, game.level.sightBlockers);
  ctx.fillStyle = seesThief
    ? 'rgba(255, 64, 48, 0.38)'
    : isCamera
      ? 'rgba(90, 170, 255, 0.20)'
      : 'rgba(255, 190, 60, 0.26)';
  ctx.beginPath();
  ctx.moveTo(polygon[0].x, polygon[0].y);
  for (let i = 1; i < polygon.length; i++) ctx.lineTo(polygon[i].x, polygon[i].y);
  ctx.closePath();
  ctx.fill();
}

function drawGuard(ctx, guard) {
  const { x, y } = guard;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.20)';
  ctx.beginPath();
  ctx.ellipse(x, y + 9, 11, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#24365e';
  circle(ctx, x, y, guard.radius);
  ctx.fill();
  ctx.strokeStyle = '#16233d';
  ctx.lineWidth = 2;
  circle(ctx, x, y, guard.radius);
  ctx.stroke();
  // Cap brim toward the facing direction, and a pale face.
  const fx = Math.cos(guard.facing);
  const fy = Math.sin(guard.facing);
  ctx.fillStyle = '#e8c39e';
  circle(ctx, x + fx * 3, y + fy * 3, 5.5);
  ctx.fill();
  ctx.fillStyle = '#16233d';
  ctx.beginPath();
  ctx.arc(x, y, 8, guard.facing - 2.4, guard.facing + 2.4);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();
  // A badge dot, so a guard reads as staff and not as a second thief.
  ctx.fillStyle = GOLD;
  circle(ctx, x - fy * 6, y + fx * 6, 2.2);
  ctx.fill();

  if (guard.seesThief) {
    drawSpeechMark(ctx, x, y - 24, '!', '#e5322d');
  } else if (guard.mode === 'distracted') {
    drawSpeechMark(ctx, x, y - 24, '?', '#b8860b');
  }
}

function drawSpeechMark(ctx, x, y, mark, color) {
  ctx.fillStyle = '#ffffff';
  circle(ctx, x, y, 9);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  circle(ctx, x, y, 9);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(mark, x, y + 4.5);
}

function drawCamera(ctx, camera) {
  const { x, y } = camera;
  ctx.fillStyle = '#22252c';
  circle(ctx, x, y, 8);
  ctx.fill();
  ctx.strokeStyle = '#454a55';
  ctx.lineWidth = 2;
  circle(ctx, x, y, 8);
  ctx.stroke();
  ctx.fillStyle = camera.seesThief ? '#ff4030' : '#7ee787';
  circle(ctx, x + Math.cos(camera.facing) * 3, y + Math.sin(camera.facing) * 3, 2.6);
  ctx.fill();
}

function drawThief(ctx, thief) {
  const { x, y } = thief;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.beginPath();
  ctx.ellipse(x, y + 9, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  if (thief.sneaking) {
    ctx.strokeStyle = 'rgba(20, 22, 28, 0.55)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    circle(ctx, x, y, thief.radius + 5);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  const scale = thief.sneaking ? 0.88 : 1;
  ctx.fillStyle = '#14161c';
  circle(ctx, x, y, thief.radius * scale);
  ctx.fill();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  circle(ctx, x, y, thief.radius * scale);
  ctx.stroke();
  // A cream mask stripe across the eyes, turned toward the facing.
  const fx = Math.cos(thief.facing);
  const fy = Math.sin(thief.facing);
  ctx.strokeStyle = '#f3ead2';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + fx * 6 - fy * 5, y + fy * 6 + fx * 5);
  ctx.lineTo(x + fx * 6 + fy * 5, y + fy * 6 - fx * 5);
  ctx.stroke();
  // The loot bag on his back fills out once the diamond is his — drawn by
  // main render through game state; here a simple sack opposite the facing.
  ctx.fillStyle = '#3d2c17';
  circle(ctx, x - fx * 8, y - fy * 8, 4.5);
  ctx.fill();
}

function alarmColor(alarm) {
  if (alarm < 45) return '#37d67a';
  if (alarm < 75) return '#f2c14e';
  return '#e5322d';
}

function drawHud(ctx, game) {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, CANVAS_W, HUD_H);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, HUD_H - 3, CANVAS_W, 3);

  ctx.textAlign = 'left';
  ctx.fillStyle = PAPER;
  ctx.font = 'bold 21px system-ui, sans-serif';
  ctx.fillText('VAULT 13', 16, 40);

  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText(`TAKE  $${game.take}`, 150, 40);
  ctx.fillText(`TIME  ${formatTime(game.time)}`, 300, 40);

  // Coin pips: one per decoy coin, hollow once thrown.
  ctx.fillStyle = PAPER;
  ctx.fillText('COINS', 452, 40);
  for (let i = 0; i < COINS_PER_RUN; i++) {
    const x = 522 + i * 22;
    if (i < game.coinsLeft) {
      ctx.fillStyle = '#f2c14e';
      circle(ctx, x, 33, 8);
      ctx.fill();
      ctx.fillStyle = '#b8860b';
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('$', x, 36.5);
      ctx.textAlign = 'left';
    } else {
      ctx.strokeStyle = 'rgba(243, 234, 210, 0.4)';
      ctx.lineWidth = 1.5;
      circle(ctx, x, 33, 8);
      ctx.stroke();
    }
  }

  // The alarm meter: a labelled bar that runs green, amber, red.
  ctx.fillStyle = PAPER;
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText('ALARM', 606, 40);
  const barX = 682;
  const barW = 190;
  ctx.fillStyle = '#2a3247';
  roundedRect(ctx, barX, 20, barW, 18, 4);
  ctx.fill();
  if (game.alarm > 0) {
    ctx.fillStyle = alarmColor(game.alarm);
    roundedRect(ctx, barX, 20, Math.max(6, (barW * game.alarm) / 100), 18, 4);
    ctx.fill();
  }
  if (game.alarm >= 75 && Math.floor(game.time * 4) % 2 === 0) {
    ctx.strokeStyle = '#e5322d';
    ctx.lineWidth = 2;
    roundedRect(ctx, barX - 2, 18, barW + 4, 22, 5);
    ctx.stroke();
  }
  ctx.fillStyle = PAPER;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(`${Math.floor(game.alarm)}%`, barX + barW + 10, 40);

  if (game.spottedBy) {
    ctx.fillStyle = '#ff6b5e';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('SPOTTED!', CANVAS_W - 14, 56);
    ctx.textAlign = 'left';
  }
}

function drawObjectiveToast(ctx, game) {
  let text = null;
  if (game.status === 'playing' && game.exitHintLeft > 0) {
    text = 'You need the Aurora Diamond first!';
  }
  if (!text) return;
  ctx.font = 'bold 16px system-ui, sans-serif';
  const width = ctx.measureText(text).width + 32;
  ctx.fillStyle = 'rgba(16, 24, 43, 0.88)';
  roundedRect(ctx, (WORLD_W - width) / 2, WORLD_H - 52, width, 32, 8);
  ctx.fill();
  ctx.fillStyle = '#ffd34d';
  ctx.textAlign = 'center';
  ctx.fillText(text, WORLD_W / 2, WORLD_H - 31);
  ctx.textAlign = 'left';
}

function drawOverlay(ctx, game) {
  let title = null;
  let lines = [];
  if (game.status === 'title') {
    title = 'VAULT 13';
    lines = [
      'One thief. Three guards. One diamond.',
      '',
      'WASD / arrows — move        SHIFT — sneak',
      'CLICK — throw a decoy coin (3 per run)',
      'Steal the Aurora Diamond from the centre pedestal,',
      'then slip out through the EXIT door.',
      'Fill the alarm to 100% and the hall locks down.',
      '',
      'Click or press Enter to start',
    ];
  } else if (game.status === 'caught') {
    title = 'CAUGHT!';
    lines = [
      game.endMessage,
      '',
      `You lifted $${game.take} in ${formatTime(game.time)}.`,
      '',
      'Press R to try again',
    ];
  } else if (game.status === 'won') {
    title = 'CLEAN GETAWAY!';
    lines = [
      'Out the EXIT door with the Aurora Diamond.',
      '',
      `Total take: $${game.take}   •   Time: ${formatTime(game.time)}   •   Alarm at ${Math.floor(game.alarm)}%`,
      '',
      'Press R to run it again',
    ];
  }
  if (!title) return;

  ctx.fillStyle = 'rgba(10, 14, 24, 0.62)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  const panelW = 560;
  const panelH = game.status === 'title' ? 330 : 240;
  const panelX = (CANVAS_W - panelW) / 2;
  const panelY = (CANVAS_H - panelH) / 2;
  ctx.fillStyle = 'rgba(16, 24, 43, 0.95)';
  roundedRect(ctx, panelX, panelY, panelW, panelH, 14);
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  roundedRect(ctx, panelX, panelY, panelW, panelH, 14);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = game.status === 'caught' ? '#ff6b5e' : game.status === 'won' ? '#37d67a' : PAPER;
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.fillText(title, CANVAS_W / 2, panelY + 66);
  ctx.fillStyle = PAPER;
  ctx.font = '16px system-ui, sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, CANVAS_W / 2, panelY + 108 + i * 24);
  });
  ctx.textAlign = 'left';
}

// The one entry point: draw the whole frame for the current game state.
export function drawGame(ctx, game) {
  drawHud(ctx, game);
  ctx.save();
  ctx.translate(0, HUD_H);
  drawFloor(ctx, game);
  drawWallsAndExit(ctx, game);
  for (const camera of game.cameras) {
    drawCone(ctx, game, camera.x, camera.y, camera.facing, camera.halfAngle, camera.range, camera.seesThief, true);
  }
  for (const guard of game.guards) {
    drawCone(ctx, game, guard.x, guard.y, guard.facing, GUARD_SIGHT_HALF_ANGLE, GUARD_SIGHT_RANGE, guard.seesThief, false);
  }
  drawCover(ctx, game);
  for (const pedestal of game.level.pedestals) drawPedestal(ctx, pedestal, game.time);
  for (const coin of game.coins) drawCoin(ctx, coin);
  for (const camera of game.cameras) drawCamera(ctx, camera);
  for (const guard of game.guards) drawGuard(ctx, guard);
  drawThief(ctx, game.thief);
  drawObjectiveToast(ctx, game);
  ctx.restore();
  drawOverlay(ctx, game);
}
