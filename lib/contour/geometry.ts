/**
 * Geometry for the contour language.
 *
 * Every drawing in direction C is built from three shapes:
 *   - a ring of context around a person (an irregular closed contour),
 *   - a frame of context around a role (a rounded square, after the logo),
 *   - a connection between the two (a soft cubic curve).
 *
 * Coordinates are rounded so the server and every browser engine produce the
 * same path strings — nothing here can cause a hydration mismatch.
 */

export const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Deterministic noise in [0,1). The same seed draws the same terrain.
 * Quantised, because Math.sin is not bit-identical across JavaScript engines
 * and the server's drawing has to match the browser's exactly.
 */
export function noise(i: number, salt = 1): number {
  const x = Math.sin((i + 1) * 127.1 * salt + salt * 311.7) * 43758.5453;
  return Math.round((x - Math.floor(x)) * 1e5) / 1e5;
}

/** A percentage string for positioning HTML over a drawing. */
export const pct = (n: number, of: number) => `${((n / of) * 100).toFixed(2)}%`;

type Point = [number, number];

/** Catmull-Rom through closed points, emitted as cubic Béziers. */
function smoothClosed(points: Point[]): string {
  const n = points.length;
  let d = `M${round(points[0][0])} ${round(points[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${round(c1x)} ${round(c1y)} ${round(c2x)} ${round(c2y)} ${round(p2[0])} ${round(p2[1])}`;
  }
  return `${d}Z`;
}

/**
 * One contour around a point. `wobble` is how uneven the terrain is; rings
 * from the same seed share their unevenness, so a set reads as one landform.
 */
export function ring(
  cx: number,
  cy: number,
  r: number,
  seed = 1,
  wobble = 0.09,
  stretch: [number, number] = [1, 1],
): string {
  const steps = 36;
  const a1 = noise(seed, 3) * Math.PI * 2;
  const a2 = noise(seed, 5) * Math.PI * 2;
  const a3 = noise(seed, 7) * Math.PI * 2;
  const pts: Point[] = [];
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const k =
      1 +
      wobble * (0.55 * Math.sin(2 * t + a1) + 0.3 * Math.sin(3 * t + a2) + 0.15 * Math.sin(5 * t + a3));
    pts.push([cx + Math.cos(t) * r * k * stretch[0], cy + Math.sin(t) * r * k * stretch[1]]);
  }
  return smoothClosed(pts);
}

/** A rounded-square frame — the logo's frame, used for roles and companies. */
export function frame(cx: number, cy: number, half: number, exponent = 4): string {
  const steps = 48;
  const pts: Point[] = [];
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const x = Math.sign(c) * Math.pow(Math.abs(c), 2 / exponent);
    const y = Math.sign(s) * Math.pow(Math.abs(s), 2 / exponent);
    pts.push([cx + x * half, cy + y * half]);
  }
  return smoothClosed(pts);
}

/** A soft connection. `bend` lifts the curve off the straight line. */
export function link(x1: number, y1: number, x2: number, y2: number, bend = 0.25): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const mx = x1 + dx / 2;
  const my = y1 + dy / 2;
  // Perpendicular offset for the control points.
  const nx = -dy * bend;
  const ny = dx * bend;
  return `M${round(x1)} ${round(y1)}C${round(x1 + dx * 0.25 + nx)} ${round(y1 + dy * 0.25 + ny)} ${round(
    mx + dx * 0.25 + nx * 0.4,
  )} ${round(my + dy * 0.25 + ny * 0.4)} ${round(x2)} ${round(y2)}`;
}

/** A horizontal S-curve, for left-to-right flows such as role → person. */
export function flow(x1: number, y1: number, x2: number, y2: number, pull = 0.5): string {
  const dx = (x2 - x1) * pull;
  return `M${round(x1)} ${round(y1)}C${round(x1 + dx)} ${round(y1)} ${round(x2 - dx)} ${round(y2)} ${round(x2)} ${round(y2)}`;
}
