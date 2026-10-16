import React from 'react';
import {AbsoluteFill} from 'remotion';
import {act} from './acting';
import {BossArm, Coworker, Maya} from './characters';
import {CircleMark, CrossOut, Shape, Stroke, Underline, ellipsePts, linePts, rectPts} from './ink';
import {B, FPS, H, P, W, clamp01, easeIn, easeInOut, easeOut, prog, sp} from './lib';
import {Bill, Card, Clock, Dust, Envelope, LightShaft, Plant, Stairs, Sunburst, Window} from './props';
import {Cam, Paper} from './stage';
import {Source, Tag, Txt, money} from './text';

export type SceneProps = {t: number};
const fr = (t: number) => Math.round(t * FPS);

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
      <Cam t0={s.push[0]} t1={s.push[1]} push={0.035} focus={[980, 520]}>
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
          {s.cross > 0 ? <CrossOut x={770} y={170} w={580} h={160} k={s.cross} sw={11} /> : null}
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
        <Txt x={150} y={130} size={120} k={s.wrong} rot={-7} color={P.coral} riso={P.ink} qa="wrong" weight={800} bounce={70}>
          WRONG.
        </Txt>
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
  const bills = Math.floor(clamp01((t - c.thousands) / 1.2) * 7);
  return (
    <AbsoluteFill>
      <Cam t0={c.start} t1={B.maya.start} push={0.03} focus={[1100, 480]}>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <Sunburst t={t} cx={1150} cy={560} />
          <Coworker name="cw" a={cw} x={360} y={1040} s={1.35} pose="point" />
          {Array.from({length: bills}).map((_, i) => (
            <Bill key={i} x={1430 + (i % 2) * 18} y={790 - i * 26} w={230} h={96} seed={180 + i} rot={(i % 3) - 1} />
          ))}
          <Underline x={830} y={330} len={640} k={prog(t, c.wrong - 0.1, c.wrong + 0.35, easeOut)} w={9} />
          <Underline x={850} y={350} len={600} k={prog(t, c.math - 0.2, c.math + 0.5, easeOut)} color={P.teal} seed={9} w={6} />
        </svg>
        <Txt x={1150} y={170} size={128} align="center" k={prog(t, c.start, c.start + 0.7, easeOut)} riso={P.mustard} qa="quote" weight={800}>
          {'“don’t take it.”'}
        </Txt>
        <Txt x={1370} y={390} size={104} k={prog(t, c.wrong, c.wrong + 0.3, easeOut)} rot={-8} color={P.coral} riso={P.ink} qa="claimWrong" weight={800} bounce={70}>
          WRONG.
        </Txt>
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
        push={0.02}
        keys={[
          {t: m.start, x: 960, y: 540, z: 1},
          {t: m.salary, x: 1010, y: 520, z: 1.02},
          {t: m.taxable, x: 1060, y: 500, z: 1.04},
          {t: B.buckets.start, x: 1060, y: 500, z: 1.04},
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
            <Stroke pts={linePts([cx + 230, 520], [cx + 780, 516], 10, 2, 205)} draw={prog(t, m.take, m.take + 0.5, easeOut)} w={6} />
            <CircleMark cx={cx + 470} cy={600} rx={250} ry={62} k={prog(t, m.taxable + 0.9, m.taxable + 1.5, easeOut)} color={P.teal} />
          </g>
        </svg>
        <Tag x={300} y={262} text="MAYA" fill={P.teal} color={P.white} k={prog(t, m.maya - 0.1, m.maya + 0.3, easeOut)} qa="mayaTag" rot={-5} size={44} />
        <Txt x={cx + 40} y={190} size={50} k={prog(t, m.single, m.single + 0.4, easeOut)} color={P.teal} qa="single" rot={-4}>
          single
        </Txt>
        <Txt x={cx + 40} y={128} size={36} k={prog(t, m.start, m.start + 0.6, easeOut)} color={P.teal} qa="ledgerHead" weight={800}>
          MAYA'S 2026 TAXES
        </Txt>
        <Txt x={cx + 230} y={175} size={96} k={salary > 0 ? 1 : 0} qa="salary" weight={800} riso={P.mustardPale}>
          {money(66500 * salary)}
        </Txt>
        <Txt x={cx + 680} y={205} size={54} k={prog(t, m.salary + 0.8, m.salary + 1.2, easeOut)} color={P.mustard} qa="peryr" riso={P.ink}>
          /yr
        </Txt>
        <Tag x={cx + 640} y={86} text="2026" fill={P.mustard} k={prog(t, B.maya.deduction - 1.4, B.maya.deduction - 1.0, easeOut)} qa="year" rot={4} size={38} />
        <Txt x={cx + 220} y={318} size={96} k={ded > 0 ? 1 : 0} color={P.coral} qa="ded" weight={800}>
          {'− ' + money(16100 * ded)}
        </Txt>
        <Txt x={cx + 250} y={430} size={42} k={prog(t, m.deduction, m.deduction + 0.6, easeOut)} color={P.inkSoft} qa="dedLabel">
          standard deduction
        </Txt>
        <Txt x={cx + 230} y={540} size={104} k={tax > 0 ? 1 : 0} color={P.teal} qa="taxable" weight={800} riso={P.tealLight}>
          {'= ' + money(50400 * tax)}
        </Txt>
        <Txt x={cx + 270} y={660} size={42} k={prog(t, m.taxable + 0.5, m.taxable + 1.0, easeOut)} color={P.inkSoft} qa="taxLabel">
          taxable income
        </Txt>
      </Cam>
      <Source x={cx + 30} y={770} text="Source: IRS, tax year 2026 inflation adjustments" k={prog(t, m.deduction, m.deduction + 0.5)} qa="srcMaya" />
    </AbsoluteFill>
  );
};

export const sceneSp = sp;
export const easeIO = easeInOut;
