// A tiny seeded random number generator (mulberry32). The level and the
// patrol phase offsets are drawn from it, so a given seed always builds the
// same hall and the same staged screenshot scenes.

export function makeRandom(seed) {
  let state = (seed >>> 0) || 1;
  return function nextRandom() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A random float in [min, max) drawn from the generator above.
export function randomRange(nextRandom, min, max) {
  return min + nextRandom() * (max - min);
}
