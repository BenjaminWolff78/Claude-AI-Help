import React, {createContext, useContext, useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {BEETLE, CITY, MOUNTAINS, SCISSOR_BOTTOM, SCISSOR_PIVOT, SCISSOR_TOP} from './assets';
import {COND, DUR, FPS, H, INK, MONO, SUB, W, WORDS, WT, clamp01, clampT, easeIn, easeInOut, easeOut, hash, lerp, prog, twos} from './lib';

/* ------------------------------------------------------------------ fonts */
const FACE = `@font-face{font-family:"Cursor Riso";src:url(${staticFile('fonts/texgyrecursor-bold.otf')}) format("opentype");font-weight:700;font-display:block;}
@font-face{font-family:"Heros Cn Riso";src:url(${staticFile('fonts/texgyreheroscn-bold.otf')}) format("opentype");font-weight:700;font-display:block;}
.k{mix-blend-mode:multiply}`;
const Fonts: React.FC = () => {
  const [h] = useState(() => delayRender('riso-fonts'));
  useEffect(() => {
    Promise.all([document.fonts.load(`700 80px "Cursor Riso"`), document.fonts.load(`700 80px "Heros Cn Riso"`)]).then(() => continueRender(h));
  }, [h]);
  return <style>{FACE}</style>;
};

/* ------------------------------------------------------------------ riso helpers */
/** pink plate misregistration, in world units (changes every printed frame = on twos) */
const RegCtx = createContext<[number, number]>([0, 0]);
const Pk: React.FC<{children: React.ReactNode}> = ({children}) => {
  const r = useContext(RegCtx);
  return <g transform={`translate(${r[0].toFixed(2)} ${r[1].toFixed(2)})`}>{children}</g>;
};
const col = (c: string) => c;

/* ------------------------------------------------------------------ camera */
type Key = {t: number; x: number; y: number; z: number; lin?: boolean};
const CAM: Key[] = [
  {t: 0, x: -560, y: 40, z: 1.25},
  {t: 3.3, x: -260, y: 20, z: 1.0},
  {t: 4.4, x: 120, y: 0, z: 1.0},
  {t: 5.4, x: 430, y: 0, z: 1.0},
  {t: 7.5, x: 1600, y: 0, z: 1.0, lin: true},
  {t: 8.6, x: 1650, y: 0, z: 1.3},
  {t: 9.4, x: 1760, y: 20, z: 1.18},
  {t: 10.4, x: 2380, y: 120, z: 1.0},
  {t: 12.4, x: 2660, y: 180, z: 1.06},
  {t: 13.5, x: 3150, y: 0, z: 1.0},
  {t: 14.9, x: 4100, y: -60, z: 1.0, lin: true},
  {t: 15.9, x: 4450, y: -150, z: 0.98},
  {t: 18.4, x: 4600, y: -210, z: 1.06},
  {t: 19.9, x: 4560, y: -60, z: 1.0},
  {t: 21.45, x: 4850, y: 0, z: 1.0},
  {t: 23.0, x: 5900, y: 0, z: 1.0, lin: true},
  {t: 23.5, x: 6040, y: -60, z: 1.1},
  {t: 24.4, x: 6500, y: -60, z: 1.0},
  {t: 25.4, x: 7150, y: -180, z: 1.0},
  {t: 26.9, x: 7250, y: -150, z: 1.02},
  {t: 27.7, x: 7250, y: 0, z: 1.05},
  {t: 31.2, x: 7750, y: 0, z: 1.05},
  {t: 33.9, x: 9050, y: 0, z: 1.0, lin: true},
  {t: 35.0, x: 9300, y: 0, z: 1.18},
  {t: 35.8, x: 9380, y: 0, z: 1.25},
  {t: 36.5, x: 11650, y: -60, z: 0.78},
  {t: 38.5, x: 11700, y: -60, z: 0.8},
  {t: 39.7, x: 12707, y: -98, z: 9.0},
  {t: 40.9, x: 12707, y: -98, z: 9.4},
  {t: 42.1, x: 13700, y: 0, z: 1.0},
  {t: 46.0, x: 13820, y: 0, z: 1.08},
  {t: 47.0, x: 15200, y: -260, z: 0.95},
  {t: 48.4, x: 15600, y: -240, z: 0.88},
  {t: 50.4, x: 16300, y: 330, z: 1.0},
  {t: 52.4, x: 16050, y: 300, z: 0.95},
  {t: 55.6, x: 16250, y: 330, z: 1.0},
  {t: 57.4, x: 16600, y: 380, z: 1.22},
  {t: 58.6, x: 16700, y: 380, z: 1.3},
  {t: 59.6, x: 16950, y: 420, z: 1.0},
  {t: 61.5, x: 17100, y: 440, z: 1.05},
  {t: 64.8, x: 17200, y: 460, z: 1.12},
  {t: 65.5, x: 17700, y: -320, z: 1.0},
  {t: 66.6, x: 17900, y: -100, z: 0.95},
  {t: 67.3, x: 18450, y: 380, z: 0.95},
  {t: 71.0, x: 18450, y: 380, z: 0.97},
  {t: 72.4, x: 18480, y: 330, z: 1.0},
  {t: 74.6, x: 18520, y: 330, z: 1.03},
  {t: 75.6, x: 19920, y: -230, z: 1.0},
  {t: 77.9, x: 19980, y: -230, z: 1.08},
  {t: 78.6, x: 20150, y: -170, z: 1.0},
  {t: 80.1, x: 20220, y: -170, z: 1.02},
  {t: 81.0, x: -330, y: 40, z: 1.0},
  {t: 82.6, x: -380, y: 40, z: 1.05},
  {t: 83.4, x: 900, y: 0, z: 1.0},
  {t: 84.5, x: 1350, y: 0, z: 1.02},
  {t: 85.5, x: -420, y: 30, z: 1.05},
  {t: DUR, x: -560, y: 40, z: 1.25},
];
const camAt = (t: number) => {
  let i = 0;
  while (i < CAM.length - 2 && t >= CAM[i + 1].t) i++;
  const a = CAM[i];
  const b = CAM[i + 1];
  const u = clamp01((t - a.t) / (b.t - a.t));
  const k = b.lin ? u : easeInOut(u);
  // zoom interpolates in log space so a 1x -> 7x push feels even
  const z = Math.exp(lerp(Math.log(a.z), Math.log(b.z), k));
  return {x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z};
};

/* ------------------------------------------------------------------ the print head and everything it stamps */
type Ev = {x: number; y: number; ch: string; t: number; c: string; s: number; font?: string; ghost?: boolean; id: string};
const CW = 96;
const FS = 150;
const EVS: Ev[] = [];
const put = (id: string, x0: number, chars: string, times: number[], o: Partial<Ev> & {cw?: number} = {}) => {
  const cw = o.cw ?? CW;
  chars.split('').forEach((ch, i) => EVS.push({id: `${id}${i}`, x: x0 + i * cw, y: o.y ?? 0, ch, t: times[i], c: o.c ?? INK.blue, s: o.s ?? FS, font: o.font, ghost: o.ghost}));
};
const spread = (n: number, a: number, b: number, pow = 1) => Array.from({length: n}, (_, i) => a + (b - a) * Math.pow(n === 1 ? 0 : i / (n - 1), pow));

// S2: 0.30000000000000004
const T_ZEROS = spread(15, WT('fifteen', 1, 's', 0.05), WT('zeros', 1, 'e', -0.08));
put('res', 0, '0.3', [WT('point', 3), WT('point', 3, 's', 0.12), WT('three')]);
put('z', 3 * CW, '000000000000000', T_ZEROS);
put('four', 18 * CW, '4', [WT('four')], {c: INK.pink});
// S3: "never end" - dots race ahead
put('dots', 3100, '··············', spread(14, WT('some'), WT('end', 1, 'e', -0.2), 0.62), {cw: 90});
// S4: 0.333... forever
const T3 = [WT('point', 4), WT('point', 4, 's', 0.12), WT('three', 2), WT('three', 3), WT('three', 4)];
const T3F = spread(21, WT('forever', 1, 's', 0.02), WT('forever', 1, 'e', 0.6), 0.55);
put('third', 4250, '0.333' + '3'.repeat(21), [...T3, ...T3F]);
export const CUT1_X = 4250 + 19 * CW - 48; // between the 19th and 20th digit
// S5: one tenth in twos: 0.0 0011 0011 ...
const BIN = '0.0' + '0011'.repeat(6); // 27 chars, we keep 26
const BIN_SPOKEN = [WT('zero'), WT('point', 6), WT('zero', 2), WT('zero', 3), WT('zero', 4), WT('one', 5), WT('one', 6), WT('zero', 5), WT('zero', 6), WT('one', 7), WT('one', 8)];
const BIN_FAST = spread(15, WT('over', 1, 's', 0.02), WT('stop', 1, 's', -0.06), 0.7);
put('bin', 7000, BIN.slice(0, 26), [...BIN_SPOKEN, ...BIN_FAST]);
put('ghost', 7000 + 26 * CW, '100', [WT('stop', 1, 's', 0.05), WT('stop', 1, 's', 0.12), WT('stop', 1, 's', 0.19)], {ghost: true});
const STOP_X = 7000 + 26 * CW - 48;
// S6: the head stamps the ruler ticks (invisible chars carry the head)
const TICK_X = [10600, 11300, 12000, 12700];
const TICK_T = [35.62, 35.74, 35.86, 35.98];
TICK_X.forEach((x, i) => EVS.push({id: `tick${i}`, x, y: 0, ch: '', t: TICK_T[i], c: INK.blue, s: FS}));
// then it gets out of the way of the zoom, waiting where the next number goes
EVS.push({id: 'park1', x: 13300, y: 0, ch: '', t: 36.45, c: INK.blue, s: FS});
// S7: 1000.000 and the digits that get chopped off it
put('k', 13300, '1000.000', spread(8, WT('harmless', 1, 'e', -0.1), WT('harmless', 1, 'e', 0.3)));
const CHOP = [
  {ch: '4', t: WT('chop', 2, 's', -0.1), cut: WT('chop', 2, 's', 0.12)},
  {ch: '7', t: WT('again', 1, 's', -0.12), cut: WT('again', 1, 's', 0.1)},
  {ch: '2', t: WT('again', 2, 's', -0.08), cut: WT('again', 2, 's', 0.14)},
];
const CHOP_X = 13300 + 8 * CW;
CHOP.forEach((c, i) => EVS.push({id: `chop${i}`, x: CHOP_X, y: 0, ch: c.ch, t: c.t, c: INK.pink, s: FS}));
// S8: VANCOUVER STOCK EXCHANGE typed onto the tape
put('vse', 15330, 'VANCOUVER STOCK EXCHANGE', spread(24, WT('vancouver'), WT('exchange', 1, 'e', 0.05)), {cw: 58, s: 96});
// the head rides home with the whip, to the slot it started from
EVS.push({id: 'home', x: -380, y: 0, ch: '', t: 81.0, c: INK.blue, s: FS});
EVS.sort((a, b) => a.t - b.t);

const HEAD_HOVER = -190;
const headAt = (t: number) => {
  let i = -1;
  while (i < EVS.length - 1 && EVS[i + 1].t <= t) i++;
  const prev = i >= 0 ? EVS[i] : {x: -380, t: -10};
  const next = EVS[i + 1];
  let x = prev.x;
  if (next) {
    const dur = next.id === 'home' ? 0.95 : Math.min(0.42, Math.max(0.03, (next.t - prev.t) * 0.75));
    const k = clamp01((t - (next.t - dur)) / dur);
    x = lerp(prev.x, next.x, next.id === 'home' ? easeInOut(k) : easeInOut(k));
  }
  // dip onto the tape at every print
  let dip = 0;
  for (let j = Math.max(0, i - 2); j <= Math.min(EVS.length - 1, i + 2); j++) {
    const d = t - EVS[j].t;
    if (d > -0.06 && d <= 0) dip = Math.max(dip, easeIn(1 + d / 0.06));
    if (d > 0 && d < 0.16) dip = Math.max(dip, 1 - easeOut(d / 0.16));
  }
  return {x, y: HEAD_HOVER + dip * 92};
};

const Head: React.FC<{t: number}> = ({t}) => {
  const {x, y} = headAt(t);
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
      {/* arm up out of frame */}
      <rect className="k" x={-9} y={-1400} width={18} height={1340} fill={INK.blue} opacity={0.85} />
      <rect className="k" x={-46} y={-96} width={92} height={96} rx={10} fill={INK.blue} />
      <Pk>
        <rect className="k" x={-40} y={-14} width={80} height={14} rx={3} fill={INK.pink} />
        <circle className="k" cx={0} cy={-60} r={13} fill={INK.pink} />
      </Pk>
    </g>
  );
};

/** a printed character: stamped with a squash, pink ones sit on the misregistered plate */
const Glyph: React.FC<{e: Ev; t: number; dx?: number; dy?: number; rot?: number; op?: number}> = ({e, t, dx = 0, dy = 0, rot = 0, op = 1}) => {
  const d = t - e.t;
  if (d < 0) return null;
  const sq = 1 + 0.28 * (1 - easeOut(clamp01(d / 0.14)));
  const body = e.ch === '·' ? (
    <circle className="k" cx={0} cy={0} r={15} fill={e.c} opacity={op} />
  ) : (
    <text
      className="k"
      x={0}
      y={e.s * 0.34}
      fontFamily={e.font ?? MONO}
      fontWeight={700}
      fontSize={e.s}
      textAnchor="middle"
      fill={e.ghost ? 'none' : e.c}
      stroke={e.ghost ? e.c : 'none'}
      strokeWidth={e.ghost ? 4 : 0}
      strokeDasharray={e.ghost ? '10 8' : undefined}
      opacity={op}
    >
      {e.ch}
    </text>
  );
  const g = (
    <g transform={`translate(${(e.x + dx).toFixed(1)} ${(e.y + dy).toFixed(1)}) rotate(${rot.toFixed(2)}) scale(${(1 / sq).toFixed(3)} ${sq.toFixed(3)})`}>{body}</g>
  );
  return e.c === INK.pink ? <Pk>{g}</Pk> : g;
};

/* ------------------------------------------------------------------ the tape (the carrier) */
const TAPE_H = 170;
const TapeStrip: React.FC<{x0: number; x1: number}> = ({x0, x1}) => (
  <g>
    <rect x={x0} y={-TAPE_H / 2} width={x1 - x0} height={TAPE_H} fill={INK.tape} />
    <rect className="k" x={x0} y={-TAPE_H / 2} width={x1 - x0} height={5} fill={INK.blue} opacity={0.55} />
    <rect className="k" x={x0} y={TAPE_H / 2 - 5} width={x1 - x0} height={5} fill={INK.blue} opacity={0.55} />
  </g>
);
/** paper shadow under a strip, printed as a halftone */
const TapeShadow: React.FC<{x0: number; x1: number; lift?: number}> = ({x0, x1, lift = 0}) => (
  <rect className="k" x={x0 + 6} y={-TAPE_H / 2 + 14 + lift} width={x1 - x0} height={TAPE_H} fill="url(#dotsBlue)" opacity={0.55} />
);

/* ------------------------------------------------------------------ props */
const KEYS = ['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '−', 'C', '0', '.', '+'];
const KEY_PRESS: [string, number][] = [
  ['.', WT('point')],
  ['1', WT('one')],
  ['+', WT('and')],
  ['.', WT('point', 2)],
  ['2', WT('two')],
  ['=', WT('ask')],
  ['1', 80.62],
  ['+', 80.78],
  ['2', 80.94],
  ['=', WT('perfect', 1, 's', -0.08)],
  ['C', 85.42],
];
const displayAt = (t: number) => {
  if (t >= 85.42) return '';
  if (t >= 80.55) return t >= WT('perfect', 1, 's', -0.08) ? '1+2=3' : t >= 80.94 ? '1+2' : t >= 80.78 ? '1+' : t >= 80.62 ? '1' : '';
  const seq: [number, string][] = [
    [WT('point'), '0.'],
    [WT('one'), '0.1'],
    [WT('and'), '0.1+'],
    [WT('point', 2), '0.1+0.'],
    [WT('two'), '0.1+0.2'],
    [WT('ask'), '0.1+0.2='],
  ];
  let s = '';
  for (const [a, v] of seq) if (t >= a) s = v;
  return s;
};

const Calculator: React.FC<{t: number}> = ({t}) => {
  const disp = displayAt(t);
  const pressed = (k: string) => KEY_PRESS.some(([kk, a]) => kk === k && t >= a - 0.03 && t < a + 0.14);
  const eqP = pressed('=');
  return (
    <g transform="translate(-700 70) rotate(-4)">
      <rect className="k" x={-268} y={-372} width={560} height={780} rx={46} fill="url(#dotsBlue)" opacity={0.6} />
      <rect className="k" x={-280} y={-390} width={560} height={780} rx={46} fill={INK.blue} />
      {/* printer slot, where the tape comes out */}
      <rect x={230} y={-110} width={70} height={190} rx={12} fill={INK.deep} className="k" />
      {/* display */}
      <rect x={-230} y={-330} width={460} height={150} rx={18} fill={INK.tape} />
      <text className="k" x={205} y={-228} textAnchor="end" fontFamily={MONO} fontWeight={700} fontSize={disp.length > 7 ? 66 : 84} fill={INK.blue}>
        {disp}
      </text>
      {KEYS.map((k, i) => {
        const cx = -165 + (i % 4) * 110;
        const cy = -110 + Math.floor(i / 4) * 112;
        const p = pressed(k);
        const op = ['÷', '×', '−', '+'].includes(k);
        return (
          <g key={k} transform={`translate(${cx} ${cy + (p ? 9 : 0)})`}>
            {!p && <rect className="k" x={-44} y={-30} width={88} height={84} rx={20} fill={INK.deep} opacity={0.6} />}
            {op || k === 'C' ? (
              <Pk>
                <rect className="k" x={-44} y={-40} width={88} height={84} rx={20} fill={INK.pink} />
              </Pk>
            ) : (
              <rect x={-44} y={-40} width={88} height={84} rx={20} fill={INK.tape} />
            )}
            <text className="k" x={0} y={18} textAnchor="middle" fontFamily={COND} fontWeight={700} fontSize={50} fill={op || k === 'C' ? INK.tape : INK.blue} style={{mixBlendMode: op || k === 'C' ? 'normal' : 'multiply'}}>
              {k}
            </text>
          </g>
        );
      })}
      {/* the long = key */}
      <g transform={`translate(0 ${338 + (eqP ? 9 : 0)})`}>
        {!eqP && <rect className="k" x={-209} y={-30} width={418} height={64} rx={20} fill={INK.deep} opacity={0.6} />}
        <Pk>
          <rect className="k" x={-209} y={-40} width={418} height={64} rx={20} fill={INK.pink} />
        </Pk>
        <text x={0} y={10} textAnchor="middle" fontFamily={COND} fontWeight={700} fontSize={54} fill={INK.tape}>
          =
        </text>
      </g>
      {/* the tick for 1+2=3 */}
      {t > WT('perfect') && t < 85.42 && (
        <Pk>
          <path
            className="k"
            d="M-170 -262 L-128 -222 L-60 -300"
            fill="none"
            stroke={INK.pink}
            strokeWidth={22}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={260}
            strokeDashoffset={260 * (1 - easeOut(clampT(t, WT('perfect'), WT('perfect', 1, 's', 0.25))))}
          />
        </Pk>
      )}
    </g>
  );
};

/** rubber stamp CAN'T, crashing down from oversize */
const Stamp: React.FC<{t: number; t0: number; x: number; y: number; rot: number; text: string; t1?: number}> = ({t, t0, x, y, rot, text, t1 = 1e9}) => {
  if (t < t0 - 0.12 || t > t1 + 0.3) return null;
  const k = easeOut(clampT(t, t0 - 0.12, t0 + 0.05));
  const s = lerp(3.2, 1, k);
  const leave = easeIn(clampT(t, t1, t1 + 0.3));
  const w = text.length * 64 + 70;
  return (
    <g transform={`translate(${x} ${y - leave * 900}) rotate(${rot}) scale(${s.toFixed(3)})`} opacity={k < 0.05 ? 0 : 1}>
      <Pk>
        <rect className="k" x={-w / 2} y={-80} width={w} height={160} rx={18} fill="none" stroke={INK.pink} strokeWidth={14} />
        <text className="k" x={0} y={46} textAnchor="middle" fontFamily={COND} fontWeight={700} fontSize={136} fill={INK.pink} letterSpacing={4}>
          {text}
        </text>
      </Pk>
    </g>
  );
};

const Scissors: React.FC<{x: number; y: number; rot: number; open: number; s?: number}> = ({x, y, rot, open, s = 1}) => {
  const a = 4 + open * 20;
  const [px, py] = SCISSOR_PIVOT;
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot}) scale(${s}) translate(${-px} ${-py})`}>
      <path className="k" d={SCISSOR_BOTTOM} fill={INK.blue} transform={`rotate(${a} ${px} ${py})`} />
      <Pk>
        <path className="k" d={SCISSOR_TOP} fill={INK.pink} transform={`rotate(${-a} ${px} ${py})`} />
      </Pk>
      <circle cx={px} cy={py} r={9} fill={INK.tape} />
    </g>
  );
};
/** scissors that come down onto the tape, snip at tCut, and leave */
const Snip: React.FC<{t: number; x: number; tCut: number; inDur?: number; hold?: number}> = ({t, x, tCut, inDur = 0.45, hold = 0.3}) => {
  if (t < tCut - inDur - 0.05 || t > tCut + hold + 0.6) return null;
  const arrive = easeOut(clampT(t, tCut - inDur, tCut - 0.08));
  const leave = easeIn(clampT(t, tCut + hold, tCut + hold + 0.5));
  const close = clampT(t, tCut - 0.07, tCut + 0.02);
  const open = close > 0 ? 1 - easeIn(close) : 1;
  const y = lerp(-1300, -330, arrive) - leave * 1100;
  return <Scissors x={x} y={y} rot={90} open={open} s={1.2} />;
};

const Beetle: React.FC<{t: number; f: number}> = ({t, f}) => {
  const tIn = WT('thats');
  const tHit = WT('bug');
  if (t < tIn - 0.2 || t > tHit + 1.2) return null;
  const walk = easeOut(clampT(t, tIn - 0.2, tHit - 0.05));
  const flee = easeIn(clampT(t, tHit + 0.25, tHit + 0.9));
  const x = lerp(2500, 1900, walk) + flee * 120;
  const y = -10 + flee * 900;
  const wob = Math.sin(twos(f) * 1.9) * 7 * (walk < 1 || flee > 0 ? 1 : 0.2);
  const rot = -90 + wob + flee * 60;
  const hitK = clampT(t, tHit, tHit + 0.1);
  return (
    <g>
      <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(2)}) scale(0.95) translate(-130 -115)`}>
        <path className="k" d={BEETLE} fill={INK.blue} />
        <Pk>
          <rect className="k" x={127} y={72} width={6} height={124} rx={3} fill={INK.pink} />
        </Pk>
      </g>
      {hitK > 0 && flee < 1 && (
        <Pk>
          <path
            className="k"
            d={`M${1720} ${-200} L${2080} ${180}`}
            stroke={INK.pink}
            strokeWidth={30}
            strokeLinecap="round"
            strokeDasharray={600}
            strokeDashoffset={600 * (1 - easeOut(hitK))}
            opacity={1 - flee}
          />
        </Pk>
      )}
    </g>
  );
};

/** four switches and bulbs counting 0..15 in binary */
const Switches: React.FC<{t: number}> = ({t}) => {
  const t0 = WT('computers', 1, 's', 0.35);
  const n = Math.max(0, Math.min(15, Math.floor((t - t0) / 0.105)));
  const on = t >= t0;
  const appear = easeOut(clampT(t, t0 - 0.55, t0 - 0.1));
  if (t < t0 - 0.6 || t > 16) return null;
  return (
    <g transform={`translate(0 ${lerp(500, 0, appear).toFixed(1)})`}>
      {[3, 2, 1, 0].map((bit, i) => {
        const x = 2380 + i * 190;
        const lit = on && ((n >> bit) & 1) === 1;
        return (
          <g key={bit}>
            {/* bulb */}
            <circle className="k" cx={x} cy={185} r={48} fill={lit ? INK.yellow : 'none'} stroke={INK.blue} strokeWidth={10} />
            <rect className="k" x={x - 24} y={228} width={48} height={30} rx={6} fill={INK.blue} />
            {lit && (
              <Pk>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((r) => {
                  const a = (r / 8) * Math.PI * 2;
                  return <line key={r} className="k" x1={x + Math.cos(a) * 62} y1={185 + Math.sin(a) * 62} x2={x + Math.cos(a) * 86} y2={185 + Math.sin(a) * 86} stroke={INK.pink} strokeWidth={9} strokeLinecap="round" />;
                })}
              </Pk>
            )}
            {/* switch */}
            <rect className="k" x={x - 52} y={280} width={104} height={150} rx={16} fill={INK.blue} />
            <rect x={x - 22} y={lit ? 296 : 354} width={44} height={60} rx={10} fill={INK.tape} />
            <text className="k" x={x} y={515} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={90} fill={lit ? INK.pink : INK.blue}>
              {lit ? '1' : '0'}
            </text>
          </g>
        );
      })}
    </g>
  );
};

/** a paper pie cut into n wedges; one wedge (pink) slides out */
const Pie: React.FC<{t: number; cx: number; cy: number; r: number; n: number; tCut: number; tOut: number; tIn: number}> = ({t, cx, cy, r, n, tCut, tOut, tIn}) => {
  if (t < tIn - 0.1) return null;
  const arrive = easeOut(clampT(t, tIn - 0.1, tIn + 0.35));
  const cut = easeOut(clampT(t, tCut, tCut + 0.3));
  const out = easeOut(clampT(t, tOut, tOut + 0.4));
  const a0 = -Math.PI / 2;
  const a1 = a0 + (Math.PI * 2) / n;
  const mid = (a0 + a1) / 2;
  const wedge = (ox: number, oy: number) =>
    `M${cx + ox} ${cy + oy} L${cx + ox + Math.cos(a0) * r} ${cy + oy + Math.sin(a0) * r} A${r} ${r} 0 0 1 ${cx + ox + Math.cos(a1) * r} ${cy + oy + Math.sin(a1) * r} Z`;
  const rest = `M${cx} ${cy} L${cx + Math.cos(a1) * r} ${cy + Math.sin(a1) * r} A${r} ${r} 0 ${n > 2 ? 1 : 0} 1 ${cx + Math.cos(a0) * r} ${cy + Math.sin(a0) * r} Z`;
  const ox = Math.cos(mid) * 70 * out;
  const oy = Math.sin(mid) * 70 * out;
  return (
    <g transform={`translate(0 ${lerp(-700, 0, arrive).toFixed(1)})`}>
      <circle className="k" cx={cx + 12} cy={cy + 16} r={r} fill="url(#dotsBlue)" opacity={0.6} />
      <path className="k" d={rest} fill={INK.blue} />
      <Pk>
        <path className="k" d={wedge(ox, oy)} fill={out > 0 ? INK.pink : INK.blue} />
      </Pk>
      {Array.from({length: n}, (_, i) => {
        const a = a0 + (i / n) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + Math.cos(a) * r * cut}
            y2={cy + Math.sin(a) * r * cut}
            stroke={INK.tape}
            strokeWidth={n > 5 ? 7 : 10}
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
};

/** pink rough loop around something */
const Ring: React.FC<{t: number; t0: number; cx: number; cy: number; rx: number; ry: number; dur?: number; w?: number}> = ({t, t0, cx, cy, rx, ry, dur = 0.45, w = 12}) => {
  if (t < t0) return null;
  const k = easeOut(clampT(t, t0, t0 + dur));
  const pts: string[] = [];
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const a = -2.2 + (i / N) * Math.PI * 2.15;
    const rr = 1 + 0.06 * Math.sin(i * 1.7) + 0.05 * (i / N);
    pts.push(`${(cx + Math.cos(a) * rx * rr).toFixed(1)},${(cy + Math.sin(a) * ry * rr).toFixed(1)}`);
  }
  const L = Math.PI * (rx + ry) * 1.15;
  return (
    <Pk>
      <polyline className="k" points={pts.join(' ')} fill="none" stroke={INK.pink} strokeWidth={w} strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - k)} />
    </Pk>
  );
};

/** split-flap characters: each change flips over 3 frames */
const Flap: React.FC<{x: number; y: number; w: number; h: number; ch: string; changedAt: number; t: number; color?: string}> = ({x, y, w, h, ch, changedAt, t, color = INK.tape}) => {
  const d = t - changedAt;
  const flip = d >= 0 && d < 0.1 ? 1 - d / 0.1 : 0;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill={INK.deep} className="k" />
      <text x={x + w / 2} y={y + h * 0.74} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={h * 0.78} fill={color} style={{mixBlendMode: color === INK.tape ? 'normal' : 'multiply'}}>
        {ch}
      </text>
      <rect x={x} y={y + h / 2 - 2} width={w} height={4} fill={INK.paper} opacity={0.5} />
      {flip > 0 && <rect x={x} y={y + h / 2 - (h / 2) * flip} width={w} height={(h / 2) * flip} fill={INK.deep} />}
    </g>
  );
};

/* ------------------------------------------------------------------ Vancouver: board, clock, jar, calendar, chart */
const BOARD = {x: 15800, y: 300, cell: 96, h: 170};
const T_K = WT('one', 9);
const T_RECALC = WT('recalculated');
const T_PAST = WT('everything', 1);
const T_CHOP = WT('chopped', 1, 's', 0.12);
const boardAt = (t: number): {s: string; at: number[]} => {
  // returns 8 chars for the board and when each one last changed
  const blank = '        ';
  if (t < T_K) return {s: blank, at: Array(8).fill(-9)};
  const base = '1000.000';
  if (t < T_RECALC || t >= T_PAST) {
    const at = base.split('').map((_, i) => T_K + i * 0.045);
    if (t >= T_PAST) return {s: base, at: at.map(() => T_PAST)};
    return {s: base.split('').map((c, i) => (t >= at[i] ? c : ' ')).join(''), at};
  }
  // recalculating: a new value every 0.14 s
  const step = Math.floor((t - T_RECALC) / 0.14);
  const v = 1000 + (hash(step) - 0.5) * 0.9 - step * 0.002;
  const s = v.toFixed(3).padStart(8, ' ');
  const t0 = T_RECALC + step * 0.14;
  return {s, at: s.split('').map(() => t0)};
};
const TAIL = '4721';

const Board: React.FC<{t: number}> = ({t}) => {
  const appear = easeOut(clampT(t, WT('index') - 0.5, WT('index')));
  if (t < WT('index') - 0.55 || t > 67.5) return null;
  const {s, at} = boardAt(t);
  const {x, y, cell, h} = BOARD;
  const tailOn = t >= T_PAST;
  const tailK = (i: number) => clampT(t, T_PAST + 0.12 * i, T_PAST + 0.12 * i + 0.1);
  return (
    <g transform={`translate(0 ${lerp(700, 0, appear).toFixed(1)})`}>
      <rect className="k" x={x - 36} y={y - 30} width={cell * 8 + 72} height={h + 60} rx={22} fill="url(#dotsBlue)" opacity={0.6} transform="translate(14 18)" />
      <rect className="k" x={x - 36} y={y - 30} width={cell * 8 + 72} height={h + 60} rx={22} fill={INK.blue} />
      {s.split('').map((ch, i) => (
        <Flap key={i} x={x + i * cell + 4} y={y} w={cell - 8} h={h} ch={ch} changedAt={at[i]} t={t} />
      ))}
      {/* digits past the third decimal, in pink, until they are snipped off */}
      {tailOn &&
        TAIL.split('').map((ch, i) => {
          const k = tailK(i);
          if (k <= 0) return null;
          const fly = t - T_CHOP;
          const fx = fly > 0 ? fly * (380 + i * 60) : 0;
          const fy = fly > 0 ? -260 * fly + 0.5 * 2600 * fly * fly : 0;
          if (fly > 1.3) return null;
          const cx = x + (8 + i) * cell + 40 + 4 + fx;
          return (
            <Pk key={i}>
              <g transform={`translate(${cx.toFixed(1)} ${(y + h / 2 + fy).toFixed(1)}) rotate(${(fly > 0 ? fly * 260 * (i % 2 ? 1 : -1) : 0).toFixed(1)}) scale(${lerp(1.3, 1, easeOut(k))})`}>
                <rect className="k" x={-44} y={-h / 2} width={88} height={h} rx={8} fill={INK.pink} />
                <text x={0} y={h * 0.24} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={h * 0.78} fill={INK.tape}>
                  {ch}
                </text>
              </g>
            </Pk>
          );
        })}
    </g>
  );
};

const Clock: React.FC<{t: number}> = ({t}) => {
  const t0 = WT('three', 6, 's', -0.3);
  if (t < t0 - 0.5 || t > 60) return null;
  const appear = easeOut(clampT(t, t0 - 0.5, t0));
  const spin = Math.max(0, t - t0);
  const cx = 15430;
  const cy = 390;
  const hand = (len: number, turns: number, w: number, c: string) => {
    const a = spin * turns * Math.PI * 2 - Math.PI / 2;
    return <line className="k" x1={cx} y1={cy} x2={cx + Math.cos(a) * len} y2={cy + Math.sin(a) * len} stroke={c} strokeWidth={w} strokeLinecap="round" />;
  };
  return (
    <g transform={`translate(0 ${lerp(-900, 0, appear).toFixed(1)})`}>
      <circle className="k" cx={cx + 12} cy={cy + 16} r={170} fill="url(#dotsBlue)" opacity={0.6} />
      <circle cx={cx} cy={cy} r={170} fill={INK.tape} />
      <circle className="k" cx={cx} cy={cy} r={170} fill="none" stroke={INK.blue} strokeWidth={16} />
      {Array.from({length: 12}, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <line key={i} className="k" x1={cx + Math.cos(a) * 128} y1={cy + Math.sin(a) * 128} x2={cx + Math.cos(a) * 150} y2={cy + Math.sin(a) * 150} stroke={INK.blue} strokeWidth={9} />;
      })}
      {hand(80, 2, 18, INK.blue)}
      <Pk>{hand(120, 24, 9, INK.pink)}</Pk>
      <circle cx={cx} cy={cy} r={12} fill={INK.blue} className="k" />
    </g>
  );
};

// crumbs: every chop sends a sliver of number into the jar
const JAR = {x: 17260, y: 560, w: 300, h: 380};
const CRUMB_T: number[] = (() => {
  const out: number[] = [];
  const a = WT('each');
  const b = WT('adds', 1, 'e');
  // slow at first (one per chop), then a stream
  let t = a;
  let gap = 0.45;
  while (t < b) {
    out.push(t);
    t += gap;
    gap = Math.max(0.035, gap * (t > WT('three', 7) ? 0.8 : 0.93));
  }
  return out;
})();
const jarFill = (t: number) => {
  let n = 0;
  for (const c of CRUMB_T) if (t > c + 0.55) n++;
  return Math.min(0.86, n * 0.011);
};
const Jar: React.FC<{t: number}> = ({t}) => {
  const tIn = WT('chopped') - 0.2;
  if (t < tIn - 0.4 || t > 67.5) return null;
  const appear = easeOut(clampT(t, tIn - 0.4, tIn));
  const {x, y, w, h} = JAR;
  const fill = jarFill(t);
  const bob = 0;
  return (
    <g transform={`translate(0 ${(lerp(900, 0, appear) + bob).toFixed(1)})`}>
      {/* crumbs in flight: from the board's right edge into the jar mouth */}
      {CRUMB_T.map((c, i) => {
        const d = t - c;
        if (d < 0 || d > 0.6) return null;
        const k = d / 0.6;
        const x0 = BOARD.x + BOARD.cell * 8 + 40;
        const y0 = BOARD.y + 40;
        const px = lerp(x0, x + w / 2 + (hash(i) - 0.5) * 120, k);
        const py = lerp(y0, y - h / 2 + 30, k) - Math.sin(k * Math.PI) * 220;
        return (
          <Pk key={i}>
            <rect className="k" x={px - 9} y={py - 12} width={18} height={24} rx={3} fill={INK.pink} transform={`rotate(${(k * 400 + i * 37).toFixed(0)} ${px.toFixed(1)} ${py.toFixed(1)})`} />
          </Pk>
        );
      })}
      <rect className="k" x={x - w / 2 + 14} y={y - h / 2 + 18} width={w} height={h} rx={40} fill="url(#dotsBlue)" opacity={0.5} />
      {/* the heap */}
      <Pk>
        <rect className="k" x={x - w / 2 + 12} y={y + h / 2 - 12 - (h - 60) * fill} width={w - 24} height={(h - 60) * fill} rx={20} fill="url(#dotsPink)" />
        <rect className="k" x={x - w / 2 + 12} y={y + h / 2 - 12 - (h - 60) * fill} width={w - 24} height={Math.min(18, (h - 60) * fill)} rx={6} fill={INK.pink} />
      </Pk>
      <rect className="k" x={x - w / 2} y={y - h / 2} width={w} height={h} rx={40} fill="none" stroke={INK.blue} strokeWidth={12} />
      <rect className="k" x={x - w / 2 + 36} y={y - h / 2 + 50} width={16} height={h - 140} rx={8} fill={INK.blue} opacity={0.35} />
      <rect className="k" x={x - w / 2 - 14} y={y - h / 2 - 40} width={w + 28} height={44} rx={12} fill={INK.blue} />
    </g>
  );
};

const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const CalPage: React.FC<{m: number; x: number; y: number}> = ({m, x, y}) => (
  <g>
    <rect x={x - 200} y={y - 240} width={400} height={480} rx={10} fill={INK.tape} />
    <Pk>
      <rect className="k" x={x - 200} y={y - 240} width={400} height={120} rx={10} fill={INK.pink} />
    </Pk>
    <text x={x} y={y - 158} textAnchor="middle" fontFamily={COND} fontWeight={700} fontSize={70} fill={INK.tape}>
      {MONTHS[m % 12]}
    </text>
    <text className="k" x={x} y={y + 90} textAnchor="middle" fontFamily={COND} fontWeight={700} fontSize={190} fill={INK.blue}>
      {1982 + Math.floor(m / 12)}
    </text>
    {Array.from({length: 14}, (_, i) => (
      <rect key={i} className="k" x={x - 160 + (i % 7) * 46} y={y + 140 + Math.floor(i / 7) * 36} width={30} height={20} rx={3} fill={INK.blue} opacity={0.35} />
    ))}
  </g>
);
const Calendar1: React.FC<{t: number}> = ({t}) => {
  const t0 = WT('january');
  if (t < t0 - 0.3 || t > 53) return null;
  const k = easeOut(clampT(t, t0 - 0.3, t0 + 0.1));
  const x = 15000;
  const y = -470;
  return (
    <g transform={`translate(0 ${lerp(-1200, 0, k).toFixed(1)}) rotate(-5 ${x} ${y})`}>
      <rect className="k" x={x - 186} y={y - 222} width={400} height={480} rx={10} fill="url(#dotsBlue)" opacity={0.6} />
      <CalPage m={0} x={x} y={y} />
    </g>
  );
};
/** 22 months fly off a calendar pad */
const Calendar2: React.FC<{t: number}> = ({t}) => {
  const a = WT('twentytwo') - 0.1;
  const b = WT('later', 1, 'e');
  if (t < a - 0.4 || t > 68) return null;
  const k = easeOut(clampT(t, a - 0.4, a));
  const x = 17700;
  const y = -440;
  const flips = Math.floor(clampT(t, a, b) * 22);
  const ph = (clampT(t, a, b) * 22) % 1;
  return (
    <g transform={`translate(0 ${lerp(-1200, 0, k).toFixed(1)}) rotate(4 ${x} ${y})`}>
      <rect className="k" x={x - 186} y={y - 222} width={400} height={480} rx={10} fill="url(#dotsBlue)" opacity={0.6} />
      <CalPage m={Math.min(22, flips + 1)} x={x} y={y} />
      {flips < 22 && t >= a && (
        <g transform={`translate(${x} ${y - 240}) scale(1 ${(1 - ph).toFixed(3)}) translate(${-x} ${-(y - 240)})`}>
          <CalPage m={flips} x={x} y={y} />
        </g>
      )}
    </g>
  );
};

// chart: the true index (blue) drifting up to 1098.892, and the reported one (pink) = true minus the chop losses
const CH = {x: 17900, y: 160, w: 1100, h: 520};
const vToY = (v: number) => CH.y + CH.h - ((v - 400) / (1200 - 400)) * CH.h;
const mToX = (m: number) => CH.x + 60 + (m / 22) * (CH.w - 120);
const trueV = (m: number) => 1000 + (98.892 * m) / 22 + Math.sin(m * 1.3) * 14 * Math.sin((m / 22) * Math.PI);
const repV = (m: number) => trueV(m) - (574.081 * m) / 22;
const T_PINK0 = WT('index', 2) - 0.1;
const T_PINK1 = WT('twentyfour', 1, 'e', -0.1);
const T_BLUE0 = WT('market');
const T_BLUE1 = WT('crashed', 1, 'e');
const T_JUMP = WT('jumped');
const linePts = (f: (m: number) => number, upto: number) => {
  const pts: string[] = [];
  const N = Math.max(1, Math.round(upto * 44));
  for (let i = 0; i <= N; i++) {
    const m = (i / N) * upto;
    pts.push(`${mToX(m).toFixed(1)},${vToY(f(m)).toFixed(1)}`);
  }
  return pts.join(' ');
};
const Chart: React.FC<{t: number}> = ({t}) => {
  const tIn = WT('later') - 0.2;
  if (t < tIn - 0.5 || t > 76.5) return null;
  const appear = easeOut(clampT(t, tIn - 0.5, tIn));
  const pinkK = easeInOut(clampT(t, T_PINK0, T_PINK1));
  const blueK = easeInOut(clampT(t, T_BLUE0, T_BLUE1));
  // the one spring in the film: the corrected value jumps up
  const jd = Math.max(0, t - T_JUMP);
  const jump = jd <= 0 ? 0 : 1 - Math.exp(-jd * 7) * Math.cos(jd * 16);
  const endV = lerp(524.811, 1098.892, jump);
  const label = jd > 0.2 ? '1098.892' : '524.811';
  const {x, y, w, h} = CH;
  const fixK = easeOut(clampT(t, WT('fixed'), WT('math', 1, 'e')));
  return (
    <g transform={`translate(0 ${lerp(900, 0, appear).toFixed(1)})`}>
      <rect className="k" x={x + 14} y={y + 18} width={w} height={h} rx={14} fill="url(#dotsBlue)" opacity={0.5} />
      <rect x={x} y={y} width={w} height={h} rx={14} fill={INK.tape} />
      {[600, 800, 1000].map((v) => (
        <g key={v}>
          <line className="k" x1={x + 40} x2={x + w - 40} y1={vToY(v)} y2={vToY(v)} stroke={INK.blue} strokeWidth={3} strokeDasharray="6 12" opacity={0.6} />
          <text className="k" x={x + 50} y={vToY(v) - 12} fontFamily={MONO} fontWeight={700} fontSize={34} fill={INK.blue} opacity={0.75}>
            {v}
          </text>
        </g>
      ))}
      {blueK > 0 && <polyline className="k" points={linePts(trueV, 22 * blueK)} fill="none" stroke={INK.blue} strokeWidth={12} strokeLinejoin="round" strokeLinecap="round" />}
      {pinkK > 0 && (
        <Pk>
          <polyline className="k" points={linePts(repV, 22 * pinkK)} fill="none" stroke={INK.pink} strokeWidth={14} strokeLinejoin="round" strokeLinecap="round" />
          {jd > 0 && <line className="k" x1={mToX(22)} y1={vToY(524.811)} x2={mToX(22)} y2={vToY(endV)} stroke={INK.pink} strokeWidth={14} strokeLinecap="round" />}
          {pinkK >= 1 && <circle className="k" cx={mToX(22)} cy={vToY(endV)} r={20} fill={INK.pink} />}
        </Pk>
      )}
      {fixK > 0 && jd <= 0 && (
        <Pk>
          <path
            className="k"
            d={`M${mToX(22) + 70} ${vToY(560)} L${mToX(22) + 70} ${vToY(1000)} M${mToX(22) + 40} ${vToY(950)} L${mToX(22) + 70} ${vToY(1000)} L${mToX(22) + 100} ${vToY(950)}`}
            fill="none"
            stroke={INK.pink}
            strokeWidth={12}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={700}
            strokeDashoffset={700 * (1 - fixK)}
          />
        </Pk>
      )}
      {t >= WT('twentyfour') && (
        <g transform={`translate(${mToX(22) - 470} ${vToY(endV) + (jd > 0.2 ? 60 : -150)})`}>
          {label.split('').map((ch, i) => (
            <Flap key={i} x={i * 56} y={0} w={52} h={86} ch={ch} changedAt={jd > 0.2 ? T_JUMP + 0.2 + i * 0.03 : WT('twentyfour') + i * 0.03} t={t} />
          ))}
        </g>
      )}
    </g>
  );
};

/** price tag $1.10 -> 110¢ and the coins that count it */
const Tag: React.FC<{t: number}> = ({t}) => {
  const tIn = WT('careful') - 0.3;
  if (t < tIn - 0.4 || t > 81.2) return null;
  const appear = easeOut(clampT(t, tIn - 0.4, tIn));
  const tDot = WT('decimals', 1, 's', 0.1);
  const tC = WT('counts');
  const dotK = clampT(t, tDot, tDot + 0.7);
  const close = easeOut(clampT(t, tC - 0.1, tC + 0.25));
  const x = 19700;
  const y = -430;
  return (
    <g transform={`translate(0 ${lerp(-1100, 0, appear).toFixed(1)}) rotate(-6 ${x} ${y})`}>
      <line className="k" x1={x - 330} y1={y - 40} x2={x - 520} y2={y - 260} stroke={INK.blue} strokeWidth={6} />
      <Pk>
        <path className="k" d={`M${x - 380} ${y} L${x - 290} ${y - 140} H${x + 330} V${y + 140} H${x - 290} Z`} fill={INK.pink} />
      </Pk>
      <circle cx={x - 300} cy={y} r={24} fill={INK.paper} />
      {(() => {
        // $1.10 -> 110¢: the point is plucked out, the $ flips away, the digits close up, ¢ lands
        const dollar = easeIn(clampT(t, tC - 0.25, tC + 0.15));
        const cw = 102;
        const x0 = x - 250;
        const shift = easeOut(clampT(t, tC - 0.1, tC + 0.25));
        const pos = (i: number) => x0 + (i - (i >= 3 ? close : 0) - shift) * cw;
        return (
          <g fontFamily={MONO} fontWeight={700} fontSize={170} fill={INK.tape} textAnchor="middle">
            {dollar < 1 && (
              <text x={x0 + cw / 2} y={y + 58 - dollar * 300} opacity={1 - dollar}>
                $
              </text>
            )}
            <text x={pos(1) + cw / 2} y={y + 58}>1</text>
            {dotK < 1 && <circle cx={x0 + 2.5 * cw + dotK * 160} cy={y + 50 - dotK * 420 + dotK * dotK * 900} r={16} fill={INK.tape} />}
            <text x={pos(3) + cw / 2} y={y + 58}>1</text>
            <text x={pos(4) + cw / 2} y={y + 58}>0</text>
            {t >= tC && (
              <g transform={`translate(${x0 + 3 * cw + cw / 2} ${y + 58}) scale(${lerp(2.6, 1, easeOut(clampT(t, tC, tC + 0.15)))})`}>
                <text x={0} y={0}>¢</text>
              </g>
            )}
          </g>
        );
      })()}
      {/* the $ leaves when the price becomes whole cents */}
    </g>
  );
};
const COIN_T = spread(11, WT('whole'), WT('cents', 1, 'e', 0.05), 0.85);
const Coins: React.FC<{t: number}> = ({t}) => {
  if (t < COIN_T[0] - 0.4 || t > 81.2) return null;
  const x = 20300;
  const base = -98;
  return (
    <g>
      {COIN_T.map((c, i) => {
        const d = t - c;
        if (d < -0.35) return null;
        const k = easeIn(clampT(t, c - 0.35, c));
        const yy = lerp(-1200, base - i * 26, k);
        const xx = x + (i % 2 ? 6 : -6);
        return (
          <g key={i}>
            <ellipse className="k" cx={xx} cy={yy + 14} rx={92} ry={30} fill={INK.blue} />
            <Pk>
              <ellipse className="k" cx={xx} cy={yy} rx={92} ry={30} fill={INK.pink} />
            </Pk>
            <ellipse cx={xx} cy={yy} rx={62} ry={18} fill="none" stroke={INK.tape} strokeWidth={5} opacity={0.8} />
          </g>
        );
      })}
    </g>
  );
};

/* ------------------------------------------------------------------ number line + the hair */
const NumberLine: React.FC<{t: number; z: number}> = ({t, z}) => {
  const sw = 12 / Math.max(1, z * 0.55);
  if (t < 35.4 || t > 43) return null;
  const a1 = easeInOut(clampT(t, WT('rounded'), WT('tenth', 2, 'e')));
  const a2 = easeInOut(clampT(t, WT('plus'), WT('lands', 1, 's', 0.05)));
  const LAND = 12714;
  const arc = (x0: number, x1: number, k: number, hgt: number) => {
    const pts: string[] = [];
    const N = 40;
    for (let i = 0; i <= Math.round(N * k); i++) {
      const u = i / N;
      pts.push(`${lerp(x0, x1, u).toFixed(1)},${(-95 - Math.sin(u * Math.PI) * hgt).toFixed(1)}`);
    }
    return pts.join(' ');
  };
  const hairT = WT('hair');
  const blow = easeIn(clampT(t, WT('hair', 2), WT('harmless', 1, 'e')));
  return (
    <g>
      {TICK_X.map((x, i) =>
        t >= TICK_T[i] ? (
          <g key={i}>
            <line className="k" x1={x} y1={-85} x2={x} y2={25} stroke={INK.blue} strokeWidth={8} vectorEffect="non-scaling-stroke" />
            <text className="k" x={x} y={74} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={64} fill={INK.blue}>
              {['0', '0.1', '0.2', '0.3'][i]}
            </text>
          </g>
        ) : null,
      )}
      {/* fine ticks you only see up close */}
      {t > 38 &&
        Array.from({length: 21}, (_, i) => (
          <rect key={i} className="k" x={12700 - 50 + i * 5 - 0.3} y={-85} width={0.6} height={i % 10 === 0 ? 22 : 10} fill={INK.blue} />
        ))}
      <Pk>
        {a1 > 0 && <polyline className="k" points={arc(10600, 11300, a1, 300)} fill="none" stroke={INK.pink} strokeWidth={sw} strokeLinecap="round" />}
        {a2 > 0 && <polyline className="k" points={arc(11300, LAND, a2, 520)} fill="none" stroke={INK.pink} strokeWidth={sw} strokeLinecap="round" />}
        {a2 >= 1 && <circle className="k" cx={LAND} cy={-95} r={3.2} fill={INK.pink} />}
      </Pk>
      {/* the hair between 0.3 and where the sum landed, and the true sum written tiny */}
      {t > hairT - 0.2 && blow < 1 && (
        <g transform={`translate(${blow * 60} ${-blow * 90}) rotate(${blow * 160} 12707 -100)`}>
          <path
            className="k"
            d="M12700.5 -100 C12702 -104 12703 -96 12705 -101 C12707 -106 12708 -95 12710 -100 C12711.5 -103 12712.5 -98 12713.5 -100"
            fill="none"
            stroke={INK.deep}
            strokeWidth={0.7}
            strokeLinecap="round"
            strokeDasharray={20}
            strokeDashoffset={20 * (1 - easeOut(clampT(t, hairT - 0.2, hairT + 0.4)))}
          />
        </g>
      )}
      {t > WT('above') && (
        <text className="k" x={12707} y={-118} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={5.2} fill={INK.blue} opacity={easeOut(clampT(t, WT('above'), WT('above', 1, 's', 0.3)))}>
          0.30000000000000004
        </text>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ captions */
type Cap = {s: number; e: number; words: {w: string; s: number}[]};
const CAPS: Cap[] = (() => {
  const out: Cap[] = [];
  let cur: Cap | null = null;
  WORDS.forEach((w, i) => {
    if (!cur) cur = {s: w.s, e: w.e, words: []};
    cur.words.push({w: w.w.replace(/\.\.\./g, '…'), s: w.s});
    cur.e = w.e;
    const end = /[.,:?!…]$/.test(w.w) || cur.words.length >= 6;
    const next = WORDS[i + 1];
    if (end || !next) {
      out.push(cur);
      cur = null;
    }
  });
  return out;
})();
const Captions: React.FC<{t: number}> = ({t}) => {
  let c: Cap | null = null;
  for (let i = 0; i < CAPS.length; i++) {
    const nx = CAPS[i + 1];
    if (t >= CAPS[i].s - 0.05 && t < (nx ? nx.s - 0.05 : CAPS[i].e + 0.5)) c = CAPS[i];
  }
  if (!c) return null;
  const txt = c.words.map((w) => w.w).join(' ');
  const wpx = txt.length * 25 + 60;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <g transform={`translate(${W / 2} ${H - 74})`}>
        <rect x={-wpx / 2} y={-40} width={wpx} height={66} rx={6} fill={INK.tape} opacity={0.94} />
        <text x={0} y={8} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={41}>
          {c.words.map((w, i) => (
            <tspan key={i} fill={t >= w.s ? (i === c!.words.length - 1 || t < (c!.words[i + 1]?.s ?? 1e9) ? INK.pink : INK.blue) : INK.blue} opacity={t >= w.s ? 1 : 0.35}>
              {(i ? ' ' : '') + w.w}
            </tspan>
          ))}
        </text>
      </g>
    </svg>
  );
};

/* ------------------------------------------------------------------ the film */
const TAIL1_T = WT('chop', 1, 's', 0.06);
const TEAR_T = 85.46;

export const FloatVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const t = (frame + SUB) / FPS; // smooth motion
  const tp = (twos(frame) * 2) / FPS; // printed-frame clock (on twos)
  const cam = camAt(t);
  const pr = twos(frame);
  const reg: [number, number] = [((hash(pr) - 0.5) * 6 + 2.5) / cam.z, ((hash(pr + 99) - 0.5) * 5 - 1.5) / cam.z];
  const vx0 = cam.x - W / 2 / cam.z - 400;
  const vx1 = cam.x + W / 2 / cam.z + 400;
  const vis = (x: number) => x > vx0 - 200 && x < vx1 + 200;

  // tape pieces
  const tail1 = t - TAIL1_T; // the forever-3s tail falls away after the snip
  const tear = t - TEAR_T; // the first printout tears off at C
  const feed = clampT(t, TEAR_T + 0.2, TEAR_T + 1.0);

  const glyphs = EVS.filter((e) => e.ch && vis(e.x) && t >= e.t);
  const inTail1 = (e: Ev) => e.id.startsWith('third') && e.x > CUT1_X;
  const inFirst = (e: Ev) => e.id.startsWith('res') || e.id.startsWith('z') || e.id.startsWith('four');
  const isGhost = (e: Ev) => e.id.startsWith('ghost');
  const isChop = (e: Ev) => e.id.startsWith('chop');

  const tailTf = (x0: number) => {
    if (tail1 <= 0) return '';
    const dy = 0.5 * 2600 * tail1 * tail1;
    return `translate(${(tail1 * 160).toFixed(1)} ${dy.toFixed(1)}) rotate(${(tail1 * 38).toFixed(2)} ${x0} 0)`;
  };
  const tearTf = () => {
    if (tear <= 0) return '';
    const k = easeIn(clampT(t, TEAR_T, TEAR_T + 0.9));
    return `translate(${(k * 900).toFixed(1)} ${(-k * 1500).toFixed(1)}) rotate(${(-k * 24).toFixed(2)} -380 0)`;
  };

  // binary rounding: the last two kept digits roll 0 1 -> 1 0
  const tRound = WT('round');
  const roll = easeInOut(clampT(t, tRound, tRound + 0.35));
  const ghostDrop = clampT(t, tRound - 0.35, tRound + 0.5);

  return (
    <AbsoluteFill style={{background: INK.paper}}>
      <Fonts />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <pattern id="dotsBlue" width={12} height={12} patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
            <circle cx={6} cy={6} r={3.1} fill={INK.blue} />
          </pattern>
          <pattern id="dotsPink" width={12} height={12} patternUnits="userSpaceOnUse" patternTransform="rotate(-15)">
            <rect width={12} height={12} fill={INK.pink} opacity={0.35} />
            <circle cx={6} cy={6} r={4} fill={INK.pink} />
          </pattern>
          <pattern id="mat" width={120} height={120} patternUnits="userSpaceOnUse">
            <path d="M120 0H0V120" fill="none" stroke={INK.blue} strokeWidth={2} opacity={0.22} />
            <path d="M60 0V120M0 60H120" fill="none" stroke={INK.blue} strokeWidth={1} opacity={0.1} />
          </pattern>
          {/* printed edge: plates never land perfectly, edges wobble a little on every printed frame */}
          <filter id="print" x="-2%" y="-2%" width="104%" height="104%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={pr % 97} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={3.2} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          {/* ink skips and paper tooth */}
          <filter id="tooth" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={1} seed={(pr * 7) % 113} result="n" />
            <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.98  0 0 0 0 0.94  0 0 0 -2.6 1.55" />
          </filter>
          <filter id="mottle" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves={3} seed={(pr * 3) % 41} />
            <feColorMatrix type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.45  0 0 0 0 0.35  0 0 0 0.9 -0.35" />
          </filter>
        </defs>
        <g filter="url(#print)">
          <rect width={W} height={H} fill={INK.paper} />
          <RegCtx.Provider value={reg}>
            <g transform={`translate(${W / 2} ${H / 2}) scale(${cam.z.toFixed(5)}) translate(${(-cam.x).toFixed(2)} ${(-cam.y).toFixed(2)})`}>
              {/* the cutting mat the whole film is printed on */}
              <rect className="k" x={-4000} y={-3000} width={29000} height={6000} fill="url(#mat)" />

              {/* the claim, already on the desk in frame 0, and back again for the loop */}
              {(t < WT('ask', 1, 's', 0.35) || t > 85.55) && (
                <g transform={`translate(0 ${(-(t < 10 ? easeIn(clampT(t, WT('ask', 1, 's', -0.1), WT('ask', 1, 's', 0.3))) : 0) * 900 - (t > 85.55 ? (1 - easeOut(clampT(t, 85.55, 86.3))) * 900 : 0)).toFixed(1)})`}>
                  <text className="k" x={-75} y={-262} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={90} fill={INK.blue}>
                    0.1 + 0.2
                  </text>
                  <text className="k" x={-75} y={-150} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={90} fill={INK.blue}>
                    = 0.3
                  </text>
                </g>
              )}
              <Stamp t={t} t0={WT('cant')} x={-60} y={-190} rot={9} text="CAN'T" t1={WT('ask', 1, 's', -0.1)} />

              {/* tape: first printout (tears off at the end) */}
              {(tear <= 0 || tear < 1.2) && (
                <g transform={tearTf()}>
                  <TapeShadow x0={-470} x1={2400} lift={tear > 0 ? 30 : 0} />
                  <TapeStrip x0={-470} x1={2400} />
                  {glyphs.filter(inFirst).map((e) => (
                    <Glyph key={e.id} e={e} t={t} />
                  ))}
                  {t >= WT('four', 1, 's', 0.25) && <Ring t={t} t0={WT('four', 1, 's', 0.25)} cx={18 * CW} cy={-4} rx={90} ry={96} />}
                  {t >= 83.5 && <Ring t={t} t0={83.5} cx={18 * CW} cy={-4} rx={104} ry={110} w={8} />}
                </g>
              )}
              {/* fresh paper feeding out after the tear (back to how the film began) */}
              {tear > 0 && (
                <g>
                  <TapeShadow x0={-470} x1={lerp(-470, 2400, easeOut(feed))} />
                  <TapeStrip x0={-470} x1={lerp(-470, 2400, easeOut(feed))} />
                </g>
              )}
              {/* tape from 2400 to the cut */}
              {vis(4000) || vis(2400) || vis(CUT1_X) ? (
                <g>
                  <TapeShadow x0={2400} x1={CUT1_X} />
                  <TapeStrip x0={2400} x1={CUT1_X} />
                </g>
              ) : null}
              {/* the forever tail */}
              {(tail1 < 1.4 || tail1 <= 0) && (vis(CUT1_X) || vis(6900)) && (
                <g transform={tailTf(CUT1_X)}>
                  <TapeShadow x0={CUT1_X} x1={6900} lift={tail1 > 0 ? 40 : 0} />
                  <TapeStrip x0={CUT1_X} x1={6900} />
                  {glyphs.filter(inTail1).map((e) => (
                    <Glyph key={e.id} e={e} t={t} />
                  ))}
                </g>
              )}
              {/* the rest of the tape, all the way to the coins */}
              <TapeShadow x0={Math.max(6900, vx0)} x1={Math.min(21200, vx1)} />
              <TapeStrip x0={Math.max(6900, vx0)} x1={Math.min(21200, vx1)} />

              {/* printed digits on the fixed tape */}
              {glyphs
                .filter((e) => !inFirst(e) && !inTail1(e) && !isGhost(e) && !isChop(e))
                .map((e) => {
                  // the two rounding digits roll over
                  if (e.id === 'bin24' || e.id === 'bin25') {
                    if (roll <= 0) return <Glyph key={e.id} e={e} t={t} />;
                    const to = e.id === 'bin24' ? '1' : '0';
                    return (
                      <g key={e.id}>
                        <clipPath id={`clip${e.id}`}>
                          <rect x={e.x - 48} y={-80} width={96} height={160} />
                        </clipPath>
                        <g clipPath={`url(#clip${e.id})`}>
                          <Glyph e={e} t={t} dy={-roll * 160} />
                          <Glyph e={{...e, ch: to, c: INK.pink, t: -1}} t={t} dy={(1 - roll) * 160} />
                        </g>
                      </g>
                    );
                  }
                  return <Glyph key={e.id} e={e} t={t} />;
                })}
              {/* ghost tail of 1/10 that would go on forever: falls off the cut */}
              {glyphs.filter(isGhost).map((e, i) => (ghostDrop < 1 ? <Glyph key={e.id} e={e} t={t} dy={ghostDrop * ghostDrop * 900} rot={ghostDrop * (20 + i * 15)} op={1 - ghostDrop} /> : null))}
              {t >= WT('stop') && vis(STOP_X) && (
                <Pk>
                  <rect className="k" x={STOP_X - 6} y={-110} width={12} height={220} fill={INK.pink} transform={`scale(1 ${easeOut(clampT(t, WT('stop'), WT('stop', 1, 's', 0.12)))})`} style={{transformOrigin: `${STOP_X}px 0px`}} />
                </Pk>
              )}
              {/* brackets under every 0011 */}
              {[0, 1, 2, 3, 4, 5].map((g) => {
                const i0 = 3 + g * 4;
                const last = EVS.find((e) => e.id === `bin${Math.min(25, i0 + 3)}`);
                if (!last || t < last.t || !vis(7000 + i0 * CW)) return null;
                const x0 = 7000 + i0 * CW - 30;
                const x1 = 7000 + Math.min(25, i0 + 3) * CW + 30;
                const k = easeOut(clampT(t, last.t, last.t + 0.25));
                return (
                  <Pk key={g}>
                    <path className="k" d={`M${x0} 62 Q${(x0 + x1) / 2} ${62 + 60 * k} ${lerp(x0, x1, k)} 62`} fill="none" stroke={INK.pink} strokeWidth={9} strokeLinecap="round" />
                  </Pk>
                );
              })}

              {/* chopped digits on 1000.000 */}
              {CHOP.map((c, i) => {
                const e = EVS.find((x) => x.id === `chop${i}`)!;
                if (t < e.t || !vis(CHOP_X)) return null;
                const d = t - c.cut;
                if (d > 1.2) return null;
                const fall = d > 0 ? d : 0;
                return (
                  <g key={i} transform={`translate(${(fall * 260).toFixed(1)} ${(0.5 * 2600 * fall * fall).toFixed(1)}) rotate(${(fall * 300).toFixed(1)} ${CHOP_X} 0)`}>
                    {d > 0 && <rect x={CHOP_X - 46} y={-85} width={92} height={170} fill={INK.tape} />}
                    <Glyph e={e} t={t} />
                  </g>
                );
              })}
              {CHOP.map((c, i) => (
                <Snip key={i} t={t} x={CHOP_X - 50} tCut={c.cut} inDur={i === 0 ? 0.5 : 0.3} hold={i === 2 ? 0.35 : 0.12} />
              ))}

              <Calculator t={t} />
              <Beetle t={t} f={frame} />
              <Switches t={t} />
              <Pie t={t} cx={4650} cy={-470} r={230} n={3} tIn={WT('tens', 1, 's', -0.4)} tCut={WT('third')} tOut={WT('ends')} />
              <Snip t={t} x={CUT1_X} tCut={TAIL1_T - 0.04} inDur={0.55} />
              <Pie t={t} cx={7350} cy={-480} r={220} n={10} tIn={WT('in', 4, 's', -0.2)} tCut={WT('one', 4)} tOut={WT('tenth')} />
              <NumberLine t={t} z={cam.z} />
              <Calendar1 t={t} />
              {/* Vancouver pops up behind the tape like a paper theatre */}
              {t > WT('vancouver') - 0.3 && t < 56 && (
                <g>
                  <g transform={`translate(15250 ${-85 - 420}) translate(0 420) scale(1 ${lerp(0.12, 1, easeOut(clampT(t, WT('vancouver') - 0.3, WT('vancouver') + 0.15))).toFixed(3)}) translate(0 -420)`}>
                    <path className="k" d={MOUNTAINS} fill={INK.blue} />
                  </g>
                  <g transform={`translate(15250 ${-85 - 420}) translate(0 420) scale(1 ${lerp(0.12, 1, easeOut(clampT(t, WT('stock') - 0.15, WT('exchange')))).toFixed(3)}) translate(0 -420)`}>
                    <Pk>
                      <path className="k" d={CITY} fill={INK.pink} />
                    </Pk>
                  </g>
                </g>
              )}
              <Clock t={t} />
              <Board t={t} />
              {t > T_PAST - 0.5 && t < T_CHOP + 1 && <Snip t={t} x={BOARD.x + BOARD.cell * 8 + 2} tCut={T_CHOP} inDur={0.5} hold={0.3} />}
              <Jar t={t} />
              <Calendar2 t={t} />
              <Chart t={t} />
              <Tag t={t} />
              <Coins t={t} />

              <Head t={t} />
            </g>
          </RegCtx.Provider>
        </g>
        {/* paper: slow mottling, then ink skips; a new sheet every printed frame */}
        <rect width={W} height={H} filter="url(#mottle)" style={{mixBlendMode: 'multiply'}} opacity={0.5} />
        <rect width={W} height={H} filter="url(#tooth)" style={{mixBlendMode: 'screen'}} opacity={0.55} />
      </svg>
      <Captions t={t} />
      {/* tp is the print clock; kept for stepped layers */}
      <div style={{display: 'none'}}>{tp}</div>
    </AbsoluteFill>
  );
};
