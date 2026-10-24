import React from 'react';
import {C, F, clamp, eio2, eio3, eo2, eo3, ei2, ei3, kf, lerp, mix, nz, pop, prog, rng} from './lib';
import {FRI, FlyingPage, Island, JUL, Pad, PageSpec, starPath} from './art';
import {Full, Svg, PAD1} from './scenesA';

// ===================== S6 — everyone still got paid =====================
const Coin: React.FC<{x: number; y: number; s: number; flip: number}> = ({x, y, s, flip}) => (
  <g transform={`translate(${x} ${y}) scale(${s * Math.max(0.12, Math.abs(Math.cos(flip)))} ${s})`}>
    <circle r={46} fill={C.goldD} cy={6} />
    <circle r={46} fill={C.gold} />
    <circle r={34} fill="none" stroke={C.goldD} strokeWidth={5} />
    <path d={starPath(0, 2, 20, 5, 0.45)} fill={C.goldD} />
    <path d="M-30 -18 A36 36 0 0 1 -6 -36" stroke="#fff" strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.7} />
  </g>
);
export const S6: React.FC<{t: number}> = ({t}) => {
  const cam = 1 + 0.04 * eio2(prog(t, 27.9, 28.6));
  const pp = prog(t, 25.1, 25.75);
  const ps = lerp(2.05, 0.8, eo3(pp)) + (t > 25.75 ? -0.02 * Math.exp(-7 * (t - 25.75)) * Math.sin((t - 25.75) * 20) : 0);
  const py = lerp(900, 790, eo3(pp));
  const prz = lerp(4, -6, eo3(pp));
  // stamp
  const hit = 26.68;
  const sIn = prog(t, 26.42, hit), sOut = prog(t, hit + 0.14, hit + 0.55);
  const stampY = t < hit ? lerp(-380, 770, ei3(sIn)) : t < hit + 0.14 ? 770 : lerp(770, -500, eo2(sOut) * 0.4 + ei2(sOut) * 0.6);
  const stampSq = t >= hit && t < hit + 0.14 ? 1 - 0.08 * Math.sin(((t - hit) / 0.14) * Math.PI) : 1;
  const mark = t >= hit ? 1 + 0.18 * Math.exp(-10 * (t - hit)) : 0;
  const glow = t > 27.18 ? clamp(0.5 + 0.5 * Math.sin((t - 27.18) * 7.5)) * clamp((t - 27.18) * 4) : 0;
  const r = rng(77);
  const coins = Array.from({length: 7}, (_, i) => ({
    tx: [190, 330, 470, 640, 800, 920, 260][i], ty: [700, 1250, 640, 1270, 690, 1180, 1050][i], d: i * 0.045, H: 380 + r() * 260, sp: 12 + r() * 10,
  }));
  const conf = Array.from({length: 34}, () => ({x: r() * 1080, vy: 160 + r() * 200, c: [C.accent, C.coral, C.gold, '#fff', '#6CCB6A'][Math.floor(r() * 5)], sp: r() * 10, w: 12 + r() * 12}));
  const tc = t - (hit + 0.05);
  return (
    <Full>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${cam})`, transformOrigin: '540px 900px'}}>
        <Svg>
          <defs>
            <linearGradient id="s6wood" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#D49A62" />
              <stop offset="0.5" stopColor="#E3AE74" />
              <stop offset="1" stopColor="#CF935A" />
            </linearGradient>
            <radialGradient id="s6sun" cx="380" cy="600" r="1300" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#FFF4D6" stopOpacity="0.55" />
              <stop offset="1" stopColor="#FFF4D6" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="s6leaf">
              <stop offset="0" stopColor="#5A3415" stopOpacity="0.32" />
              <stop offset="1" stopColor="#5A3415" stopOpacity="0" />
            </radialGradient>
          </defs>
          {Array.from({length: 11}, (_, i) => (
            <g key={i}>
              <rect x={-40} y={-40 + i * 190} width={1160} height={186} fill="url(#s6wood)" />
              <rect x={-40} y={-40 + i * 190 + 186} width={1160} height={4} fill="#9A6332" />
              {[0, 1, 2].map((j) => (
                <path key={j} d={`M${-40 + j * 420 + (i % 2) * 180} ${-40 + i * 190 + 60 + j * 30} q 120 -14 260 0 t 260 0`} stroke="#B97C45" strokeWidth={3} fill="none" opacity={0.45} />
              ))}
            </g>
          ))}
          <rect x={-40} y={-40} width={1160} height={2000} fill="url(#s6sun)" />
          {/* dappled palm-leaf light */}
          {Array.from({length: 9}, (_, i) => (
            <ellipse key={i} cx={(i * 173 + t * 22 + Math.sin(t * 0.7 + i) * 40) % 1300 - 110} cy={150 + ((i * 397) % 1600)} rx={150 + (i % 3) * 50} ry={70 + (i % 2) * 40} fill="url(#s6leaf)" transform={`rotate(${-20 + i * 9} 540 900)`} />
          ))}
          {/* envelope back + open flap */}
          <g transform="rotate(-3 540 1010)">
            <ellipse cx={556} cy={1236} rx={330} ry={26} fill="#5A3415" opacity={0.25} />
            <path d="M210 805 L540 600 L870 805Z" fill="#C88F52" />
            <rect x={210} y={800} width={660} height={420} rx={18} fill="#D9A866" />
          </g>
        </Svg>
        <FlyingPage x={540} y={py} w={520} h={600} p={FRI} s={ps} rz={prz} torn glow={glow} stamp={mark} />
        <Svg>
          <g transform="rotate(-3 540 1010)">
            <path d="M210 840 L540 1000 L870 840 L870 1202 Q870 1220 852 1220 L228 1220 Q210 1220 210 1202Z" fill="#E4B878" />
            <path d="M210 840 L540 1000 L870 840" stroke="#C08A4E" strokeWidth={6} fill="none" />
            <text x={540} y={1150} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={84} fill="#A86F35" opacity={0.85}>
              WAGES
            </text>
          </g>
          {tc > 0 &&
            coins.map((c, i) => {
              const lt = tc - c.d;
              if (lt <= 0) return null;
              const p = clamp(lt / 0.62);
              const x = lerp(540, c.tx, eo2(p));
              const y0 = lerp(930, c.ty, eo2(p));
              let h = 4 * p * (1 - p) * c.H;
              if (p >= 1) h = Math.abs(Math.sin((lt - 0.62) * 14)) * 40 * Math.exp(-6 * (lt - 0.62));
              const flip = p < 1 ? lt * c.sp : 0;
              return (
                <g key={i}>
                  <ellipse cx={x + 12} cy={y0 + 34} rx={40 - h * 0.03} ry={14} fill="#5A3415" opacity={0.25} />
                  <Coin x={x} y={y0 - h} s={1 + h / 900} flip={flip} />
                </g>
              );
            })}
          {tc > 0 &&
            conf.map((c, i) => {
              const y = -60 + c.vy * tc;
              const x = c.x + Math.sin(tc * 3 + c.sp) * 40;
              return <rect key={i} x={x} y={y} width={c.w} height={c.w * 0.5} fill={c.c} transform={`rotate(${tc * 200 + c.sp * 40} ${x} ${y})`} />;
            })}
          {/* rubber stamp */}
          {t > 26.42 && sOut < 1 && (
            <g transform={`translate(540 ${stampY}) rotate(-14) scale(1 ${stampSq})`}>
              <ellipse cx={20} cy={130} rx={170} ry={30} fill="#000" opacity={t >= hit ? 0.0 : 0.12} />
              <rect x={-175} y={50} width={350} height={70} rx={14} fill="#B8322F" />
              <rect x={-160} y={20} width={320} height={40} rx={10} fill="#8C5A34" />
              <path d="M-36 20 L-26 -80 L26 -80 L36 20Z" fill="#A9733F" />
              <circle cx={0} cy={-110} r={56} fill="#C1864B" />
              <path d="M-30 -136 A40 40 0 0 1 10 -158" stroke="#fff" strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.4} />
            </g>
          )}
        </Svg>
      </div>
    </Full>
  );
};

// ===================== S7 — 1892: the opposite, and July 4th twice =====================
const Parchment: React.FC<{id: string}> = ({id}) => (
  <g>
    <defs>
      <linearGradient id={id + 'p'} x1="0" y1="0" x2="0" y2="1920" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#F6E8CA" />
        <stop offset="1" stopColor="#E6CFA2" />
      </linearGradient>
      <radialGradient id={id + 'v'} cx="540" cy="960" r="1150" gradientUnits="userSpaceOnUse">
        <stop offset="0.55" stopColor="#7A5228" stopOpacity="0" />
        <stop offset="1" stopColor="#7A5228" stopOpacity="0.45" />
      </radialGradient>
      <radialGradient id={id + 'b'}>
        <stop offset="0" stopColor="#B88B52" stopOpacity="0.22" />
        <stop offset="1" stopColor="#B88B52" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect x={-60} y={-60} width={1200} height={2040} fill={`url(#${id}p)`} />
    {[[180, 300, 260], [880, 760, 320], [300, 1400, 300], [900, 1700, 260], [620, 120, 200]].map(([x, y, r], i) => (
      <circle key={i} cx={x} cy={y} r={r} fill={`url(#${id}b)`} />
    ))}
    <path d="M-60 980 L1140 940" stroke="#fff" strokeWidth={6} opacity={0.35} />
    <path d="M-60 986 L1140 946" stroke="#B88B52" strokeWidth={2} opacity={0.35} />
    <path d="M520 -60 L560 1980" stroke="#fff" strokeWidth={5} opacity={0.25} />
  </g>
);
const InkWaves: React.FC<{t: number; y0: number; y1: number}> = ({t, y0, y1}) => (
  <g>
    {Array.from({length: 7}, (_, j) => {
      const y = lerp(y0, y1, j / 6);
      const off = ((t * 18 + j * 70) % 160);
      let d = '';
      for (let x = -160 + off - (j % 2) * 80; x < 1200; x += 160) d += `M${x} ${y} q 18 -12 36 0 q 18 12 36 0 `;
      return <path key={j} d={d} stroke={C.sepInk} strokeWidth={3.5} fill="none" opacity={0.35} strokeLinecap="round" />;
    })}
  </g>
);
const Ship1892: React.FC<{x: number; y: number; t: number}> = ({x, y, t}) => (
  <g transform={`translate(${x} ${y + Math.sin(t * 2) * 6}) rotate(${Math.sin(t * 1.6) * 3})`}>
    <path d="M-150 0 L150 0 Q130 60 90 70 L-100 70 Q-140 50 -150 0Z" fill="#8A5A34" />
    <path d="M-150 0 L150 0 L146 14 L-146 14Z" fill="#6E4423" />
    {[-80, 0, 80].map((mx, i) => (
      <g key={i}>
        <rect x={mx - 4} y={-230 + i * 10 * (i === 1 ? -1 : 1) * 0} width={8} height={230} fill="#5A3B22" />
        <path d={`M${mx - 60} ${-200 + Math.abs(mx) * 0.2} Q${mx + Math.sin(t * 2 + i) * 6} ${-170} ${mx + 60} ${-200 + Math.abs(mx) * 0.2} L${mx + 54} -110 Q${mx} -96 ${mx - 54} -110Z`} fill="#F8EBD0" stroke={C.sepInk} strokeWidth={3} />
        <path d={`M${mx - 46} -96 Q${mx + Math.sin(t * 2 + i) * 5} -74 ${mx + 46} -96 L${mx + 40} -26 Q${mx} -16 ${mx - 40} -26Z`} fill="#F8EBD0" stroke={C.sepInk} strokeWidth={3} />
      </g>
    ))}
    <path d={`M80 -230 l46 ${10 + Math.sin(t * 6) * 6} l-46 12Z`} fill={C.sepRed} />
  </g>
);
const Ribbon: React.FC<{x: number; y: number; s: number; text: string}> = ({x, y, s, text}) =>
  s <= 0 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(-3)`}>
      <path d="M-330 -10 L-400 -10 L-370 40 L-400 90 L-300 90Z" fill="#9C4A36" />
      <path d="M330 -10 L400 -10 L370 40 L400 90 L300 90Z" fill="#9C4A36" />
      <path d="M-320 -70 L320 -70 L320 70 L-320 70Z" fill={C.sepRed} />
      <path d="M-320 -70 L320 -70 L320 -44 L-320 -44Z" fill="#fff" opacity={0.15} />
      <text x={0} y={44} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={124} fill="#FBEFD6">
        {text}
      </text>
    </g>
  );
const Firework: React.FC<{x: number; y: number; t: number; t0: number; c: string[]; seed: number}> = ({x, y, t, t0, c, seed}) => {
  const lt = t - t0;
  if (lt < -0.35 || lt > 1.3) return null;
  if (lt < 0) {
    const p = (lt + 0.35) / 0.35;
    return <circle cx={x} cy={lerp(y + 500, y, eo2(p))} r={6} fill="#FFF3C4" />;
  }
  const r = rng(seed);
  const n = 18;
  const R = 230 * eo3(clamp(lt / 0.7));
  const fade = clamp(1.3 - lt);
  return (
    <g opacity={fade}>
      <circle cx={x} cy={y} r={60 * (1 - clamp(lt * 4))} fill="#FFF8D6" opacity={0.9} />
      {Array.from({length: n}, (_, i) => {
        const a = (i / n) * Math.PI * 2 + r() * 0.2;
        const rr = R * (0.85 + r() * 0.3);
        const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr + 80 * lt * lt;
        const qx = x + Math.cos(a) * rr * 0.62, qy = y + Math.sin(a) * rr * 0.62 + 40 * lt * lt;
        const col = c[i % c.length];
        return (
          <g key={i}>
            <path d={`M${qx} ${qy} L${px} ${py}`} stroke={col} strokeWidth={7} strokeLinecap="round" />
            <circle cx={px} cy={py} r={9} fill={col} />
          </g>
        );
      })}
    </g>
  );
};
const Bunting: React.FC<{t: number; y: number}> = ({t, y}) => {
  const cols = ['#C8323A', '#FFF7EA', '#2F56A8'];
  const n = 13;
  const sag = (u: number) => y + Math.sin(u * Math.PI) * 70 + Math.sin(t * 1.4) * 6;
  let line = '';
  for (let i = 0; i <= 40; i++) {
    const u = i / 40;
    line += (i ? 'L' : 'M') + (-40 + u * 1160).toFixed(1) + ' ' + sag(u).toFixed(1);
  }
  return (
    <g>
      <path d={line} stroke={C.sepInk} strokeWidth={4} fill="none" />
      {Array.from({length: n}, (_, i) => {
        const u = (i + 0.5) / n;
        const x = -40 + u * 1160, yy = sag(u);
        const sw = Math.sin(t * 3 + i) * 6;
        return <path key={i} d={`M${x - 36} ${yy} L${x + 36} ${yy} L${x + sw} ${yy + 84}Z`} fill={cols[i % 3]} stroke="#00000020" strokeWidth={2} />;
      })}
    </g>
  );
};
export const S7: React.FC<{t: number}> = ({t}) => {
  // part A: 1892 chart, island hops the other way
  const whip = eio3(prog(t, 33.48, 33.82));
  const ban = pop(t, 30.26, 1.8, 6.5);
  const isl = pop(t, 30.6, 1.8, 6.5);
  const h0 = 32.02, h1 = 32.98;
  const air = prog(t, h0, h1);
  const ix = lerp(285, 805, eio2(air));
  const lift = Math.sin(air * Math.PI) * 420 * (air > 0 && air < 1 ? 1 : 0);
  const land = t - h1;
  const sq = t < h0 ? eio2(prog(t, 31.82, h0)) : t < h1 ? -0.7 * Math.exp(-6 * (t - h0)) : Math.exp(-6 * land) * Math.cos(land * 20) * 1.1;
  const arrow = pop(t, 32.98, 1.8, 6.5);
  // part B: July 4th, twice
  const padY = lerp(2600, PAD1.y, 1) ;
  const flip1 = eio3(prog(t, 34.66, 34.98)) * 330;
  const flip2 = eio3(prog(t, 35.5, 35.8)) * 330;
  const x2 = pop(t, 35.0, 1.8, 6) * (1 - eo3(prog(t, 35.42, 35.62)));
  const pulse4 = 1 + 0.05 * (t > 34.12 ? Math.exp(-8 * (t - 34.12)) : 0);
  const newBoard = t > 35.5;
  const bunt = pop(t, 33.7, 1.6, 6);
  const fwc = [['#E8484D', '#FFF3C4', '#3C6BD6'], ['#FFC93C', '#fff', '#E8484D'], ['#3C6BD6', '#fff', '#7FF5EA'], ['#E8484D', '#FFC93C', '#fff']];
  return (
    <Full>
      {/* ---------- A ---------- */}
      {whip < 1 && <div style={{position: 'absolute', inset: 0, transform: `translateY(${-1920 * whip}px)`}}>
        <Svg>
          <Parchment id="s7a" />
          <InkWaves t={t} y0={560} y1={1500} />
          <g transform={`translate(860 1360) rotate(${t * 6})`} opacity={0.75}>
            <circle r={120} fill="none" stroke={C.sepInk} strokeWidth={4} />
            <circle r={96} fill="none" stroke={C.sepInk} strokeWidth={2} />
            <path d={starPath(0, 0, 112, 4, 0.18, -Math.PI / 2)} fill={C.sepInk} opacity={0.85} />
            <path d={starPath(0, 0, 80, 4, 0.2, -Math.PI / 4)} fill={C.sepRed} opacity={0.8} />
          </g>
          <g transform={`translate(${lerp(170, 240, prog(t, 29, 33.8))} 610) scale(0.8)`}><Ship1892 x={0} y={0} t={t} /></g>
          <line x1={540} y1={520} x2={540} y2={1340} stroke="#3FBFB3" strokeWidth={26} opacity={0.25} />
          <line x1={540} y1={520} x2={540} y2={1340} stroke={C.sepInk} strokeWidth={6} strokeDasharray="30 20" strokeDashoffset={-t * 50} />
          {arrow > 0 && (
            <g transform={`translate(540 770) scale(${arrow})`} opacity={0.9}>
              <path d="M-230 60 Q0 -80 230 60" stroke={C.sepRed} strokeWidth={14} fill="none" strokeLinecap="round" />
              <path d="M200 10 L246 72 L170 82Z" fill={C.sepRed} />
            </g>
          )}
          {isl > 0 && (
            <g>
              <ellipse cx={ix + 10} cy={1205} rx={240 * (1 - lift / 1200)} ry={54 * (1 - lift / 1200)} fill={C.sepInk} opacity={0.2} />
              {land > 0 &&
                [0, 1].map((i) => {
                  const p = clamp((land - i * 0.12) / 0.9);
                  return <ellipse key={i} cx={ix} cy={1195} rx={250 + p * 260} ry={60 + p * 60} fill="none" stroke={C.sepInk} strokeWidth={5 - p * 4} opacity={(1 - p) * 0.6} />;
                })}
              <g transform={`translate(${ix} ${1035 - lift}) scale(${0.5 + 0.5 * isl})`} style={{filter: 'sepia(0.75) saturate(0.8) brightness(1.02)'}}>
                <Island t={t} id="s7isl" flagP={0} s={0.56} squash={sq} />
              </g>
            </g>
          )}
          <Ribbon x={540} y={300} s={ban} text="1892" />
        </Svg>
      </div>}
      {/* ---------- B ---------- */}
      {whip > 0 && <div style={{position: 'absolute', inset: 0, transform: `translateY(${1920 * (1 - whip)}px)`}}>
        <Svg>
          <Parchment id="s7b" />
          <InkWaves t={t} y0={1380} y1={1800} />
          <Firework x={250} y={420} t={t} t0={34.15} c={fwc[0]} seed={1} />
          <Firework x={840} y={380} t={t} t0={34.5} c={fwc[1]} seed={2} />
          <Firework x={540} y={300} t={t} t0={35.04} c={fwc[2]} seed={3} />
          <Firework x={230} y={330} t={t} t0={35.32} c={fwc[3]} seed={4} />
          <Firework x={860} y={560} t={t} t0={35.5} c={fwc[0]} seed={5} />
          <g transform={`translate(0 ${-200 * (1 - bunt)})`}>
            <Bunting t={t} y={120} />
          </g>
        </Svg>
        <Pad
          x={PAD1.x}
          y={padY}
          w={PAD1.w}
          h={PAD1.h}
          old={!newBoard}
          scale={pulse4}
          rot={0}
          pages={[{p: JUL, ang: flip1}, {p: JUL, ang: flip2}, {p: FRI}]}
        />
        {x2 > 0 && (
          <Svg>
            <g transform={`translate(${PAD1.x + 225} ${PAD1.y - 250}) scale(${x2}) rotate(10)`}>
              <circle r={104} fill="#0B9C92" cy={8} />
              <circle r={104} fill={C.accent} />
              <circle r={86} fill="none" stroke="#fff" strokeWidth={6} opacity={0.6} />
              <text x={0} y={40} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={112} fill="#fff">
                ×2
              </text>
            </g>
          </Svg>
        )}
      </div>}
    </Full>
  );
};
