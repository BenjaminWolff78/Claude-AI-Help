
// =====================================================================================================================
// SCENE 1 (0-316) HOME BASE A, the bridge site + one continuous flight over the town to the sales office.
// "A man put a bridge in the desert, then dug a river under it. You see, he'd built a whole town in the Arizona desert,
//  and the sign said, 'Population: three hundred.' It was so hot his salesmen were selling sand."
// Frame 1: the boss beams beside the dry centre arch while the bulldozer bites the sand under it. On "You see" he walks
// to his red convertible and hops in; the camera rises over the bridge and chases the car past the POPULATION 300 town
// sign (he points at it) and the 110 thermometer to the office, where one salesman pours sand out of his shoe and the
// other offers a jar of sand. The agent runs out waving the newspaper (London's bridge for sale): push into the photo.
const B_ARCH: V3 = [-8.2, 0, -11.5];
const B_DOOR_SIDE: V3 = [-12.85, 0, -9.25];
const carU = (f: number) => lin(f, 136, 256);
const D_OFF = (p: V3): V3 => [40 - p[0], p[1], 110.85 - p[2]]; // office-local -> desert set space
const SALES_A: V3 = D_OFF([-1.6, 0.02, 5.5]), SALES_B: V3 = D_OFF([3.1, 0.02, 5.5]);
/** the boss's walk from his parked car around its nose to the office door (scene 1 end -> scene 2) */
const B_WALK_IN: V3[] = [[35.6, 0.1, 102.7], [38.0, 0.1, 103.5], [38.95, 0.02, 104.9]];
/** the agent runs out of the office door with the newspaper */
const A_OUT: V3[] = [[40.4, 0, 110.6], [39.6, 0, 108.2], [39.75, 0.02, 106.15]];
const boss1 = (f: number, s: SetDef): CastPlace => {
  if (f < 96) {
    return C("boss", B_ARCH, flow(f, [
      [0, { expr: "beam", facing: 1, armR: [[30, 20], [44, 40]], armRFront: true }],
      [16, { expr: "proud", facing: 1, ...PZ.pointRUp }],                        // "...a bridge"
      [44, { expr: "beam", facing: 1, armR: [[30, 20], [44, 40]], armRFront: true }],
      [54, { expr: "sly", facing: 1, ...PZ.pointR, headTilt: -4 }],             // "...dug a river under it"
      [86, { expr: "proud", facing: -1, armR: [[26, 30], [30, 52]] }],
    ]), { idx: 1 });
  }
  if (f < 124) { const w = walkPath(1, s, [B_ARCH, B_DOOR_SIDE], f, 96, 124);
    return C("boss", w.p, pose(null, { mode: w.moving ? "stride" : undefined, phase: w.phase, facing: w.facing, expr: "proud" }), { idx: 1 }); }
  const car = desertBossCar(carU(f));
  if (f < 134) { const k = sm(f, 124, 134); // hop over the door into the driver seat
    return C("boss", lerp3([B_DOOR_SIDE[0], 0.25 * Math.sin(k * Math.PI) * 4, B_DOOR_SIDE[2]], car.driver, k), pose(null, { mode: k < 0.6 ? "hop" : "sit", lift: 0.6 * Math.sin(k * Math.PI), expr: "beam", facing: -1 }), { idx: 1, air: true }); }
  if (f < 258) {
    const gest = sm(f, 178, 188) * (1 - sm(f, 212, 222));             // "the sign said, Population 300": points at the town sign
    return C("boss", car.driver, pose(null, { ...ACT.drive, expr: f > 180 && f < 220 ? "sly" : "beam", facing: -1,
      ...(gest > 0.05 ? { armR: [[26 + 10 * gest, 26 - 40 * gest], [30 + 40 * gest, 24 - 70 * gest]] as A2 } : {}), headTilt: 3 * Math.sin(f * 0.2) }), { idx: 1 });
  }
  if (f < 270) { const k = sm(f, 258, 270); // vaults over the passenger door onto the sidewalk
    return C("boss", lerp3(car.driver, B_WALK_IN[0], k), pose(null, { mode: k < 0.7 ? "hop" : undefined, lift: 0.5 * Math.sin(k * Math.PI), expr: "proud", facing: 1 }), { idx: 1, air: true }); }
  if (f < 302) { const w = walkPath(1, s, B_WALK_IN, f, 270, 300);
    const wave = f > 284 && f < 298; // waves the sand jar away
    return C("boss", w.p, pose(null, { mode: w.moving ? "stride" : undefined, phase: w.phase, facing: w.facing, expr: wave ? "smug" : "proud",
      ...(wave ? { armL: [[-30, 6], [-50, -18 + 8 * Math.sin(f * 0.9)]] as A2 } : {}) }), { idx: 1 }); }
  return C("boss", B_WALK_IN[2], flow(f, [
    [302, { expr: "proud", facing: 1 }],
    [306, { expr: "stare", facing: 1, armR: [[28, 16], [52, 6]] as A2, armRFront: true }, 8],   // reaches for the paper
  ]), { idx: 1 });
};
const agent1 = (f: number, s: SetDef): CastPlace => {
  if (f < 284) return C("agent", A_OUT[0], pose(null, { expr: "neutral", facing: -1 }), { idx: 7 });
  if (f < 300) { const w = walkPath(1, s, A_OUT, f, 284, 300);
    return C("agent", w.p, pose(null, { ...ACT.paperWave, mode: w.moving ? "stride" : undefined, phase: w.phase, facing: w.facing, mouth: talk(f, 286, 320) }), { idx: 7 }); }
  return C("agent", A_OUT[2], flow(f, [
    [300, { ...ACT.paperWave, facing: faceTo(1, s, f, A_OUT[2], B_WALK_IN[2]), mouth: talk(f, 286, 320) }],
    [304, { expr: "eureka", facing: faceTo(1, s, f, A_OUT[2], B_WALK_IN[2]), armR: [[28, 10], [46, -6]] as A2, armRFront: true, propR: "bridgePaper", mouth: talk(f, 286, 320) }, 8], // holds the photo up
  ]), { idx: 7 });
};
const salesmen1 = (f: number, s: SetDef, id: number): CastPlace[] => {
  const pour = f >= 288;
  return [
    C("salesA", SALES_A, flow(f, [
      [0, { expr: "dismay", sweat: 1, facing: -1, armR: [[28, 10], [26 + 6 * Math.sin(st(f, 2) * 0.9), -18]], armRFront: true }],
      [282, { ...ACT.pour, expr: "bored", sweat: 1, facing: -1, propK: pour ? 1 : 0 }],
    ], 8), { idx: 2 }),
    C("salesB", SALES_B, flow(f, [
      [0, { expr: "neutral", sweat: 0.6, facing: 1, armR: [[30, 30], [40, 46]], propR: "sandJar" }],
      [284, { ...ACT.jar, facing: faceTo(id, s, f, SALES_B, B_WALK_IN[1]) }],
      [300, { expr: "dismay", sweat: 0.6, facing: 1, ...PZ.shrug, propR: "sandJar" }],
    ], 8), { idx: 3 }),
  ];
};
SHOT_CAMS[1] = (s) => {
  const f1 = s.cams.frame1;
  const chase = (f: number) => {
    const car = desertBossCar(carU(f)), fw: V3 = [Math.sin(car.yaw), 0, Math.cos(car.yaw)];
    // follows 10 m behind, flies THROUGH arch 1 with the car (low, x -17 under the crown), then climbs over the town
    const back = 10, cz = car.pos[2] - fw[2] * back, low = clamp01(1 - (Math.abs(cz) - 8) / 9);
    const lat = -2.5 * (1 - 0.6 * (1 - low));
    const pos: V3 = [car.pos[0] - fw[0] * back + fw[2] * lat, lerp(6.2, 3.9, low), cz - fw[0] * lat];
    return { pos: [pos[0] - fw[0] * 2 * (1 - low), lerp(8.0, 3.9, low), pos[2] - fw[2] * 2 * (1 - low)] as V3, look: [car.pos[0] + fw[0] * lerp(3.5, 2.5, low), lerp(0.4, 1.6, low), car.pos[2] + fw[2] * lerp(3.5, 2.5, low)] as V3, fov: 42 };
  };
  return [
    K(0, F(() => ({ pos: f1.pos, look: [-4.6, 2.6, -3.5] as V3, fov: 40 }), 0, 0.0011, [[20, 0.003, 8], [66, 0.003, 10]])),
    K(92, F(() => fit([body(B_ARCH, 0, 2.1, 0.4), body(B_DOOR_SIDE, 0, 2.1, 0.4), body([-14.5, 0, -9.5], 0, 1.5, 1.6)], 214, 10, 42, 0.92), 92, 0.0016), 30),
    K(128, chase, 36),
    K(178, F(() => fit([[[22, 0, 36], 0.6, 4.8, 2.4], body(s.marks.painterGround, 0, 2.0, 0.42)], 236, 7, 42, 0.9), 178, 0.0016, [[196, 0.005, 10]]), 20), // the POPULATION 300 sign
    K(228, F(() => ({ pos: [33.2, 2.6, 91.5] as V3, look: [33.6, 2.0, 102.5] as V3, fov: 46 }), 228, 0.0018, [[244, 0.005, 10]]), 24),           // the 110 thermometer, the car pulls up
    K(266, F(() => fit([body(SALES_B, 0, 2.0, 0.42), body(SALES_A, 0, 2.0, 0.42), body(B_WALK_IN[1], 0, 2.0, 0.4)], 188, 5, 40, 0.92), 266, 0.0018, [[288, 0.005, 10]]), 20),
    K(288, (f) => { const p = polyAt(B_WALK_IN, sm(f, 270, 300)).p; return { pos: [p[0] + 0.2, 1.75, p[2] - 3.4] as V3, look: [p[0] + 0.4, 1.45, p[2] + 3] as V3, fov: 42 }; }, 12),
    K(302, F(() => ({ pos: [39.6, 1.7, 103.85] as V3, look: [40.0, 1.78, 106.2] as V3, fov: 38 }), 302, 0.012), 12), // over his shoulder into the photo
  ];
};
SHOT_ACTS[1] = (f, s) => {
  const thermo = f >= 240 && f < 268, sign = f >= 192 && f < 220;
  return {
    ctl: { dig: 0.1, dozer: lerp(0.4, 0.47, sm(f, 0, 90)), dozerBlade: 0, tumble: lerp(0.28, 0.7, lin(f, 8, 84)), bossCar: carU(f), bossDoor: 0, door: 1, fan: 0.6, sweat: 1, site: 1, lamps: 0 },
    cast: [
      boss1(f, s),
      C("dozer", desertDozer(lerp(0.4, 0.47, sm(f, 0, 90)), 0.1).seat, flow(f, [
        [0, { mode: "sit", expr: "determined", facing: -1, ...ACT.drive }],
        [64, { mode: "sit", expr: "grin", facing: -1, armR: [[24, -6], [30, -34]], armRFront: true }],   // thumbs-up on "river"
        [90, { mode: "sit", expr: "determined", facing: -1, ...ACT.drive }],
      ]), { idx: 4 }),
      C("worker1", [2.5, 10.5, -1.5], pose(null, { expr: "neutral", facing: -1, armR: [[18, 30], [8 + 6 * Math.sin(st(f) * 0.3), 52]], armRFront: true, propR: "broom" }), { idx: 5 }),
      C("worker2", [-3.5, 10.5, 2.0], pose(null, { expr: "smile", facing: 1, armR: [[28, 20], [40, 40]], propR: "numStone", propK: 207 }), { idx: 6 }),
      ...salesmen1(f, s, 1),
      agent1(f, s),
      C("painter", s.marks.painterGround, flow(f, [[0, { expr: "bored", facing: -1, sweat: 0.8, armR: [[26, 30], [30, 52]] as A2, propR: "paintPot" }], [192, { expr: "bored", facing: -1, sweat: 0.8, ...PZ.pointRUp }, 8], [222, { expr: "bored", facing: -1, sweat: 0.8, armR: [[26, 30], [30, 52]] as A2, propR: "paintPot" }, 10]]), { idx: 24 }),
    ],
    fx: fxs(thermo ? sparkle("thermo", [31.6, 3.9, 103.0], f - 244, 0.9, "#fff2b0") : null, thermo ? glowBurst("thermo", [31.6, 3.6, 102.9], 2.0, 0.6 * Math.sin(lin(f, 240, 268) * Math.PI), "255,120,80") : null,
      sign ? sparkle("sign300", [21.4, 3.2, 35.4], f - 196, 1.1) : null),
    focus: f < 96 ? [B_ARCH[0], 1.6, B_ARCH[2]] : f < 250 ? desertBossCar(carU(f)).driver : f < 290 ? [SALES_A[0], 1.5, SALES_A[2]] : f < 302 ? [38.6, 1.5, 104.5] : [A_OUT[2][0], 1.5, A_OUT[2][2]],
    subj: f < 250 ? "boss" : f < 292 ? "salesA" : f < 302 ? "boss" : "agent",
  };
};
lens(0, 6, 1); lens(100, 0.5, 24); lens(250, 6, 20); lens(300, 7, 12);
