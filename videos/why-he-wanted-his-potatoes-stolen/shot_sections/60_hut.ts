
// =====================================================================================================================
// SHOT 6 (1160-1375) = SCENE 5, the EXPLANATION in its own place and light: the guard hut at night (deep blue + a warm
// candle), in by a LIGHT dissolve (the hero's lantern -> the candle flame). "Nobody wants pig food. But if the king's
// soldiers guard it, it must be worth stealing. And every night at sundown, he quietly sent the guards to bed."
// From the candle the camera finds the window: outside, two villagers crouch behind the field wall; one shrugs at the
// potato rows; a soldier marches past on patrol; their eyes go huge and they rub their hands as the rows sparkle. The
// camera slides back across the bunks: the soldiers snore in bed, the hero tiptoes in with a finger to his lips, pulls a
// blanket over the last one, and slips out of the door (shape match into the STAFF ONLY door).
const THA: V3 = [0.55, 0, -5.7], THB: V3 = [1.55, 0, -5.75], PA: V3 = [-2.6, 0, -8.6], PB: V3 = [4.6, 0, -8.6];
const BUNKS: [string, V3][] = [["sergeant", [-2.56, 0.48, -0.6]], ["sol1", [-2.56, 1.5, -0.6]], ["sol2", [-2.56, 0.48, 0.4]], ["sol3", [-2.56, 1.5, 0.4]]];
const CANDLE: V3 = [1.42, 0.76, -1.18], HDOOR: V3 = [2.35, 0, 0.9];
SHOT_CAMS[6] = () => [
  K(1156, (f) => ({ pos: [CANDLE[0] + 0.55, CANDLE[1] + 0.3, CANDLE[2] + 0.75] as V3, look: [CANDLE[0], CANDLE[1] + 0.18, CANDLE[2]] as V3, fov: 40 + 0 * f })),
  K(1166, F(() => ({ pos: [0.9, 1.45, 0.4] as V3, look: [1.0, 1.05, -7.0] as V3, fov: 40 }), 1166, 0.0022, [[1265, 0.006, 10]]), 26),       // through the window
  K(1284, F(() => ({ pos: [2.6, 1.8, 2.25] as V3, look: [-2.2, 1.0, -0.4] as V3, fov: 50 }), 1284, 0.0016), 30),                            // slide back across the bunks
  K(1352, (f) => { const k = sm(f, 1352, 1375); return { pos: lerp3([-1.2, 1.6, -1.2], [1.0, 1.45, 0.3], k), look: [3.0, 1.15, 0.9] as V3, fov: 42 }; }, 14), // after him to the door
];
SHOT_ACTS[6] = (f, s) => {
  const pat = walkPath(6, s, [PA, PB], f, 1196, 1262);
  const hw = walkPath(6, s, [HDOOR, [-1.5, 0, 0.0]], f, 1290, 1326), out = walkPath(6, s, [[-1.5, 0, 0.0], HDOOR], f, 1346, 1372);
  const tuck = sm(f, 1330, 1338) * (1 - sm(f, 1340, 1346));
  const zz = Math.floor(f / 40) % 4;
  return {
    ctl: { candle: 1, smoke: 0, moon: 1, door: sm(f, 1288, 1296) * (1 - sm(f, 1300, 1310)) + sm(f, 1362, 1372) },
    cast: [
      C("farmer", THA, flow(f, [
        [1156, { mode: "kneel", expr: "bored", facing: 1, look: 0.4 }],
        [1168, { mode: "kneel", expr: "bored", facing: 1, armR: [[34, 20], [52, -6]] as A2, armL: [[-34, 20], [-52, -6]] as A2 }, 5],      // shrugs at the rows: pig food
        [1200, { mode: "kneel", expr: "stare", facing: 1, look: -0.8 }, 4],
        [1262, { mode: "kneel", expr: "shock", facing: 1, armR: [[22, 30], [8, 34]] as A2, armL: [[-22, 30], [-8, 34]] as A2, armRFront: true, armLFront: true }, 2],    // eyes huge
        [1272, { mode: "kneel", expr: "sly", facing: 1, armR: [[22, 30], [6 + 4 * Math.sin(f * 0.9), 32]] as A2, armL: [[-22, 30], [-6 - 4 * Math.sin(f * 0.9), 32]] as A2, armRFront: true, armLFront: true }, 3], // rubs his hands
      ]), { idx: 48 }),
      C("vil1", THB, flow(f, [
        [1156, { mode: "kneel", expr: "neutral", facing: -1, look: -0.4 }],
        [1202, { mode: "kneel", expr: "stare", facing: -1, look: -0.8 }, 4],
        [1263, { mode: "kneel", expr: "eureka", facing: -1, armR: [[22, 30], [8, 34]] as A2, armL: [[-22, 30], [-8, 34]] as A2, armRFront: true, armLFront: true }, 2],
        [1273, { mode: "kneel", expr: "sly", facing: -1, armR: [[22, 30], [6 - 4 * Math.sin(f * 0.9), 32]] as A2, armL: [[-22, 30], [-6 + 4 * Math.sin(f * 0.9), 32]] as A2, armRFront: true, armLFront: true }, 3],
      ]), { idx: 41 }),
      C("sol5", pat.p, pat.moving ? pose(null, { mode: "walk", phase: pat.phase, facing: pat.facing, expr: "stern", armR: [[24, 26], [20, 40]] as A2, armRFront: true, propR: "musket" }) : pose(null, { expr: "stern", facing: pat.facing, armR: [[24, 26], [20, 40]] as A2, armRFront: true, propR: "musket" }), { idx: 20 }),
      ...BUNKS.map(([who, p], i) => C(who, [p[0], p[1] + 0.27, p[2]], pose(null, { expr: "sleep", mouth: zz === i ? "o" : undefined, armR: [[24, 30], [10, 56]] as A2, armL: [[-24, 30], [-10, 56]] as A2, armRFront: true, armLFront: true }), { idx: 30 + i, roll: -Math.PI / 2, blob: false })),
      C("parm", f < 1326 ? hw.p : out.p, (hw.moving || out.moving) ? pose(null, { mode: "walk", phase: (f < 1326 ? hw.phase : out.phase) * 0.6, facing: f < 1326 ? hw.facing : out.facing, expr: "sly", tilt: 8, armR: [[16, -2], [2, -34]] as A2, armRTop: true })
        : f < 1290 ? pose(null, { expr: "sly", facing: -1 }) : flow(f, [
          [1326, { expr: "sly", facing: -1, armR: [[16, -2], [2, -34]] as A2, armRTop: true }],
          [1330, { expr: "smile", facing: -1, tilt: 14, armR: [[34, 20], [64, 30 + 10 * tuck]] as A2, armRFront: true }, 4],                 // pulls the blanket up
          [1342, { expr: "smug", facing: 1, armR: [[16, -2], [2, -34]] as A2, armRTop: true }, 3],
        ]), { idx: 1, scale: f < 1288 ? 0.001 : 1 }),
    ],
    fx: fxs(
      f < 1176 ? glowBurst("cand" + Math.round(lin(f, 1156, 1176) * 8), [CANDLE[0], CANDLE[1] + 0.2, CANDLE[2]], 1.6 - 1.2 * lin(f, 1156, 1176), 1 - 0.6 * lin(f, 1156, 1176), "255,200,120") : null,
      f >= 1266 && f < 1286 ? [0, 1, 2].map((i) => sparkle("row" + i, [-0.6 + i * 1.4, 0.5, -10 - i * 2], (f - 1266 + i * 4) % 14, 0.45)) : null,
      f >= 1284 ? zzz([BUNKS[zz][1][0] + 0.1, BUNKS[zz][1][1] + 0.6, BUNKS[zz][1][2] - 1.0], f) : null,
    ),
    focus: f < 1166 ? CANDLE : f < 1284 ? [1.0, 0.8, -5.7] : [-1.8, 1.2, -0.2],
    subj: f < 1166 ? null : f < 1284 ? "farmer" : "parm",
  };
};
lens(1156, 6, 1); lens(1166, 3, 26); lens(1284, 4, 24); lens(1352, 4, 12);
