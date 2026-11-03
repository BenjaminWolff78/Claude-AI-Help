
// =====================================================================================================================
// ROAD (light road / roadLate). Runners go toward -z. Zones: well z 98-78, dust z 75-36, orchard (left) z 31-1,
// farm (right) z -6..-52, hill z -40..-125 (car B, the coach's green car). Car A = red officials' car (z 112 -> 26).
import { roadCar, roadSeats, roadRunner, roadX, groundY, roadAt, roadDogLane } from "./sets/road";
type CarW = "A" | "B" | "C";
const cam0 = (c: { pos: V3; look: V3; fov?: number }) => ({ pos: c.pos, look: c.look, fov: c.fov ?? 40 });
/** a camera point relative to a car at u: ahead (along travel), lat (+ = car's left, the runner side), h above the road */
const carPt = (w: CarW, u: number, ahead: number, lat: number, h: number): V3 => {
  const c = roadCar(w, u), d = c.dir, left = [d[2], 0, -d[0]];
  const x = c.pos[0] + d[0] * ahead + left[0] * lat, z = c.pos[2] + d[2] * ahead + left[2] * lat;
  return [x, groundY(x, z) + h, z];
};
const along3 = (w: CarW, u: number, p: V3, ahead: number): V3 => { const d = roadCar(w, u).dir; const x = p[0] + d[0] * ahead, z = p[2] + d[2] * ahead; return [x, groundY(x, z) + (p[1] - groundY(p[0], p[2])), z]; };

// ---------------- the hill: Hicks + the coach's car ----------------
/** car B progress: S01 (hook) and S12-S16 (begging, mixing, the second dose) */
const uHook = (f: number) => 0.3 + 0.00176 * f;
const uHill = (f: number) => 0.18 + 0.0012 * (f - 888);
const hicksAt = (u: number, gap = 1.2): V3 => roadRunner(u, gap);
const seatsB = (u: number) => roadSeats("B", u);
const runO = (f: number, o: P = {}): FigOpts => pose(null, { mode: "run", phase: ph(f, 14), facing: 1, tilt: 4, ...o });

// ---- S01 (0-108) HOOK "A runner won Olympic gold / after his coach kept feeding him / rat poison."
// Frame 1: the coach leans out of the green car and spoons a dark drop from the RAT-B-GONE bottle into Hicks's mouth
// while he runs; Hicks gulps, his eyes pop on "gold"; on "rat poison" the camera pushes onto the skull bottle.
SHOT_CAMS[1] = () => [
  K(0, (f) => { const u = uHook(f); return fit([body(hicksAt(u), 0, 2.1, 0.36), body(seatsB(u).front, -0.1, 1.35, 0.36), body(seatsB(u).driver, 0.3, 1.35, 0.36)], 212, 3, 40, 0.86, 0, 0.05); }),
  K(70, (f) => { const u = uHook(f); return fit([body(hicksAt(u), 1.0, 2.1, 0.3), body(seatsB(u).front, 0.3, 1.35, 0.42)], 205, 6, 38, 0.9, 0.1); }, 26),
];
SHOT_ACTS[1] = (f, s) => {
  const u = uHook(f), H = hicksAt(u), S = seatsB(u), feed = f < 20 ? 1 : 1 - sm(f, 20, 30), gulp = sm(f, 14, 22) * (1 - sm(f, 40, 50)), pop = f >= 29 && f < 60;
  return {
    ctl: { carB: u, dustB: 0.55, hornB: 0, carA: 1, carAHide: 1, haze: 1, dog: 0, bucket: 1 },
    cast: [
      C("hicks", H, runO(f, { expr: pop ? "wired" : gulp > 0.4 ? "gulp" : "strain", sweat: 1, squash: pop ? 0.06 * Math.exp(-(f - 29) / 6) : 0 })),
      C("coach", S.front, pose(null, { mode: "sit", expr: f < 60 ? "determined" : "sly", facing: faceTo(1, s, f, S.front, H),
        armR: [[26, -4], [lerp(46, 30, 1 - feed), lerp(-8, 10, 1 - feed)]] as A2, armRFront: true, propR: "spoon", propK: feed,
        armL: [[-22, 6], [-30, -18]] as A2, armLFront: true, propL: "poisonBottle", mouth: talk(f, 60, 100), tilt: 6 * feed })),
      C("helper", S.driver, pose(null, { mode: "sit", expr: "neutral", facing: faceTo(1, s, f, S.driver, H), armR: [[22, 14], [36, 10]] as A2 }), { idx: 2 }),
      C("fan1", roadAt(-6.4, -73), pose(null, { expr: "shock", facing: 1, armR: ARMS.upR, armRFront: true }), { idx: 3 }),
      C("lady2", roadAt(-6.5, -70.2), pose(null, { expr: "dismay", facing: 1, propR: "parasol2", armR: [[24, -10], [30, -40]] as A2, armRFront: true }), { idx: 4 }),
    ],
    fx: fxs(pop ? bang([H[0], H[1] + 2.25, H[2]], f - 29) : null, sparkle("bottle", [S.front[0], S.front[1] + 1.3, S.front[2]], f - 82, 0.25)),
    focus: f < 70 ? [H[0], H[1] + 1.6, H[2]] : [S.front[0], S.front[1] + 0.9, S.front[2]], subj: "hicks",
  };
};
lens(0, 6, 1); lens(70, 10, 16);

// ---- S05 (327-357) "...well." the map icon dissolves into the real well seen from above; the camera tips down to a
// high angle where six runners shove round the one bucket and one gulps from it.
const W_WELL = roadAt(6.6, 88);
const wellRing = (i: number): V3 => { const a = (i / 6) * Math.PI * 2 + 0.4; return [W_WELL[0] + Math.cos(a) * 1.45, W_WELL[1] + 0.035, W_WELL[2] + Math.sin(a) * 1.45]; };
SHOT_CAMS[5] = (s) => [
  K(327, F(() => cam0(s.cams.wellTop), 327, 0.002)),
  K(333, F(() => cam0(s.cams.wellHigh), 333, 0.002), 24),
];
SHOT_ACTS[5] = (f, s) => ({
  ctl: { bucket: 0.6 + 0.4 * Math.sin(f * 0.08), carA: 0, haze: 1, dog: 0, carB: 0.5 },
  cast: [
    C("runner4", s.marks.wellDrinker, pose(null, { expr: "gulp", facing: 1, armR: [[24, -10], [30, -30]] as A2, armRFront: true, propR: "bucket", tilt: -8 })),
    ...["runner1", "runner2", "dustRunner", "runner5", "runner6"].map((who, i) => C(who, wellRing(i + 1), pose(null, { expr: i % 2 ? "angry" : "strain", facing: i % 2 ? 1 : -1, sweat: 1,
      tilt: 8 * Math.sin(st(f, 2) * 0.9 + i), armR: [[26, 6], [50, 0 + 10 * Math.sin(f * 0.5 + i)]] as A2, armRFront: true }), { idx: 10 + i })),
  ],
  focus: W_WELL, subj: null,
});
lens(327, 0, 1);

// ---- S06 (357-482) "Cars full of officials drive ahead, / kicking dust / in every runner's face. / 'Keep up, boys!'"
// Start among the coughing pack in the dust bank, the red officials' car rolls past them (dust billows), the camera
// travels forward alongside the car to the official in the back seat, who turns, waves his boater and shouts.
const uA = (f: number) => Math.min(1, 0.40 + 0.0026 * (f - 357));
const PACK = ["runner1", "runner2", "runner3", "runner5"];
const packAt = (i: number, f: number): V3 => { const base = [roadAt(-1.5, 66.8), roadAt(-0.3, 65.2), roadAt(1.0, 66.0), roadAt(0.1, 63.6)][i]; return roadAt(base[0] - roadX(base[2]), base[2] - 0.075 * Math.max(0, f - 357)); };
const packer = (i: number, f: number, cough = 1): CastPlace => {
  const p = packAt(i, f), c = Math.sin(st(f, 2) * 0.8 + i * 1.7);
  return C(PACK[i], p, runO(f + i * 4, { expr: cough && c > 0.2 ? "strain" : "dismay", sweat: 1, armL: cough && i % 2 ? [[-20, -4], [-6 + 10 * c, -26]] as A2 : undefined, armLFront: true, mouth: cough && c > 0.6 ? "O" : undefined }), { idx: 10 + i });
};
SHOT_CAMS[6] = () => [
  K(357, F((f) => { const p = packAt(1, f); return { pos: roadAt(-3.2, 79, 5.2), look: [p[0] + 0.2, p[1] + 1.0, p[2]], fov: 40 }; }, 357, 0.0014), 18),
  K(384, F((f) => { const p = packAt(1, f); return { pos: [roadX(p[2]) - 4.2, p[1] + 1.55, p[2] - 3.4], look: [p[0] + 0.4, p[1] + 1.25, p[2] + 0.6], fov: 40 }; }, 384, 0.0014), 30),
  K(424, (f) => { const u = uA(f), s = roadSeats("A", u).rear; return { pos: carPt("A", u, 2.6, 3.6, 1.9), look: [s[0], s[1] + 0.75, s[2]] as V3, fov: 38 }; }, 34),
];
SHOT_ACTS[6] = (f, s) => {
  const u = uA(f), S = roadSeats("A", u), yell = f >= 456;
  return {
    ctl: { carA: u, dustA: sm(f, 395, 410), dustBank: lerp(0.25, 0.7, sm(f, 400, 420)), haze: 1, carB: 0.5, carBHide: 1, dog: 0, bucket: 1 },
    cast: [
      ...[0, 1, 2, 3].map((i) => packer(i, f)),
      C("official", S.rear, pose(null, { mode: "sit", expr: yell ? "laugh" : "smug", facing: faceTo(6, s, f, S.rear, packAt(1, f)), mouth: talk(f, 461, 478),
        armR: yell ? [[24, -26], [30 + 6 * Math.sin(f * 0.6), -62]] as A2 : [[24, 10], [34, 20]] as A2, armRFront: true, hatLift: (0.2 + 0.04 * Math.sin(f * 0.6)) * sm(f, 456, 462), headTilt: yell ? 6 : 0 })),
      C("driver", S.driver, pose(null, { mode: "sit", expr: "smug", facing: -1, armR: [[22, 10], [36, 6]] as A2 }), { idx: 2 }),
      C("farmer2", roadAt(-6.5, 63.2), pose(null, { expr: "dismay", facing: 1, armR: [[26, 10], [20, -26]] as A2, armRFront: true }), { idx: 4 }),
    ],
    fx: fxs(f >= 386 ? dustTrail("dA", roadCar("A", u).pos, [roadCar("A", u).dir[0], roadCar("A", u).dir[2]], f, 7, 0.9, 1.1) : null),
    focus: f < 424 ? [packAt(1, f)[0], 1.5, packAt(1, f)[2]] : [S.rear[0], S.rear[1] + 0.8, S.rear[2]], subj: f < 424 ? "runner2" : "official",
  };
};
lens(357, 2, 1); lens(424, 4, 20);

// ---- S07 (482-553) "The dust is so thick / the runners could chew it."
// The camera glides back to a close three-quarter on a runner in the dust: he grabs a fistful of the cloud, bites a
// chunk out of it and chews with a grimace.
SHOT_CAMS[7] = () => [
  K(482, F((f) => fit([body(packAt(2, f), 0.7, 2.15, 0.34)], 228, 3, 38, 0.66, -0.05), 482, 0.0024, [[536, 0.006, 12]]), 30),
];
SHOT_ACTS[7] = (f, s) => {
  const p = packAt(2, f), grab = sm(f, 494, 506), bite = f >= 530, chew = f >= 533;
  const hand: V3 = [p[0] + 0.32, p[1] + 1.5 + 0.15 * grab, p[2] + 0.05];
  return {
    ctl: { carA: uA(f), dustA: 0.25, dustBank: 0.2, haze: 1, carB: 0.5, carBHide: 1, dog: 0, bucket: 1 },
    cast: [
      ...[0, 1, 3].map((i) => packer(i, f)),
      C("runner3", p, runO(f, { expr: chew ? "strain" : grab > 0.5 ? "sly" : "dismay", sweat: 1, mouth: chew ? (Math.floor(f / 4) % 2 ? "teeth" : "o") : bite ? "O" : undefined,
        armR: [[22, -6], [lerp(40, 22, grab), lerp(20, -30, grab)]] as A2, armRFront: true }), { idx: 12 }),
    ],
    fx: fxs(dustCard("chunk", [hand[0], hand[1] + 0.05, hand[2]], bite ? 0.16 : 0.22, 1, 3),
      bite && f < 540 ? sparkle("bite", [hand[0], hand[1] + 0.12, hand[2] - 0.08], f - 530, 0.18, "#f6e8c8") : null,
      null),
    focus: [p[0], p[1] + 1.6, p[2]], subj: "runner3",
  };
};
lens(482, 5, 16);

// ---- S08 (553-626) "One runner / breathes in so much / he nearly dies."
// Low angle from the ditch: a runner takes a giant breath (chest balloons, dust swirls into his mouth), coughs a puff,
// wobbles and keels over into the ditch with his legs up and dizzy stars; a farmer at his wheelbarrow stops and stares.
const D_RUN = roadAt(2.0, 52.6), D_EDGE = roadAt(3.15, 51.3), D_DITCH = roadAt(4.6, 51.0);
const dustManAt = (f: number): V3 => f < 585 ? lerp3(roadAt(1.6, 55.2), D_RUN, sm(f, 553, 572)) : lerp3(D_RUN, D_EDGE, sm(f, 585, 600));
SHOT_CAMS[8] = (s) => [
  K(553, F(() => fit([body(D_RUN, 0, 2.0, 0.35), [D_DITCH, -0.6, 0.6, 1.0]], 255, 24, 40, 0.84), 553, 0.0022, [[604, 0.006, 12]]), 30),
];
SHOT_ACTS[8] = (f, s) => {
  const breathe = sm(f, 566, 578) * (1 - sm(f, 582, 586)), down = f >= 602, p = down ? D_DITCH : dustManAt(f);
  return {
    ctl: { carA: 1, carAHide: 1, dustA: 0, dustBank: 0, haze: 1, carB: 0.5, carBHide: 1, dog: 0, bucket: 1 },
    cast: [
      C("dustRunner", p, down
        ? pose(null, { mode: "lie", expr: "dizzy", legsUp: lerp(1, 0.6, sm(f, 604, 616)), facing: 1 })
        : f < 585 ? runO(f, { expr: breathe > 0.3 ? "gulp" : "strain", squash: -0.12 * breathe, sweat: 1 })
          : pose(null, { mode: "stagger", phase: ph(f, 16), expr: "dizzy", facing: 1, tilt: lerp(0, 28, sm(f, 594, 602)) }),
        down ? { roll: Math.PI / 2, blob: false } : {}),
      C("farmer1", s.marks.barrowFarmer, pose(null, { expr: down ? "shock" : "neutral", facing: 1, armR: [[24, 20], [36, 34]] as A2, armL: [[-10, 24], [12, 36]] as A2, armRFront: true }), { idx: 3 }),
      C("fan2", roadAt(6.8, 58), pose(null, { expr: down ? "shock" : "dismay", facing: -1 }), { idx: 4 }),
    ],
    fx: fxs(breathe > 0.2 ? dustCard("inhale", lerp3([p[0] - 0.6, p[1] + 1.7, p[2] + 0.4], [p[0], p[1] + 1.75, p[2]], breathe), 0.5 * (1 - breathe) + 0.15, 0.9, 1) : null,
      f >= 585 && f < 600 ? dustCard("cough", [p[0] + 0.1 + 0.02 * (f - 585), p[1] + 1.8, p[2] - 0.3], 0.3 + 0.03 * (f - 585), 1 - lin(f, 585, 600), 2) : null,
      down ? dizzy([D_DITCH[0], D_DITCH[1] + 0.55, D_DITCH[2]], f, 0.22) : null),
    focus: [p[0], p[1] + 1.2, p[2]], subj: null,
  };
};
lens(553, 6, 16);

// ---- S09 (626-770) "Another, a mailman from Cuba, / gets hungry, / eats rotten apples off a tree, / and lies down for a nap."
// The camera rises over the left fence into the orchard to the mailman, already under an apple tree: his stomach
// growls (he clutches it), he plucks a brown apple and chomps it, his face goes green, and he flops down in the shade
// with his cap over his eyes - Zzz. A farmer picks apples on a ladder behind him; the cow grazes.
const M_EAT = roadAt(-8.0, 20.6), M_NAP = roadAt(-8.4, 19.4);
SHOT_CAMS[9] = (s) => [
  K(626, F(() => ({ pos: roadAt(-3.6, 34, 4.2), look: [M_EAT[0], M_EAT[1] + 1.4, M_EAT[2]], fov: 40 }), 626, 0.001), 34),
  K(662, F(() => fit([body(M_EAT, 0, 2.1, 0.4)], 150, 4, 40, 0.58, 0.25), 662, 0.0022, [[692, 0.005, 12]]), 38),
  K(732, F(() => fit([[M_NAP, 0, 0.6, 1.0]], 140, 18, 40, 0.62), 732, 0.0024), 26),
];
SHOT_ACTS[9] = (f, s) => {
  const growl = f >= 668 && f < 690, reach = sm(f, 688, 696) * (1 - sm(f, 700, 706)), bite = f >= 706, green = sm(f, 712, 722), lie = f >= 740;
  return {
    ctl: { carA: 1, carAHide: 1, dustA: 0, dustBank: 0, haze: 1, carB: 0.5, carBHide: 1, dog: 0, bucket: 1 },
    cast: [
      C("mailman", lie ? M_NAP : M_EAT, lie
        ? pose(null, { mode: "lie", expr: "sleep", legsUp: 0.15, facing: 1, sick: 0.5 })
        : pose(null, { expr: green > 0.3 ? "green" : growl ? "dismay" : "neutral", sick: green, facing: faceTo(9, s, f, M_EAT, roadAt(-9.6, 19.5)),
          armL: growl || green > 0 ? [[-14, 24], [6, 34]] as A2 : undefined, armLFront: true,
          armR: [[24, -20], [lerp(32, 30, reach), lerp(-20, -64, reach)]] as A2, armRFront: true, propR: f >= 694 ? "rottenApple" : undefined,
          mouth: bite && f < 716 ? (Math.floor(f / 4) % 2 ? "teeth" : "O") : undefined }),
        lie ? { roll: Math.PI / 2, blob: false } : {}),
      C("farmer2", s.marks.ladderFarmer, pose(null, { expr: "smile", facing: -1, armR: [[24, -24], [30, -58 + 6 * Math.sin(st(f) * 0.5)]] as A2, armRFront: true, propR: "apple" }), { idx: 3 }),
      C("farmKid", roadAt(-13.8, 26.4), pose(null, { expr: lie ? "laugh" : "smile", facing: -1, armR: [[24, 20], [30, 36]] as A2, armRFront: true, propR: "apple" }), { idx: 4 }),
    ],
    fx: fxs(growl ? squiggles("growl", [M_EAT[0] + 0.3, M_EAT[1] + 0.9, M_EAT[2] - 0.2], f, "#ffffff", 0.22) : null, lie ? zzz([M_NAP[0] - 0.6, M_NAP[1] + 0.45, M_NAP[2]], f) : null),
    focus: lie ? [M_NAP[0], M_NAP[1] + 0.4, M_NAP[2]] : [M_EAT[0], M_EAT[1] + 1.5, M_EAT[2]], subj: lie ? null : "mailman",
  };
};
lens(626, 0, 1); lens(662, 7, 20);

// ---- S10 (770-842) "A third / gets chased / a mile off course / by a dog."
// The camera flies low over the farm fence to the dog lane: the farm dog bursts after a runner, who sprints off the
// course into the corn past a "COURSE ->" sign pointing the other way; the farmer's kid points and laughs.
const dogU = (f: number) => lin(f, 790, 842) * 0.7;
SHOT_CAMS[10] = () => [
  K(770, F(() => ({ pos: roadAt(-2.5, -4, 5.0), look: roadAt(3, -26, 1.0), fov: 40 }), 770, 0.001), 36),
  K(794, F((f) => { const r = roadDogLane(Math.min(1, dogU(f) + 0.14)), c = roadAt(0.6, -23.8, 1.45); return { pos: c, look: [lerp(r[0], c[0], 0.15), r[1] + 0.9, lerp(r[2], c[2], 0.15)], fov: 30 }; }, 794, 0.0014), 22),
  K(830, F(() => ({ pos: roadAt(-3, -14, 20), look: roadAt(-3, 26, 0), fov: 40 }), 830, 0.0016), 46),
];
SHOT_ACTS[10] = (f, s) => {
  const r = roadDogLane(Math.min(1, dogU(f) + 0.14)), started = f >= 788;
  return {
    ctl: { dog: started ? Math.max(0.001, dogU(f)) : 0, carA: 1, carAHide: 1, dustA: 0, dustBank: 0, haze: 1, carB: 0.5, carBHide: 1, bucket: 1 },
    cast: [
      C("dogRunner", started ? r : roadAt(1.2, -24), started ? runO(f, { expr: "shock", sweat: 1, facing: 1, tilt: 8, armR: ARMS.upR }) : runO(f, { expr: "determined" })),
      C("farmKid", roadAt(4.6, -21.6), pose(null, { expr: started ? "laugh" : "smile", facing: 1, armR: [[24, -6], [50, -12]] as A2, armRFront: true }), { idx: 3 }),
      C("farmer1", s.marks.farmYard, pose(null, { expr: started ? "shock" : "neutral", facing: 1, armR: ARMS.upR }), { idx: 4 }),
    ],
    fx: fxs(started ? speedLines(r, f, 4, 0.9, [0.6, 0.8]) : null, started ? bang([r[0], r[1] + 2.2, r[2]], f - 790) : null),
    focus: [r[0], r[1] + 1.2, r[2]], subj: started ? "dogRunner" : null,
  };
};
lens(770, 0, 1); lens(796, 4, 16);

// ---- S11 (842-888) "So how does anyone win this?" High crane over the whole course: the ditch, the napper, the dog
// chase, the dust cloud - then the 8 f dissolve to the hill in the late sun.
SHOT_CAMS[11] = () => [
  K(842, F(() => ({ pos: roadAt(-3, -14, 20), look: roadAt(-3, 26, 0), fov: 40 }), 842, 0.0016), 34),
];
SHOT_ACTS[11] = (f, s) => ({
  ctl: { dog: 0.95, carA: 0.95, dustA: 1, dustBank: 0.3, haze: 1, carB: 0.5, carBHide: 1, bucket: 1 },
  cast: [
    C("dustRunner", D_DITCH, pose(null, { mode: "lie", expr: "dizzy", legsUp: 0.6, facing: 1 }), { roll: Math.PI / 2, blob: false }),
    C("mailman", M_NAP, pose(null, { mode: "lie", expr: "sleep", legsUp: 0.15, facing: 1 }), { roll: Math.PI / 2, blob: false, idx: 2 }),
    C("dogRunner", roadDogLane(1), runO(f, { expr: "shock" }), { idx: 3 }),
    ...[0, 1, 2, 3].map((i) => C(PACK[i], packAt(i, f - 200), runO(f + i * 4, { expr: "strain" }), { idx: 10 + i })),
  ],
  fx: fxs(zzz([M_NAP[0] - 0.6, M_NAP[1] + 0.5, M_NAP[2]], f)),
  focus: roadAt(0, 30, 0), subj: null,
});
lens(842, 0, 1);

// ---- S12 (888-965) "It's Thomas Hicks, / who's begging his coach for water."
// Dissolve to the hill in the late sun: Hicks jogs up beside the green car, hands clasped, tongue out, begging; the
// coach in the passenger seat holds the water jug. Crane down onto Hicks, then over the coach's shoulder.
SHOT_CAMS[12] = () => [
  K(888, (f) => { const u = uHill(f), H = hicksAt(u); return { pos: carPt("B", u, 6.5, 4.4, lerp(4.2, 2.1, sm(f, 888, 920))), look: [H[0], H[1] + 1.35, H[2]], fov: 40 }; }),
  K(922, (f) => { const u = uHill(f), S = seatsB(u).front, H = hicksAt(u); return { pos: [S[0] - 0.25, S[1] + 0.85, S[2] + 0.0].map((v, i) => v + roadCar("B", u).dir[i] * -0.7) as V3, look: [H[0], H[1] + 1.45, H[2]], fov: 40 }; }, 28),
];
const hillExtras = (f: number): CastPlace[] => [
  C("fan3", roadAt(-6.5, -70.2), pose(null, { expr: "smile", facing: 1, armR: [[24, -20], [30, -50 + 6 * Math.sin(st(f) * 0.6)]] as A2, armRFront: true }), { idx: 20 }),
  C("lady1", roadAt(-6.4, -73), pose(null, { expr: "smile", facing: 1, propR: "parasol", armR: [[24, -10], [30, -40]] as A2, armRFront: true }), { idx: 21 }),
  C("farmer2", roadAt(-8.0, -71.6), pose(null, { expr: "neutral", facing: 1, armR: [[24, 20], [36, 30]] as A2, armRFront: true, propR: "jug" }), { idx: 22 }),
];
SHOT_ACTS[12] = (f, s) => {
  const u = uHill(f), H = hicksAt(u), S = seatsB(u), beg = f >= 916;
  return {
    ctl: { carB: u, dustB: 0.4, carA: 1, carAHide: 1, haze: 1, dog: 0, bucket: 1 },
    cast: [
      C("hicks", H, runO(f, { expr: beg ? "dismay" : "strain", sweat: 1, mouth: beg ? "O" : undefined, armR: beg ? [[18, -4], [10, -20]] as A2 : undefined, armL: beg ? [[-18, -4], [-8, -20]] as A2 : undefined, armRFront: true, armLFront: true })),
      C("coach", S.front, pose(null, { mode: "sit", expr: "smug", facing: faceTo(12, s, f, S.front, H), back: f >= 940, armR: [[26, 10], [36, -6]] as A2, armRFront: true, propR: "jug" })),
      ...(f < 922 ? [C("helper", S.driver, pose(null, { mode: "sit", expr: "neutral", facing: -1 }), { idx: 2 })] : []),
      ...hillExtras(f),
    ],
    fx: fxs(beg ? sweatDrops(H, f) : null),
    focus: [H[0], H[1] + 1.5, H[2]], subj: "hicks",
  };
};
const sweatDrops = (H: V3, f: number): FxSpec[] => [0, 1].map((i) => ({ kind: "card", key: "sweat" + i, pos: [H[0] + (i ? 0.28 : -0.26), H[1] + 2.0 - 0.02 * ((f + i * 7) % 14), H[2]], w: 0.07, h: 0.1, cw: 32, ch: 48,
  draw: (p) => { const g = p.g; g.fillStyle = "#bfe8ff"; g.strokeStyle = "#241726"; g.lineWidth = 4; g.beginPath(); g.moveTo(16, 2); g.quadraticCurveTo(30, 30, 16, 44); g.quadraticCurveTo(2, 30, 16, 2); g.fill(); g.stroke(); } } as FxSpec));
lens(888, 6, 1); lens(922, 9, 20);

// ---- S13 (965-1102) "His coach says no / and mixes him something else: / raw egg, / brandy, / and a pinch / of rat poison."
// The coach wags a finger "no" and tucks the jug away; then (high angle onto his hands) cracks an egg into a tumbler,
// glugs in brandy and taps in a pinch from the RAT-B-GONE tin (sparkle); tilt up to Hicks's worried face.
SHOT_CAMS[13] = () => [
  K(965, (f) => { const u = uHill(f), S = seatsB(u).front, H = hicksAt(u); return { pos: carPt("B", u, 2.6, 3.3, 1.75), look: lerp3([S[0], S[1] + 0.8, S[2]], [H[0], H[1] + 1.5, H[2]], 0.5), fov: 40 }; }, 20),
  K(1022, (f) => { const u = uHill(f), S = seatsB(u).front; return { pos: carPt("B", u, 1.1, 1.95, 2.35), look: [S[0], S[1] + 0.55, S[2]] as V3, fov: 38 }; }, 24),
  K(1086, (f) => { const u = uHill(f), S = seatsB(u).front, H = hicksAt(u); return { pos: carPt("B", u, 1.9, 2.6, 2.0), look: lerp3([S[0], S[1] + 0.7, S[2]], [H[0], H[1] + 1.55, H[2]], 0.65), fov: 40 }; }, 16),
];
SHOT_ACTS[13] = (f, s) => {
  const u = uHill(f), H = hicksAt(u), S = seatsB(u), no = f >= 970 && f < 996, egg = f >= 1026 && f < 1046, brandy = f >= 1046 && f < 1064, pinch = f >= 1064, wag = Math.sin(f * 0.8);
  const fill = sm(f, 1032, 1040) * 0.4 + sm(f, 1050, 1060) * 0.35 + sm(f, 1072, 1080) * 0.1;
  return {
    ctl: { carB: u, dustB: 0.4, carA: 1, carAHide: 1, haze: 1, dog: 0, bucket: 1 },
    cast: [
      C("hicks", H, runO(f, { expr: f > 1080 ? "shock" : no ? "dismay" : "strain", sweat: 1 })),
      C("coach", S.front, pose(null, { mode: "sit", expr: no ? "smug" : pinch ? "sly" : "determined", facing: faceTo(13, s, f, S.front, H), mouth: talk(f, 972, 990),
        armR: no ? [[24, -20], [30 + 6 * wag, -48]] as A2 : egg ? [[24, -6], [36, -14 + 6 * Math.sin(f * 0.5)]] as A2 : brandy ? [[24, -12], [30, -26]] as A2 : pinch ? [[24, -10], [32, -22 + 4 * Math.sin(f * 1.2)]] as A2 : [[24, 10], [34, 20]] as A2,
        armRFront: true, propR: no ? undefined : egg ? "egg" : brandy ? "brandy" : pinch ? "poisonTin" : undefined, propRAng: brandy ? 1.2 : pinch ? 0.9 : 0,
        armL: [[-20, 10], [-14, 0]] as A2, armLFront: true, propL: f >= 996 ? "tumbler" : "jug", propK: fill })),
      ...(f < 1022 || f >= 1086 ? [C("helper", S.driver, pose(null, { mode: "sit", expr: f > 1060 ? "dismay" : "neutral", facing: -1 }), { idx: 2 })] : []),
      ...hillExtras(f),
    ],
    fx: fxs(sparkle("pinch", [S.front[0], S.front[1] + 0.75, S.front[2]], f - 1080, 0.22), egg ? sparkle("egg", [S.front[0], S.front[1] + 0.75, S.front[2]], f - 1034, 0.14, "#ffffff") : null),
    focus: f < 1022 || f >= 1086 ? [H[0], H[1] + 1.5, H[2]] : [S.front[0], S.front[1] + 0.6, S.front[2]], subj: f < 1022 || f >= 1086 ? "hicks" : null,
  };
};
lens(965, 6, 1); lens(1022, 11, 16); lens(1086, 7, 14);

// ---- S14 (1102-1156) "An official yells, / 'You're poisoning him!'" A race official at the MILE 19 post sees the
// tumbler go to Hicks's lips; HARD CUT 1 on "poisoning": low angle on the official, megaphone up, pointing, yelling.
const OFF19 = roadAt(-4.4, -82);
SHOT_CAMS[14] = () => [
  K(1102, (f) => { const u = uHill(f), H = hicksAt(u); return { pos: carPt("B", u, 5.5, 5.2, 1.6), look: lerp3([H[0], H[1] + 1.3, H[2]], [OFF19[0], OFF19[1] + 1.4, OFF19[2]], 0.35), fov: 40 }; }, 20),
  K(1128, F(() => ({ pos: [OFF19[0] + 1.3, OFF19[1] + 0.45, OFF19[2] - 1.3], look: [OFF19[0] - 0.1, OFF19[1] + 1.75, OFF19[2] + 0.1], fov: 40 }), 1128, 0.003, [[1130, 0.006, 12]]), 1, true),
];
SHOT_ACTS[14] = (f, s) => {
  const u = uHill(f), H = hicksAt(u), S = seatsB(u), yell = f >= 1126;
  return {
    ctl: { carB: u, dustB: 0.4, carA: 1, carAHide: 1, haze: 1, dog: 0, bucket: 1 },
    cast: [
      C("hicks", H, runO(f, { expr: "dismay", sweat: 1, armR: [[18, -10], [8, -26]] as A2, armRFront: true, propR: "tumbler", propK: 0.85 })),
      C("coach", S.front, pose(null, { mode: "sit", expr: "smug", facing: faceTo(14, s, f, S.front, H) })),
      C("organizer", OFF19, pose(null, { expr: yell ? "angry" : "shock", facing: faceTo(14, s, f, OFF19, H), mouth: talk(f, 1130, 1146), sweat: yell ? 1 : 0,
        armR: [[22, -10], [16, -30]] as A2, armRFront: true, propR: "megaphone", propRAng: -0.4, armL: yell ? [[-26, -10], [-56, -16]] as A2 : undefined, squash: yell ? 0.06 * Math.exp(-(f - 1128) / 5) : 0 }), { idx: 5 }),
      ...hillExtras(f),
    ],
    fx: fxs(yell ? bang([OFF19[0], OFF19[1] + 2.3, OFF19[2]], f - 1128) : null),
    focus: f < 1128 ? [H[0], H[1] + 1.5, H[2]] : [OFF19[0], OFF19[1] + 1.6, OFF19[2]], subj: f < 1128 ? "hicks" : "organizer",
  };
};
lens(1102, 5, 1); lens(1128, 8, 1);

// ---- S15 (1156-1202) "The coach shrugs. / 'Just a pinch.'" Profile two-shot alongside the car: a big shrug
// (shoulders, palms and brows up), then he holds up a tiny pinch between finger and thumb.
SHOT_CAMS[15] = () => [
  K(1156, (f) => { const u = uHill(f), S = seatsB(u).front, H = hicksAt(u); return { pos: carPt("B", u, 0.9, 4.6, 1.75), look: lerp3([S[0], S[1] + 0.8, S[2]], [H[0], H[1] + 1.5, H[2]], 0.4), fov: 38 }; }, 22),
];
SHOT_ACTS[15] = (f, s) => {
  const u = uHill(f), H = hicksAt(u), S = seatsB(u), shrug = sm(f, 1162, 1170) * (1 - sm(f, 1180, 1186)), pinch = f >= 1182;
  return {
    ctl: { carB: u, dustB: 0.4, carA: 1, carAHide: 1, haze: 1, dog: 0, bucket: 1 },
    cast: [
      C("hicks", H, runO(f, { expr: "dismay", sweat: 1 })),
      C("coach", S.front, pose(null, { mode: "sit", expr: pinch ? "sly" : shrug > 0.3 ? "sheepish" : "smug", facing: faceTo(15, s, f, S.front, [OFF19[0], 0, OFF19[2] + 6]), mouth: talk(f, 1183, 1194),
        armR: pinch ? ARMS.pinchR : [[30, lerp(10, -12, shrug)], [lerp(40, 52, shrug), lerp(16, -10, shrug)]] as A2, armL: [[-30, lerp(10, -12, shrug)], [lerp(-40, -52, shrug), lerp(16, -10, shrug)]] as A2,
        armRFront: true, armLFront: true, squash: 0.05 * shrug, headTilt: 6 * shrug })),
      C("helper", S.driver, pose(null, { mode: "sit", expr: "dismay", facing: -1 }), { idx: 2 }),
      ...hillExtras(f),
    ],
    fx: fxs(pinch ? sparkle("pinch2", [S.front[0] + 0.2, S.front[1] + 1.15, S.front[2]], f - 1186, 0.16) : null),
    focus: [S.front[0], S.front[1] + 0.9, S.front[2]], subj: "coach",
  };
};
lens(1156, 6, 16);

// ---- S16 (1202-1243) "Then he gives him another one." Hicks gulps the second tumbler; his hair stands up, his eyes go
// wired, and he zooms ahead of the car with speed lines and a burst of dust; 8 f dissolve to the drugstore (night).
SHOT_CAMS[16] = () => [
  K(1202, (f) => { const u = uHill(f), H = hicksAt(u); return { pos: carPt("B", u, 3.6, 3.8, 1.55), look: [H[0], H[1] + 1.4, H[2]], fov: 40 }; }, 20),
];
SHOT_ACTS[16] = (f, s) => {
  const u = uHill(f), S = seatsB(u), hand = sm(f, 1206, 1214), gulp = sm(f, 1214, 1226), zoom = f >= 1228;
  const H = along3("B", u, hicksAt(u), zoom ? 0.12 * (f - 1228) ** 1.4 : 0);
  return {
    ctl: { carB: u, dustB: 0.4, carA: 1, carAHide: 1, haze: 1, dog: 0, bucket: 1 },
    cast: [
      C("hicks", H, runO(zoom ? f * 2 : f, { expr: zoom ? "wired" : gulp > 0.2 ? "gulp" : "dismay", sweat: zoom ? 0 : 1, tilt: zoom ? 18 : 4, hatLift: 0,
        armR: gulp > 0 && !zoom ? [[18, -10], [8, -30]] as A2 : undefined, armRFront: true, propR: hand > 0.5 && !zoom ? "tumbler" : undefined, propK: 0.85 * (1 - gulp), propRAng: -1.0 * gulp })),
      C("coach", S.front, pose(null, { mode: "sit", expr: zoom ? "eureka" : "sly", facing: faceTo(16, s, f, S.front, H), armR: [[26, -4], [lerp(36, 50, hand), lerp(10, -10, hand)]] as A2, armRFront: true, propR: hand < 0.5 ? "tumbler" : undefined, propK: 0.85 })),
      ...hillExtras(f),
    ],
    fx: fxs(zoom ? speedLines(H, f, 6, 1.4, [-roadCar("B", u).dir[0], -roadCar("B", u).dir[2]]) : null, zoom ? dustCard("burst", along3("B", u, H, -0.8), 1.1, 0.9 * (1 - lin(f, 1228, 1243)), 4) : null,
      sparkle("zap", [H[0], H[1] + 2.2, H[2]], f - 1226, 0.35, "#ffe95a")),
    focus: [H[0], H[1] + 1.5, H[2]], subj: "hicks",
  };
};
lens(1202, 6, 1);
