// The game itself: state and rules, with no drawing and no DOM, so the
// whole heist can be simulated headlessly. One fixed-step update advances
// the thief, the guards and the cameras, works out who can see the thief,
// fills or drains the alarm meter, and decides the caught and getaway
// endings.
//
// Flow: 'title' -> 'playing' -> 'caught' | 'won'. The staged screenshot
// scenes use status 'shot', which update() leaves frozen.

import {
  ALARM_CAUGHT,
  ALARM_DECAY,
  ALARM_FROM_CAMERA,
  ALARM_FROM_CAMERA_SNEAKING,
  ALARM_FROM_GUARD,
  ALARM_FROM_GUARD_SNEAKING,
  COINS_PER_RUN,
  COIN_DISTRACT_RADIUS,
  COIN_DISTRACT_SECONDS,
  COIN_FLIGHT_SECONDS,
  GUARD_SIGHT_HALF_ANGLE,
  GUARD_SIGHT_RANGE,
  PICKUP_DISTANCE,
  TOUCH_CAUGHT_DISTANCE,
} from './config.js';
import { distance } from './geometry.js';
import { buildLevel } from './level.js';
import { createGuard, distractGuard, updateGuard } from './guards.js';
import { createCamera, updateCamera } from './cameras.js';
import { createThief, updateThief } from './player.js';
import { canSee } from './vision.js';

export function createGame(seed) {
  const level = buildLevel(seed);
  return {
    level,
    status: 'title',
    time: 0,
    thief: createThief(level.entry.x, level.entry.y),
    guards: level.guardRoutes.map((route, i) => createGuard(route, level.guardPhase[i])),
    cameras: level.cameras.map(createCamera),
    coinsLeft: COINS_PER_RUN,
    coins: [], // { x, y, fromX, fromY, flightLeft, landed }
    alarm: 0,
    take: 0,
    hasDiamond: false,
    spottedBy: null, // 'guard' | 'camera' | null — who sees the thief right now
    exitHintLeft: 0, // seconds the "you need the diamond" hint stays up
    endMessage: '',
  };
}

export function startRun(game) {
  if (game.status === 'title') game.status = 'playing';
}

// Throw a decoy coin toward (x, y). Returns false when none are left or
// the run is not live. The coin flies for a moment, then lands and pulls
// the gaze of every guard close enough to hear it.
export function throwCoin(game, x, y) {
  if (game.status !== 'playing' || game.coinsLeft <= 0) return false;
  game.coinsLeft -= 1;
  game.coins.push({
    x,
    y,
    fromX: game.thief.x,
    fromY: game.thief.y,
    flightLeft: COIN_FLIGHT_SECONDS,
    landed: false,
  });
  return true;
}

function landCoin(game, coin) {
  coin.landed = true;
  for (const guard of game.guards) {
    if (distance(guard.x, guard.y, coin.x, coin.y) <= COIN_DISTRACT_RADIUS) {
      distractGuard(guard, coin.x, coin.y, COIN_DISTRACT_SECONDS);
    }
  }
}

function takeNearbyLoot(game) {
  for (const pedestal of game.level.pedestals) {
    if (pedestal.taken) continue;
    if (distance(game.thief.x, game.thief.y, pedestal.x, pedestal.y) <= PICKUP_DISTANCE) {
      pedestal.taken = true;
      game.take += pedestal.value;
      if (pedestal.kind === 'diamond') game.hasDiamond = true;
    }
  }
}

// Who sees the thief this step, and how fast the alarm should fill.
// The fastest single observer sets the rate: being seen by two watchers at
// once is bad luck, not double jeopardy.
function detection(game) {
  const { thief, level } = game;
  let rate = 0;
  let by = null;
  for (const guard of game.guards) {
    guard.seesThief = canSee(
      guard.x, guard.y, guard.facing, GUARD_SIGHT_HALF_ANGLE, GUARD_SIGHT_RANGE,
      thief.x, thief.y, level.sightBlockers,
    );
    if (guard.seesThief) {
      const guardRate = thief.sneaking ? ALARM_FROM_GUARD_SNEAKING : ALARM_FROM_GUARD;
      if (guardRate > rate) { rate = guardRate; by = 'guard'; }
    }
  }
  for (const camera of game.cameras) {
    camera.seesThief = canSee(
      camera.x, camera.y, camera.facing, camera.halfAngle, camera.range,
      thief.x, thief.y, level.sightBlockers,
    );
    if (camera.seesThief) {
      const cameraRate = thief.sneaking ? ALARM_FROM_CAMERA_SNEAKING : ALARM_FROM_CAMERA;
      if (cameraRate > rate) { rate = cameraRate; by = 'camera'; }
    }
  }
  return { rate, by };
}

// Advance the simulation by dt seconds. `input` is
// { up, down, left, right, sneak, click } where click is null or { x, y }
// in world coordinates.
export function updateGame(game, dt, input) {
  if (game.status !== 'playing') return;

  game.time += dt;
  if (game.exitHintLeft > 0) game.exitHintLeft -= dt;

  updateThief(game.thief, dt, input, game.level.moveBlockers);
  for (const guard of game.guards) updateGuard(guard, dt);
  for (const camera of game.cameras) updateCamera(camera, game.time);

  if (input.click) throwCoin(game, input.click.x, input.click.y);
  for (const coin of game.coins) {
    if (!coin.landed) {
      coin.flightLeft -= dt;
      if (coin.flightLeft <= 0) landCoin(game, coin);
    }
  }

  takeNearbyLoot(game);

  // A guard's hand on the thief ends the run at once.
  for (const guard of game.guards) {
    if (distance(guard.x, guard.y, game.thief.x, game.thief.y) <= TOUCH_CAUGHT_DISTANCE) {
      game.status = 'caught';
      game.endMessage = 'A guard grabbed you.';
      return;
    }
  }

  const { rate, by } = detection(game);
  game.spottedBy = by;
  if (rate > 0) game.alarm = Math.min(ALARM_CAUGHT, game.alarm + rate * dt);
  else game.alarm = Math.max(0, game.alarm - ALARM_DECAY * dt);
  if (game.alarm >= ALARM_CAUGHT) {
    game.status = 'caught';
    game.endMessage = 'The alarm hit 100% — the hall locked down.';
    return;
  }

  // The EXIT door only pays off with the diamond in hand.
  const exit = game.level.exitZone;
  const atExit =
    game.thief.x >= exit.x - 6 && game.thief.x <= exit.x + exit.w + 6 &&
    game.thief.y >= exit.y - 6 && game.thief.y <= exit.y + exit.h + 6;
  if (atExit) {
    if (game.hasDiamond) {
      game.status = 'won';
      game.endMessage = 'Clean getaway.';
    } else {
      game.exitHintLeft = 1.6;
    }
  }
}
