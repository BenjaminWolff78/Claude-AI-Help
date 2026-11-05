
// =====================================================================================================================
// SHOT 3 (342-720) = SCENE 3, the kraal on a bright morning (home base, the long scene): "So he grabs a paintbrush and
// paints giant eyes on the butt of every third cow. "He's giving the cows makeup!" One farmer laughs, then the whole fence
// laughs, and by lunch he's Butt Picasso. Even the cows look embarrassed. But why would a lion care about a butt?"
// Opens on the fresh painted eye (shape match from the impala's eye), pulls back to the hero finishing cow3's second eye,
// trucks along the herd (a painted rump every third cow), swings out to the farmers on the fence: the big farmer points
// and shouts, laughs alone, then the whole fence + the kids laugh together; the aunt holds up a BUTT PICASSO sign; the
// painted cows look back over their shoulders, embarrassed (sweat); ends framing the tally board where the hero now
// stands, thinking, with the tall grass far behind (time-jump crossfade into the same framing at night).
const HERO3A: V3 = [-4.3, 0, 3.75], HERO_GATE: V3 = [0.7, 0, 8.6], HERO_BOARD: V3 = [3.55, 0, 9.65];
const KIDS: Record<string, V3> = { kid1: [-0.3, 0, 11.9], kid2: [0.5, 0, 12.15] };
const heroWalk3 = (f: number) => {
  if (f < 432) return { p: HERO3A, moving: false, d: [1, 0] as [number, number] };
  if (f < 640) { const w = along([HERO3A, [-0.6, 0, 7.0], HERO_GATE], 0.11, 432, f); return { p: w.p, moving: w.moving, d: w.d }; }
  const w = along([HERO_GATE, HERO_BOARD], 0.07, 640, f); return { p: w.p, moving: w.moving, d: w.d };
};
SHOT_CAMS[3] = () => [
  K(342, (f) => ({ pos: [-3.28, 0.95, 4.05] as V3, look: [-3.28, 0.92, 3.0] as V3, fov: 26 + 0 * f })),
  K(348, F(() => ({ pos: [-3.2, 1.5, 6.9] as V3, look: [-4.0, 1.15, 2.6] as V3, fov: 42 }), 348, 0.0014), 50),
  K(408, FS(() => ({ pos: [2.6, 1.8, 10.6] as V3, look: [1.8, 1.0, 2.4] as V3, fov: 46 }), 408, 0.0012, 0.004, [], 430), 40),
  K(452, FS(() => ({ pos: [0.2, 1.8, 16.8] as V3, look: [-4.9, 1.35, 10.3] as V3, fov: 46 }), 452, 0.0016, -0.0022, [[505, 0.005, 10], [544, 0.006, 12]], 520), 36),
  K(584, F(() => ({ pos: [-1.2, 1.7, 14.3] as V3, look: [-3.3, 1.75, 10.6] as V3, fov: 40 }), 584, 0.002, [[598, 0.006, 10]]), 18),
  K(614, FS(() => ({ pos: [-0.9, 1.45, 9.9] as V3, look: [-2.0, 1.0, 3.9] as V3, fov: 42 }), 614, 0.0018, 0.003, [], 640), 22),
  K(656, F(() => ({ pos: [7.6, 1.75, 14.2] as V3, look: [2.6, 1.25, 8.0] as V3, fov: 42 }), 656, 0.0018), 40),
];
const laughFace = (f: number, a: number, who: number): P => ({ expr: "laugh", shake: 1, tilt: -6 + 3 * Math.sin((f - a) * 0.9 + who), headBack: 0.6 });
SHOT_ACTS[3] = (f, s) => {
  const hw = heroWalk3(f), stroke = Math.sin(f * 0.42);
  const sitF = (who: string, beats: [number, P, number?][], idx: number) => C(who, FENCE[who], flow(f, beats.map(([a, o, b]) => [a, { mode: "sit", facing: -1, ...o }, ...(b ? [b] : [])] as Beat)), { idx });
  return {
    ctl: { night: 0, fire: 1, smoke: 1 },
    cast: [
      ...herdCast(3, s, f, ["cow3", "cow0"], {}, {}),
      cowC(3, s, f, herdOf("cow3"), flow(f, [[342, { expr: "neutral", paintK: 0.5 }], [392, { expr: "stare", paintK: 0.5 }], [400, { expr: "stare", paintK: 1 }, 2], [624, { expr: "sheepish", paintK: 1, sweat: 1 }, 4]])),
      cowC(3, s, f, herdOf("cow0"), flow(f, [[342, { expr: "neutral", facing: -1 }], [624, { expr: "sheepish", facing: -1, sweat: 1 }, 4]])),
      C("picasso", hw.p, hw.moving ? pose(null, { mode: "walk", phase: ph(f, 14), facing: screenSide(3, s, f, hw.d[0], hw.d[1]), expr: f < 640 ? "proud" : "smug", armR: [[20, 20], [26, 40]] as A2, armRFront: true, propR: "paintbrush", propK: 1 }) : flow(f, [
        [342, { expr: "determined", facing: 1, tilt: -5, armR: [[26, -6 + 4 * stroke], [44, -14 + 12 * stroke]] as A2, armRFront: true, propR: "paintbrush", propK: 1, propRAng: 0.3 - 0.25 * stroke, armL: [[-8, 30], [6, 44]] as A2, propL: "paintPot" }],
        [362, { expr: "determined", facing: 1, tilt: -10, armR: [[14, 20], [10, 44]] as A2, armRFront: true, propR: "paintbrush", propK: 1, armL: [[-8, 30], [6, 44]] as A2, propL: "paintPot" }, 8],  // dips the brush
        [380, { expr: "determined", facing: 1, tilt: -5, armR: [[26, -6 + 4 * stroke], [44, -14 + 12 * stroke]] as A2, armRFront: true, propR: "paintbrush", propK: 1, propRAng: 0.3 - 0.25 * stroke, armL: [[-8, 30], [6, 44]] as A2, propL: "paintPot" }, 8],
        [402, { expr: "proud", facing: 1, tilt: 0, headTilt: -5, armR: [[20, 8], [26, -24]] as A2, armRFront: true, propR: "paintbrush", propK: 1, armL: [[-8, 30], [6, 44]] as A2, propL: "paintPot" }, 10],
        [640, { expr: "smug", facing: 1, armR: [[20, 20], [26, 40]] as A2, armRFront: true, propR: "paintbrush", propK: 1 }, 8],
        [672, { expr: "calm", facing: -1, look: -0.8, armR: [[18, 4], [10, -22]] as A2, armRFront: true, propR: "paintbrush", propK: 1 }, 10],   // looks out at the herd, thinking
      ]), { idx: 1 }),
      sitF("fmBig", [
        [342, { expr: "bored", look: -0.6 }],
        [462, { expr: "grin", mouth: talk(f, 463, 492), headTilt: 4 * Math.sin(f * 0.5), armR: [[-26, -4], [-50, -18]] as A2, armRFront: true }, 6],   // "He's giving the cows makeup!"
        [503, { ...laughFace(f, 503, 0) }, 4],                                                                                                       // one farmer laughs
        [598, { expr: "joy", armR: [[-24, 10], [-36, 30]] as A2 }, 8],
      ], 10),
      sitF("fmThin", [[342, { expr: "neutral", look: -0.6 }], [470, { expr: "smile", look: -0.6 }], [542, { ...laughFace(f, 542, 1) }, 4], [600, { expr: "grin" }, 8]], 11),
      sitF("fmAunt", [[342, { expr: "smile", look: -0.6 }], [470, { expr: "sly", look: -0.6 }], [542, { ...laughFace(f, 542, 2) }, 4],
        [588, { expr: "joy", armR: [[18, -30], [10, -66]] as A2, propR: "picassoSign", armL: [[-18, -30], [-10, -66]] as A2 }, 8]], 12),        // holds up BUTT PICASSO
      sitF("fmTall", [[342, { expr: "bored", look: -0.6 }], [470, { expr: "stare", look: -0.6 }], [543, { ...laughFace(f, 543, 3), expr: "guffaw" }, 4], [600, { expr: "grin" }, 8]], 13),
      ...Object.entries(KIDS).map(([who, p], i) => C(who, p, flow(f, [[342, { expr: "smile", facing: -1 }], [547, { ...laughFace(f, 547, 4 + i), armR: [[-20, -10], [-40, -24]] as A2, armRFront: true }, 4], [604, { expr: "grin", facing: -1 }, 8]]), { idx: 20 + i })),
      C("lion", [-14.2, 0, 1.0], pose(null, { mode: "kneel", expr: "sly", facing: 1 }), { idx: 30, scale: 1.75 }),
    ],
    fx: fxs(
      f >= 400 && f < 416 ? sparkle("eye3", [-3.28, 0.95, 3.1], f - 400, 0.34) : null,
      f >= 588 && f < 604 ? sparkle("sign", [-3.4, 3.05, 10.8], f - 588, 0.3, "#ffffff") : null,
    ),
    focus: f < 408 ? [-3.4, 1.0, 3.2] : f < 452 ? [1.8, 1.0, 2.4] : f < 614 ? [-3.9, 1.6, 10.6] : f < 660 ? [-1.8, 1.0, 4.4] : [3.6, 1.5, 9.6],
    subj: f < 408 ? "picasso" : f < 452 ? null : f < 614 ? "fmThin" : f < 660 ? null : "picasso",
  };
};
lens(342, 9, 1); lens(348, 5, 40); lens(408, 1, 20); lens(452, 4, 20); lens(614, 6, 16); lens(660, 3, 24);

// =====================================================================================================================
// SHOT 4 (720-783) = SCENE 4, the same framing at night (time-jump crossfade): "Every night, he counts the herd. Sixty-two."
// Lantern in hand, he counts the cows with a finger, then chalks 62 on the tally board; the camera pushes onto the board.
SHOT_CAMS[4] = () => [
  K(720, F(() => ({ pos: [7.6, 1.75, 14.2] as V3, look: [2.6, 1.25, 8.0] as V3, fov: 42 }), 656, 0.0018)),
  K(762, (f) => { const k = sm(f, 762, 783); return { pos: lerp3([6.6, 1.7, 12.9], [5.5, 1.62, 11.5], k), look: lerp3([3.6, 1.35, 8.6], [4.4, 1.38, 9.0], k), fov: lerp(40, 34, k) }; }, 14),
];
SHOT_ACTS[4] = (f, s) => ({
  ctl: { night: 1, fire: 1, smoke: 0.6 },
  cast: [
    ...herdCast(4, s, f, ["cow1"]),
    C("cow1", herdOf("cow1").pos, pose(null, { expr: "sleep", facing: 1 }), { idx: 201, scale: 1.7 }),
    C("picasso", HERO_BOARD, flow(f, [
      [720, { expr: "calm", facing: -1, look: -0.8, armL: [[-14, 26], [-4, 46]] as A2, propL: "lantern", armR: [[-26, -2], [-48, -12]] as A2, armRFront: true }],
      [744, { expr: "calm", facing: -1, look: -0.8, armL: [[-14, 26], [-4, 46]] as A2, propL: "lantern", armR: [[-26, -6], [-48, -20]] as A2, armRFront: true }, 4],   // counting: the finger moves on
      [752, { expr: "calm", facing: -1, look: -0.8, armL: [[-14, 26], [-4, 46]] as A2, propL: "lantern", armR: [[-26, 2], [-46, -2]] as A2, armRFront: true }, 4],
      [760, { expr: "smile", facing: 1, armL: [[-14, 26], [-4, 46]] as A2, propL: "lantern", armR: [[26, -10], [48, -26]] as A2, armRFront: true, propR: "chalk" }, 6], // chalks 62
    ]), { idx: 1 }),
    ...["fmBig", "fmThin", "fmAunt", "fmTall"].map((w, i) => C(w, [FENCE[w][0], 0, 12.4 + 0.3 * i] as V3, pose(null, { expr: "sleep", facing: -1, mode: "sit" }), { idx: 10 + i })).slice(0, 0),
  ],
  fx: fxs(f >= 764 ? boardNum("62", lin(f, 764, 770)) : null, zzz([3.0, 1.9, 3.4], f)),
  focus: [4.0, 1.5, 9.3],
  subj: f < 762 ? "picasso" : null,
});
lens(720, 3, 1); lens(762, 6, 16);

// =====================================================================================================================
// SHOT 5 (783-1032) = SCENE 5, the kraal next morning (through the board: 62 -> 61): "Then one morning, sixty-one. The
// farmers fall off the fence laughing. "Nice work, Picasso!" He just walks over and checks. The missing cow had no eyes.
// "Trust the eyes."" The board: he wipes the 2 and chalks 61; the camera swings to the fence: all four topple backwards off
// the rail, laughing, legs in the air; the big farmer points from the ground; the hero walks into the kraal to the empty
// spot (cow1, a plain cow, is gone), kneels, checks his notebook; the plain cows go nervous; he stands and lifts a finger.
const HERO5_SPOT: V3 = [3.55, 0, 4.7];
const fallOff = (who: string, f: number, a: number, idx: number, talkA = 0, talkB = 0): CastPlace => {
  const base = FENCE[who], k = sm(f, a, a + 12), land: V3 = [base[0] + 0.15, 0, base[2] + 0.95];
  const p = lerp3(base, land, k);
  const body: P = f < a ? { mode: "sit", facing: -1, shake: 1, headBack: 0.6, tilt: -6 + 3 * Math.sin((f - a) * 0.9 + idx) }
    : { mode: "sit", facing: -1, tilt: -78 * sm(f, a, a + 9), feetUp: sm(f, a, a + 9), shake: f > a + 9 ? 1 : 0, headBack: 0.6 };     // tips back off the rail
  const face = flow(f, [[783, { expr: "laugh" }], [a, { expr: "eureka" }, 2], [a + 10, { expr: "guffaw", mouth: talkB ? talk(f, talkA, talkB) : undefined }, 4]]);
  return C(who, p, { ...face, ...body, mouth: face.mouth }, { idx });
};
SHOT_CAMS[5] = () => [
  K(783, F(() => ({ pos: [5.5, 1.62, 11.5] as V3, look: [4.4, 1.38, 9.0] as V3, fov: 34 }), 783, 0.0014)),
  K(812, FS(() => ({ pos: [0.2, 1.8, 16.8] as V3, look: [-4.9, 1.15, 10.6] as V3, fov: 46 }), 812, 0.0016, -0.002, [[836, 0.006, 10]], 860), 30),
  K(908, F((f) => { const k = sm(f, 908, 950); return { pos: lerp3([7.0, 1.75, 13.6], [0.8, 1.6, 8.4], k), look: lerp3([2.4, 1.1, 7.0], [3.4, 0.9, 4.6], k), fov: 42 }; }, 908, 0.0014), 30),
  K(952, FS(() => ({ pos: [0.6, 1.35, 7.0] as V3, look: [3.5, 0.95, 4.5] as V3, fov: 40 }), 952, 0.0022, 0.0015, [[1008, 0.007, 10]], 990), 24),
];
SHOT_ACTS[5] = (f, s) => {
  const walk = along([HERO_BOARD, [2.9, 0, 7.0], HERO5_SPOT], 0.12, 912, f);
  const nervous = (who: string): P => ({ ...flow(f, [[783, { expr: "neutral" }], [982 + who.length, { expr: "nervous", sweat: 1 }, 4]]) });
  return {
    ctl: { night: 0, fire: 1, smoke: 1 },
    cast: [
      ...herdCast(5, s, f, ["cow1"], { cow2: nervous("cow2"), cow8: nervous("cow8"), cow5: nervous("cow5") }),
      C("picasso", f < 912 ? HERO_BOARD : walk.p, f >= 912 && walk.moving ? pose(null, { mode: "walk", phase: ph(f, 14), facing: screenSide(5, s, f, walk.d[0], walk.d[1]), expr: "stare", armR: [[20, 20], [26, 40]] as A2, armRFront: true, propR: "notebook" }) : flow(f, [
        [783, { expr: "calm", facing: 1, armR: [[26, -10], [48, -26]] as A2, armRFront: true, propR: "chalk" }],
        [792, { expr: "calm", facing: 1, armR: [[26, -6], [50, -14]] as A2, armRFront: true, propR: "chalk" }, 5],     // wipes the 2
        [799, { expr: "stare", facing: 1, armR: [[26, -10], [48, -26]] as A2, armRFront: true, propR: "chalk" }, 4],    // chalks 61
        [912, { expr: "stare", facing: -1, armR: [[20, 20], [26, 40]] as A2, armRFront: true, propR: "notebook" }, 6],
        [952, { expr: "stare", facing: -1, mode: "kneel", look: -0.4, armR: [[16, 10], [10, -12]] as A2, armRFront: true, propR: "notebook" }, 8],   // kneels at the empty spot
        [980, { expr: "smug", facing: -1, mode: "kneel", armR: [[16, 10], [10, -12]] as A2, armRFront: true, propR: "notebook" }, 4],                 // no eyes
        [998, { expr: "smug", facing: 1, mode: "stand", armR: [[20, -16], [12, -46]] as A2, armRFront: true, armL: [[-18, 20], [-26, 40]] as A2, propL: "notebook" }, 10],   // stands, finger up
        [1006, { expr: "sly", facing: 1, mode: "stand", mouth: talk(f, 1007, 1030), armR: [[20, -16], [12, -46]] as A2, armRFront: true, armL: [[-18, 20], [-26, 40]] as A2, propL: "notebook" }, 3], // "Trust the eyes."
      ]), { idx: 1 }),
      fallOff("fmBig", f, 834, 10, 873, 905), fallOff("fmThin", f, 838, 11), fallOff("fmAunt", f, 842, 12), fallOff("fmTall", f, 846, 13),
      ...Object.entries(KIDS).map(([who, p], i) => C(who, p, flow(f, [[783, { expr: "smile", facing: -1 }], [826, { ...laughFace(f, 826, 4 + i) }, 4], [900, { expr: "grin", facing: -1 }, 8]]), { idx: 20 + i })),
    ],
    fx: fxs(
      boardNum(f < 796 ? "62" : f < 800 ? "6" : "61", f >= 796 && f < 800 ? 1 : 1),
      f >= 800 && f < 814 ? sparkle("chalk", [BOARD_P[0] + 0.2, BOARD_P[1] - 0.1, BOARD_P[2] + 0.05], f - 800, 0.22, "#ffffff") : null,
      [0, 1, 2, 3].flatMap((i) => f >= 842 + i * 4 && f < 870 + i * 4 ? [dustCard("fall" + i, [FENCE[["fmBig", "fmThin", "fmAunt", "fmTall"][i]][0], 0.25, 11.9], 1.1, 0.8 * (1 - (f - 842 - i * 4) / 28), i)] : []),
      f >= 982 && f < 1000 ? bang([3.2, 2.5, 4.2], f - 982) : null,
    ),
    focus: f < 812 ? [4.4, 1.4, 9.0] : f < 908 ? [-3.9, 0.8, 11.2] : [3.4, 0.9, 4.6],
    subj: f < 812 ? null : f < 908 ? "fmThin" : "picasso",
  };
};
lens(783, 6, 1); lens(812, 3, 24); lens(952, 6, 20);
