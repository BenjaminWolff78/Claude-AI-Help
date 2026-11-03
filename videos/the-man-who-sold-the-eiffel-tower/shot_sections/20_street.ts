
// =====================================================================================================================
// PARIS BOULEVARD (street). Carriageway x -8.5..8.5 (y 0), sidewalks raised to y 0.14 (SWK), facades x +-16. The tower
// stands at [0, 0, -420] at the end of the axis (-z). Kiosk + "LA TOUR ROUILLE!" board on the left at z -3..-4.5, the
// Café du Boulon on the right (z -6..9), the police station on the left at z 26..41. Car lane x 4 (c.car: z = 72 - 190u).
// Keep-out: STREET_SOLIDS.
// =====================================================================================================================
const SWK = 0.14;
const carZ = (u: number) => 72 - 190 * u;
const NEWS: V3 = [-10.35, SWK, -2.4], LK: V3 = [-9.45, SWK, -1.1], BOARD: V3 = [-10.55, SWK, -4.55];
const streetExtras = (id: number, s: SetDef, f: number): CastPlace[] => [
  chatter("paris1", [-11.9, SWK, 2.6], f, 0, 1), chatter("paris3", [-11.2, SWK, 3.3], f, 1, -1),
  walker(id, s, "paris2", [-12.6, SWK, 12], [-12.6, SWK, -9], f, 2, "basket", 1.1),
  waiterTray(id, s, "waiter", [15.0, SWK, -1.5], [12.4, SWK, 1.4], f, 3),
  walker(id, s, "paris4", [11.8, SWK, -16], [11.8, SWK, 4], f, 4, "basket", 1.0),
];

// ---- S03 (140-196) "It's Paris, / 1925,"
// From high over the boulevard with the tower at the end of the axis (title #2), the camera cranes down past the plane
// trees to the newsstand, where the newsboy is already waving the paper; a limousine rolls past, a couple chats.
SHOT_CAMS[3] = () => [
  K(140, F((f) => { const k = sm(f, 140, 198); return { pos: lerp3([-2.6, 8.6, 20.5], [-6.3, 1.95, 8.6], k), look: lerp3([0, 8.5, -150], [-10.4, 1.55, -2.2], sm(f, 146, 198)), fov: lerp(40, 42, k) }; }, 140, 0.0004)),
];
const newsboy = (f: number, give = 0): CastPlace => {
  const wave = Math.sin(st(f) * 0.55);
  return C("newsboy", NEWS, pose(null, { expr: "laugh", facing: 1, mouth: MOUTHS[Math.floor(st(f, 4) / 4) % MOUTHS.length], propR: "newspaper",
    armR: give > 0.05 ? [[26, 0], [lerp(30, 54, give), lerp(-30, -6, give)]] as A2 : [[24, -10], [30 + 6 * wave, -46 - 6 * wave]] as A2, armRFront: true, bob: 2 * Math.abs(wave) }), { idx: 5 });
};
SHOT_ACTS[3] = (f, s) => ({
  ctl: { car: lerp(0.262, 0.35, lin(f, 140, 196)) },
  cast: [newsboy(f), C("lustig", LK, pose(null, { expr: "neutral", facing: faceTo(3, s, f, LK, BOARD), headTilt: 3 }), { shadow: true }), ...streetExtras(3, s, f)],
  focus: f < 176 ? undefined : [-10.2, 1.4, -2.0], subj: null,
});
lens(140, 0, 1); lens(176, 6, 20);

// ---- S04 (196-306) "and the newspapers say / the tower is rusting / and costs a fortune / to paint."
// Lustig pays the newsboy (coin), takes the paper and snaps it open under the LA TOUR ROUILLE! board; on "paint" he
// lowers it slowly: narrowed, scheming eyes. The camera settles low by the kiosk, then trucks round him to a closer
// three-quarter with the headline board and the tower far down the street behind.
const PAPER_DIR: [number, number] = [Math.sin((62 * Math.PI) / 180), Math.cos((62 * Math.PI) / 180)];
const paperCam = (d: number, y: number, ly: number): { pos: V3; look: V3; fov: number } => ({ pos: [LK[0] + PAPER_DIR[0] * d, y, LK[2] + PAPER_DIR[1] * d], look: [LK[0], ly, LK[2]], fov: 38 });
SHOT_CAMS[4] = () => [
  K(196, hold([-7.25, 0.62, 4.2], [-10.2, 2.0, -3.2], 40, 196, 0.002), 30),
  K(240, F((f) => paperCam(lerp(1.8, 1.62, sm(f, 240, 282)), 1.42, 1.34), 240, 0.0015), 20),
  K(282, F(() => paperCam(2.3, 1.6, 1.55), 282, 0.002, [[294, 0.005, 10]]), 22),
];
SHOT_ACTS[4] = (f, s) => {
  const pay = sm(f, 198, 206) - sm(f, 210, 216), give = sm(f, 206, 214) - sm(f, 218, 222), read = sm(f, 216, 224), lower = sm(f, 286, 296);
  let lo: P;
  if (f < 216) lo = { expr: "neutral", facing: faceTo(4, s, f, LK, NEWS), armR: [[26, 4], [lerp(34, 56, pay), lerp(24, 4, pay)]] as A2, armRFront: true, propR: f > 212 ? "newspaper" : "purse" };
  else lo = pose("paper", { expr: f < 286 ? (f > 262 ? "shock" : "neutral") : "sly", facing: -1, headTilt: lower > 0 ? 4 * lower : 0,
    armR: [[22, lerp(-4, 22, lower)], [26, lerp(-30, 26, lower)]] as A2, armL: [[-22, lerp(-4, 22, lower)], [-26, lerp(-30, 26, lower)]] as A2, armRFront: true, propR: "newspaper", propRAng: 0.05 * read });
  return {
    ctl: { car: lerp(0.35, 0.53, lin(f, 196, 306)) },
    cast: [C("lustig", LK, pose(null, lo), { shadow: true }), newsboy(f, give), ...streetExtras(4, s, f)],
    fx: f >= 222 ? [{ kind: "card", key: "frontPage", pos: [LK[0] + PAPER_DIR[0] * 0.2, lerp(1.32, 0.98, lower), LK[2] + PAPER_DIR[1] * 0.2], w: lerp(0.6, 0.5, lower), h: lerp(0.76, 0.62, lower) * lerp(1, 0.9, sm(f, 222, 226)), rot: 0.04 * Math.sin(f * 0.07), cw: 300, ch: 380,
      draw: (p) => { const g = p.g; g.fillStyle = "#f3ead2"; g.strokeStyle = "#241726"; g.lineWidth = 12; g.beginPath(); g.roundRect(8, 8, 284, 364, 10); g.fill(); g.stroke();
        g.fillStyle = "#241726"; g.textAlign = "center"; g.font = "900 26px Georgia, serif"; g.fillText("LA VOIX DU MATIN", 150, 52); g.fillRect(26, 64, 248, 5);
        g.fillStyle = "#b8352e"; g.font = "900 46px Georgia, serif"; g.fillText("LA TOUR", 150, 116); g.fillText("ROUILLE !", 150, 162);
        g.strokeStyle = "#6b4a2f"; g.lineWidth = 6; g.beginPath(); g.moveTo(150, 186); g.lineTo(108, 330); g.moveTo(150, 186); g.lineTo(192, 330); g.moveTo(124, 270); g.lineTo(176, 270); g.moveTo(134, 228); g.lineTo(166, 228); g.stroke();
        g.fillStyle = "#c8672e"; for (const [x, y] of [[118, 300], [182, 292], [140, 248], [165, 310]]) { g.beginPath(); g.ellipse(x, y, 9, 6, 0.4, 0, 6.3); g.fill(); }
        g.fillStyle = "#6e6458"; for (let i = 0; i < 6; i++) { g.fillRect(28, 196 + i * 22, 62, 6); g.fillRect(210, 196 + i * 22, 62, 6); } } }] as FxSpec[] : [],
    focus: f >= 240 && f < 284 ? [LK[0] + PAPER_DIR[0] * 0.2, 1.32, LK[2] + PAPER_DIR[1] * 0.2] : [LK[0], 1.6, LK[2]], subj: f >= 236 && f < 290 ? null : undefined,
  };
};
lens(196, 6, 10);

// ---- S10 (807-893) "Then he rents a fancy car, / drives them to the tower,"
// Riding the motion: the camera tracks the limousine from behind-left as it rolls down the boulevard toward the tower;
// Lustig drives, Poisson beside him, two dealers stand on the running board waving their hats. The camera climbs and
// swings wider so the tower grows ahead of them.
const carU10 = (f: number) => lerp(0.3, 0.45, lin(f, 800, 900));
const CARX = 4.0;
SHOT_CAMS[10] = () => [
  K(807, (f) => { const z = carZ(carU10(f)), k = sm(f, 807, 893); return { pos: [CARX - lerp(2.4, 1.2, k), lerp(2.1, 3.0, k), z + lerp(8.2, 9.4, k)], look: [CARX + lerp(0.9, 0.2, k), lerp(1.6, 2.5, k), z - lerp(6, 14, k)], fov: 40 }; }),
];
SHOT_ACTS[10] = (f, s) => {
  const z = carZ(carU10(f)), b = 0.025 * Math.sin(f * 1.7);
  const wave = (i: number) => Math.sin(st(f, 2) * 0.7 + i * 1.6);
  return {
    ctl: { car: carU10(f) },
    cast: [
      C("lustig", [CARX + 0.36, 0.96 + b, z + 0.05], pose(null, { expr: "smug", mode: "sit", facing: -1, armR: [[22, 8], [40, 0]], armL: [[-14, 8], [14, 0]], armRFront: true, armLFront: true, hatTilt: 4 }), { shadow: false }),
      C("poisson", [CARX - 0.38, 0.96 + b, z + 0.12], pose(null, { expr: "joy", mode: "sit", facing: -1, armL: ARMS.upL, armLFront: true, mouth: talk(f, 830, 860) })),
      C("dealer2", [CARX - 1.0, 0.42 + b, z + 0.95], pose(null, { expr: "grin", facing: -1, hatLift: 0.14, armL: [[-26, -14], [-24 + 6 * wave(0), -60]] as A2, armR: [[24, 4], [30, -14]] as A2, armRFront: true })),
      C("dealer3", [CARX, 2.08 + b, z + 1.5], pose(null, { expr: "joy", mode: "sit", facing: 1, armR: [[24, -10], [30 + 6 * wave(1), -48]] as A2, armRFront: true, tilt: -4, hatLift: 0.1 })),
      walker(10, s, "paris2", [-12.4, SWK, z + 8], [-12.4, SWK, z - 12], f, 1, "basket", 1.1),
      walker(10, s, "paris4", [12.6, SWK, z - 16], [12.6, SWK, z - 2], f, 2, "basket", 1.0),
      chatter("paris1", [-11.6, SWK, z - 24], f, 3, 1), chatter("paris3", [-11.0, SWK, z - 23.3], f, 4, -1),
    ],
    focus: [CARX, 1.3, z], subj: "lustig",
  };
};
lens(807, 4, 1);

// ---- S20 (1657-1741) lavender dusk: "And Poisson / is too embarrassed / to tell the police."
// Tracking alongside: Poisson marches up to the police station, raises his fist to knock on "embarrassed", freezes,
// pulls his cap down over his eyes and tiptoes away; the gendarme on the step raises an eyebrow, a lamplighter works.
const PB: V3 = [-12.7, SWK, 33.8], GEND: V3 = [-15.35, SWK + 0.68, 31.9];
const poisS20 = (f: number) => f < 1722 ? along([[-11.4, SWK, 37.4], PB], 0.11, 1657, f) : along([PB, [-10.2, SWK, 36.8]], 0.035, 1722, f);
SHOT_CAMS[20] = () => [
  K(1657, (f) => { const p = poisS20(Math.min(f, 1690)).p; return { pos: [-6.1, 1.5, p[2] + 1.2 - 0.6 * sm(f, 1660, 1700)], look: [p[0] - 0.4, 1.45, p[2] - 0.4], fov: 38 }; }),
  K(1694, F((f) => fit([body(poisS20(f).p, 0, 2.05, 0.4), body(GEND, 0, 2.0, 0.3)], 68, 2, 38, 0.82, 0.15, 0.05), 1694, 0.0022), 26),
];
SHOT_ACTS[20] = (f, s) => {
  const P0 = poisS20(f), knock = sm(f, 1690, 1698), cap = sm(f, 1710, 1720);
  let po: P;
  if (f < 1690) po = { expr: "angry", mode: "walk", phase: ph(f, 10), facing: screenSide(20, s, f, P0.d[0], P0.d[1]), armR: [[20, 6], [26, -10]], armRFront: true };
  else if (f < 1710) po = { expr: f < 1700 ? "angry" : "sheepish", facing: faceTo(20, s, f, P0.p, GEND), armR: [[26, -6], [lerp(30, 46, knock), lerp(-8, -24, knock) + (f > 1700 ? 3 * Math.sin(f) : 0)]] as A2, armRFront: true, sweat: f > 1700 ? 0.8 : 0 };
  else if (f < 1722) po = { expr: "sheepish", facing: faceTo(20, s, f, P0.p, GEND), hatTilt: 18 * cap, hatLift: -0.06 * cap, armR: [[22, -10], [lerp(30, 14, cap), lerp(-24, -58, cap)]] as A2, armRFront: true, sweat: 1 };
  else po = { expr: "sheepish", mode: "walk", phase: ph(f, 20), facing: screenSide(20, s, f, P0.d[0], P0.d[1]), hatTilt: 18, hatLift: -0.06, tilt: -4, sweat: 1, armL: [[-20, 10], [-34, 0]], armR: [[20, 10], [34, 0]] };
  const brow = f > 1700 ? "sly" : "neutral";
  return {
    ctl: { lamps: 1 },
    cast: [C("poisson", P0.p, pose(null, po), { shadow: true }), C("gendarme", GEND, pose("hips", { expr: brow as Face, facing: faceTo(20, s, f, GEND, P0.p), headTilt: f > 1702 ? 5 : 0 })),
      walker(20, s, "painter2", [-12.9, SWK, 46], [-12.9, SWK, 38.5], f, 1, "broom", 0.8),
      chatter("paris1", [-11.2, SWK, 26.5], f, 2, 1), chatter("paris3", [-10.6, SWK, 27.2], f, 3, -1)],
    focus: [P0.p[0], 1.6, P0.p[2]], subj: "poisson",
  };
};
lens(1657, 6, 1);
