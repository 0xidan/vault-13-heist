// The vault hall: one museum room, built deterministically from the seed.
// Display cases and pillars are cover — they block movement and sight.
// Pedestals hold the loot; the Aurora Diamond in the middle is the prize,
// the two gold pedestals are optional. The thief enters at the south-west
// mat and leaves through the EXIT door in the east wall.

import { DIAMOND_VALUE, GOLD_VALUE, WALL, WORLD_H, WORLD_W } from './config.js';
import { makeRandom, randomRange } from './random.js';

export function buildLevel(seed) {
  const random = makeRandom(seed);

  // Cover: glass display cases (long rectangles) and two stone pillars.
  const covers = [
    { x: 300, y: 150, w: 110, h: 26, kind: 'case' },
    { x: 550, y: 150, w: 110, h: 26, kind: 'case' },
    { x: 300, y: 464, w: 110, h: 26, kind: 'case' },
    { x: 550, y: 464, w: 110, h: 26, kind: 'case' },
    { x: 150, y: 290, w: 26, h: 110, kind: 'case' },
    { x: 784, y: 240, w: 26, h: 90, kind: 'case' },
    { x: 225, y: 305, w: 30, h: 30, kind: 'pillar' },
    { x: 705, y: 305, w: 30, h: 30, kind: 'pillar' },
  ];

  const pedestals = [
    { id: 'diamond', kind: 'diamond', x: 480, y: 320, value: DIAMOND_VALUE, taken: false },
    { id: 'gold-west', kind: 'gold', x: 170, y: 130, value: GOLD_VALUE, taken: false },
    { id: 'gold-east', kind: 'gold', x: 790, y: 510, value: GOLD_VALUE, taken: false },
  ];

  // A pedestal is a small block the thief cannot walk through.
  const pedestalBlocks = pedestals.map((p) => ({ x: p.x - 13, y: p.y - 13, w: 26, h: 26 }));

  // Sight is blocked by the outer walls (as four slabs), the cover and the
  // pedestal blocks are low enough to see over, so they are not in this list.
  const wallSlabs = [
    { x: 0, y: 0, w: WORLD_W, h: WALL },
    { x: 0, y: WORLD_H - WALL, w: WORLD_W, h: WALL },
    { x: 0, y: 0, w: WALL, h: WORLD_H },
    { x: WORLD_W - WALL, y: 0, w: WALL, h: WORLD_H },
  ];
  const sightBlockers = [...wallSlabs, ...covers];
  const moveBlockers = [...covers, ...pedestalBlocks];

  // Three patrol routes: a north loop, a south loop, and a box patrol
  // around the diamond pedestal in the middle of the hall.
  const guardRoutes = [
    [
      { x: 180, y: 110 },
      { x: 780, y: 110 },
      { x: 780, y: 230 },
      { x: 180, y: 230 },
    ],
    [
      { x: 780, y: 530 },
      { x: 180, y: 530 },
      { x: 180, y: 410 },
      { x: 780, y: 410 },
    ],
    [
      { x: 340, y: 250 },
      { x: 620, y: 250 },
      { x: 620, y: 390 },
      { x: 340, y: 390 },
    ],
  ];

  // Two wall cameras: one over the north-west corner sweeping the top of
  // the hall, one over the south-east corner sweeping the bottom.
  const cameras = [
    { x: 40, y: 40, baseAngle: 0.65, sweep: 0.55, speed: 0.45, phase: randomRange(random, 0, 6) },
    { x: 920, y: 600, baseAngle: -2.25, sweep: 0.55, speed: 0.38, phase: randomRange(random, 0, 6) },
  ];

  return {
    seed,
    covers,
    pedestals,
    pedestalBlocks,
    sightBlockers,
    moveBlockers,
    guardRoutes,
    cameras,
    entry: { x: 70, y: 566 },
    exitZone: { x: WORLD_W - WALL - 26, y: 284, w: 26, h: 72 },
    // Patrol phase offsets, drawn from the seed so replays match.
    guardPhase: guardRoutes.map(() => randomRange(random, 0, 4)),
  };
}
