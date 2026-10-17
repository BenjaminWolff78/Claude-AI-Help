import React from 'react';
import {AbsoluteFill} from 'remotion';
import {act} from './acting';
import {Linda} from './characters';
import {CrossOut, Shape, Stroke, Underline, ellipsePts, linePts, rectPts, Strike} from './ink';
import {FPS, H, P, W, WT, clamp01, easeIn, easeInOut, easeOut, frF, prog, sp} from './lib';
import {Bill, Bucket, Card, CliffBlock, Clouds, Coin, Envelope, Jar, LightShaft, Dust, Window} from './props';
import {CalendarPage, Drip, Fence, Leaves, Mailbox, Pot, Rain, Stamp, Tree, sharp} from './props2';
import {Cam, Paper} from './stage';
import {Source, Tag, Txt, money} from './text';

export type SceneProps = {t: number};
const fr = frF;

/* ======================= COLD: the line on the cliff ======================= */

const EDGE = 1250;
const LINE_X = 870;

const ColdBody: React.FC<{t: number}> = ({t}) => {
  const f = fr(t);
  const over = WT('c1', 'over');
  const lineW = WT('c1', 'line');
  const cost = WT('c1', '$1,148');
  const notB = WT('c2', 'not');
  const cliff = WT('c3', 'cliff');
  const bill = WT('c4', 'Medicare');
  // Linda walks over the line in the first 1.4 s (frame 1 is already mid-step)
  const walkK = prog(t, -0.6, 1.5, easeOut);
  const lx = 700 + 400 * walkK;
  const walking = t < 1.5 ? 1 - walkK * 0.6 : 0;
  const linda = act(f, {
    seed: 51,
    reacts: [{t: cost + 0.1, kind: 'shock', hold: 1.4}, {t: cliff + 0.3, kind: 'worry', hold: 1.6}, {t: bill + 0.2, kind: 'surprise'}],
    look: [{t: 0, x: 1, y: 0.2, hold: 2.4}, {t: cost, x: 0.6, y: -0.8, hold: 2.5}],
  });
  const slam = sp(f, cost - 0.15, {damping: 11, stiffness: 190, mass: 0.8});
  const coinK = clamp01((t - cliff + 0.1) / 1.4);
  const env = prog(t, bill - 0.6, bill + 0.5, easeOut);
  const zoomKeys = [
    {t: 0, x: 960, y: 540, z: 1.06},
    {t: cliff - 0.3, x: 960, y: 540, z: 1.06},
    {t: cliff + 0.9, x: 980, y: 540, z: 1.0},
    {t: 14, x: 980, y: 540, z: 1.02},
  ];
  return (
    <AbsoluteFill>
      <Paper color={P.sky} id="cold" />
      <Cam t0={0} t1={14} push={0} keys={zoomKeys} shakeAt={[cost + 0.05]}>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <Clouds t={t} y={130} n={5} seed={210} />
          {/* sea far below the edge */}
          <rect x={EDGE - 20} y={985} width={W} height={200} fill={P.skyDeep} />
          {[0, 1, 2, 3].map((i) => {
            const x0 = EDGE + 60 + ((i * 170 + t * 40) % 700);
            return <Stroke key={i} pts={linePts([x0, 1010 + i * 22], [x0 + 120, 1008 + i * 22], 5, 3, 220 + i)} w={4} color={P.white} seed={220 + i} />;
          })}
          <CliffBlock x={-200} y={760} w={EDGE + 200} h={500} seed={230} />
          {/* the line: a dashed boundary standing up out of the ground */}
          {Array.from({length: 9}).map((_, i) => (
            <Stroke key={i} pts={[[LINE_X + (i % 2) * 2, 752 - i * 44], [LINE_X + 1, 728 - i * 44]]} w={7} color={P.berry} seed={240 + i} taper={false} />
          ))}
          <Stroke pts={linePts([LINE_X - 50, 760], [LINE_X + 50, 760], 4, 0, 249)} w={7} color={P.berry} seed={249} />
          <Linda name="linda" a={linda} x={lx} y={760} s={0.92} legs walk={walking} walkPhase={t * 9} />
          {/* the coin that goes over the edge */}
          {coinK > 0 && coinK < 1 ? (
            <g transform={`translate(${EDGE - 30 + coinK * 220},${740 + coinK * coinK * 300}) rotate(${coinK * 400})`}>
              <Coin x={0} y={0} r={22} seed={250} />
            </g>
          ) : null}
          {/* the Medicare letter flutters in */}
          {env > 0 ? (
            <g transform={`translate(${2000 - env * 380},${80 + env * 330}) rotate(${-24 + env * 16 + Math.sin(t * 3) * 3})`}>
              <Envelope x={0} y={0} s={1.15} seed={260} />
            </g>
          ) : null}
          {/* the bracket bucket, crossed out */}
          {t > notB - 0.5 ? <Bucket x={380} y={150} w={150} h={160} level={0.5} seed={270} t={t} /> : null}
          {t > notB ? <CrossOut x={290} y={110} w={180} h={220} k={prog(t, notB + 0.35, notB + 0.75, easeOut)} sw={9} color={P.berry} /> : null}
        </svg>
        <Tag x={LINE_X - 330} y={600} text="the line: $109,000" k={prog(t, lineW - 0.2, lineW + 0.25)} fill={P.white} size={34} rot={-3} qa="line" />
        <Tag x={1250} y={560} text="+$500" k={prog(t, over, over + 0.3)} fill={P.mustard} size={40} rot={4} qa="plus500" />
        {slam > 0.001 ? (
          <div style={{position: 'absolute', left: 1230, top: 140 + (1 - slam) * -320, transform: `rotate(${-6 + (1 - slam) * 10}deg)`}}>
            <Tag x={0} y={0} text="−$1,148 a year" k={1} fill={P.berryPale} size={58} rot={0} qa="cost" />
          </div>
        ) : null}
        <Txt x={300} y={330} size={40} align="center" k={prog(t, notB - 0.3, notB + 0.3)} color={P.inkSoft} qa="taxbracket">
          tax bracket
        </Txt>
        <Txt x={1600} y={560} size={140} align="center" k={prog(t, cliff, cliff + 0.3, easeOut)} color={P.ink} riso={P.berry} weight={800} bounce={70} qa="cliffWord">
          cliff.
        </Txt>
        <Tag x={1540} y={300} text="Medicare" k={prog(t, bill + 0.2, bill + 0.5)} fill={P.white} size={32} rot={-8} qa="medicare" />
      </Cam>
    </AbsoluteFill>
  );
};

export const Cold: React.FC<SceneProps> = ({t}) => <ColdBody t={t} />;
/** The first frame of the video, used under the final loop wipe. */
export const ColdFirstFrame: React.FC = () => <ColdBody t={0} />;

/* ======================= LINDA: the leaking roof ======================= */

export const LindaScene: React.FC<SceneProps> = ({t}) => {
  const f = fr(t);
  const meet = WT('l1', 'Linda');
  const y2024 = WT('l3', '2024');
  const leak = WT('l3', 'leaking');
  const pulled = WT('l4', 'pulled');
  const k14 = WT('l4', '$14,000');
  const ira = WT('l4', 'IRA');
  const pushed = WT('l5', 'pushed');
  const amt = WT('l5', '$109,500');
  const nothing = WT('l6', 'nothing');
  const taxes = WT('l7', 'taxes');
  const bucketW = WT('l7', 'bucket');
  const linda = act(f, {
    seed: 52,
    reacts: [
      {t: meet + 0.1, kind: 'smile', hold: 1.4},
      {t: leak + 0.1, kind: 'worry', hold: 1.2},
      {t: k14 + 0.2, kind: 'think'},
      {t: amt + 0.3, kind: 'nod'},
      {t: nothing + 0.2, kind: 'relief', hold: 1.2},
      {t: bucketW, kind: 'smile', hold: 1.2},
    ],
    look: [{t: leak - 0.3, x: -1, y: -0.6, hold: 2.2}, {t: pulled, x: -1, y: 0.4, hold: 3.2}, {t: pushed, x: -0.8, y: 0, hold: 3.5}],
  });
  // income count-up from her usual $95,500 to $109,500
  const cnt = prog(t, amt - 1.4, amt + 0.6, easeOut);
  const income = 95500 + 14000 * cnt;
  const barX0 = 600;
  const barW = 560;
  const barOf = (v: number) => barX0 + barW * clamp01((v - 60000) / (115000 - 60000));
  const flyK = prog(t, pulled, pulled + 1.6, easeInOut);
  const potLevel = 0.15 + 0.35 * prog(t, leak, 38, easeIn);
  return (
    <AbsoluteFill>
      <Paper color={P.paperWarm} id="linda" />
      <Cam t0={WT('l1') - 0.4} t1={38.4} push={0.035} focus={[960, 560]}>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          {/* wallpaper stripes */}
          {Array.from({length: 24}).map((_, i) => (
            <rect key={i} x={i * 84} y={0} width={30} height={880} fill={P.paperShade} opacity={0.35} />
          ))}
          <Window x={100} y={80} w={400} h={330} seed={280} sky="#7F97A3" blinds={false}>
            <rect x={100} y={80} width={400} height={330} fill="#7F97A3" />
            <Rain t={t} x={100} y={70} w={400} h={350} seed={281} />
          </Window>
          <LightShaft t={t} pts={[[500, 100], [500, 410], [980, 880], [1300, 880]]} color="#F6EED8" />
          <Dust t={t} x={520} y={140} w={700} h={700} seed={9} n={22} />
          {/* ceiling stain + drip into a pot */}
          <Shape pts={ellipsePts(800, 6, 70, 18, 290, 14)} fill="#CDBF9C" ink={null} misreg={0} seed={290} />
          <Drip t={t} t0={leak - 0.2} x={800} y0={10} y1={790} />
          {/* floor */}
          <Shape pts={rectPts(-40, 880, W + 80, 260, 291, 6)} fill={P.wood} seed={291} w={6} />
          <Stroke pts={linePts([-20, 930], [W + 20, 934], 12, 0, 292)} w={3} color={P.woodDark} seed={292} />
          <Pot x={800} y={900} level={potLevel} t={t} />
          {/* a framed picture on the wall */}
          <Shape pts={rectPts(860, 130, 230, 170, 297, 8)} fill={P.wood} seed={297} />
          <Shape pts={rectPts(878, 148, 194, 134, 298, 6)} fill={P.skyDeep} seed={298} w={3.5} />
          <Shape pts={sharp([[900, 270], [960, 200], [1010, 250], [1040, 220], [1060, 270]], 24)} fill={P.grass} seed={299} w={3} />
          {/* side table with the IRA jar */}
          <Shape pts={rectPts(170, 760, 300, 30, 293, 6)} fill={P.woodDark} seed={293} />
          <Shape pts={rectPts(190, 790, 24, 100, 294, 4)} fill={P.woodDark} seed={294} />
          <Shape pts={rectPts(426, 790, 24, 100, 295, 4)} fill={P.woodDark} seed={295} />
          <Jar x={320} y={735} level={0.8 - 0.3 * flyK} lid={P.teal} seed={296} />
          {/* bills fly from the jar to Linda */}
          {flyK > 0 && flyK < 1
            ? [0, 1, 2].map((i) => {
                const k = clamp01(flyK * 1.3 - i * 0.15);
                if (k <= 0 || k >= 1) return null;
                const bx = 320 + (1220 - 320) * k;
                const by = 520 - Math.sin(k * Math.PI) * 220 + i * 18;
                return <Bill key={i} x={bx - 75} y={by} rot={k * 300 + i * 40} seed={300 + i} />;
              })
            : null}
          <Linda name="linda" a={linda} x={1420} y={1080} s={1.45} pose={t > pulled + 1.4 && t < amt + 3 ? 'hold' : 'neutral'} />
          {/* income card */}
          {t > pushed - 0.5 ? <Card x={540} y={330} w={680} h={330} seed={310} rot={-1.5} qa="incomeCard" /> : null}
          {t > pushed - 0.3 ? (
            <g>
              <Shape pts={rectPts(barX0, 520, barW, 44, 311, 10)} fill={P.white} seed={311} w={4} />
              <Shape pts={rectPts(barX0 + 4, 524, Math.max(6, barOf(income) - barX0 - 8), 36, 312, 8)} fill={P.teal} ink={null} seed={312} misreg={1} />
              {Array.from({length: 6}).map((_, i) => (
                <Stroke key={i} pts={[[barOf(109000), 500 + i * 16], [barOf(109000), 510 + i * 16]]} w={4} color={P.berry} seed={313 + i} taper={false} />
              ))}
            </g>
          ) : null}
          {t > taxes - 0.4 ? <Bucket x={1120} y={372} w={96} h={96} level={0.3 + 0.15 * prog(t, taxes, bucketW + 0.4, easeOut)} seed={320} t={t} /> : null}
        </svg>
        <Tag x={1560} y={220} text="LINDA, 66" k={prog(t, meet - 0.1, meet + 0.3)} fill={P.lavender} color={P.white} size={44} rot={-3} qa="lindaTag" />
        <Txt x={1830} y={316} size={38} align="right" k={prog(t, WT('l2', 'retired') - 0.2, WT('l2', 'single') + 0.3)} color={P.inkSoft} qa="lindaSub">
          retired · files single
        </Txt>
        <div style={{position: 'absolute', left: 0, top: 0}}>
          <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
            {t > y2024 - 0.3 ? <CalendarPage x={590} y={70} w={190} h={210} seed={330} rot={3} /> : null}
          </svg>
        </div>
        <Txt x={686} y={150} size={52} align="center" k={prog(t, y2024 - 0.1, y2024 + 0.3)} rot={3} qa="y2024">
          2024
        </Txt>
        <Tag x={278} y={604} text="IRA" k={1} fill={P.white} size={30} rot={-3} qa="iraTag" />
        <Tag x={150} y={470} text="+$14,000 from her IRA" k={prog(t, k14, k14 + 0.3)} fill={P.mustard} size={34} rot={-4} qa="plus14" />
        <Txt x={580} y={350} size={34} k={prog(t, pushed - 0.2, pushed + 0.3)} color={P.inkSoft} qa="incomeLabel">
          her 2024 income
        </Txt>
        <Txt x={580} y={398} size={84} k={prog(t, pushed, pushed + 0.3)} weight={800} color={P.ink} qa="incomeNum">
          {money(income)}
        </Txt>
        <Txt x={590} y={590} size={30} k={prog(t, amt, amt + 0.3)} color={P.berry} qa="lineLabel">
          a line at $109,000
        </Txt>
        <Txt x={1120} y={484} size={30} align="center" k={prog(t, taxes, taxes + 0.3)} color={P.teal} qa="taxesLabel">
          taxes
        </Txt>
      </Cam>
    </AbsoluteFill>
  );
};

/* ======================= LETTER: late 2025 ======================= */

export const LetterScene: React.FC<SceneProps> = ({t}) => {
  const f = fr(t);
  const y2025 = WT('m1', '2025');
  const letter = WT('m1', 'letter');
  const jan = WT('m2', 'January');
  const oldP = WT('m2', '$202.90');
  const newP = WT('m2', '$284.10');
  const drug = WT('m3', '$14.50');
  const year = WT('m4', '$1,148');
  const roof = WT('m5', 'roof');
  const called = WT('m6', 'called');
  const mistake = WT('m6', 'mistake');
  const hadnt = WT('m7', "hadn't");
  const linda = act(f, {
    seed: 53,
    reacts: [
      {t: letter + 0.3, kind: 'surprise'},
      {t: newP + 0.2, kind: 'shock', hold: 1.3},
      {t: newP + 1.9, kind: 'worry', hold: 4.5},
      {t: year + 0.2, kind: 'worry', hold: 2.4},
      {t: mistake, kind: 'think', hold: 0.8},
      {t: hadnt + 0.1, kind: 'worry', hold: 1.4},
    ],
    look: [{t: letter + 0.6, x: -1, y: 0.3, hold: 16}],
  });
  const arrive = prog(t, letter - 0.6, letter + 0.2, easeIn);
  const pose = t > called - 0.2 ? 'phone' : t > jan - 0.6 ? 'letter' : 'neutral';
  const card = prog(t, jan - 0.5, jan + 0.1, easeOut);
  return (
    <AbsoluteFill>
      <Paper color={P.sky} id="letter" />
      <Cam t0={WT('m1') - 0.4} t1={70} push={0.03} focus={[900, 520]}>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <Clouds t={t} y={110} n={4} seed={340} s={0.8} />
          {/* lawn, fence, house corner */}
          <Shape pts={rectPts(-40, 820, W + 80, 320, 341, 6)} fill={P.grass} seed={341} w={6} />
          <Shape pts={sharp([[1380, 820], [1380, 560], [1860, 560], [1860, 820]], 40)} fill="#E7D5B5" seed={342} />
          <Shape pts={sharp([[1340, 572], [1620, 410], [1900, 572]], 30)} fill="#8E5A4A" seed={343} />
          <Shape pts={rectPts(1440, 620, 110, 100, 344, 6)} fill={P.mustardPale} seed={344} />
          <Fence x0={560} x1={1380} y={830} />
          <Tree x={150} y={840} t={t} s={1.05} />
          <Mailbox x={420} y={880} flag={prog(t, letter, letter + 0.4)} />
          {arrive < 1 ? (
            <g transform={`translate(${420 + (1 - arrive) * 500},${520 - (1 - arrive) * 520}) rotate(${-30 + arrive * 30})`}>
              <Envelope x={0} y={0} s={0.8} seed={350} />
            </g>
          ) : null}
          <Leaves t={t} n={16} seed={351} />
          <Linda name="linda" a={linda} x={1560} y={1080} s={1.35} pose={pose} />
          {card > 0 ? (
            <g transform={`translate(0,${(1 - card) * 60})`} opacity={clamp01(card * 2)}>
              <Card x={520} y={150} w={820} h={620} seed={360} rot={-1} qa="notice" />
              <Shape pts={rectPts(520, 150, 820, 74, 361, 8)} fill={P.tealPale} seed={361} w={4} />
            </g>
          ) : null}
          {t > newP - 0.1 ? <Strike x={604} y={330} len={240} k={prog(t, newP - 0.1, newP + 0.2)} color={P.berry} /> : null}
          {t > year ? <Underline x={600} y={668} len={480} k={prog(t, year + 0.2, year + 0.7)} color={P.berry} /> : null}
          <Stamp x={1168} y={478} k={prog(t, hadnt - 0.05, hadnt + 0.25)} w={240} h={96} />
        </svg>
        <Tag x={210} y={330} text="late 2025" k={prog(t, y2025 - 0.2, y2025 + 0.3)} fill={P.white} size={36} rot={-4} qa="late2025" />
        <Txt x={560} y={166} size={36} k={card} qa="noticeHead" color={P.teal} weight={800}>
          Medicare Part B, starting January 2026
        </Txt>
        <Txt x={590} y={296} size={58} k={prog(t, oldP - 0.1, oldP + 0.3)} qa="oldP" color={P.inkSoft}>
          $202.90
        </Txt>
        <Txt x={872} y={300} size={44} k={prog(t, newP - 0.3, newP)} qa="arrow" color={P.inkSoft}>
          →
        </Txt>
        <Txt x={930} y={280} size={82} k={prog(t, newP, newP + 0.3)} qa="newP" color={P.berry} weight={800} riso={P.ink}>
          $284.10
        </Txt>
        <Txt x={1300} y={384} size={34} k={prog(t, newP + 0.3, newP + 0.6)} qa="perMonth" color={P.inkSoft} align="right">
          a month
        </Txt>
        <Txt x={600} y={452} size={50} k={prog(t, drug - 0.1, drug + 0.3)} qa="drug">
          + $14.50 a month
        </Txt>
        <Txt x={600} y={518} size={32} k={prog(t, drug + 0.4, drug + 0.7)} qa="drugLabel" color={P.inkSoft}>
          on her drug plan
        </Txt>
        <Txt x={600} y={590} size={76} k={prog(t, year - 0.1, year + 0.3)} qa="year" weight={800}>
          = $1,148 a year
        </Txt>
        <Txt x={604} y={690} size={32} k={prog(t, roof - 0.1, roof + 0.3)} qa="roofNote" color={P.inkSoft}>
          for a 2024 roof
        </Txt>
        <Txt x={1168} y={452} size={38} align="center" k={prog(t, hadnt, hadnt + 0.2)} qa="noMistake" color={P.berry} weight={800} rot={-8}>
          NO MISTAKE
        </Txt>
        <Tag x={1330} y={360} text="a mistake?" k={prog(t, mistake - 0.2, mistake + 0.2) * (t < hadnt + 0.6 ? 1 : 0)} fill={P.white} size={34} rot={3} qa="mistakeQ" />
        <Source x={540} y={792} text="CMS · 2026 Part B premiums & IRMAA (Nov 14, 2025)" k={card} qa="srcCms" />
      </Cam>
    </AbsoluteFill>
  );
};

export const _u1 = [easeInOut, Dust, LightShaft, ellipsePts, Stroke];
