// Vision: line of sight and vision cones. A cone is a fan of rays cast
// against the sight-blocking rectangles; the fan's outline is the polygon
// the renderer fills. Detection asks the simpler question — is the target
// inside the range and the angle, with a clear line of sight?

import { angleDifference, distance, rayHitDistance, segmentHitsRect } from './geometry.js';

// True when nothing sight-blocking stands between the two points.
export function lineOfSightClear(x1, y1, x2, y2, blockers) {
  for (const rect of blockers) {
    if (segmentHitsRect(x1, y1, x2, y2, rect)) return false;
  }
  return true;
}

// Can an observer at (eyeX, eyeY) facing `facing`, with the given half
// angle and range, see the target point?
export function canSee(eyeX, eyeY, facing, halfAngle, range, targetX, targetY, blockers) {
  const dist = distance(eyeX, eyeY, targetX, targetY);
  if (dist > range) return false;
  if (dist > 0.001) {
    const toward = Math.atan2(targetY - eyeY, targetX - eyeX);
    if (Math.abs(angleDifference(facing, toward)) > halfAngle) return false;
  }
  return lineOfSightClear(eyeX, eyeY, targetX, targetY, blockers);
}

// The visible outline of a vision cone: the observer's position plus one
// point per ray, each ray stopped by the nearest blocker or by the range.
export function visionConePolygon(eyeX, eyeY, facing, halfAngle, range, blockers) {
  const rays = 26;
  const points = [{ x: eyeX, y: eyeY }];
  for (let i = 0; i <= rays; i++) {
    const angle = facing - halfAngle + (2 * halfAngle * i) / rays;
    let reach = range;
    for (const rect of blockers) {
      const hit = rayHitDistance(eyeX, eyeY, angle, rect);
      if (hit < reach) reach = hit;
    }
    points.push({ x: eyeX + Math.cos(angle) * reach, y: eyeY + Math.sin(angle) * reach });
  }
  return points;
}
