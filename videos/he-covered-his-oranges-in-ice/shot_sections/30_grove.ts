// =====================================================================================================================
// "He Covered His Oranges in Ice to Stop Them Freezing": 10 scene ids in two places. The groves (home base, set
// "grove": dusk, 9 p.m., midnight, 3 a.m., sunrise) and the root cellar under Earl's house (set "cellar").
// Faces: Earl = calm half-lid (neutral / bored), smug only at the trick and the payoff, never shock. Duane = moustache
// mouth (tache) by default, laugh / gloat / worry on his beats. Shocks (4): June at the scarecrow (905), Duane at 24
// (995), Duane at the juice (1692), Duane at the clonk (1900). Hard cuts (3): 622, 749, 969.
type CK = { f: number; pos: V3; look: V3; fov: number };
const spline = (ks: CK[]) => (f: number): { pos: V3; look: V3; fov: number } => {
  const n = ks.length; if (f <= ks[0].f) return { pos: ks[0].pos, look: ks[0].look, fov: ks[0].fov };
  if (f >= ks[n - 1].f) return { pos: ks[n - 1].pos, look: ks[n - 1].look, fov: ks[n - 1].fov };
  let i = 0; while (f > ks[i + 1].f) i++;
  const a = ks[i], b = ks[i + 1], h = b.f - a.f, t = (f - a.f) / h, t2 = t * t, t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
  const m = (j: number, g: (k: CK) => number) => (j <= 0 || j >= n - 1 ? 0 : (g(ks[j + 1]) - g(ks[j - 1])) / (ks[j + 1].f - ks[j - 1].f));
  const H = (g: (k: CK) => number) => h00 * g(a) + h10 * h * m(i, g) + h01 * g(b) + h11 * h * m(i + 1, g);
  return { pos: [0, 1, 2].map((c) => H((k) => k.pos[c])) as V3, look: [0, 1, 2].map((c) => H((k) => k.look[c])) as V3, fov: H((k) => k.fov) };
};
const HOLD = (k: CK, f: number): CK => ({ ...k, f });
/** pre-compensate a designed key for the creep F() adds from f0 at `rate`, so the key frame shows the designed framing */
const COMP = (k: CK, f0: number, rate: number): CK => { const g = Math.exp(rate * Math.max(0, k.f - f0)); return { ...k, pos: [k.look[0] + (k.pos[0] - k.look[0]) * g, k.look[1] + (k.pos[1] - k.look[1]) * g, k.look[2] + (k.pos[2] - k.look[2]) * g] }; };
const CKf = (f: number, pos: V3, look: V3, fov = 44): CK => ({ f, pos, look, fov });
/** a whip / swing between two framings: the view direction turns through yaw (no look-point collapse), the position
 *  slides (with a lift arc to clear fences and crowns), eased over [f0, f1] */
const dirOf = (c: Shot) => { const d = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]], L = Math.hypot(d[0], d[1], d[2]) || 1; return { yaw: Math.atan2(d[0], d[2]), pitch: Math.asin(d[1] / L), L }; };
const swing = (from: (f: number) => Shot, f0: number, to: (f: number) => Shot, f1: number, lift = 0) => (f: number): Shot => {
  const A = from(f0), B = to(f), k = sm(f, f0, f1), da = dirOf(A), db = dirOf(B);
  let dy = db.yaw - da.yaw; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI;
  const yaw = da.yaw + dy * k, pitch = lerp(da.pitch, db.pitch, k), L = lerp(da.L, db.L, k);
  const pos = lerp3(A.pos, B.pos, k); pos[1] += lift * Math.sin(Math.PI * k);
  return { pos, look: [pos[0] + Math.sin(yaw) * Math.cos(pitch) * L, pos[1] + Math.sin(pitch) * L, pos[2] + Math.cos(yaw) * Math.cos(pitch) * L], fov: lerp(A.fov ?? 40, B.fov ?? 40, k), roll: 0 };
};
const toward = (id: number, s: SetDef, f: number, a: V3, b: V3) => faceTo(id, s, f, a, b);
const EYE = 1.3;   // v13 rig: head centre of an adult card 1.30 m above its feet (sitting 0.85, kid 0.99)
const head = (p: V3, y = EYE): V3 => [p[0], p[1] + y, p[2]];
/** the hose nozzle in Earl's fist: the hand sits on the card plane, ~0.4 m to the screen side of the hose arm (left arm =
 *  screen left, it points at the target on the left), the nozzle tip ~1.12 m up (v13 rig) */
const nozzle = (E: V3, T: V3, id?: number, s?: SetDef, f?: number, side = -1): Record<string, number> => {
  if (id !== undefined && s && f !== undefined) { const c = camAt(id, s, f), d = [c.look[0] - c.pos[0], c.look[2] - c.pos[2]], L = Math.hypot(d[0], d[1]) || 1, r = [-d[1] / L, d[0] / L];
    return { hx: E[0] + r[0] * side * 0.4, hy: E[1] + 1.12, hz: E[2] + r[1] * side * 0.4 }; }
  const dx = T[0] - E[0], dz = T[2] - E[2], L = Math.hypot(dx, dz) || 1; return { hx: E[0] + (dx / L) * 0.36, hy: E[1] + 1.02, hz: E[2] + (dz / L) * 0.36 }; };
/** extra arms */
const AG = {
  hoseR: [[26, -4], [52, -12]] as A2, hoseUpR: [[26, -10], [50, -26]] as A2, lanternL: [[-22, 18], [-30, 34]] as A2, lanternUpL: [[-24, -2], [-36, -22]] as A2,
  heaveR: [[28, 2], [50, 8]] as A2, heaveL: [[24, 6], [46, 12]] as A2, crossR: [[20, 18], [-10, 18]] as A2, crossL: [[-20, 18], [10, 18]] as A2,
  sipR: [[20, 10], [8, -14]] as A2, cupR: [[22, 18], [26, 4]] as A2, slapDownR: [[30, 10], [52, 18]] as A2, slapUpR: [[28, -14], [46, -34]] as A2,
  torchR: [[26, 4], [46, 20]] as A2, paintUpR: [[24, -18], [40, -42]] as A2, paintDnR: [[26, -6], [44, -20]] as A2, tapR: [[26, 8], [46, 24]] as A2,
  knockUpR: [[24, -20], [36, -50]] as A2, knockDnR: [[30, 8], [52, 26]] as A2, offerR: [[28, 6], [50, -2]] as A2, offerL: [[-28, 6], [-50, -2]] as A2,
  handInR: [[28, 16], [44, 30]] as A2, holdUpR: [[24, -10], [34, -34]] as A2, wagR: [[26, -12], [44, -34]] as A2,
};
const LANTERN = (p: V3, facing: number, k = 1): Record<string, number> => ({ lamp1: k, l1x: p[0] - 0.12 * facing, l1y: p[1] + 0.72, l1z: p[2] + 0.12 });

// ================================================= SCENE 1 (0-501) DUSK: hook, "You see,", the valve, the bet, "Ice keeps 'em warm."
const E1H: V3 = [-0.95, 0, -2.2], E1V: V3 = [-1.05, 0, 2.6],   // E1V: beside the valve wheel (wheel 0.45 m to his -x)
  D1P: V3 = [2.55, 0, 1.15], D1F: V3 = [0.48, 0, 0.62];
const HOSE_T: V3 = [-1.72, 2.0, -3.18];
const ORANGE_K = (f: number, pos: V3, look: V3, fov = 38): CK => CKf(f, pos, look, fov);
const OR_CLOSE = ORANGE_K(0, [-1.16, 1.98, -2.62], [-1.62, 1.86, -3.32], 36);   // the hero orange (shots 6, 7 start, 17)
SHOT_CAMS[1] = (s) => {
  // shot 1 (0-96): Earl hosing his tree (right third, eyes 40%), 0.93-2.27 s glide past his shoulder to the oranges; hold
  const A0 = CKf(0, [-0.1, 1.15, 0.6], [-1.195, 1.052, -2.139], 46);
  const A1 = CKf(68, [-0.56, 2.12, -2.15], [-1.612, 1.791, -3.312], 40);   // 1.6 m off the iced hero orange (the macro's angle), the jet landing top left
  // shot 2 (96-236): one calm crane up and over the fence (horizon in the top fifth), landing on Duane lighting his pots
  const B1 = CKf(150, [-0.5, 2.6, -0.2], [2.647, 1.359, 0.986], 50);
  const B2 = CKf(188, [0.55, 1.45, 4.3], [2.453, 0.983, 1.104], 46);
  const cA1 = COMP(A1, 0, 0.0007), cB1 = COMP(B1, 0, 0.0007), cB2 = COMP(B2, 0, 0.0007);
  const p1 = spline([A0, HOLD(A0, 27), cA1, HOLD(cA1, 96), cB1, cB2, HOLD(cB2, 236)]);
  // shot 3 (236-276): whip to Earl heaving the valve wheel (whole body), the sprinklers burst on behind him (262)
  const C3 = CKf(244, [0.0, 1.28, 5.9], [-1.116, 0.992, 2.619], 48);   // whole body, the wheel left of him
  const c3 = F(() => C3, 244, 0.0016);
  // shot 4 (276-406): Duane big front-left laughing, Earl at the valve back-right across the fence; glide on "crate"
  const D4 = CKf(284, [1.3, 1.33, -2.0], [0.281, 1.066, 0.555], 46), D4b = CKf(360, [1.2, 1.32, -1.7], [0.302, 1.103, 0.563], 44);
  const cD4b = COMP(D4b, 284, 0.0012), d4 = spline([D4, HOLD(D4, 345), cD4b, HOLD(cD4b, 406)]);
  // shot 5 (406-454): Earl CU from his side (the fire pots behind): "Ice keeps 'em warm."
  const E5 = CKf(414, [-2.6, 1.3, 1.0], [-1.014, 1.12, 2.565], 44);
  // shot 6 (454-501): whip round on his look and push into the hero orange
  const F6 = OR_CLOSE;
  return [K(0, F((f) => p1(f), 0, 0.0007), 24, true),
    K(236, swing((f) => F((g) => p1(g), 0, 0.0007)(f), 236, c3, 244, 0.35), 1),
    K(276, swing(c3, 276, (f) => F((g) => d4(g), 284, 0.0012)(f), 286, 0.45), 1),
    K(406, swing((f) => F((g) => d4(g), 284, 0.0012)(f), 406, F(() => E5, 414, 0.0022), 414, 0.4), 1),
    K(454, swing(F(() => E5, 414, 0.0022), 454, F(() => F6, 466, 0.0022), 466, 0.25), 1)];
};
SHOT_ACTS[1] = (f, s) => {
  const ice = f < 96 ? lerp(0.35, 0.72, sm(f, 0, 90)) : lerp(0.72, 0.82, sm(f, 262, 500));
  const potsN = f < 182 ? 0 : 1 + 4 * lin(f, 205, 300) + 15 * lin(f, 300, 420);
  // Earl: hook at the tree (hose), then at the valve
  const atValve = f >= 236;
  const fT = toward(1, s, f, E1H, HOSE_T), fWheel = toward(1, s, f, E1V, [-1.5, 0, 2.6]), fDuane = toward(1, s, f, E1V, D1F), fTree = toward(1, s, f, E1V, [-1.6, 0, -1.5]);
  const sweep = Math.sin(f * 0.07) * 4;
  const earl: P = !atValve ? flow(f, [
    [0, { expr: "neutral", facing: fT, armL: [[-26, -6 + sweep], [-52, -16 + sweep]] as A2, armLFront: true, propL: "hose", armR: AR.hipR, tilt: -3 }],
    [40, { expr: "neutral", facing: fT, armL: [[-26, -10 + sweep], [-50, -26 + sweep]] as A2, armLFront: true, propL: "hose", armR: AR.hipR, tilt: -2, headTilt: 3 }, 10],
    [70, { expr: "bored", facing: fT, armL: [[-26, -4], [-52, -12]] as A2, armLFront: true, propL: "hose", armR: AR.hipR, tilt: -3 }, 10],
  ]) as P : flow(f, [
    [236, { expr: "neutral", facing: fWheel, armL: [[-28, 2], [-50, 8]] as A2, armR: [[-24, 6], [-46, 12]] as A2, armRFront: true, armLFront: true, mode: "brace", braceK: 0.2 }],
    [244, { expr: "strain", facing: fWheel, armL: [[-28, -6], [-46, -16]] as A2, armR: [[-24, 0], [-42, -8]] as A2, armRFront: true, armLFront: true, mode: "brace", braceK: 1, tilt: 6 }, 6],   // heave
    [256, { expr: "determined", facing: fWheel, armL: [[-28, 8], [-48, 18]] as A2, armR: [[-24, 12], [-44, 22]] as A2, armRFront: true, armLFront: true, mode: "brace", braceK: 0.6, tilt: -4 }, 5], // wheel turned
    [270, { expr: "neutral", facing: fWheel, armL: [[-28, 2], [-50, 8]] as A2, armLFront: true, mode: "brace", braceK: 0 }, 10],
    [300, { expr: "bored", facing: fDuane, armR: [[26, 14], [12, 26]] as A2, armL: AR.hipL, mode: "brace", braceK: 0 }, 10],          // listening to the laugh
    [360, { expr: "bored", facing: fDuane, armR: [[26, 14], [12, 26]] as A2, armL: AR.hipL, headTilt: -4, mode: "brace", braceK: 0 }, 10],
    [408, { expr: "neutral", facing: fTree, armR: AR.shrugR, armL: AR.shrugL, headTilt: 5, mode: "brace", braceK: 0 }, 8],             // "shrugs"
    [426, { expr: "smug", facing: fTree, armR: [[26, -8], [6, -40]] as A2, armL: AR.hipL, headTilt: 3, mode: "brace", braceK: 0 }, 8],   // thumb at his tree: "Ice keeps 'em warm."
    [452, { expr: "bored", facing: fTree, armR: [[26, 14], [12, 26]] as A2, armL: AR.hipL, mode: "brace", braceK: 0 }, 10],
  ]) as P;
  // Duane: lights the fire pots with a drip torch, then at the fence: laughs, gloats, slaps the bet crate
  const atFence = f >= 244;
  const dPos: V3 = !atFence ? D1P : f < 280 ? lerp3(D1P, D1F, sm(f, 244, 280)) : D1F;
  const fPot = toward(1, s, f, D1P, [2.0, 0, 0.4]), fE = toward(1, s, f, D1F, E1V);   // the bet crate is on the top rail by him
  const duane: P = !atFence ? flow(f, [
    [96, { expr: "smug", facing: fPot, armR: AG.torchR, armRFront: true, propR: "dripTorch", tilt: 4 }],
    [176, { expr: "smug", facing: fPot, armR: [[28, 10], [44, 34]] as A2, armRFront: true, propR: "dripTorch", tilt: 10 }, 8],   // tips the torch into the pot
    [186, { expr: "proud", facing: fPot, armR: AG.torchR, armRFront: true, propR: "dripTorch", tilt: 2 }, 6],                   // whoomp: it lights
    [214, { expr: "smug", facing: -fPot, armR: AG.torchR, armRFront: true, propR: "dripTorch", armL: AR.hipL }, 10],
  ]) as P : flow(f, [
    [244, { expr: "tache", facing: fE, armL: AR.hipL, armR: AR.hipR, mode: "walk", phase: (f - 244) / 9 }],
    [284, { ...laughP(f, 284, 0), facing: fE, armL: AR.hipL, armR: [[26, 6], [40, 14]] as A2, mode: "stand" }, 4],               // "laughs"
    [300, { expr: "tacheUp", facing: fE, armR: [[28, -6], [56, -12]] as A2, armRFront: true, armL: AR.hipL, headBack: 0.3 }, 5],   // "He's making popsicles!"
    [338, { expr: "scheme", facing: fE, armR: AG.slapUpR, armRFront: true, armL: AR.hipL }, 6],
    [352, { expr: "scheme", facing: fE, armR: AG.slapDownR, armRFront: true, armL: AR.hipL, tilt: 4 }, 3],                       // slap on the crate: "crate"
    [372, { expr: "tacheUp", facing: fE, armR: [[24, 10], [44, 8]] as A2, armRFront: true, armL: AR.hipL, headTilt: -3 }, 8],      // "dead by morning"
    [430, { expr: "tache", facing: fE, armR: AR.hipR, armL: AR.hipL }, 10],
  ]) as P;
  const laughing = f >= 284 && f < 300;
  const hands = [C("hand1", [6.2, 0, 3.3], flow(f, [[96, { expr: "neutral", facing: 1, armR: AG.torchR, armRFront: true, propR: "dripTorch" }], [200, { expr: "neutral", facing: 1, armR: [[28, 10], [44, 34]] as A2, armRFront: true, propR: "dripTorch", tilt: 8 }, 8], [214, { expr: "neutral", facing: -1, armR: AG.torchR, armRFront: true, propR: "dripTorch" }, 10]]), { idx: 11 }),
    C("hand2", [7.4, 0, -2.6], flow(f, [[96, { expr: "neutral", facing: -1, armR: AG.torchR, armRFront: true, propR: "dripTorch" }], [222, { expr: "neutral", facing: -1, armR: [[28, 10], [44, 34]] as A2, armRFront: true, propR: "dripTorch", tilt: 8 }, 8], [236, { expr: "neutral", facing: 1, armR: AG.torchR, armRFront: true, propR: "dripTorch" }, 10]]), { idx: 12 })];
  const hose = f < 100 ? 1 : 0;
  return {
    ctl: { ice, frost: lerp(0.12, 0.42, lin(f, 0, 500)), spray: sm(f, 256, 266), valve: sm(f, 244, 262), pots: 1, potsN, house: 1, shedLamp: 1, etemp: 33, temp: 31, crate: 1,
      hose, ...nozzle(E1H, HOSE_T, 1, s, f), tx: HOSE_T[0], ty: HOSE_T[1], tz: HOSE_T[2], drops: f >= 454 ? 1 : 0, glint: (f >= 40 && f < 110) || f >= 456 ? 0.2 : 1 },
    cast: [
      C("earl", atValve ? E1V : E1H, speak(f, 425, 452, earl), { idx: 1 }),
      C("duane", dPos, speak(f, 299, 333, laughing ? { ...duane, mouth: undefined } : duane), { idx: 2 }),
      ...hands,
    ],
    focus: f < 28 ? head(E1H) : f < 96 ? HOSE_T : f < 236 ? head(D1P) : f < 276 ? head(E1V) : f < 406 ? head(D1F) : f < 454 ? head(E1V) : GROVE.HERO_ORANGE,
    subj: f < 28 ? "earl" : f < 96 ? null : f < 236 ? "duane" : f < 276 ? "earl" : f < 406 ? "duane" : f < 454 ? "earl" : null,
  };
};

// ================================================= SCENE 2 (502-621) BY NINE: the glazed leaves, the farmhands laugh
const E2: V3 = [-2.0, 0.5, 3.75], H2: V3[] = [[0.45, 0, 3.2], [0.5, 0, 4.25], [1.55, 0, 3.45]];   // farmhands lean on the fence (Duane's side)
SHOT_CAMS[2] = () => {
  // one calm 4 s move: from the glazed orange, pull back and turn along the fence to the farmhands and Earl on his crate
  const A = HOLD(OR_CLOSE, 502), A2 = CKf(530, [-1.0, 2.05, -2.15], [-1.7, 1.9, -3.2], 42);
  const B = CKf(596, [-4.5, 1.38, 5.0], [-0.66, 0.91, 3.63], 48);   // Earl on his crate left, the farmhands across the fence right
  const sw = (f: number) => { const x: Shot = f < 530 ? spline([A, A2])(f) : swing(() => A2, 530, () => B, 596, 0.25)(f); return { pos: x.pos, look: x.look, fov: x.fov ?? 40 }; };
  return [K(502, F((f) => sw(f), 596, 0.0012), 24, true)];
};
SHOT_ACTS[2] = (f, s) => {
  const fE = toward(2, s, f, E2, H2[0]), sip = f > 545 && f < 575;
  const earl = flow(f, [
    [502, { expr: "bored", mode: "sit", facing: fE, armR: AG.cupR, armRFront: true, propR: "steamCup", armL: AR.hipL }],
    [548, { expr: "calm", mode: "sit", facing: fE, armR: AG.sipR, armRFront: true, propR: "steamCup", armL: AR.hipL, headTilt: -4 }, 10],   // sips
    [576, { expr: "bored", mode: "sit", facing: fE, armR: AG.cupR, armRFront: true, propR: "steamCup", armL: AR.hipL }, 10],
  ]);
  void sip;
  const laugh = (i: number, extra: P = {}): P => (f >= 562 ? { ...laughP(f, 562, i), facing: toward(2, s, f, H2[i], E2), ...extra } : { expr: "mock", facing: toward(2, s, f, H2[i], E2), ...extra });
  return {
    ctl: { ice: lerp(0.82, 0.92, lin(f, 502, 620)), frost: 0.55, spray: 1, pots: 1, potsN: 99, house: 1, shedLamp: 1, crate: 1, ...LANTERN([E2[0] + 0.3, 0, E2[2] - 0.1], 1, 1), l1y: 0.95, drops: f < 530 ? 1 : 0, glint: f < 545 ? 0.2 : 1 },
    cast: [
      C("earl", E2, earl, { idx: 1 }),
      C("hand1", H2[0], pose(null, laugh(0, { armR: [[28, -6], [56, -12]] as A2, armRFront: true })), { idx: 11 }),
      C("hand2", H2[1], pose(null, laugh(1, { armR: [[30, 10], [44, 24]] as A2, armRFront: true })), { idx: 12 }),        // slaps his knee
      C("hand3", H2[2], pose(null, laugh(2, { armR: AR.hipR, armL: AR.hipL })), { idx: 13 }),
    ],
    focus: f < 540 ? GROVE.HERO_ORANGE : head(E2, 0.85), subj: f < 560 ? null : "earl",
  };
};

// ================================================= SCENE 3 (622-748) BY MIDNIGHT: glass balls, the town at the gate
const T3: V3[] = [[-2.05, 0, 15.3], [-3.3, 0, 15.5], [-2.6, 0, 14.85], [-4.5, 0, 16.2]];   // ftown1, ftown2, the kid (ftown3), ftown4
SHOT_CAMS[3] = () => {
  // hard cut on "midnight": glide along the iced crown of the gate tree, then carry round through the gate to the town
  const A = CKf(622, [-0.45, 2.5, -1.3], [-2.2, 2.3, -3.7], 46), A2 = CKf(684, [-0.3, 2.35, -2.9], [-2.25, 2.2, -4.6], 46);   // glide along the moonlit face of the iced hero tree (46 glass-ball oranges)
  const B = CKf(704, [-1.0, 1.38, 10.4], [-2.688, 0.813, 14.803], 50);   // the whip path clears the gate tree's crown
  const sw = (f: number) => { const x: Shot = f < 684 ? spline([A, A2])(f) : swing(() => A2, 684, () => B, 704, 1.2)(f); return { pos: x.pos, look: x.look, fov: x.fov ?? 40 }; };
  return [K(622, F((f) => sw(f), 704, 0.0014), 24, true)];
};
SHOT_ACTS[3] = (f, s) => {
  const AT: V3 = [-2.4, 0, 12.0];   // they laugh at the grove (Earl, off screen)
  const lt = (i: number, extra: P = {}): P => (f >= 699 ? { ...laughP(f, 699, i), facing: toward(3, s, f, T3[i], AT), ...extra } : { expr: "grin", facing: toward(3, s, f, T3[i], AT), ...extra });
  // the kid lifts the POPSICLE EARL board over his head on "calls him" (704-716) and bobs it
  const up = sm(f, 700, 716), bob = 0.03 * Math.sin((f - 700) * 0.35) * up, K3 = T3[2];
  const kid = pose(null, { expr: f >= 716 ? "laugh" : "grin", facing: toward(3, s, f, K3, AT), armR: [[lerp(24, 26, up), lerp(16, -55, up)], [lerp(22, 30, up), lerp(30, -105, up)]] as A2, armL: [[lerp(-24, -26, up), lerp(16, -55, up)], [lerp(-22, -30, up), lerp(30, -105, up)]] as A2, armRFront: true, armLFront: true });
  return {
    ctl: { ice: 1, frost: 0.7, spray: 1, pots: 1, potsN: 99, house: 1, truck: 1, moon: 1, stars: 1, sign: 1, glint: 1.2,
      sgOn: 1, sgx: K3[0], sgy: lerp(0.75, 1.62, up) + bob, sgz: K3[2] - 0.1, sgYaw: -0.33, sgRoll: 0.04 * Math.sin((f - 700) * 0.21) * up },
    cast: [
      C("ftown1", T3[0], pose(null, lt(0, { armR: [[28, -6], [56, -12]] as A2, armRFront: true })), { idx: 21 }),   // points at the grove
      C("ftown2", T3[1], pose(null, lt(1, { armR: [[24, 10], [16, -4]] as A2 })), { idx: 22 }),
      C("ftown3", K3, kid, { idx: 23 }),
      C("ftown4", T3[3], pose(null, lt(3, { armL: AG.lanternL, propL: "lantern" })), { idx: 24 }),
    ],
    focus: f < 690 ? [-1.9, 2.25, -3.2] : head(T3[2], 0.99), subj: f < 690 ? null : "ftown3",
  };
};

// ================================================= SCENE 4 (749-883) 3 A.M.: the bough snaps; "Told ya, popsicles!"
const E4: V3 = [-1.25, 0, -1.25], E4b: V3 = [-1.65, 0, -0.5], D4: V3 = [0.82, 0, -0.85];
const snapU = (f: number) => f < 773 ? 0 : f < 790 ? 0.15 * lin(f, 773, 790) : f < 806 ? lerp(0.15, 0.62, lin(f, 790, 806)) : lerp(0.62, 1, lin(f, 806, 846));
SHOT_CAMS[4] = (s) => {
  const A = CKf(749, [-1.0, 0.9, 1.75], [-1.56, 1.06, -0.89], 58);   // low, Earl right under the iced bough (tip top right)
  const B = CKf(830, [1.75, 1.0, -2.45], [0.806, 1.127, -0.826], 50);  // Duane low-angle CU
  void s;
  return [K(749, F(() => A, 749, 0.0018, [[806, 0.006, 14]]), 24, true), K(822, swing(F(() => A, 749, 0.0018, [[806, 0.006, 14]]), 822, F(() => B, 830, 0.0024, [[864, 0.007, 12]]), 830, 0.7), 1)];
};
KICKS.push([806 / 30, 0.45]);
SHOT_ACTS[4] = (f, s) => {
  const ePos: V3 = f < 796 ? E4 : lerp3(E4, E4b, sm(f, 796, 812));
  const fUp = toward(4, s, f, E4, [-1.2, 0, -1.6]), fD = toward(4, s, f, D4, [-1.0, 0, -1.2]);
  const earl = flow(f, [
    [749, { expr: "neutral", facing: fUp, armL: AG.lanternUpL, armLFront: true, propL: "lantern", armR: AR.hipR, headBack: 0.4 }],
    [780, { expr: "neutral", facing: fUp, armL: AG.lanternUpL, armLFront: true, propL: "lantern", armR: AR.hipR, headBack: 0.6, sweat: 1 }, 8],   // creak: he looks up
    [796, { expr: "neutral", facing: -fUp, armL: AG.lanternL, armLFront: true, propL: "lantern", armR: [[26, -10], [40, -30]] as A2, mode: "walk", phase: (f - 796) / 8, sweat: 1 }, 4], // steps back
    [812, { expr: "bored", facing: fUp, armL: AG.lanternL, armLFront: true, propL: "lantern", armR: AR.hipR, sweat: 0.6 }, 6],
  ]);
  const duane = flow(f, [
    [800, { expr: "tache", facing: fD, armL: AG.lanternL, armLFront: true, propL: "lantern", armR: AR.hipR }],
    [826, { expr: "tacheUp", facing: fD, armL: AG.lanternL, armLFront: true, propL: "lantern", armR: [[28, -6], [56, -12]] as A2, armRFront: true }, 5],
    [850, { expr: "tacheUp", facing: fD, armL: AG.lanternUpL, armLFront: true, propL: "lantern", armR: [[28, -12], [58, -24]] as A2, armRFront: true, headBack: 0.25 }, 4],
  ]);
  const shout = f >= 849 ? speak(f, 849, 886, { ...duane, mouth: undefined } as P) : duane;
  return {
    ctl: { ice: 1, frost: 0.85, spray: 1, pots: 0.75, potsN: 99, house: 1, snap: snapU(f), ...LANTERN(ePos, 1, 1), lamp2: f >= 815 ? 1 : 0, l2x: D4[0] + 0.15, l2y: 0.72, l2z: D4[2] + 0.1, glint: 1 },
    cast: [C("earl", ePos, earl, { idx: 1 }), ...(f >= 815 ? [C("duane", D4, shout as FigOpts, { idx: 2 })] : [])],
    focus: f < 822 ? head(ePos) : head(D4), subj: f < 822 ? "earl" : "duane",
  };
};

// ================================================= SCENE 5 (884-968) THE SCARECROW at the back door
const SC5: V3 = [-7.98, 0.4, 10.0], J5: V3 = [-8.42, 0.62, 9.42];   // the scarecrow on the top step (hinge side), June in the opening
const DOOR5 = CKf(896, [-5.75, 1.6, 7.0], [-8.236, 1.641, 9.818], 50);   // clear of the gate tree's crown
SHOT_CAMS[5] = (s) => {
  const end4 = (f: number) => camAt(4, s, Math.min(f, 883));
  return [K(884, swing(end4, 883, F(() => DOOR5, 896, 0.0022, [[905, 0.005, 12]]), 896, 3.4), 1, true)];
};
SHOT_ACTS[5] = (f, s) => {
  const fDoor = toward(5, s, f, SC5, J5), fOut = toward(5, s, f, J5, SC5);
  const knock = f < 905 ? Math.sin((f - 884) * 0.75) : 0;
  const scare = flow(f, [
    [884, { expr: "worry", facing: fDoor, armR: [[26, -8 + 10 * knock], [46, -20 + 14 * knock]] as A2, armRFront: true, sweat: 1, tilt: 3 * knock }],
    [905, { expr: "worry", facing: fDoor, armR: AG.crossR, armL: AG.crossL, armRFront: true, armLFront: true, shake: 0.7, phase: (f - 905) / 4, sweat: 1 }, 6],  // shivers
    [940, { expr: "worry", facing: fDoor, armR: [[24, 4], [40, -12]] as A2, armRFront: true, armL: AG.crossL, shake: 0.5, phase: (f - 905) / 4, sweat: 1, headTilt: 6 }, 8], // "asks to come in"
  ]);
  const june = flow(f, [
    [898, { expr: "neutral", facing: fOut, armR: [[24, 4], [34, -10]] as A2, armRFront: true }],
    [905, { expr: "shock", facing: fOut, armR: [[24, -10], [12, -36]] as A2, armRFront: true, sweat: 1 }, 4],
    [935, { expr: "worry", facing: fOut, armR: [[24, 4], [34, -10]] as A2, armRFront: true }, 10],
  ]);
  return {
    ctl: { ice: 1, frost: 0.9, spray: 1, pots: 0.6, house: 1, door: sm(f, 898, 908), glint: 1 },
    cast: [C("scarecrow", SC5, scare, { idx: 31 }), ...(f >= 899 ? [C("june", J5, june, { idx: 32 })] : [])],
    fx: fxs(f >= 905 && f < 960 ? [0, 1].map((i) => ({ kind: "card" as const, key: "breath" + (Math.floor((f + i * 9) / 4) % 4), pos: [SC5[0] - 0.12, SC5[1] + 1.5 + 0.06 * (((f + i * 9) % 18) / 18), SC5[2] - 0.2] as V3, w: 0.22, h: 0.16, soft: true,
      draw: (p: Pen) => { const g = p.g; g.fillStyle = "rgba(235,245,255,0.55)"; g.beginPath(); g.ellipse(64, 50, 40 + ((f + i * 9) % 18), 26, 0, 0, 6.3); g.fill(); } })) : null),
    focus: [SC5[0], SC5[1] + 1.38, SC5[2]], subj: "scarecrow",
  };
};

// ================================================= SCENE 6 (969-1109) DUANE'S THERMOMETER: 24, the pots gutter, frost
const D6: V3 = [0.72, 0, -3.12];
SHOT_CAMS[6] = () => {
  const A = CKf(969, [0.68, 1.16, -2.46], [0.13, 1.15, -2.5], 40);   // square-on to the plate
  const B = CKf(1080, [1.85, 1.42, -0.75], [0.657, 1.077, -3.079], 46);
  const p = spline([A, HOLD(A, 1012), B]);
  return [K(969, F((f) => p(f), 1080, 0.0012), 24, true)];
};
SHOT_ACTS[6] = (f, s) => {
  const fT = toward(6, s, f, D6, [0.13, 0, -2.5]);
  const duane = flow(f, [
    [969, { expr: "tache", facing: fT, armL: AG.lanternL, armLFront: true, propL: "lantern", armR: AR.hipR, headTilt: 4 }],
    [1018, { expr: "shock", facing: fT, armL: AG.lanternL, armLFront: true, propL: "lantern", armR: [[22, -10], [12, -36]] as A2, armRFront: true, sweat: 1 }, 4],   // sees 24
    [1050, { expr: "worry", facing: -fT, armL: AG.lanternUpL, armLFront: true, propL: "lantern", armR: AR.hipR, sweat: 1, headTilt: -4 }, 10],  // turns to his frosting trees
    [1090, { expr: "worry", facing: -fT, armL: AG.lanternUpL, armLFront: true, propL: "lantern", armR: [[24, 4], [14, -24]] as A2, sweat: 1 }, 10],
  ]);
  return {
    ctl: { ice: 1, frost: 0.92, spray: 1, crate: 1, pots: 1, potsN: 99, potsOut: lerp(0, 4, lin(f, 1030, 1095)), dFrost: lerp(0.15, 0.85, lin(f, 1016, 1100)), temp: lerp(27, 24, sm(f, 975, 1000)), lamp2: 1, l2x: D6[0] + 0.15, l2y: 0.72, l2z: D6[2] + 0.1, glint: 1 },
    cast: [C("duane", D6, duane, { idx: 2 })],
    focus: f < 1015 ? GROVE.DTHERMO : head(D6), subj: f < 1015 ? null : "duane",
  };
};

// ================================================= SCENE 7 (1110-1433) THE TRICK: the water stays on; drops freeze; 32
const E7: V3 = [-0.6, 0, -2.15];
const MAC_O = CKf(1290, [-1.2, 1.96, -2.86], [-1.62, 1.86, -3.32], 34), MAC_T = CKf(1378, [-1.02, 1.66, -3.36], [-1.5, 1.6, -3.78], 34);
SHOT_CAMS[7] = (s) => {
  const end6 = (f: number) => camAt(6, s, Math.min(f, 1109));
  const A = CKf(1124, [0.25, 1.35, 0.0], [-0.619, 1.104, -2.138], 46);
  const B = CKf(1236, [-1.12, 1.94, -2.52], [-1.58, 1.76, -3.5], 40);
  const p = spline([A, HOLD(A, 1162), B, HOLD(B, 1257), MAC_O, HOLD(MAC_O, 1360), MAC_T, HOLD(MAC_T, 1412), { ...MAC_O, f: 1433, fov: 40 }]);
  return [K(1110, swing(end6, 1109, F((f) => p(f), 1124, 0.0010), 1124, 0.6), 1, true)];
};
SHOT_ACTS[7] = (f, s) => {
  const fT = toward(7, s, f, E7, HOSE_T), sweep = Math.sin(f * 0.07) * 3;
  const earl = flow(f, [
    [1110, { expr: "neutral", facing: fT, armL: [[-26, -10 + sweep], [-50, -26 + sweep]] as A2, armLFront: true, propL: "hose", armR: [[22, 18], [30, 34]] as A2, propR: "lantern" }],
    [1150, { expr: "smug", facing: fT, armL: [[-26, -10 + sweep], [-50, -26 + sweep]] as A2, armLFront: true, propL: "hose", armR: [[24, -2], [36, -22]] as A2, armRFront: true, propR: "lantern", headTilt: 3 }, 10], // "off"
  ]);
  return {
    ctl: { ice: 1, frost: 0.92, spray: 1, pots: 0.3, potsOut: 4, dFrost: 0.85, hose: f < 1250 ? 1 : 0, ...nozzle(E7, HOSE_T, 7, s, f), tx: HOSE_T[0], ty: HOSE_T[1], tz: HOSE_T[2],
      drops: f >= 1180 ? 1 : 0, heat: f < 1214 ? 0 : sm(f, 1214, 1243) * (f > 1400 ? 1 - sm(f, 1400, 1430) * 0.5 : 1), etemp: 32, ...LANTERN(E7, -1, 1), glint: f > 1180 ? 0.2 : 1 },
    cast: [C("earl", E7, earl, { idx: 1 })],
    focus: f < 1162 ? head(E7) : f < 1360 ? GROVE.HERO_ORANGE : f < 1412 ? GROVE.ETHERMO : GROVE.HERO_ORANGE, subj: f < 1162 ? "earl" : null,
  };
};

// ================================================= SCENE 8 (1434-1565) THE CELLAR: the tub freezes, the jars don't
const J8: V3 = [0.25, 0, -0.62], J8s: V3 = [-0.3, 0, -1.3], J8x: V3 = [2.4, 0, 1.4];   // June behind the tub, the jar shelf behind her
SHOT_CAMS[8] = () => {
  const A = CKf(1434, [0.02, 2.24, 0.14], [0, 0.27, 0.1], 40);
  const B = CKf(1490, [0.15, 1.65, 1.95], [0.116, 0.915, -0.573], 50);
  const C2 = CKf(1556, [-0.4, 1.22, -1.08], [-0.22, 1.12, -1.86], 36);
  const p = spline([A, HOLD(A, 1446), B, HOLD(B, 1522), C2]);
  return [K(1434, F((f) => p(f), 1490, 0.0012), 24, true)];
};
SHOT_ACTS[8] = (f, s) => {
  const walk1 = walkPath(8, s, [J8, [-0.05, 0, -1.0], J8s], f, 1524, 1538), walk2 = walkPath(8, s, [J8s, [1.1, 0, -0.9], J8x], f, 1540, 1560);
  const pos: V3 = f < 1524 ? J8 : f < 1540 ? walk1.p : walk2.p;
  const fTub = toward(8, s, f, J8, [0, 0, 0.1]);
  const june = f < 1524 ? flow(f, [
    [1434, { expr: "smile_closed", facing: fTub, armR: [[24, 10], [36, 0]] as A2, armRFront: true, propR: "ladle" }],
    [1496, { expr: "neutral", facing: fTub, armR: [[24, -18], [36, -40]] as A2, armRFront: true, propR: "ladle", tilt: -3 }, 6],   // wind-up
    [1505, { expr: "smile_closed", facing: fTub, armR: [[26, 14], [44, 34]] as A2, armRFront: true, propR: "ladle", tilt: 6 }, 2],  // tap! "the tub freezes"
    [1514, { expr: "smile_closed", facing: fTub, armR: [[24, 10], [36, 0]] as A2, armRFront: true, propR: "ladle" }, 8],
  ]) : pose(null, { expr: "smile_closed", mode: f < 1538 || (f > 1540 && f < 1560) ? "walk" : "stand", phase: f < 1540 ? walk1.phase : walk2.phase, facing: f < 1540 ? walk1.facing : walk2.facing,
    armR: f >= 1538 ? [[24, 10], [34, 0]] as A2 : [[24, 10], [36, 0]] as A2, armRFront: true, propR: f >= 1538 ? "jar" : "ladle" });
  return {
    ctl: { tubIce: lerp(0.15, 1, sm(f, 1440, 1512)), wallFrost: lerp(0.1, 0.9, lin(f, 1440, 1540)), jarOut: f >= 1538 ? 1 : 0, hatch: 0.55 },   // cold moonlight down the stairs: a cool fill against the lamp
    cast: f < 1561 ? [C("june", pos, june, { idx: 32 })] : [],
    fx: fxs(f >= 1505 && f < 1516 ? clang("tap", [0.12, 0.33, 0.25], f - 1505, 0.25) : null),
    focus: f < 1450 ? [0, 0.27, 0.1] : f < 1522 ? head(J8) : [-0.22, 1.12, -1.86], subj: f < 1450 || f > 1540 ? null : "june",
  };
};

// ================================================= SCENE 9 (1566-1685) SUNRISE: the ice slides off; full of juice
const E9: V3 = [-0.85, 0, -1.95];
SHOT_CAMS[9] = () => {
  const A = CKf(1566, [-0.6, 7.6, 9.5], [-3.0, 3.6, -6.0], 52);
  const B = CKf(1630, [-0.5, 3.3, 2.6], [-2.2, 2.0, -3.5], 50);
  const C2 = CKf(1662, [-0.45, 1.42, 0.65], [-0.848, 1.077, -1.94], 46);   // Earl's side of the fence (no post across him)
  const p = spline([A, B, C2]);
  return [K(1566, F((f) => p(f), 1662, 0.0016), 24, true)];
};
SHOT_ACTS[9] = (f, s) => {
  const fC = toward(9, s, f, E9, [0, 0, 0]);
  const earl = flow(f, [
    [1566, { expr: "calm", facing: -fC, armR: [[26, -12], [40, -36]] as A2, armRFront: true, propR: "orange" }],
    [1630, { expr: "smug", facing: fC, armR: [[26, -12], [40, -36]] as A2, armRFront: true, propR: "orangeHalf", armL: [[-24, 14], [-30, 2]] as A2, armLFront: true, propL: "juiceGlass" }, 10],
    [1652, { expr: "smug", facing: fC, armR: [[24, -18], [30, -38]] as A2, armRFront: true, propR: "orangeHalf", armL: [[-24, 14], [-30, 2]] as A2, armLFront: true, propL: "juiceGlass", tilt: -3 }, 6],   // squeeze: "full of juice"
  ]);
  const jx = E9[0] + 0.02, juice = f >= 1656 ? [0, 1, 2, 3].map((i) => ({ kind: "card" as const, key: "juice" + (Math.floor(f / 3 + i) % 3), pos: [jx + 0.05, 1.18 - i * 0.07, E9[2] + 0.12] as V3, w: 0.05, h: 0.08,
    draw: (p: Pen) => { const g = p.g; g.fillStyle = "#ffb43a"; g.strokeStyle = INKC; g.lineWidth = 4; g.beginPath(); g.ellipse(64, 64, 22, 34, 0, 0, 6.3); g.fill(); g.stroke(); } })) : [];
  return {
    ctl: { ice: 1, melt: sm(f, 1588, 1650), juice: sm(f, 1600, 1660), frost: lerp(0.6, 0.15, lin(f, 1566, 1680)), dFrost: 0.9, spray: 1 - sm(f, 1570, 1600), pots: 0, glint: 1.3 },
    cast: [C("earl", E9, earl, { idx: 1 })],
    fx: juice,
    focus: f < 1630 ? GROVE.HERO : head(E9), subj: f < 1630 ? null : "earl",
  };
};

// ================================================= SCENE 10 (1686-1923) THE BET: "it doesn't count", frozen solid
const D10: V3 = [0.6, 0, 0.62], E10: V3 = [-0.45, 0, 1.45];
SHOT_CAMS[10] = (s) => {
  const end9 = (f: number) => camAt(9, s, Math.min(f, 1685));
  const A = CKf(1694, [-1.7, 1.36, 1.3], [0.595, 1.106, 0.621], 44);               // Duane over the fence, between two posts (top rail at his chest)
  const B = CKf(1750, [-0.5, 1.38, 5.5], [0.07, 0.94, 1.04], 48);                  // the two-shot along the fence: Earl left, Duane right
  const C2 = CKf(1820, [-1.0, 1.36, 4.1], [-0.199, 1.069, 1.507], 46), C3 = CKf(1900, [-1.0, 1.36, 3.78], [-0.24, 1.1, 1.507], 46);   // Earl left, Duane right, the crate at Earl's feet: the clonk on the rail
  const R10 = 0.0011, cB = COMP(B, 1694, R10), cC2 = COMP(C2, 1694, R10), cC3 = COMP(C3, 1694, R10);
  const p = spline([A, HOLD(A, 1742), cB, HOLD(cB, 1810), cC2, cC3]);
  return [K(1686, swing(end9, 1685, F((f) => p(f), 1694, R10, [[1898, 0.006, 14]]), 1694, 0.3), 1, true)];
};
KICKS.push([1898 / 30, 0.25]);
SHOT_ACTS[10] = (f, s) => {
  const fE = toward(10, s, f, D10, E10), fD = toward(10, s, f, E10, D10);
  const duane = flow(f, [
    [1686, { expr: "tache", facing: fE, armR: AR.hipR, armL: AR.hipL }],
    [1692, { expr: "shock", facing: fE, armR: AR.hipR, armL: AR.hipL, sweat: 1 }, 4],                         // sees the juice
    [1712, { expr: "tache", facing: fE, armR: AG.crossR, armL: AG.crossL, armRFront: true, armLFront: true, headTilt: 5 }, 8],   // "doesn't count"
    [1726, { expr: "tache", facing: fE, armR: AG.crossR, armL: AG.crossL, armRFront: true, armLFront: true, headTilt: -5 }, 8],
    [1748, { expr: "tache", facing: fE, armR: AG.wagR, armRFront: true, armL: AR.hipL }, 6],                   // "technically"
    [1760, { expr: "tache", facing: fE, armR: [[26, -12], [48, -30]] as A2, armRFront: true, armL: AR.hipL }, 6],
    [1776, { expr: "tacheUp", facing: fE, armR: AG.wagR, armRFront: true, armL: AR.hipL }, 6],                 // "Earl froze his first"
    [1798, { expr: "dismay", facing: fE, armR: [[24, 4], [40, -10]] as A2, armL: [[-24, 4], [-40, -10]] as A2, armRFront: true, armLFront: true, mode: "brace", braceK: 0.6 }, 6],   // heaves the crate up
    [1812, { expr: "dismay", facing: fE, armR: [[26, -16], [40, -44]] as A2, armL: [[-26, -16], [-40, -44]] as A2, armRFront: true, armLFront: true, mode: "brace", braceK: 0, tilt: 6 }, 5],   // tosses it over the fence
    [1845, { expr: "dismay", facing: fE, armR: AR.hipR, armL: AR.hipL }, 10],
    [1900, { expr: "breakdown", facing: fE, armR: AR.hipR, armL: AR.hipL, sweat: 1 }, 3],                      // his own oranges: rocks
  ]);
  const earl = flow(f, [
    [1686, { expr: "smug", facing: fD, armR: AG.sipR, armRFront: true, propR: "juiceGlass", armL: AR.hipL }],
    [1760, { expr: "smug", facing: fD, armR: AG.sipR, armRFront: true, propR: "juiceGlass", armL: AR.hipL, headTilt: -4 }, 8],
    [1850, { expr: "neutral", facing: fD, armR: [[30, 22], [48, 52]] as A2, armRFront: true, armL: AR.hipL, tilt: 8 }, 8],   // bends to the crate at his feet
    [1862, { expr: "neutral", facing: fD, armR: AG.holdUpR, armRFront: true, propR: "frozenOrange", armL: AR.hipL }, 8],
    [1888, { expr: "bored", facing: fD, armR: [[30, -24], [44, -56]] as A2, armRFront: true, propR: "frozenOrange", armL: AR.hipL, tilt: -3 }, 6],   // wind-up
    [1898, { expr: "bored", facing: fD, armR: [[36, 2], [70, 8]] as A2, armRFront: true, propR: "frozenOrange", armL: AR.hipL, tilt: 6 }, 2],  // CLONK on the crate on "solid"
    [1906, { expr: "bored", facing: fD, armR: [[34, 2], [62, 6]] as A2, armRFront: true, propR: "frozenOrange", armL: AR.hipL, tilt: 3 }, 8],
  ]);
  // Duane heaves his crate up (1800-1812) and tosses it over the fence; it lands at Earl's feet (1830)
  const up = sm(f, 1800, 1812), toss = lin(f, 1812, 1830);
  const crateX = f < 1812 ? GROVE.CRATE_POST[0] : lerp(GROVE.CRATE_POST[0], -0.2, toss), crateZ = f < 1812 ? GROVE.CRATE_POST[2] : lerp(GROVE.CRATE_POST[2], 2.0, toss);
  const crateY = f < 1812 ? 0.7 * up : 0.7 * (1 - toss) + 1.1 * Math.sin(Math.PI * toss) * (1 - 0.3 * toss), crateRot = f < 1812 ? 0 : 0.5 * Math.sin(Math.PI * toss);
  return {
    ctl: { ice: 1, melt: 1, juice: 1, frost: 0.1, dFrost: 0.9, pots: 0, crate: 1, cx: crateX, cy: Math.max(0, crateY), cz: crateZ, crot: crateRot, chip: f >= 1898 ? lin(f, 1898, 1916) : 0, chx: 0.0, chy: 0.99, chz: 1.42 },
    cast: [C("duane", D10, duane, { idx: 2 }), C("earl", E10, earl, { idx: 1 })],
    fx: fxs(f >= 1898 && f < 1909 ? clang("clonk", [-0.02, 1.0, 1.42], f - 1898, 0.42) : null),
    focus: f < 1742 ? head(D10) : f < 1810 ? [0.07, 1.3, 1.04] : head(E10), subj: f < 1742 ? "duane" : "earl",
  };
};

// lens (depth of field): CU / inserts soft behind, mediums gentle, wides almost sharp
lens3([[0, DOF_MS], [40, DOF_INSERT, 20], [100, DOF_WS, 24], [180, DOF_FS, 16], [240, DOF_FS, 8], [280, DOF_MS, 8], [410, DOF_CU, 8], [458, DOF_INSERT, 12],
  [530, DOF_FS, 30], [622, DOF_INSERT, 1], [690, DOF_WS, 16], [749, DOF_FS, 1], [826, DOF_CU, 8], [884, DOF_FS, 10], [969, DOF_INSERT, 1], [1030, DOF_FS, 30],
  [1124, DOF_FS, 14], [1180, DOF_INSERT, 30], [1434, DOF_INSERT, 1], [1460, DOF_FS, 24], [1530, DOF_INSERT, 24], [1566, DOF_WS, 1], [1640, DOF_FS, 20],
  [1694, DOF_CU, 8], [1742, DOF_FS, 14], [1820, DOF_MS, 14]]);
