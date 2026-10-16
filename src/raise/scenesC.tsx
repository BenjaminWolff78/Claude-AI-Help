import React from 'react';
import {AbsoluteFill} from 'remotion';
import {act} from './acting';
import {Coworker, Dan, Maya} from './characters';
import {Arrow, CircleMark, CrossOut, Shape, Stroke, ellipsePts, linePts, rectPts} from './ink';
import {B, FPS, frF, H, P, W, clamp01, easeIn, easeInOut, easeOut, hash2, prog} from './lib';
import {Bill, Bucket, Capitol, Card, CliffBlock, Clock, Clouds, Coin, Envelope, Flag, Jar, Laptop, QaLine, SignPost, Window} from './props';
import {Cam, Paper} from './stage';
import {Source, Tag, Txt, money} from './text';
import {SceneProps} from './scenesA';

const fr = frF;

/* ======================= DAN ======================= */

export const DanScene: React.FC<SceneProps> = ({t}) => {
  const d = B.dan;
  const f = fr(t);
  const dan = act(f, {
    seed: 31,
    reacts: [
      {t: d.dan, kind: 'smile'},
      {t: d.freelance, kind: 'nod'},
      {t: d.credit, kind: 'smile'},
      {t: d.expired + 0.1, kind: 'surprise'},
      {t: d.y2025 + 0.4, kind: 'worry', hold: 1.6},
      {t: d.back, kind: 'worry', hold: 1.4},
    ],
    look: [
      {t: d.market, x: 1, y: -0.6, hold: 2.2},
      {t: d.extra, x: 1, y: 0.1, hold: 3.5},
    ],
  });
  const lampA = Math.sin(t * 1.3) * 2.5;
  const peel = prog(t, d.old - 0.2, d.old + 0.8, easeIn);
  const coinsOn = t > d.credit && t < d.expired + 0.3;
  return (
    <AbsoluteFill>
      <Paper color="#D9EAEC" id="dan" />
      <Cam t0={d.start} t1={B.cliff.start} push={0.03} focus={[1100, 480]}>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <Window x={60} y={60} w={340} h={300} seed={73} blinds={false}>
            <rect x={60} y={60} width={340} height={300} fill={P.sky} />
            <Clouds t={t} y={90} n={3} speed={18} seed={61} s={0.6} />
          </Window>
          <g transform={`rotate(${lampA} 980 0)`}>
            <Stroke pts={[[980, -10], [980, 170]]} w={3.5} seed={410} taper={false} />
            <Shape pts={[[920, 230], [1040, 230], [1010, 170], [950, 170]]} fill={P.mustard} seed={411} />
          </g>
          <Dan name="dan" a={dan} x={430} y={1050} s={1.45} pose="laptop" />
          <Shape pts={rectPts(-40, 862, W + 80, 260, 412, 6)} fill={P.wood} seed={412} />
          <Laptop x={830} y={870} t={t} />
          <Card x={1140} y={160} w={690} h={300} seed={420} qa="acaCard" />
          <Shape pts={rectPts(1190, 200, 90, 90, 421, 10)} fill={P.white} seed={421} w={3.5} />
          <Shape pts={[[1225, 212], [1245, 212], [1245, 235], [1268, 235], [1268, 255], [1245, 255], [1245, 278], [1225, 278], [1225, 255], [1202, 255], [1202, 235], [1225, 235]]} fill={P.coral} seed={422} w={3} />
          {coinsOn
            ? Array.from({length: 6}).map((_, i) => {
                const ph = ((t - d.credit) * 0.9 + i / 6) % 1;
                const x = 1300 + ph * 260;
                const y = 560 - Math.sin(ph * Math.PI) * 180;
                return <Coin key={i} x={x} y={y} r={14} seed={430 + i} rot={ph * 360} />;
              })
            : null}
          <Capitol x={1740} y={760} s={0.55 * prog(t, d.expired - 0.3, d.expired + 0.2, easeOut)} />
        </svg>
        <Tag x={250} y={258} text="DAN, 60" fill={P.mustard} k={prog(t, d.dan - 0.1, d.dan + 0.3, easeOut)} qa="danTag" rot={-4} size={44} />
        <Txt x={600} y={420} size={40} k={prog(t, d.freelance, d.freelance + 0.5, easeOut)} color={P.teal} qa="freelance" rot={-3}>
          freelance designer
        </Txt>
        <Txt x={1300} y={212} size={44} k={prog(t, d.market - 0.5, d.market + 0.2, easeOut)} color={P.teal} qa="aca" weight={800}>
          ACA marketplace
        </Txt>
        <Txt x={1310} y={290} size={40} k={prog(t, d.premium - 0.3, d.premium + 0.3, easeOut)} qa="premium">
          monthly premium
        </Txt>
        <Tag x={1150} y={474} text="tax credit" fill={P.mustard} k={prog(t, d.credit - 0.2, d.credit + 0.2, easeOut)} qa="credit" rot={-3} size={40} />
        <div style={{position: 'absolute', left: 0, top: 0, transform: `translate(${peel * 120}px, ${peel * 500}px) rotate(${peel * 40}deg)`, opacity: clamp01(1 - peel * 1.8), transformOrigin: '1400px 660px'}}>
          <Tag x={1150} y={640} text="+ extra help (2021)" fill={P.teal} color={P.white} k={prog(t, d.extra, d.extra + 0.4, easeOut)} qa="extra" rot={-4} size={40} />
          <Txt x={1150} y={626} size={88} k={prog(t, d.expired, d.expired + 0.25, easeOut)} color={P.coral} riso={P.ink} qa="expired" rot={-9} weight={800} bounce={70}>
            EXPIRED
          </Txt>
          <Txt x={1230} y={760} size={40} k={prog(t, d.y2025, d.y2025 + 0.4, easeOut)} qa="end2025" rot={-3}>
            end of 2025
          </Txt>
        </div>
        <Txt x={1120} y={70} size={48} k={prog(t, d.old - 0.3, d.old + 0.5, easeOut)} qa="oldRule" weight={800}>
          2026: the old rule is back
        </Txt>
      </Cam>
    </AbsoluteFill>
  );
};

/* ======================= CLIFF ======================= */

const EDGE = 1150;
const TOPY = 640;

export const CliffScene: React.FC<SceneProps> = ({t}) => {
  const c = B.cliff;
  const f = fr(t);
  const walkA = prog(t, c.start - 0.2, c.start + 2.4, easeInOut);
  const walkB = prog(t, c.income - 1.1, c.income + 0.1, easeInOut);
  const danX = -220 + 780 * walkA + 140 * walkB;
  const walking = (walkA > 0 && walkA < 1) || (walkB > 0 && walkB < 1) ? 1 : 0;
  const dan = act(f, {
    seed: 32,
    reacts: [
      {t: c.income + 0.2, kind: 'smile'},
      {t: c.job + 0.3, kind: 'smile'},
      {t: c.over, kind: 'worry'},
      {t: c.gone, kind: 'shock', hold: 1.2},
    ],
    look: [{t: c.job, x: 1, y: -0.4, hold: 1.5}, {t: c.over, x: 1, y: 0.6, hold: 3}],
  });
  const flagX = 920 + prog(t, c.now - 0.1, c.now + 0.7, easeInOut) * 380;
  const envK = prog(t, c.client, c.job + 0.3, easeOut);
  const fall = clamp01((t - c.gone + 0.15) / 1.2);
  return (
    <AbsoluteFill>
      <Paper color={P.sky} id="cliff" />
      <Cam t0={c.start} t1={B.cost.start} push={0.03} focus={[1000, 480]}>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <Clouds t={t} y={60} n={4} speed={8} seed={71} s={0.7} />
          <Shape pts={[[1100, 900], [1300, 720], [1480, 800], [1700, 690], [1980, 820], [1980, 1100], [1100, 1100]]} fill={P.skyDeep} seed={500} w={3} misreg={0} />
          <Clouds t={t} y={250} n={3} speed={20} seed={81} s={1} />
          <CliffBlock x={-80} y={TOPY} w={EDGE + 80} h={520} seed={510} />
          <Stroke pts={linePts([EDGE + 6, 150], [EDGE + 4, TOPY], 12, 0, 520)} draw={prog(t, c.four - 0.2, c.four + 0.6, easeOut)} w={4} color={P.coral} seed={520} taper={false} />
          {prog(t, c.single - 0.2, c.single + 0.3) > 0 ? <SignPost x={EDGE - 80} y={TOPY} h={340 * prog(t, c.single - 0.2, c.single + 0.3, easeOut)} bw={300} bh={92} seed={530} /> : null}
          {/* Dan's credit: a coin stack beside him that tumbles off the edge when it's gone */}
          {t > c.income - 0.4
            ? Array.from({length: 6}).map((_, i) => {
                const bx = 930 + (i % 3) * 30;
                const by = TOPY - 18 - Math.floor(i / 3) * 22 - (i % 2) * 6;
                const fx = bx + fall * (380 + i * 40);
                const fy = by + fall * fall * (700 + i * 60) - Math.sin(fall * Math.PI) * 60;
                return <Coin key={i} x={fall > 0 ? fx : bx} y={fall > 0 ? fy : by} r={18} seed={540 + i} rot={fall * (200 + i * 90)} />;
              })
            : null}
          <Dan name="dan" a={dan} x={danX} y={TOPY} s={0.82} legs walk={walking} walkPhase={t * 9} />
          {prog(t, c.single - 0.2, c.single + 0.3) > 0 ? (
            <>
              <QaLine id="fplLineTop" x={EDGE} y={150} w={10} h={TOPY - 340 - 46 - 150} />
              <QaLine id="fplLineLow" x={EDGE} y={TOPY - 340 + 46} w={10} h={340 - 46} />
            </>
          ) : (
            <QaLine id="fplLine" x={EDGE} y={150} w={10} h={TOPY - 150} />
          )}
          {prog(t, c.single - 0.2, c.single + 0.3) > 0 ? <QaLine id="post" x={EDGE - 88} y={TOPY - 340 + 46} w={16} h={340 - 46} /> : null}
          {t > c.income - 0.3 ? <QaLine id="flagPole" x={flagX - 3} y={TOPY - 136} w={6} h={flagX > EDGE ? 280 : 136} /> : null}
          {t > c.income - 0.3 ? (
            <g>
              {flagX > EDGE ? <Stroke pts={linePts([flagX, TOPY - 10], [flagX, TOPY + 140], 6, 0, 551)} w={3} color={P.ink} seed={551} taper={false} /> : null}
              <Flag x={flagX} y={TOPY} t={t} h={130} color={flagX > EDGE ? P.coral : P.teal} />
            </g>
          ) : null}
          {envK > 0 && envK < 1 ? <Envelope x={1800 - 860 * envK} y={200 + 240 * envK} rot={-30 + 30 * envK} s={0.6} seed={560} /> : null}
          {t > c.over - 0.1 ? (
            <g>
              <Stroke pts={[[EDGE + 4, TOPY + 70], [flagX, TOPY + 70]]} draw={prog(t, c.over - 0.1, c.over + 0.4, easeOut)} w={5} color={P.coral} seed={570} taper={false} />
              <Stroke pts={[[EDGE + 4, TOPY + 50], [EDGE + 4, TOPY + 90]]} w={5} color={P.coral} seed={571} taper={false} />
              <Stroke pts={[[flagX, TOPY + 50], [flagX, TOPY + 90]]} w={5} color={P.coral} seed={572} taper={false} />
            </g>
          ) : null}
        </svg>
        <Txt x={EDGE + 22} y={104} size={40} k={prog(t, c.four, c.four + 0.6, easeOut)} color={P.coral} qa="fpl" weight={700}>
          400% of the poverty line
        </Txt>
        <Txt x={1560} y={220} size={170} align="center" k={prog(t, c.zero, c.zero + 0.25, easeOut)} color={P.ink} riso={P.coral} qa="zero" weight={800} bounce={80} rot={-4 + (t > c.zero2 && t < c.zero2 + 0.3 ? 3 : 0)}>
          ZERO.
        </Txt>
        <Txt x={EDGE - 80} y={TOPY - 376} size={58} align="center" k={prog(t, c.line, c.line + 0.5, easeOut)} color={P.white} qa="sign" weight={800}>
          $62,600
        </Txt>
        <Txt x={flagX + 30} y={TOPY - 196} size={44} align="center" k={prog(t, c.income, c.income + 0.4, easeOut) * (1 - Math.min(prog(t, c.now - 0.3, c.now - 0.1), 1 - prog(t, c.now + 0.7, c.now + 0.9)))} qa="flagAmt" weight={800} color={flagX > EDGE ? P.coral : P.teal}>
          {flagX > EDGE + 100 ? '$63,000' : '$62,000'}
        </Txt>
        <Tag x={1250} y={520} text="+$1,000 job" fill={P.white} color={P.teal} k={prog(t, c.job, c.job + 0.4, easeOut) * (1 - prog(t, c.now - 0.3, c.now + 0.1))} qa="job" rot={3} size={40} />
        <Txt x={EDGE + 30} y={TOPY + 160} size={44} k={prog(t, c.over, c.over + 0.5, easeOut)} color={P.coral} qa="over" weight={800}>
          $400 over
        </Txt>
        <Txt x={96} y={330} size={58} k={prog(t, c.gone, c.gone + 0.4, easeOut)} color={P.coral} riso={P.ink} qa="gone" weight={800} rot={-4}>
          credit: gone
        </Txt>
      </Cam>
      <Source x={1880} y={46} align="right" text={'single, lower 48: 4 × $15,650 (HHS 2025 poverty guideline)'} k={prog(t, c.single, c.single + 0.5)} qa="srcFpl" />
    </AbsoluteFill>
  );
};

/* ======================= COST ======================= */

export const CostScene: React.FC<SceneProps> = ({t}) => {
  const c = B.cost;
  const f = fr(t);
  const dan = act(f, {
    seed: 33,
    reacts: [
      {t: c.start + 0.2, kind: 'think'},
      {t: c.amount + 0.2, kind: 'shock', hold: 1.6},
      {t: c.ten, kind: 'worry', hold: 1.2},
      {t: c.yes, kind: 'worry'},
      {t: c.move - 0.2, kind: 'think', hold: 1.2},
    ],
    look: [{t: c.start, x: 1, y: -0.3, hold: 6}],
  });
  const grow = prog(t, c.amount - 0.3, c.amount + 1.2, easeOut);
  const nBills = Math.round(grow * 10);
  const month = Math.floor(t / 1.4) % 12;
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const flip = (t / 1.4) % 1;
  return (
    <AbsoluteFill>
      <Paper color={P.paper} id="cost" lines="grid" />
      <Cam t0={c.start} t1={B.move.start} push={0.03} focus={[1300, 480]}>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <Clock x={120} y={120} r={56} t={t} />
          <Shape pts={rectPts(990, 40, 170, 190, 600, 8)} fill={P.white} seed={600} />
          <Shape pts={rectPts(990, 40, 170, 46, 601, 6)} fill={P.coral} seed={601} />
          <Dan name="dan" a={dan} x={430} y={1050} s={1.45} />
          {/* job paid: one bill */}
          <Bill x={1090} y={620} w={200} h={86} seed={610} />
          {/* credit lost: a stack of ~10 bills */}
          {Array.from({length: nBills}).map((_, i) => (
            <Bill key={i} x={1460 + ((i * 7) % 3) * 6} y={620 - i * 36} w={200} h={86} seed={620 + i} rot={((i * 5) % 3) - 1} />
          ))}
          <CircleMark cx={1370} cy={420} rx={110} ry={62} k={prog(t, c.ten, c.ten + 0.5, easeOut)} color={P.teal} />
        </svg>
        <Txt x={1075} y={110} size={52} align="center" k={1} weight={800} qa="month" color={P.ink}>
          {MONTHS[month]}
        </Txt>
        <Txt x={1190} y={728} size={40} align="center" k={prog(t, c.start, c.start + 0.5, easeOut)} qa="jobLbl">
          the job paid
        </Txt>
        <Txt x={1190} y={530} size={60} align="center" k={prog(t, c.start + 0.3, c.start + 0.7, easeOut)} color={P.teal} weight={800} qa="jobAmt">
          $1,000
        </Txt>
        <Txt x={1560} y={728} size={40} align="center" k={prog(t, c.start + 0.4, c.start + 0.9, easeOut)} qa="creditLbl">
          credit he lost
        </Txt>
        <Txt x={1560} y={150} size={70} align="center" k={grow > 0 ? 1 : 0} color={P.coral} weight={800} qa="creditAmt" riso={P.ink}>
          {'≈ ' + money(9700 * grow) + '/yr'}
        </Txt>
        <Txt x={1560} y={232} size={34} align="center" k={prog(t, c.amount + 0.4, c.amount + 0.9, easeOut)} color={P.ink} weight={700} qa="estimate">
          estimate · varies by county
        </Txt>
        <Txt x={1370} y={380} size={64} align="center" k={prog(t, c.ten - 0.1, c.ten + 0.3, easeOut)} color={P.teal} weight={800} qa="tenX">
          {'≈ 10×'}
        </Txt>
        <Txt x={220} y={130} size={78} k={prog(t, c.poorer - 0.2, c.poorer + 0.3, easeOut)} qa="poorer" weight={800} rot={-3}>
          poorer?
        </Txt>
        <Txt x={540} y={130} size={86} k={prog(t, c.yes, c.yes + 0.25, easeOut)} color={P.coral} riso={P.ink} qa="yes" weight={800} rot={-6} bounce={70}>
          YES.
        </Txt>
      </Cam>
      <Source x={1880} y={790} align="right" text={'KFF 2026 avg benchmark $625/mo at 40 × CMS age curve (60 vs 40) − 9.96% of $62,000 (IRS)'} k={prog(t, c.amount, c.amount + 0.5)} qa="srcCost" />
    </AbsoluteFill>
  );
};

/* ======================= MOVE (MAGI) ======================= */

const valX = (v: number) => 1000 + (v - 61000) * (780 / 3000);

export const MoveScene: React.FC<SceneProps> = ({t}) => {
  const m = B.move;
  const f = fr(t);
  const dan = act(f, {
    seed: 34,
    reacts: [
      {t: m.magi, kind: 'think', hold: 1.4},
      {t: m.ira + 0.3, kind: 'nod'},
      {t: m.under, kind: 'relief', hold: 1.5},
      {t: m.credit, kind: 'smile', hold: 1.6},
    ],
    look: [{t: m.magi, x: 1, y: -0.6, hold: 2.4}, {t: m.ira, x: 1, y: 0.4, hold: 3}],
  });
  const v = 63000 - 1000 * prog(t, m.ira + 0.4, m.under, easeInOut);
  const mx = valX(v);
  const lineX = valX(62600);
  const ira = prog(t, m.ira, m.ira + 1.6, easeOut);
  const payK = 1 - prog(t, m.magi - 0.2, m.magi + 0.2);
  return (
    <AbsoluteFill>
      <Paper color={P.paper} id="move" lines="ruled" />
      <Cam t0={m.start} t1={B.status.start} push={0.03} focus={[1250, 480]}>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          {[0, 1].map((i) => (
            <g key={i} transform={`rotate(${Math.sin(t * 1.6 + i * 2) * 2.5 + (i ? 5 : -4)} ${i ? 1840 : 760} ${i ? 840 : 70})`}>
              <Shape pts={rectPts(i ? 1740 : 680, i ? 820 : 40, 150, 140, 640 + i, 4)} fill={i ? P.mustardPale : P.coralPale} seed={640 + i} w={3} />
            </g>
          ))}
          <Dan name="dan" a={dan} x={420} y={1050} s={1.45} />
          {payK > 0 ? (
            <g opacity={payK}>
              <Card x={1000} y={120} w={420} h={200} seed={650} />
              <CrossOut x={1010} y={130} w={400} h={180} k={prog(t, m.paycheck - 0.2, m.paycheck + 0.3, easeOut)} />
            </g>
          ) : null}
          <Stroke pts={linePts([valX(61000), 430], [valX(64000), 432], 16, 0, 660)} w={6} seed={660} />
          {[61000, 62000, 63000, 64000].map((vv, i) => (
            <Stroke key={i} pts={[[valX(vv), 412], [valX(vv), 452]]} w={4} seed={661 + i} taper={false} />
          ))}
          <Stroke pts={linePts([lineX, 340], [lineX, 520], 8, 0, 670)} w={6} color={P.coral} seed={670} taper={false} />
          <Shape pts={[[mx, 420], [mx - 24, 380], [mx + 24, 380]]} fill={v <= 62600 ? P.teal : P.coral} seed={671} />
          <Arrow from={[mx + 60, 330]} to={[mx - 60, 340]} k={prog(t, m.lower, m.lower + 0.5, easeOut) * (1 - prog(t, m.under, m.under + 0.4))} color={P.teal} bow={20} />
          <Jar x={1150} y={800} level={ira * 0.8} lid={P.teal} seed={680} />
          <Jar x={1520} y={800} level={prog(t, m.hsa, m.hsa + 1.2, easeOut) * 0.4} lid={P.coral} seed={690} />
          {t > m.ira && t < m.ira + 1.6
            ? Array.from({length: 5}).map((_, i) => {
                const d = (t - m.ira - i * 0.25) / 0.5;
                if (d < 0 || d > 1) return null;
                return <Coin key={i} x={1150 + (i % 2 ? 12 : -12)} y={500 + d * 240} r={15} seed={700 + i} rot={d * 300} />;
              })
            : null}
          {[0, 1, 2].map((i) => {
            const at = [m.job, m.money, m.credit][i];
            return (
              <Stroke key={i} pts={[[110, 130 + i * 84], [128, 152 + i * 84], [168, 104 + i * 84]]} draw={prog(t, at - 0.1, at + 0.3, easeOut)} color={P.teal} w={8} seed={710 + i} />
            );
          })}
        </svg>
        <Txt x={1210} y={150} size={44} k={payK > 0 ? prog(t, m.start, m.start + 0.4, easeOut) : 0} opacity={payK} qa="paycheck">
          his paycheck
        </Txt>
        <Txt x={1400} y={92} size={140} align="center" k={prog(t, m.magi, m.magi + 0.4, easeOut)} qa="magi" weight={800} riso={P.mustard}>
          MAGI
        </Txt>
        <Txt x={1400} y={268} size={36} align="center" k={prog(t, m.magi + 0.2, m.magi + 1.2, easeOut)} color={P.inkSoft} qa="magiLong">
          modified adjusted gross income
        </Txt>
        <Txt x={lineX} y={530} size={34} align="center" k={prog(t, m.start, m.start + 0.5, easeOut)} color={P.coral} qa="lineLbl" weight={700}>
          $62,600 line
        </Txt>
        <Txt x={mx} y={326} size={34} align="center" k={prog(t, m.start + 0.3, m.start + 0.7, easeOut)} color={v <= 62600 ? P.teal : P.coral} qa="danMagi" weight={800}>
          {money(v)}
        </Txt>
        <Tag x={1150} y={566} text="IRA" align="center" fill={P.white} color={P.teal} k={prog(t, m.ira - 0.2, m.ira + 0.2, easeOut)} qa="ira" size={40} />
        <Tag x={1520} y={566} text="HSA" align="center" fill={P.white} color={P.coral} k={prog(t, m.hsa - 0.2, m.hsa + 0.2, easeOut)} qa="hsa" size={40} />
        <Txt x={1520} y={838} size={32} align="center" k={prog(t, m.hsa + 0.6, m.hsa + 1.2, easeOut)} color={P.inkSoft} qa="qualifies">
          if his plan qualifies
        </Txt>
        <Txt x={190} y={112} size={44} k={prog(t, m.job - 0.1, m.job + 0.3, easeOut)} qa="keepsJob">
          keeps the job
        </Txt>
        <Txt x={190} y={196} size={44} k={prog(t, m.money - 0.1, m.money + 0.3, easeOut)} qa="keepsMoney">
          keeps the money (saved)
        </Txt>
        <Txt x={190} y={280} size={44} k={prog(t, m.credit - 0.1, m.credit + 0.3, easeOut)} qa="keepsCredit" color={P.teal} weight={800}>
          keeps his credit
        </Txt>
      </Cam>
    </AbsoluteFill>
  );
};

/* ======================= STATUS ======================= */

export const StatusScene: React.FC<SceneProps> = ({t}) => {
  const s = B.status;
  const f = fr(t);
  const dan = act(f, {seed: 35, reacts: [{t: s.house, kind: 'nod'}, {t: s.senate + 0.3, kind: 'worry', hold: 1.4}, {t: s.check, kind: 'think'}], look: [{t: s.start, x: 1, y: -0.2, hold: 5}]});
  return (
    <AbsoluteFill>
      <Paper color={P.sky} id="status" />
      <Cam t0={s.start} t1={B.close.start} push={0.03} focus={[1100, 460]}>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <Clouds t={t} y={60} n={5} speed={12} seed={91} s={0.8} />
          <Shape pts={rectPts(-40, 800, W + 80, 320, 720, 6)} fill={P.grass} seed={720} />
          <Capitol x={720} y={760} s={1.2} />
          <Flag x={720} y={400} t={t} h={110} color={P.coral} seed={730} />
          <Shape pts={rectPts(1180, 120, 650, 620, 740, 8)} fill={P.mustardPale} seed={740} />
          <Shape pts={ellipsePts(1505, 140, 16, 16, 741, 10)} fill={P.coral} seed={741} />
          <Dan name="dan" a={dan} x={250} y={1080} s={1.0} pose="phone" />
        </svg>
        <Txt x={1220} y={170} size={40} k={prog(t, s.start, s.start + 0.6, easeOut)} color={P.teal} qa="asOf" weight={800}>
          status as of Oct 16, 2026
        </Txt>
        <Txt x={1220} y={270} size={44} k={prog(t, s.house - 0.1, s.house + 0.6, easeOut)} qa="house">
          {'House: passed 230–196'}
        </Txt>
        <Txt x={1240} y={328} size={34} k={prog(t, s.house + 0.3, s.house + 0.8, easeOut)} color={P.inkSoft} qa="houseDate">
          (Jan 8, 2026)
        </Txt>
        <Txt x={1220} y={410} size={44} k={prog(t, s.senate - 0.1, s.senate + 0.5, easeOut)} color={P.coral} qa="senate" weight={800}>
          Senate: no vote
        </Txt>
        <Txt x={1220} y={490} size={52} k={prog(t, s.senate + 0.5, s.senate + 1.0, easeOut)} qa="notLaw" weight={800}>
          not law yet
        </Txt>
        <Tag x={1220} y={600} text="check before you plan" fill={P.teal} color={P.white} k={prog(t, s.check, s.check + 0.4, easeOut)} qa="check" size={38} />
      </Cam>
      <Source x={1880} y={46} align="right" text="Ballotpedia (Jan 12) · Sen. Heinrich (Jan 14) · healthinsurancenetwork.org (Sept 2026)" k={prog(t, s.house, s.house + 0.5)} qa="srcStatus" />
    </AbsoluteFill>
  );
};

/* ======================= CLOSE + final beat ======================= */

export const CloseScene: React.FC<SceneProps> = ({t}) => {
  const c = B.close;
  const e = B.end;
  const f = fr(t);
  const maya = act(f, {seed: 15, reacts: [{t: c.never, kind: 'smile', hold: 1.5}, {t: c.bucket, kind: 'nod'}], look: [{t: c.start, x: 1, y: -0.2, hold: 4}]});
  const dan = act(f, {seed: 36, reacts: [{t: c.cliffs, kind: 'worry'}, {t: c.cliff, kind: 'nod'}, {t: e.action + 0.6, kind: 'surprise'}], look: [{t: c.start, x: -1, y: -0.2, hold: 4}]});
  const walkIn = prog(t, c.next - 0.6, c.next + 0.8, easeOut);
  const walkEdge = prog(t, e.action, e.action + 1.4, easeInOut);
  const cwX = 960 + 140 * walkEdge;
  const walking = (walkIn > 0 && walkIn < 1) || (walkEdge > 0 && walkEdge < 1) ? 1 : 0;
  const cw = act(f, {
    seed: 26,
    reacts: [{t: c.question, kind: 'think'}, {t: e.action + 1.3, kind: 'worry', hold: 2.2}],
    talk: [[c.next + 0.9, c.question - 0.3]],
    look: [{t: c.bucket, x: -1, y: 0.2, hold: 0.5}, {t: c.cliff, x: 1, y: 0.2, hold: 0.8}, {t: e.action + 1.2, x: 1, y: 0.8, hold: 4}],
  });
  cw.lean += walkEdge * 6;
  const fill = 0.55 + 0.45 * prog(t, e.action, e.action + 1.8, easeOut);
  const titlesK = prog(t, c.start - 0.2, c.start + 0.4, easeOut);
  const disclaim = prog(t, e.hold - 0.2, e.hold + 0.3, easeOut);
  return (
    <AbsoluteFill>
      <Paper color={P.tealPale} id="closeL" />
      <AbsoluteFill style={{clipPath: `polygon(960px 0, ${W}px 0, ${W}px ${H}px, 960px ${H}px)`}}>
        <Paper color={P.salmon} id="closeR" />
      </AbsoluteFill>
      <Cam t0={c.start} t1={TL_END()} push={0.025} focus={[960, 520]}>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <Stroke pts={linePts([960, -20], [962, H + 20], 14, 0, 760)} w={6} seed={760} />
          <Bucket x={640} y={500} w={300} h={330} level={fill} seed={770} t={t} qa="closeBucket" />
          {t > e.action && t < e.action + 1.6
            ? Array.from({length: 8}).map((_, i) => {
                const d = (t - e.action - i * 0.17) / 0.5;
                if (d < 0 || d > 1) return null;
                return <Coin key={i} x={640 + (hash2(780, i) - 0.5) * 120} y={-30 + d * (500 + 330 * (1 - fill))} r={16} seed={780 + i} rot={d * 300} />;
              })
            : null}
          <CliffBlock x={1180} y={600} w={420} h={520} seed={790} />
          <Maya name="maya" a={maya} x={230} y={1080} s={1.0} />
          <Dan name="dan" a={dan} x={1760} y={1080} s={1.0} flip />
          {walkIn > 0 ? <Coworker name="cw" a={cw} x={cwX} y={1180 - 266 * walkIn} s={0.8} legs walk={walking} walkPhase={t * 9} /> : null}
        </svg>
        <Txt x={480} y={54} size={96} align="center" k={titlesK} color={P.teal} riso={P.ink} qa="bucketTitle" weight={800}>
          BUCKET
        </Txt>
        <Txt x={480} y={160} size={38} align="center" k={prog(t, c.never, c.never + 0.6, easeOut)} qa="neverPunish">
          never punishes a raise
        </Txt>
        <Txt x={1440} y={54} size={96} align="center" k={titlesK} color={P.coral} riso={P.ink} qa="cliffTitle" weight={800}>
          CLIFF
        </Txt>
        <Txt x={1440} y={160} size={38} align="center" k={prog(t, c.cliffs, c.cliffs + 0.5, easeOut)} qa="different">
          different.
        </Txt>
        <div style={{position: 'absolute', left: 645, top: 222, width: 630, height: 118, borderRadius: 22, background: 'rgba(255,253,247,0.92)', border: `4px solid ${P.ink}`, opacity: prog(t, c.bucket - 0.4, c.bucket + 0.1, easeOut), transform: 'rotate(-1deg)'}} />
        <Txt x={960} y={238} size={72} align="center" k={prog(t, c.bucket - 0.4, c.bucket + 0.1, easeOut)} qa="question" weight={800} riso={P.mustard}>
          bucket or cliff?
        </Txt>
        {disclaim > 0 ? (
          <div style={{position: 'absolute', left: 360, top: 902, width: 1200, height: 132, background: 'rgba(255,253,247,0.95)', border: `4px solid ${P.ink}`, borderRadius: 18, opacity: disclaim, transform: `rotate(-0.6deg) scale(${0.9 + 0.1 * disclaim})`}} />
        ) : null}
        <Txt x={960} y={918} size={44} align="center" k={disclaim} qa="disclaimer" weight={800}>
          Educational, not tax advice.
        </Txt>
        <Txt x={960} y={982} size={28} align="center" k={disclaim} qa="sources" weight={600} color={P.inkSoft}>
          {'Sources: IRS · HHS · KFF · CMS · Congress (status checked Oct 16, 2026)'}
        </Txt>
      </Cam>
    </AbsoluteFill>
  );
};

import {TL} from './lib';
const TL_END = () => TL.duration;
export const unused = [Bill, Envelope, Maya, easeIn];
