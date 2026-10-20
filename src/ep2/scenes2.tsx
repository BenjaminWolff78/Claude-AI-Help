import React from 'react';
import {AbsoluteFill} from 'remotion';
import {act} from './acting';
import {June, Linda, Walt} from './characters';
import {Arrow, CircleMark, Shape, Stroke, ellipsePts, linePts, rectPts} from './ink';
import {H, P, W, WT, clamp01, easeIn, easeInOut, easeOut, frF, hash2, prog, sp} from './lib';
import {Bucket, Card, CliffBlock, Clouds, Coin, Dust, LightShaft} from './props';
import {CalendarPage, STAIR, Specks, Staircase, Swing, Weight, sharp, treadAt} from './props2';
import {SceneProps} from './scenes1';
import {Cam, Paper} from './stage';
import {Source, Tag, Txt} from './text';
import {Burst, ImpactLines, Pebbles, Puff, Splash, landSquash} from '../mg/kit';

const fr = frF;

/* ======================= RULE: what IRMAA looks at ======================= */

const Block: React.FC<{x: number; y: number; w: number; h: number; fill: string; seed: number; k: number}> = ({x, y, w, h, fill, seed, k}) => {
  if (k <= 0) return null;
  // falls with gravity and lands with one squash (k 0..0.7 fall, then settle)
  const fall = clamp01(k / 0.7);
  const dy = (1 - fall * fall) * -300;
  const land = clamp01((k - 0.7) / 0.3);
  const sq = Math.sin(land * Math.PI) * 0.1 * (1 - land);
  return (
    <g transform={`translate(${x + w / 2},${y + h + dy}) scale(${1 + sq},${1 - sq}) translate(${-(x + w / 2)},${-(y + h)})`} opacity={clamp01(k * 6)}>
      <Shape pts={rectPts(x, y, w, h, seed, 10)} fill={fill} seed={seed} w={5} />
    </g>
  );
};

export const RuleScene: React.FC<SceneProps> = ({t}) => {
  const f = fr(t);
  const name = WT('r1', 'IRMAA');
  const tax = WT('r2', 'return');
  const two = WT('r2', 'two');
  const income = WT('r3', 'income');
  const paycheck = WT('r3', 'paycheck');
  const taxFree = WT('r4', 'tax-free');
  const bond = WT('r4', 'bond');
  const push = WT('r5', 'push');
  const over = WT('r5', 'over');
  const linda = act(f, {
    seed: 54,
    reacts: [{t: name + 0.2, kind: 'think', hold: 1.2}, {t: two + 0.2, kind: 'surprise'}, {t: bond + 0.2, kind: 'surprise'}, {t: over + 0.1, kind: 'worry', hold: 1.4}],
    look: [{t: name, x: -1, y: -0.6, hold: 2}, {t: tax, x: -1, y: 0, hold: 3}, {t: income, x: -1, y: 0.2, hold: 12}],
  });
  const calOut = prog(t, income - 0.4, income + 0.2, easeIn);
  const calIn = prog(t, tax - 0.5, tax + 0.1, easeOut);
  // the income stack
  const bx = 600;
  const bw = 560;
  const base = 860;
  const lineY = 470;
  const blocks = [
    {label: 'pension', h: 120, fill: P.tealLight, k: prog(t, income, income + 0.4)},
    {label: 'IRA withdrawals', h: 130, fill: P.mustardPale, k: prog(t, income + 0.35, income + 0.75)},
    {label: 'taxable Social Security', h: 110, fill: P.lavender, k: prog(t, paycheck, paycheck + 0.4)},
    {label: 'tax-free muni bond interest', h: 70, fill: P.berryPale, k: prog(t, taxFree, bond + 0.3)},
  ];
  let y = base;
  const placed = blocks.map((b) => {
    y -= b.h;
    return {...b, y};
  });
  const starts = [[income, income + 0.4], [income + 0.35, income + 0.75], [paycheck, paycheck + 0.4], [taxFree, bond + 0.3]];
  const blockLand = (i: number) => starts[i][0] + (starts[i][1] - starts[i][0]) * 0.7;
  const nudge = prog(t, push, over + 0.3, easeOut);
  return (
    <AbsoluteFill>
      <Paper color={P.tealPale} id="rule" />
      <Cam
        t0={WT('r1') - 0.4}
        t1={87}
        push={0}
        keys={[
          {t: WT('r1') - 0.4, x: 960, y: 300, z: 1.16},
          {t: name + 0.5, x: 960, y: 260, z: 1.2},
          {t: tax - 0.2, x: 700, y: 480, z: 1.06},
          {t: two + 0.5, x: 680, y: 500, z: 1.14},
          {t: income + 0.2, x: 880, y: 600, z: 1.04},
          {t: paycheck + 0.4, x: 880, y: 560, z: 1.08},
          {t: bond + 0.2, x: 900, y: 450, z: 1.2},
          {t: over + 0.4, x: 960, y: 520, z: 1.04},
        ]}
      >
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          {/* desk lamp light and dust: the living part of the room */}
          <LightShaft t={t} pts={[[1300, 0], [1460, 0], [1860, 880], [980, 880]]} color="#FFF4D2" />
          <Dust t={t} x={1000} y={60} w={820} h={800} seed={21} n={26} />
          <Shape pts={rectPts(-40, 860, W + 80, 260, 400, 6)} fill={P.wood} seed={400} w={6} />
          <Stroke pts={linePts([-20, 900], [W + 20, 904], 12, 0, 401)} w={3} color={P.woodDark} seed={401} />
          {/* the name, on a sticky note */}
          <g transform={`translate(0,${(1 - prog(t, name - 0.4, name, easeOut)) * -200})`}>
            <Shape pts={rectPts(630, 50, 660, 190, 402, 6)} fill={P.mustardPale} seed={402} />
          </g>
          {/* the income stack: each block drops in and kicks up a little dust */}
          {placed.map((b, i) => (
            <Block key={i} x={bx} y={b.y - nudge * 0} w={bw} h={b.h} fill={b.fill} seed={420 + i} k={b.k} />
          ))}
          {placed.map((b, i) => {
            const land = blockLand(i);
            return <Puff key={i} t={t} t0={land} x={bx + bw / 2} y={b.y + b.h} w={bw * 0.9} seed={440 + i} life={0.6} />;
          })}
          {t > income - 0.2
            ? Array.from({length: 11}).map((_, i) => (
                <Stroke key={i} pts={[[bx - 120 + i * 60, lineY + (i % 2) * 2], [bx - 88 + i * 60, lineY + 1]]} w={6} color={P.berry} seed={430 + i} taper={false} />
              ))
            : null}
          {nudge > 0 ? <CircleMark cx={bx + bw / 2} cy={placed[3].y + 35} rx={330} ry={66} k={nudge} color={P.berry} /> : null}
          <Linda name="linda" a={linda} x={1560} y={1080} s={1.3} />
        </svg>
        <Txt x={960} y={74} size={104} align="center" k={prog(t, name - 0.1, name + 0.3)} weight={800} riso={P.berry} qa="irmaa">
          IRMAA
        </Txt>
        <Txt x={960} y={196} size={26} align="center" k={prog(t, name + 0.3, name + 0.7)} color={P.inkSoft} qa="irmaaSub">
          income-related monthly adjustment amount
        </Txt>
        {calIn > 0 ? (
          <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0', opacity: clamp01(calIn * 2), transform: `translate(${-70 * calOut}px, ${(1 - calIn) * 80 - 100 * calOut}px) scale(${1 - 0.45 * calOut})`}}>
            <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
              <Card x={220} y={330} w={300} h={380} seed={403} rot={-3} />
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Stroke key={i} pts={[[250, 470 + i * 34], [480 - (i % 3) * 40, 470 + i * 34]]} w={3} color={P.inkSoft} seed={404 + i} taper={false} />
              ))}
              <CalendarPage x={800} y={360} w={240} h={260} seed={410} rot={2} />
              {[1, 0].map((j) => {
                // two pages (2024, 2025) flip up off the 2026 calendar, one per counted year
                const fk = prog(t, two + 0.05 + j * 0.28, two + 0.42 + j * 0.28, easeIn);
                if (fk >= 1) return null;
                const sy = Math.cos(fk * Math.PI);
                return (
                  <g key={j} transform={`translate(0,${360 + 4}) scale(1,${Math.max(0.02, Math.abs(sy))}) translate(0,${-(360 + 4)})`} opacity={fk > 0.5 ? 0.7 : 1}>
                    <CalendarPage x={800} y={360} w={240} h={260} seed={412 + j} rot={2} />
                    <text x={920} y={500} textAnchor="middle" fontFamily='"Shantell Sans"' fontWeight={800} fontSize={56} fill={P.ink} transform="rotate(2 920 490)">
                      {2024 + j}
                    </text>
                  </g>
                );
              })}
              <Arrow from={[540, 470]} to={[780, 470]} k={prog(t, two - 0.2, two + 0.4)} color={P.berry} bow={-40} pen={false} />
            </svg>
            <Txt x={370} y={360} size={46} align="center" k={1} rot={-3} qa="ret2024" weight={800}>
              2024
            </Txt>
            <Txt x={370} y={416} size={28} align="center" k={1} rot={-3} qa="retLabel" color={P.inkSoft}>
              tax return
            </Txt>
            <Txt x={920} y={442} size={56} align="center" k={prog(t, two + 0.62, two + 0.75)} rot={2} qa="cal2026" weight={800}>
              2026
            </Txt>
            <Txt x={920} y={650} size={30} align="center" k={1} qa="calLabel" color={P.inkSoft}>
              premium
            </Txt>
            <Txt x={660} y={366} size={34} align="center" k={prog(t, two, two + 0.7)} qa="twoYears" color={P.berry} pen>
              2 years back
            </Txt>
          </div>
        ) : null}
        {placed.map((b, i) => (
          <Txt key={i} x={bx + bw / 2} y={b.y + b.h / 2 - 20 + (1 - easeOut(clamp01(b.k))) * -260} size={i === 3 ? 28 : 32} align="center" k={b.k} qa={`blk${i}`} weight={700}>
            {b.label}
          </Txt>
        ))}
        <Txt x={bx - 130} y={lineY - 52} size={30} k={prog(t, income - 0.2, income + 0.2)} color={P.berry} qa="lineTxt">
          the line
        </Txt>
        <Txt x={bx + bw + 40} y={placed[0].y + 40} size={40} k={prog(t, income + 0.8, income + 1.5)} color={P.teal} qa="magi" weight={800} pen>
          = MAGI
        </Txt>
        <Source x={80} y={830} text="SSA: 2026 premiums generally use the 2024 tax return · MAGI = AGI + tax-exempt interest" k={prog(t, tax, tax + 0.3)} qa="srcSsa" />
      </Cam>
    </AbsoluteFill>
  );
};

/* ======================= PIVOT: bucket vs step ======================= */

export const PivotScene: React.FC<SceneProps> = ({t}) => {
  const f = fr(t);
  const bracket = WT('p1', 'bracket');
  const overflow = WT('p2', 'overflow');
  const care = WT('p3', 'care');
  const went = WT('p3', 'went');
  const one = WT('p4', 'one');
  const whole = WT('p4', 'whole');
  const lands = WT('p4', 'lands');
  const cliff = WT('p5', 'cliff');
  // left: the bracket bucket overflows; only the spill is taxed
  const fill = prog(t, bracket - 0.5, overflow + 0.6, easeInOut);
  const spill = prog(t, overflow - 0.4, overflow + 1.0, easeOut);
  // right: a marker slides along the step; the price never changes
  const slide = prog(t, care - 0.2, went + 0.5, easeInOut);
  const cross = prog(t, WT('p4', 'Cross') - 0.1, one, easeOut);
  const mx = t < WT('p4', 'Cross') - 0.1 ? 1200 + 500 * slide : 1700 - 455 * cross;
  const drop = sp(fr(t), whole - 0.1, {damping: 12, stiffness: 200, mass: 1});
  const slam = sp(f, cliff - 0.12, {damping: 10, stiffness: 210, mass: 0.7});
  return (
    <AbsoluteFill>
      <Paper color={P.salmon} id="pivot" />
      <Cam
        t0={WT('p1') - 0.4}
        t1={102}
        push={0}
        shakeAt={[whole + 0.18, cliff + 0.05]}
        keys={[
          {t: WT('p1') - 0.4, x: 560, y: 470, z: 1.14},
          {t: overflow - 0.3, x: 560, y: 520, z: 1.1},
          {t: overflow + 0.8, x: 660, y: 600, z: 1.16},
          {t: WT('p3', 'IRMAA') - 0.1, x: 1000, y: 520, z: 1.0},
          {t: care + 0.3, x: 1400, y: 520, z: 1.14},
          {t: whole - 0.2, x: 1300, y: 600, z: 1.12},
          {t: cliff - 0.05, x: 1420, y: 560, z: 1.08},
          {t: cliff + 0.5, x: 960, y: 540, z: 1.0},
          {t: 102, x: 960, y: 540, z: 1.02},
        ]}
      >
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          {Array.from({length: 9}).map((_, i) => {
            const x0 = ((i * 260 - t * 110) % (W + 300) + W + 300) % (W + 300) - 150;
            return <Stroke key={i} pts={linePts([x0, 90 + i * 90], [x0 + 140, 88 + i * 90], 5, 4, 440 + i)} w={4} color={P.white} seed={440 + i} />;
          })}
          {/* divider */}
          <Stroke pts={linePts([960, 120], [964, 860], 10, 0, 450)} w={5} color={P.inkSoft} seed={450} />
          {/* left: bucket */}
          <Bucket x={330} y={430} w={300} h={330} level={0.25 + 0.75 * fill} seed={451} t={t} />
          {spill > 0 ? (
            <g>
              <Stroke pts={[[480, 430], [540, 470], [600, 560], [640, 660]]} w={18 * clamp01(spill * 2) * (1 - clamp01((spill - 0.8) * 5))} color={P.water} seed={452} taper={false} />
              <Bucket x={700} y={640} w={170} h={160} level={0.6 * spill} seed={453} t={t} />
            </g>
          ) : null}
          <Shape pts={rectPts(80, 760, 860, 40, 454, 6)} fill={P.earth} seed={454} />
          {/* right: the flat step with the line */}
          {slam > 0.001 ? <CliffBlock x={1000} y={760} w={480} h={420} seed={480} /> : <Shape pts={rectPts(1000, 760, 480, 40, 455, 6)} fill={P.earth} seed={455} />}
          {/* the floor beyond the step falls away on "cliff" */}
          <g transform={`translate(${slam * 60},${slam * slam * 700 + slam * 40}) rotate(${slam * 24} 1480 780)`} opacity={1 - clamp01((slam - 0.7) * 3)}>
            <Shape pts={rectPts(1480, 760, 520, 40, 457, 6)} fill={P.earth} seed={457} />
          </g>
          {Array.from({length: 7}).map((_, i) => (
            <Stroke key={i} pts={[[1180 + (i % 2) * 2, 752 - i * 40], [1181, 728 - i * 40]]} w={6} color={P.ink} seed={456 + i} taper={false} />
          ))}
          {/* marker sliding along the step */}
          {t > care - 0.3 ? (
            <g transform={`translate(${mx},740)`}>
              <Shape pts={[[-22, -60], [22, -60], [0, 0]]} fill={P.mustard} seed={460} w={4} />
            </g>
          ) : null}
          {spill > 0.15 && spill < 0.95 ? <Splash t={t} t0={overflow - 0.4 + Math.floor((t - overflow) / 0.35) * 0.35 + 0.6} x={785} y={680} n={6} seed={480 + Math.floor((t - overflow) / 0.35)} s={0.8} /> : null}
          <Puff t={t} t0={whole + 0.16} x={1250} y={760} w={420} seed={485} />
          <ImpactLines t={t} t0={whole + 0.15} x={1250} y={640} r={230} n={8} seed={486} />
          <Pebbles t={t} t0={cliff + 0.05} x={1490} y={772} n={8} seed={487} fall={400} />
          <Burst t={t} t0={cliff + 0.02} x={1500} y={760} n={10} seed={488} spread={480} up={500} />
          {/* the weight drops */}
          {drop > 0.001 ? <Weight x={1100} y={760 - 150 - (1 - drop) * 640} w={300} h={150} seed={470} /> : null}
          {slam > 0.3 ? (
            <g transform={`translate(${1500 + (t - cliff) * 160},${740 + Math.pow(Math.max(0, t - cliff), 2) * 700}) rotate(${(t - cliff) * 500})`}>
              <Coin x={0} y={0} r={24} seed={481} />
            </g>
          ) : null}
        </svg>
        <Txt x={480} y={150} size={76} align="center" k={prog(t, bracket - 0.2, bracket + 0.3)} weight={800} color={P.ink} riso={P.teal} qa="bracketT">
          tax bracket
        </Txt>
        <Txt x={785} y={820} size={30} align="center" k={prog(t, overflow, overflow + 0.3)} color={P.inkSoft} qa="onlyThis">
          only this part
        </Txt>
        <Txt x={1440} y={150} size={76} align="center" k={prog(t, WT('p3', 'IRMAA') - 0.2, WT('p3', 'IRMAA') + 0.3)} weight={800} riso={P.berry} qa="irmaaT">
          IRMAA
        </Txt>
        <Txt x={1180} y={420} size={30} align="center" k={prog(t, care - 0.3, care)} color={P.ink} qa="lineL">
          $109,000
        </Txt>
        <Tag x={mx - 80} y={560} text={t > WT('p4', 'Cross') - 0.1 ? '$109,001' : slide < 0.5 ? '$109,001' : '$136,999'} k={prog(t, care - 0.3, care) * (t < whole ? 1 : 0)} fill={P.mustard} size={30} rot={-2} qa="marker" />
        <Tag x={1460} y={430} text="same +$95.70 a month" k={prog(t, went - 0.2, went + 0.2) * (t < whole - 0.3 ? 1 : 0)} fill={P.white} size={30} rot={2} qa="same" />
        <Tag x={1205} y={460} text="+$1" k={cross * (t < whole - 0.2 ? 1 : 0)} fill={P.white} size={40} rot={-4} qa="plus1" />
        <Txt x={1250} y={drop > 0.001 ? 760 - 120 - (1 - drop) * 640 : -400} size={34} align="center" k={drop > 0.05 ? 1 : 0} weight={800} color={P.white} qa="weightT">
          +$95.70/mo
        </Txt>
        <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '1640px 340px', transform: `scale(${(t < cliff ? 1 : 2.4 - 1.4 * prog(t, cliff - 0.02, cliff + 0.24, easeOut)).toFixed(3)})`}}>
          <Txt x={1640} y={260} size={150} align="center" k={prog(t, cliff, cliff + 0.16, easeOut)} color={P.ink} riso={P.berry} qa="cliffT" weight={800} bounce={80}>
            CLIFF
          </Txt>
        </div>
      </Cam>
    </AbsoluteFill>
  );
};

/* ======================= STAIRS: five steps ======================= */

const STEPS = [
  {th: '$109k', add: '+$81.20'},
  {th: '$137k', add: '+$202.90'},
  {th: '$171k', add: '+$324.60'},
  {th: '$205k', add: '+$446.30'},
  {th: '$500k', add: '+$487.00'},
];

export const StairsScene: React.FC<SceneProps> = ({t}) => {
  const f = fr(t);
  const s500 = WT('s1', '$500');
  const s28 = WT('s2', '$28,000');
  const same = WT('s2', 'same');
  const stair = WT('s4', 'staircase');
  const five = WT('s4', 'five');
  const first = WT('s5', '$81.20');
  const last = WT('s6', '$487');
  const top = WT('s7', 'top');
  const price = WT('s7', '$689.90');
  const linda = act(f, {
    seed: 55,
    reacts: [{t: same + 0.2, kind: 'surprise'}, {t: five, kind: 'worry', hold: 1.5}, {t: price + 0.2, kind: 'shock', hold: 1.4}],
    look: [{t: WT('s1'), x: 1, y: -0.2, hold: 9}, {t: stair, x: 1, y: -0.7, hold: 14}],
  });
  const keys = [
    {t: 0, x: 760, y: 700, z: 1.55},
    {t: stair - 0.4, x: 760, y: 700, z: 1.55},
    {t: five + 0.4, x: 960, y: 540, z: 1.0},
    {t: 130, x: 960, y: 540, z: 1.02},
  ];
  const t0 = treadAt(0);
  const birds = (i: number) => {
    const bx = ((i * 520 + t * 70) % 2300) - 200;
    const by = 140 + i * 50 + Math.sin(t * 2 + i) * 10;
    const flap = Math.sin(t * 8 + i) * 10;
    return <Stroke key={i} pts={[[bx - 22, by - flap], [bx, by + 4], [bx + 22, by - flap]]} w={4} seed={500 + i} />;
  };
  return (
    <AbsoluteFill>
      <Paper color={P.sky} id="stairs" />
      <Cam t0={WT('s1') - 0.4} t1={129.5} push={0} keys={keys}>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <Clouds t={t} y={120} n={5} seed={510} s={0.9} />
          {[0, 1, 2].map(birds)}
          <Staircase k={1} />
          {/* Linda's marker and her ghost at $137k, same tread */}
          <g transform={`translate(${t0[0] + 40},${t0[1]})`} opacity={1 - prog(t, stair, stair + 0.4)}>
            <Shape pts={[[-18, -70], [18, -70], [0, 0]]} fill={P.mustard} seed={520} w={4} />
          </g>
          {t > s28 - 0.3 ? (
            <g transform={`translate(${t0[0] + 190},${t0[1]})`} opacity={0.8 * (1 - prog(t, stair, stair + 0.4))}>
              <Shape pts={[[-18, -70], [18, -70], [0, 0]]} fill={P.white} ink={P.inkSoft} seed={521} w={3.5} />
            </g>
          ) : null}
          {/* the top step flag */}
          {t > top - 0.3 ? (
            <g>
              <Stroke pts={[[treadAt(4)[0] + 180, treadAt(4)[1]], [treadAt(4)[0] + 180, treadAt(4)[1] - 170]]} w={5} seed={530} taper={false} />
              <Shape pts={[[treadAt(4)[0] + 182, treadAt(4)[1] - 168], [treadAt(4)[0] + 262 + Math.sin(t * 4) * 6, treadAt(4)[1] - 146], [treadAt(4)[0] + 182, treadAt(4)[1] - 120]]} fill={P.berry} seed={531} w={3.5} />
            </g>
          ) : null}
          <Burst t={t} t0={top - 0.05} x={treadAt(4)[0] + 200} y={treadAt(4)[1] - 120} n={9} seed={598} spread={300} up={420} scale={0.8} />
          <Linda name="linda" a={linda} x={230 - 520 * (1 - prog(t, stair, five + 0.6, easeOut))} y={1080} s={1.05} />
        </svg>
        <Tag x={t0[0] - 10} y={t0[1] - 140} text="$109,500" k={prog(t, s500 - 0.2, s500 + 0.2) * (t < stair ? 1 : 0)} fill={P.mustard} size={28} rot={-3} qa="lindaMark" />
        <Tag x={t0[0] + 150} y={t0[1] - 140} text="$137,000" k={prog(t, s28 - 0.2, s28 + 0.2) * (t < stair ? 1 : 0)} fill={P.white} size={28} rot={3} qa="ghostMark" />
        <Txt x={t0[0] + 115} y={t0[1] + 18} size={30} align="center" k={prog(t, same - 0.2, same + 0.2) * (t < stair ? 1 : 0)} color={P.berry} qa="samePrice" weight={800}>
          same price
        </Txt>
        {STEPS.map((s, i) => {
          const [tx, ty] = treadAt(i);
          const kTh = i === 0 ? prog(t, s500 - 0.4, s500) : prog(t, five + 0.1 + i * 0.12, five + 0.4 + i * 0.12);
          const kAdd = i === 0 ? prog(t, first - 0.2, first + 0.2) : i === 4 ? prog(t, last - 0.2, last + 0.2) : prog(t, last - 1.6 + i * 0.25, last - 1.3 + i * 0.25);
          return (
            <React.Fragment key={i}>
              <Txt x={tx + 8} y={ty + 18} size={26} k={kTh * (i === 0 && t > same - 0.3 && t < stair ? 0 : 1)} color={P.inkSoft} qa={`th${i}`}>
                {s.th}
              </Txt>
              <Tag x={tx + 20} y={ty - 70} text={s.add} k={kAdd * (i === 0 && t < stair ? 0 : 1)} fill={i === 4 ? P.berryPale : P.white} size={i === 4 ? 32 : 26} rot={-2} qa={`add${i}`} />
            </React.Fragment>
          );
        })}
        <Tag x={1260} y={56} text="$689.90 a month" k={prog(t, price - 0.2, price + 0.3)} fill={P.berryPale} size={52} rot={-3} qa="topPrice" />
        <Txt x={1290} y={150} size={30} k={prog(t, price + 0.4, price + 0.8)} color={P.inkSoft} qa="topSub">
          Part B, single, $500k+
        </Txt>
        <Source x={80} y={64} text="CMS 2026 Part B income-related monthly adjustment amounts" k={prog(t, five, five + 0.3)} qa="srcStairs" />
      </Cam>
    </AbsoluteFill>
  );
};

/* ======================= COUPLE: both pay ======================= */

export const CoupleScene: React.FC<SceneProps> = ({t}) => {
  const f = fr(t);
  const married = WT('j1', 'married');
  const line = WT('j1', '$218,000');
  const both = WT('j2', 'both');
  const step = WT('j2', 'step');
  const cost = WT('j3', '$2,300');
  const walt = act(f, {seed: 61, reacts: [{t: married + 0.2, kind: 'smile', hold: 1.5}, {t: step, kind: 'surprise'}, {t: cost + 0.2, kind: 'worry', hold: 1.6}], look: [{t: married, x: 1, y: 0, hold: 2}]});
  const june = act(f, {seed: 62, reacts: [{t: married + 0.4, kind: 'smile', hold: 1.5}, {t: step + 0.15, kind: 'shock', hold: 1}, {t: cost + 0.3, kind: 'worry', hold: 1.6}], look: [{t: married, x: -1, y: 0, hold: 2}]});
  const dropW = sp(f, step - 0.1, {damping: 12, stiffness: 200});
  const dropJ = sp(f, step + 0.05, {damping: 12, stiffness: 200});
  // the swing jolts down when each weight lands
  const jolt = (t0: number) => (t > t0 && t < t0 + 0.6 ? Math.sin((t - t0) / 0.6 * Math.PI * 2) * Math.exp(-(t - t0) * 5) * 14 : 0);
  const sway = Math.sin(t * 1.1) * 1.6;
  const joltY = jolt(step + 0.06) + jolt(step + 0.21);
  return (
    <AbsoluteFill>
      <Paper color="#F2D9B0" id="couple" />
      <Cam
        t0={WT('j1') - 0.4}
        t1={142.5}
        push={0}
        shakeAt={[step + 0.1]}
        keys={[
          {t: WT('j1') - 0.4, x: 880, y: 560, z: 1.12},
          {t: line + 0.3, x: 1100, y: 460, z: 1.1},
          {t: both - 0.1, x: 860, y: 440, z: 1.14},
          {t: step + 0.8, x: 900, y: 460, z: 1.08},
          {t: cost - 0.2, x: 1400, y: 520, z: 1.05},
          {t: 142.5, x: 1450, y: 520, z: 1.07},
        ]}
      >
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          {/* porch: siding, a lantern, fireflies */}
          {Array.from({length: 16}).map((_, i) => (
            <Stroke key={i} pts={linePts([-20, 60 + i * 52], [W + 20, 62 + i * 52], 10, 0, 540 + i)} w={2.5} color="#D9BE92" seed={540 + i} taper={false} />
          ))}
          <Shape pts={rectPts(-40, 880, W + 80, 260, 560, 6)} fill={P.wood} seed={560} w={6} />
          <Specks t={t} x={0} y={120} w={1920} h={640} n={20} seed={561} />
          <Shape pts={rectPts(1700, 120, 90, 140, 562, 12)} fill={P.mustardPale} seed={562} />
          <Stroke pts={[[1745, 0], [1745, 120]]} w={4} seed={563} taper={false} />
          <Swing x={860} y={930} t={t} w={900} />
          <g transform={`translate(0,${joltY.toFixed(1)}) rotate(${sway} 860 370)`}>
            <Walt name="walt" a={walt} x={650} y={830} s={1.12} />
            <June name="june" a={june} x={1070} y={830} s={1.08} />
          </g>
          {dropW > 0.001 ? <Weight x={555} y={222 + joltY + (1 - dropW) * -460} w={190} h={96} seed={570} /> : null}
          {dropJ > 0.001 ? <Weight x={975} y={230 + joltY + (1 - dropJ) * -460} w={190} h={96} seed={571} /> : null}
          <ImpactLines t={t} t0={step + 0.06} x={650} y={300} r={150} n={6} seed={575} />
          <ImpactLines t={t} t0={step + 0.21} x={1070} y={308} r={150} n={6} seed={576} />
          <Burst t={t} t0={cost + 0.15} x={1500} y={560} n={8} seed={577} spread={360} up={380} scale={0.7} />
        </svg>
        <Tag x={1300} y={330} text="a married couple" k={prog(t, married - 0.2, married + 0.3)} fill={P.white} size={38} rot={-3} qa="couple" />
        <Tag x={1300} y={420} text="joint line: $218,000" k={prog(t, line - 0.2, line + 0.3)} fill={P.mustard} size={38} rot={2} qa="joint" />
        <Txt x={650} y={dropW > 0.001 ? 250 + (1 - dropW) * -460 : -400} size={28} align="center" k={dropW > 0.05 ? 1 : 0} weight={800} color={P.white} qa="wW">
          +$95.70/mo
        </Txt>
        <Txt x={1070} y={dropJ > 0.001 ? 258 + (1 - dropJ) * -460 : -400} size={28} align="center" k={dropJ > 0.05 ? 1 : 0} weight={800} color={P.white} qa="wJ">
          +$95.70/mo
        </Txt>
        <Tag x={1300} y={530} text="≈ $2,300 a year" k={prog(t, cost - 0.2, cost + 0.3)} fill={P.berryPale} size={48} rot={-2} qa="coupleCost" />
        <Txt x={1306} y={636} size={26} k={prog(t, cost + 0.4, cost + 0.8)} color={P.inkSoft} qa="coupleCalc">
          2 × ($81.20 + $14.50) × 12 = $2,296.80
        </Txt>
        <Source x={1306} y={690} text="CMS 2026 IRMAA, joint filers" k={prog(t, line, line + 0.3)} qa="srcCouple" />
      </Cam>
    </AbsoluteFill>
  );
};

export const _u2 = [easeIn, hash2, STAIR, sharp, ellipsePts];
