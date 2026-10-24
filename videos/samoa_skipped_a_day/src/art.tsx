import React from 'react';
import {C, F, clamp, lerp, mix, nz, rng} from './lib';

// ---------- geometry helpers ----------
export const starPath = (cx: number, cy: number, r: number, pts = 5, inner = 0.45, rot = -Math.PI / 2) => {
  let d = '';
  for (let i = 0; i < pts * 2; i++) {
    const rr = i % 2 === 0 ? r : r * inner;
    const a = rot + (i * Math.PI) / pts;
    d += (i === 0 ? 'M' : 'L') + (cx + rr * Math.cos(a)).toFixed(2) + ' ' + (cy + rr * Math.sin(a)).toFixed(2);
  }
  return d + 'Z';
};
export const blob = (cx: number, cy: number, rx: number, ry: number, seed = 1, n = 56, wob = 1) => {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const th = (i / n) * Math.PI * 2;
    const r = 1 + wob * (0.055 * Math.sin(3 * th + seed) + 0.035 * Math.sin(5 * th + seed * 2.1) + 0.02 * Math.sin(7 * th + seed * 0.7));
    const x = cx + rx * r * Math.cos(th), y = cy + ry * r * Math.sin(th);
    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
  }
  return d + 'Z';
};
export const poly = (pts: [number, number][]) => 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L') + 'Z';
// smooth closed path through points (Catmull-Rom -> cubic)
export const smooth = (pts: [number, number][], closed = true) => {
  const n = pts.length;
  const g = (i: number) => pts[closed ? (i + n) % n : clamp(i, 0, n - 1)];
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + (closed ? 'Z' : '');
};

// ---------- sky ----------
export const skyStops = (phase: number): [string, string, string] => {
  // 0 night, 1 dawn, 2 day
  const N: [string, string, string] = [C.night0, C.night1, C.night2];
  const D: [string, string, string] = [C.dawn0, C.dawn1, C.dawn2];
  const Y: [string, string, string] = [C.day0, C.day1, C.day2];
  if (phase <= 1) return [0, 1, 2].map((i) => mix(N[i], D[i], phase)) as any;
  return [0, 1, 2].map((i) => mix(D[i], Y[i], phase - 1)) as any;
};
export const Sky: React.FC<{phase: number; id: string; y0?: number; y1?: number}> = ({phase, id, y0 = 0, y1 = 1300}) => {
  const [a, b, c] = skyStops(phase);
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1={y0} x2="0" y2={y1} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={a} />
          <stop offset="0.62" stopColor={b} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
      </defs>
      <rect x={-200} y={-400} width={1480} height={2720} fill={`url(#${id})`} />
    </g>
  );
};
export const Stars: React.FC<{t: number; alpha: number; seed?: number; n?: number; yMax?: number}> = ({t, alpha, seed = 3, n = 70, yMax = 1000}) => {
  if (alpha <= 0.01) return null;
  const r = rng(seed);
  const out: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const x = r() * 1180 - 50, y = r() * yMax - 60, s = 1.2 + r() * 3.2, ph = r() * 10, sp = 1 + r() * 2.5;
    const tw = 0.55 + 0.45 * Math.sin(t * sp + ph);
    if (s > 3.6) out.push(<path key={i} d={starPath(x, y, s * 2.2, 4, 0.28, 0)} fill="#FFFBE6" opacity={alpha * tw} />);
    else out.push(<circle key={i} cx={x} cy={y} r={s} fill="#FFFBE6" opacity={alpha * tw * 0.9} />);
  }
  return <g>{out}</g>;
};
export const Moon: React.FC<{x: number; y: number; r: number; id: string}> = ({x, y, r, id}) => (
  <g>
    <defs>
      <radialGradient id={id + 'g'}>
        <stop offset="0" stopColor="#FFF6D6" stopOpacity="0.55" />
        <stop offset="1" stopColor="#FFF6D6" stopOpacity="0" />
      </radialGradient>
      <mask id={id + 'm'}>
        <circle cx={x} cy={y} r={r} fill="#fff" />
        <circle cx={x + r * 0.45} cy={y - r * 0.2} r={r * 0.86} fill="#000" />
      </mask>
    </defs>
    <circle cx={x} cy={y} r={r * 3.4} fill={`url(#${id}g)`} />
    <circle cx={x} cy={y} r={r} fill="#FFF3C4" mask={`url(#${id}m)`} />
  </g>
);
export const Sun: React.FC<{x: number; y: number; r: number; t: number; id: string; rays?: number}> = ({x, y, r, t, id, rays = 1}) => (
  <g>
    <defs>
      <radialGradient id={id + 'g'}>
        <stop offset="0" stopColor="#FFF2B0" stopOpacity="0.85" />
        <stop offset="0.35" stopColor="#FFD86B" stopOpacity="0.35" />
        <stop offset="1" stopColor="#FFD86B" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={id + 'b'} cx="0.4" cy="0.38">
        <stop offset="0" stopColor="#FFFBE0" />
        <stop offset="0.6" stopColor="#FFE07A" />
        <stop offset="1" stopColor="#FFC24A" />
      </radialGradient>
    </defs>
    <circle cx={x} cy={y} r={r * 3.6} fill={`url(#${id}g)`} />
    <g transform={`translate(${x} ${y}) rotate(${t * 8})`} opacity={0.35 * rays}>
      {Array.from({length: 12}, (_, i) => (
        <path key={i} d={`M0 ${-r * 1.25} L${r * 0.16} ${-r * 2.05} L${-r * 0.16} ${-r * 2.05}Z`} fill="#FFE9A0" transform={`rotate(${i * 30})`} />
      ))}
    </g>
    <circle cx={x} cy={y} r={r} fill={`url(#${id}b)`} />
  </g>
);
export const Cloud: React.FC<{x: number; y: number; s: number; fill?: string; op?: number}> = ({x, y, s, fill = '#FFFFFF', op = 0.9}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={op}>
    <path d="M-120 20 Q-130 -20 -85 -25 Q-75 -70 -25 -62 Q5 -100 50 -70 Q95 -80 100 -35 Q140 -30 130 20 Z" fill={fill} />
    <path d="M-120 20 Q-60 34 0 30 Q70 36 130 20 Q100 34 0 40 Q-80 40 -120 20Z" fill="#000" opacity="0.06" />
  </g>
);

// ---------- palm ----------
export const Palm: React.FC<{x: number; y: number; h: number; lean: number; t: number; n?: number; s?: number; seed?: number}> = ({x, y, h, lean, t, n = 0, s = 1, seed = 1}) => {
  const k = (c: string) => mix(c, C.NIGHT, n * 0.6);
  const sway = Math.sin(t * 1.3 + seed) * 5 + nz(t * 0.7, seed) * 3;
  const tx = lean + sway * 0.6, ty = -h;
  const cx = lean * 0.15 + 18 * Math.sign(lean || 1), cy = -h * 0.55;
  const fr = [-168, -140, -112, -80, -48, -18, 12];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={lean * 0.4} cy={6} rx={60} ry={12} fill="#000" opacity={0.12} />
      <path d={`M0 0 Q${cx} ${cy} ${tx} ${ty}`} stroke={k(C.trunk)} strokeWidth={24} fill="none" strokeLinecap="round" />
      <path d={`M0 0 Q${cx} ${cy} ${tx} ${ty}`} stroke={k(C.trunkD)} strokeWidth={24} fill="none" strokeDasharray="5 15" opacity={0.55} />
      <path d={`M-6 0 Q${cx - 6} ${cy} ${tx - 6} ${ty}`} stroke="#fff" strokeWidth={5} fill="none" opacity={0.18} />
      <g transform={`translate(${tx} ${ty})`}>
        {fr.map((a, i) => {
          const L = 150 + ((i * 37) % 40);
          const aa = a + Math.sin(t * 1.7 + i * 0.9 + seed) * 4 + sway * 0.4;
          const droop = a < -90 ? -1 : 1;
          return (
            <g key={i} transform={`rotate(${aa})`}>
              <path d={`M0 0 Q${L * 0.5} ${-L * 0.28 * -droop * 0 - L * 0.22} ${L} ${L * 0.32} Q${L * 0.45} ${L * 0.06} 0 ${10}Z`} fill={k(i % 2 ? C.leaf : C.leafD)} />
              <path d={`M0 4 Q${L * 0.5} ${-L * 0.12} ${L} ${L * 0.32}`} stroke={k(C.leafL)} strokeWidth={3} fill="none" opacity={0.6} />
            </g>
          );
        })}
        <circle cx={-10} cy={10} r={13} fill={k('#7A4E2A')} />
        <circle cx={10} cy={14} r={12} fill={k('#8A5A31')} />
        <circle cx={0} cy={22} r={11} fill={k('#6E4423')} />
      </g>
    </g>
  );
};

// ---------- waving flags (true wave: the design is sliced in strips) ----------
export const Wavy: React.FC<{w: number; h: number; t: number; amp?: number; id: string; n?: number; speed?: number; children: React.ReactNode}> = ({w, h, t, amp = 0.09, id, n = 14, speed = 6, children}) => {
  const strips: React.ReactNode[] = [];
  const defs: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const x0 = (i / n) * w, x1 = ((i + 1) / n) * w + 0.9;
    const xm = (x0 + x1) / 2, u = xm / w;
    const ph = u * Math.PI * 2.1 - t * speed;
    const dy = amp * h * u * Math.sin(ph);
    const sh = Math.cos(ph) * u;
    defs.push(
      <clipPath id={`${id}c${i}`} key={i}>
        <rect x={x0} y={0} width={x1 - x0} height={h} />
      </clipPath>
    );
    strips.push(
      <g key={i} transform={`translate(0 ${dy.toFixed(2)})`}>
        <g clipPath={`url(#${id}c${i})`}>
          {children}
          <rect x={x0} y={0} width={x1 - x0} height={h} fill={sh > 0 ? '#fff' : '#000'} opacity={Math.abs(sh) * 0.17} />
        </g>
      </g>
    );
  }
  return (
    <g>
      <defs>{defs}</defs>
      {strips}
    </g>
  );
};
const UJ: React.FC<{w: number; h: number; id: string}> = ({w, h, id}) => (
  <g>
    <defs>
      <clipPath id={id}>
        <rect x={0} y={0} width={w} height={h} />
      </clipPath>
    </defs>
    <g clipPath={`url(#${id})`}>
      <rect width={w} height={h} fill="#012169" />
      <path d={`M0 0 L${w} ${h} M${w} 0 L0 ${h}`} stroke="#fff" strokeWidth={h * 0.2} />
      <path d={`M0 0 L${w} ${h} M${w} 0 L0 ${h}`} stroke="#C8102E" strokeWidth={h * 0.066} />
      <path d={`M${w / 2} 0 V${h} M0 ${h / 2} H${w}`} stroke="#fff" strokeWidth={h * 0.333} />
      <path d={`M${w / 2} 0 V${h} M0 ${h / 2} H${w}`} stroke="#C8102E" strokeWidth={h * 0.2} />
    </g>
  </g>
);
export const SamoaFlag: React.FC<{w: number; h: number}> = ({w, h}) => {
  const cw = w / 2, ch = h / 2;
  const st: [number, number, number][] = [[0.5, 0.2, 0.11], [0.27, 0.47, 0.11], [0.69, 0.42, 0.11], [0.5, 0.8, 0.12], [0.56, 0.6, 0.06]];
  return (
    <g>
      <rect width={w} height={h} fill="#CE1126" />
      <rect width={cw} height={ch} fill="#002B7F" />
      {st.map(([x, y, r], i) => (
        <path key={i} d={starPath(x * cw, y * ch, r * ch * 1.15)} fill="#fff" />
      ))}
    </g>
  );
};
export const AusFlag: React.FC<{w: number; h: number; id: string}> = ({w, h, id}) => {
  const sc: [number, number, number, number][] = [[0.75, 0.833, 0.07, 7], [0.625, 0.45, 0.07, 7], [0.75, 0.167, 0.07, 7], [0.875, 0.39, 0.07, 7], [0.81, 0.56, 0.04, 5]];
  return (
    <g>
      <rect width={w} height={h} fill="#012169" />
      <UJ w={w / 2} h={h / 2} id={id + 'u'} />
      <path d={starPath(w / 4, (h * 3) / 4, h * 0.15, 7, 0.47)} fill="#fff" />
      {sc.map(([x, y, r, p], i) => (
        <path key={i} d={starPath(x * w, y * h, r * h * 1.1, p, p === 7 ? 0.47 : 0.42)} fill="#fff" />
      ))}
    </g>
  );
};
export const NZFlag: React.FC<{w: number; h: number; id: string}> = ({w, h, id}) => {
  const sc: [number, number, number][] = [[0.75, 0.2, 0.075], [0.665, 0.48, 0.075], [0.84, 0.42, 0.065], [0.75, 0.8, 0.085]];
  return (
    <g>
      <rect width={w} height={h} fill="#012169" />
      <UJ w={w / 2} h={h / 2} id={id + 'u'} />
      {sc.map(([x, y, r], i) => (
        <g key={i}>
          <path d={starPath(x * w, y * h, r * h * 1.45)} fill="#fff" />
          <path d={starPath(x * w, y * h, r * h * 1.05)} fill="#C8102E" />
        </g>
      ))}
    </g>
  );
};
export const USFlag: React.FC<{w: number; h: number}> = ({w, h}) => {
  const sh = h / 13;
  const cw = w * 0.4, ch = sh * 7;
  const stars: React.ReactNode[] = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) stars.push(<path key={r * 6 + c} d={starPath(cw * (c + 0.75) / 6.5, ch * (r + 0.6) / 5.2, ch * 0.07)} fill="#fff" />);
  return (
    <g>
      {Array.from({length: 13}, (_, i) => (
        <rect key={i} x={0} y={i * sh} width={w} height={sh + 0.5} fill={i % 2 ? '#fff' : '#B22234'} />
      ))}
      <rect width={cw} height={ch} fill="#3C3B6E" />
      {stars}
    </g>
  );
};
// a flag on a pole that rises (p 0..1) and unfurls
export const FlagPole: React.FC<{x: number; y: number; pole: number; w: number; h: number; t: number; p: number; id: string; kind: 'ws' | 'au' | 'nz' | 'us'; n?: number}> = ({x, y, pole, w, h, t, p, id, kind, n = 0}) => {
  if (p <= 0) return null;
  const rise = clamp(p * 1.6);
  const unf = clamp((p - 0.25) / 0.75);
  const flag = kind === 'ws' ? <SamoaFlag w={w} h={h} /> : kind === 'au' ? <AusFlag w={w} h={h} id={id + 'f'} /> : kind === 'nz' ? <NZFlag w={w} h={h} id={id + 'f'} /> : <USFlag w={w} h={h} />;
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={0} cy={4} rx={22} ry={6} fill="#000" opacity={0.15 * rise} />
      <g transform={`scale(1 ${rise})`}>
        <rect x={-4} y={-pole} width={8} height={pole} rx={4} fill={mix('#E9EEF5', C.NIGHT, n * 0.5)} />
        <rect x={-4} y={-pole} width={3} height={pole} fill="#fff" opacity={0.5} />
        <circle cx={0} cy={-pole - 4} r={8} fill={mix('#FFC93C', C.NIGHT, n * 0.4)} />
      </g>
      {unf > 0 && (
        <g transform={`translate(4 ${-pole * rise + 6}) scale(${Math.max(0.02, unf)} 1)`}>
          <rect x={2} y={6} width={w} height={h} fill="#000" opacity={0.08} />
          <Wavy w={w} h={h} t={t} id={id} amp={0.1}>
            {flag}
          </Wavy>
          {n > 0 && <rect width={w} height={h} fill={C.NIGHT} opacity={n * 0.35} />}
        </g>
      )}
    </g>
  );
};

// ---------- the island diorama (a slice of ocean with an island on it) ----------
const yTop = (x: number, R: number, Ry: number) => Ry * Math.sqrt(Math.max(0, 1 - (x / R) * (x / R)));
export const Island: React.FC<{t: number; id: string; night?: number; lights?: number; flagP?: number; zz?: number; s?: number; squash?: number}> = ({t, id, night = 0, lights = 0, flagP = 0, zz = -1, s = 1, squash = 0}) => {
  const k = (c: string) => mix(c, C.NIGHT, night * 0.62);
  const R = 400, Ry = 128, D = 210;
  const wall = `M${-R} 0 A${R} ${Ry} 0 0 0 ${R} 0 L${R} ${D} A${R} ${Ry} 0 0 1 ${-R} ${D} Z`;
  const strata = `M${-R} ${D - 46} A${R} ${Ry} 0 0 0 ${R} ${D - 46} L${R} ${D} A${R} ${Ry} 0 0 1 ${-R} ${D} Z`;
  const fish = [0, 1, 2, 3].map((i) => {
    const sp = 34 + i * 9;
    const x = ((t * sp + i * 230) % (2 * R + 160)) - R - 80;
    const dir = i % 2 ? -1 : 1;
    const xx = dir > 0 ? x : -x;
    const y = yTop(xx, R, Ry) + 46 + i * 30 + Math.sin(t * 2 + i) * 6;
    return {x: xx, y, dir, c: ['#FFB547', '#FF7A8A', '#FFE066', '#B48CFF'][i]};
  });
  const ripples = [0, 1, 2].map((i) => ((t * 0.33 + i / 3) % 1));
  const sq = 1 - squash * 0.12, sx = 1 + squash * 0.08;
  return (
    <g transform={`scale(${s * sx} ${s * sq})`}>
      <defs>
        <linearGradient id={id + 'w'} x1="0" y1="0" x2="0" y2={D + Ry} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={k('#5FD8F2')} />
          <stop offset="0.45" stopColor={k('#1E9BD6')} />
          <stop offset="1" stopColor={k('#0B4F93')} />
        </linearGradient>
        <linearGradient id={id + 'wl'} x1={-R} y1="0" x2={R} y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.25" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="0.8" stopColor="#000" stopOpacity="0.0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.22" />
        </linearGradient>
        <radialGradient id={id + 's'} cx="0.42" cy="0.4" r="0.7">
          <stop offset="0" stopColor={k('#8FE8F8')} />
          <stop offset="0.6" stopColor={k('#3CBDE6')} />
          <stop offset="1" stopColor={k('#1890CF')} />
        </radialGradient>
        <linearGradient id={id + 'sd'} x1="0" y1={D - 46} x2="0" y2={D + Ry} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={k('#F3D28F')} />
          <stop offset="1" stopColor={k('#C99A55')} />
        </linearGradient>
        <linearGradient id={id + 'roof'} x1="0" y1="-180" x2="0" y2="-55" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={k(C.roofL)} />
          <stop offset="1" stopColor={k(C.roofD)} />
        </linearGradient>
        <radialGradient id={id + 'glow'}>
          <stop offset="0" stopColor="#FFD27A" stopOpacity="0.75" />
          <stop offset="1" stopColor="#FFD27A" stopOpacity="0" />
        </radialGradient>
        <clipPath id={id + 'wc'}>
          <path d={wall} />
        </clipPath>
      </defs>
      {/* drop shadow under the diorama */}
      <ellipse cx={20} cy={D + 40} rx={R * 1.02} ry={Ry * 0.9} fill="#000" opacity={0.18} />
      {/* the water wall */}
      <path d={wall} fill={`url(#${id}w)`} />
      <g clipPath={`url(#${id}wc)`}>
        {[0, 1, 2, 3, 4].map((i) => {
          let d = '';
          for (let x = -R; x <= R; x += 20) {
            const y = yTop(x, R, Ry) + 26 + i * 30 + Math.sin(x * 0.03 + t * 2.2 + i) * 6;
            d += (x === -R ? 'M' : 'L') + x + ' ' + y.toFixed(1);
          }
          return <path key={i} d={d} stroke="#fff" strokeWidth={3} fill="none" opacity={0.13 - i * 0.015} />;
        })}
        {fish.map((f, i) => (
          <g key={i} transform={`translate(${f.x} ${f.y}) scale(${f.dir} 1)`}>
            <ellipse cx={0} cy={0} rx={20} ry={11} fill={k(f.c)} />
            <path d={`M-16 0 L-32 -11 L-30 11Z`} fill={k(f.c)} />
            <circle cx={9} cy={-3} r={2.6} fill="#1D2340" />
          </g>
        ))}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const bx = -300 + i * 120 + Math.sin(i * 7) * 30;
          const by = D + 60 - ((t * 60 + i * 40) % 170);
          return <circle key={i} cx={bx + Math.sin(t * 3 + i) * 4} cy={by} r={4 + (i % 3)} fill="none" stroke="#fff" strokeWidth={2} opacity={0.45} />;
        })}
        <path d={strata} fill={`url(#${id}sd)`} />
        {Array.from({length: 18}, (_, i) => {
          const x = -R + 20 + i * 44;
          return <ellipse key={i} cx={x} cy={yTop(x, R, Ry) + D - 22 + ((i * 13) % 14)} rx={7 + (i % 3) * 2} ry={4} fill={k(i % 2 ? '#B7884A' : '#E9C783')} />;
        })}
        {[-280, -120, 60, 230].map((x, i) => (
          <path key={i} d={`M${x} ${yTop(x, R, Ry) + D - 40} q ${8 + Math.sin(t * 1.5 + i) * 8} -40 ${Math.sin(t * 1.2 + i) * 14} -78`} stroke={k(i % 2 ? '#3FBF8C' : '#2C9F72')} strokeWidth={10} fill="none" strokeLinecap="round" />
        ))}
        <rect x={-R} y={-10} width={2 * R} height={D + Ry + 20} fill={`url(#${id}wl)`} />
      </g>
      {/* water surface */}
      <ellipse cx={0} cy={0} rx={R} ry={Ry} fill={`url(#${id}s)`} />
      {ripples.map((p, i) => (
        <ellipse key={i} cx={-20} cy={-6} rx={250 + p * 150} ry={82 + p * 46} fill="none" stroke="#fff" strokeWidth={3} opacity={(1 - p) * 0.35} />
      ))}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const a = (i / 7) * Math.PI * 2 + t * 0.2;
        const gx = Math.cos(a) * 330, gy = Math.sin(a) * 104;
        const on = 0.5 + 0.5 * Math.sin(t * 3 + i * 2);
        return <path key={i} d={`M${gx - 14} ${gy} L${gx + 14} ${gy}`} stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={on * 0.5} />;
      })}
      <path d={`M${-R} 0 A${R} ${Ry} 0 0 0 ${R} 0`} stroke="#fff" strokeWidth={4} fill="none" opacity={0.55} />
      {/* island */}
      <path d={blob(-20, 10, 262, 88, 2)} fill={k(C.sandD)} />
      <path d={blob(-20, -8, 262, 88, 2)} fill={k(C.sand)} />
      <path d={blob(-20, -8, 275, 96, 2)} fill="none" stroke="#fff" strokeWidth={6} opacity={0.55 + 0.25 * Math.sin(t * 2.4)} />
      <path d={blob(-40, -18, 230, 70, 2)} fill={k(C.sandL)} opacity={0.5} />
      <path d={blob(-80, -10, 165, 56, 5)} fill={k(C.grassD)} />
      <path d={blob(-80, -36, 165, 56, 5)} fill={k(C.grass)} />
      <path d={blob(-100, -48, 110, 32, 5)} fill={k(C.grassL)} opacity={0.6} />
      {/* back palm */}
      <Palm x={-150} y={-62} h={320} lean={34} t={t} n={night} seed={2} s={0.9} />
      {/* hut (fale) */}
      <g transform="translate(95 -40)">
        <path d={blob(0, 8, 104, 32, 3)} fill={k('#A9A193')} />
        <path d={blob(0, -2, 104, 32, 3)} fill={k('#D3CCBE')} />
        <rect x={-78} y={-78} width={156} height={70} fill={k('#5B3C22')} />
        <rect x={-78} y={-78} width={156} height={70} fill="#FFC861" opacity={lights * 0.95} />
        {[-74, -37, 0, 37, 70].map((px, i) => (
          <rect key={i} x={px} y={-82} width={9} height={78} rx={3} fill={k(C.trunkD)} />
        ))}
        <path d="M-118 -66 Q-108 -178 0 -184 Q108 -178 118 -66 Q0 -46 -118 -66Z" fill={`url(#${id}roof)`} />
        {[-80, -40, 0, 40, 80].map((rx, i) => (
          <path key={i} d={`M${rx * 0.2} -180 Q${rx * 0.9} -150 ${rx * 1.25} -62`} stroke={k(C.roofD)} strokeWidth={3} fill="none" opacity={0.55} />
        ))}
        <path d="M-118 -66 Q0 -46 118 -66" stroke={k('#8E5D25')} strokeWidth={6} fill="none" />
        <path d="M-80 -150 Q-40 -176 10 -178" stroke="#fff" strokeWidth={6} fill="none" opacity={0.25} strokeLinecap="round" />
      </g>
      {lights > 0 && night > 0 && <circle cx={95} cy={-90} r={200} fill={`url(#${id}glow)`} opacity={lights * night} />}
      {zz >= 0 &&
        [0, 1, 2].map((i) => {
          const p = (zz * 0.9 + i * 0.33) % 1;
          if (zz < i * 0.25) return null;
          return (
            <text key={i} x={150 + p * 90 + Math.sin(p * 6 + i) * 10} y={-180 - p * 170} fontFamily={F} fontWeight={900} fontSize={42 + p * 30} fill="#fff" opacity={Math.sin(p * Math.PI) * 0.9}>
              z
            </text>
          );
        })}
      <FlagPole x={262} y={-36} pole={250} w={160} h={86} t={t} p={flagP} id={id + 'flag'} kind="ws" n={night} />
      <Palm x={-255} y={-14} h={250} lean={-46} t={t} n={night} seed={5} s={0.95} />
      <Palm x={-30} y={30} h={205} lean={-22} t={t} n={night} seed={8} s={0.85} />
    </g>
  );
};

// ---------- calendar page (HTML) ----------
export type PageSpec = {month: string; num: string; wd: string; head: string; old?: boolean};
export const PageFace: React.FC<{w: number; h: number; p: PageSpec; glow?: number; stamp?: number}> = ({w, h, p, glow = 0, stamp = 0}) => (
  <div
    style={{
      position: 'absolute', left: 0, top: 0, width: w, height: h, borderRadius: w * 0.06, overflow: 'hidden',
      background: p.old ? 'linear-gradient(180deg,#FBF1DA,#EBD9B4)' : 'linear-gradient(180deg,#FFFFFF,#F2EEE6)',
      boxShadow: glow > 0 ? `0 0 ${60 * glow}px ${18 * glow}px rgba(25,211,197,${0.75 * glow}), 0 10px 0 rgba(0,0,0,0.06)` : '0 10px 0 rgba(0,0,0,0.06)',
    }}
  >
    <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h * 0.22, background: p.head, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h * 0.07, background: 'rgba(255,255,255,0.18)'}} />
      <div style={{fontFamily: F, fontWeight: 900, fontSize: h * 0.074, color: '#fff', letterSpacing: '0.01em', marginTop: h * 0.03, whiteSpace: 'nowrap'}}>{p.month}</div>
    </div>
    <div style={{position: 'absolute', left: 0, top: h * 0.235, width: w, textAlign: 'center', fontFamily: F, fontWeight: 900, fontSize: h * 0.46, lineHeight: 1, color: p.old ? '#5A3B22' : C.navy}}>{p.num}</div>
    <div style={{position: 'absolute', left: 0, top: h * 0.74, width: w, textAlign: 'center', fontFamily: F, fontWeight: 900, fontSize: h * 0.11, lineHeight: 1.1, color: p.head, whiteSpace: 'nowrap'}}>{p.wd}</div>
    <div style={{position: 'absolute', right: 0, bottom: 0, width: w * 0.22, height: w * 0.22, background: 'linear-gradient(135deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.07) 50%)'}} />
    {stamp > 0 && (
      <div
        style={{
          position: 'absolute', left: w * 0.12, top: h * 0.33, width: w * 0.76, height: h * 0.3, border: `${w * 0.028}px solid #E0393E`, borderRadius: w * 0.06,
          display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotate(-14deg) scale(${stamp})`, opacity: 0.92,
          fontFamily: F, fontWeight: 900, fontSize: h * 0.19, color: '#E0393E', mixBlendMode: 'multiply',
        }}
      >
        PAID
      </div>
    )}
  </div>
);
export const PageBack: React.FC<{w: number; h: number; old?: boolean}> = ({w, h, old}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, borderRadius: w * 0.06, background: old ? 'linear-gradient(180deg,#E8D6AF,#D9C296)' : 'linear-gradient(180deg,#E9E5DC,#D8D3C8)'}} />
);
// a page hinged at its top edge. ang: 0 = flat, 180 = flipped over the top
export const HingedPage: React.FC<{w: number; h: number; p: PageSpec; ang: number; glow?: number; stamp?: number}> = ({w, h, p, ang, glow, stamp}) => {
  const shade = Math.sin((clamp(ang, 0, 180) * Math.PI) / 180) * 0.35;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, transformOrigin: '50% 0%', transform: `rotateX(${ang}deg)`, transformStyle: 'preserve-3d'}}>
      <div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden'}}>
        <PageFace w={w} h={h} p={p} glow={glow} stamp={stamp} />
        <div style={{position: 'absolute', inset: 0, borderRadius: w * 0.06, background: '#1D2340', opacity: shade}} />
      </div>
      <div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateX(180deg)'}}>
        <PageBack w={w} h={h} old={p.old} />
      </div>
    </div>
  );
};
export const Rings: React.FC<{w: number; h: number; old?: boolean}> = ({w, h, old}) => (
  <svg width={w} height={h * 0.2} viewBox={`0 0 ${w} ${h * 0.2}`} style={{position: 'absolute', left: 0, top: -h * 0.07, overflow: 'visible'}}>
    {[0.28, 0.72].map((u, i) => (
      <g key={i}>
        <rect x={u * w - w * 0.03} y={h * 0.075} width={w * 0.06} height={h * 0.03} rx={h * 0.015} fill="#000" opacity={0.25} />
        <rect x={u * w - w * 0.018} y={0} width={w * 0.036} height={h * 0.1} rx={w * 0.018} fill={old ? '#8C7A5E' : '#5E6687'} />
        <rect x={u * w - w * 0.01} y={h * 0.006} width={w * 0.012} height={h * 0.08} rx={w * 0.006} fill="#fff" opacity={0.45} />
      </g>
    ))}
  </svg>
);
export const TornStub: React.FC<{w: number; h: number; head: string}> = ({w, h, head}) => {
  const pts: string[] = [];
  const n = 26;
  for (let i = 0; i <= n; i++) pts.push(`${(i / n) * 100}% ${(i % 2 ? 7.2 : 4.6) + Math.sin(i * 2.7) * 1.2}%`);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, clipPath: `polygon(0% 0%, 100% 0%, ${pts.reverse().join(', ')})`}}>
      <div style={{position: 'absolute', inset: 0, background: head, borderRadius: w * 0.06}} />
    </div>
  );
};
// the desk pad: board + stacked pages (front first) + rings
export type PadPage = {p: PageSpec; ang?: number; glow?: number; stamp?: number; stubBelow?: string; stubGlow?: number};
export const Pad: React.FC<{x: number; y: number; w: number; h: number; pages: PadPage[]; stub?: string; old?: boolean; rot?: number; scale?: number; children?: React.ReactNode}> = ({x, y, w, h, pages, stub, old, rot = 0, scale = 1, children}) => (
  <div style={{position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, perspective: 2200, transform: `rotate(${rot}deg) scale(${scale})`, transformOrigin: '50% 50%'}}>
    {pages.filter((pg) => (pg.ang || 0) > 90 && (pg.ang || 0) < 300).map((pg, i) => (
      <HingedPage key={'b' + i} w={w} h={h} p={pg.p} ang={pg.ang || 0} />
    ))}
    <div style={{position: 'absolute', left: -w * 0.05, top: -h * 0.03, width: w * 1.1, height: h * 1.07, borderRadius: w * 0.08, background: old ? '#7B5B3A' : '#2E3766', boxShadow: '0 30px 60px rgba(10,15,40,0.35)'}} />
    {[4, 3, 2, 1].map((i) => (
      <div key={i} style={{position: 'absolute', left: 0, top: i * 5, width: w, height: h, borderRadius: w * 0.06, background: i % 2 ? '#E4DFD4' : '#F4F0E8'}} />
    ))}
    {[...pages].reverse().map((pg, i) => (
      <React.Fragment key={i}>
        {(pg.ang || 0) <= 90 && <>
        {pg.stubBelow && (
          <div style={{position: 'absolute', inset: 0, filter: pg.stubGlow ? `drop-shadow(0 0 ${24 * pg.stubGlow}px rgba(25,211,197,${pg.stubGlow}))` : undefined}}>
            <TornStub w={w} h={h} head={pg.stubBelow} />
          </div>
        )}
        <HingedPage w={w} h={h} p={pg.p} ang={pg.ang || 0} glow={pg.glow} stamp={pg.stamp} />
        </>}
        {(pg.ang || 0) > 90 && pg.stubBelow && (
          <div style={{position: 'absolute', inset: 0, filter: pg.stubGlow ? `drop-shadow(0 0 ${24 * pg.stubGlow}px rgba(25,211,197,${pg.stubGlow}))` : undefined}}>
            <TornStub w={w} h={h} head={pg.stubBelow} />
          </div>
        )}
      </React.Fragment>
    ))}
    {stub && <TornStub w={w} h={h} head={stub} />}
    {children}
    <Rings w={w} h={h} old={old} />
  </div>
);
// a loose page flying through 3D space
export const FlyingPage: React.FC<{x: number; y: number; w: number; h: number; p: PageSpec; rz?: number; rx?: number; ry?: number; s?: number; glow?: number; stamp?: number; torn?: boolean}> = ({x, y, w, h, p, rz = 0, rx = 0, ry = 0, s = 1, glow, stamp, torn = true}) => {
  const n = 26;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) pts.push(`${(i / n) * 100}% ${(i % 2 ? 3.2 : 5.6) + Math.sin(i * 2.7) * 1.1}%`);
  const clip = torn ? `polygon(${pts.join(', ')}, 100% 100%, 0% 100%)` : undefined;
  return (
    <div style={{position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, perspective: 2000}}>
      <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `scale(${s}) rotateZ(${rz}deg) rotateX(${rx}deg) rotateY(${ry}deg)`}}>
        <div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden', clipPath: clip}}>
          <PageFace w={w} h={h} p={p} glow={glow} stamp={stamp} />
        </div>
        <div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', clipPath: clip}}>
          <PageBack w={w} h={h} old={p.old} />
        </div>
      </div>
    </div>
  );
};

export const FRI: PageSpec = {month: 'DECEMBER 2011', num: '30', wd: 'FRIDAY', head: C.accent};
export const THU: PageSpec = {month: 'DECEMBER 2011', num: '29', wd: 'THURSDAY', head: C.coral};
export const SAT: PageSpec = {month: 'DECEMBER 2011', num: '31', wd: 'SATURDAY', head: C.coral};
export const JUL: PageSpec = {month: 'JULY 1892', num: '4', wd: 'MONDAY', head: '#B85C45', old: true};
