import React from 'react';
import {Pt, Shape, Stroke, Hatch, ellipsePts, linePts} from '../raise/ink';
import {P, clamp01, hash2} from '../raise/lib';
export {Cloud, Coin} from '../raise/props';

const topPts = (x0: number, x1: number, y: number, n: number): Pt[] =>
  Array.from({length: n + 1}, (_, i): Pt => [x0 + ((x1 - x0) * i) / n, y + (i % 2) * 3]);

/* Bucket and cliff from the videos, with an ink-weight multiplier so the marks survive being shrunk to an icon. */
export const Bucket: React.FC<{x: number; y: number; w?: number; h?: number; level: number; seed: number; wobble?: number; t: number; qa?: string; color?: string; bold?: number}> = ({
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
  bold = 1,
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
      <Shape pts={[[x - w / 2, top], [x + w / 2, top], [x + w / 2 - inset, bot], [x - w / 2 + inset, bot]]} fill="#EAF3F2" fillOpacity={0.85} seed={seed} w={5 * bold} />
      {lv > 0.01 ? (
        <g>
          <Shape pts={[...surf, [x + halfAt(bot) - 8, bot - 8], [x - halfAt(bot) + 8, bot - 8]]} fill={color} ink={null} seed={seed + 1} misreg={0} amp={0.8} />
          <Stroke pts={surf} w={3.5 * bold} color={P.waterDark} seed={seed + 2} />
          {Array.from({length: Math.floor(lv * 9)}).map((_, i) => {
            const cx = x + (hash2(seed, i) - 0.5) * (w - inset * 2 - 50);
            const cy = bot - 30 - hash2(seed + 1, i) * Math.max(10, (bot - wy - 50));
            return <ellipse key={i} cx={cx} cy={cy} rx={8} ry={5} fill={P.gold} stroke={P.ink} strokeWidth={2} opacity={0.9} />;
          })}
        </g>
      ) : null}
      {[0.33, 0.66].map((k, i) => (
        <Stroke key={i} pts={linePts([x - halfAt(top + h * k) + 4, top + h * k], [x + halfAt(top + h * k) - 4, top + h * k + 2], 5, 3, seed + 10 + i)} w={2.5 * bold} color={P.inkSoft} seed={seed + 10 + i} taper={false} />
      ))}
      <Shape pts={ellipsePts(x, top, w / 2, 16, seed + 4, 20)} fill={null as unknown as string} w={5 * bold} seed={seed + 4} />
      <Stroke pts={ellipsePts(x, top - 6, w / 2 - 10, 60, seed + 5, 20).slice(10, 21)} w={4.5 * bold} seed={seed + 5} />
    </g>
  );
};

export const CliffBlock: React.FC<{x: number; y: number; w: number; h: number; seed?: number; edgeRight?: boolean; bold?: number}> = ({x, y, w, h, seed = 600, edgeRight = true, bold = 1}) => {
  const edge = edgeRight ? x + w : x;
  const pts: Pt[] = edgeRight
    ? [...topPts(x, edge - 10, y, Math.max(2, Math.round(w / 220))), [edge + 6, y + 60], [edge - 14, y + 150], [edge + 10, y + 260], [edge - 6, y + h], [x, y + h]]
    : [[x + w, y], [edge + 10, y], [edge - 6, y + 60], [edge + 14, y + 150], [edge - 10, y + 260], [edge + 6, y + h], [x + w, y + h]];
  return (
    <g>
      <Shape pts={pts} fill={P.earth} seed={seed} w={5.5 * bold} />
      <Hatch x={edgeRight ? edge - 70 : edge} y={y + 30} w={70 * bold} h={h - 30} gap={20} seed={seed + 5} />
      {[0.25, 0.55, 0.8].map((k, i) => (
        <Shape key={i} pts={ellipsePts(x + w * (edgeRight ? 0.12 + k * 0.6 : 0.88 - k * 0.6), y + 90 + i * 70, 34 + i * 6, 20, seed + 10 + i, 12)} fill={P.earthDark} fillOpacity={0.5} w={3.5 * bold} seed={seed + 10 + i} />
      ))}
      <Shape pts={[...topPts(x, edge + (edgeRight ? 4 : -4), y - 9, Math.max(2, Math.round(w / 220))), [edge, y + 14], ...topPts(edge, x, y + 15, Math.max(2, Math.round(w / 220))).slice(1)]} fill={P.grass} seed={seed + 20} w={4 * bold} />
      {Array.from({length: Math.floor(w / 26)}).map((_, i) => (
        <Stroke key={i} pts={[[x + 10 + i * 26, y - 6], [x + 14 + i * 26, y - 20]]} w={2.6 * bold} color="#4F7A33" seed={seed + 30 + i} />
      ))}
    </g>
  );
};
