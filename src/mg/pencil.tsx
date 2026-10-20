import React from 'react';

/* The Penciled Out carrier pencil. Vector paths designed in Figma (file "Motion, Maxxed",
   page "Motion kit", frame "Carrier pencil") and exported as SVG. Box 600x110, graphite tip at (10,55),
   body along +x. No imports from ink/text so both can use it without cycles. */

const INK = '#2A2420';
const PARTS: {d: string; fill?: string; stroke?: string; sw?: number}[] = [
  {d: 'M10 55L129 9L130.8 101L10 55Z', fill: '#E9C99A', stroke: INK, sw: 5},
  {d: 'M10 55L49.6 40.3V69.7L10 55Z', fill: '#4A413A'},
  {d: 'M130 9L120 24.3L130 39.7L120 55L130 70.3L120 85.7L130 101', stroke: INK, sw: 4},
  {d: 'M130 9L283.6 8.4L438 9V101L284.5 101.1L130 101V9Z', fill: '#E8B23A', stroke: INK, sw: 5},
  {d: 'M138 39.7L430 38.7', stroke: '#C9952A', sw: 3.5},
  {d: 'M138 70.3L430 71.3', stroke: '#C9952A', sw: 3.5},
  {d: 'M438 6H500V104H438V6Z', fill: '#B8BEC2', stroke: INK, sw: 5},
  {d: 'M456.6 6V104', stroke: '#7D868C', sw: 3},
  {d: 'M475.2 6V104', stroke: '#7D868C', sw: 3},
  {d: 'M500 11H556L570 27V83L556 99H500V11Z', fill: '#F2A898', stroke: INK, sw: 5},
];

const h = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Pencil with its tip at (x,y). `rot` turns the body (deg, body points along +x before rotation;
 * -60 = held by a right-handed writer). `L` = drawn length. `frame` adds a hand tremor on twos.
 * `lift` 0..1 raises the pencil off the page (up and away along its body) as it arrives/leaves.
 */
export const PencilG: React.FC<{x: number; y: number; rot?: number; L?: number; frame?: number; lift?: number; shadow?: boolean}> = ({
  x,
  y,
  rot = -58,
  L = 300,
  frame = 0,
  lift = 0,
  shadow = true,
}) => {
  const s = L / 560;
  const st = Math.floor(frame / 2);
  const jx = (h(st * 1.7) - 0.5) * 2.2;
  const jy = (h(st * 2.9 + 4) - 0.5) * 2.2;
  const a = (rot * Math.PI) / 180;
  const up = lift * L * 0.35;
  const tx = x + jx + Math.cos(a) * up;
  const ty = y + jy + Math.sin(a) * up - lift * 30;
  const op = 1 - Math.max(0, lift - 0.6) / 0.4;
  if (op <= 0) return null;
  return (
    <g opacity={op}>
      {shadow ? (
        <g transform={`translate(${(tx + 26 + lift * 40).toFixed(1)},${(ty + 30 + lift * 50).toFixed(1)}) rotate(${rot}) scale(${s.toFixed(4)}) translate(-10,-55)`} opacity={0.18 * (1 - lift * 0.6)}>
          <path d="M10 55L130 9L570 9L570 101L130 101Z" fill={INK} />
        </g>
      ) : null}
      <g transform={`translate(${tx.toFixed(1)},${ty.toFixed(1)}) rotate(${rot}) scale(${s.toFixed(4)}) translate(-10,-55)`}>
        {PARTS.map((p, i) => (
          <path
            key={i}
            d={p.d}
            fill={p.fill ?? 'none'}
            stroke={p.stroke}
            strokeWidth={p.sw ? (p.sw / Math.max(0.3, s)) * 0.85 : undefined}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </g>
    </g>
  );
};

/** Lift envelope for a pencil that writes between k=0 and k=1: arrives in the first 12 %, leaves after 1. */
export const penLift = (k: number, tail = 0) => {
  if (k <= 0) return 1;
  if (k < 0.12) return 1 - k / 0.12;
  if (k < 1) return 0;
  return Math.min(1, tail);
};

/** Standalone pencil in its own full-frame SVG (for HTML layers). */
export const PencilSvg: React.FC<{x: number; y: number; rot?: number; L?: number; frame?: number; lift?: number}> = (p) => (
  <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
    <PencilG {...p} />
  </svg>
);
