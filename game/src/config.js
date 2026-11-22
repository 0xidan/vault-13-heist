// VAULT 13 — shared tuning constants: canvas size, speeds, vision ranges,
// alarm rates and loot values. Everything else reads its numbers from here.

// The canvas is a HUD band on top of the vault hall; the world itself is
// WORLD_W by WORLD_H and is drawn below the band.
export const HUD_H = 64;
export const WORLD_W = 960;
export const WORLD_H = 640;
export const CANVAS_W = WORLD_W;
export const CANVAS_H = HUD_H + WORLD_H;

export const WALL = 24; // thickness of the hall's outer walls

export const THIEF_RADIUS = 11;
export const THIEF_WALK_SPEED = 152; // px per second
export const THIEF_SNEAK_SPEED = 80;

export const GUARD_RADIUS = 12;
export const GUARD_SPEED = 58;
export const GUARD_PAUSE_SECONDS = 1.5;
export const GUARD_SWEEP_RADIANS = 0.85; // half-amplitude of the pause sweep
export const GUARD_SWEEP_SPEED = 1.4;

export const GUARD_SIGHT_RANGE = 155;
export const GUARD_SIGHT_HALF_ANGLE = 0.56; // ~32 degrees
export const CAMERA_SIGHT_RANGE = 175;
export const CAMERA_SIGHT_HALF_ANGLE = 0.42; // ~24 degrees

// Alarm fills per second while the thief is seen (sneaking is quieter and
// fills it more slowly) and drains per second while nobody sees him.
export const ALARM_FROM_GUARD = 36;
export const ALARM_FROM_GUARD_SNEAKING = 20;
export const ALARM_FROM_CAMERA = 24;
export const ALARM_FROM_CAMERA_SNEAKING = 14;
export const ALARM_DECAY = 7;
export const ALARM_CAUGHT = 100;

export const TOUCH_CAUGHT_DISTANCE = GUARD_RADIUS + THIEF_RADIUS - 2;

export const COINS_PER_RUN = 3;
export const COIN_FLIGHT_SECONDS = 0.35;
export const COIN_DISTRACT_RADIUS = 200;
export const COIN_DISTRACT_SECONDS = 2.6;

export const PICKUP_DISTANCE = 32; // walk this close to a pedestal to take its loot

export const DIAMOND_VALUE = 1000;
export const GOLD_VALUE = 250;
