import React from 'react';
import {Pt, Shape, Stroke, ellipsePts, linePts, rectPts} from './ink';
import {P, clamp01, easeOut, hash2} from './lib';

/* Episode 2 props: everything is a pure function of t. */

/** Insert points along each edge so the smoothing spline keeps corners crisp (houses, roofs, steps). */
export const sharp = (pts: Pt[], step = 50, closed = true): Pt[] => {
  const out: Pt[] = [];
  const n = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const m = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let j = 0; j < m; j++) out.push([a[0] + ((b[0] - a[0]) * j) / m, a[1] + ((b[1] - a[1]) * j) / m]);
  }
  if (!closed) out.push(pts[pts.length - 1]);
  return out;
};

/** Rain streaks falling inside a box (clip it with a Window). */
export const Rain: React.FC<{t: number; x: number; y: number; w: number; h: number; n?: number; seed?: number}> = ({t, x, y, w, h, n = 26, seed = 1}) => (
  <g>
    {Array.from({length: n}).map((_, i) => {
      const sp = 520 + hash2(seed, i) * 260;
      const px = x + hash2(seed + 1, i) * w;
      const py = y + (((hash2(seed + 2, i) * h + t * sp) % (h + 60)) - 30);
      return <line key={i} x1={px} y1={py} x2={px - 6} y2={py + 26} stroke="#E8F1F4" strokeWidth={3} strokeLinecap="round" opacity={0.85} />;
    })}
  </g>
);

/** A drip from the ceiling into a pot: one drop every `every` seconds after `t0`, a ripple when it lands. */
export const Drip: React.FC<{t: number; t0: number; x: number; y0: number; y1: number; every?: number}> = ({t, t0, x, y0, y1, every = 1.15}) => {
  if (t < t0) return null;
  const ph = ((t - t0) % every) / every;
  const fall = Math.min(1, ph / 0.55);
  const dy = y0 + (y1 - y0) * fall * fall;
  const land = ph > 0.55 ? (ph - 0.55) / 0.45 : -1;
  return (
    <g>
      <Shape pts={ellipsePts(x, y0 + 4, 26, 10, 1501, 12)} fill={P.paperShade} ink={null} misreg={0} seed={1501} />
      {fall < 1 ? <Shape pts={[[x, dy - 28], [x + 13, dy], [x, dy + 12], [x - 13, dy]]} fill={P.rain} w={3} seed={1502} misreg={0} /> : null}
      {land >= 0 ? <ellipse cx={x} cy={y1 + 4} rx={12 + land * 46} ry={4 + land * 9} fill="none" stroke={P.rain} strokeWidth={3} opacity={1 - land} /> : null}
    </g>
  );
};

/** Metal cooking pot on the floor (catches the drip). */
export const Pot: React.FC<{x: number; y: number; level: number; t: number}> = ({x, y, level, t}) => (
  <g>
    <Shape pts={[[x - 96, y - 110], [x + 96, y - 110], [x + 84, y], [x - 84, y]]} fill="#A9B2B8" seed={1510} />
    <Shape pts={[[x - 84, y - 110 + 100 * (1 - level) + Math.sin(t * 3) * 2], [x + 84, y - 110 + 100 * (1 - level) - Math.sin(t * 3) * 2], [x + 80, y - 10], [x - 80, y - 10]]} fill={P.rain} ink={null} seed={1511} misreg={0} fillOpacity={0.7} />
    <Shape pts={ellipsePts(x, y - 110, 98, 14, 1512, 16)} fill={null as unknown as string} seed={1512} w={5} />
    <Shape pts={rectPts(x - 140, y - 96, 46, 20, 1513, 6)} fill="#7D868C" seed={1513} />
    <Shape pts={rectPts(x + 94, y - 96, 46, 20, 1514, 6)} fill="#7D868C" seed={1514} />
  </g>
);

/** Autumn tree with a few leaves falling and wrapping. */
export const Tree: React.FC<{x: number; y: number; t: number; s?: number}> = ({x, y, t, s = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <Shape pts={[[-26, 0], [-18, -300], [-60, -380], [-40, -392], [0, -330], [40, -400], [58, -386], [20, -300], [28, 0]]} fill="#7A5A3E" seed={1520} />
    {[
      [-110, -420, 120],
      [20, -500, 140],
      [130, -410, 110],
      [-30, -360, 100],
    ].map(([cx, cy, r], i) => (
      <Shape key={i} pts={ellipsePts(cx + Math.sin(t * 0.8 + i) * 3, cy, r, r * 0.8, 1521 + i, 16)} fill={i % 2 ? P.leaf : P.leafB} seed={1521 + i} />
    ))}
  </g>
);

export const Leaves: React.FC<{t: number; n?: number; seed?: number; x0?: number; w?: number}> = ({t, n = 14, seed = 7, x0 = 0, w = 1920}) => (
  <g>
    {Array.from({length: n}).map((_, i) => {
      const sp = 60 + hash2(seed, i) * 50;
      const py = ((hash2(seed + 1, i) * 1200 + t * sp) % 1200) - 80;
      const px = x0 + hash2(seed + 2, i) * w + Math.sin(t * 1.3 + i) * 40 + t * 12;
      const rot = t * (40 + i * 7) + i * 50;
      const xx = ((px % (w + 100)) + w + 100) % (w + 100) + x0 - 50;
      return (
        <g key={i} transform={`translate(${xx},${py}) rotate(${rot})`}>
          <Shape pts={[[-16, 0], [0, -9], [16, 0], [0, 9]]} fill={i % 3 ? P.leaf : P.leafB} w={2.6} seed={1540 + i} misreg={1} />
        </g>
      );
    })}
  </g>
);

export const Mailbox: React.FC<{x: number; y: number; flag: number}> = ({x, y, flag}) => (
  <g>
    <Shape pts={rectPts(x - 12, y - 260, 24, 260, 1560, 3)} fill={P.wood} seed={1560} />
    <Shape pts={[[x - 110, y - 250], [x - 110, y - 340], [x - 90, y - 380], [x + 90, y - 380], [x + 110, y - 340], [x + 110, y - 250]]} fill="#5D7FA0" seed={1561} />
    <Stroke pts={[[x - 110, y - 340], [x + 110, y - 340]]} w={3.5} seed={1562} />
    <g transform={`rotate(${-80 * flag} ${x + 110} ${y - 300})`}>
      <Shape pts={rectPts(x + 104, y - 360, 14, 70, 1563, 3)} fill={P.coral} seed={1563} w={3.5} />
      <Shape pts={rectPts(x + 104, y - 372, 44, 26, 1564, 4)} fill={P.coral} seed={1564} w={3.5} />
    </g>
  </g>
);

/** Rubber stamp that lands with a squash (k 0..1). */
export const Stamp: React.FC<{x: number; y: number; k: number; w: number; h: number; color?: string; rot?: number; seed?: number}> = ({x, y, k, w, h, color = P.berry, rot = -8, seed = 1570}) => {
  if (k <= 0) return null;
  const s = k < 1 ? 1.5 - 0.5 * easeOut(k) : 1;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} opacity={clamp01(k * 3)}>
      <Shape pts={rectPts(-w / 2, -h / 2, w, h, seed, 10)} fill={null as unknown as string} ink={color} w={7} seed={seed} />
      <Shape pts={rectPts(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24, seed + 1, 8)} fill={null as unknown as string} ink={color} w={3.5} seed={seed + 1} />
    </g>
  );
};

/** Wall calendar page; the year/month text is placed by the scene. */
export const CalendarPage: React.FC<{x: number; y: number; w?: number; h?: number; seed?: number; rot?: number}> = ({x, y, w = 200, h = 220, seed = 1580, rot = 0}) => (
  <g transform={`rotate(${rot} ${x + w / 2} ${y + h / 2})`}>
    <Shape pts={rectPts(x + 8, y + 10, w, h, seed + 9, 10)} fill={P.shadow} ink={null} misreg={0} seed={seed + 9} />
    <Shape pts={rectPts(x, y, w, h, seed, 10)} fill={P.white} seed={seed} />
    <Shape pts={rectPts(x, y, w, 56, seed + 1, 8)} fill={P.coral} seed={seed + 1} />
    {[0, 1, 2].map((r) =>
      [0, 1, 2, 3].map((c) => <rect key={`${r}${c}`} x={x + 22 + c * 42} y={y + 130 + r * 26} width={22} height={12} fill={P.paperShade} />),
    )}
  </g>
);

/** Heavy block that drops onto a step (k from the drop spring). */
export const Weight: React.FC<{x: number; y: number; w: number; h: number; seed?: number; fill?: string}> = ({x, y, w, h, seed = 1590, fill = P.berry}) => (
  <g>
    <Shape pts={[[x + w * 0.2, y], [x + w * 0.8, y], [x + w, y + h], [x, y + h]]} fill={fill} seed={seed} w={5.5} />
    <Shape pts={ellipsePts(x + w / 2, y - 16, w * 0.16, 18, seed + 1, 12)} fill={null as unknown as string} w={6} seed={seed + 1} />
  </g>
);

/** Five-step staircase carved into a cliff. Returns the top-left corner of each tread via `treads`. */
export const STAIR = {x: 520, y: 900, sw: 230, sh: 120};
export const treadAt = (i: number): Pt => [STAIR.x + i * STAIR.sw, STAIR.y - (i + 1) * STAIR.sh];
export const Staircase: React.FC<{k: number; seed?: number}> = ({k, seed = 1600}) => {
  const n = 5;
  const pts: Pt[] = [[STAIR.x - 600, STAIR.y]];
  pts.push([STAIR.x, STAIR.y]);
  for (let i = 0; i < n; i++) {
    const [tx, ty] = treadAt(i);
    pts.push([tx + (i % 2) * 3, ty]);
    pts.push([tx + STAIR.sw, ty + (i % 2) * 2]);
  }
  const [lx, ly] = treadAt(n - 1);
  const body: Pt[] = [...pts, [lx + STAIR.sw + 140, ly], [lx + STAIR.sw + 160, 1200], [STAIR.x - 600, 1200]];
  return (
    <g opacity={clamp01(k * 4)}>
      <Shape pts={body} fill={P.earth} seed={seed} w={6} draw={1} />
      {Array.from({length: n}).map((_, i) => {
        const [tx, ty] = treadAt(i);
        return <Stroke key={i} pts={linePts([tx + 8, ty + 10], [tx + STAIR.sw - 8, ty + 12], 5, 2, seed + 10 + i)} w={6} color={P.grass} seed={seed + 10 + i} />;
      })}
    </g>
  );
};

/** Porch swing hanging from two chains, swaying. */
export const Swing: React.FC<{x: number; y: number; t: number; w?: number}> = ({x, y, t, w = 760}) => {
  const a = Math.sin(t * 1.1) * 1.6;
  return (
    <g transform={`rotate(${a} ${x} ${y - 560})`}>
      <Stroke pts={[[x - w / 2 + 30, y - 560], [x - w / 2 + 30, y - 120]]} w={4} color="#6E6A64" seed={1620} taper={false} />
      <Stroke pts={[[x + w / 2 - 30, y - 560], [x + w / 2 - 30, y - 120]]} w={4} color="#6E6A64" seed={1621} taper={false} />
      <Shape pts={rectPts(x - w / 2, y - 130, w, 40, 1622, 8)} fill={P.wood} seed={1622} />
      <Shape pts={rectPts(x - w / 2 + 10, y - 260, w - 20, 26, 1623, 8)} fill={P.wood} seed={1623} />
    </g>
  );
};

/** Birthday cake with candles (the "63"). */
export const Cake: React.FC<{x: number; y: number; t: number}> = ({x, y, t}) => (
  <g>
    <Shape pts={rectPts(x - 110, y - 120, 220, 120, 1630, 16)} fill={P.berryPale} seed={1630} />
    <Shape pts={[[x - 112, y - 120], [x + 112, y - 120], [x + 100, y - 92], [x + 60, y - 104], [x + 20, y - 88], [x - 30, y - 104], [x - 70, y - 88], [x - 108, y - 100]]} fill={P.white} seed={1631} w={4} />
    {[-50, 0, 50].map((dx, i) => (
      <g key={i}>
        <Shape pts={rectPts(x + dx - 7, y - 170, 14, 50, 1632 + i, 3)} fill={P.mustardPale} seed={1632 + i} w={3} />
        <Shape pts={[[x + dx, y - 196 + Math.sin(t * 9 + i) * 2], [x + dx + 8, y - 178], [x + dx, y - 170], [x + dx - 8, y - 178]]} fill={P.mustard} seed={1640 + i} w={2.5} misreg={0} />
      </g>
    ))}
  </g>
);

/** Plain door with a handle; the label is a Tag placed by the scene. */
export const Door: React.FC<{x: number; y: number; open: number}> = ({x, y, open}) => (
  <g>
    <Shape pts={rectPts(x - 170, y - 560, 340, 560, 1650, 8)} fill="#FFF6DD" seed={1650} />
    <g transform={`translate(${x - 170},0) scale(${1 - 0.55 * open},1) translate(${-(x - 170)},0)`}>
      <Shape pts={rectPts(x - 160, y - 550, 320, 550, 1651, 8)} fill="#5D7FA0" seed={1651} />
      <Shape pts={rectPts(x - 120, y - 500, 240, 190, 1652, 8)} fill={null as unknown as string} w={3.5} seed={1652} />
      <Shape pts={ellipsePts(x + 110, y - 270, 16, 16, 1653, 10)} fill={P.gold} seed={1653} w={3} />
    </g>
  </g>
);

/** Picket fence row (background on the porch/yard). */
export const Fence: React.FC<{x0: number; x1: number; y: number; seed?: number}> = ({x0, x1, y, seed = 1660}) => (
  <g>
    <Stroke pts={linePts([x0, y - 70], [x1, y - 66], 10, 0, seed)} w={5} seed={seed} />
    {Array.from({length: Math.floor((x1 - x0) / 70)}).map((_, i) => (
      <Shape key={i} pts={[[x0 + i * 70, y], [x0 + i * 70, y - 120], [x0 + i * 70 + 20, y - 140], [x0 + i * 70 + 40, y - 120], [x0 + i * 70 + 40, y]]} fill={P.white} seed={seed + 1 + i} w={4} />
    ))}
  </g>
);

/** Fireflies / dust specks on a porch evening. */
export const Specks: React.FC<{t: number; x: number; y: number; w: number; h: number; n?: number; seed?: number; color?: string}> = ({t, x, y, w, h, n = 18, seed = 3, color = P.mustardPale}) => (
  <g>
    {Array.from({length: n}).map((_, i) => {
      const px = x + hash2(seed, i) * w + Math.sin(t * 0.7 + i * 1.7) * 30;
      const py = y + hash2(seed + 1, i) * h + Math.cos(t * 0.6 + i) * 20;
      const tw = 0.3 + 0.7 * Math.abs(Math.sin(t * 1.4 + i * 2.1));
      return <circle key={i} cx={px} cy={py} r={4 + hash2(seed + 2, i) * 3} fill={color} opacity={tw} />;
    })}
  </g>
);
