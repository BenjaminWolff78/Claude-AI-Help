
// =====================================================================================================================
// STADIUM (start: light "stadium"; finish: light "finish"). Track home straight along x (z -4.5..4.5), runners leave
// toward +x (gate at x 60), arrive at the finish from +x (tape at x -8). Map board face z 9.75 (x 39.4..44.6, y 1..7),
// well icon on it at about [41.69, 5.2, 9.69]. Thermometer [46.8, 0, 9.4], organizer's table [49.4, 0, 7.2].
import { STADIUM_WELL } from "./sets/stadium";
const ST_STARTER: V3 = [34.9, 1.0, 6.9], ST_ORG: V3 = [49.05, 0, 8.12], ST_THIRSTY: V3 = [49.72, 0, 6.22], ST_JUG: V3 = [49.75, 0.78, 6.98];
const ST_FAN: V3 = [45.6, 0, 8.0], ST_POINTER: V3 = [43.9, 0, 8.7], ST_THERMO_TOP: V3 = [46.8, 4.2, 9.2];
const ST_RUNNERS: [string, V3][] = [["runner1", [33, 0, -3.6]], ["dustRunner", [33, 0, -1.8]], ["mailman", [33, 0, 0]], ["hicks", [33, 0, 1.8]], ["runner2", [33, 0, 3.6]],
  ["lorz", [31.5, 0, -3.6]], ["runner3", [31.5, 0, -1.8]], ["dogRunner", [31.5, 0, 0]], ["runner4", [31.5, 0, 1.8]], ["runner5", [31.5, 0, 3.6]]];
const GUN = 126; // "1904" - the pistol fires
const startRunX = (x0: number, i: number, f: number) => x0 + (f < GUN + 2 ? 0 : 0.5 * 0.0026 * Math.min(f - GUN - 2, 50) ** 2 + 0.13 * Math.max(0, f - GUN - 52)) * (0.92 + 0.02 * (i % 5));

// ---- S02 (108-201) "You see, / the 1904 marathon / is 25 miles / of dusty road"
// Dissolve in on a low angle: the starter on his stand raises the pistol over the crouching runners and fires on "1904"
// (smoke puff, kick); the runners burst off the line. The camera cranes up over them to the course map, where an
// official traces the long dusty road with his pointer on "25 miles".
SHOT_CAMS[2] = () => [
  K(108, F(() => fit([body(ST_STARTER, 0, 2.1, 0.4)], 120, -9, 40, 0.5, 0.35, 0.25), 108, 0.0022, [[GUN, 0.006, 10]])),
  K(140, F((f) => ({ pos: [lerp(40.4, 41.9, sm(f, 140, 200)), 3.3, -3.4], look: [41.9, 4.1, 9.7], fov: 42 }), 140, 0.0018), 36),
];
SHOT_ACTS[2] = (f, s) => {
  const fired = f >= GUN, aim = sm(f, 108, 118), trace = sm(f, 160, 196);
  return {
    ctl: { smoke: fired ? lin(f, GUN, GUN + 46) : 0, temp: 0.2, crowd: fired ? 0.35 + 0.3 * Math.exp(-(f - GUN) / 20) : 0.2, wellGlow: 0, tape: 0, confetti: 0 },
    cast: [
      C("starter", ST_STARTER, pose(null, { expr: fired ? "eureka" : "determined", facing: -1, armR: fired ? [[22, -26], [26, lerp(-66, -58, Math.exp(-(f - GUN) / 4))]] as A2 : [[22, -20], [lerp(30, 26, aim), lerp(-30, -62, aim)]] as A2, armRFront: true, propR: "pistol", propRAng: -1.4,
        armL: [[-20, -12], [-14, -34]] as A2, squash: fired ? 0.08 * Math.exp(-(f - GUN) / 4) : 0 })),
      ...ST_RUNNERS.map(([who, p], i) => {
        const x = startRunX(p[0], i, f), go = f >= GUN + 2;
        return C(who, [x, 0, p[2]], pose(null, go ? { mode: "run", phase: ph(f + i * 5, 12), expr: "determined", facing: 1 } : { expr: "determined", facing: 1, tilt: 10, armR: [[20, 20], [34, 30]] as A2, armL: [[-10, 24], [10, 36]] as A2 }), { idx: 10 + i });
      }),
      C("fan3", ST_POINTER, pose(null, { expr: "talk", facing: 1, mouth: talk(f, 160, 196), armR: [[24, -20], [lerp(40, 54, trace), lerp(-40, -30, trace) + 10 * Math.sin(f * 0.3) * trace]] as A2, armRFront: true }), { idx: 30 }),
      C("organizer", ST_ORG, pose(null, { expr: "smug", facing: -1, armR: [[22, 10], [30, -10]] as A2, armRFront: true, propR: "clipboard" }), { idx: 31 }),
    ],
    fx: fxs(sparkle("gun", [ST_STARTER[0] - 0.1, 3.0, ST_STARTER[2] - 0.6], f - GUN, 0.5, "#fff1c4")),
    focus: f < 140 ? [ST_STARTER[0], 2.2, ST_STARTER[2]] : [41.8, 4.4, 9.7], subj: null,
  };
};
lens(108, 8, 1); lens(140, 0, 24);

// ---- S03 (201-291) "in 90-degree heat, / and the organizer wants to study thirst."
// The camera travels along the wall to the giant thermometer: the mercury shoots up to 90 and the top shimmers, a fan
// fans himself. Then it travels on, over the shoulder of a thirsty runner, to the organizer at his THIRST STUDY table:
// he sips water, notes something on his clipboard, and wags a finger at the runner reaching for the jug.
SHOT_CAMS[3] = () => [
  K(201, F(() => ({ pos: [44.6, 1.6, 3.4], look: [46.4, 3.0, 9.2], fov: 42 }), 201, 0.002, [[221, 0.006, 12]]), 28),
  K(244, F(() => fit([body(ST_ORG, 0.3, 2.15, 0.36), body(ST_THIRSTY, 0.3, 2.0, 0.32)], 292, 5, 40, 0.86), 244, 0.0022, [[272, 0.005, 12]]), 30),
];
SHOT_ACTS[3] = (f, s) => {
  const sip = sm(f, 252, 258) * (1 - sm(f, 264, 270)), wag = f >= 270 ? Math.sin((f - 270) * 0.7) : 0, reach = sm(f, 256, 268);
  return {
    ctl: { temp: lerp(0.2, 1, sm(f, 210, 228)), crowd: 0.2, smoke: 1, wellGlow: 0, tape: 0, confetti: 0 },
    cast: [
      C("fan2", f < 240 ? ST_FAN : [44.4, 0, 9.3], pose(null, { expr: f > 222 ? "dismay" : "neutral", facing: 1, sweat: sm(f, 218, 230), armR: [[26, 6], [30 + 8 * Math.sin(st(f, 2) * 0.9), -20]] as A2, armRFront: true, headTilt: 4 * Math.sin(f * 0.05) })),
      C("organizer", ST_ORG, pose(null, { expr: f > 270 ? "smug" : sip > 0.5 ? "joy" : "neutral", facing: faceTo(3, s, f, ST_ORG, ST_THIRSTY), mouth: talk(f, 272, 290),
        armR: f < 270 ? [[20, 8], [lerp(30, 12, sip), lerp(16, -34, sip)]] as A2 : [[24, -10], [40 + 6 * wag, -40]] as A2, armRFront: true, propR: f < 270 ? "glass" : undefined,
        armL: [[-22, 12], [-30, 4]] as A2, armLFront: true, propL: "clipboard" })),
      C("runner3", ST_THIRSTY, pose(null, { expr: "dismay", facing: faceTo(3, s, f, ST_THIRSTY, ST_ORG), sweat: 1, mouth: "O",
        armR: [[26, 10], [lerp(30, 54, reach), lerp(20, 4, reach)]] as A2, armRFront: true, tilt: 6 * reach })),
      C("starter", ST_STARTER, pose(null, { expr: "neutral", facing: 1 }), { idx: 30 }),
    ],
    fx: fxs(f < 250 ? squiggles("heat", [ST_THERMO_TOP[0] + 0.1, ST_THERMO_TOP[1] + 0.5, ST_THERMO_TOP[2] - 0.2], f, "#ffd36b", 0.5) : null),
    focus: f < 244 ? [46.8, 2.8, 9.3] : [ST_ORG[0], 1.6, ST_ORG[2]], subj: f < 244 ? null : "organizer",
  };
};
lens(201, 3, 16); lens(244, 7, 20);

// ---- S04 (291-327) "So there's just one... (well)": the camera rises and travels back to the map; the single well
// icon glows and the camera pushes into it until it fills the frame; then the 8 f dissolve to the real well.
SHOT_CAMS[4] = () => [
  K(291, F(() => ({ pos: [44.2, 6.2, 0.6], look: STADIUM_WELL, fov: 40 }), 291, 0.0025), 26),
  K(311, F((f) => ({ pos: [STADIUM_WELL[0], STADIUM_WELL[1], STADIUM_WELL[2] - lerp(1.6, 0.62, sm(f, 311, 330))], look: STADIUM_WELL, fov: 32 }), 311, 0.001), 14),
];
SHOT_ACTS[4] = (f) => ({
  ctl: { temp: 1, wellGlow: sm(f, 298, 308), crowd: 0.2, smoke: 1, tape: 0, confetti: 0 },
  cast: [C("fan3", ST_POINTER, pose(null, { expr: "eureka", facing: 1, armR: [[24, -20], [54, -46]] as A2, armRFront: true, mouth: talk(f, 300, 320) }), { idx: 30 })],
  fx: fxs(sparkle("well", [STADIUM_WELL[0] + 0.25, STADIUM_WELL[1] + 0.2, STADIUM_WELL[2] - 0.05], f - 304, 0.3)),
  focus: STADIUM_WELL, subj: null,
});
lens(291, 0, 10);

// =====================================================================================================================
// FINISH (payoff, light "finish"). Tape at x -8 (FIN_X), runners arrive from +x. carPark [-12, 0, -10.5] (infield).
const FIN_X0 = -8;
/** Hicks: staggers in (0.07 m/f) until 1576, then is carried by his two handlers (0.26 m/f) through the tape */
const hicksFinX = (f: number) => (f < 1576 ? 6.2 - 0.07 * (f - 1510) : Math.max(FIN_X0 - 1.0, 6.2 - 0.07 * 66 - 0.26 * (f - 1576)));
const HZ = 0.3;
// ---- S20 (1510-1632) "So Hicks staggers on, / seeing things, / and his team carries him / over the finish line."
SHOT_CAMS[20] = () => [
  K(1510, F((f) => { const x = hicksFinX(f); return { pos: [x - 1.6, 1.3, HZ - 5.6], look: [x - 0.35, 1.25, HZ + 0.6], fov: 42 }; }, 1510, 0.0012)),
  K(1596, F((f) => { const x = hicksFinX(f); return { pos: [x - 3.2, 1.0, HZ - 5.2], look: [x + 0.2, 1.55, HZ + 1.4], fov: 42 }; }, 1596, 0.0016, [[1614, 0.006, 12]]), 20),
];
const finishCrowd = (f: number, k: number): CastPlace[] => [
  C("official", [FIN_X0 + 2.2, 0, 6.3], pose(null, { expr: k > 0.5 ? "joy" : "eureka", facing: -1, armR: [[24, -30], [30, -64 + 8 * Math.sin(st(f) * 0.6)]] as A2, armRFront: true, propR: "stopwatch" }), { idx: 40 }),
  C("starter", [FIN_X0 - 2.7, 0, 6.4], pose(null, { expr: "joy", facing: 1, armR: ARMS.upR, armL: ARMS.upL, armRFront: true, squash: 0.06 * Math.abs(Math.sin(st(f) * 0.4)) * k }), { idx: 41 }),
  C("lady1", [FIN_X0 - 4.0, 0, 5.8], pose(null, { expr: "joy", facing: 1, armR: [[24, -20], [28, -50 + 6 * Math.sin(st(f) * 0.7)]] as A2, armRFront: true, propR: "parasol" }), { idx: 42 }),
  C("fan1", [FIN_X0 + 4.4, 0, 5.4], pose(null, { expr: "eureka", facing: -1, armR: ARMS.upR, hatLift: 0.6 * k * Math.abs(Math.sin(st(f) * 0.3)) }), { idx: 43 }),
];
SHOT_ACTS[20] = (f, s) => {
  const x = hicksFinX(f), carried = f >= 1576, grab = sm(f, 1566, 1578), tape = sm(f, 1612, 1630);
  const H: V3 = [x, carried ? 0.18 : 0, HZ];
  const hx = (o: number) => x + 0.2 + (carried ? 0 : (1 - grab) * (2.8 + o)), handlerRun = f >= 1548;
  return {
    ctl: { tape, confetti: sm(f, 1614, 1632), crowd: lerp(0.35, 1, sm(f, 1590, 1616)), temp: 1, smoke: 1, wellGlow: 0 },
    cast: [
      C("hicks", carried ? [x, 0, HZ] : H, pose(null, carried
        ? { mode: "carried", phase: ph(f, 10), expr: f > 1612 ? "joy" : "dizzy", facing: -1, tilt: -4 }
        : { mode: "stagger", phase: ph(f, 20), expr: "dizzy", facing: -1, tilt: 6 * Math.sin(f * 0.11), sweat: 1 }), { air: carried }),
      C("coach", [hx(0.4), 0, HZ - 0.55], pose(null, handlerRun ? { mode: carried ? "run" : "run", phase: ph(f + 3, 12), expr: "strain", facing: -1, armR: carried ? [[24, -8], [36, -20]] as A2 : undefined, armRFront: true } : { expr: "dismay", facing: -1 })),
      C("helper", [hx(1.0), 0, HZ + 0.55], pose(null, handlerRun ? { mode: "run", phase: ph(f + 9, 12), expr: "strain", facing: -1, armL: carried ? [[-24, -8], [-36, -20]] as A2 : undefined } : { expr: "dismay", facing: -1 }), { idx: 2 }),
      ...finishCrowd(f, sm(f, 1600, 1616)),
    ],
    fx: fxs(f >= 1540 && f < 1610 ? visions([x, 2.1 + (carried ? 0.18 : 0), HZ], f) : null, tape > 0 && f < 1626 ? sparkle("tape", [FIN_X0, 1.2, HZ], f - 1614, 0.6) : null),
    focus: [x, 1.6, HZ], subj: "hicks",
  };
};
lens(1510, 6, 1); lens(1596, 3, 20);

// ---- S21 (1632-1683) "He wins gold, / eight pounds lighter." PAYOFF: low hero angle, the medal official hangs the
// gold medal on Hicks and he lifts it toward the lens (it fills half the frame, light burst + confetti); on "eight
// pounds lighter" he deflates thin with a big exhale and the coach props him up.
const WIN: V3 = [FIN_X0 - 1.0, 0, HZ];
const MEDAL_CARD = (key: string, pos: V3, w: number, rot: number, shine: number): FxSpec => ({
  kind: "card", key: "bigMedal" + key, pos, w, h: w * 1.45, rot, cw: 320, ch: 464,
  draw: (p) => {
    const g = p.g, ink = "#241726";
    // ribbon: red / white / blue V straps
    const strap = (x0: number, x1: number) => { g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + 70, 0); g.lineTo(x1 + 36, 250); g.lineTo(x1 - 34, 250); g.closePath(); };
    for (const [x0, x1] of [[40, 130], [210, 190]] as [number, number][]) {
      strap(x0, x1); const gr = g.createLinearGradient(x0, 0, x0 + 70, 0); gr.addColorStop(0, "#c8352e"); gr.addColorStop(0.33, "#c8352e"); gr.addColorStop(0.34, "#f6f0e2"); gr.addColorStop(0.66, "#f6f0e2"); gr.addColorStop(0.67, "#26386a"); gr.addColorStop(1, "#26386a");
      g.fillStyle = gr; g.fill(); g.lineWidth = 8; g.strokeStyle = ink; g.stroke();
    }
    // the gold disc
    const cx = 160, cy = 320, R = 130;
    g.beginPath(); g.arc(cx, cy, R, 0, 6.3); const gd = g.createRadialGradient(cx - 40, cy - 50, 10, cx, cy, R); gd.addColorStop(0, "#fff3b0"); gd.addColorStop(0.45, "#f5c542"); gd.addColorStop(1, "#c98a1c");
    g.fillStyle = gd; g.fill(); g.lineWidth = 10; g.strokeStyle = ink; g.stroke();
    g.beginPath(); g.arc(cx, cy, R - 22, 0, 6.3); g.lineWidth = 6; g.strokeStyle = "#b5781a"; g.stroke();
    // laurel dots round the rim
    g.fillStyle = "#b5781a"; for (let i = 0; i < 18; i++) { const a = Math.PI * 0.62 + (i / 17) * Math.PI * 1.76; g.beginPath(); g.ellipse(cx + Math.cos(a) * (R - 40), cy + Math.sin(a) * (R - 40), 8, 4, a + 1.2, 0, 6.3); g.fill(); }
    // star + year
    g.fillStyle = "#fff6c8"; g.strokeStyle = ink; g.lineWidth = 6; g.beginPath(); for (let k = 0; k < 10; k++) { const rr = k % 2 ? 18 : 42, aa = (k * Math.PI) / 5 - Math.PI / 2; g.lineTo(cx + Math.cos(aa) * rr, cy - 22 + Math.sin(aa) * rr); } g.closePath(); g.fill(); g.stroke();
    g.font = "900 54px Georgia"; g.textAlign = "center"; g.lineWidth = 8; g.strokeStyle = "#8a5a12"; g.strokeText("1904", cx, cy + 66); g.fillStyle = "#fff3b0"; g.fillText("1904", cx, cy + 66);
    // shine sweep
    g.save(); g.beginPath(); g.arc(cx, cy, R - 6, 0, 6.3); g.clip(); g.globalAlpha = 0.55 * shine; g.fillStyle = "#ffffff"; g.translate(cx - R + shine * 2 * R, cy); g.rotate(0.5); g.fillRect(-14, -R * 1.5, 28, R * 3); g.restore();
  },
});
// The official holds the big gold medal up to the lens (it fills about half the frame, light burst, confetti),
// Hicks beams behind it; on "eight pounds lighter" the camera eases back: the medal is on him and he deflates thin
// with a big exhale while the coach props him up.
SHOT_CAMS[21] = () => [
  K(1632, F(() => ({ pos: [WIN[0] + 0.2, 1.22, WIN[2] - 1.6], look: [WIN[0] + 0.02, 1.3, WIN[2]], fov: 40 }), 1632, 0.0026, [[1640, 0.006, 14]]), 16),
  K(1656, F(() => fit([body(WIN, 0, 2.1, 0.4), body([WIN[0] + 0.75, 0, WIN[2] + 0.45], 0.6, 2.0, 0.3)], 170, 2, 40, 0.84, -0.1), 1656, 0.0024), 20),
];
SHOT_ACTS[21] = (f, s) => {
  const rise = easeOut(lin(f, 1632, 1642)), hang = sm(f, 1650, 1658), thin = sm(f, 1662, 1672), card = f < 1656;
  const mpos: V3 = [WIN[0] + 0.14, lerp(0.9, 1.22, rise) + 0.01 * Math.sin(f * 0.2), WIN[2] - 0.92];
  return {
    ctl: { tape: 1, confetti: 1, crowd: 1, temp: 1, smoke: 1, wellGlow: 0 },
    cast: [
      C("hicks", WIN, pose(null, { expr: thin > 0.5 ? "dizzy" : "joy", facing: 1, medal: !card, squash: -0.14 * thin, tilt: 4 * thin, mouth: thin > 0.2 && thin < 0.9 ? "O" : undefined, headTilt: card ? 4 : 0 })),
      C("official", [WIN[0] - 0.75, 0, WIN[2] + 0.7], pose(null, { expr: "joy", facing: 1, armR: [[24, -8], [lerp(40, 30, hang), lerp(-20, 0, hang)]] as A2, armRFront: true }), { idx: 4 }),
      C("coach", [WIN[0] + 0.75, 0, WIN[2] + 0.45], pose(null, { expr: thin > 0.5 ? "dismay" : "joy", facing: -1, armL: [[-24, 6], [lerp(-40, -52, thin), lerp(0, -6, thin)]] as A2, armLFront: true }), { idx: 5 }),
    ],
    fx: fxs(card ? MEDAL_CARD("A", mpos, 0.36, 0.06 * Math.sin(f * 0.15), lin(f, 1640, 1652)) : null,
      glowBurst("medal", [mpos[0], mpos[1] - 0.05, mpos[2] - 0.05], 0.9, card ? 0.7 * Math.exp(-Math.max(0, f - 1640) / 10) + 0.15 : 0),
      card ? sparkle("m1", [mpos[0] + 0.12, mpos[1] + 0.02, mpos[2] - 0.06], f - 1642, 0.14) : null, card ? sparkle("m2", [mpos[0] - 0.1, mpos[1] - 0.12, mpos[2] - 0.06], f - 1648, 0.11) : null),
    focus: card ? mpos : [WIN[0], 1.5, WIN[2]], subj: card ? null : "hicks",
  };
};
lens(1632, 10, 1); lens(1656, 4, 16);

// ---- S22 (1683-1772) "But he wasn't the first man across. / The first guy / took a car."
// The camera glides off Hicks across the infield to Lorz, lounging in a parked motor car with a laurel wreath, waving
// to the crowd. On "first guy" he squeezes the brass horn; then a calm close three-quarter: a sly grin held for 1 s,
// ending on "car." (loops into "A runner won Olympic gold...").
import { STADIUM_CAR_SEATS } from "./sets/stadium";
const LORZ_SEAT: V3 = STADIUM_CAR_SEATS.front;
SHOT_CAMS[22] = () => [
  K(1683, F(() => ({ pos: [WIN[0] + 0.6, 1.5, WIN[2] - 2.6], look: [WIN[0] - 0.2, 1.35, WIN[2]], fov: 40 }), 1683, 0.001), 10),
  K(1690, F(() => fit([body(WIN, 0, 2.1, 0.36), body(LORZ_SEAT, -0.4, 1.45, 0.42)], 22, 5, 40, 0.86), 1690, 0.0016), 22),
  K(1722, F(() => fit([body(LORZ_SEAT, -0.4, 1.45, 0.42)], 335, 4, 38, 0.62, 0.05, -0.05), 1722, 0.0022, [[1748, 0.005, 12]]), 26),
];
SHOT_ACTS[22] = (f, s) => {
  const honk = sm(f, 1736, 1740) * (1 - sm(f, 1744, 1750)), wave = f < 1730 ? Math.sin(f * 0.35) : 0;
  return {
    ctl: { tape: 1, confetti: lerp(1, 0.4, sm(f, 1683, 1730)), crowd: 0.6, temp: 1, smoke: 1, wellGlow: 0, horn: honk },
    cast: [
      C("hicks", WIN, pose(null, { expr: f > 1700 ? "dismay" : "joy", facing: faceTo(22, s, f, WIN, LORZ_SEAT), medal: true, squash: -0.1 })),
      C("coach", [WIN[0] + 0.75, 0, WIN[2] + 0.45], pose(null, { expr: "angry", facing: faceTo(22, s, f, [WIN[0] + 0.75, 0, WIN[2] + 0.45], LORZ_SEAT), armR: [[24, -10], [48, -20]] as A2, armRFront: true }), { idx: 5 }),
      C("lorzWreath", LORZ_SEAT, pose(null, { mode: "sit", expr: f > 1744 ? "sly" : "joy", facing: faceTo(22, s, f, LORZ_SEAT, WIN), headTilt: f > 1750 ? 5 : 0,
        armR: f < 1730 ? [[24, -20], [30 + 8 * wave, -56]] as A2 : [[26, 10], [lerp(36, 44, honk), lerp(8, 2, honk)]] as A2, armRFront: true,
        armL: [[-24, 14], [-36, 24]] as A2 })),
      C("driver", STADIUM_CAR_SEATS.driver, pose(null, { mode: "sit", expr: "smile", facing: 1 }), { idx: 6 }),
    ],
    fx: fxs(sparkle("horn", [LORZ_SEAT[0] + 0.5, 1.2, LORZ_SEAT[2] - 0.6], f - 1738, 0.3, "#ffffff")),
    focus: f < 1700 ? [WIN[0], 1.5, WIN[2]] : [LORZ_SEAT[0], 1.5, LORZ_SEAT[2]], subj: f < 1728 ? null : "lorzWreath",
  };
};
lens(1683, 6, 18);
