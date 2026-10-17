import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Pt, Shape, Stroke, ellipsePts, linePts} from '../raise/ink';
import {P} from '../raise/lib';
import {Bucket, CliffBlock, Cloud, Coin} from './parts';
import {FontLoader, Txt} from '../raise/text';

/** Paper ground at any size: flat colour + fibre + soft vignette (same recipe as the videos). */
const PaperAny: React.FC<{w: number; h: number; color?: string; id: string}> = ({w, h, color = P.paper, id}) => (
  <AbsoluteFill style={{background: color}}>
    <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
      <filter id={`fib${id}`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9 0.6" numOctaves={3} seed={7} />
        <feColorMatrix values="0 0 0 0 0.25  0 0 0 0 0.2  0 0 0 0 0.12  0 0 0 0.10 0" />
      </filter>
      <rect width={w} height={h} filter={`url(#fib${id})`} />
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

/** The mark: a bucket standing on the very edge of a cliff, one coin going over. Drawn in a 1000x1000 box. */
export const Mark: React.FC<{sky?: boolean; bold?: number}> = ({sky = true, bold = 1}) => (
  <g>
    {sky ? <rect x={-20} y={-20} width={1040} height={1040} fill={P.sky} /> : null}
    {sky ? <Cloud x={250} y={235} s={0.9} seed={70} /> : null}
    {sky ? <Cloud x={760} y={300} s={0.6} seed={74} /> : null}
    {/* sea far below the edge */}
    {sky
      ? [0, 1, 2].map((i) => (
          <Stroke key={i} pts={linePts([700 + i * 30, 820 + i * 46], [900 - i * 10, 818 + i * 46], 6, 4, 90 + i)} w={6 * bold} color={P.white} seed={90 + i} />
        ))
      : null}
    <CliffBlock x={-40} y={620} w={680} h={460} seed={610} bold={bold} />
    <Bucket x={455} y={318} w={300} h={290} level={0.66} seed={430} t={0.4} bold={bold} />
    {/* the coin that went over */}
    <Stroke pts={[[648, 596], [690, 604], [722, 640]]} w={4 * bold} seed={33} />
    <Stroke pts={[[654, 566], [706, 576], [742, 616]]} w={4 * bold} seed={34} />
    <g transform="translate(756 700) rotate(28)">
      <Coin x={0} y={0} r={34} seed={21} />
    </g>
  </g>
);

/** Profile picture 800x800 (YouTube crops it to a circle). */
export const BrandPfp: React.FC = () => (
  <AbsoluteFill>
    <PaperAny w={800} h={800} color={P.paperWarm} id="pfp" />
    <svg width={800} height={800} viewBox="0 0 1000 1000" style={{position: 'absolute', inset: 0}}>
      <Mark bold={1.5} />
    </svg>
    <GrainAny w={800} h={800} id="pfp" />
  </AbsoluteFill>
);

/** Watermark, drawn at 600 and downsized to 150: mark on a paper disc, transparent corners. */
export const BrandWatermark: React.FC = () => (
  <AbsoluteFill style={{background: 'transparent'}}>
    <svg width={600} height={600} viewBox="0 0 1000 1000" style={{position: 'absolute', inset: 0}}>
      <Shape pts={ellipsePts(500, 500, 488, 488, 52, 40)} fill={P.paperWarm} ink={P.ink} w={16} misreg={0} amp={0.6} seed={52} />
      <clipPath id="wmclip"><circle cx={500} cy={500} r={490} /></clipPath>
      <g clipPath="url(#wmclip)" transform="translate(70 70) scale(0.86)">
        <Mark bold={2.2} />
      </g>
    </svg>
  </AbsoluteFill>
);

/* ---------------------------------------------------------------- banner */

const BW = 2560;
const BH = 1440;

/** Rolling hills on the bucket side: a low ink line with grass ticks. */
const Hill: React.FC<{y: number; x0: number; x1: number; seed: number; fill: string}> = ({y, x0, x1, seed, fill}) => {
  const pts: Pt[] = [];
  for (let i = 0; i <= 10; i++) {
    const x = x0 + ((x1 - x0) * i) / 10;
    pts.push([x, y - Math.sin((i / 10) * Math.PI) * 60 - (i % 2) * 8]);
  }
  return <Shape pts={[...pts, [x1, BH + 40], [x0, BH + 40]]} fill={fill} seed={seed} w={6} />;
};

export const BrandBanner: React.FC = () => (
  <AbsoluteFill>
    <FontLoader />
    <PaperAny w={BW} h={BH} color={P.paperWarm} id="ban" />
    <svg width={BW} height={BH} style={{position: 'absolute', inset: 0}}>
      <rect x={0} y={0} width={BW} height={BH} fill={P.sky} opacity={0.6} />
      <Cloud x={300} y={250} s={1.3} seed={80} />
      <Cloud x={1180} y={170} s={0.85} seed={82} />
      <Cloud x={2280} y={330} s={1.15} seed={84} />
      {/* far sea below the edge */}
      {[0, 1, 2, 3, 4].map((i) => (
        <Stroke key={i} pts={linePts([1990 + i * 50, 1130 + i * 60], [2480 - i * 30, 1128 + i * 60], 6, 4, 95 + i)} w={6} color={P.white} seed={95 + i} />
      ))}
      {/* one ground: meadow on the left, then it simply stops */}
      <CliffBlock x={-160} y={880} w={2040} h={620} seed={620} />
      {/* buckets standing on it, filling one after another */}
      <g transform="translate(585 762) scale(0.37)">
        <Bucket x={0} y={0} w={300} h={290} level={1} seed={440} t={0.2} bold={1.7} />
        <Bucket x={365} y={0} w={300} h={290} level={1} seed={450} t={0.6} bold={1.7} />
        <Bucket x={730} y={0} w={300} h={290} level={0.45} seed={460} t={1.1} bold={1.7} />
      </g>
      {/* the coin that went over the edge */}
      <Stroke pts={[[1868, 858], [1898, 862], [1922, 884]]} w={4} seed={36} />
      <Stroke pts={[[1872, 836], [1910, 842], [1940, 870]]} w={4} seed={37} />
      <g transform="translate(1958 928) rotate(24)">
        <Coin x={0} y={0} r={26} seed={23} />
      </g>
    </svg>
    {/* wordmark inside the 1546x423 safe area (x 507-2053, y 508-931) */}
    <Txt x={1280} y={530} size={150} align="center" riso={P.coral} informal={70} bounce={30}>
      Bucket or Cliff
    </Txt>
    <Txt x={1430} y={716} size={46} align="center" weight={600} color={P.inkSoft} informal={80} bounce={20}>
      every money rule is one or the other
    </Txt>
    <GrainAny w={BW} h={BH} id="ban" />
  </AbsoluteFill>
);

