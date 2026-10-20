import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Pt} from './ink';
import {FPS, H, P, SUB, W, clamp01, easeInOut, hash, hash2, prog} from './lib';

/** Paper sheet: flat colour + fibre texture + soft vignette. Grain is added on top globally. */
export const Paper: React.FC<{color?: string; id?: string; lines?: 'grid' | 'ruled' | null; children?: React.ReactNode}> = ({
  color = P.paper,
  id = 'p',
  lines = null,
  children,
}) => (
  <AbsoluteFill style={{background: color}}>
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <filter id={`fib${id}`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9 0.6" numOctaves={3} seed={7} />
        <feColorMatrix values="0 0 0 0 0.25  0 0 0 0 0.2  0 0 0 0 0.12  0 0 0 0.10 0" />
      </filter>
      <rect width={W} height={H} filter={`url(#fib${id})`} />
      {lines === 'grid'
        ? Array.from({length: 40}).map((_, i) => (
            <g key={i} opacity={0.18}>
              <line x1={i * 56} y1={0} x2={i * 56 + 3} y2={H} stroke={P.teal} strokeWidth={1.2} />
              {i < 20 ? <line x1={0} y1={i * 56} x2={W} y2={i * 56 + 2} stroke={P.teal} strokeWidth={1.2} /> : null}
            </g>
          ))
        : null}
      {lines === 'ruled'
        ? Array.from({length: 22}).map((_, i) => (
            <line key={i} x1={0} y1={60 + i * 48} x2={W} y2={62 + i * 48} stroke={P.teal} strokeOpacity={0.22} strokeWidth={2} />
          ))
        : null}
      {lines === 'ruled' ? <line x1={150} y1={0} x2={152} y2={H} stroke={P.coral} strokeOpacity={0.35} strokeWidth={2.5} /> : null}
    </svg>
    {children}
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(60,40,20,0.16) 100%)', pointerEvents: 'none'}} />
  </AbsoluteFill>
);

/** Film/paper grain on twos. */
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.09}) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2) % 9;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'multiply', opacity}}>
      <svg width={W} height={H}>
        <filter id={`gr${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency={0.85} numOctaves={2} seed={seed + 1} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={W} height={H} filter={`url(#gr${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

/**
 * Virtual camera for a scene: slow push-in (2-4 %), gentle drift, optional focus point,
 * shake on impacts. Children are laid out in 1920x1080 world space.
 */
export const Cam: React.FC<{
  t0: number;
  t1: number;
  push?: number;
  focus?: Pt;
  drift?: number;
  shakeAt?: number[];
  keys?: {t: number; x: number; y: number; z: number}[]; // explicit camera moves
  children: React.ReactNode;
}> = ({t0, t1, push = 0.03, focus = [960, 540], drift = 8, shakeAt = [], keys, children}) => {
  const frame = useCurrentFrame();
  const t = (frame + SUB) / FPS; // camera is smooth motion: sampled at the shutter sub-frame
  const k = clamp01((t - t0) / Math.max(0.1, t1 - t0));
  let z = 1 + push * easeInOut(k);
  let cx = focus[0];
  let cy = focus[1];
  if (keys && keys.length) {
    let kx = keys[0].x;
    let ky = keys[0].y;
    let kz = keys[0].z;
    for (let i = 1; i < keys.length; i++) {
      const a = keys[i - 1];
      const b = keys[i];
      if (t >= a.t) {
        const p = prog(t, a.t, b.t, easeInOut);
        kx = a.x + (b.x - a.x) * p;
        ky = a.y + (b.y - a.y) * p;
        kz = a.z + (b.z - a.z) * p;
      }
    }
    cx = kx;
    cy = ky;
    z *= kz;
  }
  const dx = Math.sin(t * 0.37 + t0) * drift;
  const dy = Math.cos(t * 0.29 + t0) * drift * 0.6;
  let sx = 0;
  let sy = 0;
  for (const s of shakeAt) {
    const d = t - s;
    if (d >= 0 && d < 0.45) {
      const amp = 14 * (1 - d / 0.45);
      sx += (hash(Math.floor(frame / 2) * 1.3) - 0.5) * 2 * amp;
      sy += (hash(Math.floor(frame / 2) * 2.7 + 5) - 0.5) * 2 * amp;
    }
  }
  const tx = cx * (1 - z) + dx + sx;
  const ty = cy * (1 - z) + dy + sy;
  return (
    <AbsoluteFill style={{transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${z.toFixed(5)})`, transformOrigin: '0 0'}}>
      {children}
    </AbsoluteFill>
  );
};

/** Parallax layer inside a Cam: depth < 1 moves less than the camera (further away). */
export const Layer: React.FC<{depth: number; t: number; children: React.ReactNode; dx?: number}> = ({depth, t, children, dx = 30}) => (
  <AbsoluteFill style={{transform: `translateX(${((1 - depth) * Math.sin(t * 0.25) * dx).toFixed(2)}px)`}}>{children}</AbsoluteFill>
);

/** Torn-paper edge polygon (CSS clip-path) sweeping left->right (dir 1) or bottom->top. */
export const tornClip = (k: number, seed = 3, dir: 'lr' | 'bt' = 'lr'): string => {
  const pts: string[] = [];
  const n = 26;
  if (dir === 'lr') {
    const edge = -160 + (W + 320) * k;
    pts.push(`0px 0px`);
    for (let i = 0; i <= n; i++) {
      const y = (H * i) / n;
      const j = (hash2(seed, i) - 0.5) * 70 + Math.sin(i * 1.7 + seed) * 22;
      pts.push(`${(edge + j).toFixed(1)}px ${y.toFixed(1)}px`);
    }
    pts.push(`0px ${H}px`);
  } else {
    const edge = H + 160 - (H + 320) * k;
    pts.push(`0px ${H}px`);
    for (let i = 0; i <= n; i++) {
      const x = (W * i) / n;
      const j = (hash2(seed, i) - 0.5) * 70 + Math.sin(i * 1.3 + seed) * 22;
      pts.push(`${x.toFixed(1)}px ${(edge + j).toFixed(1)}px`);
    }
    pts.push(`${W}px ${H}px`);
  }
  return `polygon(${pts.join(',')})`;
};

/** The white fibrous strip along a torn edge (drawn on top of the incoming page). */
export const TornEdge: React.FC<{k: number; seed?: number; dir?: 'lr' | 'bt'}> = ({k, seed = 3, dir = 'lr'}) => {
  if (k <= 0 || k >= 1) return null;
  const n = 26;
  const a: string[] = [];
  const b: string[] = [];
  for (let i = 0; i <= n; i++) {
    const j = (hash2(seed, i) - 0.5) * 70 + Math.sin(i * (dir === 'lr' ? 1.7 : 1.3) + seed) * 22;
    const fib = 10 + hash2(seed + 4, i) * 12;
    if (dir === 'lr') {
      const edge = -160 + (W + 320) * k;
      const y = (H * i) / n;
      a.push(`${edge + j},${y}`);
      b.unshift(`${edge + j + fib},${y}`);
    } else {
      const edge = H + 160 - (H + 320) * k;
      const x = (W * i) / n;
      a.push(`${x},${edge + j}`);
      b.unshift(`${x},${edge + j - fib}`);
    }
  }
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <polygon points={[...a, ...b].join(' ')} fill="#FBF7EC" stroke="rgba(42,36,32,0.25)" strokeWidth={2} style={{filter: 'drop-shadow(-6px 4px 6px rgba(40,30,20,0.25))'}} />
    </svg>
  );
};
