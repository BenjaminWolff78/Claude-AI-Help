import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {LEAF, PETAL} from './assets';
import {DUR, FPS, G, GOLDEN, H, SERIF, SERIF_R, SUB, W, clamp01, clampT, easeIn, easeInOut, easeOut, hash, lerp, twos} from './lib';

/* ------------------------------------------------------------------ fonts */
const FACE = `@font-face{font-family:"Pagella G";src:url(${staticFile('fonts/texgyrepagella-bolditalic.otf')}) format("opentype");font-weight:700;font-style:italic;font-display:block;}
@font-face{font-family:"Pagella G R";src:url(${staticFile('fonts/texgyrepagella-regular.otf')}) format("opentype");font-weight:400;font-display:block;}`;
const Fonts: React.FC = () => {
  const [h] = useState(() => delayRender('golden-fonts'));
  useEffect(() => {
    Promise.all([document.fonts.load(`italic 700 60px "Pagella G"`), document.fonts.load(`400 60px "Pagella G R"`)]).then(() => continueRender(h));
  }, [h]);
  return <style>{FACE}</style>;
};

/* ------------------------------------------------------------------ the beats (seconds) */
const B = {
  growEnd: 3.2,
  petalsIn: 3.0,
  petalsOut: 7.5,
  collapse0: 7.7,
  collapse1: 8.6,
  steps: [8.8, 9.7, 10.6, 11.6],
  fast0: 12.2,
  fast1: 14.2,
  ask: 14.3,
  holds: [
    {a: 90, t0: 16.0, t1: 17.5, label: '4 straight rows. Big gaps.'},
    {a: 120, t0: 18.3, t1: 19.7, label: '3 rows. Still gaps.'},
    {a: 144, t0: 20.6, t1: 22.0, label: '5 rows. Gaps.'},
    {a: 137, t0: 22.9, t1: 24.2, label: 'Spirals... still gaps.'},
    {a: GOLDEN, t0: 25.0, t1: 26.6, label: 'No gaps at all.'},
  ],
  golden: 26.7,
  count: 33.6,
  f34: 34.3,
  f55: 36.5,
  fib: 38.6,
  cones: 41.6,
  final: 46.6,
  petals2: 46.4,
  out0: 49.4,
  out1: 51.6,
  again: 50.2,
};

/* ------------------------------------------------------------------ seeds */
const C = 14; // spacing constant: seed j sits at radius C * sqrt(j)
const NS = 700; // seeds in the static head
const NG = 900; // seeds at the end of the opening growth
const FX = 1270; // flower centre on screen
const FY = 560;
const ag = (GOLDEN * Math.PI) / 180;

/** number of seeds during the growth phases (float, smooth) */
const growM = (t: number) => {
  if (t < B.growEnd) return 1 + (NG - 1) * Math.pow(t / B.growEnd, 1.7);
  if (t < B.collapse0) return NG;
  if (t < B.collapse1) return lerp(NG, 1, easeIn(clampT(t, B.collapse0, B.collapse1)));
  if (t < B.fast0) {
    let m = 1;
    B.steps.forEach((s, i) => {
      if (t >= s) m = 2 + i * 2 + easeOut(clampT(t, s, s + 0.5)) * 2;
    });
    return Math.min(10, m);
  }
  if (t < B.fast1) return lerp(10, NS, Math.pow(clampT(t, B.fast0, B.fast1), 2.2));
  if (t < B.out0) return NS;
  return lerp(NS, 1, easeInOut(clampT(t, B.out0, B.out1)));
};
const isGrowth = (t: number) => t < B.fast1 || t >= B.out0;

/** the turn used by the static head */
const angleAt = (t: number) => {
  if (t < B.holds[0].t0 - 1.2) return GOLDEN;
  const H0 = B.holds;
  // ease from golden to 90, then from hold to hold
  if (t < H0[0].t0) return lerp(GOLDEN, 90, easeInOut(clampT(t, H0[0].t0 - 1.2, H0[0].t0)));
  for (let i = 0; i < H0.length; i++) {
    if (t < H0[i].t1) return H0[i].a;
    const nx = H0[i + 1];
    if (!nx) return H0[i].a;
    if (t < nx.t0) return lerp(H0[i].a, nx.a, easeInOut(clampT(t, H0[i].t1, nx.t0)));
  }
  return GOLDEN;
};

type Seed = {x: number; y: number; r: number; j: number; born: number};
const seedsAt = (t: number): Seed[] => {
  const out: Seed[] = [];
  if (isGrowth(t)) {
    const M = growM(t);
    const n = Math.ceil(M);
    for (let i = 0; i < n; i++) {
      const j = M - 1 - i; // distance index from the centre
      const rr = C * Math.sqrt(Math.max(0, j));
      const a = i * ag;
      const birth = clamp01(M - i); // pops in as it is placed
      out.push({x: Math.cos(a) * rr, y: Math.sin(a) * rr, r: 6.6 * Math.min(1, birth * 1.6), j: Math.max(0, j), born: birth});
    }
    return out;
  }
  const al = (angleAt(t) * Math.PI) / 180;
  const A0 = (NS - 1) * ag;
  for (let j = 0; j < NS; j++) {
    const a = A0 - j * al;
    const rr = C * Math.sqrt(j + 0.001);
    out.push({x: Math.cos(a) * rr, y: Math.sin(a) * rr, r: 6.6, j, born: 1});
  }
  return out;
};
/** how much the flower is magnified: small heads are shown big */
const zoomAt = (t: number) => {
  const M = isGrowth(t) ? growM(t) : NS;
  const z = Math.max(1, Math.min(3.6, 400 / (C * Math.sqrt(Math.max(1, M)))));
  return z;
};

const seedColor = (j: number) => {
  // darker, smaller florets in the middle; gold towards the rim
  const k = clamp01(j / NS);
  const r = Math.round(lerp(0x8a, 0xf4, Math.pow(k, 0.6)));
  const g = Math.round(lerp(0x52, 0xb6, Math.pow(k, 0.6)));
  const b = Math.round(lerp(0x16, 0x3f, Math.pow(k, 0.6)));
  return `rgb(${r},${g},${b})`;
};

/* ------------------------------------------------------------------ petals */
const Petals: React.FC<{t: number; k: number; rimR: number}> = ({t, k, rimR}) => {
  if (k <= 0) return null;
  const ring = (n: number, len: number, col: string, off: number, delay: number, layer: number) =>
    Array.from({length: n}, (_, i) => {
      const a = (i / n) * Math.PI * 2 + off;
      const kk = easeOut(clamp01((k - delay - (i / n) * 0.25) / 0.6));
      if (kk <= 0) return null;
      const sway = Math.sin(t * 1.3 + i * 0.7) * 2.5;
      const s = (len / 296) * kk;
      const deg = (a * 180) / Math.PI + 90 + sway;
      return (
        <g key={`${layer}-${i}`} transform={`rotate(${deg.toFixed(2)}) translate(0 ${(-rimR + 10).toFixed(1)}) scale(${(0.9 * (0.6 + 0.4 * kk)).toFixed(3)} ${s.toFixed(3)}) translate(-42 -295)`}>
          <path d={PETAL} fill={col} />
          <path d="M42 290 C 40 200 44 110 42 30" stroke={G.petalDeep} strokeWidth={3 / Math.max(0.2, s)} fill="none" opacity={0.6} />
        </g>
      );
    });
  return (
    <g>
      {ring(21, 210, G.petalDeep, 0.15, 0.0, 0)}
      {ring(34, 250, G.petal, 0, 0.12, 1)}
    </g>
  );
};

/* ------------------------------------------------------------------ type */
/** a line that rises out of a mask word by word, and leaves upwards */
const Line: React.FC<{t: number; t0: number; t1?: number; x: number; y: number; text: string; size?: number; c?: string; italic?: boolean; anchor?: 'start' | 'middle'}> = ({t, t0, t1 = 1e9, x, y, text, size = 64, c = G.cream, italic = true, anchor = 'start'}) => {
  if (t < t0 - 0.05 || t > t1 + 0.45) return null;
  const words = text.split(' ');
  const out = easeIn(clampT(t, t1, t1 + 0.4));
  let acc = 0;
  const pieces = words.map((w, i) => {
    const k = easeOut(clampT(t, t0 + i * 0.09, t0 + i * 0.09 + 0.6));
    const xx = acc;
    acc += (w.length + 1) * size * (italic ? 0.47 : 0.5);
    return (
      <tspan key={i} x={anchor === 'start' ? x + xx : undefined} dy={0} opacity={k > 0 ? 1 : 0}>
        <tspan dy={0}>{w}</tspan>
      </tspan>
    );
  });
  void pieces;
  return (
    <g>
      <clipPath id={`clip-${t0}-${y}`}>
        <rect x={anchor === 'middle' ? x - 1200 : x - 40} y={y - size * 1.1} width={2400} height={size * 1.45} />
      </clipPath>
      <g clipPath={`url(#clip-${t0}-${y})`}>
        {(() => {
          let a2 = 0;
          return words.map((w, i) => {
            const k = easeOut(clampT(t, t0 + i * 0.09, t0 + i * 0.09 + 0.6));
            const xx = a2;
            a2 += 0;
            const dy = (1 - k) * size * 1.1 - out * size * 1.3;
            return (
              <text
                key={i}
                x={x}
                y={y + dy}
                fontFamily={italic ? SERIF : SERIF_R}
                fontStyle={italic ? 'italic' : 'normal'}
                fontWeight={italic ? 700 : 400}
                fontSize={size}
                fill={c}
                textAnchor={anchor}
                opacity={k <= 0 ? 0 : 1}
              >
                {/* each word is laid out by preserving the full line and hiding the other words */}
                {words.map((ww, jj) => (
                  <tspan key={jj} fillOpacity={jj === i ? 1 : 0}>
                    {(jj ? ' ' : '') + ww}
                  </tspan>
                ))}
                {void xx}
              </text>
            );
          });
        })()}
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ the film */
export const GoldenVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const t = (frame + SUB) / FPS;
  const pr = twos(frame);
  const seeds = seedsAt(t);
  const z = zoomAt(t);
  const spin = t * 1.5; // the whole head turns very slowly, degrees
  const al = angleAt(t);
  const growth = isGrowth(t);
  const rimR = C * Math.sqrt(growth ? Math.max(1, growM(t)) : NS) + 8;

  // petals: open after the first growth, close for the explanation, open again at the end
  const petalK =
    t < B.petalsOut ? clampT(t, B.petalsIn, B.petalsIn + 1.4) * (1 - easeIn(clampT(t, B.petalsOut - 0.6, B.petalsOut))) : t >= B.petals2 && t < B.out0 + 0.6 ? clampT(t, B.petals2, B.petals2 + 1.4) * (1 - easeIn(clampT(t, B.out0, B.out0 + 0.6))) : 0;

  // spiral families
  const fam = (m: number, t0: number, col: string) => {
    if (t < t0 || growth) return null;
    const k = easeInOut(clampT(t, t0, t0 + 1.4));
    const fade = 1 - clampT(t, B.cones - 0.3, B.cones + 0.4);
    const lines: React.ReactNode[] = [];
    const pts = seeds;
    for (let s = 0; s < m; s++) {
      const p: string[] = [];
      for (let j = s; j < NS; j += m) p.push(`${pts[j].x.toFixed(1)},${pts[j].y.toFixed(1)}`);
      lines.push(<polyline key={s} points={p.join(' ')} fill="none" stroke={col} strokeWidth={3.2 / z} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k} opacity={0.9 * fade} />);
    }
    return <g>{lines}</g>;
  };

  // pinecone / pineapple morph: scales replace seeds and the head stretches
  const cone = clampT(t, B.cones, B.cones + 1.0) * (1 - clampT(t, B.final - 0.6, B.final));
  const coneE = easeInOut(cone);

  // the turn in the step-by-step part: an arc from the last seed to the next
  const stepArc = (() => {
    if (t < B.steps[0] - 0.2 || t > B.fast0 + 0.4) return null;
    const M = growM(t);
    const i = Math.floor(M);
    const a0 = (i - 1) * ag;
    const prog = (M % 1) || 1;
    const a1 = a0 + ag * prog;
    const R = 64;
    const arc = `M${Math.cos(a0) * R} ${Math.sin(a0) * R} A${R} ${R} 0 0 1 ${Math.cos(a1) * R} ${Math.sin(a1) * R}`;
    return (
      <g opacity={1 - clampT(t, B.fast0, B.fast0 + 0.4)}>
        <circle r={R} fill="none" stroke={G.cream} strokeWidth={1.2} strokeDasharray="3 5" opacity={0.5} />
        <path d={arc} fill="none" stroke={G.coral} strokeWidth={3.2} strokeLinecap="round" />
        <line x1={0} y1={0} x2={Math.cos(a1) * (R + 14)} y2={Math.sin(a1) * (R + 14)} stroke={G.coral} strokeWidth={2} />
      </g>
    );
  })();

  // the angle readout during the sweep
  const sweepOn = t > B.ask + 1.2 && t < B.golden + 0.2;
  const holdNow = B.holds.find((h) => t >= h.t0 - 0.1 && t < h.t1 + 0.35);

  // pollen drifting through the light
  const pollen = Array.from({length: 46}, (_, i) => {
    const sp = 18 + hash(i) * 30;
    const x = ((hash(i + 3) * W + t * (hash(i + 9) - 0.5) * 30) % W + W) % W;
    const y = (((hash(i + 5) * H - t * sp) % H) + H) % H;
    const r = 1.2 + hash(i + 7) * 2.6;
    return <circle key={i} cx={x} cy={y} r={r} fill={G.cream} opacity={0.08 + 0.18 * hash(i + 11)} />;
  });

  const zFinal = z * (1 - 0.34 * easeInOut(petalK));
  return (
    <AbsoluteFill style={{background: G.bg1}}>
      <Fonts />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="bg" cx="66%" cy="52%" r="75%">
            <stop offset="0%" stopColor={G.bg0} />
            <stop offset="100%" stopColor={G.bg1} />
          </radialGradient>
          <radialGradient id="halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={G.gold} stopOpacity={0.16} />
            <stop offset="100%" stopColor={G.gold} stopOpacity={0} />
          </radialGradient>
          <filter id="grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={pr % 61} />
            <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.95  0 0 0 0 0.85  0 0 0 -1.9 1.05" />
          </filter>
        </defs>
        <rect width={W} height={H} fill="url(#bg)" />
        {pollen}
        {/* leaves behind the head, swaying */}
        <g transform={`translate(${FX} ${FY}) scale(${(1 - 0.34 * easeInOut(petalK)).toFixed(4)})`} opacity={petalK}>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`rotate(${-150 + i * 120 + Math.sin(t * 0.9 + i) * 3}) translate(${rimR + 120} 0) scale(${2.4 * petalK} 2.4) translate(-104 -30)`}>
              <path d={LEAF} fill="#2E6B45" />
              <path d="M4 30 H204" stroke="#5FA06E" strokeWidth={1.2} />
            </g>
          ))}
        </g>
        <circle cx={FX} cy={FY} r={560} fill="url(#halo)" />
        <g transform={`translate(${FX} ${FY}) rotate(${spin.toFixed(3)}) scale(${(zFinal * (1 - 0.28 * coneE)).toFixed(4)} ${(zFinal * (1 + 0.22 * coneE)).toFixed(4)})`}>
          <Petals t={t} k={petalK} rimR={rimR} />
          {seeds.map((s, i) => {
            if (s.r <= 0.05) return null;
            const col = cone > 0 ? (s.j % 2 ? '#B9772B' : '#8C531B') : seedColor(s.j);
            if (coneE > 0.02) {
              // scales: rounded diamonds pointing outward
              const a = Math.atan2(s.y, s.x);
              const sz = s.r * (1 + 0.9 * coneE);
              return (
                <g key={i} transform={`translate(${s.x.toFixed(1)} ${s.y.toFixed(1)}) rotate(${((a * 180) / Math.PI).toFixed(1)})`}>
                  <path d={`M${-sz} 0 Q0 ${-sz * 1.05} ${sz} 0 Q0 ${sz * 1.05} ${-sz} 0Z`} fill={col} stroke={G.bg1} strokeWidth={0.8 / z} />
                </g>
              );
            }
            return <circle key={i} cx={s.x.toFixed(1)} cy={s.y.toFixed(1)} r={(s.r * (1 + 0.35 * (1 - s.born))).toFixed(2)} fill={col} />;
          })}
          {/* tiny highlights on the seeds (lit from the upper left) */}
          {cone < 0.02 &&
            seeds.map((s, i) => (s.r > 2 && i % 1 === 0 ? <circle key={`h${i}`} cx={(s.x - s.r * 0.3).toFixed(1)} cy={(s.y - s.r * 0.3).toFixed(1)} r={(s.r * 0.32).toFixed(2)} fill={G.cream} opacity={0.35} /> : null))}
          {fam(34, B.f34, G.coral)}
          {fam(55, B.f55, G.sage)}
          {stepArc}
        </g>

        {/* ---------------------------------------------- words (left column) */}
        <Line t={t} t0={-1} t1={3.4} x={150} y={420} text="One rule" size={110} />
        <Line t={t} t0={-1} t1={3.45} x={150} y={545} text="builds this." size={110} c={G.gold} />
        <Line t={t} t0={4.0} t1={7.4} x={150} y={440} text="A sunflower places" size={74} />
        <Line t={t} t0={4.2} t1={7.45} x={150} y={530} text="every seed with" size={74} />
        <Line t={t} t0={4.4} t1={7.5} x={150} y={620} text="the same turn." size={74} c={G.gold} />
        {['Turn.', 'Place a seed.', 'Push the rest out.', 'Repeat.'].map((s, i) => (
          <Line key={s} t={t} t0={B.steps[i]} t1={13.9} x={150} y={360 + i * 100} text={s} size={72} c={i === 0 ? G.coral : i === 3 ? G.gold : G.cream} />
        ))}
        <Line t={t} t0={B.ask} t1={15.8} x={150} y={500} text="But turn by" size={86} />
        <Line t={t} t0={B.ask + 0.2} t1={15.85} x={150} y={600} text="how much?" size={86} c={G.coral} />
        {sweepOn && (
          <g>
            <text x={150} y={520} fontFamily={SERIF} fontStyle="italic" fontWeight={700} fontSize={168} fill={holdNow && Math.abs(holdNow.a - GOLDEN) < 0.01 ? G.gold : G.cream} opacity={clampT(t, B.ask + 1.2, B.ask + 1.6)}>
              {al.toFixed(al > 137.2 && al < 137.8 ? 1 : 0)}°
            </text>
          </g>
        )}
        {B.holds.map((h) => (
          <Line key={h.a} t={t} t0={h.t0} t1={h.t1 + 0.2} x={156} y={610} text={h.label} size={52} italic={false} c={Math.abs(h.a - GOLDEN) < 0.01 ? G.gold : G.cream} />
        ))}
        <Line t={t} t0={B.golden} t1={33.2} x={150} y={330} text="137.5°" size={150} c={G.gold} />
        <Line t={t} t0={B.golden + 0.4} t1={33.2} x={154} y={410} text="the golden angle" size={56} italic={false} />
        <Line t={t} t0={27.9} t1={33.25} x={154} y={520} text="= 360° ÷ φ²" size={74} />
        <Line t={t} t0={28.9} t1={33.3} x={154} y={590} text="φ = 1.618…  the golden ratio" size={44} italic={false} c={G.sage} />
        <Line t={t} t0={30.1} t1={33.35} x={154} y={700} text="φ never settles into a neat fraction," size={44} italic={false} />
        <Line t={t} t0={31.3} t1={33.4} x={154} y={760} text="so the seeds never line up in rows." size={44} italic={false} c={G.gold} />
        <Line t={t} t0={B.count} t1={41.3} x={150} y={340} text="Count the spirals." size={80} />
        <Line t={t} t0={B.f34} t1={41.3} x={150} y={500} text="34" size={160} c={G.coral} />
        <Line t={t} t0={B.f34 + 0.2} t1={41.3} x={360} y={500} text="one way" size={52} italic={false} c={G.coral} />
        <Line t={t} t0={B.f55} t1={41.3} x={150} y={660} text="55" size={160} c={G.sage} />
        <Line t={t} t0={B.f55 + 0.2} t1={41.3} x={360} y={660} text="the other" size={52} italic={false} c={G.sage} />
        {t > B.fib - 0.1 && t < 41.8 && (
          <g opacity={1 - clampT(t, 41.3, 41.7)}>
            {[1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89].map((n, i) => {
              const k = easeOut(clampT(t, B.fib + i * 0.12, B.fib + i * 0.12 + 0.4));
              const hl = n === 34 ? G.coral : n === 55 && i === 9 ? G.sage : G.cream;
              return (
                <text key={i} x={150 + [0, 1, 2, 3, 4, 5, 6, 7.6, 9.2, 10.8, 12.4][i] * 52} y={830 + (1 - k) * 40} fontFamily={SERIF} fontStyle="italic" fontWeight={700} fontSize={56} fill={hl} opacity={k}>
                  {n}
                </text>
              );
            })}
            <text x={150} y={890} fontFamily={SERIF_R} fontSize={36} fill={G.cream} opacity={0.8 * clampT(t, 39.8, 40.3)}>
              each number is the two before it, added
            </text>
          </g>
        )}
        <Line t={t} t0={B.cones} t1={46.2} x={150} y={470} text="Pinecones and" size={78} />
        <Line t={t} t0={B.cones + 0.2} t1={46.25} x={150} y={565} text="pineapples spiral" size={78} />
        <Line t={t} t0={B.cones + 0.4} t1={46.3} x={150} y={660} text="the same way." size={78} c={G.gold} />
        <Line t={t} t0={B.final} t1={B.out0 + 0.4} x={150} y={470} text="Turn 137.5°." size={100} c={G.gold} />
        <Line t={t} t0={B.final + 0.5} t1={B.out0 + 0.45} x={150} y={590} text="Repeat." size={100} />
        <Line t={t} t0={B.again} x={150} y={420} text="One rule" size={110} />
        <Line t={t} t0={B.again + 0.15} x={150} y={545} text="builds this." size={110} c={G.gold} />

        <rect width={W} height={H} filter="url(#grain)" style={{mixBlendMode: 'overlay'}} opacity={0.22} />
      </svg>
    </AbsoluteFill>
  );
};
