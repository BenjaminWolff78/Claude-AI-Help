
// =====================================================================================================================
// SHOT 1 (0-222) = SCENE 1, the kraal at golden morning, one continuous camera path (hook + "You see," + the problem):
// "A guy saved a bunch of lions by painting eyes on cows' butts. You see, in Botswana, lions kept eating the cows, so the
// farmers kept shooting the lions." Frame 1: low two-shot, the hero mid-stroke on the second giant eye of cow0's rump
// while she looks back over her shoulder; the eye is finished on "butts". "You see": the camera cranes up and back over
// the thorn ring (huts, acacias, the farmers on the fence); a lion slinks out of the tall grass toward the west fence and
// the cows there shuffle away; "shooting": the big farmer on the fence swings his rifle up, BANG (smoke), the lion bolts
// back into the grass. Ends looking west into the low sun (light dissolve into the sunset riverbank).
const HERO1: V3 = [0.12, 0, 6.05];
const LION1 = (f: number) => {
  if (f < 140) return { p: [-16.5, 0, -1.6] as V3, mode: "stride", ph: 0, facing: 1, expr: "sly" as Face };
  if (f < 197) { const k = sm(f, 140, 196); return { p: lerp3([-16.5, 0, -1.6], [-10.6, 0, 0.9], k), mode: "stride", ph: ((f - 140) / 26) % 1, facing: 1, expr: "sly" as Face }; }
  const k = sm(f, 200, 222); return { p: lerp3([-10.6, 0, 0.9], [-17.5, 0, -2.6], k), mode: f < 200 ? "stride" : "walk", ph: ((f - 200) / 9) % 1, facing: -1, expr: "shock" as Face };
};
SHOT_CAMS[1] = () => [
  K(0, FS(() => ({ pos: [0.1, 1.3, 10.6] as V3, look: [-0.15, 1.2, 5.6] as V3, fov: 40 }), 0, 0.0024, 0.0016, [[84, 0.006, 10]])),
  K(100, F((f) => { const k = sm(f, 100, 150); return { pos: lerp3([1.6, 3.2, 15.4], [2.6, 5.0, 17.4], k), look: lerp3([-1.0, 1.2, 3.0], [-3.0, 0.8, 1.0], k), fov: 44 }; }, 100, 0.0012), 50),
  K(146, F((f) => { const k = sm(f, 146, 196), lp = LION1(f).p; return { pos: lerp3([-0.6, 4.2, 15.0], [-3.2, 3.0, 13.8], k), look: [lp[0] + 2.4, 0.9, lp[2] + 1.6] as V3, fov: 42 }; }, 146, 0.0014), 40),
  K(182, F((f) => { const k = sm(f, 182, 222); return { pos: lerp3([-4.0, 4.4, 15.8], [-4.6, 4.2, 15.6], k), look: lerp3([-8.6, -0.6, 4.4], [-10.0, -0.4, 2.8], k), fov: 44 }; }, 182, 0.0018), 22),
];
SHOT_ACTS[1] = (f, s) => {
  const stroke = Math.sin(f * 0.42), lion = LION1(f);
  const scat = (who: string, dx: number) => { const c = herdOf(who), k = sm(f, 150, 176); return cowC(1, s, f, c, { ...flow(f, [[0, { expr: "neutral" }], [149, { expr: "aghast" }, 2]]), mode: f > 150 && f < 176 ? "walk" : "stand", phase: ((f - 150) / 14) % 1 }, {}, [c.pos[0] + dx * k, 0, c.pos[2]]); };
  return {
    ctl: { night: 0, fire: 1, smoke: 1 },
    cast: [
      ...herdCast(1, s, f, ["cow0", "cow9", "cow4"]),
      scat("cow9", 2.2), scat("cow4", 1.8),
      cowC(1, s, f, herdOf("cow0"), flow(f, [
        [0, { expr: "neutral", paintK: 0.5, facing: -1 }],
        [62, { expr: "sheepish", paintK: 0.5, facing: -1 }],                       // she feels the second eye going on
        [80, { expr: "sheepish", paintK: 1, facing: -1 }, 2],
      ])),
      C("picasso", HERO1, flow(f, [
        [0, { expr: "determined", facing: -1, tilt: 6, armL: [[-28, 4 + 3 * stroke], [-52, 6 + 10 * stroke]] as A2, armLFront: true, propL: "paintbrush", propK: 1, propLAng: -0.3 + 0.25 * stroke, armR: [[8, 30], [-6, 44]] as A2, propR: "paintPot" }],
        [84, { expr: "smug", facing: -1, tilt: 0, headTilt: 6, armL: [[-22, 4], [-26, -26]] as A2, armLFront: true, propL: "paintbrush", propK: 1, propLAng: -0.2, armR: [[8, 30], [-6, 44]] as A2, propR: "paintPot" }, 10],   // steps back, admires it
        [176, { expr: "nervous", facing: -1, look: -0.8, armL: [[-22, 4], [-26, -26]] as A2, armLFront: true, propL: "paintbrush", propK: 1, armR: [[8, 30], [-6, 44]] as A2, propR: "paintPot" }, 8],
      ]), { idx: 1 }),
      C("fmBig", FENCE.fmBig, flow(f, [
        [0, { mode: "sit", expr: "bored", facing: -1, look: -0.4, armR: [[20, 20], [34, 30]] as A2, armRFront: true, propR: "rifle", propK: 0 }],
        [150, { mode: "sit", expr: "angry", facing: -1, look: -1, armR: [[20, 20], [34, 30]] as A2, armRFront: true, propR: "rifle", propK: 0 }],
        [178, { mode: "sit", expr: "strain", facing: -1, tilt: -6, armL: [[-24, 4], [-40, 0]] as A2, armLFront: true, propL: "rifle", propK: 1, propLAng: Math.PI, armR: [[-16, 10], [-34, 6]] as A2, armRFront: true }, 10], // aims
        [198, { mode: "sit", expr: "shock", facing: -1, tilt: 4, armL: [[-22, -2], [-36, -10]] as A2, armLFront: true, propL: "rifle", propK: 1, propLAng: Math.PI + 0.25 }, 2],          // BANG (kick)
        [206, { mode: "sit", expr: "angry", facing: -1, armL: [[-24, 4], [-40, 0]] as A2, armLFront: true, propL: "rifle", propK: 1, propLAng: Math.PI }, 6],
      ]), { idx: 10 }),
      C("fmThin", FENCE.fmThin, flow(f, [[0, { mode: "sit", expr: "neutral", facing: -1, look: -0.6 }], [152, { mode: "sit", expr: "shock", facing: -1, look: -1 }], [200, { mode: "sit", expr: "aghast", facing: -1, armR: [[16, -6], [8, -30]] as A2 }, 4]]), { idx: 11 }),
      C("fmAunt", FENCE.fmAunt, flow(f, [[0, { mode: "sit", expr: "smile", facing: -1, look: -0.5 }], [152, { mode: "sit", expr: "nervous", facing: -1, look: -1 }], [200, { mode: "sit", expr: "shock", facing: -1, armR: [[14, 4], [6, -20]] as A2, armRFront: true }, 4]]), { idx: 12 }),
      C("fmTall", FENCE.fmTall, flow(f, [[0, { mode: "sit", expr: "bored", facing: -1, look: -0.5 }], [154, { mode: "sit", expr: "stare", facing: -1, look: -1 }], [201, { mode: "sit", expr: "yikes", facing: -1 }, 4]]), { idx: 13 }),
      C("lion", lion.p, { ...flow(f, [[0, { expr: "sly" }], [199, { expr: "shock", sweat: 1 }, 2]]), mode: lion.mode as FigOpts["mode"], phase: lion.ph, facing: lion.facing }, { idx: 30, scale: 1.75 }),
    ],
    fx: fxs(
      f >= 80 && f < 96 ? sparkle("eye1", [-0.25, 1.0, 5.6], f - 80, 0.34) : null,
      shotPuff([-7.4, 1.35, 10.6], f - 198),
      f >= 198 && f < 210 ? glowBurst("muz" + (f - 198), [-7.3, 1.32, 10.65], 0.6, 1 - (f - 198) / 12, "255,236,180") : null,
      f > 200 ? dustTrail("ld", [lion.p[0], 0, lion.p[2]], [-1, -0.4], f, 5, 0.9, 0.6) : null,
      f >= 212 ? glowBurst("sun1_" + Math.round(lin(f, 212, 222) * 8), [-28, 4.5, -6], 14 * lin(f, 212, 222) + 2, lin(f, 212, 222), "255,214,150") : null,
    ),
    focus: f < 100 ? [0, 1.1, 5.6] : f < 186 ? [-9, 0.8, 1.5] : [-6.4, 1.4, 10.6],
    subj: f < 100 ? "picasso" : f < 186 ? "lion" : "fmBig",
  };
};
KICKS.push([198 / 30, 0.8]);
lens(0, 7, 1); lens(100, 0, 30); lens(190, 4, 14);

// =====================================================================================================================
// SHOT 2 (222-342) = SCENE 2, the riverbank at sunset (light dissolve in the sun glare): "Then one evening, he sees an
// antelope spot a sneaking lion, and the lion just quits." The hero sits on a termite mound with binoculars (right, near);
// the camera slides along the reeds to the impala grazing and the lion creeping up behind it; "spot": the impala's head
// comes up and turns to stare straight back at the lion; the lion freezes mid-step, sits, sighs and slinks away; the
// hero lowers the binoculars (eureka). The camera pushes into the impala's staring eye (shape match into the painted eye).
const MOUND: V3 = [-42.5, 1.32, -29.5];
const IMP: V3 = [-55.0, 0, -39.0];
const LION2 = (f: number) => {
  if (f < 290) { const k = sm(f, 222, 290); return { p: lerp3([-47.6, 0, -34.4], [-51.6, 0, -37.0], k), mode: "stride", ph: ((f - 222) / 24) % 1, facing: -1, expr: "sly" as Face }; }
  if (f < 316) return { p: [-51.6, 0, -37.0] as V3, mode: f < 300 ? "stride" : "sit", ph: 0.32, facing: -1, expr: (f < 300 ? "shock" : "dismay") as Face };
  const k = sm(f, 318, 342); return { p: lerp3([-51.6, 0, -37.0], [-48.8, 0, -33.6], k), mode: "walk", ph: ((f - 318) / 12) % 1, facing: 1, expr: "dismay" as Face };
};
SHOT_CAMS[2] = () => [
  K(222, F((f) => { const k = sm(f, 222, 300); return { pos: lerp3([-39.6, 2.9, -25.6], [-45.4, 2.0, -30.2], k), look: lerp3([-47.6, 1.2, -35.0], [-52.8, 0.9, -37.6], k), fov: 44 }; }, 222, 0.0012)),
  K(318, (f) => { const k = sm(f, 318, 342); return { pos: lerp3([-50.6, 1.3, -34.8], [-54.35, 1.18, -38.25], k), look: [IMP[0] + 0.04, 1.16, IMP[2]] as V3, fov: lerp(38, 26, k) }; }, 18),
];
SHOT_ACTS[2] = (f, s) => {
  const lion = LION2(f);
  return {
    ctl: { night: 0, fire: 0, smoke: 0 },
    cast: [
      C("picasso", MOUND, flow(f, [
        [222, { mode: "sit", expr: "stare", facing: -1, armR: [[-14, -14], [-6, -40]] as A2, armRTop: true, armL: [[-26, -10], [-14, -40]] as A2, armLTop: true, propR: "binoculars" }],
        [300, { mode: "sit", expr: "shock", facing: -1, armR: [[-14, -14], [-6, -40]] as A2, armRTop: true, armL: [[-26, -10], [-14, -40]] as A2, armLTop: true, propR: "binoculars" }, 4],
        [326, { mode: "sit", expr: "eureka", facing: -1, armR: [[-24, 6], [-34, -26]] as A2, armRFront: true, propR: "binoculars", armL: [[-20, 20], [-10, 40]] as A2 }, 8], // lowers them, finger up
      ]), { idx: 1 }),
      C("impala", IMP, flow(f, [
        [222, { expr: "neutral", facing: -1, tilt: 25 }],
        [266, { expr: "neutral", facing: -1, tilt: 0 }, 6],
        [273, { expr: "stare", facing: -1, look: -1 }, 4],                 // spots the lion: stares straight back
      ]), { idx: 31, scale: 1.25 }),
      C("lion", lion.p, { ...flow(f, [[222, { expr: "sly" }], [276, { expr: "aghast", sweat: 1 }, 2], [302, { expr: "dismay", sweat: 0 }, 6]]), mode: lion.mode as FigOpts["mode"], phase: lion.ph, facing: lion.facing }, { idx: 30, scale: 1.75 }),
    ],
    fx: fxs(
      f < 232 ? glowBurst("sun2_" + Math.round(lin(f, 222, 232) * 8), [-60, 4, -48], 16 - 12 * lin(f, 222, 232), 1 - lin(f, 222, 232), "255,190,120") : null,
      f >= 300 && f < 314 ? squiggles("sigh", [lion.p[0] - 0.3, 1.5, lion.p[2]], f, "#ffffff", 0.3) : null,
      f >= 328 && f < 342 ? sparkle("idea", [MOUND[0] - 0.45, MOUND[1] + 2.1, MOUND[2]], f - 328, 0.3) : null,
    ),
    focus: f < 318 ? [-51, 1, -37] : [IMP[0], 1.16, IMP[2]],
    subj: f < 300 ? "lion" : "impala",
  };
};
lens(222, 3, 10); lens(318, 9, 16);
