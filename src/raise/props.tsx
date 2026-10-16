import React from 'react';
import {Hatch, Pt, Shape, Stroke, ellipsePts, linePts, rectPts} from './ink';
import {FPS, H, P, W, clamp01, hash, hash2} from './lib';

/* ---------- living background bits ---------- */

/** Dust motes drifting slowly through a light shaft (deterministic). */
export const Dust: React.FC<{t: number; x: number; y: number; w: number; h: number; n?: number; seed?: number; color?: string}> = ({
  t,
  x,
  y,
  w,
  h,
  n = 34,
  seed = 1,
  color = '#FFF6DA',
}) => (
  <g>
    {Array.from({length: n}).map((_, i) => {
      const sx = hash2(seed, i);
      const sy = hash2(seed + 1, i);
      const sp = 6 + hash2(seed + 2, i) * 14;
      const px = x + ((sx * w + t * sp * (hash2(seed + 3, i) - 0.4)) % w + w) % w;
      const py = y + ((sy * h - t * sp * 0.6) % h + h) % h;
      const r = 1.6 + hash2(seed + 4, i) * 2.6;
      const tw = 0.45 + 0.55 * Math.abs(Math.sin(t * (0.6 + sx) + i));
      return <circle key={i} cx={px} cy={py} r={r} fill={color} opacity={0.8 * tw} />;
    })}
  </g>
);

/** Window light shaft polygon. */
export const LightShaft: React.FC<{pts: Pt[]; t: number; color?: string}> = ({pts, t, color = '#FFF3CF'}) => (
  <polygon points={pts.map((p) => p.join(',')).join(' ')} fill={color} opacity={0.32 + 0.04 * Math.sin(t * 0.7)} />
);

/** Puffy hand-drawn cloud drifting horizontally and wrapping. */
export const Cloud: React.FC<{x: number; y: number; s: number; seed: number; fill?: string}> = ({x, y, s, seed, fill = P.cloud}) => {
  const bumps: [number, number, number][] = [
    [-60, 0, 38],
    [-20, -24, 46],
    [30, -18, 40],
    [66, 4, 32],
    [0, 10, 44],
  ];
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      {bumps.map(([bx, by, r], i) => (
        <Shape key={i} pts={ellipsePts(bx, by, r, r * 0.8, seed + i, 12)} fill={fill} w={3.2} seed={seed + i} misreg={1.5} />
      ))}
      <Shape pts={rectPts(-80, -6, 170, 40, seed + 9, 18)} fill={fill} ink={null} seed={seed + 9} misreg={0} />
    </g>
  );
};

export const Clouds: React.FC<{t: number; y?: number; n?: number; speed?: number; seed?: number; s?: number}> = ({t, y = 120, n = 5, speed = 14, seed = 50, s = 1}) => (
  <g>
    {Array.from({length: n}).map((_, i) => {
      const span = W + 500;
      const x = ((hash2(seed, i) * span + t * speed * (0.7 + hash2(seed + 1, i) * 0.6)) % span) - 250;
      return <Cloud key={i} x={x} y={y + hash2(seed + 2, i) * 150} s={s * (0.7 + hash2(seed + 3, i) * 0.6)} seed={seed * 10 + i * 13} />;
    })}
  </g>
);

/** Wall clock with a ticking second hand (on whole seconds) and a tiny tick wobble. */
export const Clock: React.FC<{x: number; y: number; r?: number; t: number}> = ({x, y, r = 54, t}) => {
  const sec = Math.floor(t);
  const wob = Math.max(0, 1 - (t - sec) * 8) * 3;
  const a = (sec * 6 + wob) * (Math.PI / 180);
  return (
    <g>
      <Shape pts={ellipsePts(x, y, r, r, 901, 20)} fill={P.white} seed={901} w={5} />
      {Array.from({length: 12}).map((_, i) => {
        const ang = (i / 12) * Math.PI * 2;
        return <circle key={i} cx={x + Math.cos(ang) * r * 0.78} cy={y + Math.sin(ang) * r * 0.78} r={2.2} fill={P.ink} />;
      })}
      <Stroke pts={[[x, y], [x + Math.sin(0.9) * r * 0.45, y - Math.cos(0.9) * r * 0.45]]} w={5} seed={902} />
      <Stroke pts={[[x, y], [x + Math.sin(3.2) * r * 0.62, y - Math.cos(3.2) * r * 0.62]]} w={4} seed={903} />
      <Stroke pts={[[x, y], [x + Math.sin(a) * r * 0.72, y - Math.cos(a) * r * 0.72]]} w={2.6} color={P.coral} seed={904} taper={false} />
    </g>
  );
};

/** Window with blinds. */
export const Window: React.FC<{x: number; y: number; w: number; h: number; seed?: number; sky?: string; blinds?: boolean; children?: React.ReactNode}> = ({
  x,
  y,
  w,
  h,
  seed = 70,
  sky = P.sky,
  blinds = true,
  children,
}) => (
  <g>
    <Shape pts={rectPts(x, y, w, h, seed, 6)} fill={sky} seed={seed} w={5} />
    <clipPath id={`win${seed}`}>
      <rect x={x + 6} y={y + 6} width={w - 12} height={h - 12} />
    </clipPath>
    <g clipPath={`url(#win${seed})`}>{children}</g>
    {blinds
      ? Array.from({length: Math.floor(h / 28)}).map((_, i) => (
          <Stroke key={i} pts={linePts([x + 6, y + 18 + i * 28], [x + w - 6, y + 20 + i * 28], 4, 0, seed + i)} w={3} color={P.tealLight} seed={seed + i} taper={false} />
        ))
      : null}
    <Stroke pts={linePts([x + w / 2, y], [x + w / 2 + 2, y + h], 6, 0, seed + 40)} w={5} seed={seed + 40} />
    <Stroke pts={linePts([x, y + h / 2], [x + w, y + h / 2 + 2], 6, 0, seed + 41)} w={5} seed={seed + 41} />
  </g>
);

/** Potted plant whose leaves sway. */
export const Plant: React.FC<{x: number; y: number; t: number; s?: number}> = ({x, y, t, s = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    {[-1, -0.4, 0.3, 0.9].map((d, i) => {
      const sway = Math.sin(t * 1.1 + i) * 4;
      const tip: Pt = [d * 70 + sway, -150 - i * 18];
      return (
        <Shape key={i} pts={[[0, -50], [d * 30 + sway * 0.5, -100 - i * 10], tip, [d * 40 + 18 + sway * 0.5, -96 - i * 8]]} fill={i % 2 ? P.grass : '#86B25C'} seed={700 + i} w={3.5} />
      );
    })}
    <Shape pts={[[-48, -56], [48, -56], [36, 30], [-36, 30]]} fill={P.coral} seed={710} />
  </g>
);

/* ---------- money objects ---------- */

export const Coin: React.FC<{x: number; y: number; r?: number; seed?: number; rot?: number}> = ({x, y, r = 16, seed = 1, rot = 0}) => (
  <g transform={`rotate(${rot} ${x} ${y})`}>
    <Shape pts={ellipsePts(x, y, r, r * 0.92, seed, 12)} fill={P.gold} w={3} seed={seed} misreg={1.2} amp={0.7} />
    <Stroke pts={[[x - r * 0.15, y - r * 0.45], [x - r * 0.15, y + r * 0.45]]} w={2.4} seed={seed + 1} taper={false} />
  </g>
);

export const Bill: React.FC<{x: number; y: number; w?: number; h?: number; seed?: number; rot?: number}> = ({x, y, w = 150, h = 70, seed = 1, rot = 0}) => (
  <g transform={`rotate(${rot} ${x + w / 2} ${y + h / 2})`}>
    <Shape pts={rectPts(x, y, w, h, seed, 6)} fill={P.bill} seed={seed} w={4} />
    <Shape pts={ellipsePts(x + w / 2, y + h / 2, h * 0.28, h * 0.28, seed + 1, 12)} fill="#7FB06E" w={3} seed={seed + 1} />
    <Stroke pts={[[x + 12, y + 12], [x + 30, y + 12]]} w={3} seed={seed + 2} />
  </g>
);

/** Envelope with a red seal; `open` lifts the flap. */
export const Envelope: React.FC<{x: number; y: number; s?: number; rot?: number; seed?: number}> = ({x, y, s = 1, rot = 0, seed = 300}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <Shape pts={rectPts(-90, -56, 180, 112, seed, 6)} fill={P.white} seed={seed} />
    <Stroke pts={[[-88, -52], [0, 10], [88, -52]]} w={4} seed={seed + 1} />
    <Shape pts={ellipsePts(0, 6, 15, 15, seed + 2, 10)} fill={P.coral} w={3} seed={seed + 2} />
  </g>
);

/* ---------- bucket ---------- */

/**
 * Glass bucket with a handle. `level` 0..1 water, `coins` count of coins floating,
 * `wobble` degrees (it never tips).
 */
export const Bucket: React.FC<{x: number; y: number; w?: number; h?: number; level: number; seed: number; wobble?: number; t: number; qa?: string; color?: string}> = ({
  x,
  y,
  w = 280,
  h = 340,
  level,
  seed,
  wobble = 0,
  t,
  qa,
  color = P.water,
}) => {
  const top = y;
  const bot = y + h;
  const inset = w * 0.1;
  const lv = clamp01(level);
  const wy = bot - 14 - (h - 30) * lv;
  const halfAt = (yy: number) => w / 2 - inset * ((yy - top) / h);
  const wave = (i: number) => Math.sin(t * 2.2 + i * 0.9 + seed) * 4 * (lv > 0.02 ? 1 : 0);
  const surf: Pt[] = [];
  for (let i = 0; i <= 8; i++) {
    const hw = halfAt(wy) - 6;
    surf.push([x - hw + (2 * hw * i) / 8, wy + wave(i)]);
  }
  return (
    <g transform={`rotate(${wobble} ${x} ${bot})`}>
      <rect data-qa={qa ? `obj:${qa}` : undefined} data-qa-type={qa ? 'object' : undefined} x={x - w / 2 - 20} y={top - 70} width={w + 40} height={h + 70} fill="none" />
      <Shape pts={[[x - w / 2, top], [x + w / 2, top], [x + w / 2 - inset, bot], [x - w / 2 + inset, bot]]} fill="#EAF3F2" fillOpacity={0.85} seed={seed} w={5} />
      {lv > 0.01 ? (
        <g>
          <Shape pts={[...surf, [x + halfAt(bot) - 8, bot - 8], [x - halfAt(bot) + 8, bot - 8]]} fill={color} ink={null} seed={seed + 1} misreg={0} amp={0.8} />
          <Stroke pts={surf} w={3.5} color={P.waterDark} seed={seed + 2} />
          {Array.from({length: Math.floor(lv * 9)}).map((_, i) => {
            const cx = x + (hash2(seed, i) - 0.5) * (w - inset * 2 - 50);
            const cy = bot - 30 - hash2(seed + 1, i) * Math.max(10, (bot - wy - 50));
            return <ellipse key={i} cx={cx} cy={cy} rx={8} ry={5} fill={P.gold} stroke={P.ink} strokeWidth={2} opacity={0.9} />;
          })}
        </g>
      ) : null}
      {[0.33, 0.66].map((k, i) => (
        <Stroke key={i} pts={linePts([x - halfAt(top + h * k) + 4, top + h * k], [x + halfAt(top + h * k) - 4, top + h * k + 2], 5, 3, seed + 10 + i)} w={2.5} color={P.inkSoft} seed={seed + 10 + i} taper={false} />
      ))}
      <Shape pts={ellipsePts(x, top, w / 2, 16, seed + 4, 20)} fill={null as unknown as string} w={5} seed={seed + 4} />
      <Stroke pts={ellipsePts(x, top - 6, w / 2 - 10, 60, seed + 5, 20).slice(10, 21)} w={4.5} seed={seed + 5} />
    </g>
  );
};

/* ---------- cliff landscape ---------- */

export const CliffBlock: React.FC<{x: number; y: number; w: number; h: number; seed?: number; edgeRight?: boolean}> = ({x, y, w, h, seed = 600, edgeRight = true}) => {
  const edge = edgeRight ? x + w : x;
  const pts: Pt[] = edgeRight
    ? [[x, y], [edge - 10, y], [edge + 6, y + 60], [edge - 14, y + 150], [edge + 10, y + 260], [edge - 6, y + h], [x, y + h]]
    : [[x + w, y], [edge + 10, y], [edge - 6, y + 60], [edge + 14, y + 150], [edge - 10, y + 260], [edge + 6, y + h], [x + w, y + h]];
  return (
    <g>
      <Shape pts={pts} fill={P.earth} seed={seed} w={5.5} />
      <Hatch x={edgeRight ? edge - 70 : edge} y={y + 30} w={70} h={h - 30} gap={20} seed={seed + 5} />
      {[0.25, 0.55, 0.8].map((k, i) => (
        <Shape key={i} pts={ellipsePts(x + w * (edgeRight ? 0.12 + k * 0.6 : 0.88 - k * 0.6), y + 90 + i * 70, 34 + i * 6, 20, seed + 10 + i, 12)} fill={P.earthDark} fillOpacity={0.5} w={3.5} seed={seed + 10 + i} />
      ))}
      <Shape pts={[[x, y - 8], [edge + (edgeRight ? 4 : -4), y - 10], [edge, y + 14], [x, y + 16]]} fill={P.grass} seed={seed + 20} w={4} />
      {Array.from({length: Math.floor(w / 26)}).map((_, i) => (
        <Stroke key={i} pts={[[x + 10 + i * 26, y - 6], [x + 14 + i * 26, y - 20]]} w={2.6} color="#4F7A33" seed={seed + 30 + i} />
      ))}
    </g>
  );
};

/** US Capitol line drawing. */
export const Capitol: React.FC<{x: number; y: number; s?: number; seed?: number}> = ({x, y, s = 1, seed = 800}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <Shape pts={rectPts(-220, -40, 440, 80, seed, 4)} fill={P.white} seed={seed} />
    {Array.from({length: 11}).map((_, i) => (
      <Stroke key={i} pts={[[-200 + i * 40, -30], [-200 + i * 40, 34]]} w={3.5} seed={seed + 1 + i} taper={false} />
    ))}
    <Shape pts={rectPts(-150, -90, 300, 50, seed + 20, 4)} fill={P.white} seed={seed + 20} />
    <Shape pts={rectPts(-100, -130, 200, 40, seed + 21, 4)} fill={P.white} seed={seed + 21} />
    <Shape pts={[[-90, -130], [-80, -190], [-40, -226], [40, -226], [80, -190], [90, -130]]} fill={P.white} seed={seed + 22} />
    <Hatch x={-80} y={-200} w={160} h={66} gap={16} seed={seed + 23} opacity={0.3} />
    <Shape pts={rectPts(-14, -270, 28, 46, seed + 24, 4)} fill={P.white} seed={seed + 24} />
    <Shape pts={[[-6, -270], [0, -300], [6, -270]]} fill={P.white} seed={seed + 25} />
  </g>
);

/** Waving flag on a pole (living element). */
export const Flag: React.FC<{x: number; y: number; t: number; h?: number; color?: string; seed?: number}> = ({x, y, t, h = 120, color = P.coral, seed = 850}) => {
  const pts: Pt[] = [];
  for (let i = 0; i <= 6; i++) pts.push([x + i * 14, y - h + Math.sin(t * 4 - i * 0.8) * (i * 1.6)]);
  for (let i = 6; i >= 0; i--) pts.push([x + i * 14, y - h + 46 + Math.sin(t * 4 - i * 0.8) * (i * 1.6)]);
  return (
    <g>
      <Stroke pts={[[x, y], [x, y - h - 6]]} w={5} seed={seed} taper={false} />
      <Shape pts={pts} fill={color} seed={seed + 1} w={3.5} />
    </g>
  );
};

/** Sunburst rays rotating slowly behind a scene. */
export const Sunburst: React.FC<{t: number; cx: number; cy: number; a?: string; b?: string}> = ({t, cx, cy, a = P.paperWarm, b = P.mustardPale}) => {
  const n = 22;
  const rot = t * 3;
  return (
    <g>
      <rect width={W} height={H} fill={a} />
      {Array.from({length: n}).map((_, i) => {
        if (i % 2) return null;
        const a0 = ((i / n) * 360 + rot) * (Math.PI / 180);
        const a1 = (((i + 1) / n) * 360 + rot) * (Math.PI / 180);
        const R = 2400;
        return (
          <polygon key={i} points={`${cx},${cy} ${cx + Math.cos(a0) * R},${cy + Math.sin(a0) * R} ${cx + Math.cos(a1) * R},${cy + Math.sin(a1) * R}`} fill={b} opacity={0.55} />
        );
      })}
    </g>
  );
};

/** Paper card with a soft drop shadow. */
export const Card: React.FC<{x: number; y: number; w: number; h: number; seed?: number; fill?: string; rot?: number; qa?: string}> = ({
  x,
  y,
  w,
  h,
  seed = 120,
  fill = P.white,
  rot = 0,
  qa,
}) => (
  <g transform={`rotate(${rot} ${x + w / 2} ${y + h / 2})`}>
    <rect data-qa={qa ? `card:${qa}` : undefined} data-qa-type={qa ? 'card' : undefined} x={x} y={y} width={w} height={h} fill="none" />
    <Shape pts={rectPts(x + 10, y + 12, w, h, seed + 1, 10)} fill={P.shadow} ink={null} seed={seed + 1} misreg={0} />
    <Shape pts={rectPts(x, y, w, h, seed, 10)} fill={fill} seed={seed} />
  </g>
);

/** Jar for IRA/HSA with coins inside. */
export const Jar: React.FC<{x: number; y: number; level: number; lid: string; seed: number}> = ({x, y, level, lid, seed}) => (
  <g>
    <Shape pts={rectPts(x - 80, y - 170, 160, 200, seed, 30)} fill="#EEF6F4" fillOpacity={0.9} seed={seed} />
    <Shape pts={[...ellipsePts(x, y + 10 - 150 * clamp01(level), 70, 10, seed + 1, 10).slice(0, 6), [x + 66, y + 22], [x - 66, y + 22]]} fill={P.water} ink={null} seed={seed + 1} misreg={0} />
    <Shape pts={rectPts(x - 72, y - 200, 144, 40, seed + 2, 8)} fill={lid} seed={seed + 2} />
  </g>
);

/** Laptop on a table. */
export const Laptop: React.FC<{x: number; y: number; t: number}> = ({x, y, t}) => (
  <g>
    <Shape pts={[[x - 170, y], [x + 170, y], [x + 200, y + 26], [x - 200, y + 26]]} fill="#9AA0A8" seed={1101} />
    <Shape pts={[[x - 150, y - 220], [x + 150, y - 220], [x + 160, y], [x - 160, y]]} fill="#565C66" seed={1102} />
    <Shape pts={rectPts(x - 132, y - 204, 264, 186, 1103, 4)} fill={P.skyDeep} seed={1103} w={3} />
    {[0, 1, 2, 3].map((i) => (
      <Stroke key={i} pts={[[x - 110, y - 176 + i * 34], [x - 110 + 70 + ((Math.floor(t * 2) + i * 3) % 5) * 26, y - 176 + i * 34]]} w={5} color={P.white} seed={1104 + i} taper={false} />
    ))}
  </g>
);

/** Hand-drawn sign post with a board (text is placed by the scene). */
/** Invisible QA box for thin things text must not cross (posts, poles, guide lines). */
export const QaLine: React.FC<{id: string; x: number; y: number; w: number; h: number}> = ({id, x, y, w, h}) => (
  <rect data-qa={`line:${id}`} data-qa-type="line" x={x} y={y} width={Math.max(2, w)} height={Math.max(2, h)} fill="none" stroke="none" />
);

export const SignPost: React.FC<{x: number; y: number; h: number; bw: number; bh: number; seed?: number; fill?: string}> = ({x, y, h, bw, bh, seed = 1200, fill = P.coral}) => (
  <g>
    <Shape pts={rectPts(x - 8, y - h, 16, h, seed, 3)} fill={P.wood} seed={seed} />
    <Shape pts={rectPts(x - bw / 2, y - h - bh / 2, bw, bh, seed + 1, 8)} fill={fill} seed={seed + 1} />
  </g>
);

/** Stair steps for "higher bracket". */
export const Stairs: React.FC<{x: number; y: number; k: number; seed?: number}> = ({x, y, k, seed = 1300}) => {
  const pts: Pt[] = [[x, y]];
  for (let i = 0; i < 4; i++) {
    pts.push([x + i * 60, y - i * 46 - 46]);
    pts.push([x + i * 60 + 60, y - i * 46 - 46]);
  }
  return <Stroke pts={pts} draw={k} w={7} color={P.teal} seed={seed} taper />;
};

export const timeToFrame = (t: number) => Math.round(t * FPS);
export const hashT = hash;
