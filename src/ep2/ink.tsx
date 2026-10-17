import React from 'react';
import {useCurrentFrame} from 'remotion';
import {P, boilOf, clamp01, hash2} from './lib';

export type Pt = [number, number];

/* ---------------- point builders (all imperfect on purpose) ---------------- */

export const linePts = (a: Pt, b: Pt, n = 10, bow = 0, seed = 1): Pt[] => {
  const pts: Pt[] = [];
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const sag = bow + (hash2(seed, 9) - 0.5) * Math.min(6, len * 0.02);
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    const s = Math.sin(Math.PI * k) * sag;
    pts.push([a[0] + dx * k + nx * s, a[1] + dy * k + ny * s]);
  }
  return pts;
};

/** Hand-drawn ellipse: wobbly radius, random start, slight overshoot when open. */
export const ellipsePts = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  seed = 1,
  n = 28,
  overshoot = 0,
): Pt[] => {
  const pts: Pt[] = [];
  const a0 = hash2(seed, 1) * Math.PI * 2;
  const total = Math.PI * 2 * (1 + overshoot);
  const m = Math.round(n * (1 + overshoot));
  for (let i = 0; i <= m; i++) {
    const a = a0 + (total * i) / m;
    const wob = 1 + (hash2(seed, i % n) - 0.5) * 0.05 + (overshoot ? i / m * 0.04 : 0);
    pts.push([cx + Math.cos(a) * rx * wob, cy + Math.sin(a) * ry * wob]);
  }
  return pts;
};

/** Rounded-ish box with wobbly edges. */
export const rectPts = (x: number, y: number, w: number, h: number, seed = 1, r = 10): Pt[] => {
  const pts: Pt[] = [];
  const corners: Pt[] = [
    [x + r, y],
    [x + w - r, y],
    [x + w, y + r],
    [x + w, y + h - r],
    [x + w - r, y + h],
    [x + r, y + h],
    [x, y + h - r],
    [x, y + r],
  ];
  for (let i = 0; i < corners.length; i++) {
    const a = corners[i];
    const b = corners[(i + 1) % corners.length];
    const seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(1, Math.round(seg / 60));
    for (let j = 0; j < n; j++) {
      const k = j / n;
      const wob = (hash2(seed, i * 7 + j) - 0.5) * 3;
      pts.push([a[0] + (b[0] - a[0]) * k + wob, a[1] + (b[1] - a[1]) * k - wob]);
    }
  }
  return pts;
};

/** Jitter points for line boil. Each boil index is a different "drawing". */
export const boilPts = (pts: Pt[], seed: number, boil: number, amp = 1.3): Pt[] =>
  pts.map(([x, y], i) => [
    x + (hash2(seed * 3.1 + boil * 17.7, i) - 0.5) * 2 * amp,
    y + (hash2(seed * 5.7 + boil * 29.3, i + 101) - 0.5) * 2 * amp,
  ]);

/** Catmull-Rom spline through points -> SVG path. */
export const smoothPath = (pts: Pt[], closed = false): string => {
  if (pts.length < 2) return '';
  const p = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
  let d = `M${p[1][0].toFixed(1)},${p[1][1].toFixed(1)}`;
  for (let i = 1; i < p.length - 2; i++) {
    const [x0, y0] = p[i - 1];
    const [x1, y1] = p[i];
    const [x2, y2] = p[i + 1];
    const [x3, y3] = p[i + 2];
    d += `C${(x1 + (x2 - x0) / 6).toFixed(1)},${(y1 + (y2 - y0) / 6).toFixed(1)} ${(x2 - (x3 - x1) / 6).toFixed(1)},${(
      y2 -
      (y3 - y1) / 6
    ).toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
  }
  return closed ? d + 'Z' : d;
};

/** Resample a polyline densely so ribbons have smooth width changes. */
const resample = (pts: Pt[], step = 7): Pt[] => {
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(1, Math.ceil(seg / step));
    for (let j = 1; j <= n; j++) out.push([a[0] + ((b[0] - a[0]) * j) / n, a[1] + ((b[1] - a[1]) * j) / n]);
  }
  return out;
};

/** Truncate a polyline to fraction k of its length (draw-on). */
export const partial = (pts: Pt[], k: number): Pt[] => {
  if (k >= 1) return pts;
  if (k <= 0) return [pts[0]];
  const lens = [0];
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const target = lens[lens.length - 1] * k;
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (lens[i] <= target) out.push(pts[i]);
    else {
      const r = (target - lens[i - 1]) / (lens[i] - lens[i - 1] || 1);
      out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * r, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * r]);
      break;
    }
  }
  return out;
};

/** Ink ribbon: a filled outline whose width swells and tapers like a brush pen. */
export const ribbonPath = (raw: Pt[], w: number, seed: number, closed = false, taper = true): string => {
  const pts = resample(closed ? [...raw, raw[0]] : raw);
  if (pts.length < 2) return '';
  const L: Pt[] = [];
  const R: Pt[] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const k = i / (n - 1);
    const swell = 0.72 + 0.56 * hash2(seed, Math.floor(i / 5)) * 0.6 + 0.25 * Math.sin(k * Math.PI * 2 + seed);
    const tip = taper && !closed ? Math.min(1, Math.min(k, 1 - k) * 7 + 0.25) : 1;
    const hw = (w / 2) * swell * tip;
    L.push([pts[i][0] - (dy / len) * hw, pts[i][1] + (dx / len) * hw]);
    R.push([pts[i][0] + (dy / len) * hw, pts[i][1] - (dx / len) * hw]);
  }
  const outline = [...L, ...R.reverse()];
  return outline.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('') + 'Z';
};

/* ---------------- components ---------------- */

type ShapeProps = {
  pts: Pt[];
  closed?: boolean;
  fill?: string;
  ink?: string | null;
  w?: number;
  seed?: number;
  amp?: number;
  misreg?: number;
  draw?: number; // 0..1 draw-on for the outline
  fillOpacity?: number;
  style?: React.CSSProperties;
};

/**
 * One hand-inked shape: flat fill printed slightly off-register, ink outline as a
 * varying-width ribbon, both boiling on threes.
 */
export const Shape: React.FC<ShapeProps> = ({
  pts,
  closed = true,
  fill,
  ink = P.ink,
  w = 4.5,
  seed = 1,
  amp = 1.3,
  misreg = 3,
  draw = 1,
  fillOpacity = 1,
  style,
}) => {
  const frame = useCurrentFrame();
  const b = boilOf(frame);
  const jp = boilPts(pts, seed, b, amp);
  const mx = (hash2(seed, 77) - 0.5) * 2 * misreg;
  const my = (hash2(seed, 78) - 0.3) * 2 * misreg;
  return (
    <g style={style}>
      {fill && closed ? (
        <path d={smoothPath(boilPts(pts, seed + 50, b, amp * 0.6), true)} fill={fill} fillOpacity={fillOpacity * clamp01(draw * 1.5)} transform={`translate(${mx.toFixed(1)},${my.toFixed(1)})`} />
      ) : null}
      {ink && draw > 0.001 ? <path d={ribbonPath(partial(smoothPts(jp, closed), draw), w, seed, closed && draw >= 1)} fill={ink} /> : null}
    </g>
  );
};

/** Smooth control polygon into a dense polyline (so ribbons follow curves). */
export const smoothPts = (pts: Pt[], closed = false, sub = 4): Pt[] => {
  if (pts.length < 3) return pts;
  const p = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
  const out: Pt[] = [];
  for (let i = 1; i < p.length - 2; i++) {
    for (let s = 0; s < sub; s++) {
      const t = s / sub;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p[i - 1][0], p[i][0], p[i + 1][0], p[i + 2][0]), f(p[i - 1][1], p[i][1], p[i + 1][1], p[i + 2][1])]);
    }
  }
  out.push(closed ? p[p.length - 2] : p[p.length - 2]);
  return out;
};

/** Stroke only (lines, arrows, hatching). */
export const Stroke: React.FC<{pts: Pt[]; w?: number; color?: string; seed?: number; draw?: number; amp?: number; taper?: boolean}> = ({
  pts,
  w = 5,
  color = P.ink,
  seed = 3,
  draw = 1,
  amp = 1.2,
  taper = true,
}) => {
  const frame = useCurrentFrame();
  if (draw <= 0.001) return null;
  const jp = boilPts(pts, seed, boilOf(frame), amp);
  return <path d={ribbonPath(partial(smoothPts(jp), draw), w, seed, false, taper)} fill={color} />;
};

/** Hand-drawn circle around something; draws on with k, overshoots its start. */
export const CircleMark: React.FC<{cx: number; cy: number; rx: number; ry: number; k: number; color?: string; seed?: number; w?: number}> = ({
  cx,
  cy,
  rx,
  ry,
  k,
  color = P.coral,
  seed = 5,
  w = 7,
}) => <Stroke pts={ellipsePts(cx, cy, rx, ry, seed, 30, 0.18)} draw={k} color={color} seed={seed} w={w} />;

/** Wavy hand underline. */
export const Underline: React.FC<{x: number; y: number; len: number; k: number; color?: string; seed?: number; w?: number}> = ({
  x,
  y,
  len,
  k,
  color = P.coral,
  seed = 7,
  w = 7,
}) => {
  const pts: Pt[] = [];
  for (let i = 0; i <= 12; i++) pts.push([x + (len * i) / 12, y + Math.sin(i * 0.9 + seed) * 3 + i * 0.4]);
  return <Stroke pts={pts} draw={k} color={color} seed={seed} w={w} />;
};

/** Two-stroke cross-out (second stroke starts when the first is half done). */
export const CrossOut: React.FC<{x: number; y: number; w: number; h: number; k: number; color?: string; seed?: number; sw?: number}> = ({
  x,
  y,
  w,
  h,
  k,
  color = P.coral,
  seed = 11,
  sw = 9,
}) => (
  <g>
    <Stroke pts={linePts([x, y + h * 0.1], [x + w, y + h * 0.9], 8, 6, seed)} draw={clamp01(k * 2)} color={color} seed={seed} w={sw} />
    <Stroke pts={linePts([x + w * 0.96, y], [x + w * 0.04, y + h], 8, -5, seed + 1)} draw={clamp01(k * 2 - 0.8)} color={color} seed={seed + 1} w={sw} />
  </g>
);

/** Strike-through line across text. */
export const Strike: React.FC<{x: number; y: number; len: number; k: number; color?: string; seed?: number; sw?: number}> = ({
  x,
  y,
  len,
  k,
  color = P.coral,
  seed = 13,
  sw = 8,
}) => <Stroke pts={linePts([x - 6, y + 4], [x + len + 6, y - 6], 10, 3, seed)} draw={k} color={color} seed={seed} w={sw} />;

/** Hand arrow with a two-stroke head. */
export const Arrow: React.FC<{from: Pt; to: Pt; k: number; color?: string; seed?: number; bow?: number; w?: number}> = ({
  from,
  to,
  k,
  color = P.coral,
  seed = 17,
  bow = -30,
  w = 6,
}) => {
  const body = linePts(from, to, 14, bow, seed);
  const end = body[body.length - 1];
  const prev = body[body.length - 3];
  const ang = Math.atan2(end[1] - prev[1], end[0] - prev[0]);
  const hl = 26;
  const h1: Pt = [end[0] - Math.cos(ang - 0.5) * hl, end[1] - Math.sin(ang - 0.5) * hl];
  const h2: Pt = [end[0] - Math.cos(ang + 0.5) * hl, end[1] - Math.sin(ang + 0.5) * hl];
  const kh = clamp01((k - 0.8) / 0.2);
  return (
    <g>
      <Stroke pts={body} draw={clamp01(k / 0.8)} color={color} seed={seed} w={w} />
      <Stroke pts={[h1, end]} draw={kh} color={color} seed={seed + 2} w={w} />
      <Stroke pts={[h2, end]} draw={kh} color={color} seed={seed + 3} w={w} />
    </g>
  );
};

/** Hatch fill lines inside a box (shading, cliff face). */
export const Hatch: React.FC<{x: number; y: number; w: number; h: number; gap?: number; color?: string; seed?: number; sw?: number; opacity?: number}> = ({
  x,
  y,
  w,
  h,
  gap = 22,
  color = P.ink,
  seed = 19,
  sw = 2.5,
  opacity = 0.35,
}) => {
  const lines = [];
  for (let i = -h; i < w; i += gap) {
    const a: Pt = [x + i, y + h];
    const b: Pt = [x + i + h, y];
    lines.push(<Stroke key={i} pts={linePts(a, b, 4, 0, seed + i)} w={sw} color={color} seed={seed + i} taper={false} />);
  }
  return (
    <g opacity={opacity}>
      <clipPath id={`hatch${seed}`}>
        <rect x={x} y={y} width={w} height={h} />
      </clipPath>
      <g clipPath={`url(#hatch${seed})`}>{lines}</g>
    </g>
  );
};
