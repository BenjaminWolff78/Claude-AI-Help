
// =====================================================================================================================
// EIFFEL TOWER base, Champ de Mars (tower). Ground y 0, +z = the Champ de Mars / camera side. The near leg stands at
// x,z 20.6..34.4 (leaning in), the front arch springs at y 7 (crown 23), the first platform at y 31.7. Hero group in
// front of the near leg at z ~39.5; the iron stair climbs along -z from [18.9, 0, 33.4] to the landing [19.1, 7, 23.1];
// painters' plank at y 4.56, z 32.35. Keep-out: TOWER_SOLIDS (piers, chords, stair, plank, kiosk, cart, trees...).
// =====================================================================================================================
const L1: V3 = [5.4, 0, 39.9], P1: V3 = [6.3, 0, 39.2], M1: V3 = [7.2, 0, 39.9];
const PLANK1: V3 = [25.3, 4.56, 32.35], PLANK2: V3 = [27.7, 4.56, 32.35];
/** y on the first stair flight (z 33.4 -> 23.1 rises 0 -> 7) */
const stairY = (z: number) => clamp01((33.4 - z) / 10.3) * 7;
const STAIR = (z: number): V3 => [19.1 - 0.2 * clamp01((33.4 - z) / 10.3) * 0, stairY(z), z];
const towerExtras = (id: number, s: SetDef, f: number, n = 4): CastPlace[] => [
  painter("painter1", PLANK1, f, 0, 1), painter("painter2", PLANK2, f, 1, -1),
  walker(id, s, "paris2", [-2.0, 0, 44.5], [12.0, 0, 46.0], f, 2, "basket", 1.0),
  idler("paris4", [3.0, 0, 23.6], f, 3, 1, { armR: [[22, -10], [28, -40]], armRFront: true }),
  chatter("paris1", [11.0, 0, 31.4], f, 4, 1), chatter("paris3", [11.8, 0, 32.0], f, 5, -1),
].slice(0, 2 + n);

// ---- S01 (0-62) "This man is selling / the Eiffel Tower,"
// Frame 1 is already moving: Lustig, three-quarter, sweeps his arm up the tower like a showman while Poisson and his
// wife crane their necks; the camera trucks along the group, then cranes down low and tilts up so the near leg, the
// arch and the platform tower over them (title #1). Painters brush on their plank, tourists stroll.
SHOT_CAMS[1] = () => [
  K(0, F((f) => fit([body(L1), body(P1)], lerp(30, 16, sm(f, 0, 40)), 3, 40, 0.86, 0.1, 0.05), 0, 0.0016)),
  K(30, (f) => { const k = sm(f, 30, 62); return { pos: [lerp(4.3, 3.9, k), lerp(0.75, 0.55, k), lerp(46.4, 47.6, k)], look: [lerp(7.4, 8.2, k), lerp(2.2, 4.6, k), lerp(31.0, 30.0, k)], fov: 46 }; }, 28),
];
const lustigSell = (f: number, k = 1): P => {
  const up = sm(f, -6, 12);
  return { expr: "grin", facing: -1, mouth: talk(f, 0, 44), armR: [lerp2([24, 20], ARMS.upR[0], up), lerp2([30, 40], [44, -58], up)] as A2, armRFront: true, headTilt: -4 * k, bob: 1.5 * Math.sin(f * 0.3) };
};
SHOT_ACTS[1] = (f, s) => ({
  ctl: { rust: 1, fair: 0, glow: 0 },
  cast: [C("lustig", L1, pose(null, { ...lustigSell(f), facing: faceTo(1, s, f, L1, P1) }), { shadow: true }),
    C("poisson", P1, pose(null, { expr: "eureka", facing: faceTo(1, s, f, P1, [20, 0, 30]), headTilt: -8, mouth: "O" })),
    C("mmePoisson", M1, pose(null, { expr: "neutral", facing: faceTo(1, s, f, M1, L1), armL: [[-20, 20], [8, 26]], armR: [[20, 20], [-8, 30]], armLFront: true, armRFront: true })),
    ...towerExtras(1, s, f)],
  focus: [6.3, 1.5, 39.5],
});
lens(0, 4, 1);

// ---- S02 (62-140) "and the buyer / is about to hand him / a suitcase of cash."
// Poisson heaves a fat suitcase up with both hands and steps in; the camera glides down to over Lustig's shoulder
// (back view) so Poisson, the suitcase and the leg of the tower fill the frame; Lustig's fingers wiggle toward the
// handle; the camera keeps arcing round until Lustig's greedy profile shows.
const P2: V3 = [6.0, 0, 39.45];
SHOT_CAMS[2] = () => [
  K(62, F((f) => fit([body(L1, 0, 2.05, 0.3), body(lerp3(P1, P2, sm(f, 74, 92)), 0, 2.05, 0.4)], lerp(-40, -20, sm(f, 70, 140)), 5, 40, 0.78, 0.05, 0.05), 62, 0.0018), 32),
];
SHOT_ACTS[2] = (f, s) => {
  const heave = sm(f, 64, 78), P = lerp3(P1, P2, sm(f, 74, 92)), wig = f > 100 ? Math.sin(f * 0.9) * 4 : 0, back = false;
  return {
    ctl: { rust: 1, fair: 0, glow: 0 },
    cast: [C("lustig", L1, pose(null, back ? { back: true, armR: [[26, 4], [lerp(34, 50, sm(f, 96, 106)), lerp(24, 4, sm(f, 96, 106)) + wig]] as A2, armRFront: true }
        : { expr: "joy", facing: faceTo(2, s, f, L1, P), armR: [[26, 4], [50, 4 + wig]] as A2, armRFront: true, mouth: f > 118 ? "smileWide" : undefined }), { shadow: true }),
      C("poisson", P, pose(null, { expr: f < 96 ? "strain" : "grin", facing: faceTo(2, s, f, P, L1), mode: f >= 74 && f < 92 ? "walk" : "stand", phase: ph(f, 12), tilt: -5 * heave,
        armR: [[26, lerp(30, -2, heave)], [lerp(16, 40, heave), lerp(52, 10, heave)]] as A2, armL: [[-20, lerp(30, 0, heave)], [lerp(-6, 22, heave), lerp(52, 12, heave)]] as A2, armRFront: true, armLFront: true, propR: "suitcase", sweat: heave * 0.6 })),
      C("mmePoisson", M1, pose(null, { expr: "dismay", facing: faceTo(2, s, f, M1, P), armL: [[-20, 20], [8, 26]], armR: [[20, 20], [-8, 30]], armLFront: true, armRFront: true })),
      ...towerExtras(2, s, f)],
    focus: [6.0, 1.4, 39.4], subj: "poisson",
  };
};
lens(62, 6, 16);

// ---- S05 (306-430) 1889 World's Fair: "You see, it was built for a world's fair, / and it was only meant to stand
// for 20 years."  Fresh paint, bunting, the EXPOSITION 1889 banner, crowds with baskets and kids. A: from the crowd
// the camera cranes up the near leg to the arch and its banner (title #3). B: it glides back down and across to a
// fair official holding the permit board, who flips it from 1889 to 1909 on "20 years" with a tap of his cane.
const OFF: V3 = [9.6, 0, 40.4];
SHOT_CAMS[5] = () => [
  K(306, (f) => { const k = sm(f, 306, 372); return { pos: [lerp(2.2, 3.4, k), lerp(1.5, 2.6, k), lerp(49, 50.5, k)], look: [lerp(6.5, 13, k), lerp(1.8, 15, k), lerp(36, 26, k)], fov: lerp(42, 46, k) }; }),
  K(352, F(() => fit([body(OFF, 0, 2.05, 0.3), [OFF, 1.2, 2.4, 0.55]], 38, 4, 40, 0.74, 0.25, 0.1), 352, 0.0018, [[402, 0.005, 14]]), 62),
];
SHOT_ACTS[5] = (f, s) => {
  const flip = sm(f, 400, 408);
  const crowd: CastPlace[] = [
    walker(5, s, "paris2", [0.5, 0, 42.5], [11.5, 0, 44.0], f, 0, "basket", 1.1),
    walker(5, s, "paris4", [12.5, 0, 36.0], [3.0, 0, 37.5], f, 1, "basket", 1.0),
    chatter("paris1", [5.0, 0, 39.6], f, 2, 1), chatter("paris3", [5.8, 0, 40.3], f, 3, -1),
    C("newsboy", [7.4, 0, 43.0], pose("cheer", { expr: "joy", facing: 1, bob: 4 * Math.abs(Math.sin(st(f, 2) * 0.5)) }), { idx: 70 }),
    idler("buyer", [12.8, 0, 42.2], f, 4, -1, { expr: "grin" }),
    painter("painter1", PLANK1, f, 5, 1), painter("painter2", PLANK2, f, 6, -1),
  ];
  return {
    ctl: { fair: 1, rust: 0, glow: 0 },
    cast: [C("clerk2", OFF, pose(null, { expr: f > 404 ? "smug" : "neutral", facing: -1, armR: [[26, 6], [50, 4]], armRFront: true, armL: f > 398 && f < 410 ? [[-22, -4], [10, 6]] as A2 : [[-24, 20], [-30, 40]] as A2, armLFront: true, mouth: talk(f, 404, 416) }), { idx: 1 }), ...crowd],
    fx: [{ kind: "card", key: "permit" + (flip > 0.5 ? "B" : "A"), pos: [OFF[0] + 0.42, 1.3, OFF[2] - 0.2], w: 0.6 * Math.max(0.08, Math.abs(1 - 2 * flip)), h: 0.42, cw: 256, ch: 176,
      draw: (p) => { const g = p.g; g.fillStyle = "#f6ead0"; g.strokeStyle = "#241726"; g.lineWidth = 10; g.beginPath(); g.roundRect(8, 8, 240, 160, 14); g.fill(); g.stroke();
        g.fillStyle = "#7a2a3a"; g.font = "900 34px Georgia, serif"; g.textAlign = "center"; g.fillText("PERMIS", 128, 58);
        g.fillStyle = "#241726"; g.font = "900 64px Georgia, serif"; g.fillText(flip > 0.5 ? "1909" : "1889", 128, 132); } }] as FxSpec[],
    focus: f < 368 ? undefined : [OFF[0], 1.5, OFF[2]], subj: f < 400 ? null : "clerk2",
  };
};
lens(306, 0, 1); lens(368, 6, 20);

// ---- S11 (893-956) "and lets them climb it / like he owns the place."
// Low up the iron stair: the dealers puff up the first flight (Poisson sweating), Lustig waits on the landing, pats a
// girder like a landlord and waves them up; the camera cranes up alongside the climbers.
const climb = (z0: number, f: number, f0 = 893, v = 0.022, zmin = 24.2): V3 => { const z = Math.max(zmin, z0 - (f - f0) * v); return STAIR(z); };
const LAND: V3 = STAIR(25.3);
const climberStill = (who: string, f: number) => C(who, climb(27.6, Math.min(f, 950), 893, 0.022, 26.6), pose(null, { expr: "joy", facing: -1, armR: ARMS.upR, armRFront: true }), { idx: 12 });
SHOT_CAMS[11] = () => [
  K(893, (f) => { const k = sm(f, 893, 956); return { pos: [19.0, lerp(9.25, 8.85, k), lerp(22.75, 22.95, k)], look: [19.1, lerp(3.4, 4.6, k), lerp(29.8, 28.2, k)], fov: 42 }; }),
];
SHOT_ACTS[11] = (f, s) => {
  const pat = f > 925 ? Math.sin((f - 925) * 0.7) : 0;
  const climber = (who: string, z0: number, i: number, o: P = {}) => { const zm = 26.6 + i * 1.2, p = climb(z0, f, 893, 0.022, zm); return C(who, p, pose(null, { expr: "strain", mode: p[2] > zm + 0.01 ? "walk" : "stand", phase: ph(f + i * 4, 16), facing: i % 2 ? 1 : -1, tilt: 6, sweat: 0.6, ...o }), { idx: 10 + i }); };
  return {
    ctl: { rust: 1, fair: 0, glow: 0 },
    cast: [C("lustig", LAND, pose(null, f < 922 ? { expr: "grin", facing: -1, armR: [[22, -10], [30 + 8 * Math.sin(f * 0.5), -52]] as A2, armRFront: true }
        : { expr: "smug", facing: 1, armR: [[30, 0], [54, -6 + 4 * pat]] as A2, armRFront: true, headTilt: 5 }), { shadow: true }),
      climber("dealer2", 28.0, 0, { expr: "joy" }), climber("dealer3", 29.8, 1), climber("dealer4", 31.6, 2),
      painter("painter1", PLANK1, f, 4, 1), painter("painter2", PLANK2, f, 5, -1)],
    focus: [19.1, 5.4, 26.6], subj: null,
  };
};
lens(893, 6, 1);

// ---- S12 (956-1058) "One dealer, André Poisson, / wants it badly, / but his wife isn't sure."
// On the landing Poisson hugs a girder with starry eyes (sparkles); the camera tracks along the railing past him to
// his wife one step below, arms folded, giving him the side-eye.
const PL: V3 = [13.7, 0, 29.4], WL: V3 = [14.9, 0, 30.0];
SHOT_CAMS[12] = () => [
  K(956, F((f) => fit([body(PL, 0, 2.05, 0.4)], lerp(22, 30, sm(f, 956, 1004)), 4, 40, 0.66, 0, 0), 956, 0.0014)),
  K(1000, F((f) => fit([body(PL, 0, 2.05, 0.4), body(WL)], lerp(34, 38, sm(f, 1000, 1058)), 4, 40, 0.82, 0, 0), 1000, 0.0014), 30),
];
SHOT_ACTS[12] = (f, s) => {
  const hug = sm(f, 960, 972), fold = f > 1020;
  return {
    ctl: { rust: 1, fair: 0, glow: 0 },
    cast: [C("poisson", PL, pose(null, { expr: "joy", facing: faceTo(12, s, f, PL, [20, 0, 26]), headTilt: -6 * hug, armR: [[22, 6], [lerp(30, 6, hug), lerp(30, 4, hug)]] as A2, armL: [[-22, 6], [lerp(-30, -6, hug), lerp(30, 4, hug)]] as A2, armRFront: true, armLFront: true, mouth: talk(f, 990, 1004), bob: 1.5 * Math.sin(f * 0.4) }), { idx: 1 }),
      C("mmePoisson", WL, pose(null, { expr: fold ? "dismay" : "neutral", facing: faceTo(12, s, f, WL, PL), headTilt: fold ? 6 : 0, armL: [[-20, 20], [8, 26]], armR: [[20, 20], [-8, 30]], armLFront: true, armRFront: true }), { idx: 2 }),
      climberStill("dealer2", f),
      painter("painter1", PLANK1, f, 4, 1), painter("painter2", PLANK2, f, 5, -1)],
    fx: f < 1030 ? [{ kind: "card", key: "starEyes" + st(f, 3), pos: [PL[0], 1.95, PL[2] + 0.1], w: 0.7, h: 0.5, soft: true, cw: 128, ch: 96,
      draw: (p) => { const g = p.g; for (let i = 0; i < 5; i++) { const a = (st(f, 2) * 0.2 + i * 1.3) % 6.28, x = 64 + Math.cos(a) * 44, y = 48 + Math.sin(a) * 30; g.fillStyle = i % 2 ? "#ffd166" : "#fff3c4"; g.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 4 : 10, b = (k * Math.PI) / 5; g.lineTo(x + Math.cos(b) * r, y + Math.sin(b) * r); } g.fill(); } } }] as FxSpec[] : [],
    focus: f < 1004 ? [PL[0], 1.5, PL[2]] : [14.3, 1.5, 29.7], subj: f < 1000 ? "poisson" : f < 1016 ? null : "mmePoisson",
  };
};
lens(956, 6, 1);

// ---- S13 (1058-1111) "Why would a minister / meet us in a hotel?"  Profile two-shot drifting sideways: the wife
// wags her finger at Poisson (lip-sync); he shrinks.
SHOT_CAMS[13] = () => [K(1058, F((f) => fit([body(PL, 0, 2.05, 0.4), body(WL)], lerp(34, 28, sm(f, 1058, 1111)), 3, 36, 0.8, lerp(0.1, -0.1, sm(f, 1058, 1111)), 0), 1058, 0.002))];
SHOT_ACTS[13] = (f, s) => {
  const wag = Math.sin(f * 0.8) * 10;
  return {
    ctl: { rust: 1, fair: 0, glow: 0 },
    cast: [C("mmePoisson", WL, pose(null, { expr: "angry", facing: faceTo(13, s, f, WL, PL), mouth: talk(f, 1060, 1102), armR: [[24, -6], [36 + wag * 0.3, -40 + wag]] as A2, armRFront: true, headTilt: 3 * Math.sin(f * 0.3) }), { idx: 2 }),
      C("poisson", PL, pose(null, { expr: "sheepish", facing: faceTo(13, s, f, PL, WL), squash: 0.1 * sm(f, 1066, 1080), headTilt: -5, armL: [[-20, 20], [-6, 40]], armR: [[20, 20], [6, 40]] }), { idx: 1 }),
      painter("painter1", PLANK1, f, 4, 1)],
    focus: [14.3, 1.5, 29.7], subj: "mmePoisson",
  };
};
lens(1058, 7, 1);

// ---- S18 (1512-1573) gold sun (light change): "Poisson pays the bribe / and the price."
// The biggest view of the tower: low, gold-lit, sunburst and sparkles behind it; the camera tilts down the leg to
// the handover: Poisson slips over the envelope, then heaves the suitcase over; Lustig hands him a deed.
SHOT_CAMS[18] = () => [
  K(1512, (f) => { const c = fit([body(L1), body(P1, 0, 2.05, 0.4)], -18, 1, 40, 0.8, 0, -0.1); return { pos: [c.pos[0], c.pos[1] - 0.25, c.pos[2]], look: [lerp(8.5, 7.0, sm(f, 1512, 1524)), lerp(42, 30, sm(f, 1512, 1524)), lerp(18, 24, sm(f, 1512, 1524))], fov: 46 }; }),
  K(1518, F(() => fit([body(L1), body(P1, 0, 2.05, 0.4)], -18, 1, 40, 0.8, 0, -0.1), 1518, 0.002, [[1552, 0.005, 12]]), 26),
];
SHOT_ACTS[18] = (f, s) => {
  const env = sm(f, 1536, 1542) - sm(f, 1547, 1550), cs = sm(f, 1552, 1560);
  return {
    ctl: { rust: 1, fair: 0, glow: 1 },
    cast: [C("lustig", L1, pose(null, { expr: cs > 0.5 ? "joy" : "sly", facing: faceTo(18, s, f, L1, P1), armR: [[26, 6], [lerp(34, 52, Math.max(env, cs)), lerp(30, 10, Math.max(env, cs))]] as A2, armRFront: true, propR: cs > 0.6 ? "suitcase" : f >= 1541 && env > 0.3 ? "envelope" : undefined,
        armL: f > 1556 ? [[-26, 4], [-46, -4]] as A2 : undefined, propL: f > 1556 ? "deed" : undefined }), { shadow: true }),
      C("poisson", P1, pose(null, { expr: cs > 0.2 ? "strain" : "grin", facing: faceTo(18, s, f, P1, L1), armR: [[26, 6], [lerp(30, 52, Math.max(env, 1 - cs)), 10]] as A2, armRFront: true, propR: cs < 0.6 && f > 1546 ? "suitcase" : f < 1541 && env > 0.3 ? "envelope" : undefined, tilt: -5 * cs })),
      C("mmePoisson", M1, pose(null, { expr: "dismay", facing: faceTo(18, s, f, M1, P1), armL: [[-20, 20], [8, 26]], armR: [[20, 20], [-8, 30]], armLFront: true, armRFront: true })),
      ...towerExtras(18, s, f, 2)],
    focus: f < 1526 ? undefined : [6.0, 1.5, 39.5], subj: f < 1540 ? null : undefined,
  };
};
lens(1512, 0, 1); lens(1526, 5, 14);

// ---- S21 (1741-1836) bright morning: "So a month later, / Lustig comes back to Paris, / and guess what he's selling?"
// Lustig strolls back in with his suitcase past three NEW dealers waiting by the leg; he sets the suitcase down beside
// the FOR SALE placard, his fedora slips over one eye, he pushes it back and holds a sly grin at them (1.0 s), ending on
// "selling?" - which loops into frame 1 ("This man is selling the Eiffel Tower").
const LE0: V3 = [16.3, 0, 43.4], LE1: V3 = [13.5, 0, 41.0];
const NEWD: [string, V3][] = [["dealer4", [12.5, 0, 38.3]], ["buyer", [13.4, 0, 37.9]], ["clerk2", [11.6, 0, 38.8]]];
const lusS21 = (f: number) => along([LE0, LE1], 0.05, 1741, f);
SHOT_CAMS[21] = () => [
  K(1741, (f) => { const p = lusS21(f).p, k = sm(f, 1741, 1790); return { pos: [p[0] + lerp(2.6, 1.6, k), lerp(1.7, 1.5, k), p[2] + lerp(4.6, 4.4, k)], look: [p[0] - 0.7, 1.35, p[2] - 1.8], fov: 40 }; }),
  K(1790, F(() => fit([body(LE1, 0, 2.15, 0.36)], 20, -9, 40, 0.62, -0.18, -0.12), 1790, 0.0018), 28),
];
SHOT_ACTS[21] = (f, s) => {
  const L = lusS21(f), down = sm(f, 1786, 1794), slip = sm(f, 1794, 1798), push = sm(f, 1800, 1806);
  let lo: P;
  if (L.moving) lo = { expr: "smug", mode: "walk", phase: ph(f, 16), facing: screenSide(21, s, f, L.d[0], L.d[1]), propR: "suitcase", armR: ARMS.holdR, armRFront: true };
  else if (f < 1800) lo = { expr: slip > 0.5 ? "sheepish" : "smug", facing: faceTo(21, s, f, L.p, NEWD[0][1]), tilt: 10 * down * (1 - slip), propR: down < 0.9 ? "suitcase" : undefined, armR: [[24, 20], [30, lerp(44, 60, down)]] as A2, armRFront: true, hatTilt: 22 * slip, hatLift: -0.05 * slip };
  else lo = { expr: "sly", facing: faceTo(21, s, f, L.p, NEWD[0][1]), hatTilt: 22 * (1 - push), hatLift: -0.05 * (1 - push), armL: push < 1 ? [[-24, -12], [-20, -58]] as A2 : [[-24, 30], [-10, 52]] as A2, armR: [[26, 20], [34, 50]] as A2, headTilt: 3, mouth: f > 1826 ? "smirk" as MouthK : undefined };
  return {
    ctl: { rust: 1, fair: 0, glow: 0 },
    cast: [C("lustig", L.p, pose(null, lo), { shadow: true }),
      ...NEWD.map(([who, p], i) => C(who, p, pose(null, { expr: f > 1800 ? "grin" : "talk", facing: faceTo(21, s, f, p, L.p), bob: f > 1800 ? 2 * Math.sin(f * 0.5 + i) : 0, armR: i === 1 ? ARMS.holdR : undefined, propR: i === 1 ? "moneybag" : undefined, armRFront: true }), { idx: 30 + i })),
      painter("painter1", PLANK1, f, 4, 1), painter("painter2", PLANK2, f, 5, -1), walker(21, s, "paris2", [8, 0, 44.5], [16, 0, 46.5], f, 6, "basket", 1.0)],
    fx: f >= 1792 ? [{ kind: "card", key: "caseDown", pos: [LE1[0] + 0.42, 0.21, LE1[2] + 0.12], w: 0.5, h: 0.42, cw: 160, ch: 128,
      draw: (p) => { p.poly([[14, 40], [146, 40], [150, 122], [10, 122]], "#9a5a2c", 6); p.band([[60, 40], [60, 22], [100, 22], [100, 40]], "#5a3a1e", 9, 3, "round"); p.poly([[40, 56], [52, 56], [52, 72], [40, 72]], "#f2c230", 3); p.poly([[108, 56], [120, 56], [120, 72], [108, 72]], "#f2c230", 3); } }] as FxSpec[] : [],
    focus: [L.p[0], 1.6, L.p[2]],
  };
};
lens(1741, 5, 1); lens(1790, 8, 20);
