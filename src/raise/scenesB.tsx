import React from 'react';
import {AbsoluteFill} from 'remotion';
import {act} from './acting';
import {Coworker, Maya} from './characters';
import {Arrow, CircleMark, Shape, Strike, Stroke, linePts, rectPts} from './ink';
import {B, FPS, frF, H, P, W, clamp01, easeIn, easeOut, hash2, prog, sp} from './lib';
import {Bucket, Card, CliffBlock, Coin, Dust, LightShaft, PaperBoat} from './props';
import {Cam, Paper} from './stage';
import {Source, Tag, Txt, money} from './text';
import {SceneProps} from './scenesA';
import {Burst, ImpactLines, Odo, Pebbles, Splash} from '../mg/kit';

const fr = frF;

/** Coins falling into a bucket during [a,b]: one every `every` s, 0.55 s fall. */
const CoinStream: React.FC<{t: number; a: number; b: number; x: number; topY: number; surf: (time: number) => number; seed: number; every?: number; arc?: number}> = ({
  t,
  a,
  b,
  x,
  topY,
  surf,
  seed,
  every = 0.16,
  arc = 0,
}) => {
  const out: React.ReactNode[] = [];
  const fall = 0.55;
  for (let s = a, i = 0; s < b; s += every, i++) {
    const d = t - s;
    if (d < 0 || d > fall) continue;
    const k = d / fall;
    const jx = (hash2(seed, i) - 0.5) * 70;
    // the coin aims at where the water surface will be when it lands
    const endY = surf(s + fall) + 6;
    const yy = topY + (endY - topY) * k * k;
    out.push(<Coin key={i} x={x + jx + arc * k} y={yy} r={15} seed={seed + i} rot={k * 300} />);
  }
  // each coin lands in the water with a small splash
  for (let s = a, i = 0; s < b; s += every, i++) {
    const d = t - s - fall;
    if (d < 0 || d > 0.7) continue;
    const jx = (hash2(seed, i) - 0.5) * 70;
    out.push(<Splash key={'s' + i} t={t} t0={s + fall} x={x + jx + arc} y={surf(s + fall)} n={4} seed={seed + 50 + i} s={0.55} />);
  }
  return <g>{out}</g>;
};

/* ======================= BUCKETS ======================= */

const BX = [640, 1000, 1360];
const BTOP = 340;
const BH = 350;

export const Buckets: React.FC<SceneProps> = ({t}) => {
  const b = B.buckets;
  const f = fr(t);
  const l1 = prog(t, b.first, b.ten + 0.4, easeOut);
  const l2 = Math.min(prog(t, b.everything, b.full, (x) => x) * 0.97 + prog(t, b.full, b.brim + 0.2, easeOut) * 0.03, 1);
  const l3 = prog(t, b.spills + 0.3, b.twentyTwo + 0.8, easeOut) * 0.14;
  const maya = act(f, {
    seed: 13,
    reacts: [
      {t: b.ten, kind: 'nod'},
      {t: b.brim, kind: 'surprise'},
      {t: b.spills + 0.2, kind: 'worry'},
      {t: b.overflow + 0.3, kind: 'think'},
      {t: b.same, kind: 'relief'},
    ],
    look: [
      {t: b.first, x: 0.9, y: -0.4, hold: 3},
      {t: b.spills, x: 1, y: -0.6, hold: 3},
    ],
  });
  const cwIn = prog(t, b.coworker - 0.4, b.coworker + 0.4, easeOut) * (1 - prog(t, b.lower, b.lower + 0.6, easeIn));
  const cw = act(f, {seed: 24, reacts: [{t: b.scared - 0.1, kind: 'worry'}, {t: b.overflow + 0.2, kind: 'surprise'}], look: [{t: b.coworker, x: -1, y: 0.2, hold: 5}]});
  // water surface of a bucket at any time, same formula as Bucket: bottom − 14 − (h − 30)·level
  const surfAt = (lv: (tt: number) => number) => (tt: number) => BTOP + BH - 14 - (BH - 30) * clamp01(lv(tt));
  const L1 = (tt: number) => prog(tt, b.first, b.ten + 0.4, easeOut);
  const L2 = (tt: number) => Math.min(prog(tt, b.everything, b.full, (x) => x) * 0.97 + prog(tt, b.full, b.brim + 0.2, easeOut) * 0.03, 1);
  const L3 = (tt: number) => prog(tt, b.spills + 0.3, b.twentyTwo + 0.8, easeOut) * 0.14;
  const wob = Math.sin(t * 6) * 2.5 * prog(t, b.brim - 0.2, b.brim + 0.1) * (1 - prog(t, b.brim + 0.8, b.brim + 1.6));
  return (
    <AbsoluteFill>
      <Paper color={P.paper} id="buckets" />
      <Cam
        t0={b.start}
        t1={B.math.start}
        push={0}
        shakeAt={[b.full + 0.05]}
        keys={[
          {t: b.start, x: 960, y: 520, z: 1.04},
          {t: b.buckets + 0.4, x: 960, y: 480, z: 1.0},
          {t: b.first + 0.2, x: 700, y: 520, z: 1.14},
          {t: b.ten + 0.5, x: 720, y: 520, z: 1.12},
          {t: b.everything + 0.4, x: 1000, y: 520, z: 1.12},
          {t: b.full - 0.2, x: 1000, y: 440, z: 1.16},
          {t: b.brim + 0.4, x: 1020, y: 420, z: 1.2},
          {t: b.spills + 0.4, x: 1180, y: 460, z: 1.1},
          {t: b.coworker + 0.2, x: 1260, y: 560, z: 1.04},
          {t: b.overflow, x: 1480, y: 540, z: 1.12},
          {t: b.taxed22 + 0.6, x: 1500, y: 560, z: 1.15},
          {t: b.lower, x: 1100, y: 520, z: 1.06},
          {t: b.lower + 0.9, x: 960, y: 540, z: 1.0},
          {t: B.math.start, x: 960, y: 560, z: 1.03},
        ]}
      >
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <LightShaft t={t} pts={[[140, 0], [420, 0], [980, 820], [620, 820]]} />
          <LightShaft t={t + 2} pts={[[1500, 0], [1700, 0], [1960, 520], [1840, 600]]} color="#FFF8E2" />
          <Dust t={t} x={150} y={20} w={900} h={780} seed={7} n={40} />
          <Dust t={t} x={1480} y={20} w={420} h={560} seed={8} n={16} />
          <Shape pts={rectPts(-40, 800, W + 80, 320, 220, 6)} fill={P.sky} seed={220} />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
            const x0 = ((i * 260 + t * (34 + (i % 3) * 10)) % (W + 300)) - 150;
            return <Stroke key={i} pts={linePts([x0, 836 + (i % 3) * 26], [x0 + 130, 834 + (i % 3) * 26], 5, 6, 230 + i)} w={4.5} color={P.skyDeep} seed={230 + i} />;
          })}
          <PaperBoat x={2050 - (t - b.start) * 46} y={858} t={t} s={0.7} />
          <Bucket x={BX[0]} y={BTOP} h={BH} w={270} level={l1} seed={240} t={t} qa="b10" />
          <Bucket x={BX[1]} y={BTOP} h={BH} w={270} level={l2} seed={250} t={t} wobble={wob} qa="b12" />
          <Bucket x={BX[2]} y={BTOP} h={BH} w={270} level={l3} seed={260} t={t} qa="b22" />
          <CoinStream t={t} a={b.first} b={b.ten} x={BX[0]} topY={-40} surf={surfAt(L1)} seed={300} />
          <CoinStream t={t} a={b.everything} b={b.full - 0.2} x={BX[1]} topY={-40} surf={surfAt(L2)} seed={400} every={0.11} />
          <CoinStream t={t} a={b.spills - 0.3} b={b.twentyTwo + 0.4} x={BX[1] + 40} topY={-40} surf={surfAt(L3)} seed={500} every={0.18} arc={300} />
          <Arrow from={[BX[1] + 120, BTOP - 30]} to={[BX[2] - 110, BTOP - 20]} k={prog(t, b.spills, b.spills + 0.5, easeOut)} bow={-40} />
          <CircleMark cx={BX[2]} cy={BTOP + BH - 30} rx={150} ry={50} k={prog(t, b.overflow, b.overflow + 0.6, easeOut)} />
          {[0, 1].map((i) => (
            <Stroke
              key={i}
              pts={[[BX[i] + 70, BTOP + 120], [BX[i] + 95, BTOP + 150], [BX[i] + 140, BTOP + 80]]}
              draw={prog(t, b.lower + i * 0.45, b.lower + 0.4 + i * 0.45, easeOut)}
              color={P.teal}
              w={9}
              seed={270 + i}
              pen
            />
          ))}
          <ImpactLines t={t} t0={b.full + 0.02} x={BX[1] - 150} y={250} r={120} n={7} seed={275} color={P.coral} arc={Math.PI * 1.5} />
          <Maya name="maya" a={maya} x={210} y={1010} s={1.0} />
          {cwIn > 0.01 ? <Coworker name="cw" a={cw} x={2160 - 370 * cwIn} y={1040} s={1.05} flip pose="whisper" /> : null}
        </svg>
        <Tag x={BX[0]} y={130} text="10%" fill={P.teal} color={P.white} align="center" k={prog(t, b.buckets - 0.2, b.buckets + 0.2, easeOut)} qa="t10" size={46} />
        <Tag x={BX[1]} y={130} text="12%" fill={P.mustard} align="center" k={prog(t, b.buckets, b.buckets + 0.4, easeOut)} qa="t12" size={46} rot={2} />
        <Tag x={BX[2]} y={130} text="22%" fill={P.coral} color={P.white} align="center" k={prog(t, b.buckets + 0.2, b.buckets + 0.6, easeOut)} qa="t22" size={46} rot={-3} />
        <Txt x={BX[0]} y={732} size={36} align="center" k={prog(t, b.first, b.first + 0.5, easeOut)} qa="r10">
          $0 – $12,400
        </Txt>
        <Txt x={BX[1]} y={732} size={36} align="center" k={prog(t, b.upTo, b.upTo + 0.5, easeOut)} qa="r12">
          $12,400 – $50,400
        </Txt>
        <Txt x={BX[2]} y={732} size={36} align="center" k={prog(t, b.spills, b.spills + 0.5, easeOut)} color={P.coral} qa="r22">
          + $2,000 raise
        </Txt>
        <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: `${BX[1] - 150}px 230px`, transform: `scale(${(t < b.full ? 1 : 2.4 - 1.4 * prog(t, b.full - 0.02, b.full + 0.2, easeOut)).toFixed(3)})`}}>
          <Txt x={BX[1] - 212} y={198} size={52} k={prog(t, b.full, b.full + 0.14, easeOut)} color={P.coral} riso={P.ink} qa="full" rot={-6} weight={800}>
            FULL!
          </Txt>
        </div>
        <Txt x={1518} y={410} size={36} k={prog(t, b.overflow + 0.2, b.overflow + 0.7, easeOut)} color={P.coral} qa="onlyThis" rot={-3}>
          only this part
        </Txt>
        <Txt x={1518} y={460} size={36} k={prog(t, b.taxed22, b.taxed22 + 0.4, easeOut)} color={P.coral} qa="onlyThis22" rot={-3} weight={800}>
          pays 22%
        </Txt>
        <Txt x={820} y={780} size={42} align="center" k={prog(t, b.same - 0.6, b.same + 0.6)} color={P.teal} qa="same" rot={-0.5} pen>
          taxed the same as before
        </Txt>
      </Cam>
      <Source x={1880} y={46} align="right" text="IRS 2026 brackets (single)" k={prog(t, b.buckets, b.buckets + 0.5)} qa="srcBuckets" />
    </AbsoluteFill>
  );
};

/* ======================= MATH (receipt) ======================= */

export const MathScene: React.FC<SceneProps> = ({t}) => {
  const k = B.math;
  const f = fr(t);
  const maya = act(f, {
    seed: 14,
    reacts: [
      {t: k.result + 0.2, kind: 'nod'},
      {t: k.keeps + 0.2, kind: 'smile', hold: 1.5},
      {t: k.total + 0.3, kind: 'think'},
      {t: k.nine + 0.2, kind: 'surprise'},
      {t: k.not22, kind: 'relief', hold: 1.4},
      {t: k.tip, kind: 'smile'},
    ],
    look: [{t: k.start, x: 1, y: -0.5, hold: 3}, {t: k.total, x: 1, y: 0, hold: 2}],
  });
  const res = prog(t, k.result, k.result + 0.7, easeOut);
  const keep = prog(t, k.keeps, k.keeps + 0.8, easeOut);
  const tot = prog(t, k.total, k.total + 0.8, easeOut);
  const minis = prog(t, k.shrink - 0.3, k.shrink + 0.3, easeOut);
  const fillK = prog(t, k.shrink, k.tip + 0.6, (x) => x);
  const tipWob = Math.sin((t - k.tip) * 14) * 9 * Math.max(0, 1 - Math.abs(t - k.tip - 0.4) / 0.6) * (t > k.tip ? 1 : 0);
  const cardY = 70;
  return (
    <AbsoluteFill>
      <Paper color={P.paper} id="math" lines="ruled" />
      <Cam
        t0={k.start}
        t1={B.pivot.start}
        push={0}
        keys={[
          {t: k.start, x: 1660, y: 240, z: 1.12},
          {t: k.result + 0.6, x: 1700, y: 230, z: 1.15},
          {t: k.keeps - 0.3, x: 1650, y: 360, z: 1.12},
          {t: k.payroll + 0.5, x: 1600, y: 400, z: 1.1},
          {t: k.total - 0.6, x: 1680, y: 480, z: 1.1},
          {t: k.nine + 0.4, x: 1680, y: 480, z: 1.1},
          {t: k.not22 + 0.6, x: 1600, y: 600, z: 1.1},
          {t: k.shrink - 0.4, x: 900, y: 440, z: 1.02},
          {t: k.tip + 0.6, x: 900, y: 380, z: 1.04},
          {t: B.pivot.start, x: 900, y: 380, z: 1.05},
        ]}
      >
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          {/* coffee mug with rising steam (living background) */}
          <Shape pts={rectPts(80, 690, 130, 150, 330, 20)} fill={P.coralPale} seed={330} />
          <Shape pts={[[210, 720], [250, 735], [248, 790], [210, 800]]} ink={P.ink} seed={331} />
          {[0, 1, 2].map((i) => {
            const ph = t * 1.2 + i * 2.1;
            const pts: [number, number][] = [];
            for (let j = 0; j < 6; j++) pts.push([115 + i * 30 + Math.sin(ph + j * 0.9) * 10, 670 - j * 26 - (ph % 1) * 20]);
            return <Stroke key={i} pts={pts} w={4} color={P.inkSoft} seed={340 + i} />;
          })}
          <Maya name="maya" a={maya} x={460} y={1050} s={1.42} pose={t > k.keeps - 0.2 ? 'hold' : 'neutral'} />
          <Card x={820} y={cardY} w={1010} h={690} seed={350} qa="receipt" rot={-1} />
          <Stroke pts={linePts([880, cardY + 450], [1770, cardY + 446], 10, 1, 351)} draw={prog(t, k.total - 0.4, k.total, easeOut)} w={4} pen={false} />
          <Strike x={880} y={cardY + 590} len={190} k={prog(t, k.nine - 0.15, k.nine + 0.2, easeOut)} sw={10} />
          <CircleMark cx={1250} cy={cargoY(cardY)} rx={150} ry={56} k={prog(t, k.not22, k.not22 + 0.5, easeOut)} color={P.teal} />
          {minis > 0
            ? [0, 1, 2].map((i) => (
                <g key={i} transform={`translate(${190 + i * 190},150) scale(${0.45 * minis})`}>
                  <Bucket x={0} y={0} w={270} h={300} level={clamp01(fillK * 3 - i) * (i === 2 ? 0.95 : 1)} seed={360 + i * 10} t={t} wobble={i === 2 ? tipWob : 0} />
                </g>
              ))
            : null}
        </svg>
        <Txt x={1325} y={cardY + 28} size={40} align="center" color={P.teal} k={prog(t, k.start - 0.2, k.start + 0.3, easeOut)} qa="rHead" weight={800}>
          YOUR RAISE, TAXED
        </Txt>
        <Txt x={860} y={cardY + 100} size={78} k={prog(t, k.start, k.start + 0.4, easeOut)} qa="r2000" weight={800}>
          $2,000
        </Txt>
        <Txt x={1180} y={cardY + 100} size={78} k={prog(t, k.times, k.times + 0.4, easeOut)} qa="r22" weight={800}>
          {'× 22%'}
        </Txt>
        <Odo x={1475} y={cardY + 100} size={78} from={0} to={440} k={prog(t, k.result, k.result + 0.7)} fmt={(v) => '= $' + Math.round(v).toLocaleString('en-US')} color={P.coral} qa="r440" weight={800} />
        <Txt x={880} y={cardY + 220} size={70} k={prog(t, k.keeps - 0.75, k.keeps + 0.05)} qa="keepLbl" pen>
          she keeps
        </Txt>
        <Odo x={1290} y={cardY + 210} size={84} from={0} to={1560} k={prog(t, k.keeps, k.keeps + 0.8)} color={P.teal} qa="keep" weight={800} riso={P.tealLight} />
        <Txt x={890} y={cardY + 318} size={36} k={prog(t, k.payroll, k.payroll + 0.5, easeOut)} color={P.inkSoft} qa="payroll">
          (before payroll taxes)
        </Txt>
        <Txt x={880} y={cardY + 474} size={50} k={prog(t, k.total - 0.8, k.total + 0.1)} qa="totLbl" pen>
          total federal tax:
        </Txt>
        <Odo x={1450} y={cardY + 466} size={62} from={0} to={6240} k={prog(t, k.total, k.total + 0.8)} qa="tot" weight={800} />
        <Txt x={890} y={cardY + 560} size={72} k={prog(t, k.total + 1.0, k.total + 1.6)} color={P.coral} qa="w22" weight={800} pen>
          22%?
        </Txt>
        <Txt x={1130} y={cardY + 556} size={76} k={prog(t, k.nine, k.nine + 0.5, easeOut)} color={P.teal} qa="w9" weight={800} riso={P.tealLight}>
          {'≈ 9% of her pay'}
        </Txt>
      </Cam>
      <Source x={850} y={cardY + 700} text={'IRS 2026 brackets · $6,240 ÷ $68,500 = 9.1%'} k={prog(t, k.nine, k.nine + 0.5)} qa="srcMath" />
    </AbsoluteFill>
  );
};
const cargoY = (cardY: number) => cardY + 600;

/* ======================= PIVOT ======================= */

export const Pivot: React.FC<SceneProps> = ({t}) => {
  const p = B.pivot;
  const f = fr(t);
  const cw = act(f, {
    seed: 25,
    reacts: [
      {t: p.almost, kind: 'smile', hold: 1.4},
      {t: p.buckets, kind: 'think'},
      {t: p.cliffs, kind: 'shock'},
    ],
    look: [{t: p.buckets, x: 1, y: 0, hold: 3.2}],
  });
  const slam = sp(f, p.cliffs - 0.12, {damping: 9, stiffness: 210, mass: 0.7});
  const cliffY = 1100 - 560 * slam;
  const kick = clamp01((t - p.cliffs) / 0.9);
  const bucketShow = prog(t, p.almost + 0.2, p.almost + 0.8, easeOut);
  const bucketBob = (1 - kick) * Math.sin(t * 2.2) * 12;
  return (
    <AbsoluteFill>
      <Paper color={P.salmon} id="pivot" />
      <Cam
        t0={p.start}
        t1={B.dan.start}
        push={0}
        shakeAt={[p.cliffs]}
        keys={[
          {t: p.start, x: 600, y: 520, z: 1.12},
          {t: p.almost + 0.8, x: 640, y: 480, z: 1.1},
          {t: p.buckets - 0.2, x: 1200, y: 540, z: 1.08},
          {t: p.cliffs - 0.15, x: 1100, y: 560, z: 1.1},
          {t: p.cliffs + 0.5, x: 1000, y: 540, z: 1.0},
          {t: B.dan.start, x: 1000, y: 540, z: 1.02},
        ]}
      >
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          {Array.from({length: 9}).map((_, i) => {
            const x0 = ((i * 260 - t * 120) % (W + 300) + W + 300) % (W + 300) - 150;
            return <Stroke key={i} pts={linePts([x0, 90 + i * 85], [x0 + 140, 88 + i * 85], 5, 4, 380 + i)} w={4} color={P.white} seed={380 + i} />;
          })}
          <Coworker name="cw" a={cw} x={420} y={1050} s={1.45} />
          {bucketShow > 0 ? (
            <g transform={`translate(${1320 - kick * 700},${560 + bucketBob - kick * 500 + kick * kick * 300}) rotate(${-kick * 260}) scale(${0.55 * bucketShow})`}>
              <Bucket x={0} y={-170} w={270} h={340} level={0.6} seed={390} t={t} />
            </g>
          ) : null}
          {slam > 0.001 ? <CliffBlock x={1100} y={cliffY} w={760} h={620} seed={395} /> : null}
          <Burst t={t} t0={p.cliffs + 0.05} x={1400} y={560} n={12} seed={396} spread={600} up={620} />
          <ImpactLines t={t} t0={p.cliffs + 0.04} x={1480} y={300} r={230} n={8} seed={397} color={P.coral} />
          <Splash t={t} t0={p.cliffs + 0.1} x={1300} y={500} n={9} seed={398} s={1.2} />
          <Pebbles t={t} t0={p.cliffs + 0.2} x={1110} y={560} n={7} seed={399} fall={500} />
        </svg>
        <Txt x={150} y={150} size={70} k={prog(t, p.almost - 0.4, p.almost + 0.6)} qa="almost" rot={-3} pen>
          almost right...
        </Txt>
        <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '1480px 230px', transform: `scale(${(t < p.cliffs ? 1 : 2.4 - 1.4 * prog(t, p.cliffs - 0.02, p.cliffs + 0.24, easeOut)).toFixed(3)})`}}>
          <Txt x={1480} y={150} size={150} align="center" k={prog(t, p.cliffs, p.cliffs + 0.16, easeOut)} color={P.ink} riso={P.coral} qa="cliffWord" weight={800} bounce={80}>
            CLIFF
          </Txt>
        </div>
      </Cam>
    </AbsoluteFill>
  );
};
