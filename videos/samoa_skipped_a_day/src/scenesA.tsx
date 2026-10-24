import React from 'react';
import {C, F, clamp, eio2, eio3, eo2, eo3, ei2, kf, lerp, mix, nz, pop, prog, rng, settle} from './lib';
import {Cloud, FRI, FlyingPage, Island, Moon, Pad, Palm, SAT, Sky, Stars, Sun, THU, blob, starPath} from './art';

export const Full: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, overflow: 'hidden', ...style}}>{children}</div>
);
export const Svg: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', ...style}}>
    {children}
  </svg>
);

// rows of moving wave crests between y0 and y1 (perspective: smaller near horizon)
export const SeaRows: React.FC<{t: number; y0: number; y1: number; color: string; rows?: number; op?: number; speed?: number}> = ({t, y0, y1, color, rows = 9, op = 0.35, speed = 30}) => (
  <g>
    {Array.from({length: rows}, (_, i) => {
      const u = i / (rows - 1);
      const y = lerp(y0, y1, u * u * 0.85 + u * 0.15);
      const sc = 0.35 + u * 1.1;
      const len = 46 * sc, gap = 120 * sc;
      const off = ((t * speed * sc + i * 53) % (len + gap));
      let d = '';
      for (let x = -gap - len + off; x < 1180; x += len + gap) {
        d += `M${x.toFixed(1)} ${y.toFixed(1)} q ${(len / 2).toFixed(1)} ${(-7 * sc).toFixed(1)} ${len.toFixed(1)} 0 `;
      }
      return <path key={i} d={d} stroke={color} strokeWidth={2.5 * sc} fill="none" strokeLinecap="round" opacity={op * (0.5 + u * 0.5)} />;
    })}
  </g>
);

// ===================== S1 — night beach, the page is ripped off =====================
export const PAD1 = {x: 540, y: 1000, w: 520, h: 600};
export const S1: React.FC<{t: number}> = ({t}) => {
  const tt = Math.max(0, t);
  const cam = 1 + tt * 0.022;
  const sandN = mix(C.sand, C.NIGHT, 0.58);
  const sandN2 = mix(C.sandD, C.NIGHT, 0.6);
  // the top page: wind flutter, then ripped off on "deleted"
  const rip0 = 0.8, rip1 = 0.94;
  const flutter = 5 + 4 * Math.max(0, Math.sin(t * 7.5)) + 2 * nz(t * 3, 4);
  const angTop = t < rip0 ? flutter : lerp(flutter, 78, eo2(prog(t, rip0, rip1)));
  const attached = t < rip1;
  const fl = prog(t, rip1, 2.95);
  // flight path (frame space) after the tear
  const fx = kf(t, [[rip1, 540], [1.35, 600], [2.1, 470], [2.95, 640]], eio2);
  const fyE = t < 2.25 ? lerp(765, 380, eo3(prog(t, rip1, 2.25))) : lerp(380, -620, ei2(prog(t, 2.25, 2.95)));
  const frz = kf(t, [[rip1, 0], [2.95, 410]], eo2) + Math.sin(t * 4) * 6;
  const frx = lerp(76, 20, eo3(fl)) + Math.sin(t * 5.5) * 14;
  const fry = Math.sin(t * 3.1) * 28;
  const fs = lerp(1, 0.78, eo3(fl));
  const bounce = t > rip1 ? 1 - 0.035 * Math.exp(-7 * (t - rip1)) * Math.sin((t - rip1) * 28) : 1;
  const stubGlow = clamp(pop(t, 1.62) * (0.6 + 0.4 * Math.sin(t * 9)));
  // torn paper scraps
  const r = rng(11);
  const scraps = Array.from({length: 10}, () => ({a: -Math.PI / 2 + (r() - 0.5) * 2.4, v: 380 + r() * 520, s: 8 + r() * 14, c: r() > 0.5 ? C.accent : '#FFFFFF', sp: (r() - 0.5) * 900}));
  const ts = t - rip0;
  return (
    <Full>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${cam})`, transformOrigin: '540px 1050px'}}>
        <Svg>
          <Sky phase={0} id="s1sky" y0={0} y1={1000} />
          <Stars t={t} alpha={1} seed={4} n={90} yMax={900} />
          <Moon x={810} y={300} r={72} id="s1moon" />
          <Cloud x={((t * 14 + 200) % 1400) - 200} y={520} s={0.9} fill="#3A4C94" op={0.55} />
          <Cloud x={((t * 9 + 900) % 1400) - 200} y={260} s={0.6} fill="#33458A" op={0.5} />
          {/* sea */}
          <defs>
            <linearGradient id="s1sea" x1="0" y1="980" x2="0" y2="1300" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#3B4F9E" />
              <stop offset="1" stopColor="#25387A" />
            </linearGradient>
            <linearGradient id="s1sand" x1="0" y1="1240" x2="0" y2="1920" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor={sandN} />
              <stop offset="1" stopColor={sandN2} />
            </linearGradient>
            <radialGradient id="s1pool" cx="540" cy="1320" r="420" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#FFF3C4" stopOpacity="0.22" />
              <stop offset="1" stopColor="#FFF3C4" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect x={-200} y={980} width={1480} height={400} fill="url(#s1sea)" />
          <rect x={-200} y={978} width={1480} height={5} fill="#8FA2E8" opacity={0.6} />
          <SeaRows t={t} y0={995} y1={1240} color="#8EA4EE" rows={8} op={0.5} speed={26} />
          {Array.from({length: 16}, (_, i) => {
            const y = 992 + i * 15;
            const w = 30 + i * 9 + Math.sin(t * 4 + i * 1.7) * 14;
            const on = 0.5 + 0.5 * Math.sin(t * 6 + i * 2.3);
            return <rect key={i} x={810 - w / 2 + Math.sin(t * 2 + i) * 10} y={y} width={w} height={3 + i * 0.25} rx={2} fill="#FFF3C4" opacity={on * 0.75} />;
          })}
          {/* shore: wave wash */}
          <path d={`M-200 1250 ${Array.from({length: 26}, (_, i) => `L${-200 + i * 60} ${1250 + Math.sin(i * 0.9 + t * 2.2) * 9 + Math.sin(t * 1.3) * 14}`).join(' ')} L1400 1920 L-200 1920Z`} fill="url(#s1sand)" />
          <path d={`M-200 1252 ${Array.from({length: 26}, (_, i) => `L${-200 + i * 60} ${1252 + Math.sin(i * 0.9 + t * 2.2) * 9 + Math.sin(t * 1.3) * 14}`).join(' ')}`} stroke="#DCE4FF" strokeWidth={7} fill="none" opacity={0.7} strokeLinecap="round" />
          <path d={`M-200 1282 ${Array.from({length: 26}, (_, i) => `L${-200 + i * 60} ${1282 + Math.sin(i * 1.3 - t * 1.8) * 6 + Math.sin(t * 1.3 - 0.8) * 18}`).join(' ')}`} stroke="#DCE4FF" strokeWidth={3} fill="none" opacity={0.3} />
          <rect x={-200} y={1240} width={1480} height={680} fill="url(#s1pool)" />
          {/* shells + pebbles */}
          {[[200, 1560, 1], [880, 1610, -1], [330, 1760, 1], [760, 1450, 1]].map(([x, y, d], i) => (
            <g key={i} transform={`translate(${x} ${y}) scale(${d} 1)`}>
              <path d="M-18 6 Q-16 -16 0 -18 Q16 -16 18 6 Z" fill={mix('#FFC9C0', C.NIGHT, 0.45)} />
              <path d="M-9 4 L-6 -12 M0 5 L0 -15 M9 4 L6 -12" stroke={mix('#E89A90', C.NIGHT, 0.45)} strokeWidth={2} />
            </g>
          ))}
          <ellipse cx={PAD1.x + 20} cy={PAD1.y + PAD1.h / 2 + 36} rx={330} ry={34} fill="#0B1236" opacity={0.35} />
          <Palm x={60} y={1620} h={820} lean={150} t={t} n={0.92} s={1.15} seed={3} />
          <Palm x={1040} y={1500} h={560} lean={-110} t={t} n={0.9} s={1.0} seed={7} />
        </Svg>
        <Pad
          x={PAD1.x}
          y={PAD1.y}
          w={PAD1.w}
          h={PAD1.h}
          scale={bounce}
          pages={[
            ...(attached ? [{p: FRI, ang: angTop}] : []),
            {p: SAT, stubBelow: t >= rip1 ? C.accent : undefined, stubGlow: stubGlow},
          ]}
        />
        {/* paper scraps from the tear */}
        {ts > 0 && ts < 1.4 && (
          <Svg>
            {scraps.map((s, i) => {
              const x = 540 + Math.cos(s.a) * s.v * ts;
              const y = 720 + Math.sin(s.a) * s.v * ts + 700 * ts * ts;
              return <rect key={i} x={x} y={y} width={s.s} height={s.s * 0.7} fill={s.c} transform={`rotate(${s.sp * ts} ${x} ${y})`} opacity={clamp(1.4 - ts)} />;
            })}
          </Svg>
        )}
        {!attached && t < 3.05 && <FlyingPage x={fx} y={fyE} w={PAD1.w} h={PAD1.h} p={FRI} rz={frz} rx={frx} ry={fry} s={fs} />}
      </div>
    </Full>
  );
};

// ===================== S2 — Samoa goes to bed on Thursday, wakes on Saturday =====================
export const S2: React.FC<{t: number}> = ({t}) => {
  const phase = kf(t, [[7.3, 0], [7.95, 1], [8.7, 2]], (x) => x);
  const night = 1 - prog(t, 7.35, 8.5);
  const lights = t < 4.98 ? 1 : t < 5.06 ? 0.25 : t < 5.12 ? 0.8 : t < 5.2 ? 0 : 0;
  const flagP = clamp(eo3(prog(t, 4.18, 4.85)));
  const zz = t > 5.25 && t < 7.45 ? (t - 5.25) * 0.85 : -1;
  const wakeSq = t > 7.42 ? Math.exp(-6 * (t - 7.42)) * Math.sin((t - 7.42) * 22) * 0.9 : 0;
  // moon whips away, sun rises
  const mw = ei2(prog(t, 7.25, 7.85));
  const mx = lerp(800, -160, mw), my = lerp(290, 1150, mw);
  const su = eo3(prog(t, 7.45, 8.55));
  const sx = lerp(930, 820, su), sy = lerp(1250, 330, su);
  // pad: arrives on "twenty eleven", THU flips over on "Saturday"
  const padIn = pop(t, 3.18, 1.8, 6.5);
  const padS = 0.55 + 0.45 * padIn;
  const bob = Math.sin(t * 1.6) * 10;
  const flip = eio3(prog(t, 7.86, 8.22)) * 330;
  const padPulse = 1 + 0.05 * Math.exp(-8 * Math.max(0, t - 8.82)) * (t > 8.82 ? 1 : 0) + 0.04 * Math.exp(-8 * Math.max(0, t - 6.48)) * (t > 6.48 && t < 7.8 ? 1 : 0);
  const stubGlow = t > 8.2 ? clamp(0.5 + 0.5 * Math.sin((t - 8.2) * 8)) : 0;
  // island camera: slow push, small lift on wake
  const cam = 1 + (t - 3) * 0.012;
  const islY = 1010 + Math.sin(t * 1.1) * 6;
  // the FRIDAY page (carrier) tumbles down through the frame at the end
  const fp = prog(t, 9.45, 10.15);
  return (
    <Full>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${cam})`, transformOrigin: '540px 1000px'}}>
        <Svg>
          <Sky phase={phase} id="s2sky" y0={0} y1={1250} />
          <Stars t={t} alpha={1 - clamp(phase)} seed={4} n={90} yMax={1000} />
          {mw < 1 && <Moon x={mx} y={my} r={66} id="s2moon" />}
          {su > 0 && <Sun x={sx} y={sy} r={84} t={t} id="s2sun" />}
          <Cloud x={((t * 16 + 100) % 1500) - 250} y={640} s={1.0} fill={mix('#3A4C94', '#FFFFFF', clamp(phase / 1.6))} op={0.6 + 0.3 * clamp(phase - 1)} />
          <Cloud x={((t * 10 + 820) % 1500) - 250} y={250} s={0.7} fill={mix('#33458A', '#FFF5F0', clamp(phase / 1.6))} op={0.55} />
          {/* distant sea */}
          <rect x={-200} y={1180} width={1480} height={800} fill={mix('#2A3E86', '#2AA9DC', clamp(phase / 2))} />
          <rect x={-200} y={1178} width={1480} height={4} fill="#fff" opacity={0.35} />
          <SeaRows t={t} y0={1192} y1={1900} color="#BFD3FF" rows={9} op={0.35} speed={22} />
          {/* far islands */}
          <path d="M40 1181 Q120 1120 210 1181Z" fill={mix('#1E2C66', '#3E9C6A', clamp(phase / 2))} />
          <path d="M860 1181 Q930 1140 1010 1181Z" fill={mix('#1E2C66', '#3E9C6A', clamp(phase / 2))} />
          <g transform={`translate(540 ${islY})`}>
            <Island t={t} id="s2isl" night={night} lights={lights} flagP={flagP} zz={zz} s={1.08} squash={wakeSq} />
          </g>
        </Svg>
        <Pad
          x={540}
          y={480 + bob}
          w={380}
          h={440}
          scale={padS * padPulse}
          rot={Math.sin(t * 1.2) * 2}
          pages={[{p: THU, ang: flip}, {p: SAT, stubBelow: C.accent, stubGlow}]}
        />
        {fp > 0 && fp < 1 && <FlyingPage x={540 + Math.sin(fp * 5) * 90} y={lerp(-420, 2250, ei2(fp) * 0.6 + fp * 0.4)} w={420} h={485} p={FRI} rz={lerp(-30, 160, fp)} rx={30 + Math.sin(fp * 7) * 20} ry={Math.sin(fp * 4) * 30} />}
      </div>
    </Full>
  );
};

// ===================== S3 — the Friday page sinks; "Why?" =====================
export const S3: React.FC<{t: number}> = ({t}) => {
  const surf = 330;
  const lt = t - 10.08; // page hits water
  const sink = Math.max(0, lt);
  const py = lt < 0 ? lerp(-500, surf, eo2(prog(t, 9.9, 10.08))) : surf + 150 + sink * 430;
  const px = 540 + Math.sin(sink * 2.8) * 130 * Math.min(1, sink * 2);
  const prz = Math.sin(sink * 2.8 + 0.8) * 26 + 10;
  const prx = 18 + Math.cos(sink * 2.8) * 22;
  const darken = clamp(sink / 2.2) * 0.45;
  // "Why?" bubble rises from the page
  const bp = prog(t, 12.0, 12.42);
  const by = lerp(py - 120, surf + 10, eo2(bp));
  const bs = pop(t, 12.0, 1.8, 6) * (1 + bp * 0.15);
  const r = rng(5);
  const bubbles = Array.from({length: 26}, () => ({x: r() * 1080, s: 0.4 + r() * 1.2, ph: r() * 10, sp: 80 + r() * 140}));
  return (
    <Full>
      <Svg>
        <defs>
          <linearGradient id="s3w" x1="0" y1={surf} x2="0" y2="1920" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#47CCEB" />
            <stop offset="0.45" stopColor="#1683C6" />
            <stop offset="1" stopColor="#08306B" />
          </linearGradient>
          <linearGradient id="s3ray" x1="0" y1="0" x2="0" y2="1" >
            <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <Sky phase={2} id="s3sky" y0={0} y1={surf} />
        <Cloud x={((t * 20) % 1400) - 200} y={170} s={0.8} />
        <rect x={-100} y={surf} width={1280} height={1700} fill="url(#s3w)" />
        {[0, 1, 2, 3, 4].map((i) => {
          const x = 120 + i * 230 + Math.sin(t * 0.8 + i) * 40;
          return <path key={i} d={`M${x - 40} ${surf} L${x + 40} ${surf} L${x + 220} 1600 L${x - 10} 1600Z`} fill="url(#s3ray)" opacity={0.5 + 0.3 * Math.sin(t * 1.3 + i * 2)} />;
        })}
        {/* surface line */}
        <path d={`M-100 ${surf} ${Array.from({length: 30}, (_, i) => `L${-100 + i * 45} ${surf + Math.sin(i * 0.8 + t * 3) * 7}`).join(' ')} L1300 ${surf - 400} L-100 ${surf - 400}Z`} fill="none" />
        <path d={`M-100 ${surf} ${Array.from({length: 30}, (_, i) => `L${-100 + i * 45} ${surf + Math.sin(i * 0.8 + t * 3) * 7}`).join(' ')}`} stroke="#E8FBFF" strokeWidth={8} fill="none" opacity={0.85} />
        {/* splash where the page hit */}
        {lt > 0 && lt < 1.2 &&
          [0, 1, 2].map((i) => {
            const p = clamp((lt - i * 0.12) / 0.9);
            return <ellipse key={i} cx={540} cy={surf} rx={60 + p * 380} ry={14 + p * 40} fill="none" stroke="#fff" strokeWidth={6 - p * 4} opacity={(1 - p) * 0.8} />;
          })}
        {lt > 0 && lt < 0.8 &&
          Array.from({length: 12}, (_, i) => {
            const a = -Math.PI / 2 + (i - 5.5) * 0.2;
            const v = 650 + (i % 3) * 120;
            const x = 540 + Math.cos(a) * v * lt;
            const y = surf + Math.sin(a) * v * lt + 1500 * lt * lt;
            return y < surf + 5 ? <circle key={i} cx={x} cy={y} r={9 - (i % 3) * 2} fill="#EFFFFF" /> : null;
          })}
        {bubbles.map((b, i) => {
          const y = 1900 - ((t * b.sp + b.ph * 100) % 1560);
          return <circle key={i} cx={b.x + Math.sin(t * 2 + b.ph) * 12} cy={y} r={6 * b.s} fill="none" stroke="#fff" strokeWidth={2.5} opacity={0.4} />;
        })}
        {/* fish that watch the page go by */}
        {[{x0: 1200, y: 760, sp: -90, c: '#FFB547', s: 1.6}, {x0: -200, y: 1160, sp: 70, c: '#FF7A8A', s: 1.3}, {x0: 1300, y: 600, sp: -55, c: '#B48CFF', s: 1.0}].map((f, i) => {
          const x = f.x0 + f.sp * (t - 9.9);
          const dir = f.sp < 0 ? -1 : 1;
          const look = Math.atan2(py - f.y, (px - x) * dir);
          return (
            <g key={i} transform={`translate(${x} ${f.y + Math.sin(t * 2.4 + i) * 10}) scale(${dir * f.s} ${f.s})`}>
              <path d={`M-28 0 L-58 -22 L-54 22Z`} fill={f.c} transform={`rotate(${Math.sin(t * 9 + i) * 10} -28 0)`} />
              <ellipse cx={0} cy={0} rx={40} ry={26} fill={f.c} />
              <ellipse cx={4} cy={8} rx={26} ry={12} fill="#fff" opacity={0.25} />
              <circle cx={18} cy={-6} r={9} fill="#fff" />
              <circle cx={18 + Math.cos(look) * 4} cy={-6 + Math.sin(look) * 4} r={4.5} fill={C.navy} />
            </g>
          );
        })}
        {/* sea floor */}
        <path d={`M-100 1700 Q200 1640 540 1690 Q860 1740 1180 1660 L1180 1920 L-100 1920Z`} fill="#D9B97A" />
        <path d={`M-100 1730 Q260 1690 540 1730 Q860 1770 1180 1700 L1180 1920 L-100 1920Z`} fill="#C49A5A" />
        {[60, 170, 300, 760, 880, 1000].map((x, i) => (
          <path key={i} d={`M${x} 1720 q ${14 + Math.sin(t * 1.6 + i) * 18} -90 ${Math.sin(t * 1.3 + i) * 24} -${200 + (i % 3) * 60}`} stroke={i % 2 ? '#2FB07F' : '#1E8F66'} strokeWidth={16} fill="none" strokeLinecap="round" />
        ))}
        <path d={starPath(420, 1790, 34, 5, 0.5)} fill="#FF8F6B" transform={`rotate(${Math.sin(t) * 6} 420 1790)`} />
        <rect x={-100} y={surf} width={1280} height={1700} fill="#041A44" opacity={darken} />
      </Svg>
      <FlyingPage x={px} y={py} w={400} h={460} p={FRI} rz={prz} rx={prx} ry={Math.sin(sink * 2) * 20} s={0.95} />
      {bs > 0 && bp < 1 && (
        <Svg>
          <g transform={`translate(${540} ${by}) scale(${bs})`}>
            <circle r={130} fill="#BFF4FF" opacity={0.18} />
            <circle r={130} fill="none" stroke="#fff" strokeWidth={6} opacity={0.85} />
            <path d="M-70 -60 A95 95 0 0 1 -10 -105" stroke="#fff" strokeWidth={12} fill="none" strokeLinecap="round" opacity={0.85} />
            <text x={0} y={62} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={190} fill="#fff">
              ?
            </text>
          </g>
        </Svg>
      )}
    </Full>
  );
};
