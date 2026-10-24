import React from 'react';
import {C, F, clamp, eio2, eio3, eo2, eo3, ei2, kf, lerp, mix, nz, pop, prog, rng} from './lib';
import {Cloud, FRI, FlagPole, FlyingPage, Island, Pad, Palm, SAT, Sky, Sun, THU, blob, smooth} from './art';
import {Full, SeaRows, Svg} from './scenesA';

// ---------- map geometry (real lon/lat, compressed for portrait) ----------
const mx = (lon: number) => 50 + (lon - 113) * 11.5;
const my = (lat: number) => 640 + (-lat - 10.7) * 12;
const AUS: [number, number][] = [
  [142.5, -10.7], [143.5, -14], [145.3, -15], [146, -18.5], [149, -21], [150.8, -23.5], [153.2, -25.5], [153.6, -28.2], [153, -31], [152, -32.8], [150.8, -34.5], [150, -37.5],
  [147.5, -38], [145.5, -38.6], [143.5, -38.8], [141, -38.2], [139.7, -37.3], [138.5, -35.5], [137.6, -35.8], [137.8, -33], [136, -34.8], [135, -34.5], [134, -32.6], [131, -31.5],
  [126, -32.3], [123.5, -33.9], [119.5, -34.4], [117.5, -35], [115, -34.2], [115.6, -32], [115, -29.5], [114, -26.5], [113.5, -24], [114, -22], [116.5, -20.7], [119, -20],
  [121.5, -18.5], [122.3, -17], [124, -16], [125.8, -14.5], [127.5, -14.2], [129.5, -15], [130.5, -12.5], [132.5, -11.5], [134.5, -12], [136.5, -12], [136, -13.5], [135.5, -15],
  [137.5, -16.2], [139.3, -17.5], [140.8, -17.4], [141.6, -15], [141.6, -12.5],
];
const NZN: [number, number][] = [[172.7, -34.4], [174.3, -35.6], [175.5, -36.8], [176, -37.6], [178, -37.6], [178.5, -38.2], [177.9, -39.2], [176.9, -39.6], [176, -41.3], [174.8, -41.4], [175.2, -40.4], [174, -39.4], [174.6, -38.2], [174.4, -36.8], [173.2, -35.3]];
const NZS: [number, number][] = [[172.7, -40.5], [174.2, -41.3], [173.9, -42.2], [173, -43.2], [172.8, -43.9], [171.3, -44.4], [170.8, -45.8], [169.2, -46.6], [166.5, -46], [166.9, -45.1], [168.4, -44], [170.5, -42.9], [171.4, -41.8], [172.1, -40.8]];
const P = (pts: [number, number][]) => smooth(pts.map(([lo, la]) => [mx(lo), my(la)] as [number, number]));
const dAUS = P(AUS), dNZN = P(NZN), dNZS = P(NZS);
export const LINE_X = 872;
const WS = {x: 962, y: 676};

const Land: React.FC<{d: string; top: string; side: string; ext: number; lift: number; ocean: string; rim?: string}> = ({d, top, side, ext, lift, ocean, rim}) => {
  const k = (c: string) => mix(c, ocean, 0.5 * (1 - lift));
  return (
    <g>
      <path d={d} fill="none" stroke="#fff" strokeWidth={12} opacity={0.25} strokeLinejoin="round" />
      <g transform={`translate(0 ${ext})`}>
        <path d={d} fill={k(side)} />
      </g>
      <path d={d} fill={k(top)} stroke={rim ? k(rim) : 'none'} strokeWidth={10} strokeLinejoin="round" />
    </g>
  );
};
const Ship: React.FC<{x: number; y: number; ang: number; t: number; s?: number; seed?: number}> = ({x, y, ang, t, s = 1, seed = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${ang}) scale(${s * (1 + Math.sin(t * 3 + seed) * 0.015)})`}>
    {[0, 1, 2].map((i) => {
      const p = ((t * 0.9 + i / 3 + seed) % 1);
      return (
        <g key={i} opacity={(1 - p) * 0.7}>
          <path d={`M${-60 - p * 120} ${-14 - p * 40} L${-60} -12 M${-60 - p * 120} ${14 + p * 40} L-60 12`} stroke="#fff" strokeWidth={5} strokeLinecap="round" />
        </g>
      );
    })}
    <path d="M-62 -18 L44 -18 Q70 -16 82 0 Q70 16 44 18 L-62 18 Q-68 0 -62 -18Z" fill="#E4534F" />
    <path d="M-62 -18 L44 -18 Q70 -16 82 0 L-66 0 Z" fill="#fff" opacity={0.18} />
    {[['#2E86DE', '#FFC93C'], ['#20BF6B', '#EB3B5A'], ['#FA8231', '#2E86DE'], ['#FFC93C', '#20BF6B']].map(([a, b], i) => (
      <g key={i}>
        <rect x={-40 + i * 21} y={-14} width={19} height={13} rx={2} fill={a} />
        <rect x={-40 + i * 21} y={1} width={19} height={13} rx={2} fill={b} />
      </g>
    ))}
    <rect x={-60} y={-12} width={16} height={24} rx={4} fill="#fff" />
  </g>
);
const Clock: React.FC<{x: number; y: number; t: number; s: number; sweep: number}> = ({x, y, t, s, sweep}) => {
  if (s <= 0) return null;
  const R = 112;
  const a = (sweep * Math.PI) / 180;
  const wedge = sweep > 0.5 ? `M0 0 L0 ${-R + 14} A${R - 14} ${R - 14} 0 ${sweep > 180 ? 1 : 0} 1 ${(Math.sin(a) * (R - 14)).toFixed(1)} ${(-Math.cos(a) * (R - 14)).toFixed(1)}Z` : '';
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r={R + 18} fill="#0B2E5E" opacity={0.25} cy={10} />
      <circle r={R} fill="#fff" stroke={C.navy} strokeWidth={12} />
      {wedge && <path d={wedge} fill={C.accent} opacity={0.85} />}
      {Array.from({length: 12}, (_, i) => (
        <rect key={i} x={-3} y={-R + 18} width={6} height={i % 3 === 0 ? 20 : 12} rx={3} fill={C.navy} transform={`rotate(${i * 30})`} />
      ))}
      <g transform={`rotate(${sweep})`}>
        <rect x={-6} y={-R + 30} width={12} height={R - 26} rx={6} fill={C.navy} />
      </g>
      <circle r={13} fill={C.navy} />
      <circle r={5} fill="#fff" />
      {/* two little bells on top */}
      <circle cx={-70} cy={-104} r={20} fill={C.navy} />
      <circle cx={70} cy={-104} r={20} fill={C.navy} />
    </g>
  );
};
const DateLineV: React.FC<{x: number; y0: number; y1: number; t: number; on: number}> = ({x, y0, y1, t, on}) => {
  if (on <= 0) return null;
  const off = (t * 70) % 64;
  return (
    <g opacity={on}>
      <rect x={x - 36} y={y0} width={72} height={y1 - y0} fill={C.accent} opacity={0.16} />
      <rect x={x - 16} y={y0} width={32} height={y1 - y0} fill={C.accent} opacity={0.22} />
      <line x1={x} y1={y0 - 64 + off} x2={x} y2={y1} stroke={C.accentL} strokeWidth={9} strokeDasharray="40 24" strokeLinecap="round" />
    </g>
  );
};

// ===================== S4 — the map: partners a day ahead =====================
export const S4: React.FC<{t: number}> = ({t}) => {
  const ocean = '#1E78C2';
  const sc = kf(t, [[12.4, 2.4], [13.4, 1.38], [14.1, 1.38], [14.55, 1.62], [15.05, 1.62], [15.35, 1.7], [15.85, 1.7], [16.3, 1.22], [17.95, 1.25], [18.38, 3.8]], eio3);
  const fx = kf(t, [[12.4, WS.x], [13.4, 720], [14.1, 700], [14.55, 330], [15.05, 340], [15.35, 690], [15.85, 690], [16.3, 640], [17.95, 660], [18.38, LINE_X]], eio3);
  const fy = kf(t, [[12.4, WS.y], [13.4, 820], [14.1, 830], [14.55, 820], [15.05, 820], [15.35, 960], [15.85, 950], [16.3, 800], [17.95, 790], [18.38, 760]], eio3);
  const au = pop(t, 14.55, 1.6, 6);
  const nzp = pop(t, 15.3, 1.6, 6);
  const lineOn = t < 16.06 ? 0 : t < 16.12 ? 1 : t < 16.18 ? 0.2 : t < 16.26 ? 1 : t < 16.3 ? 0.4 : 1;
  const clk = pop(t, 16.04, 1.8, 6.5);
  const sweep = eo3(prog(t, 16.24, 17.6)) * 315;
  const r = rng(9);
  const arcs = Array.from({length: 60}, () => ({x: r() * 1300 - 110, y: 80 + r() * 1700, s: 0.6 + r() * 0.8, ph: r() * 6}));
  // ships
  const s1 = prog(t, 12.4, 18.4), s2 = prog(t, 12.4, 18.4);
  const sh1 = {x: lerp(930, 600, s1), y: lerp(735, 770, s1)};
  const sh2 = {x: lerp(700, 935, s2), y: lerp(1120, 760, s2)};
  return (
    <Full>
      <Svg>
        <defs>
          <radialGradient id="s4o" cx="540" cy="860" r="1100" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#3AA6E0" />
            <stop offset="1" stopColor="#11508F" />
          </radialGradient>
        </defs>
        <rect x={-100} y={-100} width={1280} height={2120} fill="url(#s4o)" />
        <g transform={`translate(540 960) scale(${sc}) translate(${-fx} ${-fy})`}>
          {arcs.map((a, i) => {
            const x = a.x + Math.sin(t * 0.6 + a.ph) * 14 + t * 6;
            const y = a.y + Math.sin(t * 1.1 + a.ph) * 5;
            return <path key={i} d={`M${x} ${y} q 16 -9 32 0 q 16 9 32 0`} stroke="#9AD8FF" strokeWidth={3 * a.s} fill="none" opacity={0.35} strokeLinecap="round" />;
          })}
          <Land d={dAUS} top="#F2BA6E" side="#B9783C" rim="#72C46B" ext={4 + 14 * au} lift={clamp(au)} ocean={ocean} />
          <ellipse cx={mx(146.6)} cy={my(-42) + 4 + 10 * au} rx={24} ry={18} fill={mix('#3E9C57', ocean, 0.5 * (1 - clamp(au)))} />
          <ellipse cx={mx(146.6)} cy={my(-42)} rx={24} ry={18} fill={mix('#72C46B', ocean, 0.5 * (1 - clamp(au)))} />
          <Land d={dNZN} top="#72C46B" side="#3E9C57" ext={4 + 12 * nzp} lift={clamp(nzp)} ocean={ocean} />
          <Land d={dNZS} top="#72C46B" side="#3E9C57" ext={4 + 12 * nzp} lift={clamp(nzp)} ocean={ocean} />
          {/* Samoa */}
          <g>
            <path d={blob(WS.x - 26, WS.y - 8 + 10, 40, 22, 3)} fill="#3E9C57" />
            <path d={blob(WS.x - 26, WS.y - 8, 40, 22, 3)} fill="#72C46B" stroke={C.sand} strokeWidth={6} />
            <path d={blob(WS.x + 38, WS.y + 18 + 9, 34, 16, 6)} fill="#3E9C57" />
            <path d={blob(WS.x + 38, WS.y + 18, 34, 16, 6)} fill="#72C46B" stroke={C.sand} strokeWidth={6} />
            {[0, 1, 2].map((i) => (
              <circle key={i} cx={WS.x} cy={WS.y + 5} r={70 + ((t * 40 + i * 30) % 90)} fill="none" stroke="#fff" strokeWidth={3} opacity={(1 - ((t * 40 + i * 30) % 90) / 90) * 0.5} />
            ))}
          </g>
          <Ship x={sh1.x} y={sh1.y} ang={176} t={t} seed={0.2} s={0.95} />
          <Ship x={sh2.x} y={sh2.y} ang={-57} t={t} seed={0.6} s={0.85} />
          <DateLineV x={LINE_X} y0={-200} y1={2100} t={t} on={lineOn} />
          <FlagPole x={mx(133)} y={my(-25)} pole={150} w={190} h={95} t={t} p={clamp(au * 0.9)} id="s4au" kind="au" />
          <FlagPole x={mx(170.2)} y={my(-44.2)} pole={130} w={150} h={75} t={t} p={clamp(nzp * 0.9)} id="s4nz" kind="nz" />
          <FlagPole x={WS.x - 30} y={WS.y - 14} pole={120} w={120} h={64} t={t} p={1} id="s4ws" kind="ws" />
          {[0, 1].map((i) => {
            const x = ((t * (26 + i * 10) + i * 600) % 1700) - 300;
            return <Cloud key={i} x={x} y={i ? 520 : 1200} s={1.1 + i * 0.3} op={0.85} />;
          })}
          <Clock x={LINE_X} y={390} t={t} s={clk} sweep={sweep} />
        </g>
      </Svg>
    </Full>
  );
};

// ===================== S4b — split: Monday in Sydney | Sunday in Samoa =====================
const seamX = (y: number) => lerp(612, 468, y / 1920);
const Pill: React.FC<{x: number; y: number; s: number; text: string; fill: string; w?: number}> = ({x, y, s, text, fill, w = 380}) =>
  s <= 0 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-w / 2} y={-56 + 10} width={w} height={112} rx={56} fill="#000" opacity={0.15} />
      <rect x={-w / 2} y={-56} width={w} height={112} rx={56} fill={fill} />
      <rect x={-w / 2 + 16} y={-48} width={w - 32} height={36} rx={18} fill="#fff" opacity={0.2} />
      <text x={0} y={25} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={70} fill="#fff">
        {text}
      </text>
    </g>
  );
export const S4b: React.FC<{t: number}> = ({t}) => {
  const inL = eo3(prog(t, 18.28, 18.62)), inR = eo3(prog(t, 18.32, 18.66));
  const outP = eio3(prog(t, 22.22, 22.62));
  const offL = -560 * (1 - inL) - 640 * outP, offR = 560 * (1 - inR) + 640 * outP;
  const mon = pop(t, 19.5, 1.8, 6.5), sun = pop(t, 21.44, 1.8, 6.5);
  const auf = clamp(eo3(prog(t, 18.52, 19.1))), wsf = clamp(eo3(prog(t, 20.22, 20.8)));
  const pushR = 1 + 0.035 * eio2(prog(t, 20.2, 21.0));
  const blink = (seed: number) => ((t + seed) % 3.1 < 0.12 ? 0.15 : 1);
  const type = (i: number) => Math.max(0, Math.sin(t * 22 + i * Math.PI)) * 10;
  const sway = Math.sin(t * 1.5) * 16;
  const leftClip = `M-20 -20 L${seamX(-20)} -20 L${seamX(1940)} 1940 L-20 1940Z`;
  const rightClip = `M${seamX(-20)} -20 L1100 -20 L1100 1940 L${seamX(1940)} 1940Z`;
  const r = rng(21);
  const bld = Array.from({length: 9}, (_, i) => ({x: -20 + i * 74, w: 64 + r() * 20, h: 260 + r() * 420, c: ['#7FA6D9', '#9BB8E3', '#6C93CC'][i % 3]}));
  return (
    <Full>
      <Svg>
        <defs>
          <clipPath id="s4bl">
            <path d={leftClip} />
          </clipPath>
          <clipPath id="s4br">
            <path d={rightClip} />
          </clipPath>
          <linearGradient id="s4bsky" x1="0" y1="0" x2="0" y2="1100" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#5DB9F5" />
            <stop offset="1" stopColor="#D2F0FF" />
          </linearGradient>
          <linearGradient id="s4bsky2" x1="0" y1="0" x2="0" y2="1050" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#6CC4F7" />
            <stop offset="1" stopColor="#FFF0D2" />
          </linearGradient>
        </defs>
        {/* ---------- LEFT: Sydney, Monday ---------- */}
        <g transform={`translate(${offL} 0)`}>
          <g clipPath="url(#s4bl)">
            <g transform="translate(300 1240) scale(1.28) translate(-300 -1240)">
            <rect x={-40} y={-40} width={800} height={2000} fill="url(#s4bsky)" />
            <Cloud x={((t * 18) % 900) - 150} y={260} s={0.8} />
            {bld.map((b, i) => (
              <g key={i}>
                <rect x={b.x} y={1120 - b.h} width={b.w} height={b.h} fill={b.c} />
                <rect x={b.x} y={1120 - b.h} width={b.w * 0.3} height={b.h} fill="#fff" opacity={0.15} />
                {Array.from({length: Math.floor(b.h / 46)}, (_, j) =>
                  [0, 1].map((c) => {
                    const lit = Math.sin(i * 3.1 + j * 1.7 + c + Math.floor(t * 1.5 + i * 0.3) * 0.9) > 0.2;
                    return <rect key={j * 2 + c} x={b.x + 10 + c * (b.w / 2 - 4)} y={1120 - b.h + 18 + j * 46} width={b.w / 2 - 16} height={24} rx={3} fill={lit ? '#FFF4C2' : '#4F75AE'} opacity={0.85} />;
                  })
                )}
              </g>
            ))}
            <rect x={96} y={1120 - 700} width={10} height={60} fill="#5E7FB5" />
            <FlagPole x={300} y={1120 - 640} pole={110} w={140} h={70} t={t} p={auf} id="s4bau" kind="au" />
            {/* harbour shells */}
            <path d="M330 1120 Q380 1010 440 1000 Q420 1060 430 1120Z" fill="#F7F7F2" />
            <path d="M400 1120 Q460 1030 520 1030 Q500 1080 505 1120Z" fill="#EDEDE6" />
            <rect x={-40} y={1120} width={800} height={800} fill="#2E8FD0" />
            <SeaRows t={t} y0={1130} y1={1600} color="#BFE6FF" rows={6} op={0.4} speed={30} />
            {/* office window frame */}
            <rect x={-40} y={140} width={800} height={26} fill="#E9EDF3" />
            <rect x={-40} y={1180} width={800} height={30} fill="#E9EDF3" />
            {[150, 470].map((x, i) => (
              <rect key={i} x={x} y={140} width={22} height={1070} fill="#E9EDF3" />
            ))}
            <rect x={-40} y={1200} width={800} height={740} fill="#F3EDE3" />
            {/* worker */}
            <g transform="translate(250 880)">
              <rect x={-150} y={-30} width={300} height={360} rx={50} fill="#38457A" />
              <path d="M-140 330 Q-140 80 0 80 Q140 80 140 330Z" fill="#4C86E0" />
              <path d="M-45 88 L0 140 L45 88Z" fill="#fff" />
              <path d="M-10 128 L10 128 L18 230 L0 250 L-18 230Z" fill={C.coral} />
              <rect x={-30} y={30} width={60} height={60} fill="#E0A884" />
              <circle cx={0} cy={-20} r={100} fill="#EDB993" />
              <ellipse cx={-98} cy={-14} rx={18} ry={26} fill="#E0A884" />
              <ellipse cx={98} cy={-14} rx={18} ry={26} fill="#E0A884" />
              <path d="M-102 -30 Q-100 -140 0 -136 Q104 -140 102 -30 Q86 -90 30 -96 Q-10 -70 -60 -92 Q-92 -80 -102 -30Z" fill="#3B2A20" />
              <g transform={`translate(0 ${Math.sin(t * 22) * 1.5})`}>
                <ellipse cx={-36} cy={-6} rx={12} ry={14 * blink(0.4)} fill={C.navy} />
                <ellipse cx={36} cy={-6} rx={12} ry={14 * blink(0.4)} fill={C.navy} />
              </g>
              <path d="M-24 42 Q0 58 24 42" stroke={C.navy} strokeWidth={7} fill="none" strokeLinecap="round" />
              <ellipse cx={-62} cy={24} rx={16} ry={9} fill="#FF9A8B" opacity={0.5} />
              <ellipse cx={62} cy={24} rx={16} ry={9} fill="#FF9A8B" opacity={0.5} />
              <path d={`M-120 170 Q-150 260 -90 ${300 - type(0)}`} stroke="#4C86E0" strokeWidth={46} fill="none" strokeLinecap="round" />
              <path d={`M120 170 Q150 260 90 ${300 - type(1)}`} stroke="#4C86E0" strokeWidth={46} fill="none" strokeLinecap="round" />
            </g>
            {/* desk + laptop + mug */}
            <rect x={-40} y={1160} width={800} height={40} fill="#C68B59" />
            <rect x={-40} y={1196} width={800} height={14} fill="#9C6638" />
            <path d="M120 1160 L132 980 Q134 966 148 966 L352 966 Q366 966 368 980 L380 1160Z" fill="#CBD4E2" />
            <circle cx={250} cy={1062} r={20} fill="#fff" opacity={0.6} />
            <rect x={100} y={1152} width={300} height={14} rx={7} fill="#AEB8C8" />
            <g transform="translate(470 1100)">
              <rect x={-34} y={-50} width={68} height={70} rx={12} fill={C.coral} />
              <path d="M34 -36 q30 0 30 22 q0 22 -30 22" stroke={C.coral} strokeWidth={12} fill="none" />
              {[0, 1, 2].map((i) => {
                const p = (t * 0.7 + i / 3) % 1;
                return <path key={i} d={`M${-12 + i * 12} -60 q ${10 * Math.sin(p * 6 + i)} -30 0 -60`} transform={`translate(0 ${-p * 60})`} stroke="#fff" strokeWidth={6} fill="none" strokeLinecap="round" opacity={Math.sin(p * Math.PI) * 0.8} />;
              })}
            </g>
            </g>
          </g>
        </g>
        {/* ---------- RIGHT: Samoa, Sunday ---------- */}
        <g transform={`translate(${offR} 0)`}>
          <g clipPath="url(#s4br)">
            <g transform={`translate(830 1250) scale(${1.28 * pushR}) translate(-830 -1250)`}>
              <rect x={300} y={-40} width={820} height={2000} fill="url(#s4bsky2)" />
              <Sun x={900} y={300} r={70} t={t} id="s4bsun" />
              <Cloud x={((t * 14 + 400) % 900) + 300} y={560} s={0.7} />
              <rect x={300} y={1000} width={820} height={300} fill="#28B4E0" />
              <rect x={300} y={998} width={820} height={4} fill="#fff" opacity={0.5} />
              <SeaRows t={t} y0={1010} y1={1260} color="#E6FBFF" rows={6} op={0.5} speed={24} />
              <path d={`M300 1270 ${Array.from({length: 18}, (_, i) => `L${300 + i * 50} ${1268 + Math.sin(i * 0.9 + t * 2) * 8}`).join(' ')} L1150 1950 L300 1950Z`} fill={C.sand} />
              <path d={`M300 1270 ${Array.from({length: 18}, (_, i) => `L${300 + i * 50} ${1268 + Math.sin(i * 0.9 + t * 2) * 8}`).join(' ')}`} stroke="#fff" strokeWidth={8} fill="none" opacity={0.75} />
              <Palm x={655} y={1400} h={470} lean={-50} t={t} seed={2} />
              <Palm x={1050} y={1380} h={450} lean={50} t={t} seed={6} />
              <FlagPole x={1000} y={1330} pole={150} w={120} h={64} t={t} p={wsf} id="s4bws" kind="ws" />
              {/* hammock + relaxing person */}
              <g>
                <path d={`M640 1065 Q${830 + sway} ${1215} 1030 1040`} stroke="#fff" strokeWidth={4} fill="none" opacity={0.6} />
                <g transform={`translate(${sway * 0.5} 0)`}>
                  <circle cx={712} cy={1076} r={50} fill="#A86A45" />
                  <ellipse cx={706} cy={1040} rx={80} ry={20} fill="#F4D58D" transform="rotate(-18 706 1040)" />
                  <ellipse cx={700} cy={1022} rx={44} ry={30} fill="#F4D58D" transform="rotate(-18 700 1022)" />
                  <rect x={672} y={1018} width={56} height={10} fill={C.coral} transform="rotate(-18 700 1022)" />
                  <rect x={700} y={1070} width={34} height={18} rx={8} fill={C.navy} />
                  <rect x={738} y={1066} width={30} height={18} rx={8} fill={C.navy} transform="rotate(-8 750 1074)" />
                  <path d="M716 1104 Q730 1112 744 1104" stroke={C.navy} strokeWidth={5} fill="none" strokeLinecap="round" />
                  <path d="M760 1100 Q840 1170 940 1095" stroke="#FF8A65" strokeWidth={70} fill="none" strokeLinecap="round" />
                  <path d="M920 1090 L1000 1060" stroke="#A86A45" strokeWidth={26} strokeLinecap="round" />
                  <path d="M925 1105 L1004 1084" stroke="#94593A" strokeWidth={26} strokeLinecap="round" />
                </g>
                <path d={`M640 1065 Q${830 + sway} 1250 1030 1040 Q${830 + sway} 1170 640 1065Z`} fill="#3FC5B8" />
                <path d={`M640 1065 Q${830 + sway} 1250 1030 1040`} stroke="#2A9E93" strokeWidth={8} fill="none" />
                {[0, 1, 2, 3, 4, 5].map((i) => {
                  const u = (i + 1) / 7;
                  const x = lerp(640, 1030, u) + sway * Math.sin(u * Math.PI);
                  return <line key={i} x1={x} y1={1060 + Math.sin(u * Math.PI) * 120} x2={x + 6} y2={1060 + Math.sin(u * Math.PI) * 150} stroke="#FFE38A" strokeWidth={6} strokeLinecap="round" />;
                })}
              </g>
              {/* coconut drink */}
              <g transform="translate(780 1330)">
                <circle r={34} fill="#7A4E2A" />
                <ellipse cx={0} cy={-22} rx={26} ry={9} fill="#F5EBD0" />
                <path d="M6 -24 L28 -78" stroke={C.coral} strokeWidth={7} strokeLinecap="round" />
                <path d="M-8 -26 q -18 -16 -6 -30 q 14 6 6 30Z" fill="#FFC93C" />
              </g>
            </g>
          </g>
        </g>
        {/* the seam = the date line */}
        <g opacity={inL}>
          <path d={`M${seamX(-20)} -20 L${seamX(1940)} 1940`} stroke={C.accent} strokeWidth={50} opacity={0.25} />
          <path d={`M${seamX(-20)} -20 L${seamX(1940)} 1940`} stroke={C.accent} strokeWidth={18} />
          <path d={`M${seamX(-20)} -20 L${seamX(1940)} 1940`} stroke={C.accentL} strokeWidth={7} strokeDasharray="40 24" strokeDashoffset={-t * 70} strokeLinecap="round" />
        </g>
        <g transform={`translate(${offL} 0)`}>
          <Pill x={275} y={470} s={mon} text="MONDAY" fill={C.coral} />
        </g>
        <g transform={`translate(${offR} 0)`}>
          <Pill x={808} y={470} s={sun} text="SUNDAY" fill="#F4A62A" />
        </g>
      </Svg>
    </Full>
  );
};

// ===================== S5 — HERO: the island hops over the date line =====================
const HZ = 430;
export const lineAt = (y: number) => lerp(560, 468, (y - HZ) / (1920 - HZ));
export const S5: React.FC<{t: number}> = ({t}) => {
  const t0 = 22.98, t1 = 24.6;
  const ant = prog(t, 22.72, t0);
  const air = prog(t, t0, t1);
  const land = t - t1;
  let squash = 0;
  if (t < t0) squash = eio2(ant);
  else if (t < t1) squash = -0.8 * Math.exp(-6 * (t - t0)) ;
  else squash = Math.exp(-6 * land) * Math.cos(land * 20) * 1.1;
  const ax = eio2(air);
  const ix = lerp(795, 285, ax);
  const lift = Math.sin(air * Math.PI) * 540 * (air > 0 && air < 1 ? 1 : 0);
  const baseY = 1110;
  const iy = baseY - lift + Math.sin(t * 1.4) * 5;
  const tilt = Math.sin(air * Math.PI) * -9 + (air > 0 && air < 1 ? -4 * (1 - air) : 0);
  const S = 0.62;
  // tag pad rides above the island; flips THU -> SAT on landing
  const flip = eio3(prog(t, t1 + 0.02, t1 + 0.32)) * 330;
  const stubG = t > t1 + 0.3 ? clamp(0.6 + 0.4 * Math.sin((t - t1) * 9)) : 0;
  // FRIDAY page shoots out of the splash
  const fp = prog(t, t1 + 0.18, 25.12);
  const r = rng(31);
  const drops = Array.from({length: 22}, () => ({a: -Math.PI / 2 + (r() - 0.5) * 2.2, v: 500 + r() * 700, s: 6 + r() * 10}));
  const glints = Array.from({length: 24}, () => ({x: r() * 1080, y: HZ + 20 + r() * 1300, ph: r() * 10}));
  return (
    <Full>
      <Svg>
        <defs>
          <linearGradient id="s5sea" x1="0" y1={HZ} x2="0" y2="1920" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#9BE6FA" />
            <stop offset="0.35" stopColor="#3BB7E6" />
            <stop offset="1" stopColor="#1478BF" />
          </linearGradient>
        </defs>
        <Sky phase={2} id="s5sky" y0={0} y1={HZ} />
        <Sun x={220} y={200} r={70} t={t} id="s5sun" />
        <Cloud x={((t * 22 + 500) % 1500) - 200} y={300} s={0.8} />
        <Cloud x={((t * 12 + 1100) % 1500) - 200} y={150} s={0.55} />
        <rect x={-100} y={HZ} width={1280} height={1600} fill="url(#s5sea)" />
        <rect x={-100} y={HZ - 2} width={1280} height={4} fill="#fff" opacity={0.6} />
        <path d={`M70 ${HZ + 1} Q130 ${HZ - 36} 200 ${HZ + 1}Z`} fill="#56B87A" />
        <path d={`M880 ${HZ + 1} Q940 ${HZ - 26} 1010 ${HZ + 1}Z`} fill="#56B87A" />
        <SeaRows t={t} y0={HZ + 12} y1={1900} color="#E8FBFF" rows={13} op={0.4} speed={28} />
        {glints.map((g, i) => {
          const on = Math.max(0, Math.sin(t * 3 + g.ph));
          const sc = 0.4 + (g.y - HZ) / 1400;
          return <path key={i} d={`M${g.x - 12 * sc} ${g.y} L${g.x + 12 * sc} ${g.y}`} stroke="#fff" strokeWidth={4 * sc} strokeLinecap="round" opacity={on * 0.7} />;
        })}
        {/* date line in perspective */}
        {(() => {
          const pts = (wf: number) => {
            const wTop = 3 * wf, wBot = 60 * wf;
            return `M${560 - wTop} ${HZ} L${560 + wTop} ${HZ} L${468 + wBot} 1920 L${468 - wBot} 1920Z`;
          };
          const dashes: React.ReactNode[] = [];
          const N = 14;
          for (let i = 0; i < N; i++) {
            const u0 = ((i + t * 0.9) % N) / N, u1 = u0 + 0.35 / N;
            const y0 = HZ + 1490 * u0 * u0, y1 = HZ + 1490 * Math.min(1, u1 * u1);
            const w0 = 1 + 9 * u0, w1 = 1 + 9 * Math.min(1, u1);
            dashes.push(<path key={i} d={`M${lineAt(y0) - w0} ${y0} L${lineAt(y0) + w0} ${y0} L${lineAt(y1) + w1} ${y1} L${lineAt(y1) - w1} ${y1}Z`} fill={C.accentL} />);
          }
          return (
            <g>
              <path d={pts(3.2)} fill={C.accent} opacity={0.18} />
              <path d={pts(1.3)} fill={C.accent} opacity={0.35} />
              <path d={pts(0.55)} fill={C.accent} />
              {dashes}
            </g>
          );
        })()}
        {/* shadow of the island on the sea */}
        <ellipse cx={ix + 10} cy={baseY + 225} rx={285 * (1 - lift / 1400)} ry={70 * (1 - lift / 1400)} fill="#063A6B" opacity={0.28 * (1 - lift / 1000)} />
        {air === 0 && <ellipse cx={ix} cy={baseY + 205} rx={282} ry={70} fill="none" stroke="#fff" strokeWidth={6} opacity={0.5 + 0.2 * Math.sin(t * 3)} />}
        {land > 0 && <ellipse cx={ix} cy={baseY + 205} rx={282} ry={70} fill="none" stroke="#fff" strokeWidth={6} opacity={0.6} />}
        {land > 0 &&
          [0, 1, 2].map((i) => {
            const p = clamp((land - i * 0.1) / 0.9);
            return <ellipse key={i} cx={ix} cy={baseY + 210} rx={295 + p * 330} ry={72 + p * 80} fill="none" stroke="#fff" strokeWidth={8 - p * 6} opacity={(1 - p) * 0.8} />;
          })}
        <g transform={`translate(${ix} ${iy}) rotate(${tilt})`}>
          <Island t={t} id="s5isl" flagP={1} s={S} squash={squash} />
        </g>
        {land > 0 &&
          land < 0.9 &&
          drops.map((d, i) => {
            const x = ix + Math.cos(d.a) * d.v * land;
            const y = baseY + 195 + Math.sin(d.a) * d.v * land + 1600 * land * land;
            return y < baseY + 235 ? <circle key={i} cx={x} cy={y} r={d.s} fill="#F2FDFF" /> : null;
          })}
      </Svg>
      <Pad x={ix + Math.sin(t * 2) * 4} y={iy - 360 + (squash > 0 ? squash * 34 : 0)} w={262} h={302} rot={tilt * 0.6} pages={[{p: THU, ang: flip}, {p: SAT, stubBelow: C.accent, stubGlow: stubG}]} />
      {fp > 0 && <FlyingPage x={lerp(ix, 540, eo2(fp))} y={lerp(baseY + 120, 900, eo2(fp))} w={520} h={600} p={FRI} s={lerp(0.15, 2.3, ei2(fp))} rz={lerp(-160, 4, eo2(fp))} rx={lerp(60, 0, fp)} ry={lerp(40, 0, eo2(fp))} />}
    </Full>
  );
};
