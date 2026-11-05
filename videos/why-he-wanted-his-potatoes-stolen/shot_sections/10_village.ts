
// =====================================================================================================================
// SHOT 1 (0-588) = SCENE 1 (field, 0-117) + SCENE 2 (village market, 117-588), one continuous camera path in the valley.
// "A man put armed soldiers around a potato field just so people would steal it. You see, in France back then, everybody
// was sure potatoes were pig food that gave you leprosy. But this guy had survived a war prison eating nothing but
// potatoes. He begged farmers to grow them. Nobody would. One farmer took a whole sack and fed it to his pig. The whole
// town laughed. 'Hey, it's the Pig Doctor!'"
// Frame 1: the hero kneels in the middle of the guarded field polishing a potato like a jewel, the soldiers stand at
// attention round the wall; two villager heads peek over the wall on "steal it"; he tosses the potato and the camera rides
// it down the hill into the pig's trough (ride the motion). Market: the pig gulps it, a woman pinches her nose at the
// PIG FEED crate, a man drops a potato like it's hot on "leprosy", the hero throws his coat open on the old prison shirt
// and crunches a raw potato, kneels to beg the big farmer (arms crossed), the farmer takes the sack and pours it into the
// trough, the whole town laughs on the same word, "Pig Doctor!", and the hero raises a potato (-> the king's head).
const FYv = 4;
const HK: V3 = [-28.6, FYv, -20.8];                                    // hero kneeling in the field (hook)
const RING: Record<string, V3> = { sergeant: [-23.2, FYv, -20.6], sol1: [-33.4, FYv, -26.3], sol2: [-33.6, FYv, -21.0], sol3: [-33.4, FYv, -15.6], sol4: [-30.8, FYv, -26.6], sol5: [-26.4, FYv, -26.7], sol6: [-28.6, FYv, -15.3] };
const PEEK: V3[] = [[-36.0, FYv, -22.4], [-36.0, FYv, -19.6]];
const TRO: V3 = [-7.75, 0.25, -3.4], PIG: V3 = [-9.0, 0, -3.4];
const H1: V3 = [-3.4, 0, -3.0];                                       // hero in the market
const FARM: V3 = [-5.0, 0, -3.65], FARM_POUR: V3 = [-6.75, 0, -3.35];
const V1: V3 = [-4.4, 0, 0.4], V2: V3 = [-1.7, 0, -4.9], F2: V3 = [-0.25, 0, -4.3], F3: V3 = [1.2, 0, -2.4], V3b: V3 = [4.6, 0, -7.55], V4: V3 = [-1.2, 0, 0.9], V5: V3 = [0.6, 0, -0.9];
/** the tossed potato: hand -> arc -> trough, frames 98..121 */
const TOSS0 = 98, TOSS1 = 121;
const tossAt = (f: number): V3 => {
  const u = clamp01((f - TOSS0) / (TOSS1 - TOSS0)), S: V3 = [HK[0] + 0.35, FYv + 1.55, HK[2] + 0.2], E = TRO;
  return [lerp(S[0], E[0], u), lerp(S[1], E[1], u) + 4 * 4.8 * u * (1 - u), lerp(S[2], E[2], u)];
};
const potatoCard = (key: string, pos: V3, s = 0.22, rot = 0): FxSpec => ({ kind: "card", key: "potato_" + key, pos, w: s, h: s * 0.8, rot, cw: 128, ch: 102,
  draw: (p) => { const g = p.g; g.fillStyle = INKC; g.beginPath(); g.ellipse(64, 52, 58, 44, 0.15, 0, 7); g.fill(); g.fillStyle = "#b88552"; g.beginPath(); g.ellipse(64, 52, 50, 36, 0.15, 0, 7); g.fill();
    g.fillStyle = "#9a6a3c"; g.beginPath(); g.ellipse(74, 62, 30, 18, 0.15, 0, 7); g.fill(); g.fillStyle = "#e8c896"; g.beginPath(); g.ellipse(46, 36, 14, 7, -0.3, 0, 7); g.fill();
    g.fillStyle = "#6e4a2a"; for (const [x, y] of [[40, 58], [70, 40], [86, 58], [58, 70]]) { g.beginPath(); g.arc(x, y, 3.5, 0, 7); g.fill(); } } });
const STY_CAM: V3 = [-4.6, 1.45, -0.9];
const PH = 0.42; // potato rest point above the hero's raised hand (scene 2 -> 3 position match)
SHOT_CAMS[1] = (s) => [
  // hook: low inside the field, gliding sideways past the sergeant to the kneeling hero with the soldier ring behind him
  K(0, (f) => { const k = sm(f, 0, 92); return { pos: lerp3([-24.1, FYv + 1.3, -24.0], [-24.3, FYv + 1.45, -17.9], k), look: lerp3([-29.3, FYv + 0.95, -21.2], [-29.6, FYv + 1.0, -21.0], k), fov: 44 }; }),
  // ride the motion: behind the tossed potato, swinging round to the pigsty on landing
  K(95, (f) => { const u = clamp01((f - TOSS0) / (TOSS1 - TOSS0)), P = tossAt(f), dx = TRO[0] - HK[0], dz = TRO[2] - HK[2], L = Math.hypot(dx, dz), d = [dx / L, dz / L];
    const chase: V3 = [P[0] - d[0] * 4.6, P[1] + 1.4, P[2] - d[1] * 4.6], k = sm(u, 0.35, 1);
    return { pos: lerp3(chase, STY_CAM, k), look: lerp3([P[0] + d[0] * 2, P[1] - 0.2, P[2] + d[1] * 2], [TRO[0] - 0.7, 0.45, TRO[2]], sm(u, 0.82, 1)), fov: lerp(46, 40, k) }; }, 7),
  K(122, F(() => ({ pos: STY_CAM, look: [TRO[0] - 0.7, 0.45, TRO[2]] as V3, fov: 40 }), 122, 0.002)),
  // "everybody was sure ... pig food": slide right to the woman pinching her nose at the PIG FEED crate
  K(160, F(() => fit([body(V1, 0, 2.05, 0.4), [[-5.6, 0, -1.0], 0, 1.0, 0.5], body(PIG, 0, 0.9, 0.5)], 28, 8, 40, 0.86), 160, 0.0018, [[182, 0.005, 10]]), 26),
  // "leprosy": on to the potato stall: the man drops the potato, his neighbour jumps back
  K(214, F(() => fit([body(V2, 0, 2.05, 0.4), body(F2, 0, 2.05, 0.4)], 10, 6, 40, 0.8), 214, 0.002, [[236, 0.006, 10]]), 22),
  // "But this guy": the hero between them, coat thrown open on the prison shirt, crunching a raw potato
  K(252, F(() => fit([body(H1, 0, 2.3, 0.5), body(V2, 0.6, 2.05, 0.3)], 20, 6, 40, 0.78, -0.15), 252, 0.0018, [[282, 0.005, 10]]), 22),
  // "He begged farmers": two-shot from the side, hero kneeling, the big farmer with crossed arms, the pig pen behind
  K(348, F(() => fit([body(H1, 0, 1.6, 0.45), body(FARM, 0, 2.05, 0.45)], 8, 6, 40, 0.8), 348, 0.0018, [[402, 0.005, 10]]), 24),
  // "fed it to his pig": track with the farmer to the trough
  K(432, F((f) => { const fp = lerp3(FARM, FARM_POUR, sm(f, 438, 466)); return fit([body(fp, 0, 2.05, 0.45), body(PIG, 0, 0.9, 0.55), body(H1, 0, 2.1, 0.4)], 24, 9, 40, 0.84); }, 432, 0.0016), 26),
  // "The whole town laughed": pull back and up to the whole square
  K(494, F(() => ({ pos: [-2.4, 6.2, 8.6] as V3, look: [-2.6, 0.7, -2.4] as V3, fov: 60 }), 494, 0.0016), 26),
  // "Hey, it's the Pig Doctor!": the farmer points and shouts, the hero raises a brow
  K(538, F(() => fit([body(FARM_POUR, 0, 2.1, 0.45), body(H1, 0, 2.3, 0.45)], 30, 4, 38, 0.8), 538, 0.0018, [[560, 0.005, 8]]), 18),
  // he raises the potato: push in until it sits on the frame centre at the king-head size (position match into shot 2)
  K(566, (f) => { const h = heroPotato(s), k = sm(f, 566, 586); return { pos: lerp3([h[0] + 4.0 * Math.sin(0.45), h[1] - 0.45, h[2] + 4.0 * Math.cos(0.45)], [h[0] + 2.7 * Math.sin(0.45), h[1] - 0.3, h[2] + 2.7 * Math.cos(0.45)], k), look: [h[0], h[1] - 0.36, h[2]], fov: 38 }; }, 18),
];
/** world point of the potato raised in the hero's right hand at the end of shot 1 (card faces the close-up camera) */
const heroPotato = (_s: SetDef): V3 => [H1[0] + 0.3, 2.36, H1[2] + 0.12];
SHOT_ACTS[1] = (f, s) => {
  const field = f < 116, ph12 = (f / 12) % 1;
  const peekK = sm(f, 82, 90) * (1 - sm(f, 104, 112));
  const pour = sm(f, 472, 482) * (1 - sm(f, 492, 500));
  const chew = (a: number, b: number) => (f >= a && f < b ? (Math.floor(f / 3) % 2 ? "O" : "dash") as MouthK : undefined);
  const fw = walkPath(1, s, [FARM, FARM_POUR], f, 438, 466);
  const cast: CastPlace[] = [];
  if (field) {
    cast.push(C("parm", HK, flow(f, [
      [0, { mode: "kneel", expr: "smug", facing: -1, armR: [[22, 20], [30, 4]] as A2, armRFront: true, propR: "potato", propK: 1, armL: [[-22, 24], [6 + 6 * Math.sin(f * 0.7), 8]] as A2, armLFront: true }],
      [70, { mode: "kneel", expr: "sly", facing: -1, look: -0.6, armR: [[22, 20], [30, 4]] as A2, armRFront: true, propR: "potato", propK: 1 }, 6],
      [89, { mode: "kneel", expr: "determined", facing: -1, armR: [[24, 30], [10, 46]] as A2, propR: "potato", propK: 1 }, 6],      // wind-up
      [96, { mode: "kneel", expr: "smug", facing: -1, armR: [[34, -18], [52, -56]] as A2 }, 2],                                       // the toss
    ]), { idx: 1 }));
    for (const [who, p] of Object.entries(RING)) cast.push(C(who, p, pose(null, { expr: who === "sergeant" ? "stern" : "bored", facing: faceTo(1, s, f, p, HK), look: 0.4, armR: [[24, 26], [20, 40]] as A2, armRFront: true, propR: "musket" }), { idx: 10 + who.length }));
    if (peekK > 0.01) PEEK.forEach((p, i) => cast.push(C(i ? "vil1" : "farmer", [p[0], p[1] - 1.25 * (1 - peekK), p[2]], pose(null, { expr: "sly", facing: 1, look: 0.8 }), { idx: 30 + i })));
  } else {
    cast.push(C("pig", PIG, flow(f, [
      [116, { expr: "neutral", facing: 1, tilt: 0 }],
      [121, { expr: "joy", facing: 1, tilt: 25, mouth: chew(121, 168) }, 3],
      [168, { expr: "joy", facing: 1, tilt: 0 }, 6],
      [486, { expr: "joy", facing: 1, tilt: 25, mouth: chew(486, 548) }, 3],
      [548, { expr: "neutral", facing: 1, tilt: 4, mouth: f >= 558 && f < 570 ? "O" : undefined }, 4],                               // oink
    ]), { idx: 40, scale: 0.78 }));
    // the woman at the PIG FEED crate
    cast.push(C("vil1", V1, flow(f, [
      [116, { expr: "neutral", facing: -1, look: -0.5 }],
      [167, { expr: "dismay", facing: -1, look: -0.6 }, 1],
      [178, { expr: "dismay", facing: -1, armR: [[20, 2], [4, -30]] as A2, armRTop: true, tilt: 6 }, 3],                            // pinches her nose
      [298, { expr: "shock", facing: 1, tilt: -6, armR: [[20, 2], [4, -30]] as A2, armRTop: true }, 3],                                // recoils from the prison shirt
      [330, { expr: "dismay", facing: 1, armR: [[24, 30], [30, 52]] as A2 }, 6],
      [501, { expr: "laugh", facing: 1, shake: 1, phase: ph12, headBack: 0.6, armR: [[26, 44], [6, 70]] as A2, armRFront: true }, 2],
    ]), { idx: 41 }));
    // the man holding a potato at arm's length, then dropping it like it's hot on "leprosy"
    const hop2 = sm(f, 236, 240) * (1 - sm(f, 240, 246));
    cast.push(C("vil2", lerp3(V2, [V2[0] + 0.35, 0, V2[2] - 0.2], sm(f, 236, 244)), flow(f, [
      [116, { expr: "stare", facing: 1, look: 0.6, armR: [[30, 12], [52, 4]] as A2, armRFront: true, propR: "potato" }],
      [229, { expr: "nervous", facing: 1, sweat: 1, tilt: 5, armR: [[30, 12], [52, 4]] as A2, armRFront: true, propR: "potato" }, 6],       // wind-up: leans in
      [237, { expr: "yikes", facing: 1, sweat: 1, mode: "hop", lift: hop2, armR: [[30, -20], [44, -50]] as A2, armL: [[-30, -20], [-44, -50]] as A2 }, 2],
      [250, { expr: "dismay", facing: 1, sweat: 1, armR: [[24, 30], [30, 52]] as A2 }, 6],
      [298, { expr: "shock", facing: 1, tilt: -7 }, 2],
      [404, { expr: "cold", facing: -1, armR: [[24, 30], [-6, 34]] as A2, armL: [[-24, 30], [6, 30]] as A2, armRFront: true, armLFront: true }, 6],
      [502, { expr: "guffaw", facing: -1, shake: 1, phase: ph12, armR: [[26, 44], [6, 70]] as A2, armL: [[-26, 44], [-6, 70]] as A2, armRFront: true, armLFront: true }, 2],
    ]), { idx: 42 }));
    const hopF = sm(f, 237, 241) * (1 - sm(f, 241, 247));
    cast.push(C("farmer2", lerp3(F2, [F2[0] + 0.5, 0, F2[2] + 0.2], sm(f, 237, 245)), flow(f, [
      [116, { expr: "neutral", facing: -1, look: -0.5 }],
      [236, { expr: "yikes", facing: -1, sweat: 1, mode: "hop", lift: hopF }, 1],
      [250, { expr: "dismay", facing: -1, sweat: 1 }, 6],
      [400, { expr: "cold", facing: -1, headTilt: 9 * Math.sin((f - 400) * 0.45) * (f < 424 ? 1 : 0) }, 2],                             // shakes his head: no
      [503, { expr: "laugh", facing: -1, shake: 1, phase: ph12 + 0.3, armR: [[40, 18], [88, 8]] as A2 }, 2],                            // points at the hero
    ]), { idx: 43 }));
    cast.push(C("farmer3", F3, flow(f, [
      [116, { expr: "smile", facing: -1, look: -0.3 }],
      [403, { expr: "cold", facing: 1, back: true }, 3],                                                                                // turns his back
      [500, { expr: "guffaw", facing: -1, shake: 1, phase: ph12 + 0.6, armR: [[26, 44], [6, 70]] as A2, armRFront: true }, 3],
    ]), { idx: 44 }));
    cast.push(C("vil3", V3b, flow(f, [
      [116, { expr: "smile", facing: -1 }],
      [497, { expr: "laugh", facing: -1, armR: [[30, -14], [40, -40]] as A2 }, 6],                                                       // wind-up
      [503, { expr: "guffaw", facing: -1, shake: 1, phase: ph12, armR: [[30, 20], [44, 40]] as A2, armRFront: true }, 2],                 // slaps the counter
    ]), { idx: 45 }));
    cast.push(C("vil4", V4, flow(f, [[116, { expr: "smile", facing: -1 }], [503, { expr: "laugh", facing: -1, shake: 1, phase: ph12 + 0.2, mode: "hop", lift: 0.25 * Math.abs(Math.sin(f * 0.4)) }, 2]]), { idx: 46 }));
    cast.push(C("vil5", V5, flow(f, [[116, { expr: "neutral", facing: -1 }], [503, { expr: "laugh", facing: -1, shake: 1, phase: ph12 + 0.5, headBack: 0.7, armR: [[26, 44], [6, 70]] as A2, armRFront: true }, 2]]), { idx: 47 }));
    // the big farmer
    cast.push(C("farmer", fw.p, fw.moving ? pose(null, { mode: "walk", phase: fw.phase, facing: fw.facing, expr: "smug", armR: [[24, 30], [8, 46]] as A2, armRFront: true, propR: "sack" }) : flow(f, [
      [116, { expr: "neutral", facing: 1, look: 0.4 }],
      [355, { expr: "cold", facing: 1, armR: [[24, 30], [-6, 34]] as A2, armL: [[-24, 30], [6, 30]] as A2, armRFront: true, armLFront: true }, 6],   // arms crossed
      [424, { expr: "sly", facing: 1, armR: [[30, 20], [52, 18]] as A2, armRFront: true }, 6],                                                       // reaches for the sack
      [430, { expr: "smug", facing: 1, armR: [[24, 30], [8, 46]] as A2, armRFront: true, propR: "sack" }, 3],
      [468, { expr: "smug", facing: -1, armR: [[30, -6], [46, -30]] as A2, propR: "sack", propRAng: 0 }, 4],
      [474, { expr: "grin", facing: -1, armR: [[30, -6], [46, -30]] as A2, propR: "sack", propRAng: -2.1 * pour }, 3],                              // pours it into the trough
      [498, { expr: "guffaw", facing: -1, shake: 1, phase: ph12, armR: [[26, 44], [6, 70]] as A2, armL: [[-26, 44], [-6, 70]] as A2, armRFront: true, armLFront: true }, 4],
      [540, { expr: "angry", facing: 1, mouth: talk(f, 540, 572), armR: [[40, 18], [88, 8]] as A2, headTilt: 4 * Math.sin(f * 0.6) }, 2],          // "Hey, it's the Pig Doctor!"
      [574, { expr: "grin", facing: 1, armR: [[40, 18], [88, 8]] as A2 }, 3],
    ]), { idx: 48 }));
    // the hero (in the market from the landing on)
    const coatOpen = f >= 280 && f < 346;
    cast.push(C(coatOpen ? "parmPrison" : "parm", H1, flow(f, [
      [116, { expr: "calm", facing: -1, look: -0.4 }],
      [258, { expr: "smug", facing: 1, armR: [[24, 30], [30, 52]] as A2 }, 1],
      [273, { expr: "sly", facing: 1, armR: [[18, 26], [4, 22]] as A2, armL: [[-18, 26], [-4, 22]] as A2, armRFront: true, armLFront: true }, 6],     // grabs his lapels
      [280, { expr: "proud", facing: 1, armR: [[34, 10], [62, 6]] as A2, armL: [[-34, 10], [-62, 6]] as A2 }, 2],                                       // throws the coat open
      [306, { expr: "grin", facing: 1, armR: [[22, 16], [8, -20]] as A2, armRFront: true, propR: "potato" }, 3],                                          // raw potato up to the mouth
      [312, { expr: "grin", facing: 1, mouth: chew(312, 338), armR: [[22, 16], [10, -16]] as A2, armRFront: true, propR: "potato" }, 2],               // crunch
      [340, { expr: "smile", facing: 1, armR: [[18, 26], [4, 22]] as A2, armL: [[-18, 26], [-4, 22]] as A2, armRFront: true, armLFront: true }, 4],     // closes the coat
      [356, { expr: "pained", facing: -1, mode: "kneel", armR: [[24, 4], [40, -24]] as A2, armL: [[-24, 4], [-40, -24]] as A2, propR: "potato", propL: "potato" }, 6], // kneels, begging
      [402, { expr: "sheepish", facing: -1, mode: "kneel", armR: [[24, 14], [40, -6]] as A2, armL: [[-24, 14], [-40, -6]] as A2, propR: "potato", propL: "potato" }, 4],
      [416, { expr: "pained", facing: -1, mode: "kneel", armR: [[30, 10], [56, 2]] as A2, armRFront: true, propR: "sack" }, 5],                            // holds up a sack
      [431, { expr: "eureka", facing: -1, mode: "kneel", armR: [[24, 30], [30, 52]] as A2 }, 2],
      [446, { expr: "calm", facing: -1, armR: [[24, 30], [30, 52]] as A2 }, 8],                                                                             // stands up
      [500, { expr: "cold", facing: -1, look: -0.5 }, 1],                                                                                                    // unbothered while they laugh
      [544, { expr: "smug", facing: -1, look: -0.6, headTilt: -4 }, 1],
      [560, { expr: "sly", facing: 1, armR: [[24, -30], [30, -80]] as A2 }, 4],                                                    // raises the potato
    ]), { idx: 1 }));
  }
  const tossing = f >= TOSS0 && f < TOSS1;
  return {
    ctl: { planted: 1, holes: 0, torches: 0, moon: 0, trough: f >= 486 && f < 548 ? 1 : 0, feed: 1, gardens: 0, smoke: 1 },
    cast,
    fx: fxs(
      tossing ? potatoCard("toss" + (Math.floor(f / 2) % 4), tossAt(f), 0.42, f * 0.35) : null,
      tossing && f > TOSS0 + 3 ? speedLines(tossAt(f), f, 4, 0.8, [-(TRO[0] - HK[0]) / 29, -(TRO[2] - HK[2]) / 29]) : null,
      f >= 120 && f < 126 ? sparkle("land", [TRO[0], 0.55, TRO[2]], f - 120, 0.35) : null,
      f >= 238 && f < 252 ? potatoCard("drop", [V2[0] + 0.45, Math.max(0.1, 1.2 - 0.5 * ((f - 238) / 3) ** 2), V2[2] + 0.1], 0.18, (f - 238) * 0.4) : f >= 252 && f < 588 ? potatoCard("dropRest", [V2[0] + 0.45, 0.08, V2[2] + 0.1], 0.18, 0.2) : null,
      f >= 486 && f < 500 ? dustCard("pour", [TRO[0] + 0.1, 0.7, TRO[2]], 0.7, 0.7 * (1 - lin(f, 486, 500)), 2) : null,
      f >= 560 ? potatoCard("raised", lerp3([H1[0] + 0.4, 1.9, H1[2] + 0.12], heroPotato(s), sm(f, 560, 566)), 0.42, 0.15) : null,
      f >= 570 && f < 584 ? sparkle("raised", [heroPotato(s)[0] + 0.18, heroPotato(s)[1] + 0.2, heroPotato(s)[2]], f - 570, 0.22) : null,
      f >= 312 && f < 338 && f % 6 < 3 ? sparkle("crumbs" + (f % 12), [H1[0] + 0.25, 1.75, H1[2] + 0.1], (f % 6), 0.14, "#f4dcb0") : null,
    ),
    focus: field ? [HK[0], FYv + 1.2, HK[2]] : f < 160 ? [TRO[0] - 0.7, 0.5, TRO[2]] : f < 214 ? [V1[0], 1.7, V1[2]] : f < 252 ? [V2[0], 1.7, V2[2]] : f < 494 ? [H1[0], 1.6, H1[2]] : f < 538 ? [-2.4, 1.5, -2.4] : f < 566 ? [FARM_POUR[0], 1.7, FARM_POUR[2]] : heroPotato(s),
    subj: field ? "parm" : f < 160 ? "pig" : f < 214 ? "vil1" : f < 252 ? "vil2" : f < 432 ? "parm" : f < 494 ? "farmer" : f < 538 ? "parm" : f < 566 ? "farmer" : null,
  };
};
lens(0, 4, 1); lens(95, 1, 8); lens(122, 6, 8); lens(160, 5, 20); lens(214, 6, 16); lens(252, 6, 16); lens(348, 5, 20); lens(432, 5, 20); lens(494, 2, 20); lens(538, 6, 14); lens(566, 9, 16);
