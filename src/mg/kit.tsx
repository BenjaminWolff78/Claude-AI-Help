import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Pt, ribbonPath, smoothPts, partial} from '../ep2/ink';
import {FONT, P, clamp01, easeIn, easeInOut, easeOut, hash2} from '../ep2/lib';
import {PencilG} from './pencil';

/* Penciled Out motion kit (shared by both episodes). Everything is a pure function of time.
   Shapes marked "Figma" were designed on the "Motion kit" page of the Figma file and exported as SVG. */

const W = 1920;
const H = 1080;
const g = 1500; // px/s^2 gravity for debris

/* ---------------- Figma assets ---------------- */

/** Paper scraps (Figma "Paper scraps", scrap1..6), each normalised to a ~1-unit box around 0,0. */
const SCRAPS: {d: string; w: number; h: number; fill: string}[] = [
  {d: 'M42.3 34.7L20.6 45.7L1.5 18.4L36.7 1.5L42.3 34.7Z', w: 44, h: 48, fill: '#EFE8D8'},
  {d: 'M73.3 40.2L42.2 49.5L1.5 31.8L17.4 1.5L52 6.8L73.3 40.2Z', w: 75, h: 51, fill: '#FBF8F1'},
  {d: 'M44.7 29.4L26.6 57.4L8.1 37.6L1.5 19.3L15.3 1.5L39.8 5L44.7 29.4Z', w: 47, h: 59, fill: '#F4D98F'},
  {d: 'M59.6 43.3L16.8 61.6L1.5 15L46.7 1.5L59.6 43.3Z', w: 62, h: 64, fill: '#EDB9CC'},
  {d: 'M49.7 30.6L16.3 44.9L1.5 26.2L9.4 3.1L33.6 1.5L49.7 30.6Z', w: 52, h: 47, fill: '#CFE5E0'},
  {d: 'M63.6 48.5L43.7 66.1L8.2 55.4L1.5 26.5L27.3 1.5L45.3 12.9L63.6 48.5Z', w: 66, h: 68, fill: '#FFFDF7'},
];

/** Graphite scribble wipe centreline (Figma "Scribble wipe", 1/3 scale, times 3). */
const SCRIBBLE: Pt[] = [
  [-46.7, -10.8], [335.3, 19.2], [687, 52.5], [339, 81.2], [-45.8, 117.6], [331.9, 144.1], [687, 179.7],
  [345.3, 214.8], [-50.9, 244.6], [345.4, 278.2], [686.2, 309.7], [344.7, 344.5], [-45.9, 371.7],
].map(([x, y]) => [x * 3, y * 3] as Pt);

/* ---------------- event FX ---------------- */

/** Paper scraps + ink specks thrown up from an impact at (x,y) at time t0. */
export const Burst: React.FC<{t: number; t0: number; x: number; y: number; n?: number; seed?: number; spread?: number; up?: number; life?: number; scale?: number; ink?: boolean}> = ({
  t,
  t0,
  x,
  y,
  n = 10,
  seed = 1,
  spread = 520,
  up = 620,
  life = 1.1,
  scale = 1,
  ink = true,
}) => {
  const d = t - t0;
  if (d < 0 || d > life) return null;
  const items = [];
  for (let i = 0; i < n; i++) {
    const a = hash2(seed, i);
    const b = hash2(seed + 7, i);
    const vx = (a - 0.5) * 2 * spread;
    const vy = -up * (0.45 + 0.55 * b);
    const px = x + vx * d;
    const py = y + vy * d + 0.5 * g * d * d;
    const rot = (a - 0.5) * 900 * d + b * 180;
    const fade = 1 - clamp01((d - life * 0.6) / (life * 0.4));
    if (ink && i % 3 === 2) {
      items.push(<circle key={i} cx={px} cy={py} r={(4 + b * 5) * scale} fill={P.ink} opacity={fade} />);
      continue;
    }
    const sc = SCRAPS[i % SCRAPS.length];
    const s = (0.45 + 0.5 * b) * scale;
    items.push(
      <g key={i} transform={`translate(${px.toFixed(1)},${py.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${s.toFixed(3)}) translate(${-sc.w / 2},${-sc.h / 2})`} opacity={fade}>
        <path d={sc.d} fill={sc.fill} stroke={P.ink} strokeWidth={3 / s} strokeLinejoin="round" />
      </g>,
    );
  }
  return <g>{items}</g>;
};

/** A soft dust puff that rolls outward along the ground from (x,y). */
export const Puff: React.FC<{t: number; t0: number; x: number; y: number; w?: number; seed?: number; life?: number; color?: string}> = ({
  t,
  t0,
  x,
  y,
  w = 300,
  seed = 3,
  life = 0.9,
  color = '#FBF8F1',
}) => {
  const d = t - t0;
  if (d < 0 || d > life) return null;
  const k = d / life;
  const e = easeOut(k);
  const items = [];
  for (let i = 0; i < 9; i++) {
    const side = i % 2 ? 1 : -1;
    const a = hash2(seed, i);
    const dx = side * (0.15 + 0.85 * ((i >> 1) / 4)) * w * 0.6 * e;
    const r = (18 + a * 22) * (0.5 + e) * (1 - 0.6 * k) * (w / 300);
    items.push(<circle key={i} cx={x + dx} cy={y - r * 0.5 - a * 12 * e} r={r} fill={color} stroke={P.inkSoft} strokeWidth={2} strokeOpacity={0.6} opacity={0.85 * (1 - k) * (1 - k)} />);
  }
  return <g>{items}</g>;
};

/** Hand-inked impact lines (Figma "Impact lines"): radiate from (x,y) for ~0.3 s. */
export const ImpactLines: React.FC<{t: number; t0: number; x: number; y: number; r?: number; color?: string; n?: number; arc?: number; seed?: number}> = ({
  t,
  t0,
  x,
  y,
  r = 120,
  color = P.ink,
  n = 7,
  arc = Math.PI,
  seed = 9,
}) => {
  const d = t - t0;
  if (d < 0 || d > 0.34) return null;
  const k = d / 0.34;
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 - arc / 2 + (arc * i) / Math.max(1, n - 1) + (hash2(seed, i) - 0.5) * 0.2;
    const r0 = r * (0.75 + 0.5 * easeOut(k));
    const r1 = r0 + r * 0.45 * (1 - k);
    out.push(
      <line key={i} x1={x + Math.cos(a) * r0} y1={y + Math.sin(a) * r0} x2={x + Math.cos(a) * r1} y2={y + Math.sin(a) * r1} stroke={color} strokeWidth={7} strokeLinecap="round" />,
    );
  }
  return <g>{out}</g>;
};

/** Water droplets from a splash at (x,y). */
export const Splash: React.FC<{t: number; t0: number; x: number; y: number; n?: number; seed?: number; color?: string; s?: number}> = ({
  t,
  t0,
  x,
  y,
  n = 7,
  seed = 5,
  color = P.water,
  s = 1,
}) => {
  const d = t - t0;
  if (d < 0 || d > 0.7) return null;
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = hash2(seed, i);
    const vx = (a - 0.5) * 360 * s;
    const vy = -(240 + hash2(seed + 3, i) * 260) * s;
    const px = x + vx * d;
    const py = y + vy * d + 0.5 * 1800 * d * d;
    const r = (6 + a * 6) * s * (1 - d / 0.9);
    out.push(<ellipse key={i} cx={px} cy={py} rx={r} ry={r * 1.25} fill={color} stroke={P.ink} strokeWidth={2.5} />);
  }
  return <g>{out}</g>;
};

/** Pebbles crumbling off an edge at (x,y), falling `fall` px. */
export const Pebbles: React.FC<{t: number; t0: number; x: number; y: number; n?: number; seed?: number; fall?: number}> = ({t, t0, x, y, n = 6, seed = 7, fall = 420}) => {
  const out = [];
  for (let i = 0; i < n; i++) {
    const d = t - t0 - i * 0.11;
    if (d < 0) continue;
    const a = hash2(seed, i);
    const py = y + 0.5 * 1800 * d * d;
    if (py > y + fall) continue;
    const px = x + (a - 0.3) * 40 + d * (40 + a * 60);
    const r = 6 + a * 9;
    out.push(<ellipse key={i} cx={px} cy={py} rx={r} ry={r * 0.8} fill={P.earthDark} stroke={P.ink} strokeWidth={3} transform={`rotate(${d * 300} ${px} ${py})`} />);
  }
  return <g>{out}</g>;
};

/** Squash-and-stretch scale for something that lands at t0 (1 = rest). */
export const landSquash = (t: number, t0: number, amt = 0.12): [number, number] => {
  const d = t - t0;
  if (d < 0 || d > 0.4) return [1, 1];
  const k = Math.sin((d / 0.4) * Math.PI) * Math.exp(-d * 6);
  return [1 + amt * k, 1 - amt * k];
};

/* ---------------- odometer numbers ---------------- */

/**
 * Number whose digit wheels roll into place like an adding machine: `from` -> `to` as k goes 0..1.
 * The right-most wheel spins continuously; each wheel to its left turns only as the one beside it wraps.
 * `fmt` builds the final string (commas, decimals, $, units); only its digits roll.
 */
export const Odo: React.FC<{
  x: number;
  y: number;
  size: number;
  from: number;
  to: number;
  k: number;
  fmt?: (v: number) => string;
  color?: string;
  weight?: number;
  align?: 'left' | 'center' | 'right';
  riso?: string | null;
  qa?: string;
  rot?: number;
}> = ({x, y, size, from, to, k, fmt, color = P.ink, weight = 800, align = 'left', riso = null, qa, rot = 0}) => {
  if (k <= 0) return null;
  const f = fmt ?? ((v: number) => '$' + Math.round(v).toLocaleString('en-US'));
  const target = f(to);
  const chars = Array.from(target);
  const dot = target.indexOf('.');
  const dec = dot >= 0 ? Array.from(target.slice(dot + 1)).filter((c) => /\d/.test(c)).length : 0;
  const e = easeOut(clamp01(k));
  const v = (from + (to - from) * e) * Math.pow(10, dec);
  const nd = chars.filter((c) => /\d/.test(c)).length;
  let di = 0;
  const lh = size * 1.12;
  const tx = align === 'left' ? '0%' : align === 'center' ? '-50%' : '-100%';
  return (
    <div
      data-qa={qa ? `text:${qa}` : undefined}
      data-qa-type={qa ? 'text' : undefined}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(${tx},0) rotate(${rot}deg)`,
        fontFamily: FONT,
        fontSize: size,
        fontWeight: weight,
        fontVariationSettings: `"INFM" 60, "BNCE" 30`,
        color,
        lineHeight: 1.12,
        whiteSpace: 'nowrap',
        textShadow: riso ? `${(size * 0.05).toFixed(1)}px ${(size * 0.05).toFixed(1)}px 0 ${riso}` : undefined,
        display: 'flex',
      }}
    >
      {chars.map((c, i) => {
        if (!/\d/.test(c)) return <span key={i} style={{whiteSpace: 'pre'}}>{c}</span>;
        const col = nd - 1 - di++;
        let wheel: number;
        if (k >= 1) wheel = Number(c);
        else {
          const q = v / Math.pow(10, col);
          const whole = Math.floor(q);
          const r = q - whole;
          wheel = col === 0 ? q % 10 : (whole % 10) + clamp01((r - 0.9) / 0.1);
          if (whole === 0 && r < 0.9 && col > 0) {
            return <span key={i} style={{display: 'inline-block', visibility: 'hidden'}}>{c}</span>;
          }
        }
        const lo = Math.floor(wheel) % 10;
        const frac = wheel - Math.floor(wheel);
        return (
          <span key={i} style={{display: 'inline-block', position: 'relative', height: lh, overflow: 'hidden', verticalAlign: 'top'}}>
            <span style={{visibility: 'hidden'}}>{c}</span>
            {[0, 1].map((j) => (
              <span key={j} style={{position: 'absolute', left: 0, top: 0, transform: `translateY(${((j - frac) * lh).toFixed(1)}px)`}}>
                {String((lo + j) % 10)}
              </span>
            ))}
          </span>
        );
      })}
    </div>
  );
};

/* ---------------- transitions between scenes ---------------- */

/** Clip polygon (CSS) for a page turn: the new page is revealed behind a fold sweeping from the bottom-right corner. */
const foldLine = (k: number): [Pt, Pt] => {
  // fold line perpendicular to the diagonal, travelling from the bottom-right corner to beyond the top-left
  const d = (W + H) * 1.05 * easeInOut(clamp01(k));
  // points where x + y*0.95 = (W + H) - d ... use a 30 deg tilt
  const c = W + H * 0.9 - d;
  return [
    [c, 0],
    [c - H * 0.9, H],
  ];
};

export const pageTurnClip = (k: number): string => {
  const [a, b] = foldLine(k);
  return `polygon(${a[0]}px ${a[1]}px, ${W + 400}px -10px, ${W + 400}px ${H + 10}px, ${b[0]}px ${b[1]}px)`;
};

/** The curled-over back of the old page (drawn on top during a page turn). */
export const PageCurl: React.FC<{k: number}> = ({k}) => {
  if (k <= 0 || k >= 1) return null;
  const [a, b] = foldLine(k);
  // the flap is the region beyond the fold mirrored back: approximate with a strip of width w
  const wFlap = 120 + 260 * Math.sin(Math.PI * clamp01(k));
  const nx = -0.67; // fold normal (pointing towards the old page)
  const ny = -0.74;
  const a2: Pt = [a[0] + nx * wFlap, a[1] + ny * wFlap];
  const b2: Pt = [b[0] + nx * wFlap * 0.9, b[1] + ny * wFlap * 0.9];
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible'}}>
      <defs>
        <linearGradient id="curlG" x1={a[0]} y1={a[1]} x2={a2[0]} y2={a2[1]} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#D8CCB2" />
          <stop offset="0.55" stopColor="#FBF7EC" />
          <stop offset="1" stopColor="#EDE4CF" />
        </linearGradient>
      </defs>
      <polygon points={`${a[0] + 26},${a[1]} ${b[0] + 26},${b[1]} ${b[0] + 60},${b[1]} ${a[0] + 60},${a[1]}`} fill="rgba(42,36,32,0.18)" />
      <polygon points={`${a[0]},${a[1]} ${b[0]},${b[1]} ${b2[0]},${b2[1]} ${a2[0]},${a2[1]}`} fill="url(#curlG)" stroke={P.ink} strokeWidth={4} strokeLinejoin="round" />
    </svg>
  );
};

/** Ribbon path of the graphite scribble drawn up to k (frame coords), as an SVG path string. */
export const scribblePath = (k: number, w = 330): string => {
  const pts = partial(smoothPts(SCRIBBLE, false, 6), clamp01(k));
  return ribbonPath(pts, w, 77, false, false);
};

/** Pencil that rides the scribble tip (for the wipe). */
export const ScribblePencil: React.FC<{k: number}> = ({k}) => {
  const frame = useCurrentFrame();
  if (k <= 0 || k >= 1) return null;
  const pts = partial(smoothPts(SCRIBBLE, false, 6), clamp01(k));
  const tip = pts[pts.length - 1];
  const lift = k < 0.06 ? 1 - k / 0.06 : k > 0.94 ? (k - 0.94) / 0.06 : 0;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible'}}>
      <PencilG x={tip[0]} y={tip[1]} rot={-58} L={720} frame={frame} lift={lift} />
    </svg>
  );
};

/** Graphite texture over the freshly scribbled region (fades as the new page settles). */
export const ScribbleTone: React.FC<{k: number}> = ({k}) => {
  if (k <= 0 || k >= 1) return null;
  const op = 0.55 * (1 - clamp01((k - 0.55) / 0.45));
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <path d={scribblePath(k, 330)} fill="#4A413A" opacity={op} />
    </svg>
  );
};

export const _kit = [easeIn, AbsoluteFill];
