import React from 'react';
import {C, F, WORDS, clamp, eo3, settle} from './lib';

const CHUNKS: [number, number][] = [
  [0, 2], [3, 5], [6, 8], [9, 11], [12, 13], [14, 15], [16, 18], [19, 20], [21, 22], [23, 25], [26, 26], [27, 30], [31, 34], [35, 37], [38, 40],
  [41, 42], [43, 46], [47, 48], [49, 51], [52, 54], [55, 56], [57, 59], [60, 61], [62, 64], [65, 68], [69, 72], [73, 74], [75, 76], [77, 79], [80, 82], [83, 86],
];
const LEAD = 0.06; // words land a hair before they are heard
const clean = (w: string) => w.replace(/[,.]$/g, '');
export const Captions: React.FC<{t: number}> = ({t}) => {
  let ci = -1;
  for (let i = 0; i < CHUNKS.length; i++) if (t >= WORDS[CHUNKS[i][0]].s - LEAD) ci = i;
  if (ci < 0) return null;
  const [a, b] = CHUNKS[ci];
  const next = CHUNKS[ci + 1];
  const endT = Math.min(next ? WORDS[next[0]].s - LEAD : 99, WORDS[b].e + 0.7);
  if (t > endT) return null;
  const c0 = WORDS[a].s - LEAD;
  const enter = eo3(clamp((t - c0) / 0.14));
  const ws = WORDS.slice(a, b + 1);
  return (
    <div style={{position: 'absolute', left: 60, width: 960, top: 1330, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `translateY(${(1 - enter) * 14}px)`}}>
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', columnGap: 30, rowGap: 0, maxWidth: 960}}>
        {ws.map((w, i) => {
          const s0 = w.s - LEAD;
          const on = t >= s0;
          const sc = on ? 1 + 0.2 * (1 - settle(t - s0, 2.4, 9)) : 1;
          const active = on && t < w.e + 0.04;
          return (
            <span
              key={i}
              style={{
                display: 'inline-block', fontFamily: F, fontWeight: 900, fontSize: 98, lineHeight: 1.08, color: active ? C.accentL : '#FFFFFF',
                WebkitTextStroke: '16px #1A1F3D', paintOrder: 'stroke fill', opacity: on ? 1 : 0, transform: `scale(${sc})`, transformOrigin: '50% 60%',
                textShadow: '0 8px 0 rgba(10,14,40,0.35)', whiteSpace: 'nowrap',
              } as React.CSSProperties}
            >
              {clean(w.w)}
            </span>
          );
        })}
      </div>
    </div>
  );
};
