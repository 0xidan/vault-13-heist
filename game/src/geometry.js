// Small 2D geometry helpers: distances, angles, segment intersection and
// circle-versus-rectangle tests. Rectangles are { x, y, w, h } with (x, y)
// the top-left corner; points are { x, y }.

export function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

// The smallest signed difference from angle `from` to angle `to`, in
// (-PI, PI]. Used everywhere facing directions are compared.
export function angleDifference(from, to) {
  let diff = (to - from) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

// Turn `facing` toward `target` by at most `maxStep` radians.
export function turnToward(facing, target, maxStep) {
  const diff = angleDifference(facing, target);
  if (Math.abs(diff) <= maxStep) return target;
  return facing + Math.sign(diff) * maxStep;
}

function cross(ax, ay, bx, by) {
  return ax * by - ay * bx;
}

// Do segments p1-p2 and p3-p4 touch or cross?
export function segmentsIntersect(p1, p2, p3, p4) {
  const d1 = cross(p4.x - p3.x, p4.y - p3.y, p1.x - p3.x, p1.y - p3.y);
  const d2 = cross(p4.x - p3.x, p4.y - p3.y, p2.x - p3.x, p2.y - p3.y);
  const d3 = cross(p2.x - p1.x, p2.y - p1.y, p3.x - p1.x, p3.y - p1.y);
  const d4 = cross(p2.x - p1.x, p2.y - p1.y, p4.x - p1.x, p4.y - p1.y);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

// Does the segment (x1,y1)-(x2,y2) touch or cross this rectangle?
export function segmentHitsRect(x1, y1, x2, y2, rect) {
  if (pointInRect(x1, y1, rect) || pointInRect(x2, y2, rect)) return true;
  const a = { x: x1, y: y1 };
  const b = { x: x2, y: y2 };
  const corners = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.w, y: rect.y },
    { x: rect.x + rect.w, y: rect.y + rect.h },
    { x: rect.x, y: rect.y + rect.h },
  ];
  for (let i = 0; i < 4; i++) {
    if (segmentsIntersect(a, b, corners[i], corners[(i + 1) % 4])) return true;
  }
  return false;
}

// Where does the ray from (x, y) toward `angle` first meet this rectangle?
// Returns the distance along the ray, or Infinity when it never meets it.
export function rayHitDistance(x, y, angle, rect) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let tMin = 0;
  let tMax = Infinity;
  if (Math.abs(dx) < 1e-9) {
    if (x < rect.x || x > rect.x + rect.w) return Infinity;
  } else {
    let t1 = (rect.x - x) / dx;
    let t2 = (rect.x + rect.w - x) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
  }
  if (Math.abs(dy) < 1e-9) {
    if (y < rect.y || y > rect.y + rect.h) return Infinity;
  } else {
    let t1 = (rect.y - y) / dy;
    let t2 = (rect.y + rect.h - y) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
  }
  if (tMax < tMin || tMax < 0) return Infinity;
  return tMin >= 0 ? tMin : tMax;
}

// Is the circle at (x, y) with radius r overlapping this rectangle?
export function circleHitsRect(x, y, r, rect) {
  const nearX = clamp(x, rect.x, rect.x + rect.w);
  const nearY = clamp(y, rect.y, rect.y + rect.h);
  return distance(x, y, nearX, nearY) < r;
}
