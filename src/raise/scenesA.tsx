import React from 'react';
import {AbsoluteFill} from 'remotion';
import {act} from './acting';
import {BossArm, Coworker, Maya} from './characters';
import {CircleMark, CrossOut, Shape, Stroke, Underline, ellipsePts, linePts, rectPts} from './ink';
import {B, FPS, frF, H, P, W, clamp01, easeIn, easeInOut, easeOut, prog, sp} from './lib';
import {Bill, Card, Clock, Dust, Envelope, LightShaft, Plant, Stairs, Sunburst, Window} from './props';
import {Cam, Paper} from './stage';
import {Source, Tag, Txt, money} from './text';
import {Burst, ImpactLines, Odo} from '../mg/kit';

export type SceneProps = {t: number};
const fr = frF;

/* ======================= OFFICE (cold open + setup) ======================= */

const Bubble: React.FC<{x: number; y: number; w: number; h: number; tail: [number, number]; k: number; seed?: number}> = ({x, y, w, h, tail, k, seed = 140}) => {
  if (k <= 0) return null;
  const s = 0.6 + 0.4 * easeOut(clamp01(k)) + Math.sin(clamp01(k) * Math.PI) * 0.06;
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <g transform={`translate(${cx},${cy}) scale(${s}) translate(${-cx},${-cy})`}>
      <Shape pts={[[x + w * 0.62, y + h - 10], [tail[0], tail[1]], [x + w * 0.8, y + h - 16]]} fill={P.white} seed={seed + 1} w={4.5} />
      <Shape pts={ellipsePts(cx, cy, w / 2, h / 2, seed, 26)} fill={P.white} seed={seed} w={5} />
    </g>
  );
};

type OfficeState = {
  t: number; // time used for the office (may run backwards during rewind)
  bubbleA: number; // cold-open bubble line 1 progress
  bubbleB: number; // line 2
  cross: number;
  wrong: number;
  mostly: number;
  cwX: number; // coworker x (offscreen when > 2100)
  cwPose: 'neutral' | 'whisper';
  armX: number | null;
  envelope: number; // 0 hidden .. 1 on desk
  raiseTag: number;
  bubbleSetup: number;
  stairs: number;
  mayaReacts: {t: number; kind: 'surprise' | 'smile' | 'worry' | 'think' | 'nod'}[];
  cwReacts: {t: number; kind: 'surprise' | 'smile' | 'worry' | 'nod'}[];
  cwTalk: [number, number][];
  push: [number, number];
  keys?: {t: number; x: number; y: number; z: number}[];
  wrongAt?: number; // time WRONG. lands (impact)
  raiseAt?: number; // time the raise envelope lands
};

const Office: React.FC<{s: OfficeState}> = ({s}) => {
  const t = s.t;
  const f = fr(t);
  const maya = act(f, {seed: 11, reacts: s.mayaReacts, look: [{t: 0, x: 0.8, hold: 2.6}], baseSmile: 0.1});
  const cw = act(f, {seed: 22, reacts: s.cwReacts, talk: s.cwTalk, baseSmile: 0.05});
  cw.lean += 7;
  return (
    <AbsoluteFill>
      <Paper color={P.tealPale} id="office" />
      <Cam t0={s.push[0]} t1={s.push[1]} push={s.keys ? 0 : 0.035} focus={[980, 520]} keys={s.keys} shakeAt={s.wrongAt !== undefined ? [s.wrongAt + 0.06] : []}>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <Window x={110} y={70} w={470} h={380} seed={71}>
            <rect x={110} y={70} width={470} height={380} fill={P.sky} />
          </Window>
          <LightShaft t={t} pts={[[580, 90], [580, 450], [1180, 1080], [1560, 1080]]} />
          <Dust t={t} x={600} y={120} w={820} h={760} seed={3} />
          <Clock x={1730} y={150} t={t} />
          <Plant x={1800} y={800} t={t} s={1.1} />
          <Maya name="maya" a={maya} x={600} y={1010} s={1.35} />
          {s.cwX < 2150 ? <Coworker name="cw" a={cw} x={s.cwX} y={1020} s={1.35} flip pose={s.cwPose} /> : null}
          {/* desk */}
          <Shape pts={rectPts(-40, 800, W + 80, 320, 160, 6)} fill={P.wood} seed={160} w={6} />
          <Stroke pts={linePts([-20, 830], [W + 20, 834], 12, 0, 161)} w={3} color={P.woodDark} seed={161} />
          <Stroke pts={linePts([-20, 880], [W + 20, 884], 12, 0, 162)} w={2.5} color={P.woodDark} seed={162} />
          {s.envelope > 0 ? (
            <g opacity={clamp01(s.envelope * 3)}>
              <Envelope x={930} y={845 - (1 - easeOut(s.envelope)) * 60} rot={-8} s={0.9} />
            </g>
          ) : null}
          {s.armX !== null ? (
            <BossArm x={s.armX} y={800}>
              {s.envelope <= 0 ? <Envelope x={-110} y={-20} rot={-6} s={0.75} seed={310} /> : null}
            </BossArm>
          ) : null}
          <Bubble x={680} y={120} w={760} h={260} tail={[1232, 505]} k={Math.max(s.bubbleA, s.bubbleSetup > 0 ? s.bubbleSetup : 0)} />
          <Stairs x={190} y={420} k={s.stairs} />
          {s.cross > 0 ? <CrossOut x={770} y={170} w={580} h={160} k={s.cross} sw={11} pen={false} /> : null}
          {s.wrongAt !== undefined ? <ImpactLines t={t} t0={s.wrongAt + 0.04} x={380} y={210} r={230} n={9} seed={175} color={P.coral} arc={Math.PI * 1.7} /> : null}
          {s.wrongAt !== undefined ? <Burst t={t} t0={s.wrongAt + 0.05} x={380} y={200} n={10} seed={176} spread={520} up={480} /> : null}
          {s.raiseAt !== undefined ? <Burst t={t} t0={s.raiseAt} x={1010} y={830} n={12} seed={177} spread={420} up={560} scale={0.75} ink={false} /> : null}
        </svg>
        <Txt x={1060} y={172} size={56} align="center" k={s.bubbleA} qa="bubble1">
          don't take the raise.
        </Txt>
        <Txt x={1060} y={250} size={46} align="center" k={s.bubbleB} color={P.inkSoft} qa="bubble2">
          you'll take home less.
        </Txt>
        <Txt x={1060} y={212} size={64} align="center" k={s.bubbleSetup} qa="bubble3">
          don't take it.
        </Txt>
        <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '380px 200px', transform: `scale(${(s.wrong > 0 && s.wrong < 1 ? 2.5 - 1.5 * easeOut(Math.min(1, s.wrong * 1.5)) : 1).toFixed(3)})`}}>
          <Txt x={150} y={130} size={120} k={s.wrong} rot={-7} color={P.coral} riso={P.ink} qa="wrong" weight={800} bounce={70}>
            WRONG.
          </Txt>
        </div>
        <Txt x={210} y={282} size={66} k={s.mostly} rot={-4} color={P.teal} qa="mostly">
          ...mostly.
        </Txt>
        <Tag x={770} y={706} text="+$2,000 raise" k={s.raiseTag} fill={P.mustard} qa="raise" rot={-4} size={36} />
        <Txt x={150} y={140} size={46} k={s.stairs} color={P.teal} qa="higher" rot={-3}>
          higher bracket?
        </Txt>
      </Cam>
    </AbsoluteFill>
  );
};

const coldState = (t: number): OfficeState => {
  const c = B.cold;
  return {
    t,
    bubbleA: 0.3 + 0.7 * prog(t, 0, c.less - 0.25, easeOut),
    bubbleB: prog(t, c.less - 0.9, c.less + 0.2, easeOut),
    cross: prog(t, c.wrong - 0.05, c.wrong + 0.3, easeOut),
    wrong: prog(t, c.wrong, c.wrong + 0.3, easeOut),
    mostly: prog(t, c.mostly, c.mostly + 0.45, easeOut),
    cwX: 1330,
    cwPose: 'whisper',
    armX: null,
    envelope: 1,
    raiseTag: 1,
    bubbleSetup: 0,
    stairs: 0,
    mayaReacts: [{t: c.less - 0.3, kind: 'worry'}, {t: c.wrong + 0.1, kind: 'surprise'}],
    cwReacts: [{t: c.wrong + 0.05, kind: 'surprise'}],
    cwTalk: [[0.05, c.less + 0.25]],
    push: [0, 4.2],
    keys: [
      {t: 0, x: 1080, y: 360, z: 1.2},
      {t: c.less, x: 1060, y: 340, z: 1.16},
      {t: c.wrong - 0.06, x: 980, y: 520, z: 1.02},
      {t: c.mostly + 0.4, x: 900, y: 500, z: 1.06},
    ],
    wrongAt: c.wrong,
  };
};

export const Cold: React.FC<SceneProps> = ({t}) => <Office s={coldState(t)} />;

/** The first frame of the video, used under the final loop wipe. */
export const ColdFirstFrame: React.FC = () => <Office s={coldState(0)} />;

export const Setup: React.FC<SceneProps> = ({t}) => {
  const s = B.setup;
  const rw0 = s.rewind - 0.35;
  const rw1 = s.rewind + 0.55;
  if (t < rw1) {
    // Rewind: the cold open runs backwards fast with tape wobble, then lands on the setup.
    const back = Math.max(0, rw0 - (t - rw0) * 5);
    const k = clamp01((t - rw0) / (rw1 - rw0));
    const wob = Math.sin(t * 90) * 6 * (1 - k);
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{transform: `translateX(${wob}px) skewX(${(Math.sin(t * 40) * 1.5 * (1 - k)).toFixed(2)}deg)`}}>
          <Office s={{...coldState(back), t: back}} />
        </AbsoluteFill>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          {[0, 1, 2].map((i) => (
            <rect key={i} x={0} y={((t * 1400 + i * 380) % (H + 80)) - 40} width={W} height={10} fill={P.white} opacity={0.35} />
          ))}
          <g transform="translate(120,110)">
            <Shape pts={[[70, 0], [70, 80], [0, 40]]} fill={P.coral} seed={171} />
            <Shape pts={[[150, 0], [150, 80], [80, 40]]} fill={P.coral} seed={172} />
          </g>
        </svg>
        <Txt x={1440} y={300} size={72} k={1} color={P.coral} riso={P.ink} qa="rewind">
          rewind
        </Txt>
      </AbsoluteFill>
    );
  }
  const armIn = prog(t, s.boss - 0.4, s.raise_ - 0.15, easeOut);
  const armOut = prog(t, s.raise_ + 0.6, s.raise_ + 1.3, easeIn);
  const armX = armOut >= 1 ? null : 2150 - 1250 * armIn + 1250 * armOut;
  const cwIn = prog(t, s.coworker - 0.3, s.coworker + 0.6, easeOut);
  return (
    <Office
      s={{
        t,
        bubbleA: 0,
        bubbleB: 0,
        cross: 0,
        wrong: 0,
        mostly: 0,
        cwX: 2250 - 920 * cwIn,
        cwPose: t > s.whispers - 0.2 ? 'whisper' : 'neutral',
        armX,
        envelope: prog(t, s.raise_ - 0.1, s.raise_ + 0.25, easeOut),
        raiseTag: prog(t, s.raise_, s.raise_ + 0.4, easeOut),
        bubbleSetup: prog(t, s.dont - 0.05, s.dont + 0.35, easeOut),
        stairs: prog(t, s.higher - 0.1, s.bracket + 0.4, easeOut),
        mayaReacts: [
          {t: s.raise_, kind: 'surprise'},
          {t: s.raise_ + 0.9, kind: 'smile'},
          {t: s.whispers, kind: 'think'},
          {t: s.higher, kind: 'worry'},
        ],
        cwReacts: [{t: s.coworker + 0.4, kind: 'nod'}, {t: s.bracket, kind: 'worry'}],
        cwTalk: [[s.dont - 0.05, s.dontEnd + 0.1]],
        push: [s.rewind, B.claim.start],
        keys: [
          {t: rw1, x: 960, y: 540, z: 1.0},
          {t: s.raise_ - 0.4, x: 980, y: 660, z: 1.1},
          {t: s.raise_ + 0.9, x: 960, y: 620, z: 1.08},
          {t: s.whispers - 0.1, x: 1160, y: 480, z: 1.12},
          {t: s.higher - 0.3, x: 1060, y: 400, z: 1.08},
          {t: s.bracket + 0.5, x: 560, y: 380, z: 1.14},
          {t: B.claim.start + 0.8, x: 560, y: 380, z: 1.16},
        ],
        raiseAt: s.raise_ + 0.22,
      }}
    />
  );
};

/* ======================= CLAIM ======================= */

export const Claim: React.FC<SceneProps> = ({t}) => {
  const c = B.claim;
  const f = fr(t);
  const cw = act(f, {
    seed: 23,
    reacts: [
      {t: c.start + 0.2, kind: 'smile'},
      {t: c.wrong, kind: 'surprise'},
      {t: c.right, kind: 'nod'},
      {t: c.thousands + 0.1, kind: 'smile'},
    ],
    look: [{t: c.start, x: 0.9, y: -0.6, hold: 6}],
  });
  const billAt = (i: number) => c.thousands + (i * 1.2) / 7;
  return (
    <AbsoluteFill>
      <Cam
        t0={c.start}
        t1={B.maya.start}
        push={0}
        shakeAt={[c.wrong + 0.06]}
        keys={[
          {t: c.start, x: 1150, y: 300, z: 1.14},
          {t: c.wrong - 0.1, x: 1150, y: 320, z: 1.1},
          {t: c.wrong + 0.4, x: 1300, y: 420, z: 1.08},
          {t: c.thousands, x: 1350, y: 600, z: 1.12},
          {t: c.math + 0.2, x: 1100, y: 420, z: 1.04},
          {t: B.maya.start, x: 1100, y: 420, z: 1.06},
        ]}
      >
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <Sunburst t={t} cx={1150} cy={560} />
          <Coworker name="cw" a={cw} x={360} y={1040} s={1.35} pose="point" />
          {Array.from({length: 7}).map((_, i) => {
            const d = clamp01((t - billAt(i)) / 0.28);
            if (t < billAt(i)) return null;
            return <Bill key={i} x={1430 + (i % 2) * 18} y={790 - i * 26 - (1 - d * d) * 420} w={230} h={96} seed={180 + i} rot={(i % 3) - 1 + (1 - d) * 20} />;
          })}
          <ImpactLines t={t} t0={c.wrong + 0.05} x={1530} y={440} r={220} n={8} seed={185} color={P.coral} arc={Math.PI * 1.6} />
          <Underline x={830} y={330} len={640} k={prog(t, c.wrong - 0.1, c.wrong + 0.35, easeOut)} w={9} />
          <Underline x={850} y={350} len={600} k={prog(t, c.math - 0.2, c.math + 0.5, easeOut)} color={P.teal} seed={9} w={6} />
        </svg>
        <Txt x={1150} y={170} size={128} align="center" k={prog(t, c.start, c.start + 0.7, easeOut)} riso={P.mustard} qa="quote" weight={800}>
          {'“don’t take it.”'}
        </Txt>
        <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '1530px 450px', transform: `scale(${(t < c.wrong ? 1 : 2.4 - 1.4 * prog(t, c.wrong - 0.02, c.wrong + 0.22, easeOut)).toFixed(3)})`}}>
          <Txt x={1320} y={390} size={104} k={prog(t, c.wrong, c.wrong + 0.16, easeOut)} rot={-8} color={P.coral} riso={P.ink} qa="claimWrong" weight={800} bounce={70}>
            WRONG.
          </Txt>
        </div>
        <Txt x={940} y={540} size={64} k={prog(t, c.right - 0.4, c.right + 0.4, easeOut)} color={P.teal} qa="notTotally" rot={-3}>
          ...but not totally
        </Txt>
        <Tag x={900} y={672} text="could cost you thousands" k={prog(t, c.thousands - 0.1, c.thousands + 0.4, easeOut)} fill={P.white} qa="thousands" rot={-2} size={40} />
      </Cam>
    </AbsoluteFill>
  );
};

/* ======================= MAYA ======================= */

export const MayaScene: React.FC<SceneProps> = ({t}) => {
  const m = B.maya;
  const f = fr(t);
  const a = act(f, {
    seed: 12,
    reacts: [
      {t: m.maya, kind: 'smile'},
      {t: m.salary + 0.3, kind: 'nod'},
      {t: m.deduction, kind: 'think'},
      {t: m.dedAmt + 0.3, kind: 'nod'},
      {t: m.taxable + 0.2, kind: 'smile'},
    ],
    look: [
      {t: m.salary, x: 1, y: -0.5, hold: 1.6},
      {t: m.dedAmt, x: 1, y: -0.1, hold: 1.4},
      {t: m.taxable, x: 1, y: 0.3, hold: 1.6},
    ],
  });
  const cardIn = prog(t, m.start - 0.3, m.start + 0.5, easeOut);
  const salary = prog(t, m.salary, m.salary + 1.0, easeOut);
  const ded = prog(t, m.dedAmt, m.dedAmt + 0.8, easeOut);
  const tax = prog(t, m.taxable, m.taxable + 0.9, easeOut);
  const cx = 980 + (1 - cardIn) * 900;
  return (
    <AbsoluteFill>
      <Paper color={P.paperWarm} id="maya" />
      <Cam
        t0={m.start}
        t1={B.buckets.start}
        push={0}
        keys={[
          {t: m.start, x: 760, y: 560, z: 1.1},
          {t: m.maya + 0.6, x: 600, y: 560, z: 1.14},
          {t: m.salary - 0.2, x: 1680, y: 300, z: 1.12},
          {t: m.salary + 1.6, x: 1700, y: 300, z: 1.15},
          {t: m.dedAmt - 0.3, x: 1700, y: 420, z: 1.14},
          {t: m.take + 0.2, x: 1700, y: 520, z: 1.12},
          {t: m.taxable + 0.4, x: 1700, y: 520, z: 1.14},
          {t: m.taxable + 1.8, x: 1400, y: 540, z: 1.05},
          {t: B.buckets.start, x: 1100, y: 540, z: 1.04},
        ]}
      >
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <Window x={90} y={40} w={380} h={300} seed={72} blinds={false}>
            <rect x={90} y={40} width={380} height={300} fill={P.sky} />
            {[0, 1, 2, 3, 4].map((i) => (
              <Shape key={i} pts={rectPts(100 + i * 74, 210 - (i % 3) * 50, 60, 200, 190 + i, 2)} fill={i % 2 ? P.skyDeep : '#8DB6C4'} seed={190 + i} w={3} />
            ))}
          </Window>
          <LightShaft t={t} pts={[[470, 60], [470, 340], [900, 1080], [1180, 1080]]} />
          <Dust t={t} x={420} y={120} w={700} h={800} seed={5} />
          <Plant x={110} y={1000} t={t} s={1.15} />
          <Maya name="maya" a={a} x={470} y={1050} s={1.45} />
          <g transform={`rotate(${(1 - cardIn) * 8} ${cx + 400} 470)`}>
            <Card x={cx} y={110} w={830} h={720} seed={200} qa="ledger" />
            {Array.from({length: 13}).map((_, i) => (
              <line key={i} x1={cx + 20} y1={170 + i * 50} x2={cx + 810} y2={171 + i * 50} stroke={P.teal} strokeOpacity={0.18} strokeWidth={2} />
            ))}
            <Stroke pts={linePts([cx + 230, 520], [cx + 780, 516], 10, 2, 205)} draw={prog(t, m.take, m.take + 0.5, easeOut)} w={6} pen />
            <CircleMark cx={cx + 470} cy={600} rx={250} ry={62} k={prog(t, m.taxable + 0.9, m.taxable + 1.5, easeOut)} color={P.teal} />
          </g>
        </svg>
        <Tag x={300} y={262} text="MAYA" fill={P.teal} color={P.white} k={prog(t, m.maya - 0.1, m.maya + 0.3, easeOut)} qa="mayaTag" rot={-5} size={44} />
        <Txt x={cx + 40} y={190} size={50} k={prog(t, m.single, m.single + 0.6)} color={P.teal} qa="single" rot={-4} pen>
          single
        </Txt>
        <Txt x={cx + 40} y={128} size={36} k={prog(t, m.start, m.start + 0.6, easeOut)} color={P.teal} qa="ledgerHead" weight={800}>
          MAYA'S 2026 TAXES
        </Txt>
        <Odo x={cx + 230} y={175} size={96} from={0} to={66500} k={prog(t, m.salary, m.salary + 1.0)} qa="salary" weight={800} riso={P.mustardPale} />
        <Txt x={cx + 680} y={205} size={54} k={prog(t, m.salary + 0.8, m.salary + 1.2, easeOut)} color={P.mustard} qa="peryr" riso={P.ink}>
          /yr
        </Txt>
        <Tag x={cx + 640} y={106} text="2026" fill={P.mustard} k={prog(t, B.maya.deduction - 1.4, B.maya.deduction - 1.0, easeOut)} qa="year" rot={4} size={38} />
        <Odo x={cx + 220} y={318} size={96} from={0} to={16100} k={prog(t, m.dedAmt, m.dedAmt + 0.8)} fmt={(v) => '− $' + Math.round(v).toLocaleString('en-US')} color={P.coral} qa="ded" weight={800} />
        <Txt x={cx + 250} y={430} size={42} k={prog(t, m.deduction, m.deduction + 0.9)} color={P.inkSoft} qa="dedLabel" pen>
          standard deduction
        </Txt>
        <Odo x={cx + 230} y={540} size={104} from={66500} to={50400} k={prog(t, m.taxable, m.taxable + 0.9)} fmt={(v) => '= $' + Math.round(v).toLocaleString('en-US')} color={P.teal} qa="taxable" weight={800} riso={P.tealLight} />
        <Txt x={cx + 270} y={660} size={42} k={prog(t, m.taxable + 1.5, m.taxable + 2.3)} color={P.inkSoft} qa="taxLabel" pen>
          taxable income
        </Txt>
      </Cam>
      <Source x={cx + 30} y={770} text="Source: IRS, tax year 2026 inflation adjustments" k={prog(t, m.deduction, m.deduction + 0.5)} qa="srcMaya" />
    </AbsoluteFill>
  );
};

export const sceneSp = sp;
export const easeIO = easeInOut;
