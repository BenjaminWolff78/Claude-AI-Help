
// =====================================================================================================================
// STUDY (Lustig's attic, night). Round window (centre [0, 1.6, -2.8]) with Paris and the lit tower outside; the press
// bench runs front-to-back at x 0.45..1.3 (lever on its -x side); writing desk left. Keep-out: STUDY_SOLIDS.
// =====================================================================================================================
const PRESS: V3 = [-0.02, 0, -1.48];
// ---- S06 (430-510) "So con man Victor Lustig / prints fake government letters"
// Low and drifting sideways along the bench: Lustig, in profile against the moonlit window, hauls the press lever down
// with both hands (thunk + kick), peels out the fresh sheet and holds it up: an official crest. The camera rises to a
// high angle onto the forged letters; a neighbour waters her plant in the lit dormer across the street.
SHOT_CAMS[6] = () => [
  K(430, (f) => { const k = sm(f, 430, 484); return { pos: [lerp(-0.95, -0.5, k), lerp(0.62, 0.78, k), lerp(0.8, 0.6, k)], look: [-0.02, 1.42, -1.5], fov: 44 }; }),
  K(484, F(() => ({ pos: [-0.45, 2.4, -0.05], look: [0.2, 1.2, -1.45], fov: 42 }), 484, 0.0022), 22),
];
SHOT_ACTS[6] = (f, s) => {
  const pull = sm(f, 470, 479) - sm(f, 482, 492), peel = sm(f, 492, 500), show = sm(f, 498, 506);
  let lo: P;
  if (f < 466) lo = { expr: f > 452 ? "smug" : "sly", facing: faceTo(6, s, f, PRESS, [1, 0, -1.48]), headTilt: f > 452 ? -3 : 0, armR: [[24, 10], [40, 0]], armRFront: true, mouth: undefined };
  else if (f < 492) lo = { expr: "strain", facing: faceTo(6, s, f, PRESS, [1, 0, -1.48]), tilt: 8 * pull, armR: [[26, lerp(-14, 10, pull)], [44, lerp(-36, 22, pull)]] as A2, armL: [[18, lerp(-10, 12, pull)], [40, lerp(-34, 22, pull)]] as A2, armRFront: true, armLFront: true, squash: f > 478 && f < 486 ? 0.06 : 0 };
  else lo = { expr: show > 0.5 ? "sly" : "determined", facing: faceTo(6, s, f, PRESS, [1, 0, -1.48]), armR: [[24, lerp(10, -10, show)], [lerp(44, 36, show), lerp(10, -40, show)]] as A2, armRFront: true, propR: peel > 0.4 ? "letter" : undefined, headTilt: 4 * show };
  return {
    ctl: { press: pull, sheet: peel, stamp: 0, lamp: 1 },
    cast: [C("lustig", PRESS, pose(null, lo), { shadow: true }),
      idler("paris4", s.marks.neighbour ?? [0.55, -0.85, -8.02], f, 1, -1, { armR: [[22, 10], [34 + 4 * Math.sin(st(f) * 0.3), 4]] as A2, armRFront: true, expr: "smile" })],
    focus: [0.1, 1.4, -1.48],
  };
};
lens(430, 5, 1);

// =====================================================================================================================
// CAR LOT (modern, night). Hero car side-on at [0, 0, 0.4] (x -2..2, front +x), scratch on its +z front door, rear
// bumper at x -2.05. Keep-out: CARLOT_SOLIDS.
// =====================================================================================================================
const SAL: V3 = [-0.3, 0, 1.75], BUY: V3 = [1.2, 0, 1.95];
// ---- S17 (1376-1512) "It's like a salesman who admits his car has a scratch. / Suddenly, you believe everything else."
// The camera cranes down past the bulb strings to the salesman, who leans in with a magnifier and points out a tiny
// scratch (it sparkles); it tracks along the door to the scratch, then pulls back as the buyer lights up, nods and
// pumps his hand - while behind them the rear bumper sags and drops off. A mechanic and a couple browse the lot.
SHOT_CAMS[17] = () => [
  K(1376, (f) => { const k = sm(f, 1376, 1412); return { pos: [lerp(1.6, 0.6, k), lerp(5.2, 1.55, k), lerp(9.2, 5.6, k)], look: [lerp(0.4, 0.45, k), lerp(0.4, 1.15, k), lerp(-1.0, 1.6, k)], fov: 42 }; }),
  K(1410, F(() => ({ pos: [0.75, 1.05, 3.05], look: [0.35, 0.78, 1.35], fov: 34 }), 1410, 0.003, [[1428, 0.006, 12]]), 26),
  K(1438, F(() => fit([body(SAL), body(BUY), [[-2.05, 0, 0.6], 0, 0.6, 0.3]], -24, 5, 40, 0.88, 0, 0.05), 1438, 0.0016), 56),
];
SHOT_ACTS[17] = (f, s) => {
  const point = sm(f, 1400, 1412), shake = f > 1468 ? Math.sin((f - 1468) * 0.9) * 6 : 0, lit = f >= 1452;
  return {
    ctl: { scratchGlow: sm(f, 1418, 1432) - 0.6 * sm(f, 1460, 1480), bumper: lin(f, 1462, 1492) },
    cast: [
      C("salesman", SAL, pose(null, { expr: f < 1452 ? "sheepish" : "grin", facing: faceTo(17, s, f, SAL, BUY), mouth: talk(f, 1392, 1440), tilt: 8 * point * (f < 1452 ? 1 : 0),
        armR: f < 1466 ? [[26, 8], [lerp(34, 50, point), lerp(26, 22, point)]] as A2 : [[26, 8], [44, 6 + shake]] as A2, armRFront: true, propR: f < 1464 ? "magnifier" : undefined })),
      C("buyer", BUY, pose(null, { expr: lit ? (f > 1466 ? "joy" : "eureka") : "neutral", facing: faceTo(17, s, f, BUY, f < 1440 ? [0.4, 0, 1.3] : SAL), tilt: f < 1446 ? -6 * point : 0, headTilt: f > 1468 ? 5 * Math.sin(f * 0.5) : 0,
        armL: f > 1466 ? [[-26, 8], [-44, 6 - shake]] as A2 : undefined, armLFront: true })),
      C("mechanic", [-2.6, 0, -7.1], pose(null, { expr: "neutral", facing: 1, tilt: 4 * Math.sin(st(f) * 0.3), armR: [[24, 20], [34 + 6 * Math.sin(st(f) * 0.4), 40]] as A2, armRFront: true, propR: "tongs" }), { idx: 60 }),
      chatter("paris1", [2.35, 0, -2.15], f, 1, 1), chatter("paris3", [3.0, 0, -2.3], f, 2, -1),
      C("dealer4", [-1.2, 0, -3.25], pose(null, { expr: "neutral", mode: "kick", facing: 1, phase: ph(f, 24) }), { idx: 61 }),
    ],
    focus: f < 1410 ? [0.45, 1.2, 1.8] : f < 1450 ? [0.4, 0.75, 1.35] : [0.4, 1.3, 1.8], subj: f < 1410 ? "salesman" : f < 1472 ? null : "buyer",
  };
};
lens(1376, 4, 1); lens(1410, 9, 12); lens(1450, 5, 14);

// =====================================================================================================================
// TRAIN compartment at golden dusk (runs along +x; window wall z -1.15, corridor partition z +1.15). Lustig sits on
// bench A (x -0.84), the suitcase on the seat beside him at [-0.78, 0.66, 0]. Keep-out: TRAIN_SOLIDS.
// =====================================================================================================================
const LSIT: V3 = [-0.84, 0.36, -0.78], CASE_TOP: V3 = [-0.78, 0.7, 0.0];
/** the payoff: banknotes burst out of the case and flutter round the compartment (fx cards, no ink) */
const notes = (f: number, f0: number, n = 46): FxSpec[] => {
  const out: FxSpec[] = [];
  for (let i = 0; i < n; i++) {
    const t = f - (f0 + i * 0.55); if (t < 0) continue;
    const r1 = Math.sin(i * 12.9898) * 43758.5453 % 1, r2 = Math.sin(i * 78.233) * 12345.678 % 1, r3 = Math.sin(i * 39.425) * 9876.54 % 1;
    const a = Math.abs(r1), b = Math.abs(r2), c = Math.abs(r3);
    const e = 1 - Math.exp(-t / 9);
    const y = Math.max(0.05, CASE_TOP[1] + (0.8 + 1.1 * a) * e - 0.008 * t + 0.04 * Math.sin(t * 0.25 + i));
    out.push({ kind: "card", key: "note" + (i % 3), pos: [CASE_TOP[0] + (-0.15 + 1.5 * b) * e + 0.05 * Math.sin(t * 0.2 + i), y, CASE_TOP[2] + (-0.9 + 1.7 * c) * e], w: 0.2, h: 0.1, rot: t * (i % 2 ? 0.16 : -0.13) + i, cw: 96, ch: 48,
      draw: (p) => { const g = p.g; g.fillStyle = ["#bfe3a6", "#e9d9a8", "#a8cce8"][i % 3]; g.strokeStyle = "#241726"; g.lineWidth = 5; g.beginPath(); g.roundRect(4, 4, 88, 40, 5); g.fill(); g.stroke();
        g.fillStyle = "rgba(36,23,38,0.55)"; g.beginPath(); g.ellipse(48, 24, 10, 10, 0, 0, 6.3); g.fill(); g.font = "900 16px Georgia"; g.fillText("100", 12, 22); } });
  }
  return out;
};
// ---- S19 (1573-1657) PAYOFF: "Within an hour, Lustig is on a train / to Vienna, / counting cash."
// A: three-quarter on Lustig at the window with the countryside streaming past; he snaps the suitcase open and the
// banknotes burst up and fill the compartment (gold flash, half the frame for 2.2 s); the passenger opposite lowers
// his newspaper. HARD CUT 3 on "Vienna": a low closer angle inside the storm of notes, Lustig licks his thumb and counts.
SHOT_CAMS[19] = () => [
  K(1573, F((f) => ({ pos: [lerp(0.55, 0.35, sm(f, 1573, 1625)), lerp(1.95, 1.7, sm(f, 1573, 1625)), lerp(1.0, 0.8, sm(f, 1573, 1625))], look: [-0.5, 1.0, -0.6], fov: 44 }), 1573, 0.0012)),
  K(1625, F(() => ({ pos: [0.2, 1.38, 0.15], look: [-0.84, 1.3, -0.78], fov: 40 }), 1625, 0.0025), 1, true),
];
SHOT_ACTS[19] = (f, s) => {
  const open = sm(f, 1584, 1592), count = f >= 1630;
  const lo: P = !count
    ? { mode: "sit", expr: open > 0.5 ? "joy" : "sly", facing: faceTo(19, s, f, LSIT, CASE_TOP), armR: [[26, 10], [lerp(36, 50, open), lerp(30, 0, open)]] as A2, armRFront: true, headTilt: 4 * open, mouth: open > 0.5 ? "laugh" : undefined }
    : { mode: "sit", expr: "smug", facing: faceTo(19, s, f, LSIT, [0.5, 1.2, 0.5]), propL: "cash", armL: [[-22, 10], [-14, -6]] as A2, armLFront: true,
      armR: [[22, 4], [lerp(10, 18, Math.abs(Math.sin((f - 1630) * 0.6))), lerp(-30, -8, Math.abs(Math.sin((f - 1630) * 0.6)))]] as A2, armRFront: true, mouth: f < 1636 ? "lick" : talk(f, 1638, 1657) };
  const pp: P = f < 1596 ? { mode: "sit", expr: "neutral", facing: -1, propR: "newspaper", armR: [[22, 0], [26, -24]] as A2, armRFront: true }
    : { mode: "sit", expr: "shock", facing: -1, propR: "newspaper", armR: [[22, 14], [26, 22]] as A2, armRFront: false, squash: f < 1602 ? 0.15 : 0 };
  return {
    ctl: { case: open, lean: 0.4 * Math.sin(f * 0.07), door: 0 },
    cast: [C("lustig", LSIT, pose(null, lo), { shadow: false }), C("dealer3", [0.84, 0.36, -0.78], pose(null, pp), { idx: 2 }),
      C("clerk2", [0.84, 0.36, 0.75], pose(null, { mode: "sit", expr: "blank", facing: -1, headTilt: 10 + 2 * Math.sin(f * 0.1) }), { idx: 3 })],
    fx: notes(f, 1589),
    focus: [-0.8, 1.15, -0.7], subj: null,
  };
};
lens(1573, 6, 1); lens(1625, 5, 1);
