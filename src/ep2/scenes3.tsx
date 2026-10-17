import React from 'react';
import {AbsoluteFill} from 'remotion';
import {act} from './acting';
import {Linda} from './characters';
import {Arrow, CircleMark, Shape, Stroke, Underline, ellipsePts, linePts, rectPts} from './ink';
import {END, H, P, TL, W, WT, clamp01, easeIn, easeInOut, easeOut, frF, hash2, prog} from './lib';
import {Bucket, Card, CliffBlock, Clock, Coin, Dust, LightShaft, Plant, Window} from './props';
import {CalendarPage, Cake, Door, Leaves, Stamp, Drip, sharp} from './props2';
import {SceneProps} from './scenes1';
import {Cam, Paper} from './stage';
import {Source, Tag, Txt, money} from './text';

const fr = frF;

/* ======================= FIX: spread it out ======================= */

const Y0 = 820; // $0
const PX = 470 / 115000; // px per dollar
const yOf = (v: number) => Y0 - v * PX;
const LINE = 109000;

const Bar: React.FC<{x: number; w: number; base: number; extra: number; k: number; seed: number}> = ({x, w, base, extra, k, seed}) => {
  if (k <= 0) return null;
  const e = easeOut(clamp01(k));
  const yb = yOf(base * Math.min(1, e * 1.4));
  const ye = yOf(base + extra * clamp01(e * 1.6 - 0.6));
  return (
    <g>
      <Shape pts={rectPts(x, yb, w, Y0 - yb, seed, 6)} fill={P.tealLight} seed={seed} w={4.5} />
      {ye < yb - 2 ? <Shape pts={rectPts(x, ye, w, yb - ye, seed + 1, 6)} fill={P.mustard} seed={seed + 1} w={4.5} /> : null}
    </g>
  );
};

export const FixScene: React.FC<SceneProps> = ({t}) => {
  const f = fr(t);
  const done = WT('f1', 'done');
  const spread = WT('f2', 'spread');
  const oneYear = WT('f3', '$14,000');
  const overC = WT('f3', 'cliff');
  const two = WT('f4', '$7,000');
  const bucketW = WT('f4', 'bucket');
  const roth = WT('f5', 'Roth');
  const stock = WT('f5', 'stock');
  const check = WT('f6', 'Check');
  const close = WT('f7', 'close');
  const hundred = WT('f7', 'hundred');
  const dec = WT('f8', 'December');
  const age = WT('f9', 'age');
  const s63 = WT('f10', '63');
  const s65 = WT('f10', '65');
  const linda = act(f, {
    seed: 56,
    reacts: [{t: done, kind: 'think', hold: 1.2}, {t: overC, kind: 'worry'}, {t: bucketW, kind: 'smile', hold: 1.4}, {t: check + 0.2, kind: 'nod'}, {t: dec + 0.2, kind: 'smile'}, {t: s65 + 0.2, kind: 'surprise'}],
    look: [{t: spread, x: 1, y: -0.3, hold: 20}, {t: dec - 0.5, x: 1, y: -0.5, hold: 10}],
  });
  const phase2 = prog(t, dec - 0.9, dec - 0.2, easeInOut); // chart leaves, December + age arrive
  const chartX = -phase2 * 1900;
  const panelA = prog(t, oneYear - 0.3, oneYear + 0.9);
  const panelB = prog(t, two - 0.3, two + 0.9);
  const tick = prog(t, check, check + 0.5);
  return (
    <AbsoluteFill>
      <Paper color={P.paper} id="fix" lines="grid" />
      <Cam t0={WT('f1') - 0.4} t1={176.2} push={0.03} focus={[1000, 520]}>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <Clock x={1800} y={110} t={t} r={58} />
          <Window x={60} y={70} w={330} h={290} seed={600} blinds>
            <rect x={60} y={70} width={330} height={290} fill={P.sky} />
          </Window>
          <LightShaft t={t} pts={[[390, 90], [390, 360], [760, 900], [1060, 900]]} />
          <Dust t={t} x={400} y={120} w={600} h={720} seed={31} n={20} />
          <Shape pts={rectPts(-40, 860, W + 80, 260, 601, 6)} fill={P.wood} seed={601} w={6} />
          {/* steam from a mug on the table */}
          <Shape pts={rectPts(560, 770, 90, 92, 602, 14)} fill={P.coralPale} seed={602} />
          {[0, 1].map((i) => (
            <Stroke key={i} pts={[[585 + i * 30, 760], [575 + i * 30 + Math.sin(t * 2 + i) * 8, 720], [590 + i * 30, 680]]} w={3.5} color={P.inkSoft} seed={603 + i} />
          ))}
          {/* chart: one year vs two years */}
          <g transform={`translate(${chartX},0)`}>
            {panelA > 0 ? (
              <g>
                <Bar x={800} w={150} base={95500} extra={14000} k={panelA} seed={610} />
              </g>
            ) : null}
            {panelB > 0 ? (
              <g>
                <Bar x={1290} w={130} base={95500} extra={7000} k={panelB} seed={620} />
                <Bar x={1480} w={130} base={95500} extra={7000} k={prog(t, two + 0.2, two + 1.1)} seed={630} />
              </g>
            ) : null}
            {t > spread - 0.3
              ? Array.from({length: 16}).map((_, i) => (
                  <Stroke key={i} pts={[[740 + i * 60, yOf(LINE) + (i % 2) * 2], [772 + i * 60, yOf(LINE) + 1]]} w={6} color={P.berry} seed={640 + i} taper={false} />
                ))
              : null}
            {t > spread - 0.3 ? <Stroke pts={linePts([740, Y0], [1700, Y0 + 2], 10, 0, 660)} w={5} seed={660} /> : null}
            {tick > 0 ? <Stroke pts={[[1660, yOf(LINE) + 40], [1690, yOf(LINE) + 74], [1750, yOf(LINE) - 10]]} w={9} color={P.teal} seed={661} draw={tick} /> : null}
            {t > close ? <CircleMark cx={1545} cy={yOf(LINE) + 30} rx={150} ry={46} k={prog(t, hundred - 0.3, hundred + 0.3)} color={P.berry} /> : null}
          </g>
          {/* phase 2: December, and the age that counts */}
          {phase2 > 0 ? (
            <g transform={`translate(${(1 - phase2) * 1300},0)`}>
              <CalendarPage x={680} y={170} w={400} h={360} seed={670} rot={-2} />
              {t > age - 0.3 ? <Cake x={1260} y={640} t={t} /> : null}
              {t > s65 - 0.4 ? <Card x={1540} y={470} w={330} h={170} seed={680} rot={3} fill={P.white} /> : null}
              {t > s63 ? <Arrow from={[1390, 560]} to={[1550, 540]} k={prog(t, WT('f10', 'sets'), s65)} color={P.berry} bow={-30} /> : null}
            </g>
          ) : null}
          <Linda name="linda" a={linda} x={300} y={1080} s={1.25} pose={t > check - 0.4 && t < dec + 2 ? 'pencil' : 'neutral'} />
        </svg>
        <div style={{position: 'absolute', left: chartX, top: 0, width: W, height: H, display: phase2 >= 1 ? 'none' : 'block'}}>
          <Txt x={875} y={160} size={46} align="center" k={panelA} qa="oneYear" weight={800}>
            one year
          </Txt>
          <Txt x={875} y={216} size={34} align="center" k={panelA} qa="oneYearAmt" color={P.inkSoft}>
            +$14,000
          </Txt>
          <Txt x={875} y={yOf(109500) - 92} size={40} align="center" k={prog(t, overC - 0.2, overC + 0.2)} qa="overTag" color={P.berry} weight={800}>
            cliff
          </Txt>
          <Txt x={1450} y={160} size={46} align="center" k={panelB} qa="twoYears" weight={800}>
            two years
          </Txt>
          <Txt x={1450} y={216} size={34} align="center" k={panelB} qa="twoYearsAmt" color={P.inkSoft}>
            +$7,000 each
          </Txt>
          <Txt x={1450} y={yOf(LINE) - 92} size={40} align="center" k={prog(t, bucketW - 0.2, bucketW + 0.2)} qa="underTag" color={P.teal} weight={800}>
            bucket
          </Txt>
          <Txt x={875} y={Y0 + 10} size={28} align="center" k={panelA} qa="y2024a" color={P.inkSoft}>
            2024
          </Txt>
          <Txt x={1355} y={Y0 + 10} size={28} align="center" k={panelB} qa="y2023b" color={P.inkSoft}>
            2023
          </Txt>
          <Txt x={1545} y={Y0 + 10} size={28} align="center" k={panelB} qa="y2024b" color={P.inkSoft}>
            2024
          </Txt>
          <Txt x={730} y={yOf(LINE) - 18} size={28} align="right" k={prog(t, spread - 0.3, spread)} qa="lineFix" color={P.berry}>
            $109,000
          </Txt>
          <Tag x={968} y={470} text="Roth conversions" k={prog(t, roth - 0.2, roth + 0.2) * (1 - phase2)} fill={P.white} size={30} rot={-3} qa="roth" />
          <Tag x={978} y={540} text="big stock sales" k={prog(t, stock - 0.2, stock + 0.2) * (1 - phase2)} fill={P.white} size={30} rot={2} qa="stock" />
          <Txt x={1545} y={yOf(LINE) + 84} size={28} align="center" k={prog(t, hundred - 0.2, hundred + 0.2)} qa="fewHundred" color={P.berry}>
            a few hundred $
          </Txt>
        </div>
        {phase2 > 0 ? (
          <div style={{position: 'absolute', left: (1 - phase2) * 1300, top: 0, width: W, height: H}}>
            <Txt x={880} y={176} size={44} align="center" k={phase2} qa="decHead" color={P.white} weight={800} rot={-2}>
              DEC
            </Txt>
            <Txt x={880} y={250} size={32} align="center" k={phase2} qa="decSub" color={P.inkSoft} rot={-2}>
              check your number
            </Txt>
            <Txt x={1260} y={680} size={48} align="center" k={prog(t, s63 - 0.2, s63 + 0.2)} qa="age63" weight={800}>
              age 63
            </Txt>
            <Txt x={1260} y={740} size={28} align="center" k={prog(t, s63, s63 + 0.3)} qa="age63sub" color={P.inkSoft}>
              this income...
            </Txt>
            <Txt x={1705} y={492} size={40} align="center" k={prog(t, s65 - 0.3, s65 + 0.2)} qa="age65" weight={800} rot={3}>
              age 65
            </Txt>
            <Txt x={1705} y={552} size={26} align="center" k={prog(t, s65, s65 + 0.3)} qa="age65sub" color={P.berry} rot={3}>
              ...sets this premium
            </Txt>
          </div>
        ) : null}
        {phase2 > 0 ? (
          <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none'}}>
            <g transform={`translate(${(1 - phase2) * 1300},0)`}>
              <CircleMark cx={1004} cy={440} rx={36} ry={22} k={prog(t, dec, dec + 0.5)} color={P.berry} />
            </g>
          </svg>
        ) : null}
      </Cam>
    </AbsoluteFill>
  );
};

/* ======================= ESCAPE: form SSA-44 ======================= */

export const EscapeScene: React.FC<SceneProps> = ({t}) => {
  const f = fr(t);
  const out = WT('x1', 'out');
  const event = WT('x2', 'life-changing');
  const retiring = WT('x2', 'retiring');
  const spouse = WT('x2', 'spouse');
  const form = WT('x2', 'SSA-44');
  const lower = WT('x2', 'newer');
  const roof = WT('x3', 'roof');
  const isnt = WT('x3', "isn't");
  const pays = WT('x4', 'pays');
  const linda = act(f, {
    seed: 57,
    reacts: [{t: out, kind: 'surprise'}, {t: form + 0.2, kind: 'smile', hold: 1.2}, {t: roof + 0.1, kind: 'think'}, {t: isnt + 0.3, kind: 'worry', hold: 1.2}, {t: pays + 0.1, kind: 'worry', hold: 1.5}],
    look: [{t: out, x: -1, y: -0.2, hold: 14}],
  });
  const open = prog(t, out - 0.3, out + 0.6, easeOut) * (1 - prog(t, pays, pays + 0.6, easeIn));
  const formK = prog(t, event - 0.4, event + 0.2, easeOut);
  const titleK = prog(t, form - 0.3, form + 0.3, easeOut);
  const roofK = prog(t, roof - 0.4, roof + 0.1, easeOut);
  return (
    <AbsoluteFill>
      <Paper color={P.paperWarm} id="escape" />
      <Cam t0={WT('x1') - 0.4} t1={196.5} push={0.03} focus={[860, 520]}>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          {Array.from({length: 20}).map((_, i) => (
            <rect key={i} x={i * 100} y={0} width={36} height={880} fill={P.paperShade} opacity={0.3} />
          ))}
          <Shape pts={rectPts(-40, 880, W + 80, 260, 700, 6)} fill={P.woodDark} seed={700} w={6} />
          {open > 0.05 ? <LightShaft t={t} pts={[[140, 320], [500, 320], [760, 900], [-80, 900]]} color="#FFF0C4" /> : null}
          <Door x={320} y={880} open={open} />
          <Plant x={620} y={880} t={t} s={1.1} />
          {formK > 0 ? (
            <g transform={`translate(0,${(1 - formK) * 120})`} opacity={clamp01(formK * 2)}>
              <Card x={760} y={180} w={540} h={560} seed={710} rot={-1.5} qa="form" />
              {[0, 1].map((i) => (
                <Shape key={i} pts={rectPts(800, 362 + i * 70, 36, 36, 711 + i, 4)} fill={P.white} seed={711 + i} w={3.5} />
              ))}
              {[0, 1, 2].map((i) => (
                <Stroke key={i} pts={[[800, 560 + i * 34], [1240 - (i % 3) * 60, 560 + i * 34]]} w={3} color={P.inkSoft} seed={715 + i} taper={false} />
              ))}
            </g>
          ) : null}
          {formK > 0 ? <Arrow from={[1030, 560]} to={[1030, 690]} k={prog(t, lower - 0.2, lower + 0.4)} color={P.teal} /> : null}
          {/* ticks for the two events she named */}
          {t > retiring ? <Stroke pts={[[804, 380], [818, 396], [846, 358]]} w={7} color={P.teal} seed={719} draw={prog(t, retiring, retiring + 0.3)} /> : null}
          {t > spouse ? <Stroke pts={[[804, 450], [818, 466], [846, 428]]} w={7} color={P.teal} seed={718} draw={prog(t, spouse, spouse + 0.3)} /> : null}
          {roofK > 0 ? (
            <g transform={`translate(${(1 - roofK) * 500},0)`}>
              <Card x={1360} y={130} w={260} h={240} seed={720} rot={4} />
              <Shape pts={sharp([[1390, 245], [1490, 170], [1590, 245]], 26)} fill="#8E5A4A" seed={721} w={4} />
              <Shape pts={rectPts(1412, 245, 156, 96, 722, 4)} fill="#E7D5B5" seed={722} w={4} />
              <Drip t={t} t0={roof - 0.4} x={1490} y0={256} y1={330} every={0.8} />
            </g>
          ) : null}
          <Stamp x={1490} y={250} k={prog(t, isnt, isnt + 0.25)} w={300} h={92} rot={-12} />
          <Linda name="linda" a={linda} x={1660} y={1080} s={1.3} pose={t > pays - 0.2 ? 'shrug' : 'neutral'} />
        </svg>
        <Tag x={190} y={250} text="one way out" k={prog(t, out - 0.2, out + 0.2)} fill={P.white} size={34} rot={-3} qa="wayOut" />
        <Txt x={860} y={360} size={32} k={formK} qa="lce1" weight={700}>
          stopped or cut back work
        </Txt>
        <Txt x={860} y={430} size={32} k={formK} qa="lce2" weight={700}>
          spouse died
        </Txt>
        <Txt x={804} y={500} size={26} k={formK} color={P.inkSoft} qa="lceMore">
          + marriage, divorce, lost pension...
        </Txt>
        <Txt x={1030} y={196} size={36} align="center" k={formK} qa="lceHead" color={P.berry} weight={800}>
          life-changing event
        </Txt>
        <Txt x={1030} y={244} size={64} align="center" k={titleK} qa="ssa44" weight={800} riso={P.teal}>
          Form SSA-44
        </Txt>
        <Txt x={1030} y={700} size={34} align="center" k={prog(t, lower, lower + 0.4)} qa="lowerInc" color={P.teal} weight={800}>
          use the newer, lower income
        </Txt>
        <Txt x={1490} y={228} size={34} align="center" k={prog(t, isnt + 0.05, isnt + 0.25)} qa="notList" color={P.berry} weight={800} rot={-12}>
          NOT ON THE LIST
        </Txt>
        <Source x={760} y={790} text="SSA · life-changing events, Form SSA-44" k={formK} qa="srcSsa44" />
      </Cam>
    </AbsoluteFill>
  );
};

/* ======================= NOTE: dated numbers ======================= */

export const NoteScene: React.FC<SceneProps> = ({t}) => {
  const f = fr(t);
  const nums = WT('n2', '2026');
  const nov = WT('n3', 'November');
  const plan = WT('n3', 'plan');
  const linda = act(f, {seed: 58, reacts: [{t: WT('n1'), kind: 'think'}, {t: nov + 0.2, kind: 'nod'}, {t: plan, kind: 'smile', hold: 1.2}], look: [{t: WT('n1'), x: 1, y: -0.4, hold: 9}]});
  return (
    <AbsoluteFill>
      <Paper color={P.tealPale} id="note" />
      <Cam t0={WT('n1') - 0.4} t1={205.3} push={0.03} focus={[960, 520]}>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <Window x={1400} y={90} w={420} h={340} seed={800} blinds={false}>
            <rect x={1400} y={90} width={420} height={340} fill={P.sky} />
            <Leaves t={t} n={8} seed={801} x0={1400} w={420} />
          </Window>
          <Clock x={1160} y={150} t={t} r={60} />
          <Shape pts={rectPts(-40, 880, W + 80, 260, 802, 6)} fill={P.wood} seed={802} w={6} />
          <CalendarPage x={570} y={250} w={580} h={480} seed={803} rot={-1.5} />
          <CircleMark cx={860} cy={622} rx={190} ry={50} k={prog(t, nov, nov + 0.5)} color={P.berry} />
          <Linda name="linda" a={linda} x={300} y={1080} s={1.25} pose={t > nov - 0.6 ? 'pencil' : 'neutral'} />
        </svg>
        <Txt x={860} y={260} size={44} align="center" k={prog(t, WT('n1'), WT('n1') + 0.4)} color={P.white} weight={800} qa="novHead" rot={-1.5}>
          NOVEMBER
        </Txt>
        <Txt x={860} y={380} size={38} align="center" k={prog(t, nums - 0.2, nums + 0.3)} qa="nums" weight={800} rot={-1.5}>
          these are 2026 numbers
        </Txt>
        <Txt x={860} y={600} size={36} align="center" k={prog(t, nov - 0.2, nov + 0.3)} qa="newLines" color={P.berry} weight={800} rot={-1.5}>
          2027 lines come out
        </Txt>
        <Tag x={1160} y={520} text="checked Oct 17, 2026" k={prog(t, plan - 0.4, plan)} fill={P.white} size={30} rot={3} qa="checked" />
        <Source x={640} y={790} text="CMS announces next year's Part B premiums and IRMAA lines each fall" k={prog(t, nov, nov + 0.4)} qa="srcNote" />
      </Cam>
    </AbsoluteFill>
  );
};

/* ======================= CLOSE: bucket or cliff ======================= */

export const CloseScene: React.FC<SceneProps> = ({t}) => {
  const f = fr(t);
  const brackets = WT('e1', 'brackets');
  const bucketsW = WT('e1', 'buckets');
  const cliffW = WT('e2', 'cliff');
  const question = WT('e3', 'question');
  const bucketQ = WT('e4', 'Bucket');
  const e = END;
  const linda = act(f, {
    seed: 59,
    reacts: [{t: cliffW, kind: 'worry'}, {t: question, kind: 'think'}, {t: e.action + 0.5, kind: 'relief', hold: 1.6}, {t: e.action + 1.6, kind: 'smile', hold: 2.5}],
    look: [{t: brackets, x: -1, y: -0.2, hold: 2}, {t: cliffW, x: 1, y: 0.6, hold: 2}, {t: e.action, x: 1, y: 0.8, hold: 0.8}],
  });
  const fill = 0.5 + 0.45 * prog(t, e.action, e.action + 1.8, easeOut);
  // final action: Linda steps back from the edge
  const back = prog(t, e.action, e.action + 1.2, easeInOut);
  const lx = 1460 - 150 * back;
  const walking = back > 0 && back < 1 ? 1 : 0;
  const titlesK = prog(t, WT('e1') - 0.2, WT('e1') + 0.4, easeOut);
  const disclaim = prog(t, e.hold - 0.2, e.hold + 0.3, easeOut);
  return (
    <AbsoluteFill>
      <Paper color={P.tealPale} id="closeL" />
      <AbsoluteFill style={{clipPath: `polygon(960px 0, ${W}px 0, ${W}px ${H}px, 960px ${H}px)`}}>
        <Paper color={P.salmon} id="closeR" />
      </AbsoluteFill>
      <Cam t0={WT('e1') - 0.3} t1={TL.duration} push={0.025} focus={[960, 520]}>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <Stroke pts={linePts([960, -20], [962, H + 20], 14, 0, 900)} w={6} seed={900} />
          <Bucket x={520} y={460} w={320} h={350} level={fill} seed={901} t={t} qa="closeBucket" />
          {t > e.action && t < e.action + 1.8
            ? Array.from({length: 8}).map((_, i) => {
                const d = (t - e.action - i * 0.18) / 0.5;
                if (d < 0 || d > 1) return null;
                return <Coin key={i} x={520 + (hash2(910, i) - 0.5) * 140} y={-30 + d * (480 + 350 * (1 - fill))} r={16} seed={910 + i} rot={d * 300} />;
              })
            : null}
          <Shape pts={rectPts(120, 810, 800, 40, 902, 6)} fill={P.earth} seed={902} />
          <CliffBlock x={1000} y={810} w={640} h={420} seed={920} />
          {[0, 1, 2].map((i) => {
            const x0 = 1660 + ((i * 90 + t * 30) % 260);
            return <Stroke key={i} pts={linePts([x0, 1000 + i * 26], [x0 + 80, 998 + i * 26], 4, 3, 930 + i)} w={4} color={P.white} seed={930 + i} />;
          })}
          <Linda name="linda" a={linda} x={lx} y={810} s={0.72} legs walk={walking} walkPhase={t * 9} />
        </svg>
        <Txt x={480} y={54} size={96} align="center" k={titlesK} color={P.teal} riso={P.ink} qa="bucketTitle" weight={800}>
          BUCKET
        </Txt>
        <Txt x={480} y={160} size={38} align="center" k={prog(t, brackets, bucketsW + 0.3, easeOut)} qa="brackets">
          tax brackets
        </Txt>
        <Txt x={1440} y={54} size={96} align="center" k={titlesK} color={P.berry} riso={P.ink} qa="cliffTitle" weight={800}>
          CLIFF
        </Txt>
        <Txt x={1440} y={160} size={38} align="center" k={prog(t, WT('e2', 'IRMAA'), cliffW + 0.3, easeOut)} qa="irmaaClose">
          IRMAA
        </Txt>
        <div style={{position: 'absolute', left: 645, top: 232, width: 630, height: 118, borderRadius: 22, background: 'rgba(255,253,247,0.92)', border: `4px solid ${P.ink}`, opacity: prog(t, bucketQ - 0.5, bucketQ, easeOut), transform: 'rotate(-1deg)'}} />
        <Txt x={960} y={248} size={72} align="center" k={prog(t, bucketQ - 0.5, bucketQ, easeOut)} qa="question" weight={800} riso={P.mustard}>
          bucket or cliff?
        </Txt>
        {disclaim > 0 ? (
          <div style={{position: 'absolute', left: 360, top: 902, width: 1200, height: 132, background: 'rgba(255,253,247,0.95)', border: `4px solid ${P.ink}`, borderRadius: 18, opacity: disclaim, transform: `rotate(-0.6deg) scale(${0.9 + 0.1 * disclaim})`}} />
        ) : null}
        <Txt x={960} y={918} size={44} align="center" k={disclaim} qa="disclaimer" weight={800}>
          Educational, not tax advice.
        </Txt>
        <Txt x={960} y={982} size={28} align="center" k={disclaim} qa="sources" weight={600} color={P.inkSoft}>
          {'Sources: CMS · SSA (numbers checked Oct 17, 2026)'}
        </Txt>
      </Cam>
    </AbsoluteFill>
  );
};

export const _u3 = [easeIn, Underline, ellipsePts, money, Plant, Leaves];
