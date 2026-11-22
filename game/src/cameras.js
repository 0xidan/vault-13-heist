// Security cameras. A camera is fixed to a wall and swings its gaze back
// and forth on a slow sine; its state is plain data, like the guards'.

import { CAMERA_SIGHT_HALF_ANGLE, CAMERA_SIGHT_RANGE } from './config.js';

export function createCamera(spec) {
  return {
    x: spec.x,
    y: spec.y,
    baseAngle: spec.baseAngle,
    sweep: spec.sweep,
    speed: spec.speed,
    phase: spec.phase,
    facing: spec.baseAngle,
    range: CAMERA_SIGHT_RANGE,
    halfAngle: CAMERA_SIGHT_HALF_ANGLE,
    seesThief: false,
  };
}

// `time` is the game's own clock, so a replay with the same inputs sweeps
// the cameras through exactly the same angles.
export function updateCamera(camera, time) {
  camera.facing = camera.baseAngle + Math.sin(time * camera.speed + camera.phase) * camera.sweep;
}
