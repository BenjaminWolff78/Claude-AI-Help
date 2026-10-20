import React from 'react';
import {AbsoluteFill} from 'remotion';
import {TornEdge, tornClip} from '../ep2/stage';
import {clamp01, easeOut} from '../ep2/lib';
import {PageCurl, Puff, ScribblePencil, ScribbleTone, pageTurnClip, scribblePath} from './kit';

const W = 1920;
const H = 1080;

/** How one scene hands over to the next. Every seam is a physical action on paper. */
export type Enter =
  | 'none'
  | 'torn-lr'
  | 'torn-bt'
  | 'slide-bt'
  | 'slide-tb'
  | 'push-left'
  | 'split'
  | 'page' // the old page turns over like a notebook leaf
  | 'scribble' // the carrier pencil scribbles graphite across the frame; the new scene is under the graphite
  | 'drop'; // the new sheet drops onto the desk, squashes and kicks up dust

export const Incoming: React.FC<{enter: Enter; k: number; seed: number; t?: number; t0?: number; children: React.ReactNode}> = ({enter, k, seed, t = 0, t0 = 0, children}) => {
  if (k >= 1 || enter === 'none') {
    // the drop's dust keeps rolling for a moment after the sheet lands
    if (enter === 'drop' && t - t0 < 1.6) {
      return (
        <AbsoluteFill>
          {children}
          <svg width={W} height={H} style={{position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible'}}>
            <Puff t={t} t0={t0 + 0.62} x={260} y={1072} w={420} seed={seed} />
            <Puff t={t} t0={t0 + 0.64} x={1660} y={1072} w={420} seed={seed + 3} />
          </svg>
        </AbsoluteFill>
      );
    }
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }
  switch (enter) {
    case 'torn-lr':
    case 'torn-bt': {
      const dir = enter === 'torn-lr' ? 'lr' : 'bt';
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{clipPath: tornClip(k, seed, dir)}}>{children}</AbsoluteFill>
          <TornEdge k={k} seed={seed} dir={dir} />
        </AbsoluteFill>
      );
    }
    case 'slide-bt':
      return <AbsoluteFill style={{transform: `translateY(${((1 - k) * H).toFixed(1)}px)`, boxShadow: '0 -20px 40px rgba(40,30,20,0.25)'}}>{children}</AbsoluteFill>;
    case 'slide-tb':
      return <AbsoluteFill style={{transform: `translateY(${(-(1 - k) * H).toFixed(1)}px)`, boxShadow: '0 20px 40px rgba(40,30,20,0.25)'}}>{children}</AbsoluteFill>;
    case 'push-left':
      return <AbsoluteFill style={{transform: `translateX(${((1 - k) * W).toFixed(1)}px)`}}>{children}</AbsoluteFill>;
    case 'split': {
      const half = (W / 2) * k;
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{clipPath: `polygon(0 0, ${half}px 0, ${half}px ${H}px, 0 ${H}px)`}}>{children}</AbsoluteFill>
          <AbsoluteFill style={{clipPath: `polygon(${W - half}px 0, ${W}px 0, ${W}px ${H}px, ${W - half}px ${H}px)`}}>{children}</AbsoluteFill>
        </AbsoluteFill>
      );
    }
    case 'page':
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{clipPath: pageTurnClip(k)}}>{children}</AbsoluteFill>
          <PageCurl k={k} />
        </AbsoluteFill>
      );
    case 'scribble': {
      // the scribble covers the frame by ~0.85; the rest of k lets the graphite fade off the new page
      const ks = clamp01(k / 0.85);
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{clipPath: ks >= 1 ? undefined : `path('${scribblePath(ks)}')`}}>
            {children}
            <ScribbleTone k={k} />
          </AbsoluteFill>
          <ScribblePencil k={ks} />
        </AbsoluteFill>
      );
    }
    case 'drop': {
      // falls with gravity, lands at k = 0.62, squashes once
      const fall = clamp01(k / 0.62);
      const y = -(1 - fall * fall) * (H + 80);
      const rot = (1 - fall) * -3.5;
      const land = clamp01((k - 0.62) / 0.38);
      const sq = Math.sin(land * Math.PI) * 0.018 * (1 - land);
      return (
        <AbsoluteFill
          style={{
            transform: `translateY(${y.toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${(1 + sq).toFixed(4)}, ${(1 - sq).toFixed(4)})`,
            transformOrigin: '50% 100%',
            boxShadow: `0 ${(30 * (1 - fall) + 8).toFixed(0)}px ${(60 * (1 - fall) + 18).toFixed(0)}px rgba(40,30,20,${(0.35 * (1 - land * 0.7)).toFixed(2)})`,
          }}
        >
          {children}
        </AbsoluteFill>
      );
    }
  }
  return <AbsoluteFill>{children}</AbsoluteFill>;
};

export const outgoingStyle = (enter: Enter, k: number): React.CSSProperties => {
  if (k <= 0 || k >= 1) return {};
  if (enter === 'slide-bt') return {transform: `translateY(${(-k * H * 0.3).toFixed(1)}px)`};
  if (enter === 'slide-tb') return {transform: `translateY(${(k * H * 0.3).toFixed(1)}px)`};
  if (enter === 'push-left') return {transform: `translateX(${(-k * W).toFixed(1)}px)`};
  if (enter === 'drop') {
    // the old sheet gets knocked a little as the new one lands on it
    const land = clamp01((k - 0.6) / 0.4);
    return {transform: `translateY(${(Math.sin(land * Math.PI) * 10).toFixed(1)}px)`, filter: `brightness(${(1 - 0.12 * easeOut(clamp01(k / 0.6))).toFixed(3)})`};
  }
  return {};
};
