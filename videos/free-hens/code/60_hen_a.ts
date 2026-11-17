// =====================================================================================================================
// "They Gave Away Free Hens and the Garbage Vanished" (2026-11-17), master prompt v19: scenes 1-3 (the gate, the street,
// the first week). Shot list in /home/claude/p5/checkpoints/CP2_plan.md. Faces: Odile = calm half-lid, smug on the
// payoff, never shock. Bruno = mock / guffaw, smug while honking, then worry and beam. Luc = joy, scheme with the fork.
const SW = 0.12;
const hen = (who: string, pos: V3, o: P, idx: number, sc = 0.82): CastPlace => C(who, pos, { expr: "neutral", ...o } as FigOpts, { idx, scale: sc });
/** a hen hopping along an arc from a to b between frames f0..f1 (flapping on the way), standing at either end */
const henHop = (who: string, a: V3, b: V3, f: number, f0: number, f1: number, idx: number, facing: number, h = 0.5, sc = 0.82, end: P = {}): CastPlace => {
  const u = lin(f, f0, f1), air = f > f0 && f < f1;
  const p: V3 = [lerp(a[0], b[0], u), lerp(a[1], b[1], u) + h * Math.sin(Math.PI * u), lerp(a[2], b[2], u)];
  return hen(who, p, air ? { mode: "air", phase: (f - f0) / 5, facing } : f >= f1 ? { facing, ...end } : { facing, mode: "stand", phase: f / 30 }, idx, sc);
};
/** a hen pecking at the ground on a 22-frame loop (head down for 8 frames) */
const pecker = (who: string, pos: V3, f: number, idx: number, facing: number, seed = 0, sc = 0.82): CastPlace => {
  const t = ((f + seed * 7) % 22 + 22) % 22, tilt = t < 4 ? 30 * t / 4 : t < 10 ? 30 : t < 14 ? 30 * (14 - t) / 4 : 0;
  return hen(who, pos, { tilt, facing, phase: f / 40, headTilt: t > 14 ? 8 * Math.sin(f * 0.3 + seed) : 0 }, idx, sc);
};
// Bruno's truck in the street scenes: rear-centre at TX, cab head through the open north window
const TX2 = -9.35, TZ2 = -1.75;
const cabHead = (tx: number, tz = TZ2): V3 => [tx + 2.35, 2.25, tz - 0.95];
const cabSeat = (tx: number, tz = TZ2): V3 => [tx + 2.35, 0.95, tz - 0.95];

// ================================================= SCENE 1 (0-118) LUC'S GATE, MORNING
const O1: V3 = [-0.75, SW, -4.35], L1: V3 = [0.45, SW, -5.75];
const SH1 = { pos: [-0.32, 1.55, -1.15] as V3, look: [-0.28, 1.32, -5.0] as V3, fov: 50 };
const s1c = F(() => SH1, 24, 0.0016);
const s1 = (f: number): Shot => { const c = s1c(f); if (f >= 24) return c; const k = 1 - Math.pow(1 - f / 24, 3), far = lerp3(c.look, c.pos, 1.6); return { ...c, pos: lerp3([far[0] + 0.4, far[1] - 0.3, far[2]], c.pos, k) }; };
SHOT_CAMS[1] = () => [K(0, s1, 1, true)];
SHOT_ACTS[1] = (f, s) => {
  const fOL = toward(1, s, f, O1, L1), fLO = toward(1, s, f, L1, O1);
  const odile = C("odile", O1, flow(f, [
    [0, { expr: "calm", facing: fOL, propR: "hen", armR: [[22, 2], [40, -8]] as A2, armRFront: true }],
    [12, { expr: "calm", facing: fOL, tilt: 3, propR: "hen", propK: 0.3, armR: [[24, -8], [44, -24]] as A2, armRFront: true }, 8],
    [34, { expr: "smile", facing: fOL, tilt: 6, propR: f < 42 ? "hen" : undefined, armR: [[32, -4], [62, -10]] as A2, armRFront: true }, 8],    // hands it over the gate
    [50, { expr: "calm", facing: fOL, armR: AR.downR, armRFront: true }, 8],
    [70, { expr: "stern", facing: fOL, tilt: 5, armR: [[30, 4], [54, 18]] as A2, armRFront: true }, 6],                                     // pushes the fork down
    [84, { expr: "calm", facing: fOL, tilt: 4, propR: "henTag", armR: [[30, -2], [56, -6]] as A2, armRFront: true }, 6],                      // snaps the tag on
    [98, { expr: "smug", facing: fOL, armR: AR.downR, armRFront: true }, 8],
  ]), { idx: 1 });
  const luc = C("luc", L1, flow(f, [
    [0, { expr: "joy", facing: fLO, armL: [[-24, 4], [-40, -6]] as A2, armLFront: true }],
    [38, { expr: "joy", facing: fLO, propL: f >= 42 ? "hen" : undefined, armL: [[-26, 2], [-44, -8]] as A2, armLFront: true }, 6],          // takes the hen
    [54, { expr: "scheme", facing: fLO, tilt: -3, propL: "hen", armL: [[-24, 4], [-40, -6]] as A2, armLFront: true, propR: "fork", armR: [[22, -10], [32, -36]] as A2, armRFront: true }, 6],
    [74, { expr: "sheepish", facing: fLO, propL: "hen", armL: [[-24, 4], [-40, -6]] as A2, armLFront: true, propR: "fork", armR: [[20, 16], [28, 34]] as A2, armRFront: true }, 6],
    [102, { expr: "yikes", facing: fLO, headBack: 0.6, propL: "hen", propK: f >= 102 && f < 114 ? 1 : 0, armL: [[-24, -2], [-36, -22]] as A2, armLFront: true, propR: "fork", armR: [[20, 16], [28, 34]] as A2, armRFront: true }, 4],
  ]), { idx: 2 });
  const cartHen = pecker("henBlack", [-2.0, 1.04, -4.0], f, 3, 1, 2, 0.62);
  const ctl: Ctl = { truckX: -40, cart: 1, cartX: -2.0, cartZ: -4.0, cartYaw: 0, clockH: 8.4, b3v: 0 };
  return { ctl, cast: [odile, luc, cartHen], fx: [], focus: follow(f, [[0, head(O1)], [44, head(L1), 10]]), subj: f < 44 ? "odile" : "luc" };
};
lens3([[0, B_MS]]);

// ================================================= SCENE 2 (118-638) THE STREET: TRUCK, HOPPER, CART, BRUNO, THE CAFÉ
const RD: V3 = [TX2 - 1.7, 1.75, TZ2 - 1.2];
const SH2a = { pos: [-11.4, 1.65, -6.5] as V3, look: [-10.5, 1.85, -2.9] as V3, fov: 58 };
const s2a = F(() => SH2a, 127, 0.0016);
const SH2b = { pos: [TX2 - 0.5, 4.9, 0.7] as V3, look: [TX2 - 0.1, 2.9, -1.2] as V3, fov: 50 };
const s2b = F(() => SH2b, 206, 0.0012);
// Odile walks east pushing the cart (from x -2.6 at 277 to x 3.0 at 367)
const oWalk = (f: number): V3 => [lerp(-2.6, 3.0, lin(f, 277, 367)), SW, -4.25];
const s2c = (f: number): Shot => { const o = oWalk(f); return { pos: [o[0] - 0.2, 1.5, -1.0], look: [o[0] + 0.35, 1.15, -4.6], fov: 54, roll: 0 }; };
const BRH = cabHead(TX2), O2: V3 = [-6.55, SW, -3.35];
const SH2d = frameOn(BRH, 144, 0.3, 44, 50, 0.05, 0.42);
const s2d = F(() => SH2d, 376, 0.002);
const SH2e = frameTwo(BRH, head(O2), 180, 66, 32, 50, 0.5, 0.42);
const s2e = F(() => SH2e, 486, 0.0016);
const SH2f = { pos: [-5.7, 1.65, 3.0] as V3, look: [-5.0, 0.95, 7.0] as V3, fov: 56 };
const s2f = F(() => SH2f, 563, 0.002);
SHOT_CAMS[2] = () => [K(118, swing(s1, 118, s2a, 127, 0.1), 1),          // whip left onto the truck's readout
  K(196, glideTo(s2a, 196, s2b, 208, 0.6, [0, 0, 0], 0.5), 1),            // fast rise to above the open hopper
  K(277, glideTo(s2b, 277, s2c, 297, 0.9, [0, 0, 0], 0, 0.3), 1),         // crane down onto Odile and her cart
  K(367, swing(s2c, 367, s2d, 376, 0.1), 1),                              // whip back to Bruno in his cab
  K(462, glideTo(s2d, 462, s2e, 486, 0.2, [0.4, 0, 0]), 1),               // slow orbit to the side-on two-shot
  K(554, swing(s2e, 554, s2f, 563, 2.6), 1)];                            // whip across the street to the café
SHOT_ACTS[2] = (f, s) => {
  const cast: CastPlace[] = [];
  const ctl: Ctl = { truckX: TX2, truckZ: TZ2, load: f < 230 ? 0.55 : 0.55 + 0.1 * lin(f, 230, 262), lift: sm(f, 128, 182), tip: sm(f, 198, 214) * (1 - sm(f, 300, 330)), dump: lin(f, 212, 264), lidT: sm(f, 200, 210), dangle: f > 250 && f < 300 ? 1 : 0,
    liftBinOn: f >= 125 ? 1 : 0, tons: lerp(2.4, 2.45, lin(f, 150, 176)), pay: lerp(1240, 1265, lin(f, 150, 176)), coins: lin(f, 166, 200), b2v: f < 125 ? 1 : 0,
    cart: 1, cartX: f < 277 ? -2.0 : oWalk(f)[0] + 1.15, cartZ: -4.0, b3v: 0, clockH: f < 554 ? 11.97 + 0.03 * lin(f, 300, 554) : 12.0 + 0.004 * lin(f, 554, 638), chalk: 1, aboard: sm(f, 606, 624), spring: 0 };
  // Bruno in the cab (seat height; the cab's lower side hides his body)
  const fB = f < 554 ? toward(2, s, f, cabSeat(TX2), O2) : -1;
  const bruno = C("bruno", cabSeat(TX2), f < 462 ? flow(f, [
    [118, { expr: "smug", facing: fB, armR: [[20, 10], [30, 28]] as A2, armRFront: true }],
    [180, { expr: "strain", facing: fB, tilt: 6, armR: [[22, 16], [34, 34]] as A2, armRFront: true }, 6],                 // yanks the lift lever
    [200, { expr: "smug", facing: fB, armR: [[20, 10], [30, 28]] as A2, armRFront: true }, 8],
    [378, { expr: "mock", facing: fB, armR: AB.pointR, armRFront: true }, 6],                                               // points at the hens
    [394, { ...laughP(f, 394, 1), facing: fB, headBack: 1, armR: [[24, 10], [40, 20]] as A2, armRFront: true }, 6],          // head back laughing
    [416, { ...laughP(f, 416, 0), facing: fB, tilt: 14, headBack: 0.2, armR: [[20, 20], [34, 38]] as A2, armRFront: true }, 6],   // slumps onto the horn
  ]) : speak(f, 462, 548, flow(f, [
    [462, { expr: "mock", facing: fB, armR: [[22, -6], [6, -30]] as A2, armRFront: true }],                                  // thumb back at the hopper
    [490, { expr: "smug", facing: fB, armR: [[28, -4], [54, -10]] as A2, armRFront: true }, 6],                              // wags a finger at the hen
    [512, { expr: "yikes", facing: fB, headBack: 0.5, armR: [[24, 8], [28, -16]] as A2, armRFront: true }, 3],               // pecked: yanks it back
    [526, { expr: "dismay", facing: fB, armR: [[22, 6], [26 + 6 * Math.sin(f * 1.1), -12]] as A2, armRFront: true }, 6],      // shakes the finger
  ])), { idx: 10 });
  if (f >= 150 && f < 554) cast.push(bruno);
  // Odile with the cart, Zoé and grandma at the gates
  if (f >= 277 && f < 367) {
    const o = oWalk(f), walking = f < 360;
    cast.push(C("odile", o, flow(f, [
      [277, { expr: "calm", mode: "walk", phase: ph(f, 16), facing: toward(2, s, f, o, [o[0] + 2, 0, o[2]]), armR: [[28, 10], [50, 14]] as A2, armRFront: true, propL: "clipboard", armL: [[-20, 8], [-30, -4]] as A2 }],
      [346, { expr: "smug", mode: walking ? "walk" : "stand", phase: ph(f, 16), facing: toward(2, s, f, o, [o[0] + 2, 0, o[2]]), armR: [[22, -6], [16, -26]] as A2, armRFront: true, propL: "clipboard", armL: [[-20, 8], [-30, -4]] as A2 }, 6],   // ticks 31
    ]), { idx: 1 }));
    cast.push(C("zoe", [0.25, SW, -5.7], flow(f, [[277, { expr: "joy", facing: 1, armR: [[20, 6], [30, -4]] as A2, armRFront: true }], [300, { expr: "joy", facing: 1, propR: "henW", tilt: -5 * Math.sin(f * 0.25), armR: [[18, 4], [26, -6]] as A2, armRFront: true }, 6]]), { idx: 4 }));
    cast.push(C("granny2", [4.6, SW, -3.95], flow(f, [[277, { expr: "smile", facing: -1, armR: AR.downR, armL: [[-20, 20], [-30, 34]] as A2 }], [326, { expr: "joy", facing: -1, propR: "hen", propL: "henB", armR: [[20, 6], [30, -4]] as A2, armL: [[-20, 6], [-30, -4]] as A2, armRFront: true, armLFront: true }, 8]]), { idx: 5 }));
    // a pair of hens hops off the cart over Luc's gate into the front garden; two more peck on the cart
    const cx = oWalk(f)[0] + 1.15;
    cast.push(henHop("rousse", [cx, 1.04, -4.0], [0.6, SW, -6.2], f, 280, 296, 20, 1, 0.7));
    cast.push(pecker("henBlack", [cx - 0.3, 1.04, -4.05], f, 22, 1, 3, 0.6), pecker("henGold", [cx + 0.25, 1.04, -3.95], f, 23, -1, 5, 0.6));
  }
  // the two-shot: Odile on the kerb with Neige in her arms
  if (f >= 367 && f < 554) { const oA: V3 = [-4.9, SW, -3.95], oP = f < 440 ? oA : f < 466 ? lerp3(oA, O2, lin(f, 440, 466)) : O2, oW = f >= 440 && f < 466;
  cast.push(C("odile", oP, oW ? pose(null, { expr: "calm", mode: "walk", phase: ph(f, 15), facing: toward(2, s, f, oA, O2), propR: "henW", armR: [[20, 6], [34, -2]] as A2, armRFront: true }) : flow(f, [
    [462, { expr: "calm", facing: toward(2, s, f, O2, cabSeat(TX2)), propR: "henW", armR: [[20, 6], [34, -2]] as A2, armRFront: true }],
    [508, { expr: "calm", facing: toward(2, s, f, O2, cabSeat(TX2)), propR: "henW", propK: f >= 510 && f < 520 ? 0.6 : 0, armR: [[24, 2], [42, -10]] as A2, armRFront: true }, 4],   // the hen lunges
    [530, { expr: "smug", facing: toward(2, s, f, O2, cabSeat(TX2)), propR: "henW", armR: [[20, 6], [34, -2]] as A2, armRFront: true, armL: [[-10, 4], [14, -6]] as A2, armLFront: true }, 8],   // strokes it
  ]), { idx: 1 })); }
  // pigeons on the cab roof burst up at the HONK (425)
  if (f >= 367 && f < 462) for (let i = 0; i < 3; i++) { const t = f - 425 - i * 2, x0 = TX2 + 1.7 + i * 0.45, base: V3 = [x0, 2.74, TZ2 - 0.2 + i * 0.3];
    cast.push(C("pigeon", t < 0 ? base : [x0 + 0.06 * t, 2.74 + 0.07 * t + 0.002 * t * t, base[2] - 0.02 * t], t < 0 ? { mode: "stand", phase: f / 24 + i, facing: i % 2 ? 1 : -1 } : { mode: "air", phase: t / 4 + i, facing: 1 }, { idx: 30 + i, scale: 0.45, air: t >= 0 })); }
  // the café at lunch: Henri, two regulars, the baker
  if (f >= 118) {
    const flap = (i: number) => ({ armR: [[30, 0 + 10 * Math.sin((f - 568) * 0.5 + i)], [40, 10 + 14 * Math.sin((f - 568) * 0.5 + i)]] as A2, armL: [[-30, 0 + 10 * Math.sin((f - 568) * 0.5 + i)], [-40, 10 + 14 * Math.sin((f - 568) * 0.5 + i)]] as A2 });
    cast.push(C("henri", [-5.21, SW, 7.58], flow(f, [[118, { expr: "mock", mode: "sit", facing: -1, armR: AR.downR }], [568, { ...laughP(f, 568, 0), mode: "sit", facing: -1, ...flap(0) }, 6], [588, { ...laughP(f, 588, 1), mode: "sit", facing: -1, propR: "drumstick", armR: [[22, -20], [30, -52]] as A2, armRFront: true }, 6]]), { idx: 40 }));
    cast.push(C("regBeret", [-7.78, SW, 6.78], f < 568 ? pose(null, { expr: "smile", mode: "sit", facing: 1 }) : pose(null, { ...laughP(f, 568, 1), mode: "sit", facing: 1, ...flap(1.3) }), { idx: 41 }));
    cast.push(C("regBlonde", [-4.06, SW, 6.82], f < 572 ? pose(null, { expr: "smile", mode: "sit", facing: -1 }) : pose(null, { ...laughP(f, 572, 0), mode: "sit", facing: -1, ...flap(2.1) }), { idx: 42 }));
    cast.push(C("hbaker", [-6.3, SW, 8.7], flow(f, [[118, { expr: "grin", facing: 1, propR: "baguette", armR: [[20, 10], [30, 0]] as A2, armRFront: true }], [604, { ...laughP(f, 604, 1), facing: 1, propR: "baguette", propRAng: 0.4 * Math.sin((f - 604) * 0.6), armR: [[24, -10], [40, -30]] as A2, armRFront: true }, 6]]), { idx: 43 }));
  }
  const fx = fxs(f >= 425 && f < 440 ? bang([TX2 + 2.6, 2.4, TZ2 - 1.3], f - 425) : null);
  const focus = follow(f, [[118, RD], [127, RD, 4], [206, [TX2 - 0.6, 2.6, -1.0], 10], [297, (g: number) => add3(oWalk(g), 0, 1.3, 0), 18], [376, BRH, 8], [486, lerp3(BRH, head(O2), 0.5), 20], [563, [-5.21, 1.3, 7.58], 8]]);
  return { ctl, cast, fx, focus, subj: f < 196 ? null : f < 277 ? null : f < 367 ? "odile" : f < 554 ? "bruno" : "henri" };
};
KICKS.push([425 / 30, 0.22], [168 / 30, 0.08]);
lens3([[118, B_MS], [206, B_WS, 8], [297, B_FS, 12], [376, B_CU, 8], [486, B_MS, 16], [563, B_FS, 8]]);

// ================================================= SCENE 3 (638-787) THE FIRST WEEK: THE HEAPED TRUCK HONKS ALONG
const tX3 = (f: number) => -19.5 + 0.17 * (f - 638);
const o3 = (f: number): V3 => [-13.0 + 0.04 * (f - 638), SW, -4.35];
const s3 = (f: number): Shot => { const o = o3(f), k = creep(f, 638, 0.0012); const look: V3 = [o[0] - 0.6, 1.5, -3.4]; return { pos: lerp3(look, [o[0] + 0.25, 2.15, -7.6], k), look, fov: 60, roll: 0 }; };
SHOT_CAMS[3] = () => [K(638, s3, 1, true)];
SHOT_ACTS[3] = (f, s) => {
  const tx = tX3(f), o = o3(f);
  const honk = (f >= 662 && f < 676) || (f >= 712 && f < 726) || (f >= 742 && f < 750);
  const ctl: Ctl = { b0v: 0, b1v: 0, b2v: 0, truckX: tx, truckZ: TZ2, load: 1, heap: 1, truckBob: 1, tons: 2.4, pay: 1240, tumble: f < 690 ? -1 : lin(f, 690, 706), tumbleX0: tX3(690), cart: 0, spring: 0, clockH: 9.1 };
  const fB = toward(3, s, f, cabSeat(tx), o);
  const bruno = C("bruno", cabSeat(tx), flow(f, [
    [638, { expr: "smug", facing: fB, armR: [[20, 10], [30, 28]] as A2, armRFront: true }],
    [660, { expr: honk ? "mock" : "smug", facing: fB, mouth: honk ? "O" : undefined, armR: [[30, -6], [56, -26]] as A2, armRFront: true }, 6],     // leans out, waving his cap hand
    [740, { expr: "mock", facing: fB, armR: AB.pointR, armRFront: true }, 6],                                                                       // points at the full hopper
  ]), { idx: 10 });
  const odile = C("odile", o, pose(null, { expr: "calm", mode: "walk", phase: ph(f, 17), facing: toward(3, s, f, o, [o[0] + 1, 0, o[2]]), propR: "coffeeCup",
    armR: f >= 760 && f < 784 ? [[26, -12], [36, -40]] as A2 : f >= 728 && f < 744 ? [[18, -2], [10, -24]] as A2 : [[20, 10], [30, 0]] as A2, armRFront: true, look: 0.2 }), { idx: 1 });   // sips; raises the cup
  const fx = fxs(honk ? { kind: "card", key: "honk" + (Math.floor(f / 3) % 2), pos: [tx + 3.3, 2.3, TZ2 - 1.3], w: 0.5, h: 0.32, cw: 160, ch: 100, draw: (p) => { const g = p.g; g.strokeStyle = "#ffffff"; g.lineWidth = 7; g.lineCap = "round"; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(20, 50, 34 + i * 22 + (Math.floor(f / 3) % 2) * 6, -0.6, 0.6); g.stroke(); } } } as FxSpec : null);
  return { ctl, cast: [bruno, odile], fx, focus: follow(f, [[638, (g: number) => head(o3(g))], [716, (g: number) => cabHead(tX3(g)), 8], [742, (g: number) => head(o3(g)), 8]]), subj: f < 708 || f >= 742 ? "odile" : "bruno" };
};
KICKS.push([663 / 30, 0.08], [713 / 30, 0.08]);
lens3([[638, B_FS]]);
