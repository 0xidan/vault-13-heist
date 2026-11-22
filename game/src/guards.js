// Guards. Each guard walks a loop of waypoints; at every waypoint he stops
// and sweeps his gaze to either side before walking on. A landed decoy coin
// turns a guard toward it for a few seconds — he stands still and stares at
// the coin instead of patrolling. A guard's state is plain data so the whole
// simulation can run headlessly in tests.

import {
  GUARD_PAUSE_SECONDS,
  GUARD_RADIUS,
  GUARD_SPEED,
  GUARD_SWEEP_RADIANS,
  GUARD_SWEEP_SPEED,
} from './config.js';
import { angleDifference, distance, turnToward } from './geometry.js';

export function createGuard(route, phaseOffset) {
  const start = route[0];
  return {
    x: start.x,
    y: start.y,
    radius: GUARD_RADIUS,
    route,
    waypoint: 1 % route.length,
    facing: Math.atan2(route[1 % route.length].y - start.y, route[1 % route.length].x - start.x),
    mode: 'patrol', // 'patrol' | 'pause' | 'distracted'
    pauseLeft: 0,
    pauseBase: 0,
    pauseTime: -phaseOffset, // staggers the sweeps between guards
    distractX: 0,
    distractY: 0,
    distractLeft: 0,
    seesThief: false,
  };
}

// Turn a guard away from his patrol to stare at a point for `seconds`.
export function distractGuard(guard, x, y, seconds) {
  guard.mode = 'distracted';
  guard.distractX = x;
  guard.distractY = y;
  guard.distractLeft = seconds;
}

export function updateGuard(guard, dt) {
  if (guard.mode === 'distracted') {
    const toward = Math.atan2(guard.distractY - guard.y, guard.distractX - guard.x);
    guard.facing = turnToward(guard.facing, toward, 6 * dt);
    guard.distractLeft -= dt;
    if (guard.distractLeft <= 0) guard.mode = 'patrol';
    return;
  }

  if (guard.mode === 'pause') {
    guard.pauseTime += dt;
    guard.pauseLeft -= dt;
    guard.facing = guard.pauseBase + Math.sin(guard.pauseTime * GUARD_SWEEP_SPEED) * GUARD_SWEEP_RADIANS;
    if (guard.pauseLeft <= 0) {
      guard.mode = 'patrol';
      guard.waypoint = (guard.waypoint + 1) % guard.route.length;
    }
    return;
  }

  // Patrol: walk toward the current waypoint; on arrival, pause and sweep.
  const target = guard.route[guard.waypoint];
  const dist = distance(guard.x, guard.y, target.x, target.y);
  const step = GUARD_SPEED * dt;
  if (dist <= Math.max(step, 2)) {
    guard.x = target.x;
    guard.y = target.y;
    guard.mode = 'pause';
    guard.pauseLeft = GUARD_PAUSE_SECONDS;
    guard.pauseTime = 0;
    guard.pauseBase = guard.facing;
    return;
  }
  const toward = Math.atan2(target.y - guard.y, target.x - guard.x);
  guard.facing = turnToward(guard.facing, toward, 4.5 * dt);
  guard.x += Math.cos(toward) * step;
  guard.y += Math.sin(toward) * step;
}

// Is this guard currently looking straight at the point, within a whisker?
// (Used for the "!" marker; the real detection lives in game.js via vision.)
export function guardFacesPoint(guard, x, y) {
  const toward = Math.atan2(y - guard.y, x - guard.x);
  return Math.abs(angleDifference(guard.facing, toward)) < 0.2;
}
