import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Shape, Stroke, ellipsePts, linePts, rectPts} from '../raise/ink';
import {P} from '../ep2/lib';
import {Bill, Envelope, Jar} from '../raise/props';
import {CalendarPage, sharp} from '../ep2/props2';
import {Bucket, CliffBlock, Coin} from './parts';
import {FontLoader, Txt} from '../raise/text';

/* Channel: "Penciled Out" (money decisions worked out on paper). Same ink, paper and riso
   offset as the videos, so the channel art looks like a frame from the show. */

const PaperAny: React.FC<{w: number; h: number; color?: string; id: string; grid?: number}> = ({w, h, color = P.paper, id, grid = 0}) => (
  <AbsoluteFill style={{background: color}}>
    <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
      <filter id={`fib${id}`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9 0.6" numOctaves={3} seed={7} />
        <feColorMatrix values="0 0 0 0 0.25  0 0 0 0 0.2  0 0 0 0 0.12  0 0 0 0.10 0" />
      </filter>
      <rect width={w} height={h} filter={`url(#fib${id})`} />
      {grid
        ? Array.from({length: Math.ceil(Math.max(w, h) / grid) + 1}).map((_, i) => (
            <g key={i} opacity={0.16}>
              <line x1={i * grid} y1={0} x2={i * grid + 3} y2={h} stroke={P.teal} strokeWidth={1.6} />
              <line x1={0} y1={i * grid} x2={w} y2={i * grid + 2} stroke={P.teal} strokeWidth={1.6} />
            </g>
          ))
        : null}
    </svg>
  </AbsoluteFill>
);

const GrainAny: React.FC<{w: number; h: number; id: string; opacity?: number}> = ({w, h, id, opacity = 0.09}) => (
  <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'multiply', opacity}}>
    <svg width={w} height={h}>
      <filter id={`gr${id}`}>
        <feTurbulence type="fractalNoise" baseFrequency={0.85} numOctaves={2} seed={3} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width={w} height={h} filter={`url(#gr${id})`} />
    </svg>
  </AbsoluteFill>
);

/** A stubby yellow pencil; its tip sits at (x,y) and the body runs along +x rotated by `rot`. */
export const Pencil: React.FC<{x: number; y: number; rot?: number; L?: number; bold?: number; seed?: number}> = ({x, y, rot = -40, L = 520, bold = 1, seed = 2100}) => {
  const w = L * 0.17;
  const cone = L * 0.2;
  const ferr = L * 0.11;
  const eras = L * 0.12;
  const body = L - cone - ferr - eras;
  const e0 = cone + body + ferr;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot})`}>
      <Shape pts={sharp([[0, 0], [cone, -w / 2], [cone, w / 2]], 18)} fill="#E9C99A" seed={seed} w={4.5 * bold} />
      <Shape pts={sharp([[0, 0], [cone * 0.32, -w * 0.16], [cone * 0.32, w * 0.16]], 8)} fill={P.ink} ink={null} misreg={0} seed={seed + 1} />
      <Shape pts={sharp([[cone, -w / 2], [cone + body, -w / 2], [cone + body, w / 2], [cone, w / 2]], 30)} fill={P.mustard} seed={seed + 2} w={5 * bold} />
      <Stroke pts={linePts([cone + 6, -w / 6], [cone + body - 6, -w / 6], 8, 0, seed + 3)} w={3 * bold} color="#C9952A" seed={seed + 3} taper={false} />
      <Stroke pts={linePts([cone + 6, w / 6], [cone + body - 6, w / 6], 8, 0, seed + 4)} w={3 * bold} color="#C9952A" seed={seed + 4} taper={false} />
      <Shape pts={sharp([[cone + body, -w / 2 - 2], [e0, -w / 2 - 2], [e0, w / 2 + 2], [cone + body, w / 2 + 2]], 16)} fill="#B8BEC2" seed={seed + 5} w={4.5 * bold} />
      {[0.33, 0.66].map((k, i) => (
        <Stroke key={i} pts={[[cone + body + ferr * k, -w / 2], [cone + body + ferr * k, w / 2]]} w={2.5 * bold} color="#7D868C" seed={seed + 6 + i} taper={false} />
      ))}
      <Shape pts={sharp([[e0, -w / 2 + 2], [e0 + eras - 10, -w / 2 + 2], [e0 + eras, -w / 2 + 14], [e0 + eras, w / 2 - 14], [e0 + eras - 10, w / 2 - 2], [e0, w / 2 - 2]], 14)} fill={P.coralPale} seed={seed + 8} w={4.5 * bold} />
    </g>
  );
};

/** The underline and the pencil that just drew it (1000x1000 box). */
const MarkSvg: React.FC<{bold?: number}> = ({bold = 1}) => (
  <g>
    <Stroke pts={[[230, 800], [400, 812], [560, 804], [640, 812]]} w={16 * bold} color={P.berry} seed={2201} />
    <Pencil x={640} y={812} rot={-27} L={300} bold={bold} />
  </g>
);

/** Profile picture 800x800 (YouTube crops it to a circle): a hand-lettered $ being underlined. */
export const BrandPfp: React.FC = () => (
  <AbsoluteFill>
    <FontLoader />
    <PaperAny w={800} h={800} color={P.paperWarm} id="pfp" grid={64} />
    <Txt x={372} y={40} size={600} align="center" weight={800} riso={P.teal} informal={70} bounce={20}>
      $
    </Txt>
    <svg width={800} height={800} viewBox="0 0 1000 1000" style={{position: 'absolute', inset: 0}}>
      <MarkSvg bold={1.5} />
    </svg>
    <GrainAny w={800} h={800} id="pfp" />
  </AbsoluteFill>
);

/** Watermark, drawn at 600 and downsized to 150: the same mark on a paper disc. */
export const BrandWatermark: React.FC = () => (
  <AbsoluteFill style={{background: 'transparent'}}>
    <FontLoader />
    <svg width={600} height={600} viewBox="0 0 1000 1000" style={{position: 'absolute', inset: 0}}>
      <Shape pts={ellipsePts(500, 500, 488, 488, 52, 40)} fill={P.paperWarm} ink={P.ink} w={18} misreg={0} amp={0.6} seed={52} />
    </svg>
    <Txt x={282} y={50} size={430} align="center" weight={800} riso={P.teal} informal={70} bounce={20}>
      $
    </Txt>
    <svg width={600} height={600} viewBox="0 0 1000 1000" style={{position: 'absolute', inset: 0}}>
      <g transform="translate(-20 -30)">
        <MarkSvg bold={2.4} />
      </g>
    </svg>
  </AbsoluteFill>
);

/* ---------------------------------------------------------------- banner */

const BW = 2560;
const BH = 1440;

const House: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <Shape pts={sharp([[-110, 0], [-110, -150], [110, -150], [110, 0]], 30)} fill="#E7D5B5" seed={2301} />
    <Shape pts={sharp([[-140, -140], [0, -250], [140, -140]], 30)} fill="#8E5A4A" seed={2302} />
    <Shape pts={rectPts(-30, -90, 60, 90, 2303, 4)} fill={P.teal} seed={2303} />
    <Shape pts={rectPts(50, -120, 44, 40, 2304, 4)} fill={P.mustardPale} seed={2304} w={3.5} />
  </g>
);

const CreditCard: React.FC<{x: number; y: number; rot?: number}> = ({x, y, rot = -8}) => (
  <g transform={`translate(${x},${y}) rotate(${rot})`}>
    <Shape pts={rectPts(-150, -95, 300, 190, 2310, 18)} fill={P.coral} seed={2310} />
    <Shape pts={rectPts(-150, -50, 300, 34, 2311, 2)} fill={P.ink} ink={null} misreg={0} seed={2311} />
    <Shape pts={rectPts(-120, 10, 60, 44, 2312, 6)} fill={P.mustard} seed={2312} w={3} />
  </g>
);

const ChartNote: React.FC<{x: number; y: number; rot?: number}> = ({x, y, rot = 4}) => (
  <g transform={`translate(${x},${y}) rotate(${rot})`}>
    <Shape pts={rectPts(-120, -110, 240, 220, 2320, 6)} fill={P.mustardPale} seed={2320} />
    <Stroke pts={[[-90, 70], [-40, 30], [0, 46], [40, -10], [90, -60]]} w={7} color={P.teal} seed={2321} />
    <Stroke pts={[[-95, 80], [95, 82]]} w={4} seed={2322} taper={false} />
  </g>
);

const Coins: React.FC<{x: number; y: number; n: number; seed: number}> = ({x, y, n, seed}) => (
  <g>
    {Array.from({length: n}).map((_, i) => (
      <Shape key={i} pts={ellipsePts(x + (i % 2) * 4, y - i * 16, 40, 14, seed + i, 14)} fill={P.gold} seed={seed + i} w={3.5} />
    ))}
  </g>
);

/** The cliff edge doodle (the show's other half). */
export const Edge: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <Shape pts={sharp([[-160, 300], [-160, 40], [160, 40], [180, 120], [150, 300]], 30)} fill={P.earth} seed={2390} w={8} />
    <Shape pts={sharp([[-170, 30], [175, 26], [175, 52], [-170, 56]], 30)} fill={P.grass} seed={2391} w={7} />
  </g>
);

export const BrandBanner: React.FC = () => (
  <AbsoluteFill>
    <FontLoader />
    <PaperAny w={BW} h={BH} color={P.paperWarm} id="ban" grid={64} />
    <svg width={BW} height={BH} style={{position: 'absolute', inset: 0}}>
      {/* a desk of money decisions, drawn in the show's ink; most of it lives outside the phone-safe band */}
      <House x={300} y={430} s={1.1} />
      <Envelope x={760} y={250} s={1.3} rot={-12} />
      <ChartNote x={1280} y={230} rot={-3} />
      <CreditCard x={1820} y={260} rot={8} />
      <g transform="translate(2280 330) scale(0.9)">
        <CalendarPage x={-120} y={-130} w={240} h={260} seed={2330} rot={6} />
      </g>
      <g transform="translate(330 1190)">
        <Jar x={0} y={0} level={0.6} lid={P.teal} seed={2340} />
      </g>
      <Bill x={760} y={1110} rot={-14} seed={2360} />
      <Coins x={1280} y={1250} n={6} seed={2350} />
      <g transform="translate(1720 1010) scale(0.62)">
        <CliffBlock x={0} y={0} w={420} h={420} seed={2395} />
      </g>
      <g transform="translate(2010 1050) rotate(28)">
        <Coin x={0} y={0} r={24} seed={2392} />
      </g>
      <g transform="translate(2290 1050) scale(0.55)">
        <Bucket x={0} y={0} w={300} h={300} level={0.7} seed={2380} t={0.4} bold={1.6} />
      </g>
      {/* safe band: the underline being drawn under the tagline */}
      <Stroke pts={[[800, 878], [1120, 890], [1440, 882], [1770, 892]]} w={10} color={P.berry} seed={2393} />
      <Pencil x={1770} y={892} rot={-16} L={260} />
    </svg>
    {/* wordmark inside the safe band (x 507-2053, y 508-931) */}
    <Txt x={1280} y={560} size={170} align="center" riso={P.teal} informal={70} bounce={30} weight={800}>
      Penciled Out
    </Txt>
    <Txt x={1280} y={772} size={50} align="center" weight={600} color={P.inkSoft} informal={80} bounce={20}>
      money decisions, worked out on paper
    </Txt>
    <GrainAny w={BW} h={BH} id="ban" />
  </AbsoluteFill>
);
