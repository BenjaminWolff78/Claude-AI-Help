import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {C, DUR, FPS, H, SANS, SUB, T, W, clamp01, clampT, easeIn, easeInOut, easeOut, hash, lerp} from './lib';

/* ------------------------------------------------------------------ fonts */
const FACE = `@font-face{font-family:"Heros Comb";src:url(${staticFile('fonts/texgyreheros-bold.otf')}) format("opentype");font-weight:700;font-display:block;}`;
const Fonts: React.FC = () => {
  const [h] = useState(() => delayRender('comb-font'));
  useEffect(() => {
    document.fonts.load(`700 80px "Heros Comb"`).then(() => continueRender(h));
  }, [h]);
  return <style>{FACE}</style>;
};

/* ------------------------------------------------------------------ geometry */
type Pt = [number, number];
const SQ3 = Math.sqrt(3);
/** pointy-top hexagon */
const hexPts = (cx: number, cy: number, r: number, rot = 0): Pt[] =>
  Array.from({length: 6}, (_, k) => {
    const a = ((60 * k - 90) * Math.PI) / 180 + rot;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
const path = (p: Pt[], close = true) => 'M' + p.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' L') + (close ? ' Z' : '');
/** centres of a pointy-top hex grid of radius r around (cx, cy), with ring index */
const hexGrid = (cx: number, cy: number, r: number, rings: number) => {
  const out: {x: number; y: number; ring: number; q: number; s: number}[] = [];
  for (let q = -rings; q <= rings; q++) {
    for (let s = Math.max(-rings, -q - rings); s <= Math.min(rings, -q + rings); s++) {
      const x = cx + r * SQ3 * (q + s / 2);
      const y = cy + r * 1.5 * s;
      out.push({x, y, ring: Math.max(Math.abs(q), Math.abs(s), Math.abs(-q - s)), q, s});
    }
  }
  return out;
};
/** radius of a regular n-gon (n = 0 means circle) of area A, sampled at angle a (polar form) */
const polarR = (n: number, A: number, a: number, rot = -Math.PI / 2) => {
  if (n === 0) return Math.sqrt(A / Math.PI);
  const R = Math.sqrt((2 * A) / (n * Math.sin((2 * Math.PI) / n)));
  const ap = R * Math.cos(Math.PI / n);
  const seg = (2 * Math.PI) / n;
  let d = (a - rot) % seg;
  if (d < 0) d += seg;
  return ap / Math.cos(d - seg / 2);
};
const M = 180;
/** outline of a shape that morphs between n-gons (0 = circle); k mixes nA -> nB */
const morphPts = (cx: number, cy: number, A: number, nA: number, nB: number, k: number, rot = -Math.PI / 2): Pt[] =>
  Array.from({length: M}, (_, i) => {
    const a = rot + (i / M) * Math.PI * 2;
    const r = lerp(polarR(nA, A, a, rot), polarR(nB, A, a, rot), k);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
const perim = (p: Pt[]) => p.reduce((s, q, i) => s + Math.hypot(q[0] - p[(i + 1) % p.length][0], q[1] - p[(i + 1) % p.length][1]), 0);

/* ------------------------------------------------------------------ type */
let mctx: CanvasRenderingContext2D | null = null;
const measure = (text: string, size: number) => {
  if (!mctx && typeof document !== 'undefined') mctx = document.createElement('canvas').getContext('2d');
  if (!mctx) return text.length * size * 0.56;
  mctx.font = `700 ${size}px "Heros Comb"`;
  return mctx.measureText(text).width - text.length * size * 0.02;
};
/** words slide up out of a mask, a word at a time; leave upward faster than they came */
const Words: React.FC<{t: number; t0: number; t1: number; lines: {text: string; size: number; color?: string; hi?: string[]}[]; x: number; y: number; anchor?: 'start' | 'middle'; gap?: number}> = ({t, t0, t1, lines, x, y, anchor = 'middle', gap = 1.08}) => {
  if (t < t0 - 0.05 || t > t1 + 0.5) return null;
  let wi = 0;
  return (
    <g>
      {lines.map((ln, li) => {
        const yy = y + li * ln.size * gap;
        const words = ln.text.split(' ');
        const id = `mask-${li}-${Math.round(yy)}-${Math.round(t0 * 10)}`;
        return (
          <g key={li}>
            <clipPath id={id}>
              <rect x={0} y={yy - ln.size * 0.98} width={W} height={ln.size * 1.28} />
            </clipPath>
            {[true, false].map((outline) => (
              <text
                key={outline ? 'o' : 'f'}
                clipPath={`url(#${id})`}
                x={x}
                y={yy}
                textAnchor={anchor}
                fontFamily={SANS}
                fontWeight={700}
                fontSize={ln.size}
                letterSpacing={-ln.size * 0.02}
                stroke={outline ? C.bg : 'none'}
                strokeWidth={outline ? ln.size * 0.12 : 0}
                strokeLinejoin="round"
                xmlSpace="preserve"
              >
                {words.map((w, i, arr) => {
                  // dy (relative) keeps the line one text chunk, so text-anchor centres the whole line, not each word
                  const off = (j: number) => {
                    if (j < 0) return 0;
                    const tj = t0 + (wi + j) * 0.07;
                    const kj = easeOut(clampT(t, tj, tj + 0.5));
                    const oj = easeIn(clampT(t, t1 + j * 0.025, t1 + 0.3 + j * 0.025));
                    return (1 - kj) * ln.size * 1.05 - oj * ln.size * 1.1;
                  };
                  void arr;
                  const ti = t0 + (wi + i) * 0.07;
                  const k = easeOut(clampT(t, ti, ti + 0.5));
                  const o = easeIn(clampT(t, t1 + i * 0.025, t1 + 0.3 + i * 0.025));
                  const dy = (1 - k) * ln.size * 1.05 - o * ln.size * 1.1;
                  const hi = ln.hi?.includes(w.replace(/[.,:]/g, ''));
                  return (
                    <tspan key={i} dy={dy - off(i - 1)} fill={outline ? C.bg : hi ? C.honey : ln.color ?? C.cream}>
                      {(i ? ' ' : '') + w}
                    </tspan>
                  );
                })}
              </text>
            ))}
            {(() => {
              wi += words.length;
              return null;
            })()}
          </g>
        );
      })}
    </g>
  );
};

/* ------------------------------------------------------------------ the bee (drawn in Figma, file VhoPC4sh4GgyotuLE4hwxb, frame "Bee") */
const Bee: React.FC<{x: number; y: number; s?: number; rot?: number; t: number; flip?: boolean}> = ({x, y, s = 1, rot = 0, t, flip}) => {
  const flap = 0.55 + 0.45 * Math.abs(Math.sin(t * 2 * Math.PI * 7)); // wing beat
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(2)}) scale(${(flip ? -s : s).toFixed(3)} ${s.toFixed(3)}) translate(-215 -165)`}>
      <ellipse cx={230} cy={262} rx={110} ry={18} fill="#000" opacity={0.18} />
      <g transform={`translate(0 ${(110 * (1 - flap)).toFixed(1)}) scale(1 ${flap.toFixed(3)})`}>
        <ellipse opacity={0.85} cx={207.6} cy={92.2} rx={55} ry={60} transform="rotate(15 207.6 92.2)" fill={C.cream} />
      </g>
      <ellipse cx={225} cy={175} rx={95} ry={65} fill={C.gold} />
      <path
        d="M216 239.71C206.899 239.125 198.171 237.662 190 235.445V114.554C198.171 112.337 206.899 110.874 216 110.289V239.71ZM240 110.807C249.17 111.802 257.902 113.694 266 116.349V233.65C257.902 236.305 249.17 238.197 240 239.192V110.807ZM286 125.169C294.851 130.247 302.33 136.408 308 143.354V206.645C302.33 213.591 294.852 219.752 286 224.83V125.169Z"
        fill={C.ink}
      />
      <path d="M312 160L352 175L312 190V160Z" fill={C.ink} />
      <circle cx={125} cy={165} r={47} fill={C.cream} />
      <circle cx={125} cy={165} r={44} fill={C.ink} />
      <circle cx={110} cy={157} r={12} fill={C.cream} />
      <path
        d="M125.961 67.4433C128.149 67.1358 130.171 68.66 130.479 70.8476L137.994 124.322C138.302 126.51 136.777 128.532 134.59 128.84C132.402 129.147 130.38 127.623 130.072 125.435L122.557 71.9608C122.249 69.7733 123.773 67.7508 125.961 67.4433ZM101.625 70.3095C103.627 69.3758 106.008 70.2419 106.941 72.244L128.917 119.372C129.851 121.374 128.985 123.755 126.982 124.688C124.98 125.622 122.601 124.755 121.667 122.753L99.6904 75.6249C98.7571 73.6229 99.6231 71.2431 101.625 70.3095Z"
        fill={C.cream}
      />
      <g transform={`translate(0 ${(100 * (1 - flap)).toFixed(1)}) scale(1 ${flap.toFixed(3)})`}>
        <ellipse opacity={0.9} cx={263.8} cy={75.5} rx={50} ry={55} transform="rotate(-10 263.8 75.5)" fill={C.cream} />
      </g>
    </g>
  );
};
/** a bee flying a smooth path through points during [t0, t1] */
const flyPath = (t: number, t0: number, t1: number, pts: Pt[]) => {
  const k = easeInOut(clampT(t, t0, t1));
  const f = k * (pts.length - 1);
  const i = Math.min(pts.length - 2, Math.floor(f));
  const u = f - i;
  // Catmull-Rom through the points
  const p0 = pts[Math.max(0, i - 1)];
  const p1 = pts[i];
  const p2 = pts[i + 1];
  const p3 = pts[Math.min(pts.length - 1, i + 2)];
  const cr = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
  const x = cr(p0[0], p1[0], p2[0], p3[0]);
  const y = cr(p0[1], p1[1], p2[1], p3[1]);
  const dx = p2[0] - p1[0];
  return {x, y: y + Math.sin(t * 9) * 6, flip: dx < 0, rot: Math.max(-14, Math.min(14, (p2[1] - p1[1]) * 0.05))};
};

/* ------------------------------------------------------------------ comb */
const Comb: React.FC<{t: number; r: number; cx: number; cy: number; rings: number; born?: (ring: number, i: number) => number; honey?: (i: number) => number; wall?: number; wiggle?: number; dim?: number}> = ({t, r, cx, cy, rings, born = () => -1, honey = () => 0, wall = 4, wiggle = 0, dim = 0}) => {
  const cells = hexGrid(cx, cy, r, rings);
  return (
    <g>
      {cells.map((c, i) => {
        const b = born(c.ring, i);
        const k = easeOut(clampT(t, b, b + 0.45));
        if (k <= 0) return null;
        const rr = r * lerp(0.2, 1, k);
        const ins = hexPts(c.x, c.y, rr * 0.9);
        const hf = clamp01(honey(i));
        const edge = hexPts(c.x, c.y, rr);
        let d = path(edge);
        if (wiggle > 0) {
          // curvy walls: each edge bows into an S (same for both neighbours, so they stay shared)
          const segs: string[] = [];
          for (let e = 0; e < 6; e++) {
            const a = edge[e];
            const bb = edge[(e + 1) % 6];
            const mx = (a[0] + bb[0]) / 2;
            const my = (a[1] + bb[1]) / 2;
            const nx = -(bb[1] - a[1]) / r;
            const ny = (bb[0] - a[0]) / r;
            const sg = ((Math.round(mx) * 7 + Math.round(my) * 13) % 2 ? 1 : -1) * wiggle * r * 0.35;
            const q1: Pt = [lerp(a[0], bb[0], 0.25) + nx * sg, lerp(a[1], bb[1], 0.25) + ny * sg];
            const q2: Pt = [lerp(a[0], bb[0], 0.75) - nx * sg, lerp(a[1], bb[1], 0.75) - ny * sg];
            segs.push(`${e === 0 ? `M${a[0].toFixed(1)} ${a[1].toFixed(1)}` : ''} C${q1[0].toFixed(1)} ${q1[1].toFixed(1)} ${q2[0].toFixed(1)} ${q2[1].toFixed(1)} ${bb[0].toFixed(1)} ${bb[1].toFixed(1)}`);
          }
          d = segs.join(' ') + ' Z';
        }
        return (
          <g key={i} opacity={1 - dim * clamp01(1 - Math.hypot(c.x - cx, c.y - cy) / (r * 3))}>
            <path d={path(ins)} fill={C.cell} />
            {hf > 0 && (
              <g>
                <clipPath id={`hc${i}`}>
                  <path d={path(ins)} />
                </clipPath>
                <rect clipPath={`url(#hc${i})`} x={c.x - rr} y={c.y + rr - 2 * rr * hf} width={2 * rr} height={2 * rr * hf + 2} fill={C.honey} />
                <ellipse clipPath={`url(#hc${i})`} cx={c.x - rr * 0.25} cy={c.y + rr - 2 * rr * hf + rr * 0.25} rx={rr * 0.3} ry={rr * 0.1} fill={C.gold} opacity={0.7} />
              </g>
            )}
            <path d={d} fill="none" stroke={C.gold} strokeWidth={wall} strokeLinejoin="round" opacity={0.95} />
          </g>
        );
      })}
    </g>
  );
};

/* ------------------------------------------------------------------ scenes (each draws into a 1920 x 1080 frame) */
const CX = W / 2;
const CY = H / 2;
const R0 = 74; // the centre cell every portal opens from

const S1Hook: React.FC<{t: number}> = ({t}) => {
  const honey = (i: number) => (hash(i * 3.1) < 0.35 ? clampT(t, 0.6 + hash(i) * 3, 2.4 + hash(i) * 3) : 0);
  const bee = flyPath(t, -0.4, 5.6, [[-200, 760], [420, 640], [900, 820], [1500, 700], [2200, 560]]);
  return (
    <g>
      <Comb t={t} r={R0} cx={CX} cy={CY} rings={9} born={(ring) => -1.0 + ring * 0.09} honey={(i) => (i === 0 ? 1 : honey(i))} dim={0} />
      <rect x={0} y={0} width={W} height={H} fill="url(#textVeil)" />
      <Words t={t} t0={-0.25} t1={T.hook2 - 0.25} x={CX} y={480} lines={[{text: 'Bees solved', size: 150}, {text: 'a math problem.', size: 150, hi: ['math']}]} />
      <Words t={t} t0={T.hook2} t1={T.s2 - 0.45} x={CX} y={420} lines={[{text: 'Humans needed', size: 120}, {text: 'over 2,000 years', size: 150, hi: ['2,000', 'years']}, {text: 'to prove it.', size: 120}]} />
      <Bee {...bee} s={0.62} t={t} />
    </g>
  );
};

const yearAt = (t: number) => Math.round(lerp(-36, 1999, easeInOut(clampT(t, T.roll, T.hales - 0.1))));
const S2Years: React.FC<{t: number}> = ({t}) => {
  const y = yearAt(t);
  const label = y < 0 ? `${-y} BC` : y === 0 ? '1 BC' : `${y}`;
  const stream = clampT(t, T.roll, T.hales);
  return (
    <g>
      {/* a ribbon of comb racing past while two thousand years go by */}
      <g transform={`translate(${(-stream * 4200 - (t - T.s2) * 70).toFixed(1)} 0)`} opacity={0.5}>
        {Array.from({length: 60}, (_, i) => {
          const x = 200 + i * 128;
          return <path key={i} d={path(hexPts(x, 870 + (i % 2) * 0, 64))} fill={i % 7 === 3 ? C.amber : C.cell} stroke={C.gold} strokeWidth={3} />;
        })}
      </g>
      <text x={CX} y={560} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={260} fill={C.honey} letterSpacing={-6} opacity={easeOut(clampT(t, T.bc - 0.2, T.bc + 0.2))} transform={`translate(${CX} 480) scale(${(1 + 0.025 * Math.exp(-(((t + 10) % 0.6) / 0.1))).toFixed(4)}) translate(${-CX} -480)`}>
        {label}
      </text>
      <Words t={t} t0={T.bc + 0.25} t1={T.roll - 0.2} x={CX} y={720} lines={[{text: 'A Roman scholar, Varro, writes:', size: 64}, {text: 'the hexagon holds the most.', size: 64, hi: ['hexagon']}]} />
      <Words t={t} t0={T.hales + 0.1} t1={T.s3 - 0.45} x={CX} y={720} lines={[{text: 'Thomas Hales finally proves it.', size: 64, hi: ['proves']}]} />
    </g>
  );
};

const FL = {x: 1180, y: 250, s: 580};
const S3Floor: React.FC<{t: number}> = ({t}) => {
  const box = easeOut(clampT(t, T.floor1 - 0.3, T.floor1 + 0.3));
  // walls draw in: 3 vertical, 3 horizontal
  const walls: React.ReactNode[] = [];
  for (let i = 1; i < 4; i++) {
    const kv = easeInOut(clampT(t, T.floor2 + i * 0.18, T.floor2 + 0.5 + i * 0.18));
    const kh = easeInOut(clampT(t, T.floor2 + 0.6 + i * 0.18, T.floor2 + 1.1 + i * 0.18));
    const x = FL.x + (FL.s * i) / 4;
    const y = FL.y + (FL.s * i) / 4;
    walls.push(<line key={`v${i}`} x1={x} y1={FL.y} x2={x} y2={FL.y + FL.s * kv} stroke={C.gold} strokeWidth={7} strokeLinecap="round" />);
    walls.push(<line key={`h${i}`} x1={FL.x} y1={y} x2={FL.x + FL.s * kh} y2={y} stroke={C.gold} strokeWidth={7} strokeLinecap="round" />);
  }
  const bee = flyPath(t, T.floor2 - 0.2, T.s4 + 0.3, [[2100, 300], [1500, 220], [1250, 520], [1650, 700], [1900, 380], [2300, 200]]);
  return (
    <g>
      <g opacity={box} transform={`translate(0 ${((1 - box) * 60).toFixed(1)})`}>
        <rect x={FL.x} y={FL.y} width={FL.s} height={FL.s} fill={C.cell} stroke={C.gold} strokeWidth={8} rx={6} />
        {walls}
        {Array.from({length: 16}, (_, i) => {
          const cx = i % 4;
          const cy = Math.floor(i / 4);
          const tf = T.floor2 + 1.7 + ((cx + cy) * 0.14);
          const f = easeOut(clampT(t, tf, tf + 0.6)) * 0.62;
          if (f <= 0) return null;
          const cs = FL.s / 4;
          const x0 = FL.x + cx * cs + 8;
          const yb = FL.y + (cy + 1) * cs - 8;
          const hgt = (cs - 16) * f;
          const wv = Math.sin(t * 5 + i) * 4;
          return (
            <path
              key={`r${i}`}
              d={`M${x0} ${yb} V${yb - hgt + wv} Q${x0 + (cs - 16) / 2} ${yb - hgt - wv} ${x0 + cs - 16} ${yb - hgt + wv} V${yb} Z`}
              fill={C.honey}
              opacity={0.9}
            />
          );
        })}
      </g>
      <Words t={t} t0={T.floor1} t1={T.s4 + 0.2} x={170} y={430} anchor="start" lines={[{text: 'Split a floor', size: 96}, {text: 'into equal rooms,', size: 96}]} />
      <Words t={t} t0={T.floor2} t1={T.s4 + 0.2} x={170} y={680} anchor="start" lines={[{text: 'with the least wall.', size: 96, hi: ['least', 'wall.']}]} />
      <Bee {...bee} s={0.42} t={t} />
    </g>
  );
};

// circles, packed like oranges, then grown into hexagons
const PR = 88; // packing radius = hex inradius
const S4Circles: React.FC<{t: number}> = ({t}) => {
  const drop = (i: number) => T.s4 + 0.1 + hash(i * 1.7) * 0.7;
  const grow = easeInOut(clampT(t, T.s5 + 0.1, T.s5 + 1.1)); // circles -> hexagons, gaps close
  const cells = hexGrid(CX, CY + 40, PR / (SQ3 / 2), 6);
  const A = 2 * SQ3 * PR * PR; // area of the hexagon with inradius PR
  const gapOn = easeOut(clampT(t, T.gaps, T.gaps + 0.4)) * (1 - grow);
  const panel = clampT(t, T.tiles - 0.2, T.tiles + 0.4);
  return (
    <g>
      {/* the gaps are the floor showing through */}
      <path d={path(hexPts(CX, CY + 40, PR * 7.6))} fill={C.coral} opacity={gapOn * (0.75 + 0.2 * Math.sin(t * 5))} />
      {cells.map((c, i) => {
        const k = easeOut(clampT(t, drop(i), drop(i) + 0.4));
        if (k <= 0) return null;
        const y = c.y - (1 - k) * 700;
        const rCirc = PR; // touching neighbours
        const p = morphPts(c.x, y, Math.PI * rCirc * rCirc, 0, 6, grow).map((q) => {
          // grow the circle's area up to the hexagon's as it morphs
          const s = Math.sqrt(lerp(1, A / (Math.PI * rCirc * rCirc), grow)) * (1 - 0.035 * (1 - grow) * (0.5 + 0.5 * Math.sin(t * 6 + i * 0.9)));
          return [c.x + (q[0] - c.x) * s, y + (q[1] - y) * s] as Pt;
        });
        return <path key={i} d={path(p)} fill={C.cell} stroke={C.gold} strokeWidth={5} opacity={1 - panel} />;
      })}
      <Words t={t} t0={T.s4 + 0.15} t1={T.s5 - 0.3} x={CX} y={150} lines={[{text: 'Circles?', size: 110}]} />
      <Words t={t} t0={T.gaps} t1={T.s5 - 0.3} x={CX} y={1000} lines={[{text: 'They leave gaps:', size: 72}]} />
      {t > T.waste && t < T.s5 + 0.2 && (
        <g opacity={easeOut(clampT(t, T.waste, T.waste + 0.3)) * (1 - clampT(t, T.s5 - 0.3, T.s5))}>
          <text x={CX + 330} y={1000} fontFamily={SANS} fontWeight={700} fontSize={72} fill={C.coral}>
            9% wasted
          </text>
        </g>
      )}
    </g>
  );
};

/** a tiling of regular n-gons (3, 4, 6) inside a panel */
const Tiling: React.FC<{n: 3 | 4 | 6; t: number; t0: number; x: number; y: number; w: number; h: number; A: number}> = ({n, t, t0, x, y, w, h, A}) => {
  const tiles: React.ReactNode[] = [];
  const add = (pts: Pt[], key: string, d: number) => {
    const k = easeOut(clampT(t, t0 + d, t0 + d + 0.35));
    if (k <= 0) return;
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    const sc = lerp(0.3, 1, k);
    const q = pts.map((p) => [cx + (p[0] - cx) * sc, cy + (p[1] - cy) * sc] as Pt);
    const sweep = Math.max(0, Math.sin((cx - x) * 0.012 + (cy - y) * 0.006 - t * 3.2));
    tiles.push(<path key={key} d={path(q)} fill={sweep > 0.985 ? C.amber : sweep > 0.85 ? C.cellHi : C.cell} stroke={C.gold} strokeWidth={4} strokeLinejoin="round" />);
  };
  const ox = x + w / 2;
  const oy = y + h / 2;
  const dist = (px: number, py: number) => Math.hypot(px - ox, py - oy) / 900;
  if (n === 4) {
    const s = Math.sqrt(A);
    for (let i = -4; i <= 4; i++)
      for (let j = -4; j <= 4; j++) {
        const px = ox + i * s;
        const py = oy + j * s;
        add([[px - s / 2, py - s / 2], [px + s / 2, py - s / 2], [px + s / 2, py + s / 2], [px - s / 2, py + s / 2]], `${i},${j}`, dist(px, py));
      }
  } else if (n === 3) {
    const s = Math.sqrt((4 * A) / SQ3);
    const hh = (s * SQ3) / 2;
    for (let j = -4; j <= 4; j++)
      for (let i = -6; i <= 6; i++) {
        const px = ox + (i * s) / 2;
        const py = oy + j * hh;
        const up = (i + j) % 2 === 0;
        const pts: Pt[] = up ? [[px, py - hh / 2], [px + s / 2, py + hh / 2], [px - s / 2, py + hh / 2]] : [[px - s / 2, py - hh / 2], [px + s / 2, py - hh / 2], [px, py + hh / 2]];
        add(pts, `${i},${j}`, dist(px, py));
      }
  } else {
    const r = Math.sqrt((2 * A) / (3 * SQ3));
    hexGrid(ox, oy, r, 5).forEach((c, i) => add(hexPts(c.x, c.y, r), `h${i}`, dist(c.x, c.y)));
  }
  return (
    <g>
      <clipPath id={`panel${n}`}>
        <rect x={x} y={y} width={w} height={h} rx={28} />
      </clipPath>
      <rect x={x} y={y} width={w} height={h} rx={28} fill={C.bg} />
      <g clipPath={`url(#panel${n})`}>{tiles}</g>
      <rect x={x} y={y} width={w} height={h} rx={28} fill="none" stroke={C.line} strokeWidth={3} />
    </g>
  );
};

const AREA = 2 * SQ3 * 70 * 70; // every hero shape has this area
const S5Three: React.FC<{t: number}> = ({t}) => {
  const pw = 520;
  const ph = 560;
  const y = 300;
  const xs = [CX - pw * 1.5 - 40, CX - pw / 2, CX + pw / 2 + 40];
  const labels = ['triangles', 'squares', 'hexagons'];
  const ns: (3 | 4 | 6)[] = [3, 4, 6];
  const panelIn = (i: number) => easeOut(clampT(t, T.tiles + i * 0.35 - 0.3, T.tiles + i * 0.35 + 0.2));
  return (
    <g>
      {ns.map((n, i) => {
        const k = panelIn(i);
        if (k <= 0) return null;
        return (
          <g key={n} transform={`translate(0 ${((1 - k) * 900).toFixed(1)})`}>
            <Tiling n={n} t={t} t0={T.tiles + i * 0.35} x={xs[i]} y={y} w={pw} h={ph} A={AREA * 0.8} />
            <text x={xs[i] + pw / 2} y={y + ph + 80} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={56} fill={n === 6 ? C.honey : C.cream}>
              {labels[i]}
            </text>
          </g>
        );
      })}
      <Words t={t} t0={T.three} t1={T.s6 - 0.3} x={CX} y={190} lines={[{text: 'Only 3 regular shapes fit with no gaps.', size: 76, hi: ['3', 'no', 'gaps.']}]} />
    </g>
  );
};

// the hero: three rooms of the same area unroll their walls into straight lines
const S6Unroll: React.FC<{t: number}> = ({t}) => {
  const A = AREA * 2.2;
  const shapes: {n: number; x: number; label: string}[] = [
    {n: 3, x: CX - 560, label: 'triangle'},
    {n: 4, x: CX, label: 'square'},
    {n: 6, x: CX + 560, label: 'hexagon'},
  ];
  const lineX0 = 380;
  const rowY = (i: number) => 620 + i * 140;
  const out: React.ReactNode[] = [];
  const lens = shapes.map((s) => perim(morphPts(0, 0, A, s.n, s.n, 0)));
  const sqLen = lens[1];
  shapes.forEach((s, i) => {
    const appear = easeOut(clampT(t, T.area + i * 0.15, T.area + i * 0.15 + 0.5));
    if (appear <= 0) return;
    const n = s.n;
    const R = Math.sqrt((2 * A) / (n * Math.sin((2 * Math.PI) / n)));
    const side = 2 * R * Math.sin(Math.PI / n);
    const sc = lerp(0.2, 1, appear);
    const rot0 = n === 4 ? -Math.PI / 4 - Math.PI / 2 : -Math.PI / 2;
    const v: Pt[] = Array.from({length: n}, (_, j) => {
      const a = rot0 + (j / n) * Math.PI * 2 + (n === 4 ? Math.PI / 2 : 0);
      return [s.x + R * sc * Math.cos(a), 330 + R * sc * Math.sin(a)];
    });
    const k0 = T.unroll + i * 0.45;
    const u = easeInOut(clampT(t, k0, k0 + 1.5));
    // the walls unfold like a chain of rods: every corner opens from its polygon angle to straight
    const th0 = Math.atan2(v[1][1] - v[0][1], v[1][0] - v[0][0]);
    const start: Pt = [lerp(v[0][0], lineX0, u), lerp(v[0][1], rowY(i), u)];
    const dir0 = lerp(th0, 0, u);
    const turn = ((2 * Math.PI) / n) * (1 - u);
    const chain: Pt[] = [start];
    for (let j = 0; j < n; j++) {
      const d = dir0 + j * turn;
      const L0 = side * sc * lerp(1, 1.05, u);
      const p = chain[chain.length - 1];
      chain.push([p[0] + Math.cos(d) * L0, p[1] + Math.sin(d) * L0]);
    }
    const L = side * n * 1.05;
    const hex = n === 6;
    const win = clampT(t, T.wins, T.wins + 0.4);
    const dimOther = !hex ? win * 0.55 : 0;
    out.push(
      <g key={n} opacity={1 - dimOther}>
        {u < 0.4 && <path d={path(v)} fill={C.cell} opacity={(1 - u / 0.4) * appear} />}
        <path d={path(chain, false)} fill="none" stroke={hex ? C.honey : C.gold} strokeWidth={hex ? 12 : 9} strokeLinecap="round" strokeLinejoin="round" />
        {chain.slice(1, -1).map((q, j) => (
          <circle key={j} cx={q[0]} cy={q[1]} r={hex ? 8 : 6.5} fill={C.bg} stroke={hex ? C.honey : C.gold} strokeWidth={4} />
        ))}
        {u > 0.97 &&
          [0, 0.5].map((ph) => {
            const g = ((t * 0.55 + i * 0.21 + ph) % 1) * L;
            return <rect key={ph} x={lineX0 + g - 40} y={rowY(i) - (hex ? 6 : 4.5)} width={80} height={hex ? 12 : 9} rx={6} fill="url(#glint)" />;
          })}
        {u > 0.85 && (
          <g opacity={clampT(t, k0 + 1.3, k0 + 1.6)}>
            <text x={lineX0 - 30} y={rowY(i) + 18} textAnchor="end" fontFamily={SANS} fontWeight={700} fontSize={48} fill={hex ? C.honey : C.cream}>
              {s.label}
            </text>
            <text x={lineX0 + L + 36} y={rowY(i) + 18} fontFamily={SANS} fontWeight={700} fontSize={48} fill={i === 1 ? C.cream : i === 0 ? C.coral : C.honey}>
              {i === 1 ? '100' : `${Math.round((lens[i] / sqLen) * 100)}`}
            </text>
          </g>
        )}
      </g>,
    );
  });
  const scaleNote = clampT(t, T.unroll + 3.0, T.unroll + 3.4);
  if (scaleNote > 0)
    out.push(
      <text key="note" x={lineX0} y={rowY(2) + 110} fontFamily={SANS} fontWeight={700} fontSize={34} fill={C.cream} opacity={scaleNote * 0.6}>
        wall length, square = 100
      </text>,
    );
  // the 7% gap, measured
  const gap = easeOut(clampT(t, T.wins + 0.5, T.wins + 1.1));
  const hexEnd = lineX0 + lens[2] * 1.05 * 0.9998;
  const sqEnd = lineX0 + lens[1] * 1.05;
  return (
    <g>
      {out}
      {gap > 0 && (
        <g opacity={gap}>
          <line x1={hexEnd} y1={rowY(2) - 40} x2={hexEnd} y2={rowY(1) - 30} stroke={C.honey} strokeWidth={3} strokeDasharray="8 8" />
          <line x1={sqEnd} y1={rowY(1) + 30} x2={sqEnd} y2={rowY(2) + 40} stroke={C.cream} strokeWidth={3} strokeDasharray="8 8" />
          <rect x={hexEnd} y={rowY(2) - 16} width={(sqEnd - hexEnd) * gap} height={32} fill={C.honey} opacity={0.35} />
        </g>
      )}
      <Words t={t} t0={T.area} t1={T.unroll + 1.6} x={CX} y={130} lines={[{text: 'Give every room the same area.', size: 72}]} />
      <Words t={t} t0={T.unroll + 1.8} t1={T.wins - 0.3} x={CX} y={130} lines={[{text: 'Now unroll the walls.', size: 72, hi: ['unroll']}]} />
      <Words t={t} t0={T.wins} t1={T.s8 - 0.4} x={CX} y={130} lines={[{text: 'The hexagon uses 7% less wall', size: 80, hi: ['7%', 'less']}, {text: 'than the square.', size: 80}]} />
    </g>
  );
};

const S8Curvy: React.FC<{t: number}> = ({t}) => {
  const wig = easeInOut(clampT(t, T.curvy + 0.4, T.curvy + 1.4)) * (1 - easeInOut(clampT(t, T.proof, T.proof + 0.8)));
  // wall length relative to straight walls, measured on one edge shape
  const bez = (sg: number) => {
    // length of one wall bowed into an S (control points at 1/4 and 3/4, offset sg), straight wall = 1
    let L = 0;
    let px = 0;
    let py = 0;
    for (let i = 1; i <= 64; i++) {
      const u = i / 64;
      const x = 3 * (1 - u) * (1 - u) * u * 0.25 + 3 * (1 - u) * u * u * 0.75 + u * u * u;
      const y = 3 * (1 - u) * (1 - u) * u * sg - 3 * (1 - u) * u * u * sg;
      L += Math.hypot(x - px, y - py);
      px = x;
      py = y;
    }
    return L;
  };
  const extra = Math.round((bez(0.35 * wig) - 1) * 100);
  return (
    <g>
      <Comb t={t} r={96} cx={CX} cy={CY + 60} rings={6} born={(ring) => T.s8 - 0.6 + ring * 0.04} wiggle={wig * (0.85 + 0.15 * Math.sin(t * 4))} wall={6} honey={(i) => clampT(t, T.proof + 0.6 + hash(i * 2.3) * 2.2, T.proof + 1.4 + hash(i * 2.3) * 2.2) * (0.35 + 0.5 * hash(i))} />
      <rect x={0} y={0} width={W} height={H} fill="url(#textVeil)" />
      <Words t={t} t0={T.curvy} t1={T.longer - 0.25} x={CX} y={200} lines={[{text: 'What about curvy walls?', size: 96, hi: ['curvy']}]} />
      <Words t={t} t0={T.longer} t1={T.proof - 0.25} x={CX} y={200} lines={[{text: 'Longer.', size: 120, color: C.coral}]} />
      {wig > 0.02 && t < T.proof + 0.6 && (
        <text x={CX} y={980} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={72} fill={C.coral} opacity={clamp01(wig * 3)}>
          +{extra}% wall
        </text>
      )}
      <Words t={t} t0={T.proof} t1={T.s9 - 0.35} x={CX} y={170} lines={[{text: 'In 1999, Hales proved it:', size: 80}, {text: 'nothing beats the hexagon.', size: 80, hi: ['nothing', 'hexagon.']}]} />
    </g>
  );
};

const S9Wax: React.FC<{t: number}> = ({t}) => {
  const cells = hexGrid(CX, CY, R0, 9);
  const flood = (i: number) => {
    const c = cells[i];
    const d = Math.hypot(c.x - 200, c.y - 900) / 2200;
    return clampT(t, T.wax + 0.4 + d * 1.8, T.wax + 1.2 + d * 1.8);
  };
  const bee = flyPath(t, T.wax - 0.2, T.loop + 0.6, [[-250, 300], [500, 420], [1100, 260], [1500, 520], [1000, 760], [960, 600]]);
  return (
    <g>
      <Comb t={t} r={R0} cx={CX} cy={CY} rings={9} born={(ring) => T.s9 - 0.5 + ring * 0.03} honey={flood} wall={lerp(4, 7, clampT(t, T.wax, T.wax + 0.6))} />
      <rect x={0} y={0} width={W} height={H} fill="url(#textVeil)" />
      <Words t={t} t0={T.wax} t1={T.build - 0.3} x={CX} y={480} lines={[{text: 'Less wall', size: 140}, {text: 'means less wax.', size: 140, hi: ['wax.']}]} />
      <Words t={t} t0={T.build} t1={T.loop - 0.1} x={CX} y={540} lines={[{text: 'Bees just build it.', size: 140, hi: ['build']}]} />
      <Bee {...bee} s={0.6} t={t} />
    </g>
  );
};

/* ------------------------------------------------------------------ the living background */
const BEAT = 0.6; // 100 BPM; DUR / BEAT = 89 beats, so the backdrop loops with the film
const TAU = Math.PI * 2;
/** every background motion repeats exactly once per film length, so the last frame meets the first */
const per = (t: number, cycles: number) => (TAU * cycles * t) / DUR;
const amb = (t: number, k: number): Pt => [CX + Math.sin(per(t, 2 + k) + k * 2) * 900, CY + Math.sin(per(t, 3 + k) + k) * 420];
const Backdrop: React.FC<{t: number}> = ({t}) => {
  const layers = [
    {r: 150, cyc: 3, op: 0.32},
    {r: 270, cyc: 3, op: 0.18},
  ];
  const b = Math.floor(t / BEAT + 1e-6);
  const since = t - b * BEAT;
  const bb = ((b % 89) + 89) % 89;
  const origin: Pt = [200 + hash(bb) * 1520, 150 + hash(bb + 9) * 780];
  const bees = [0, 1].map((k) => amb(t, k));
  const out: React.ReactNode[] = [];
  layers.forEach((L, li) => {
    const w = L.r * SQ3;
    const h = L.r * 3;
    // drift by whole lattice periods per film: (li + 2) cells across, 1 down
    const ox = ((((t / DUR) * w * (li + 2)) % w) + w) % w;
    const oy = (((-(t / DUR) * h) % h) + h) % h;
    for (let j = -1; j * L.r * 1.5 < H + L.r * 2; j++) {
      for (let i = -1; i * w < W + w; i++) {
        const x = i * w + (j % 2 ? w / 2 : 0) + ox - w;
        const y = j * L.r * 1.5 + oy - h / 2;
        const dRip = Math.hypot(x - origin[0], y - origin[1]);
        const ring = Math.exp(-Math.pow((dRip - since * 1700) / 160, 2)) * Math.exp(-since * 1.6);
        const near = Math.max(...bees.map((p) => Math.exp(-Math.pow(Math.hypot(x - p[0], y - p[1]) / 230, 2))));
        const lit = Math.min(1, ring * 0.9 + near * 0.8);
        out.push(
          <g key={`${li}-${i}-${j}`}>
            {lit > 0.04 && <path d={path(hexPts(x, y, L.r * 0.93))} fill={C.honey} opacity={lit * 0.16 * (li ? 0.7 : 1)} />}
            <path d={path(hexPts(x, y, L.r * 0.93))} fill="none" stroke={lit > 0.1 ? C.gold : C.line} strokeWidth={li ? 3 : 2} opacity={L.op + lit * 0.35} />
          </g>,
        );
      }
    }
  });
  // pollen: drifting up a whole number of screens per film, swaying, some catching the light
  for (let i = 0; i < 70; i++) {
    const laps = 1 + Math.floor(hash(i) * 3);
    const span = H + 100;
    const x = ((hash(i + 3) * W + Math.sin(per(t, 8 + (i % 5)) + i) * 30) % W + W) % W;
    const y = ((hash(i + 7) * span - (t / DUR) * span * laps) % span + span) % span - 50;
    const tw = 0.35 + 0.65 * Math.max(0, Math.sin(per(t, 30 + (i % 13)) + i));
    out.push(<circle key={`p${i}`} cx={x} cy={y} r={1.5 + hash(i + 1) * 2.6} fill={C.gold} opacity={0.25 + 0.45 * tw} />);
  }
  bees.forEach((p, k) => {
    const pv = amb(t - 0.05, k);
    out.push(
      <g key={`b${k}`} opacity={0.75}>
        <Bee x={p[0]} y={p[1]} s={0.14} t={t + k} flip={p[0] < pv[0]} />
      </g>,
    );
  });
  return <g>{out}</g>;
};

/* ------------------------------------------------------------------ portal: zoom into the centre cell, the next scene is inside it */
const Portal: React.FC<{t: number; t0: number; dur?: number; from: React.ReactNode; to: React.ReactNode; id: string}> = ({t, t0, dur = 0.8, from, to, id}) => {
  const k = easeInOut(clampT(t, t0, t0 + dur));
  if (k <= 0) return <g>{from}</g>;
  if (k >= 1) return <g>{to}</g>;
  const z = Math.exp(lerp(0, Math.log(18), k));
  const r = R0 * z;
  const inner = lerp(0.5, 1, easeOut(k));
  return (
    <g>
      <g transform={`translate(${CX} ${CY}) scale(${z.toFixed(4)}) translate(${-CX} ${-CY})`}>{from}</g>
      <clipPath id={`portal-${id}`}>
        <path d={path(hexPts(CX, CY, r * 0.9))} />
      </clipPath>
      <g clipPath={`url(#portal-${id})`}>
        <rect width={W} height={H} fill={C.bg} />
        <Backdrop t={t} />
        <g transform={`translate(${CX} ${CY}) scale(${inner.toFixed(4)}) translate(${-CX} ${-CY})`}>{to}</g>
      </g>
      <path d={path(hexPts(CX, CY, r * 0.9))} fill="none" stroke={C.gold} strokeWidth={4 * z * 0.6} opacity={1 - k} />
    </g>
  );
};

export const CombVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const t = (frame + SUB) / FPS;
  const grainSeed = Math.floor(frame / 2) % 97;
  let scene: React.ReactNode;
  if (t < T.s2 + 1) scene = <Portal id="a" t={t} t0={T.s2 - 0.35} from={<S1Hook t={t} />} to={<S2Years t={t} />} />;
  else if (t < T.s3 + 1) scene = <Portal id="b" t={t} t0={T.s3 - 0.35} from={<S2Years t={t} />} to={<S3Floor t={t} />} />;
  else if (t < T.s4) scene = <S3Floor t={t} />;
  else if (t < T.s5 + 1.2) scene = (
    <g>
      <g opacity={1 - clampT(t, T.s4 - 0.1, T.s4 + 0.3)}>
        <S3Floor t={t} />
      </g>
      <S4Circles t={t} />
      {t > T.tiles - 0.4 && <S5Three t={t} />}
    </g>
  );
  else if (t < T.s6 + 1) scene = <Portal id="c" t={t} t0={T.s6 - 0.35} from={<S5Three t={t} />} to={<S6Unroll t={t} />} />;
  else if (t < T.s8 + 1) scene = <Portal id="d" t={t} t0={T.s8 - 0.35} from={<S6Unroll t={t} />} to={<S8Curvy t={t} />} />;
  else if (t < T.s9 + 1) scene = <Portal id="e" t={t} t0={T.s9 - 0.35} from={<S8Curvy t={t} />} to={<S9Wax t={t} />} />;
  else scene = <Portal id="f" t={t} t0={T.loop} dur={DUR - T.loop} from={<S9Wax t={t} />} to={<S1Hook t={0} />} />;
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <Fonts />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="textVeil" cx="50%" cy="46%" r="55%">
            <stop offset="0%" stopColor={C.bg} stopOpacity={0.82} />
            <stop offset="60%" stopColor={C.bg} stopOpacity={0.45} />
            <stop offset="100%" stopColor={C.bg} stopOpacity={0} />
          </radialGradient>
          <linearGradient id="glint" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor={C.cream} stopOpacity={0} />
            <stop offset="0.5" stopColor={C.cream} stopOpacity={0.95} />
            <stop offset="1" stopColor={C.cream} stopOpacity={0} />
          </linearGradient>
          <radialGradient id="vig" cx="50%" cy="50%" r="72%">
            <stop offset="62%" stopColor="#000" stopOpacity={0} />
            <stop offset="100%" stopColor="#000" stopOpacity={0.45} />
          </radialGradient>
          <filter id="grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves={1} seed={grainSeed} />
            <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -1.4 0.82" />
          </filter>
        </defs>
        <rect width={W} height={H} fill={C.bg} />
        <Backdrop t={t} />
        <g transform={`translate(${(CX + Math.sin(per(t, 5)) * 9).toFixed(2)} ${(CY + Math.cos(per(t, 4)) * 6).toFixed(2)}) scale(${(1.012 + 0.012 * Math.sin(per(t, 7))).toFixed(5)}) translate(${-CX} ${-CY})`}>{scene}</g>
        <rect width={W} height={H} fill="url(#vig)" />
        <rect width={W} height={H} filter="url(#grain)" opacity={0.07} style={{mixBlendMode: 'overlay'}} />
      </svg>
    </AbsoluteFill>
  );
};
