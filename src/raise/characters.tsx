import React from 'react';
import {Act} from './acting';
import {Pt, Shape, Stroke, ellipsePts, linePts, rectPts} from './ink';
import {P} from './lib';

/* All characters share a local space: origin at the bottom of the torso,
   head centre at (0,-300). Busts by default; `legs` adds a full body. */

const HEAD: Pt = [0, -300];

const Eyes: React.FC<{a: Act; dx: number; seed: number; y?: number}> = ({a, dx, seed, y = -292}) => {
  const out: React.ReactNode[] = [];
  for (const side of [-1, 1]) {
    const ex = side * dx + a.eyeX * 7;
    const ey = y + a.eyeY * 5;
    const closed = a.blink > 0.55;
    if (closed) {
      out.push(<Stroke key={`c${side}`} pts={linePts([ex - 10, ey + 1], [ex + 10, ey + 1], 5, 3, seed + side)} w={4.5} seed={seed + side} />);
    } else if (a.squint > 0.55) {
      out.push(
        <Stroke key={`s${side}`} pts={[[ex - 11, ey + 4], [ex, ey - 5], [ex + 11, ey + 4]]} w={5} seed={seed + side + 4} />,
      );
    } else {
      const rx = 7.5 * (1 + 0.35 * a.wide);
      const ry = 10.5 * (1 + 0.3 * a.wide) * (1 - a.blink * 0.85) * (1 - a.squint * 0.4);
      if (a.wide > 0.25) {
        out.push(
          <Shape key={`w${side}`} pts={ellipsePts(ex - a.eyeX * 3, ey, rx + 7 * a.wide, ry + 6 * a.wide, seed + side * 3, 14)} fill={P.white} w={2.6} seed={seed + side * 3} />,
        );
      }
      out.push(<Shape key={`e${side}`} pts={ellipsePts(ex, ey, rx, ry, seed + side * 5, 12)} fill={P.ink} ink={null} misreg={0} seed={seed + side * 5} amp={0.5} />);
      out.push(<circle key={`h${side}`} cx={ex + 2.5} cy={ey - 3.5} r={2.4} fill={P.white} />);
    }
  }
  return <g>{out}</g>;
};

const Brows: React.FC<{a: Act; dx: number; seed: number; y?: number; color?: string; w?: number}> = ({a, dx, seed, y = -330, color = P.ink, w = 5}) => {
  const r = Math.max(a.brow, 0) * 12 + a.wide * 4;
  const worry = Math.max(-a.brow, 0);
  return (
    <g>
      {[-1, 1].map((side) => {
        const outer: Pt = [side * (dx + 17), y - r + worry * 5];
        const inner: Pt = [side * (dx - 13), y - r - worry * 11];
        return <Stroke key={side} pts={linePts(side < 0 ? outer : inner, side < 0 ? inner : outer, 4, -2, seed + side)} w={w} color={color} seed={seed + side} />;
      })}
    </g>
  );
};

const Mouth: React.FC<{a: Act; seed: number; y?: number; w?: number}> = ({a, seed, y = -250, w = 34}) => {
  const s = a.smile;
  const m = a.mouth;
  const hw = w / 2 + Math.max(0, s) * 4 - m * 4;
  if (m < 0.08) {
    const pts: Pt[] = [
      [-hw, y - s * 7],
      [-hw * 0.4, y + s * 7],
      [hw * 0.4, y + s * 7],
      [hw, y - s * 7],
    ];
    return <Stroke pts={pts} w={4.5} seed={seed} />;
  }
  const open = 6 + m * 24;
  const pts: Pt[] = [
    [-hw, y - s * 6],
    [-hw * 0.5, y - 3 + s * 3],
    [hw * 0.5, y - 3 + s * 3],
    [hw, y - s * 6],
    [hw * 0.55, y + open * 0.8 + s * 4],
    [0, y + open],
    [-hw * 0.55, y + open * 0.8 + s * 4],
  ];
  return <Shape pts={pts} fill="#6B2D27" w={4} seed={seed} misreg={0} amp={0.8} />;
};

const Cheeks: React.FC<{dx: number; seed: number; y?: number; o?: number}> = ({dx, seed, y = -262, o = 0.55}) => (
  <g opacity={o}>
    <Shape pts={ellipsePts(-dx, y, 17, 10, seed, 12)} fill={P.blush} ink={null} misreg={0} seed={seed} />
    <Shape pts={ellipsePts(dx, y, 17, 10, seed + 1, 12)} fill={P.blush} ink={null} misreg={0} seed={seed + 1} />
  </g>
);

const Nose: React.FC<{seed: number}> = ({seed}) => <Stroke pts={[[-2, -284], [-7, -266], [3, -264]]} w={3.6} seed={seed} />;

/* ---------------- bodies ---------------- */

const torsoPts = (wTop: number, wBot: number, top = -190): Pt[] => [
  [-wTop * 0.35, top - 6],
  [wTop * 0.35, top - 6],
  [wTop * 0.85, top + 14],
  [wTop, top + 60],
  [wBot, 0],
  [-wBot, 0],
  [-wTop, top + 60],
  [-wTop * 0.85, top + 14],
];

const Legs: React.FC<{walk: number; phase: number; pants: string; seed: number}> = ({walk, phase, pants, seed}) => {
  const sw = Math.sin(phase) * 20 * walk;
  const leg = (x: number, ang: number, s: number) => (
    <g transform={`rotate(${ang.toFixed(2)} ${x} 0)`}>
      <Shape pts={rectPts(x - 34, -10, 68, 230, s, 14)} fill={pants} seed={s} />
      <Shape pts={ellipsePts(x + 12, 226, 46, 20, s + 2, 14)} fill={P.ink} seed={s + 2} misreg={1} />
    </g>
  );
  return (
    <g>
      {leg(-44, sw, seed)}
      {leg(44, -sw, seed + 5)}
    </g>
  );
};

export type Pose = 'neutral' | 'whisper' | 'hold' | 'point' | 'laptop' | 'phone';

type CharProps = {
  a: Act;
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  pose?: Pose;
  legs?: boolean;
  walk?: number;
  walkPhase?: number;
  name: string;
  children?: React.ReactNode;
};

const Wrap: React.FC<CharProps & {seed: number; body: React.ReactNode; head: React.ReactNode; front?: React.ReactNode; legsColor: string}> = ({
  a,
  x,
  y,
  s = 1,
  flip,
  legs,
  walk = 0,
  walkPhase = 0,
  body,
  head,
  front,
  name,
  seed,
  legsColor,
}) => {
  const lean = a.lean;
  const br = a.breath;
  const legH = legs ? 230 : 0;
  return (
    <g transform={`translate(${x.toFixed(1)},${(y + a.bob - legH * s).toFixed(1)}) scale(${(flip ? -s : s).toFixed(3)},${s.toFixed(3)})`}>
      {legs ? <Legs walk={walk} phase={walkPhase} pants={legsColor} seed={seed + 300} /> : null}
      <g transform={`rotate(${lean.toFixed(2)} 0 ${legs ? 0 : 40})`}>
        <g transform={`translate(0,${(-br * 3).toFixed(2)}) scale(1,${(1 + br * 0.012).toFixed(4)})`}>{body}</g>
        <g transform={`translate(0,${(-br * 4 + a.nod).toFixed(2)}) rotate(${a.tilt.toFixed(2)} 0 -205)`}>{head}</g>
        {front}
      </g>
      <rect data-qa={`face:${name}`} data-qa-type="face" x={-95} y={-405} width={190} height={215} fill="none" stroke="none" transform={`translate(0,${a.bob})`} />
    </g>
  );
};

/* ---------------- Maya: dark bob, teal sweater, gold earrings ---------------- */

export const Maya: React.FC<CharProps> = (props) => {
  const {a, pose = 'neutral'} = props;
  const seed = 1000;
  const body = (
    <g>
      <Shape pts={rectPts(-24, -232, 48, 60, seed + 1, 8)} fill={P.mayaSkin} seed={seed + 1} />
      <Shape pts={torsoPts(150, 168)} fill={P.mayaTop} seed={seed + 2} />
      <Stroke pts={[[-40, -196], [0, -150], [40, -196]]} w={4} seed={seed + 3} />
      <Stroke pts={[[-92, -120], [-100, -30]]} w={3.5} seed={seed + 4} />
      <Stroke pts={[[92, -120], [100, -30]]} w={3.5} seed={seed + 5} />
    </g>
  );
  const head = (
    <g>
      <Shape pts={[[-108, -330], [-100, -400], [-40, -428], [40, -428], [100, -400], [108, -330], [112, -228], [70, -214], [-70, -214], [-112, -228]]} fill={P.mayaHair} seed={seed + 10} />
      <Shape pts={ellipsePts(HEAD[0], HEAD[1] + 8, 78, 88, seed + 11, 20)} fill={P.mayaSkin} seed={seed + 11} />
      <Shape pts={[[-96, -300], [-90, -372], [-30, -404], [40, -402], [92, -372], [96, -300], [70, -334], [10, -350], [-40, -340]]} fill={P.mayaHair} seed={seed + 12} />
      <Shape pts={ellipsePts(-80, -268, 7, 8, seed + 13, 10)} fill={P.gold} seed={seed + 13} w={3} />
      <Shape pts={ellipsePts(80, -268, 7, 8, seed + 14, 10)} fill={P.gold} seed={seed + 14} w={3} />
      <Cheeks dx={48} seed={seed + 15} />
      <Eyes a={a} dx={30} seed={seed + 20} />
      <Brows a={a} dx={30} seed={seed + 30} y={-326} />
      <Nose seed={seed + 40} />
      <Mouth a={a} seed={seed + 41} />
    </g>
  );
  const front =
    pose === 'hold' ? (
      <g>
        <Shape pts={rectPts(-120, -128, 150, 70, seed + 60, 6)} fill={P.bill} seed={seed + 60} />
        <Shape pts={rectPts(-110, -142, 150, 70, seed + 61, 6)} fill={P.bill} seed={seed + 61} />
        <Shape pts={ellipsePts(-35, -107, 20, 20, seed + 62, 12)} fill="#7FB06E" seed={seed + 62} w={3} />
        <Shape pts={ellipsePts(-130, -100, 24, 20, seed + 63, 12)} fill={P.mayaSkin} seed={seed + 63} />
        <Shape pts={ellipsePts(48, -100, 24, 20, seed + 64, 12)} fill={P.mayaSkin} seed={seed + 64} />
      </g>
    ) : null;
  return <Wrap {...props} seed={seed} body={body} head={head} front={front} legsColor="#3B4A5E" />;
};

/* ---------------- Coworker: curly hair, coral shirt, whispers ---------------- */

const CURLS: [number, number, number][] = [
  [-82, -330, 34], [-58, -380, 36], [-14, -402, 38], [34, -398, 36], [74, -368, 36], [92, -322, 30],
  [-96, -290, 26], [96, -284, 24], [-30, -360, 30], [20, -362, 30], [60, -340, 26], [-60, -342, 28],
];

export const Coworker: React.FC<CharProps> = (props) => {
  const {a, pose = 'neutral'} = props;
  const seed = 2000;
  const body = (
    <g>
      <Shape pts={rectPts(-24, -232, 48, 60, seed + 1, 8)} fill={P.cwSkin} seed={seed + 1} />
      <Shape pts={torsoPts(142, 160)} fill={P.cwTop} seed={seed + 2} />
      <Stroke pts={[[-34, -196], [0, -176], [34, -196]]} w={4} seed={seed + 3} />
    </g>
  );
  const head = (
    <g>
      {CURLS.slice(0, 8).map(([cx, cy, r], i) => (
        <Shape key={i} pts={ellipsePts(cx, cy, r, r * 0.92, seed + 10 + i, 12)} fill={P.cwHair} seed={seed + 10 + i} w={3.5} />
      ))}
      <Shape pts={ellipsePts(-78, -280, 14, 20, seed + 29, 10)} fill={P.cwSkin} seed={seed + 29} w={3.5} />
      <Shape pts={ellipsePts(78, -280, 14, 20, seed + 30, 10)} fill={P.cwSkin} seed={seed + 30} w={3.5} />
      <Shape pts={ellipsePts(HEAD[0], HEAD[1] + 10, 76, 86, seed + 31, 20)} fill={P.cwSkin} seed={seed + 31} />
      {CURLS.slice(8).map(([cx, cy, r], i) => (
        <Shape key={i} pts={ellipsePts(cx, cy, r, r * 0.9, seed + 40 + i, 12)} fill={P.cwHair} seed={seed + 40 + i} w={3.5} />
      ))}
      <Cheeks dx={46} seed={seed + 50} o={0.3} />
      <Eyes a={a} dx={29} seed={seed + 51} />
      <Brows a={a} dx={29} seed={seed + 60} y={-324} w={6} />
      <Stroke pts={[[-1, -284], [-8, -266], [4, -263]]} w={3.6} seed={seed + 70} />
      <Mouth a={a} seed={seed + 71} w={30} />
    </g>
  );
  const front =
    pose === 'whisper' ? (
      <g>
        <Shape pts={[[70, -150], [118, -170], [130, -230], [104, -246], [80, -200], [52, -170]]} fill={P.cwTop} seed={seed + 80} />
        <Shape pts={ellipsePts(96, -258, 24, 32, seed + 81, 12)} fill={P.cwSkin} seed={seed + 81} />
        <Stroke pts={[[118, -280], [134, -300]]} w={3.5} seed={seed + 82} />
        <Stroke pts={[[124, -262], [146, -270]]} w={3.5} seed={seed + 83} />
      </g>
    ) : pose === 'point' ? (
      <g>
        <Shape pts={[[110, -150], [190, -190], [230, -200], [226, -176], [190, -160], [130, -110]]} fill={P.cwTop} seed={seed + 84} />
        <Shape pts={ellipsePts(240, -190, 22, 16, seed + 85, 12)} fill={P.cwSkin} seed={seed + 85} />
      </g>
    ) : null;
  return <Wrap {...props} seed={seed} body={body} head={head} front={front} legsColor="#2F3B52" />;
};

/* ---------------- Dan: bald, grey beard, round glasses, mustard cardigan ---------------- */

export const Dan: React.FC<CharProps> = (props) => {
  const {a, pose = 'neutral'} = props;
  const seed = 3000;
  const body = (
    <g>
      <Shape pts={rectPts(-26, -232, 52, 60, seed + 1, 8)} fill={P.danSkin} seed={seed + 1} />
      <Shape pts={torsoPts(152, 170)} fill={P.danTop} seed={seed + 2} />
      <Shape pts={[[-44, -192], [44, -192], [12, -40], [-12, -40]]} fill={P.white} seed={seed + 3} />
      <Stroke pts={[[-44, -192], [-8, -30]]} w={4} seed={seed + 4} />
      <Stroke pts={[[44, -192], [8, -30]]} w={4} seed={seed + 5} />
      {[-120, -86, -52].map((yy, i) => (
        <Shape key={i} pts={ellipsePts(24, yy, 5, 5, seed + 6 + i, 8)} fill={P.ink} ink={null} misreg={0} seed={seed + 6 + i} />
      ))}
    </g>
  );
  const head = (
    <g>
      <Shape pts={ellipsePts(-80, -284, 14, 22, seed + 9, 10)} fill={P.danSkin} seed={seed + 9} w={3.5} />
      <Shape pts={ellipsePts(80, -284, 14, 22, seed + 10, 10)} fill={P.danSkin} seed={seed + 10} w={3.5} />
      <Shape pts={ellipsePts(HEAD[0], HEAD[1] + 2, 80, 92, seed + 11, 20)} fill={P.danSkin} seed={seed + 11} />
      <Shape pts={[[-82, -330], [-66, -350], [-60, -300], [-74, -270], [-86, -296]]} fill={P.danHair} seed={seed + 12} w={3.5} />
      <Shape pts={[[82, -330], [66, -350], [60, -300], [74, -270], [86, -296]]} fill={P.danHair} seed={seed + 13} w={3.5} />
      <Shape pts={[[-72, -268], [-46, -250], [0, -242], [46, -250], [72, -268], [66, -226], [36, -202], [0, -194], [-36, -202], [-66, -226]]} fill={P.danHair} seed={seed + 14} />
      <Shape pts={[[-30, -258], [0, -264], [30, -258], [20, -248], [0, -252], [-20, -248]]} fill="#A7A29A" seed={seed + 15} w={3.5} />
      <Eyes a={a} dx={32} seed={seed + 20} y={-296} />
      <Shape pts={ellipsePts(-32, -296, 27, 24, seed + 21, 16)} ink={P.ink} w={4.5} seed={seed + 21} />
      <Shape pts={ellipsePts(32, -296, 27, 24, seed + 22, 16)} ink={P.ink} w={4.5} seed={seed + 22} />
      <Stroke pts={[[-6, -298], [0, -302], [6, -298]]} w={4} seed={seed + 23} />
      <Brows a={a} dx={32} seed={seed + 30} y={-334} color="#8E8982" w={6} />
      <Stroke pts={[[-2, -282], [-8, -266], [4, -264]]} w={3.6} seed={seed + 40} />
      <Mouth a={a} seed={seed + 41} y={-238} w={30} />
      <Cheeks dx={52} seed={seed + 42} y={-262} o={0.35} />
    </g>
  );
  const front =
    pose === 'laptop' ? (
      <g>
        <Shape pts={ellipsePts(-90, -70, 26, 20, seed + 60, 12)} fill={P.danSkin} seed={seed + 60} />
        <Shape pts={ellipsePts(90, -70, 26, 20, seed + 61, 12)} fill={P.danSkin} seed={seed + 61} />
      </g>
    ) : pose === 'phone' ? (
      <g>
        <Shape pts={rectPts(40, -170, 56, 96, seed + 62, 8)} fill="#3A3F4A" seed={seed + 62} />
        <Shape pts={ellipsePts(66, -90, 26, 22, seed + 63, 12)} fill={P.danSkin} seed={seed + 63} />
      </g>
    ) : null;
  return <Wrap {...props} seed={seed} body={body} head={head} front={front} legsColor="#6B5A48" />;
};

/** Boss's arm sliding in from the right with a sleeve and cuff. */
export const BossArm: React.FC<{x: number; y: number; s?: number; children?: React.ReactNode}> = ({x, y, s = 1, children}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <Shape pts={rectPts(40, -44, 560, 88, 4001, 12)} fill={P.bossSleeve} seed={4001} />
    <Shape pts={rectPts(20, -48, 46, 96, 4002, 8)} fill={P.white} seed={4002} />
    <Shape pts={[[-70, -30], [24, -40], [28, 40], [-60, 34], [-96, 14], [-92, -12]]} fill={P.mayaSkin} seed={4003} />
    <Stroke pts={[[-80, -2], [-40, 0]]} w={3.5} seed={4004} />
    {children}
  </g>
);
