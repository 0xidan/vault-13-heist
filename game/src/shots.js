// Staged screenshot scenes. Each one freezes a fresh game into a fixed,
// representative moment — the thief mid-sneak, the diamond just lifted, the
// alarm a breath from lockdown, the getaway made — so the maker's
// screenshots (shots.json) always show the same honest frames of the game.

function freezeGuard(guard, x, y, facing) {
  guard.x = x;
  guard.y = y;
  guard.facing = facing;
  guard.mode = 'pause';
  guard.pauseBase = facing;
  guard.pauseTime = 0;
  guard.pauseLeft = 1.5;
  guard.seesThief = false;
}

function placeThief(game, x, y, facing, sneaking) {
  game.thief.x = x;
  game.thief.y = y;
  game.thief.facing = facing;
  game.thief.sneaking = sneaking;
  game.thief.moving = false;
}

// Sneaking past a guard: the thief is crouched by the west pillar while the
// centre guard's cone sweeps just wide of him. Nothing taken yet.
function stageSneak(game) {
  game.status = 'shot';
  game.time = 47;
  game.alarm = 12;
  placeThief(game, 298, 350, Math.PI / 2, true);
  freezeGuard(game.guards[0], 520, 110, 0);
  freezeGuard(game.guards[1], 640, 530, Math.PI);
  freezeGuard(game.guards[2], 340, 300, Math.PI / 2);
  game.cameras[0].facing = 0.9;
  game.cameras[1].facing = -2.0;
}

// The diamond, taken: the thief stands at the emptied centre pedestal while
// a thrown coin holds the centre guard's gaze in the south-east.
function stageLoot(game) {
  game.status = 'shot';
  game.time = 83;
  game.alarm = 35;
  game.take = 1000;
  game.hasDiamond = true;
  game.level.pedestals[0].taken = true;
  game.coinsLeft = 2;
  game.coins.push({ x: 600, y: 430, fromX: 446, fromY: 320, flightLeft: 0, landed: true });
  placeThief(game, 446, 320, 0, false);
  freezeGuard(game.guards[0], 500, 110, 0);
  freezeGuard(game.guards[1], 300, 530, Math.PI);
  const centre = game.guards[2];
  freezeGuard(centre, 560, 390, Math.atan2(430 - 390, 600 - 560));
  centre.mode = 'distracted';
  centre.distractX = 600;
  centre.distractY = 430;
  centre.distractLeft = 2;
  game.cameras[0].facing = 0.9;
  game.cameras[1].facing = -2.6;
}

// A breath from lockdown: the thief, diamond and one gold bar already his,
// is caught squarely in the centre guard's cone at 92% alarm.
function stageAlarm(game) {
  game.status = 'shot';
  game.time = 121;
  game.alarm = 92;
  game.take = 1250;
  game.hasDiamond = true;
  game.level.pedestals[0].taken = true;
  game.level.pedestals[1].taken = true;
  game.coinsLeft = 1;
  placeThief(game, 560, 300, -0.4, false);
  freezeGuard(game.guards[0], 700, 230, Math.PI);
  freezeGuard(game.guards[1], 250, 410, 0);
  const centre = game.guards[2];
  freezeGuard(centre, 470, 262, Math.atan2(300 - 262, 560 - 470));
  centre.seesThief = true;
  game.spottedBy = 'guard';
  game.cameras[0].facing = 0.4;
  game.cameras[1].facing = -1.9;
}

// The getaway: every pedestal emptied, the thief at the EXIT door with the
// diamond, and the run's final numbers on the board.
function stageWin(game) {
  game.status = 'won';
  game.endMessage = 'Clean getaway.';
  game.time = 158;
  game.alarm = 48;
  game.take = 1500;
  game.hasDiamond = true;
  for (const pedestal of game.level.pedestals) pedestal.taken = true;
  game.coinsLeft = 1;
  placeThief(game, 908, 320, 0, false);
  freezeGuard(game.guards[0], 250, 110, 0);
  freezeGuard(game.guards[1], 600, 530, Math.PI);
  freezeGuard(game.guards[2], 480, 390, Math.PI / 2);
  game.cameras[0].facing = 0.8;
  game.cameras[1].facing = -2.4;
}

const SCENES = {
  sneak: stageSneak,
  loot: stageLoot,
  alarm: stageAlarm,
  win: stageWin,
};

// Put the game into the named scene. Unknown names leave the game at its
// title, so a mistyped query still shows something sensible.
export function stageShot(game, name) {
  const scene = SCENES[name];
  if (scene) scene(game);
  return game;
}
