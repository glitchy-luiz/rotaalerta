import { Coord } from '../types';

const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;

export function haversineM(a: Coord, b: Coord): number {
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Distância (m) de um ponto até um segmento a-b, usando projeção plana local (suficiente p/ distâncias curtas). */
function distToSegmentM(p: Coord, a: Coord, b: Coord): number {
  const kx = 111320 * Math.cos(rad(p.latitude));
  const ky = 110540;
  const ax = (a.longitude - p.longitude) * kx;
  const ay = (a.latitude - p.latitude) * ky;
  const bx = (b.longitude - p.longitude) * kx;
  const by = (b.latitude - p.latitude) * ky;
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : -(ax * dx + ay * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(ax + t * dx, ay + t * dy);
}

/** Menor distância (m) entre um ponto e uma polilinha. */
export function distanceToPolylineM(p: Coord, coords: Coord[]): number {
  if (coords.length === 0) return Infinity;
  if (coords.length === 1) return haversineM(p, coords[0]);
  let min = Infinity;
  for (let i = 0; i < coords.length - 1; i++) {
    const d = distToSegmentM(p, coords[i], coords[i + 1]);
    if (d < min) min = d;
  }
  return min;
}

export function nearestIndex(p: Coord, coords: Coord[]): number {
  let best = 0;
  let min = Infinity;
  for (let i = 0; i < coords.length; i++) {
    const d = haversineM(p, coords[i]);
    if (d < min) {
      min = d;
      best = i;
    }
  }
  return best;
}

export function cumulativeDistances(coords: Coord[]): number[] {
  const out = [0];
  for (let i = 1; i < coords.length; i++) out.push(out[i - 1] + haversineM(coords[i - 1], coords[i]));
  return out;
}
