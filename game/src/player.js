// The thief: a circle that walks or sneaks through the hall, sliding along
// cover instead of passing through it. Movement is axis-separated — try x,
// then y — which is what makes the sliding work.

import { THIEF_RADIUS, THIEF_SNEAK_SPEED, THIEF_WALK_SPEED, WALL, WORLD_H, WORLD_W } from './config.js';
import { circleHitsRect, clamp } from './geometry.js';

export function createThief(x, y) {
  return {
    x,
    y,
    radius: THIEF_RADIUS,
    facing: -Math.PI / 2, // starts looking into the hall
    moving: false,
    sneaking: false,
  };
}

function hitsAnyBlocker(x, y, radius, blockers) {
  for (const rect of blockers) {
    if (circleHitsRect(x, y, radius, rect)) return true;
  }
  return false;
}

// `input` is { up, down, left, right, sneak } with the keys as booleans.
export function updateThief(thief, dt, input, blockers) {
  let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  thief.sneaking = Boolean(input.sneak);
  thief.moving = dx !== 0 || dy !== 0;
  if (!thief.moving) return;

  const length = Math.hypot(dx, dy);
  dx /= length;
  dy /= length;
  thief.facing = Math.atan2(dy, dx);
  const speed = thief.sneaking ? THIEF_SNEAK_SPEED : THIEF_WALK_SPEED;
  const stepX = dx * speed * dt;
  const stepY = dy * speed * dt;

  const nextX = clamp(thief.x + stepX, WALL + thief.radius, WORLD_W - WALL - thief.radius);
  if (!hitsAnyBlocker(nextX, thief.y, thief.radius, blockers)) thief.x = nextX;
  const nextY = clamp(thief.y + stepY, WALL + thief.radius, WORLD_H - WALL - thief.radius);
  if (!hitsAnyBlocker(thief.x, nextY, thief.radius, blockers)) thief.y = nextY;
}
