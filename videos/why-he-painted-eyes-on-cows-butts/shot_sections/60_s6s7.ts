
// =====================================================================================================================
// SHOT 6 (1032-1296) = SCENE 6, the kraal at night, the climax (time-jump crossfade, same framing as the end of shot 5):
// "The next night, another plain cow disappears. The farmers stop laughing. Then a lion creeps up on a painted cow, sees
// two huge eyes staring back, and slowly backs away." The hero keeps watch with a lantern; behind him a plain cow (cow7)
// is yanked off backwards through the west gap into the dark (dust). The farmers at the fence with lanterns: grins drop.
// The camera glides west: the lion creeps out of the grass through the gap toward cow9's rump; over the lion's shoulder
// the two painted eyes fill the frame; hard cut to the lion's face: eyes go huge, sweat; it backs away step by step into
// the grass and the camera rides with it (dissolve hidden in the grass blades into the explanation).
const LION6 = (f: number) => {
  if (f < 1140) return { p: [-15.5, 0, 0.9] as V3, mode: "kneel", ph: 0, facing: 1, expr: "sly" as Face, sweat: 0, lift: 0 };
  if (f < 1196) { const k = sm(f, 1140, 1196); return { p: lerp3([-15.5, 0, 0.9], [-9.6, 0, 1.4], k), mode: "stride", ph: ((f - 1140) / 30) % 1, facing: 1, expr: "sly" as Face, sweat: 0, lift: 0 }; }
  if (f < 1262) return { p: [-9.6, 0, 1.4] as V3, mode: "kneel", ph: 0, facing: 1, expr: (f < 1214 ? "sly" : "shock") as Face, sweat: f >= 1222 ? 1 : 0, lift: 0 };
  const k = sm(f, 1262, 1296); return { p: lerp3([-9.6, 0, 1.4], [-14.6, 0, 1.0], k), mode: "stride", ph: 1 - (((f - 1262) / 34) % 1), facing: 1, expr: "shock" as Face, sweat: 1, lift: 0 };
};
const COW9_RUMP: V3 = [herdOf("cow9").pos[0], 0, herdOf("cow9").pos[2]];
SHOT_CAMS[6] = () => [
  K(1032, F(() => ({ pos: [0.6, 1.35, 7.0] as V3, look: [3.5, 0.95, 4.5] as V3, fov: 40 }), 952, 0.0022)),
  K(1046, FS(() => ({ pos: [1.4, 1.8, 7.3] as V3, look: [-3.0, 0.9, -3.0] as V3, fov: 46 }), 1046, 0.0012, -0.002, [], 1070), 30),
  K(1092, FS(() => ({ pos: [0.2, 1.8, 16.6] as V3, look: [-4.9, 1.35, 10.6] as V3, fov: 46 }), 1092, 0.0018, 0.002, [[1109, 0.006, 10]], 1110), 22),
  K(1126, F((f) => { const lp = LION6(f).p; return { pos: [lp[0] + 1.6, 1.25, lp[2] + 5.4] as V3, look: [lp[0] + 0.9, 0.75, lp[2]] as V3, fov: 42 }; }, 1126, 0.0012), 30),
  K(1196, F(() => ({ pos: [-12.3, 1.05, 1.9] as V3, look: [-6.0, 0.95, 1.6] as V3, fov: 40 }), 1196, 0.0026, [[1228, 0.007, 12]]), 16),
  K(1216, F(() => ({ pos: [-11.8, 1.1, 4.8] as V3, look: [-9.4, 0.95, 1.4] as V3, fov: 34 }), 1216, 0.0028), 1, true),       // reaction close-up (hard cut)
  K(1260, F((f) => { const k = sm(f, 1260, 1296); return { pos: lerp3([-7.0, 1.3, 4.6], [-11.4, 1.0, 4.4], k), look: lerp3([-9.8, 0.8, 1.4], [-14.6, 0.7, 0.9], k), fov: 42 }; }, 1260, 0.0012), 14),
];
SHOT_ACTS[6] = (f, s) => {
  const lion = LION6(f), yank = sm(f, 1074, 1084);
  const c7 = herdOf("cow7"), c7p = lerp3(c7.pos, [-10.6, 0, -0.3], yank);
  const lanternF = (who: string, i: number): CastPlace => C(who, [FENCE[who][0] + 0.2 * i, 0, 11.35 + 0.15 * (i % 2)] as V3, flow(f, [
    [1032, { expr: "grin", facing: -1, armR: [[18, 20], [24, 40]] as A2, armRFront: true, propR: "lantern" }],
    [1080 + i, { expr: "shock", facing: -1, armR: [[18, 20], [24, 40]] as A2, armRFront: true, propR: "lantern" }, 3],
    [1106 + i, { expr: "dismay", facing: -1, armR: [[18, 20], [24, 40]] as A2, armRFront: true, propR: "lantern", sweat: 1 }, 4],   // they stop laughing
    [1150, { expr: "stare", facing: -1, look: -1, armR: [[18, 4], [28, -12]] as A2, armRFront: true, propR: "lantern" }, 8],
  ]), { idx: 10 + i });
  return {
    ctl: { night: 1, fire: 1, smoke: 0.6 },
    cast: [
      ...herdCast(6, s, f, ["cow1", "cow7", "cow9"], { cow2: { expr: "nervous", sweat: 1 }, cow5: { expr: "nervous", sweat: 1 } }),
      ...(f < 1084 ? [cowC(6, s, f, c7, { ...flow(f, [[1032, { expr: "sleep" }], [1071, { expr: "aghast" }, 2]]), mode: f > 1072 ? "walk" : "stand", phase: ((f - 1072) / 6) % 1 }, {}, c7p)] : []),
      cowC(6, s, f, herdOf("cow9"), flow(f, [[1032, { expr: "sleep" }], [1200, { expr: "neutral" }], [1252, { expr: "smug" }]])),   // she never even woke up properly
      C("picasso", HERO5_SPOT, flow(f, [
        [1032, { expr: "calm", facing: 1, armL: [[-14, 26], [-4, 46]] as A2, propL: "lantern", armR: [[20, 20], [26, 40]] as A2 }],
        [1078, { expr: "stare", facing: -1, look: -1, armL: [[-14, 26], [-4, 46]] as A2, propL: "lantern" }, 6],
      ]), { idx: 1 }),
      lanternF("fmBig", 0), lanternF("fmThin", 1), lanternF("fmAunt", 2), lanternF("fmTall", 3),
      C("lion", lion.p, { ...flow(f, [[1032, { expr: "sly" }], [1214, { expr: "aghast", sweat: 1 }, 2]]), mode: lion.mode as FigOpts["mode"], phase: lion.ph, facing: lion.facing }, { idx: 30, scale: 1.75 }),
    ],
    fx: fxs(
      f >= 1076 && f < 1100 ? [0, 1].map((i) => dustCard("yank" + i, [c7.pos[0] - 3 - i * 1.5, 0.6, c7.pos[2] - 0.6], 1.6, 0.9 * (1 - (f - 1076) / 24), i + 2)) : null,
      f >= 1226 && f < 1252 ? bang([-9.4, 2.55, 1.4], f - 1226) : null,
    ),
    focus: f < 1092 ? [3.4, 1.0, 4.6] : f < 1126 ? [-3.9, 1.5, 11.2] : f < 1196 ? lion.p : f < 1216 ? COW9_RUMP : [-9.4, 1.25, 1.4],
    subj: f < 1046 ? "picasso" : f < 1092 ? null : f < 1126 ? "fmBig" : null,
  };
};
lens(1032, 6, 1); lens(1046, 2, 20); lens(1092, 4, 16); lens(1126, 3, 20); lens(1196, 7, 12); lens(1216, 9, 1); lens(1260, 4, 20);

// =====================================================================================================================
// SHOT 7 (1296-1500) = SCENE 7, the explanation in its own place and light: the tall grass at deep-blue night (the camera
// came in with the backing lion). "That's the trick. A lion is an ambush hunter, and it only attacks something that isn't
// looking. The second it thinks it's been spotted, the hunt is over." The camera slides low through the grass: the lion
// crouched at the edge of a clearing, sly, tail flicking; an impala grazes with its back to it; the lion creeps one step;
// the impala's head snaps round and stares; the lion freezes mid-step, one paw in the air; its face drops (paw frozen,
// position match into the kid's frozen hand).
const L7A: V3 = [-16.4, 0, -1.2], L7B: V3 = [-17.4, 0, -1.9], IMP7: V3 = [-21.6, 0, -4.4];
SHOT_CAMS[7] = () => [
  K(1296, F((f) => { const k = sm(f, 1296, 1360); return { pos: lerp3([-11.4, 1.4, 4.6], [-12.2, 1.7, 2.6], k), look: lerp3([-15.6, 0.7, -0.6], [-19.6, 0.9, -3.4], k), fov: 42 }; }, 1296, 0.0012)),
  K(1372, FS(() => ({ pos: [-12.4, 1.7, 2.4] as V3, look: [-19.8, 0.9, -3.6] as V3, fov: 44 }), 1372, 0.0016, -0.002, [], 1420), 30),
  K(1438, F((f) => { const k = sm(f, 1438, 1500); return { pos: lerp3([-14.4, 1.35, 1.8], [-14.9, 1.15, 0.9], k), look: lerp3([-18.4, 0.85, -2.6], [-17.6, 0.75, -1.9], k), fov: lerp(42, 34, k) }; }, 1438, 0.002, [[1475, 0.006, 10]]), 22),
];
SHOT_ACTS[7] = (f) => {
  const step = sm(f, 1392, 1430), lp = lerp3(L7A, L7B, step);
  return {
    ctl: { night: 1, fire: 0, smoke: 0 },
    cast: [
      C("lion", lp, flow(f, [
        [1296, { mode: "kneel", expr: "sly", facing: -1 }],
        [1340, { mode: "kneel", expr: "sly", facing: -1, tilt: 3 }, 8],                         // ambush hunter: low, still, tail flicking
        [1390, { mode: "stride", expr: "sly", facing: -1, phase: 0.1 + 0.5 * step }, 8],       // creeps one step
        [1436, { mode: "stride", expr: "shock", facing: -1, phase: 0.6, lift: 1 }, 3],         // spotted: freezes, paw in the air
        [1474, { mode: "stride", expr: "dismay", facing: -1, phase: 0.6, lift: 1, sweat: 1 }, 6],  // the hunt is over
      ]), { idx: 30, scale: 1.75 }),
      C("impala", IMP7, flow(f, [
        [1296, { expr: "neutral", facing: -1, tilt: 25 }],
        [1432, { expr: "neutral", facing: -1, tilt: 0 }, 4],
        [1437, { expr: "stare", facing: -1, look: -1 }, 3],
      ]), { idx: 31, scale: 1.25 }),
    ],
    fx: fxs(f >= 1438 && f < 1460 ? bang([-21.4, 2.2, -4.4], f - 1438) : null),
    focus: f < 1438 ? lp : [-17.3, 0.7, -1.8],
    subj: null,
  };
};
lens(1296, 6, 1); lens(1372, 4, 20); lens(1438, 7, 24);
