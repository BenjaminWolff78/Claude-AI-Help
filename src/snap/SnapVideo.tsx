import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {CLAMP, FIST, MEDAL, POT} from './assets';
import {BP, DUR, FONT, FPS, H, MONO, SUB, W, WORDS, WT, clamp01, clampT, easeIn, easeInOut, easeOut, hash, lerp, twos} from './lib';
import SIM from './sim.json';

/* ------------------------------------------------------------------ fonts */
const FACE = `@font-face{font-family:"Adventor BP";src:url(${staticFile('fonts/texgyreadventor-bold.otf')}) format("opentype");font-weight:700;font-display:block;}
@font-face{font-family:"LM Mono BP";src:url(${staticFile('fonts/lmmonolt10-bold.otf')}) format("opentype");font-weight:700;font-display:block;}`;
const Fonts: React.FC = () => {
  const [h] = useState(() => delayRender('bp-fonts'));
  useEffect(() => {
    Promise.all([document.fonts.load(`700 60px "Adventor BP"`), document.fonts.load(`700 60px "LM Mono BP"`)]).then(() => continueRender(h));
  }, [h]);
  return <style>{FACE}</style>;
};

/* ------------------------------------------------------------------ simulation data (studio/snap/rod.py) */
type Run = {dynT: number[]; dyn: number[][]; breaks: [number, number][]; load?: number[][]; loadT?: number[]};
const SD = SIM as unknown as {N: number; plain: Run; twist: Run};
const N = SD.N;
const PL = SD.plain;
const TW = SD.twist;
const mix = (A: number[], B: number[], k: number) => A.map((a, i) => a + (B[i] - a) * k);
/** quasi-static bending, u = 0 straight .. 1 the instant before it cracks */
const loadPos = (u: number) => {
  const L = PL.load!;
  const f = clamp01(u) * (L.length - 1);
  const i = Math.min(L.length - 2, Math.floor(f));
  return mix(L[i], L[i + 1], f - i);
};
const dynPos = (R: Run, ms: number) => {
  const T = R.dynT;
  if (ms <= 0) return R.dyn[0];
  if (ms >= T[T.length - 1]) return R.dyn[T.length - 1];
  let lo = 0;
  let hi = T.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (T[m] <= ms) lo = m;
    else hi = m;
  }
  return mix(R.dyn[lo], R.dyn[hi], (ms - T[lo]) / (T[hi] - T[lo]));
};
const brokenAt = (R: Run, ms: number) => R.breaks.filter((b) => b[0] <= ms + 1e-9).map((b) => b[1]);
const TH_C = 0.0195; // breaking turning angle used in the simulation

/** piecewise-linear map of t through [[t, v], ...] */
const pw = (t: number, pts: [number, number][]) => {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, va] = pts[i];
    const [b, vb] = pts[i + 1];
    if (t <= b) return lerp(va, vb, (t - a) / (b - a));
  }
  return pts[pts.length - 1][1];
};

type Pt = [number, number];
const toWorld = (pos: number[], x0: number, y0: number, S: number): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i < N; i++) out.push([x0 + (pos[2 * i] - 0.5) * S, y0 - pos[2 * i + 1] * S]);
  return out;
};
const splitPieces = (pts: Pt[], broken: number[]) => {
  const cuts = [...broken].sort((a, b) => a - b);
  const out: {pts: Pt[]; i0: number}[] = [];
  let s = 0;
  for (const c of cuts) {
    out.push({pts: pts.slice(s, c + 1), i0: s});
    s = c + 1;
  }
  out.push({pts: pts.slice(s), i0: s});
  return out;
};
const poly = (p: Pt[]) => p.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ');

/* ------------------------------------------------------------------ drawing helpers */
/** a stroke that draws itself on between t0 and t1 */
const Draw: React.FC<{d: string; t: number; t0: number; dur?: number; w?: number; c?: string; dash?: string; fill?: string; op?: number}> = ({d, t, t0, dur = 0.6, w = 3, c = BP.line, dash, fill = 'none', op = 1}) => {
  const k = easeInOut(clampT(t, t0, t0 + dur));
  if (k <= 0) return null;
  return (
    <path
      d={d}
      pathLength={1}
      fill={k >= 1 ? fill : 'none'}
      stroke={c}
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dash ? undefined : '1 1'}
      strokeDashoffset={dash ? undefined : 1 - k}
      style={dash ? {strokeDasharray: dash} : undefined}
      opacity={op}
    />
  );
};
const Label: React.FC<{x: number; y: number; t: number; t0: number; text: string; size?: number; anchor?: 'start' | 'middle' | 'end'; c?: string; mono?: boolean; rot?: number; t1?: number}> = ({x, y, t, t0, text, size = 40, anchor = 'start', c = BP.line, mono, rot = 0, t1 = 1e9}) => {
  if (t < t0 || t > t1) return null;
  // lettered on one character at a time, like a draftsman with a template
  const n = Math.ceil(text.length * clampT(t, t0, t0 + Math.min(0.6, 0.035 * text.length)));
  return (
    <text x={x} y={y} fontFamily={mono ? MONO : FONT} fontWeight={700} fontSize={size} fill={c} textAnchor={anchor} letterSpacing={mono ? 0 : 1.5} transform={rot ? `rotate(${rot} ${x} ${y})` : undefined}>
      {text.slice(0, n)}
    </text>
  );
};
/** dimension line with arrowheads and a label in a gap */
const Dim: React.FC<{x1: number; y1: number; x2: number; y2: number; t: number; t0: number; text: string; size?: number; c?: string}> = ({x1, y1, x2, y2, t, t0, text, size = 34, c = BP.line}) => {
  const k = easeOut(clampT(t, t0, t0 + 0.5));
  if (k <= 0) return null;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const ax = lerp(mx, x1, k);
  const ay = lerp(my, y1, k);
  const bx = lerp(mx, x2, k);
  const by = lerp(my, y2, k);
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const head = (x: number, y: number, a: number) => `M${x} ${y} L${x + 18 * Math.cos(a + 0.35)} ${y + 18 * Math.sin(a + 0.35)} M${x} ${y} L${x + 18 * Math.cos(a - 0.35)} ${y + 18 * Math.sin(a - 0.35)}`;
  return (
    <g stroke={c} strokeWidth={2.5} fill="none" strokeLinecap="round">
      <path d={`M${ax} ${ay} L${bx} ${by}`} />
      <path d={head(ax, ay, ang) + head(bx, by, ang + Math.PI)} />
      <path d={`M${x1} ${y1 - 22} L${x1} ${y1 + 22} M${x2} ${y2 - 22} L${x2} ${y2 + 22}`} opacity={k} />
      {k > 0.6 && (
        <g>
          <rect x={mx - text.length * size * 0.32 - 12} y={my - size * 0.62} width={text.length * size * 0.64 + 24} height={size * 1.15} fill={BP.paper} stroke="none" />
          <text x={mx} y={my + size * 0.34} fill={c} stroke="none" fontFamily={MONO} fontWeight={700} fontSize={size} textAnchor="middle">
            {text}
          </text>
        </g>
      )}
    </g>
  );
};
/** circled callout number, drawn on with a compass flourish */
const Num: React.FC<{x: number; y: number; n: string; t: number; t0: number; r?: number; c?: string}> = ({x, y, n, t, t0, r = 34, c = BP.line}) => {
  const k = easeOut(clampT(t, t0, t0 + 0.35));
  if (k <= 0) return null;
  const s = lerp(1.8, 1, k);
  return (
    <g transform={`translate(${x} ${y}) scale(${s.toFixed(3)})`}>
      <circle r={r} fill={BP.paper} stroke={c} strokeWidth={3.5} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k} />
      <text y={r * 0.42} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={r * 1.2} fill={c} opacity={k}>
        {n}
      </text>
    </g>
  );
};

/* ------------------------------------------------------------------ the stick */
const PASTA_W = 20;
const Stick: React.FC<{pts: Pt[]; twist?: (s: number) => number; stripeOp?: number}> = ({pts, twist, stripeOp = 0}) => {
  if (pts.length < 2) return null;
  // helical stripe: a white line weaving across the stick; its phase carries the twist
  let stripe: string | null = null;
  if (twist && stripeOp > 0) {
    const s: Pt[] = [];
    let acc = 0;
    for (let i = 0; i < pts.length; i++) {
      if (i) acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      const a = i < pts.length - 1 ? pts[i + 1] : pts[i];
      const b = i < pts.length - 1 ? pts[i] : pts[i - 1];
      const tx = a[0] - b[0];
      const ty = a[1] - b[1];
      const l = Math.hypot(tx, ty) || 1;
      const nx = -ty / l;
      const ny = tx / l;
      const ph = twist(acc);
      const off = Math.sin(ph) * PASTA_W * 0.36;
      s.push([pts[i][0] + nx * off, pts[i][1] + ny * off]);
    }
    stripe = poly(s);
  }
  return (
    <g>
      <polyline points={poly(pts)} fill="none" stroke={BP.paperDeep} strokeWidth={PASTA_W + 10} strokeLinecap="round" strokeLinejoin="round" opacity={0.5} transform="translate(8 10)" />
      <polyline points={poly(pts)} fill="none" stroke={BP.line} strokeWidth={PASTA_W + 5} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={poly(pts)} fill="none" stroke={BP.pasta} strokeWidth={PASTA_W} strokeLinecap="round" strokeLinejoin="round" />
      {stripe && <polyline points={stripe} fill="none" stroke={BP.pastaDark} strokeWidth={4} strokeLinecap="round" opacity={stripeOp} />}
    </g>
  );
};
/** curvature comb: a whisker per node, length proportional to how hard the stick is bent there */
const Comb: React.FC<{pieces: {pts: Pt[]}[]; scale: number; op: number; limit?: number}> = ({pieces, scale, op, limit = 0}) => {
  if (op <= 0) return null;
  const lines: string[] = [];
  const tips: string[] = [];
  const lims: string[] = [];
  for (const p of pieces) {
    const P = p.pts;
    const tp: Pt[] = [];
    const lp: Pt[] = [];
    // turning angle per node, smoothed over 9 nodes (the stored positions are rounded, so raw angles are noisy)
    const raw: number[] = P.map((_, i) => {
      if (i === 0 || i === P.length - 1) return 0;
      const e0 = [P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]];
      const e1 = [P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]];
      return Math.atan2(e0[0] * e1[1] - e0[1] * e1[0], e0[0] * e1[0] + e0[1] * e1[1]);
    });
    const sm = raw.map((_, i) => {
      let a = 0;
      let n = 0;
      for (let j = Math.max(1, i - 4); j <= Math.min(P.length - 2, i + 4); j++) {
        a += raw[j];
        n++;
      }
      return n ? a / n : 0;
    });
    for (let i = 1; i < P.length - 1; i++) {
      const th = sm[i];
      const tx = P[i + 1][0] - P[i - 1][0];
      const ty = P[i + 1][1] - P[i - 1][1];
      const l = Math.hypot(tx, ty) || 1;
      // whiskers point away from the centre of curvature (outside of the bend)
      const nx = ty / l;
      const ny = -tx / l;
      const len = Math.max(-340, Math.min(340, th * scale));
      const q: Pt = [P[i][0] + nx * len, P[i][1] + ny * len];
      if (i % 3 === 0) lines.push(`M${P[i][0].toFixed(1)} ${P[i][1].toFixed(1)} L${q[0].toFixed(1)} ${q[1].toFixed(1)}`);
      tp.push(q);
      if (limit) lp.push([P[i][0] + nx * Math.sign(th || 1) * TH_C * scale, P[i][1] + ny * Math.sign(th || 1) * TH_C * scale]);
    }
    tips.push(poly(tp));
    if (limit) lims.push(poly(lp));
  }
  return (
    <g opacity={op}>
      <path d={lines.join(' ')} stroke={BP.pasta} strokeWidth={2} opacity={0.75} />
      {tips.map((d, i) => (
        <polyline key={i} points={d} fill="none" stroke={BP.pasta} strokeWidth={3.5} strokeLinejoin="round" />
      ))}
      {limit > 0 &&
        lims.map((d, i) => (
          <polyline key={`l${i}`} points={d} fill="none" stroke={BP.red} strokeWidth={3} strokeDasharray="14 10" opacity={limit} />
        ))}
    </g>
  );
};
const Crack: React.FC<{x: number; y: number; t: number; t0: number; s?: number}> = ({x, y, t, t0, s = 1}) => {
  const d = t - t0;
  if (d < 0 || d > 0.9) return null;
  const k = easeOut(clamp01(d / 0.25));
  const fade = 1 - clampT(t, t0 + 0.5, t0 + 0.9);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={fade} stroke={BP.red} strokeWidth={5} strokeLinecap="round">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a = (i / 8) * Math.PI * 2 + 0.3;
        return <line key={i} x1={Math.cos(a) * 30 * k} y1={Math.sin(a) * 30 * k} x2={Math.cos(a) * (40 + 60 * k)} y2={Math.sin(a) * (40 + 60 * k)} />;
      })}
    </g>
  );
};

/* ------------------------------------------------------------------ hands */
/** a line-art fist gripping the stick at point p, rotated by ang (radians); mirror for the left hand */
const Fist: React.FC<{p: Pt; ang: number; left?: boolean; op?: number}> = ({p, ang, left, op = 1}) => (
  <g transform={`translate(${p[0].toFixed(1)} ${p[1].toFixed(1)}) rotate(${((ang * 180) / Math.PI).toFixed(2)}) scale(${left ? -1.1 : 1.1} 1.1) translate(-70 -80)`} opacity={op}>
    <path d={FIST} fill={BP.paper} stroke={BP.line} strokeWidth={4} />
    <path d="M60 58 C 90 50 120 50 150 58 M40 100 C 70 112 100 112 130 100" fill="none" stroke={BP.line} strokeWidth={2.5} opacity={0.6} />
  </g>
);

/* ------------------------------------------------------------------ camera */
type Key = {t: number; x: number; y: number; z: number; lin?: boolean};
const CAM: Key[] = [
  {t: 0, x: 0, y: 40, z: 1.08},
  {t: 2.0, x: 0, y: 20, z: 1.0},
  {t: 2.6, x: 0, y: 60, z: 0.92},
  {t: 6.5, x: 0, y: 120, z: 0.96},
  {t: 7.4, x: 2600, y: 40, z: 1.0},
  {t: 12.0, x: 2650, y: 20, z: 1.06},
  {t: 13.1, x: 5000, y: 0, z: 0.95},
  {t: 17.0, x: 5000, y: -40, z: 1.02},
  {t: 19.8, x: 5000, y: -40, z: 1.0},
  {t: 21.0, x: 5000, y: -10, z: 1.05},
  {t: 29.0, x: 5000, y: 0, z: 1.08},
  {t: 32.2, x: 5000, y: 0, z: 1.1},
  {t: 34.2, x: 5000, y: 0, z: 0.98},
  {t: 35.2, x: 9350, y: -40, z: 0.95},
  {t: 37.4, x: 9600, y: -60, z: 1.0},
  {t: 39.6, x: 9000, y: -40, z: 0.84},
  {t: 40.6, x: 9100, y: -40, z: 0.85},
  {t: 41.6, x: 9700, y: -60, z: 0.92},
  {t: 43.2, x: 10050, y: -60, z: 0.95},
  {t: 44.6, x: 10900, y: -20, z: 1.0},
  {t: 45.8, x: 12300, y: 0, z: 0.9},
  {t: 48.4, x: 12300, y: -20, z: 0.95},
  {t: 50.6, x: 12300, y: 0, z: 0.98},
  {t: 52.0, x: 12000, y: 0, z: 1.05},
  {t: 54.6, x: 12000, y: 0, z: 1.08},
  {t: 57.4, x: 12300, y: 0, z: 1.0},
  {t: 63.0, x: 12300, y: 0, z: 1.05},
  {t: 66.2, x: 12300, y: 0, z: 1.0},
  {t: 68.6, x: 12300, y: 20, z: 0.96},
  {t: 69.6, x: 0, y: 40, z: 0.98},
  {t: 72.2, x: 0, y: 80, z: 0.95},
  {t: 74.0, x: 0, y: 60, z: 1.02},
  {t: DUR, x: 0, y: 40, z: 1.08},
];
const camAt = (t: number) => {
  let i = 0;
  while (i < CAM.length - 2 && t >= CAM[i + 1].t) i++;
  const a = CAM[i];
  const b = CAM[i + 1];
  const u = clamp01((t - a.t) / (b.t - a.t));
  const k = b.lin ? u : easeInOut(u);
  return {x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), k))};
};

/* ------------------------------------------------------------------ scene A: the hook (and the ending) */
const SA = 1250; // stick length on screen
const T_SNAP = WT('half', 1, 's', 0.02);
const HOOK_U = (t: number) => (t < T_SNAP ? lerp(0.45, 1, easeIn(clampT(t, 0, T_SNAP))) : 1);
// pieces after the hook snap settle into a counting row
const ROW_T = WT('try', 1, 's', 0.1);
const T_END_SNAP = WT('snap', 3, 's', 0.05);
const T_NEW = 73.9; // a fresh stick slides into the hands for the loop

const HookScene: React.FC<{t: number}> = ({t}) => {
  if (t > 8.2 && t < 68.5) return null;
  const y0 = 120;
  const els: React.ReactNode[] = [];
  const ending = t >= 68.5;
  if (!ending) {
    const ms = t < T_SNAP ? -1 : (t - T_SNAP) * 1000; // real speed
    const pos = ms < 0 ? loadPos(HOOK_U(t)) : dynPos(PL, ms);
    const broken = ms < 0 ? [] : brokenAt(PL, ms);
    const pts = toWorld(pos, 0, y0, SA);
    const pieces = splitPieces(pts, broken);
    // settle into a row for counting
    const settle = easeInOut(clampT(t, ROW_T, ROW_T + 1.1));
    const fall = ms > 0 ? Math.min(1, ms / 350) : 0;
    pieces.forEach((p, i) => {
      const c0 = p.pts[Math.floor(p.pts.length / 2)];
      const rowX = -660 + [0, 1, 2, 3][i] * 0 + 0;
      // target: lay each piece flat, left to right, along y = 260
      let acc = 0;
      const lens = pieces.map((q) => q.pts.length);
      for (let j = 0; j < i; j++) acc += lens[j] + 10;
      const tx = -760 + acc * (SA / N) * 1.05;
      const flat: Pt[] = p.pts.map((_, j) => [tx + j * (SA / N), 300]);
      const drop: Pt[] = p.pts.map((q) => [q[0], q[1] + fall * fall * 40]);
      const cur: Pt[] = drop.map((q, j) => [lerp(q[0], flat[j][0], settle), lerp(q[1], flat[j][1], settle)]);
      els.push(<Stick key={`p${i}`} pts={cur} />);
      void rowX;
      void c0;
      const mid = cur[Math.floor(cur.length / 2)];
      const labelT = [WT('three', 1, 's', -0.45), WT('three', 1, 's', -0.2), WT('three'), WT('more')][i] ?? WT('more');
      els.push(<Num key={`n${i}`} x={mid[0]} y={mid[1] + 90} n={String(i + 1)} t={t} t0={labelT} />);
    });
    // hands: grip the ends until the snap, then drop away
    const away = easeIn(clampT(t, T_SNAP + 0.15, T_SNAP + 0.75));
    if (away < 1) {
      const L = pts[1];
      const R = pts[N - 2];
      const angL = Math.atan2(pts[2][1] - pts[0][1], pts[2][0] - pts[0][0]);
      const angR = Math.atan2(pts[N - 1][1] - pts[N - 3][1], pts[N - 1][0] - pts[N - 3][0]);
      els.push(<Fist key="hl" p={[L[0] - away * 200, L[1] + away * 700]} ang={angL} left />);
      els.push(<Fist key="hr" p={[R[0] + away * 200, R[1] + away * 700]} ang={angR} />);
    }
    // the promise: a target mark at the middle and "1/2" on a dimension line
    const tm = 1 - clampT(t, T_SNAP, T_SNAP + 0.2);
    if (tm > 0) {
      const mid = toWorld(loadPos(HOOK_U(Math.min(t, T_SNAP - 0.001))), 0, y0, SA)[(N - 1) / 2];
      els.push(
        <g key="target" opacity={tm}>
          <circle cx={mid[0]} cy={mid[1]} r={46} fill="none" stroke={BP.line} strokeWidth={3} strokeDasharray="8 8" />
          <path d={`M${mid[0]} ${mid[1] - 70} V${mid[1] + 70} M${mid[0] - 70} ${mid[1]} H${mid[0] + 70}`} stroke={BP.line} strokeWidth={2} opacity={0.7} />
          <text x={mid[0]} y={mid[1] - 100} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={64} fill={BP.line}>
            ½
          </text>
        </g>,
      );
    }
    els.push(<Crack key="c0" x={0} y={pts[60][1]} t={t} t0={T_SNAP} />);
    els.push(<Crack key="c1" x={pts[49][0]} y={pts[49][1]} t={t} t0={T_SNAP + 0.06} s={0.7} />);
    els.push(<Crack key="c2" x={pts[73][0]} y={pts[73][1]} t={t} t0={T_SNAP + 0.1} s={0.7} />);
    els.push(<Label key="l3" x={0} y={-380} t={t} t0={WT('three')} text="almost always 3 or more" size={52} anchor="middle" />);
  } else {
    // the ending: twist, then snap -> two pieces into the pot; a new stick arrives for the loop
    const tw = easeInOut(clampT(t, WT('twist', 3, 's', -0.1), WT('twist', 3, 'e')));
    const ms = t < T_END_SNAP ? -1 : (t - T_END_SNAP) * 1000;
    const u = t < T_END_SNAP ? lerp(0, 1, easeIn(clampT(t, WT('then', 2, 's', -0.2), T_END_SNAP))) : 1;
    const pos = ms < 0 ? loadPos(u) : dynPos(TW, ms);
    const broken = ms < 0 ? [] : brokenAt(TW, ms);
    const pts = toWorld(pos, 0, y0, SA);
    const pieces = splitPieces(pts, broken);
    const intoPot = easeIn(clampT(t, T_END_SNAP + 0.35, T_END_SNAP + 1.2));
    if (t < T_NEW + 0.2) {
      pieces.forEach((p, i) => {
        const cur: Pt[] = p.pts.map((q) => [lerp(q[0], i === 0 ? -120 : 120, intoPot * 0.8), q[1] + intoPot * 420]);
        els.push(<Stick key={`e${i}`} pts={cur} twist={(s) => s * 0.05 * tw * (ms > 0 ? Math.max(0, 1 - ms / 30) : 1)} stripeOp={tw} />);
      });
    }
    // the pot catches them
    const potIn = easeOut(clampT(t, WT('youll', 1, 's', -0.6), WT('youll')));
    const potOut = easeIn(clampT(t, T_NEW - 0.1, T_NEW + 0.5));
    if (potIn > 0 && potOut < 1) {
      els.push(
        <g key="pot" transform={`translate(-195 ${lerp(1200, 330, potIn) + potOut * 700}) scale(1.3)`}>
          <path d={POT} fill={BP.paper} stroke={BP.line} strokeWidth={3.5} />
          <path d="M40 60 H260 M40 90 H260" stroke={BP.line} strokeWidth={2} opacity={0.4} />
        </g>,
      );
    }
    // hands: hold, twist (wrists roll), and come back for the next stick
    const handsBack = easeOut(clampT(t, T_NEW, T_NEW + 0.6));
    const away = t < T_NEW ? easeIn(clampT(t, T_END_SNAP + 0.15, T_END_SNAP + 0.7)) : 1 - handsBack;
    const enter = easeOut(clampT(t, 68.5, 69.6));
    if (t < T_NEW) {
      const L = pts[1];
      const R = pts[N - 2];
      const roll = Math.sin(tw * Math.PI * 3) * 0.12;
      els.push(<Fist key="hl" p={[L[0] - away * 200, L[1] + away * 700 + (1 - enter) * 700]} ang={Math.atan2(pts[2][1] - pts[0][1], pts[2][0] - pts[0][0]) + roll} left />);
      els.push(<Fist key="hr" p={[R[0] + away * 200, R[1] + away * 700 + (1 - enter) * 700]} ang={Math.atan2(pts[N - 1][1] - pts[N - 3][1], pts[N - 1][0] - pts[N - 3][0]) - roll} />);
      els.push(<Crack key="ce" x={0} y={pts[60][1]} t={t} t0={T_END_SNAP} />);
      els.push(<Num key="n1" x={-330} y={330} n="1" t={t} t0={T_END_SNAP + 0.25} />);
      els.push(<Num key="n2" x={330} y={330} n="2" t={t} t0={T_END_SNAP + 0.35} />);
    } else {
      // the next stick, held and starting to bend: the first frame again
      const k = clampT(t, T_NEW, DUR);
      const slide = easeOut(clampT(t, T_NEW, T_NEW + 0.6));
      const pts2 = toWorld(loadPos(0.45 * easeInOut(clampT(t, T_NEW + 0.3, DUR)) * 1.0), (1 - slide) * 1800, y0, SA);
      void k;
      els.push(<Stick key="new" pts={pts2} />);
      const L = pts2[1];
      const R = pts2[N - 2];
      els.push(<Fist key="hl" p={[L[0], L[1] + (1 - handsBack) * 700]} ang={Math.atan2(pts2[2][1] - pts2[0][1], pts2[2][0] - pts2[0][0])} left />);
      els.push(<Fist key="hr" p={[R[0], R[1] + (1 - handsBack) * 700]} ang={Math.atan2(pts2[N - 1][1] - pts2[N - 3][1], pts2[N - 1][0] - pts2[N - 3][0])} />);
      const tm = easeOut(clampT(t, DUR - 1.0, DUR));
      const mid = pts2[(N - 1) / 2];
      els.push(
        <g key="target" opacity={tm}>
          <circle cx={mid[0]} cy={mid[1]} r={46} fill="none" stroke={BP.line} strokeWidth={3} strokeDasharray="8 8" />
          <path d={`M${mid[0]} ${mid[1] - 70} V${mid[1] + 70} M${mid[0] - 70} ${mid[1]} H${mid[0] + 70}`} stroke={BP.line} strokeWidth={2} opacity={0.7} />
          <text x={mid[0]} y={mid[1] - 100} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={64} fill={BP.line}>
            ½
          </text>
        </g>,
      );
    }
    els.push(<Label key="tw" x={0} y={-330} t={t} t0={WT('twist', 3)} text="twist" size={64} anchor="middle" c={BP.pasta} t1={T_NEW} />);
    if (t < T_NEW) els.push(<Label key="sn" x={0} y={-250} t={t} t0={WT('then', 2)} text="then snap" size={48} anchor="middle" />);
  }
  return <g>{els}</g>;
};

/* ------------------------------------------------------------------ scene K: Feynman's kitchen, one evening */
const KX = 2600;
const KitchenScene: React.FC<{t: number}> = ({t}) => {
  if (t < 6.0 || t > 13.8) return null;
  const t0 = WT('physicist') - 0.3;
  const clock = clampT(t, WT('once'), WT('trying', 1, 'e'));
  const hour = 7 + 4 * easeInOut(clock); // 7 pm to 11 pm
  const cx = KX + 520;
  const cy = -300;
  const ha = ((hour % 12) / 12) * Math.PI * 2 - Math.PI / 2;
  const ma = (hour % 1) * Math.PI * 2 - Math.PI / 2;
  // broken pieces pile up on the counter all evening
  const pile: React.ReactNode[] = [];
  const pa = WT('spent');
  const pb = WT('trying', 1, 'e');
  for (let i = 0; i < 46; i++) {
    const ti = lerp(pa, pb, Math.pow(i / 45, 0.8));
    if (t < ti) break;
    const k = easeIn(clampT(t, ti, ti + 0.3));
    const x = KX - 380 + hash(i) * 520;
    const yEnd = 175 - Math.floor(i / 9) * 12 - hash(i + 7) * 10;
    const y = lerp(-500, yEnd, k);
    const len = 50 + hash(i + 3) * 120;
    const a = (hash(i + 11) - 0.5) * 0.5 + (k < 1 ? (1 - k) * 3 : 0);
    pile.push(<line key={i} x1={x - Math.cos(a) * len / 2} y1={y - Math.sin(a) * len / 2} x2={x + Math.cos(a) * len / 2} y2={y + Math.sin(a) * len / 2} stroke={BP.pasta} strokeWidth={9} strokeLinecap="round" />);
  }
  const q = WT('never');
  return (
    <g>
      {/* elevation: counter, cupboards, window with the night outside, stove */}
      <Draw t={t} t0={t0} dur={0.8} d={`M${KX - 900} 200 H${KX + 900} M${KX - 900} 230 H${KX + 900} M${KX - 900} 200 V560 M${KX + 900} 200 V560`} w={4} />
      <Draw t={t} t0={t0 + 0.15} dur={0.8} d={`M${KX - 860} 230 V540 H${KX - 300} V230 M${KX - 580} 230 V540 M${KX - 620} 380 h-24 M${KX - 540} 380 h24`} />
      <Draw t={t} t0={t0 + 0.3} dur={0.8} d={`M${KX - 200} -560 H${KX + 260} V-120 H${KX - 200} Z M${KX + 30} -560 V-120 M${KX - 200} -340 H${KX + 260}`} />
      <Draw t={t} t0={t0 + 0.5} dur={0.6} d={`M${KX + 150} -470 a40 40 0 1 0 50 50 a30 30 0 1 1 -50 -50`} w={3} c={BP.pasta} />
      <Draw t={t} t0={t0 + 0.45} dur={0.8} d={`M${KX + 360} 200 V-20 H${KX + 860} V200 M${KX + 420} -20 v-24 h120 v24 M${KX + 680} -20 v-24 h120 v24`} />
      <Draw t={t} t0={t0 + 0.6} dur={0.8} d={`M${KX + 380} 230 V540 H${KX + 860} V230 M${KX + 420} 300 H${KX + 820} V500 H${KX + 420} Z`} />
      {/* a pot on the stove */}
      <g transform={`translate(${KX + 450} ${-182}) scale(0.9)`} opacity={easeOut(clampT(t, t0 + 0.7, t0 + 1.1))}>
        <path d={POT} fill="none" stroke={BP.line} strokeWidth={3.5} />
      </g>
      {/* the clock: an evening goes by */}
      <g opacity={easeOut(clampT(t, t0 + 0.4, t0 + 0.8))}>
        <circle cx={cx} cy={cy} r={110} fill={BP.paper} stroke={BP.line} strokeWidth={4} />
        {Array.from({length: 12}, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <line key={i} x1={cx + Math.cos(a) * 84} y1={cy + Math.sin(a) * 84} x2={cx + Math.cos(a) * 98} y2={cy + Math.sin(a) * 98} stroke={BP.line} strokeWidth={3} />;
        })}
        <line x1={cx} y1={cy} x2={cx + Math.cos(ha) * 52} y2={cy + Math.sin(ha) * 52} stroke={BP.line} strokeWidth={8} strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={cx + Math.cos(ma) * 80} y2={cy + Math.sin(ma) * 80} stroke={BP.pasta} strokeWidth={4} strokeLinecap="round" />
        <Label x={cx} y={cy + 170} t={t} t0={WT('evening')} text={`${Math.floor(hour)}:${String(Math.floor((hour % 1) * 60)).padStart(2, '0')} pm`} size={40} anchor="middle" mono />
      </g>
      {/* a box of spaghetti, emptying */}
      <Draw t={t} t0={t0 + 0.5} dur={0.6} d={`M${KX - 640} 196 L${KX - 600} -60 H${KX - 470} L${KX - 440} 196 Z`} w={3} />
      <Label x={KX - 600} y={60} t={t} t0={t0 + 0.9} text="PASTA" size={30} rot={-90} />
      {pile}
      <Label x={KX - 880} y={-430} t={t} t0={WT('physicist')} text="Richard Feynman, physicist" size={50} />
      <Label x={KX - 880} y={-370} t={t} t0={WT('kitchen')} text="one evening, in his kitchen" size={36} mono c={BP.pasta} />
      {/* the question he never answered */}
      {t > q && (
        <g transform={`translate(${KX + 20} -330) scale(${lerp(2.2, 1, easeOut(clampT(t, q, q + 0.3)))})`}>
          <path d="M-60 -60 C -60 -140 60 -140 60 -60 C 60 -10 0 -10 0 40 V70" fill="none" stroke={BP.red} strokeWidth={16} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - easeOut(clampT(t, q, q + 0.6))} />
          {t > q + 0.5 && <circle cx={0} cy={120} r={11} fill={BP.red} />}
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ scene D: the snap-back, in slow motion */
const DX = 5000;
const DY = 40;
const DS = 1300;
const T_BEND = WT('bend');
const T_CRACK1 = WT('cracks');
const T_CRACK2 = WT('crack');
// slow motion: on-screen seconds to simulated milliseconds
const MSMAP: [number, number][] = [
  [T_CRACK1, 0],
  [WT('whips'), 0.07],
  [WT('wave'), 0.12],
  [WT('somewhere'), 0.19],
  [T_CRACK2, 0.22],
  [WT('three', 2), 0.32],
  [34.4, 0.42],
];
const DiagramScene: React.FC<{t: number}> = ({t}) => {
  if (t < 11.8 || t > 36) return null;
  const u = clampT(t, T_BEND, T_CRACK1 - 0.02);
  const ms = t < T_CRACK1 ? -1 : pw(t, MSMAP);
  const pos = ms < 0 ? loadPos(0.15 + 0.85 * easeInOut(u)) : dynPos(PL, ms);
  const broken = ms < 0 ? [] : brokenAt(PL, ms);
  const pts = toWorld(pos, DX, DY, DS);
  const pieces = splitPieces(pts, broken);
  const combOp = easeOut(clampT(t, WT('breaks', 2), WT('breaks', 2, 's', 0.5)));
  const limitOp = easeOut(clampT(t, WT('even'), WT('even', 1, 's', 0.6)));
  const mid = pts[60];
  const t0 = 12.2;
  // the clamps hold the two ends
  const clampAt = (p: Pt, a: number, left: boolean) => (
    <g transform={`translate(${p[0].toFixed(1)} ${p[1].toFixed(1)}) rotate(${((a * 180) / Math.PI).toFixed(2)}) scale(${left ? -0.8 : 0.8} 0.8) translate(-80 -130)`}>
      <path d={CLAMP} fill={BP.paper} stroke={BP.line} strokeWidth={4} />
      <path d="M20 130 H140" stroke={BP.line} strokeWidth={2} strokeDasharray="6 6" />
    </g>
  );
  const angL = Math.atan2(pts[2][1] - pts[0][1], pts[2][0] - pts[0][0]);
  const angR = Math.atan2(pts[N - 1][1] - pts[N - 3][1], pts[N - 1][0] - pts[N - 3][0]);
  const appear = easeOut(clampT(t, t0, t0 + 0.6));
  // the time ruler under the drawing: how much real time the slow motion covers
  const ruler = easeOut(clampT(t, T_CRACK1 - 0.3, T_CRACK1 + 0.3));
  const rx0 = DX - 600;
  const rx1 = DX + 600;
  const ry = 300;
  const msMark = Math.max(0, ms);
  return (
    <g opacity={appear}>
      <Draw t={t} t0={t0} dur={0.8} d={`M${DX - 820} 200 H${DX + 820}`} w={3} />
      <Draw t={t} t0={t0 + 0.1} dur={0.8} d={`M${DX - 820} 200 l-30 30 M${DX - 740} 200 l-30 30 M${DX - 660} 200 l-30 30 M${DX + 660} 200 l-30 30 M${DX + 740} 200 l-30 30 M${DX + 820} 200 l-30 30`} w={2} />
      {pieces.map((p, i) => (
        <Stick key={i} pts={p.pts} />
      ))}
      <Comb pieces={pieces} scale={6100} op={combOp} limit={limitOp} />
      {clampAt(pts[1], angL, true)}
      {clampAt(pts[N - 2], angR, false)}
      <Label x={DX - 760} y={-430} t={t} t0={WT('bend', 1, 's', 0.1)} text="bend it" size={56} t1={T_CRACK1} />
      <Label x={DX - 760} y={-372} t={t} t0={WT('breaks', 2, 's', 0.2)} text="whiskers = how hard it is bent" size={34} mono c={BP.pasta} />
      {/* most bent here */}
      {t > WT('most') && t < T_CRACK1 + 0.3 && (
        <g>
          <Draw t={t} t0={WT('most')} dur={0.4} d={`M${mid[0]} ${mid[1] - 330} V${mid[1] - 160}`} w={4} c={BP.red} />
          <Draw t={t} t0={WT('most', 1, 's', 0.3)} dur={0.3} d={`M${mid[0] - 22} ${mid[1] - 190} L${mid[0]} ${mid[1] - 160} L${mid[0] + 22} ${mid[1] - 190}`} w={4} c={BP.red} />
          <Label x={mid[0]} y={mid[1] - 350} t={t} t0={WT('middle')} text="breaks here" size={44} anchor="middle" c={BP.red} />
        </g>
      )}
      {/* what you would expect: two halves */}
      {t > WT('two') && t < T_CRACK1 && (
        <g opacity={easeOut(clampT(t, WT('two'), WT('two', 1, 's', 0.3)))}>
          <polyline points={poly(pts.slice(0, 61).map((p) => [p[0] - 60, p[1] + 60] as Pt))} fill="none" stroke={BP.line} strokeWidth={4} strokeDasharray="12 10" />
          <polyline points={poly(pts.slice(61).map((p) => [p[0] + 60, p[1] + 60] as Pt))} fill="none" stroke={BP.line} strokeWidth={4} strokeDasharray="12 10" />
          <Label x={DX} y={250} t={t} t0={WT('pieces', 2)} text="2 pieces?" size={52} anchor="middle" />
        </g>
      )}
      {/* the cracks */}
      <Crack x={pts[60][0]} y={pts[60][1]} t={t} t0={T_CRACK1} />
      <Crack x={pts[49][0]} y={pts[49][1]} t={t} t0={T_CRACK2} s={1.2} />
      <Crack x={pts[73][0]} y={pts[73][1]} t={t} t0={pw(0.39, MSMAP.map(([a, b]) => [b, a]) as [number, number][])} s={0.8} />
      {/* the bending wave, pointed out */}
      {ms > 0 && t > WT('wave') && t < T_CRACK2 && (
        <Label x={DX} y={-430} t={t} t0={WT('wave')} text="snap-back wave" size={52} anchor="middle" c={BP.pasta} />
      )}
      {limitOp > 0 && t < 34 && <Label x={DX + 760} y={-372} t={t} t0={WT('even')} text="red dashes = breaking limit" size={34} mono anchor="end" c={BP.red} />}
      {t > WT('three', 2) && <Num x={(pts[49][0] + pts[60][0]) / 2} y={(pts[49][1] + pts[60][1]) / 2 - 90} n="3" t={t} t0={WT('three', 2)} r={44} c={BP.red} />}
      {/* time ruler */}
      {ruler > 0 && (
        <g opacity={ruler}>
          <line x1={rx0} y1={ry} x2={rx1} y2={ry} stroke={BP.line} strokeWidth={3} />
          {[0, 0.1, 0.2, 0.3, 0.4].map((v) => {
            const x = lerp(rx0, rx1, v / 0.4);
            return (
              <g key={v}>
                <line x1={x} y1={ry - 14} x2={x} y2={ry + 14} stroke={BP.line} strokeWidth={3} />
                <text x={x} y={ry + 52} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={30} fill={BP.line}>
                  {v.toFixed(1)} ms
                </text>
              </g>
            );
          })}
          <path d={`M${lerp(rx0, rx1, Math.min(1, msMark / 0.4))} ${ry - 18} l-14 -24 h28 z`} fill={BP.pasta} />
          <text x={rx0 - 30} y={ry + 10} textAnchor="end" fontFamily={MONO} fontWeight={700} fontSize={30} fill={BP.pasta}>
            real time
          </text>
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ scene T: a timeline, 1980 to 2020 */
const TX0 = 7400;
const TX1 = 11200;
const yearX = (y: number) => lerp(TX0, TX1, (y - 1980) / 40);
const TimelineScene: React.FC<{t: number}> = ({t}) => {
  if (t < 33.8 || t > 47.5) return null;
  const t0 = 34.2;
  const ty = 160;
  const k = easeInOut(clampT(t, t0, t0 + 1.2));
  const x2005 = yearX(2005);
  const x1988 = yearX(1988);
  const x2006 = yearX(2006);
  const x2018 = yearX(2018);
  const paper = easeOut(clampT(t, WT('2005') - 0.2, WT('2005') + 0.3));
  const medal = easeOut(clampT(t, WT('ig') - 0.2, WT('ig') + 0.2));
  const m2018 = easeOut(clampT(t, WT('2018') - 0.2, WT('2018') + 0.3));
  return (
    <g>
      <line x1={TX0} y1={ty} x2={lerp(TX0, TX1, k)} y2={ty} stroke={BP.line} strokeWidth={4} />
      {Array.from({length: 41}, (_, i) => {
        const x = yearX(1980 + i);
        if (x > lerp(TX0, TX1, k)) return null;
        const big = i % 5 === 0;
        return (
          <g key={i}>
            <line x1={x} y1={ty - (big ? 22 : 10)} x2={x} y2={ty + (big ? 22 : 10)} stroke={BP.line} strokeWidth={big ? 3 : 2} />
            {big && (
              <text x={x} y={ty + 70} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={36} fill={BP.line} opacity={0.8}>
                {1980 + i}
              </text>
            )}
          </g>
        );
      })}
      {/* 2005: the paper that explained it */}
      {paper > 0 && (
        <g transform={`translate(${x2005} ${lerp(-500, -210, paper)})`}>
          <line x1={0} y1={170} x2={0} y2={370} stroke={BP.pasta} strokeWidth={3} strokeDasharray="8 8" />
          <rect x={-120} y={-160} width={240} height={300} fill={BP.paper} stroke={BP.line} strokeWidth={4} />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <line key={i} x1={-90} y1={-60 + i * 26} x2={i % 3 === 2 ? 30 : 90} y2={-60 + i * 26} stroke={BP.line} strokeWidth={3} opacity={0.6} />
          ))}
          <path d="M-90 -120 C -40 -150 40 -90 90 -120" fill="none" stroke={BP.pasta} strokeWidth={6} />
          <text x={0} y={190} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={40} fill={BP.pasta}>
            2005
          </text>
        </g>
      )}
      <Label x={x2005} y={-430} t={t} t0={WT('french')} text="two French physicists" size={44} anchor="middle" />
      {/* seventeen years */}
      <Dim x1={x1988} y1={ty - 120} x2={x2005} y2={ty - 120} t={t} t0={WT('seventeen')} text="17 years" />
      {t > WT('feynman', 2) && (
        <g>
          <Draw t={t} t0={WT('feynman', 2)} dur={0.4} d={`M${x1988} ${ty - 30} V${ty + 120}`} w={4} c={BP.red} />
          <Label x={x1988} y={ty + 170} t={t} t0={WT('feynman', 2, 's', 0.2)} text="1988: Feynman dies" size={36} anchor="middle" c={BP.red} />
        </g>
      )}
      {/* Ig Nobel Prize, 2006 */}
      {medal > 0 && (
        <g transform={`translate(${x2006 + 240} ${lerp(-700, -330, medal)}) rotate(${lerp(-25, 6, medal)})`}>
          <path d={MEDAL} fill={BP.paper} stroke={BP.pasta} strokeWidth={5} transform="translate(-70 -120)" />
          <text x={0} y={70} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={30} fill={BP.pasta}>
            Ig
          </text>
          <text x={0} y={150} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={32} fill={BP.line}>
            Ig Nobel 2006
          </text>
        </g>
      )}
      {/* but how do you stop it? */}
      <Label x={yearX(2012)} y={-420} t={t} t0={WT('stop')} text="how do you stop it?" size={50} anchor="middle" c={BP.red} />
      {m2018 > 0 && (
        <g>
          <circle cx={x2018} cy={ty} r={lerp(80, 26, m2018)} fill="none" stroke={BP.pasta} strokeWidth={6} />
          <text x={x2018} y={ty - 60} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={46} fill={BP.pasta} opacity={m2018}>
            2018 · MIT
          </text>
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ scene M: the MIT machine, twist then bend */
const MX = 12300;
const MY = 80;
const MS = 1300;
const T_TWIST0 = WT('twist');
const T_TWIST1 = WT('turn', 1, 'e');
const T_BEND2 = WT('bend', 2);
const T_BREAK2 = WT('breaks', 3);
const TWMAP: [number, number][] = [
  [T_BREAK2, 0],
  [WT('unwinds'), 0.04],
  [WT('wave', 3), 0.1],
  [WT('bending', 2), 0.2],
  [WT('soaks'), 0.32],
  [66.2, 0.55],
  [68.6, 2.0],
];
const TWIST_TOTAL = 0.75 * Math.PI * 2; // three-quarters of a turn
const MachineScene: React.FC<{t: number}> = ({t}) => {
  if (t < 44.6 || t > 69.8) return null;
  const t0 = WT('mit') - 0.2;
  const twist = easeInOut(clampT(t, T_TWIST0, T_TWIST1));
  const u = clampT(t, T_BEND2, T_BREAK2 - 0.02);
  const ms = t < T_BREAK2 ? -1 : pw(t, TWMAP);
  const pos = ms < 0 ? loadPos(0.15 + 0.85 * easeInOut(u)) : dynPos(TW, ms);
  const broken = ms < 0 ? [] : brokenAt(TW, ms);
  const pts = toWorld(pos, MX, MY, MS);
  const pieces = splitPieces(pts, broken);
  // twist field: uniform before the break; after it, an unwinding front races out from the crack
  const front = ms < 0 ? 0 : Math.min(1, ms / 0.12) * 0.5; // reaches the clamps in about 0.12 ms
  const stripeFor = (i0: number) => (s: number) => {
    const sIdx = i0 + s / (MS / (N - 1));
    const sn = sIdx / (N - 1);
    const dist = Math.abs(sn - 0.5);
    const tw = twist * (ms < 0 || dist > front ? 1 : 0.0);
    return (s / 58) * Math.PI * 2 * (0.25 + 1.6 * tw) + (twist * TWIST_TOTAL * (1 - sn));
  };
  const combOp = easeOut(clampT(t, WT('bending', 2, 's', -0.2), WT('bending', 2, 's', 0.3))) * (1 - clampT(t, 66.2, 66.8));
  const crank = twist * TWIST_TOTAL;
  const L = pts[1];
  const R = pts[N - 2];
  const angL = Math.atan2(pts[2][1] - pts[0][1], pts[2][0] - pts[0][0]);
  const angR = Math.atan2(pts[N - 1][1] - pts[N - 3][1], pts[N - 1][0] - pts[N - 3][0]);
  const clampAt = (p: Pt, a: number, left: boolean) => (
    <g transform={`translate(${p[0].toFixed(1)} ${p[1].toFixed(1)}) rotate(${((a * 180) / Math.PI).toFixed(2)}) scale(${left ? -0.8 : 0.8} 0.8) translate(-80 -130)`}>
      <path d={CLAMP} fill={BP.paper} stroke={BP.line} strokeWidth={4} />
    </g>
  );
  // high-speed camera
  const cam = easeOut(clampT(t, WT('filmed') - 0.3, WT('filmed') + 0.2));
  const film = clampT(t, WT('million') - 0.2, 51.2);
  return (
    <g>
      {/* rail and rollers */}
      <Draw t={t} t0={t0} dur={0.8} d={`M${MX - 900} 320 H${MX + 900} V352 H${MX - 900} Z`} w={4} />
      <Draw t={t} t0={t0 + 0.2} dur={0.8} d={`M${MX - 860} 352 v30 M${MX + 860} 352 v30`} w={3} />
      <Draw t={t} t0={t0 + 0.3} dur={0.6} d={`M${L[0]} ${L[1] + 90} V320 M${R[0]} ${R[1] + 90} V320`} w={3} dash="10 8" />
      {/* crank dial on the left clamp, with a protractor arc for the twist */}
      <g transform={`translate(${MX - 760} -300)`} opacity={easeOut(clampT(t, t0 + 0.4, t0 + 0.9))}>
        <circle r={110} fill={BP.paper} stroke={BP.line} strokeWidth={4} />
        {Array.from({length: 24}, (_, i) => {
          const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
          return <line key={i} x1={Math.cos(a) * 92} y1={Math.sin(a) * 92} x2={Math.cos(a) * (i % 6 === 0 ? 70 : 82)} y2={Math.sin(a) * (i % 6 === 0 ? 70 : 82)} stroke={BP.line} strokeWidth={3} />;
        })}
        <line x1={0} y1={0} x2={Math.cos(crank - Math.PI / 2) * 100} y2={Math.sin(crank - Math.PI / 2) * 100} stroke={BP.pasta} strokeWidth={8} strokeLinecap="round" />
        {twist > 0 && (
          <path
            d={`M0 -135 A135 135 0 ${crank > Math.PI ? 1 : 0} 1 ${(Math.cos(crank - Math.PI / 2) * 135).toFixed(1)} ${(Math.sin(crank - Math.PI / 2) * 135).toFixed(1)}`}
            fill="none"
            stroke={BP.pasta}
            strokeWidth={6}
          />
        )}
        <text y={210} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={54} fill={BP.pasta} opacity={clampT(t, T_TWIST0, T_TWIST0 + 0.3)}>
          {Math.round((crank * 180) / Math.PI)}°
        </text>
      </g>
      <Draw t={t} t0={t0 + 0.4} dur={0.5} d={`M${MX - 760} -190 C ${MX - 760} -80 ${L[0] - 40} ${L[1] - 120} ${L[0] - 30} ${L[1] - 60}`} w={3} dash="10 8" />
      {pieces.map((p, i) => (
        <Stick key={i} pts={p.pts} twist={stripeFor(p.i0)} stripeOp={1} />
      ))}
      <Comb pieces={pieces} scale={6100} op={combOp} limit={combOp} />
      {clampAt(L, angL, true)}
      {clampAt(R, angR, false)}
      {/* the unwinding front, marked */}
      {ms > 0 && front < 0.5 && (
        <g>
          {[-1, 1].map((sgn) => {
            const idx = Math.round((0.5 + sgn * front) * (N - 1));
            const p = pts[Math.max(0, Math.min(N - 1, idx))];
            return <circle key={sgn} cx={p[0]} cy={p[1]} r={38} fill="none" stroke={BP.line} strokeWidth={5} />;
          })}
        </g>
      )}
      {/* camera on a tripod, film racing */}
      {cam > 0 && (
        <g transform={`translate(${MX + 620} ${lerp(-900, -380, cam)})`}>
          <rect x={-120} y={-70} width={190} height={130} rx={10} fill={BP.paper} stroke={BP.line} strokeWidth={4} />
          <rect x={70} y={-40} width={70} height={70} fill={BP.paper} stroke={BP.line} strokeWidth={4} />
          <circle cx={-60} cy={-100} r={34} fill="none" stroke={BP.line} strokeWidth={4} />
          <circle cx={20} cy={-100} r={34} fill="none" stroke={BP.line} strokeWidth={4} />
          <path d="M-30 60 L-90 260 M-30 60 L30 260 M-30 60 V260" stroke={BP.line} strokeWidth={4} />
          {film > 0 &&
            Array.from({length: 7}, (_, i) => {
              const x = -480 + ((i * 90 + film * 4000) % 630);
              return <rect key={i} x={x} y={-150 - 80} width={70} height={50} fill="none" stroke={BP.pasta} strokeWidth={3} opacity={film < 1 ? 1 : 0} />;
            })}
        </g>
      )}
      <Label x={MX - 900} y={-470} t={t} t0={WT('spaghettisnapping')} text="the spaghetti-snapping machine" size={50} t1={WT('twist', 1, 's', -0.2)} />
      <Label x={MX + 620} y={-620} t={t} t0={WT('million')} text="1,000,000 frames per second" size={36} mono anchor="middle" c={BP.pasta} />
      <Label x={MX - 540} y={-200} t={t} t0={WT('threequarters')} text="3/4 of a turn" size={44} c={BP.pasta} />
      <Label x={MX} y={-420} t={t} t0={WT('unwinds')} text="twist unwinds first" size={50} anchor="middle" c={BP.line} t1={WT('two', 3)} />
      <Label x={MX} y={-362} t={t} t0={WT('soaks')} text="and drains the snap-back" size={36} mono anchor="middle" c={BP.pasta} t1={WT('two', 3)} />
      <Crack x={pts[60][0]} y={pts[60][1]} t={t} t0={T_BREAK2} />
      {t > WT('two', 3) && (
        <g>
          <Num x={pts[30][0]} y={pts[30][1] + 120} n="1" t={t} t0={WT('two', 3)} r={44} />
          <Num x={pts[90][0]} y={pts[90][1] + 120} n="2" t={t} t0={WT('pieces', 3)} r={44} />
        </g>
      )}
      {t > WT('exactly') && <Label x={MX} y={262} t={t} t0={WT('exactly')} text="exactly two" size={64} anchor="middle" c={BP.pasta} />}
    </g>
  );
};

/* ------------------------------------------------------------------ captions */
type Cap = {s: number; e: number; words: {w: string; s: number}[]};
const CAPS: Cap[] = (() => {
  const out: Cap[] = [];
  let cur: Cap | null = null;
  WORDS.forEach((w, i) => {
    if (!cur) cur = {s: w.s, e: w.e, words: []};
    cur.words.push({w: w.w, s: w.s});
    cur.e = w.e;
    const end = /[.,:?!]$/.test(w.w) || cur.words.length >= 6;
    if (end || !WORDS[i + 1]) {
      out.push(cur);
      cur = null;
    }
  });
  return out;
})();
const Captions: React.FC<{t: number}> = ({t}) => {
  let c: Cap | null = null;
  for (let i = 0; i < CAPS.length; i++) {
    const nx = CAPS[i + 1];
    if (t >= CAPS[i].s - 0.05 && t < (nx ? nx.s - 0.05 : CAPS[i].e + 0.5)) c = CAPS[i];
  }
  if (!c) return null;
  const cc = c;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <text x={W / 2} y={H - 62} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={46} stroke={BP.paperDeep} strokeWidth={10} strokeLinejoin="round" paintOrder="stroke">
        {cc.words.map((w, i) => {
          const on = t >= w.s;
          const now = on && t < (cc.words[i + 1]?.s ?? 1e9);
          return (
            <tspan key={i} fill={now ? BP.pasta : BP.line} opacity={on ? 1 : 0.4}>
              {(i ? ' ' : '') + w.w}
            </tspan>
          );
        })}
      </text>
    </svg>
  );
};

/* ------------------------------------------------------------------ the film */
export const SnapVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const t = (frame + SUB) / FPS;
  const cam = camAt(t);
  const pr = twos(frame);
  return (
    <AbsoluteFill style={{background: BP.paper}}>
      <Fonts />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <pattern id="grid" width={60} height={60} patternUnits="userSpaceOnUse">
            <path d="M60 0H0V60" fill="none" stroke={BP.line} strokeWidth={1} opacity={0.08} />
          </pattern>
          <pattern id="grid5" width={300} height={300} patternUnits="userSpaceOnUse">
            <path d="M300 0H0V300" fill="none" stroke={BP.line} strokeWidth={1.5} opacity={0.14} />
          </pattern>
          {/* diazo print: lines bleed a hair and the paper is never one flat blue */}
          <filter id="ink" x="-2%" y="-2%" width="104%" height="104%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves={2} seed={pr % 89} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={2.2} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="mottle" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.004" numOctaves={3} seed={7} />
            <feColorMatrix type="matrix" values="0 0 0 0 0.02  0 0 0 0 0.08  0 0 0 0 0.16  0 0 0 0.9 -0.3" />
          </filter>
          <filter id="tooth" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={(pr * 5) % 97} />
            <feColorMatrix type="matrix" values="0 0 0 0 0.85  0 0 0 0 0.92  0 0 0 0 1  0 0 0 -1.8 1.05" />
          </filter>
          <radialGradient id="vig" cx="50%" cy="50%" r="75%">
            <stop offset="60%" stopColor="#000" stopOpacity={0} />
            <stop offset="100%" stopColor="#000" stopOpacity={0.35} />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill={BP.paper} />
        <rect width={W} height={H} filter="url(#mottle)" />
        <g filter="url(#ink)">
          <g transform={`translate(${W / 2} ${H / 2}) scale(${cam.z.toFixed(5)}) translate(${(-cam.x).toFixed(2)} ${(-cam.y).toFixed(2)})`}>
            <rect x={-3000} y={-2000} width={19000} height={4000} fill="url(#grid)" />
            <rect x={-3000} y={-2000} width={19000} height={4000} fill="url(#grid5)" />
            <HookScene t={t} />
            <KitchenScene t={t} />
            <DiagramScene t={t} />
            <TimelineScene t={t} />
            <MachineScene t={t} />
          </g>
        </g>
        <rect width={W} height={H} filter="url(#tooth)" style={{mixBlendMode: 'screen'}} opacity={0.16} />
        <rect width={W} height={H} fill="url(#vig)" />
      </svg>
      <Captions t={t} />
    </AbsoluteFill>
  );
};
