
// =====================================================================================================================
// HOTEL DU LYS salon. Room x -4.6..4.6, z -4.2 (windows) .. 5.6 (doors). Table x -0.62..0.62, z -1.5..1.9 (top 0.78),
// chairs x +-0.65..1.25; the tower model at [0.3, 0.78, -0.95]. Head of the table [0, 0, -2.3]; whisper corner
// [2.45 / 3.2, 0, -2.9]. Keep-out: HOTEL_SOLIDS.
// =====================================================================================================================
const HV = 0.06; // arrival walking speed (m/frame)
const ARRIVE: { who: string; f0: number; path: V3[] }[] = [
  { who: "dealer3", f0: 500, path: [[-0.55, 0, 6.0], [-0.55, 0, 4.4], [-1.62, 0, 2.6], [-1.62, 0, -0.85]] },
  { who: "dealer2", f0: 500, path: [[0.55, 0, 6.0], [0.55, 0, 4.4], [1.62, 0, 2.6], [1.62, 0, -0.85]] },
  { who: "poisson", f0: 520, path: [[-1.8, 0, 6.7], [-0.3, 0, 5.2], [-0.55, 0, 4.4], [-1.62, 0, 2.6], [-1.62, 0, 0.75]] },
  { who: "dealer4", f0: 524, path: [[1.8, 0, 6.7], [0.3, 0, 5.2], [0.55, 0, 4.4], [1.62, 0, 2.6], [1.62, 0, 0.75]] },
];
const HEAD: V3 = [0, 0, -2.3], MODEL_P: V3 = [0.3, 0.78, -0.95], BYMODEL: V3 = [0.98, 0, -1.62], CORD: V3 = [1.3, 0, -3.3];
const dealerAt = (who: string, f: number) => { const a = ARRIVE.find((x) => x.who === who)!; return along(a.path, HV, a.f0, f).p; };
/** the arriving / seated-round-the-table dealers (shared by S07-S09) */
const dealers = (id: number, s: SetDef, f: number, mood: (who: string, i: number) => P = () => ({})): CastPlace[] =>
  ARRIVE.map((a, i) => {
    const w = along(a.path, HV, a.f0, f), toL = faceTo(id, s, f, w.p, f < 640 ? HEAD : BYMODEL);
    const invite = f < 620 ? { propR: "invite", armR: [[24, -8], [(34 + 6 * Math.sin(st(f) * 0.5 + i)) , -30]] as A2, armRFront: true } : {};
    if (w.moving) return C(a.who, w.p, pose(null, { expr: "grin", mode: "walk", phase: ph(f + i * 5, 14), facing: screenSide(id, s, f, w.d[0], w.d[1]), ...invite }), { idx: 10 + i });
    return C(a.who, w.p, pose(null, { expr: "smile", facing: toL, ...invite, ...mood(a.who, i) }), { idx: 10 + i });
  });
const hotelCtl = (f: number, extra: Ctl = {}): Ctl => ({ doors: sm(f, 480, 496), curtain: 0, night: 0, ...extra });
const salonExtras = (id: number, s: SetDef, f: number): CastPlace[] => [
  waiterTray(id, s, "waiter", [3.3, 0, 2.9], [2.4, 0, 4.0], f, 0),
  sweeper("paris4", [-3.45, 0, 1.6], f, 1, 1, "broom"),
];

// ---- S07 (510-606) "and invites the city's biggest scrap dealers / to a fancy hotel."
// The double doors swing open and the dealers walk in waving their invitations; the camera trucks along the left side
// of the room with them (they pass it in three-quarter), then swings round to Lustig already waiting at the head of
// the table, who throws his arms wide on "fancy hotel".
const groupLook = (f: number): V3 => {
  const ps = ARRIVE.map((a) => dealerAt(a.who, f)).filter((p) => p[2] < 5.4);
  if (!ps.length) return [0, 1.3, 4.6];
  const c = ps.reduce((m, p) => [m[0] + p[0] / ps.length, 0, m[2] + p[2] / ps.length], [0, 0, 0]);
  return [c[0], 1.3, c[2]];
};
SHOT_CAMS[7] = () => [
  K(510, (f) => { const k = sm(f, 510, 566); return { pos: [lerp(-0.75, -1.3, k), lerp(2.25, 2.1, k), lerp(-3.65, -3.4, k)], look: [lerp(0.15, 0.3, k), lerp(1.35, 1.25, k), lerp(4.2, 2.0, k)], fov: 50 }; }),
  K(548, F((f) => fit([body(HEAD), body(dealerAt("dealer3", f))], -22, 14, 46, 0.84, 0, 0), 548, 0.0016), 46),
];
SHOT_ACTS[7] = (f, s) => {
  const wide = sm(f, 578, 586);
  const lo: P = wide > 0.05
    ? { expr: "grin", armL: [[-30, 20], lerp2([-8, 58], ARMS.wideL[1], wide)] as A2, armR: [[30, 20], lerp2([8, 58], ARMS.wideR[1], wide)] as A2, mouth: talk(f, 584, 594), headTilt: 4 * wide }
    : { expr: "smug", armR: ARMS.reachR, armRFront: true };
  return {
    ctl: hotelCtl(f),
    cast: [C("lustig", HEAD, pose(null, { ...lo, back: f < 566, facing: f < 566 ? 0 : faceTo(7, s, f, HEAD, [-1.6, 0, 2]) }), { shadow: true }), ...dealers(7, s, f), ...salonExtras(7, s, f)],
    focus: f < 566 ? groupLook(f) : [0, 1.5, -2.3], subj: f < 545 ? "dealer3" : f < 590 ? null : undefined,
  };
};
lens(510, 5, 1);

// ---- S08 (606-667) "But how do you sell / something you don't own?"
// Lustig strolls to the model and lays his hand on the tower like an owner (title #4); the dealers lean in. The camera
// glides down to a low angle just over the table top, the model big in the foreground, and keeps drifting right.
const lustigS08 = (f: number) => along([HEAD, [0.75, 0, -2.0], BYMODEL], 0.05, 612, f);
SHOT_CAMS[8] = () => [
  K(606, F((f) => fit([[MODEL_P, 0, 0.55, 0.28], body(lustigS08(f).p)], lerp(8, -2, sm(f, 606, 667)), 5, 42, 0.8, 0, 0.05), 606, 0.0018), 34),
];
SHOT_ACTS[8] = (f, s) => {
  const L = lustigS08(f), pat = f >= 642 ? Math.sin((f - 642) * 0.5) * (f < 662 ? 1 : 0) : 0;
  const lo: P = L.moving ? { expr: "smug", mode: "walk", phase: ph(f, 14), facing: screenSide(8, s, f, L.d[0], L.d[1]) }
    : { expr: f < 650 ? "smug" : "sly", facing: faceTo(8, s, f, L.p, MODEL_P), armR: [[30, 8], [lerp(40, 62, sm(f, 636, 642)), 18 + 4 * pat]] as A2, armRFront: true, headTilt: 3 };
  return {
    ctl: hotelCtl(f),
    cast: [C("lustig", L.p, pose(null, lo), { shadow: true }), ...dealers(8, s, f, (who, i) => ({ expr: "talk", tilt: 6 * faceTo(8, s, f, dealerAt(who, f), MODEL_P) * sm(f, 640, 652), mouth: f > 646 && i === 2 ? "O" : undefined })), ...salonExtras(8, s, f)],
    focus: [MODEL_P[0], 1.05, MODEL_P[2]],
  };
};
lens(606, 7, 14);

// ---- S09 (667-807) "First, he tells them it's top secret, / 7,000 tons of iron, / going to the highest bidder."
// A: over Poisson's shoulder (back view): Lustig puts a finger to his lips, hurries to the window and yanks the curtain
// shut on "secret" (the room darkens). HARD CUT 1 on "7,000": a low reverse from the window end, the dealers' eyes pop;
// "highest bidder": hands shoot up, one dealer hops; the camera cranes up and trucks left along them.
const lustigS09 = (f: number) => along([BYMODEL, [1.4, 0, -2.6], CORD], 0.1, 690, f);
SHOT_CAMS[9] = () => [
  K(667, F((f) => { const L = lustigS09(f).p; return fit([body(L), body(dealerAt("poisson", f), 0, 2.05, 0.4)], -35, 7, 44, 0.86, 0.15, 0); }, 667, 0.0012), 26),
  K(733, F((f) => fit([body([1.62, 0, -0.85]), body([1.62, 0, 0.75])], lerp(152, 140, sm(f, 740, 807)), lerp(6, 10, sm(f, 750, 807)), 44, 0.86, 0, 0), 733, 0.0016, [[733, 0.006, 10]]), 1, true),
];
SHOT_ACTS[9] = (f, s) => {
  const L = lustigS09(f), yank = sm(f, 706, 714);
  let lo: P;
  if (f < 690) lo = { expr: "sly", facing: faceTo(9, s, f, L.p, dealerAt("poisson", f)), armR: ARMS.shushR, armRFront: true, headTilt: -3 };
  else if (L.moving) lo = { expr: "determined", mode: "walk", phase: ph(f, 10), facing: screenSide(9, s, f, L.d[0], L.d[1]) };
  else lo = { expr: "smug", facing: faceTo(9, s, f, L.p, [0, 0, 0]), armR: [[24, -10], [30, lerp(-50, -10, yank)]] as A2, armRFront: false };
  const pop = f >= 733, bid = f >= 778;
  const mood = (who: string, i: number): P => {
    if (!pop) return { expr: f > 712 ? "dismay" : "talk", back: who === "poisson" && f < 733 };
    if (!bid) return { expr: "shock", squash: f < 740 ? 0.25 * Math.exp(-(f - 733) / 3) : 0, bob: 0 };
    const hop = who === "dealer2" ? Math.abs(Math.sin((f - 778) * 0.35)) * 6 : 0;
    return { expr: i % 2 ? "joy" : "grin", armR: ARMS.upR, armRFront: true, propR: "invite", bob: -hop, mouth: MOUTHS[(Math.floor(f / 4) + i) % MOUTHS.length] };
  };
  return {
    ctl: hotelCtl(f, { curtain: yank }),
    cast: [C("lustig", L.p, pose(null, lo), { shadow: true }), ...dealers(9, s, f, mood), ...salonExtras(9, s, f)],
    focus: f < 733 ? [L.p[0], 1.6, L.p[2]] : [1.62, 1.5, -0.05], subj: f < 733 ? undefined : "dealer2",
  };
};
lens(667, 6, 1); lens(733, 3, 1);

// ---- S14 (1111-1231) night blue: "So Lustig leans in and whispers, / he's a poor official, / and he'd like a little bribe."
// A: over Poisson's shoulder (back view) in the lamp-lit window corner, the lit tower outside: Lustig leans in with a
// cupped hand. B (poor official): the camera drifts round to a profile two-shot; he turns out an empty pocket, then
// pinches his fingers on "little bribe" while Poisson's eyes narrow. A waiter clears glasses behind them.
const WA: V3 = [2.45, 0, -2.95], WB: V3 = [3.2, 0, -2.8];
SHOT_CAMS[14] = () => [
  K(1111, hold([4.0, 1.78, -1.25], [2.45, 1.5, -3.05], 38, 1111, 0.0015)),
  K(1158, F(() => fit([body(WA), body(WB, 0, 2.05, 0.4)], 8, 2, 34, 0.8, 0, 0), 1158, 0.0022, [[1200, 0.0045, 18]]), 34),
];
SHOT_ACTS[14] = (f, s) => {
  const lean = sm(f, 1118, 1130) - sm(f, 1156, 1164);
  let lo: P;
  if (f < 1160) lo = { expr: "sly", facing: faceTo(14, s, f, WA, WB), tilt: 9 * lean, armR: ARMS.cupR, armRFront: true, mouth: talk(f, 1130, 1156) };
  else if (f < 1196) lo = { expr: "sheepish", facing: faceTo(14, s, f, WA, WB), armL: ARMS.palmL, armR: ARMS.palmR, armLFront: true, armRFront: true, mouth: talk(f, 1164, 1180), headTilt: -4 };
  else lo = { expr: "sly", facing: faceTo(14, s, f, WA, WB), tilt: 5, armR: ARMS.pinchR, armRFront: true, mouth: talk(f, 1200, 1216) };
  const po: P = f < 1158 ? { back: true, expr: "neutral", headTilt: -6 * lean }
    : { expr: f < 1196 ? "dismay" : "sly", facing: faceTo(14, s, f, WB, WA), armR: f >= 1205 ? [[20, 14], [16, -12]] as A2 : undefined, armRFront: true, headTilt: f >= 1205 ? 4 : 0 };
  return {
    ctl: { night: 1, curtain: 0, doors: 0 },
    cast: [C("lustig", WA, pose(null, lo), { shadow: true }), C("poisson", WB, pose(null, po)),
      C("waiter", [1.15, 0, -3.15], pose(null, { expr: "neutral", facing: -1, armR: [[24, 20], [30 + 6 * Math.sin(st(f) * 0.4), 34]], armRFront: true, propR: "tray" }), { idx: 40 })],
    focus: [2.8, 1.5, -2.9],
  };
};
lens(1111, 7, 1);

// ---- S15 (1231-1260) "That's the trick!"  HARD CUT 2: low angle with a 4 deg roll: Poisson's face lights up, he
// snaps his fingers and points at Lustig; the table lamp flares (glow card).
SHOT_CAMS[15] = () => [K(1231, hold([2.55, 0.72, -1.35], [3.05, 1.62, -2.85], 40, 1231, 0.0035, [[1236, 0.008, 10]], 0.07), 1, true)];
SHOT_ACTS[15] = (f, s) => ({
  ctl: { night: 1, curtain: 0, doors: 0 },
  cast: [C("poisson", WB, pose(null, { expr: "eureka", facing: faceTo(15, s, f, WB, WA), armR: f < 1238 ? [[22, -6], [26, -40]] as A2 : ARMS.reachR, armRFront: true, squash: f < 1240 ? 0.2 * Math.exp(-(f - 1233) / 3) : 0 })),
    C("lustig", WA, pose(null, { expr: "smug", facing: faceTo(15, s, f, WA, WB), armR: ARMS.pinchR, armRFront: true }))],
  fx: [{ kind: "card", key: "lampFlare", pos: [3.78, 1.25, -3.6], w: 1.4 * (1 + 0.6 * Math.exp(-Math.max(0, f - 1233) / 6)), h: 1.4 * (1 + 0.6 * Math.exp(-Math.max(0, f - 1233) / 6)), soft: true, cw: 128, ch: 128,
    draw: (p) => { const g = p.g.createRadialGradient(64, 64, 4, 64, 64, 64); g.addColorStop(0, "rgba(255,226,150,0.95)"); g.addColorStop(1, "rgba(255,190,90,0)"); p.g.fillStyle = g; p.g.fillRect(0, 0, 128, 128); } }] as FxSpec[],
  focus: [3.2, 1.6, -2.8], subj: "poisson",
});
lens(1231, 4, 1);
