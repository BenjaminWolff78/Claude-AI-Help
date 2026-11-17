// =====================================================================================================================
// scenes 3-6: the key at dusk, the empty first week, the returns (kid, grandma, the truck), the return room payoff.
const BIN = LIB.BIN;
const bump01 = (f: number, a: number, b: number) => Math.sin(Math.PI * clamp01((f - a) / (b - a)));
const KEYP: V3 = [BIN[0] + 0.22, 0.55, BIN[2] + 0.42];
const SLOT: V3 = [BIN[0], 1.0, BIN[2] + 0.39];
const MB: V3 = [2.25, 0, -0.8], GB: V3 = [3.6, 0, -0.5];
/** coins jumping out of a rattled cash box */
const coins = (pos: V3, f: number, a: number): FxSpec[] => [0, 1, 2].map((i) => {
  const t = f - a - i * 3; if (t < 0 || t > 14) return null;
  const up = 0.05 * t - 0.0042 * t * t;
  return { kind: "card", key: "dime" + (Math.floor(t / 2) % 3), pos: [pos[0] + (i - 1) * 0.06, pos[1] + 0.1 + up, pos[2] + 0.04], w: 0.05, h: 0.05, cw: 32, ch: 32,
    draw: (p: Pen) => { const g = p.g; g.fillStyle = "#c8ccd4"; g.strokeStyle = INKC; g.lineWidth = 3; g.beginPath(); g.ellipse(16, 16, 12, 12 * Math.abs(Math.cos(t * 0.8)) + 2, 0, 0, 6.3); g.fill(); g.stroke(); } } as FxSpec;
}).filter((x): x is FxSpec => !!x);

// ================================================= SCENE 3 (679-789) THE BIN AT DUSK (hard cut on the key)
const s11a = (f: number): Shot => { const k = sm(f, 679, 700); return { pos: [KEYP[0] + 0.12, KEYP[1] + 0.08, KEYP[2] + lerp(0.42, 0.5, k)], look: [KEYP[0] - 0.02, KEYP[1], KEYP[2]], fov: 48, roll: 0 }; };
const SH11 = frameTwo(head(MB), head(GB), 6, 26, 76, 54, 0.12, 0.4);
const s11 = F(() => SH11, 716, 0.0018);
const SH12 = frameOn(head(GB), -12, 0.3, 54, 52, 0.08, 0.41);
const s12 = F(() => SH12, 762, 0.0026);
const sIntoBin = (f: number): Shot => { const k = sm(f, 786, 808); return { pos: [BIN[0], lerp(1.9, 0.86, k), lerp(0.4, BIN[2] + 0.16, k)], look: [BIN[0], lerp(0.9, 0.32, k), BIN[2] - lerp(0.3, 0.26, k)], fov: lerp(52, 76, k), roll: 0 }; };   // into the bin through the open hatch (inside: the brown walls)
SHOT_CAMS[3] = () => [K(679, s11a, 1, true),
  K(699, glideTo(s11a, 699, s11, 724, 0.15), 1),          // pull back from the key to the two-shot as the hatch swings
  K(754, glideTo(s11, 754, s12, 763), 1),                  // quick push to Gary and the FINES box
  K(788, glideTo(s12, 788, sIntoBin, 800, 0.2), 1)];       // push down into the open bin
const binDusk = (f: number): Ctl => ({ lamps: 1, libLit: 1, keyOn: f < 796 ? 1 : 0, keyTurn: sm(f, 684, 692), hatch: sm(f, 702, 716), binFill: 0, truckOn: 0, signP: 2, signFly: 1, told: 0 });
SHOT_ACTS[3] = (f, s) => {
  const fMG = toward(3, s, f, MB, GB), fGM = toward(3, s, f, GB, MB), fMBin = toward(3, s, f, MB, BIN);
  const marge = C("marge", MB, speak(f, 738, 757, flow(f, [
    [679, { expr: "calm", facing: fMBin, armR: [[28, 10], [50, 22]] as A2, armRFront: true }],
    [700, { expr: "calm", facing: fMBin, armR: [[30, 12], [56, 26]] as A2, armRFront: true, tilt: 4 }, 6],    // swings the hatch open
    [722, { expr: "calm", facing: fMBin, tilt: 0, armR: [[24, 16], [30, 30]] as A2, armRFront: true }, 6],
    [734, { expr: "calm", facing: fMG, armL: [[-24, 14], [-12, 26]] as A2, armLFront: true }, 6],
    [748, { expr: "smug", facing: fMG }, 6],                                                                     // tiny smirk on "open"
  ])), { idx: 1 });
  const gw = f >= 790 ? lerp3(GB, add3(GB, 2.0, 0, 0.6), sm(f, 790, 830)) : GB;
  const gary = C("gary", gw, f >= 790 ? pose(null, { expr: "tache", mode: "walk", phase: ph(f, 15), facing: toward(3, s, f, GB, add3(GB, 2, 0, 0.6)), propR: "cashbox", armR: AR.carryR, armRFront: true }) : flow(f, [
    [679, { expr: "tache", facing: fGM, armR: AR.carryR, armRFront: true, propR: "cashbox" }],
    [712, { expr: "worry", facing: fGM, armR: AR.carryR, armRFront: true, propR: "cashbox", look: -0.4 }, 6],
    [758, { expr: "tache", facing: fGM, armR: [[24, -2], [40, -16]] as A2, armRFront: true, propR: "cashbox" }, 6],                // lifts the box
    [768, { expr: "tache", facing: fGM, armR: [[24, -4], [42, -20]] as A2, armRFront: true, propR: "cashbox", shake: 1, phase: f / 3 }, 3],   // rattles it
    [780, { expr: "tacheUp", facing: fGM, armR: AR.shrugR, armL: AR.shrugL, armRFront: true, propR: "cashbox", headTilt: 6 }, 5],             // shrugs
  ]), { idx: 3 });
  const fx = fxs(coins([GB[0] + 0.3, 1.0, GB[2] + 0.1], f, 770), leaf("d1", [0.8, 0.9, 0.4], f, 690), leaf("d2", [5.6, 1.6, 0.2], f, 735, [-1, -0.2]),
    f >= 686 && f < 700 ? sparkle("click", add3(KEYP, 0.02, 0.05, 0.05), f - 686, 0.12) : null);
  return { ctl: binDusk(f), cast: [marge, gary], fx, focus: follow(f, [[679, KEYP], [716, head(MB), 18], [742, head(MB)], [763, head(GB), 8], [800, add3(BIN, 0, 0.4, 0), 12]]), subj: f < 700 ? null : f < 756 ? "marge" : f < 790 ? "gary" : null };
};
KICKS.push([688 / 30, 0.1]);
lens3([[679, B_INS], [700, B_MS, 20], [756, B_MS, 8], [790, B_INS, 12]]);

// ================================================= SCENE 4 (789-907) THE FIRST WEEK, OVERCAST: the empty bin, TOLD YOU
const sBinIn = (f: number): Shot => ({ pos: [BIN[0] + 0.04 * Math.sin(f * 0.03), 0.86, BIN[2] + 0.16], look: [BIN[0], 0.32, BIN[2] - 0.26], fov: 76, roll: 0.03 * Math.sin(f * 0.02) });
const binWide = (f: number) => { const az = lerp(4, 30, sm(f, 850, 1010)), gx = lerp(1.0, 0.85, sm(f, 900, 960)); return fit([box(BIN, 0.2, 1.6, 0.46), body(add3(BIN, gx, 0, 0.95), 0.2, 1.65, 0.28), body(add3(BIN, -0.15, 0, 0.62), 0.3, 1.35, 0.25)], az, 6, 50, 0.92, 0.05, -0.05); };
const s14 = (f: number): Shot => ({ ...binWide(f), roll: 0 });
SHOT_CAMS[4] = () => [K(780, sIntoBin, 1, true), K(806, glideTo(sIntoBin, 806, sBinIn, 812), 1),
  K(838, glideTo(sBinIn, 838, s14, 858, 0.25, [0, 0, 0], 0.5), 1)];   // rise straight back out
const GT: V3 = [BIN[0] + 0.95, 0, BIN[2] + 0.95];
SHOT_ACTS[4] = (f, s) => {
  const fGBin = toward(4, s, f, GT, BIN);
  const GX: V3 = [5.7, 0, -2.3], leaving = f >= 896, gp = leaving ? lerp3(GT, GX, sm(f, 896, 940)) : GT;
  const gary = C("gary", gp, leaving ? pose(null, { expr: "tacheUp", mode: "walk", phase: ph(f, 15), facing: toward(4, s, f, GT, GX) }) : flow(f, [
    [840, { expr: "tacheUp", facing: fGBin, armR: [[26, 4], [46, -6]] as A2, armRFront: true, propR: "tape" }],
    [856, { expr: "tacheUp", facing: fGBin, armR: [[28, 0], [54, -4]] as A2, armL: [[-8, 2], [30, -4]] as A2, armRFront: true, armLFront: true, tilt: 5 }, 4],   // tapes the sign on
    [872, { expr: "smug", facing: fGBin, armR: [[30, 4], [56, 2]] as A2, armRFront: true, tilt: 7 }, 3],               // slaps it flat
    [888, { expr: "tacheUp", facing: toward(4, s, f, GT, add3(GT, 0, 0, 3)), armR: [[28, -4], [50, -10]] as A2, armRFront: true }, 5],   // taps it, smug at us
  ]), { idx: 3 });
  const ctl: Ctl = { lamps: 0, libLit: 0, hatch: 1, keyOn: 0, binFill: 0, spider: sm(f, 818, 834), leaf: f >= 808 && f < 846 ? (f - 808) / 38 : -1, told: f >= 858 ? Math.min(1, (f - 858) / 6) : 0, truckOn: 0, signP: 2, signFly: 1 };
  const fx = fxs(leaf("w1", [1.0, 1.4, 0.6], f, 852), leaf("w2", [5.4, 1.9, 0.1], f, 872, [-1, -0.3]),
    f >= 858 && f < 870 ? squiggles("tape", add3(SLOT, 0.35, -0.12, 0.05), f, "#ffffff", 0.18) : null);
  return { ctl, cast: f >= 836 ? [gary] : [], fx, focus: follow(f, [[789, add3(BIN, 0, 0.35, 0)], [858, head(GT), 16], [900, add3(SLOT, 0, -0.2, 0), 14]]), subj: f < 850 ? null : "gary" };
};
lens3([[806, B_INS, 6], [840, B_FS, 18]]);

// ================================================= SCENE 5 (907-1100) BRIGHT MORNING: the kid, grandma, the truck
const KID: V3 = [BIN[0] - 0.15, 0, BIN[2] + 0.62], GM0: V3 = [BIN[0] + 3.2, 0, BIN[2] + 1.8], GM1: V3 = [BIN[0] + 0.85, 0, BIN[2] + 1.05];
const truckZ5 = (f: number) => lerp(1.4, -4.2, sm(f, 1012, 1090));
const dwCab = (f: number): V3 => { const zr = truckZ5(f), b = bedAt(zr, 2.25); return [-1.5 - 1.02, b[1] + 0.12, b[2] + 0.15]; };   // leaning out of the driver's window, looking back up the steps
const GDOOR: V3 = [0.7, FL, -6.3];
const sTruck = (f: number): Shot => { const d = dwCab(f), k = sm(f, 1012, 1094); return { pos: [d[0] - lerp(2.3, 2.0, k), d[1] + lerp(0.95, 2.0, k), d[2] + lerp(1.8, 0.9, k)], look: [d[0] + 0.25, d[1] + lerp(0.75, 0.45, k), d[2] - lerp(0.4, 1.5, k)], fov: 60, roll: 0 }; };   // driver's side: Dwayne leaning out, the steps behind; cranes up as it climbs
const sDive = (f: number): Shot => { const k = sm(f, 1092, 1106); return { pos: lerp3([SLOT[0] + 0.5, 1.5, SLOT[2] + 1.6], [SLOT[0], 1.0, SLOT[2] + 0.05], k), look: [SLOT[0], 0.98, SLOT[2] - 0.6], fov: 54, roll: 0 }; };
SHOT_CAMS[5] = () => [K(880, s14, 1, true),
  K(1006, swing(s14, 1006, sTruck, 1016, 0.2), 1),      // whip to the truck backing up the steps
  K(1088, glideTo(sTruck, 1088, sDive, 1100, 0.4), 1)]; // swoop down and dive through the slot
SHOT_ACTS[5] = (f, s) => {
  const cast: CastPlace[] = [];
  if (f < 940) cast.push(C("gary", lerp3(GT, [5.7, 0, -2.3], sm(f, 896, 940)), pose(null, { expr: "tacheUp", mode: "walk", phase: ph(f, 15), facing: toward(5, s, f, GT, [5.7, 0, -2.3]) }), { idx: 3 }));   // off to the right, behind the bin
  // the kid tiptoes and slides a comic in (912-950), then skips off
  const kp = f < 918 ? lerp3(add3(KID, -1.4, 0, 0.9), KID, sm(f, 905, 918)) : f < 950 ? KID : lerp3(KID, add3(KID, -2.2, 0, 1.6), sm(f, 950, 985));
  if (f < 990) cast.push(C("libkid", kp, f < 918 || f >= 950 ? pose(null, { expr: "joy", mode: "walk", phase: ph(f, 11), facing: toward(5, s, f, kp, f < 918 ? KID : add3(KID, -2.2, 0, 1.6)) }) : flow(f, [
    [918, { expr: "joy", facing: toward(5, s, f, KID, BIN), lift: 0.06, armR: [[24, -18], [36, -44]] as A2, armRFront: true, propR: "comic" }],
    [926, { expr: "joy", facing: toward(5, s, f, KID, BIN), lift: 0.1, armR: [[26, -22], [44, -48]] as A2, armRFront: true }, 3],   // slides it in
    [936, { expr: "beam", facing: toward(5, s, f, KID, add3(KID, 0, 0, 3)), lift: 0 }, 6],
  ]), { idx: 8 }));
  // grandma wheels her barrow in (940-985), tips it (985-1000)
  const gp = lerp3(GM0, GM1, sm(f, 935, 985));
  cast.push(C("grandma", add3(gp, 0, 0, 0.75), f < 985 ? pose(null, { expr: "beam", mode: "walk", phase: ph(f, 18), facing: toward(5, s, f, GM0, GM1), armR: AR.carryR, armL: [[-24, 26], [-12, 40]] as A2, armRFront: true, armLFront: true }) :
    pose(null, { expr: "beam", facing: toward(5, s, f, GM1, BIN), tilt: 8 * sm(f, 985, 996), armR: [[24, -4], [44, -24]] as A2, armL: [[-4, -4], [30, -24]] as A2, armRFront: true, armLFront: true }), { idx: 9 }));
  // the truck and Dwayne (from 1006), Gary small at the doors, gaping
  if (f >= 1000) {
    cast.push(C("dwayne", dwCab(f), pose(null, { expr: "determined", mode: "sit", facing: toward(5, s, f, dwCab(f), [dwCab(f)[0], 0, dwCab(f)[2] - 4]), look: -0.6, tilt: -8, armL: [[-24, -8], [-36, 4]] as A2, armLFront: true }), { idx: 2, scale: 0.92 }));
    const gd = lerp3([-0.6, FL, -9.6], GDOOR, sm(f, 1000, 1034));
    cast.push(C("gary", gd, f < 1034 ? pose(null, { expr: "tache", mode: "walk", phase: ph(f, 15), facing: toward(5, s, f, [-0.6, FL, -9.6], GDOOR) }) : flow(f, [[1034, { expr: "tache", facing: 0 }], [1084, { expr: "shock", facing: 0, sweat: 1, armR: AR.shrugR, armL: AR.shrugL }, 4]]), { idx: 3 }));
  }
  const bump = (f: number) => { const z = truckZ5(f); let b = 0; for (let i = 0; i < 8; i++) { const e = LIB.STEP0 - LIB.RUN * i; b = Math.max(b, Math.max(0, 1 - Math.abs(z - e) / 0.18)); } return b; };
  const ctl: Ctl = { lamps: 0, libLit: 0, hatch: 0, keyOn: 0, told: f < 1086 ? 1 : 0, binFill: lin(f, 920, 1000) * 0.5, flap: f >= 924 && f < 940 ? bump01(f, 924, 940) : f >= 988 && f < 1004 ? bump01(f, 988, 1004) : 0,
    barrowOn: 1, barrowX: gp[0], barrowZ: gp[2] - 0.05, barrowYaw: Math.atan2(GM1[0] - GM0[0], GM1[2] - GM0[2]) + Math.PI, barrowTip: sm(f, 986, 1000),
    truckOn: f >= 1000 ? 1 : 0, truckZ: truckZ5(f), truckX: -1.5, truckBob: bump(f), tailgate: 0, truckBooks: 1, signP: 2, signFly: 1 };
  const fx = fxs(leaf("m1", [1.4, 1.5, 0.5], f, 912), leaf("m2", [5.0, 2.0, -0.4], f, 960, [-1, 0.2]),
    f >= 926 && f < 938 ? sparkle("comic", SLOT, f - 926, 0.16) : null, f >= 990 && f < 1004 ? dustCard("tip", add3(SLOT, 0.3, -0.1, 0.2), 0.3, 1 - (f - 990) / 14, 8) : null,
    f >= 1018 ? dustTrail("tyres", [-1.5, 0.05, truckZ5(f) + 0.2], [0, 1], f, 6, 0.9, 0.9) : [],
    f >= 1018 && f < 1092 && Math.floor((f - 1018) / 10) % 2 === 0 ? popCard("beep", [-1.5, 1.6, truckZ5(f) - 1.3], 0.32, 0.18, f, 1018 + Math.floor((f - 1018) / 20) * 20, 1028 + Math.floor((f - 1018) / 20) * 20, (g) => { g.fillStyle = "#ffe14a"; g.strokeStyle = INKC; g.lineWidth = 10; g.font = "900 150px Arial Black, Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.strokeText("BEEP", 256, 256); g.fillText("BEEP", 256, 256); }) : null);
  return { ctl, cast, fx, focus: follow(f, [[907, add3(SLOT, -0.2, 0.2, 0.3)], [926, SLOT, 6], [960, head(add3(gp, 0, 0, 0.75)), 20], [1016, (g: number) => add3(dwCab(g), 0, 0.85, 0), 8], [1100, SLOT, 10]]),
    subj: f < 940 ? "libkid" : f < 1006 ? "grandma" : "dwayne" };
};
KICKS.push([1036 / 30, 0.12], [1050 / 30, 0.12], [1064 / 30, 0.12]);
lens3([[907, B_FS], [1006, B_WS, 10], [1092, B_INS, 10]]);

// ================================================= SCENE 6 (1100-1310) THE RETURN ROOM: the avalanche, +240%, the shovel, the key
const CH = LIB.CHUTE, MT = LIB.MOUNTAIN;
const MS: V3 = [-5.25, FL, -17.75], KT: V3 = LIB.TALLY, KTP: V3 = [-3.7, FL, -23.2], GDR: V3 = [-4.2, FL, -13.9];
const sChute = (f: number): Shot => { const k = sm(f, 1100, 1182); return { pos: [lerp(CH[0] + 0.9, -2.9, k), lerp(CH[1] + 0.1, FL + 1.0, k) + 0.6 * Math.sin(Math.PI * k), lerp(CH[2], -15.4, k)], look: [lerp(MT[0] + 0.5, MT[0] + 0.4, k), lerp(FL + 1.4, FL + 1.75, k), lerp(MT[2], MT[2] - 0.2, k)], fov: lerp(60, 56, k), roll: 0 }; };   // down the ramp, then low: the mountain's silhouette against the window light
const ROOM6: Room = { x0: -9.7, x1: -2.25, z0: -23.7, z1: -14.25, y1: 7.6 };
const SH16 = inRoom(frameOn(head(MS), 22, 0.22, 42, 54, 0.2, 0.42), ROOM6);   // from the front: the cart on the right, not in front of her
const s16 = F(() => SH16, 1196, 0.0016);
const SH17g = inRoom(frameOn(head(GDR), 150, 0.3, 50, 52, 0.05, 0.41), ROOM6);
const s17g = F(() => SH17g, 1266, 0.003);
const SH17 = inRoom(frameOn(head(MS), 60, 0.34, 46, 50, 0.05, 0.41), ROOM6);
const s17 = F(() => SH17, 1286, 0.004);
const sToChute = (f: number): Shot => { const k = sm(f, 1300, 1314); return { pos: lerp3(s17(1300).pos, [CH[0] + 0.55, CH[1] + 0.05, CH[2]], k), look: [CH[0] - 0.3, CH[1] + 0.02, CH[2]], fov: lerp(50, 54, k), roll: 0 }; };
const sTally = F(() => ({ pos: [-4.0, FL + 1.75, -20.3] as V3, look: [-4.3, FL + 1.85, -23.6] as V3, fov: 54 }), 1160, 0.003);
SHOT_CAMS[6] = () => [K(1092, sDive, 1, true),
  K(1100, sChute, 1, true),                               // out of the slot = the chute mouth inside, crane down the book mountain
  K(1148, swing(sChute, 1148, sTally, 1158, 0.15), 1),    // whip to Kevin dragging the tally to +240%
  K(1180, glideTo(sTally, 1180, s16, 1202, 0.3), 1),      // glide to Marge shovelling
  K(1274, swing(s16, 1274, s17g, 1281, 0.05), 1),          // quick whip to Gary at the door
  K(1288, swing(s17g, 1288, s17, 1295, 0.05), 1),          // back to Marge and the key
  K(1298, glideTo(s17, 1298, sToChute, 1314, 0.1), 1)];   // push into the chute slot (shape match to the mail slot)
SHOT_ACTS[6] = (f, s) => {
  const fMcart = toward(6, s, f, MS, [-4.0, FL, -17.0]), fMheap = toward(6, s, f, MS, MT);
  const shovel = Math.floor((f - 1196) / 20) % 2 === 0;
  const marge = C("marge", MS, flow(f, [
    [1100, { expr: "joy", facing: fMheap, mode: "brace", braceK: 0.5, armR: [[26, 14], [44, 34]] as A2, armL: [[-4, 10], [22, 30]] as A2, armRFront: true, armLFront: true, propR: "shovel", propRAng: 0.6 }],
    [1196, { expr: "joy", facing: shovel ? fMheap : fMcart, mode: "brace", braceK: 0.7, tilt: shovel ? 10 : -4, armR: shovel ? [[26, 16], [46, 36]] as A2 : [[26, -4], [46, -20]] as A2, armL: [[-4, 10], [22, shovel ? 30 : -8]] as A2, armRFront: true, armLFront: true, propR: "shovel", propRAng: shovel ? 0.7 : -0.3 }, 8],
    [1262, { expr: "joy", facing: fMcart, armR: [[24, 10], [30, 24]] as A2, armRFront: true, propR: "shovel", propRAng: 0.2 }, 6],
    [1285, { expr: "calm", facing: toward(6, s, f, MS, GDR) }, 6],
    [1292, { expr: "smug", facing: toward(6, s, f, MS, GDR), armL: [[-22, -16], [-30, -44]] as A2, armLFront: true, propL: "loopKey", propLAng: Math.sin(f * 0.5) * 0.8 }, 4],   // lifts the key, twirls it
    [1300, { expr: "smug", facing: toward(6, s, f, MS, GDR), armL: [[-22, -16], [-30, -44]] as A2, armLFront: true, propL: "loopKey", propLAng: (f - 1300) * 0.6, headTilt: -6 }, 4],
  ]), { idx: 1 });
  const kevin = C("kevin", KTP, flow(f, [
    [1100, { expr: "grin", facing: toward(6, s, f, KTP, KT), armR: [[22, -8], [40, -26]] as A2, armRFront: true, propR: "marker" }],
    [1146, { expr: "eureka", facing: toward(6, s, f, KTP, KT), armR: [[24, -20], [44, -50]] as A2, armRFront: true, propR: "marker", lift: 0.04 }, 24],   // drags the line up
    [1172, { expr: "joy", facing: toward(6, s, f, KTP, MS), armR: AR.waveR, armRFront: true, propR: "marker" }, 6],
  ]), { idx: 7 });
  const cast: CastPlace[] = [marge, kevin];
  if (f >= 1262) cast.push(C("gary", GDR, flow(f, [[1274, { expr: "shock", facing: toward(6, s, f, GDR, MS), sweat: 1, armR: [[24, 4], [36, -8]] as A2, armRFront: true }], [1282, { expr: "aghast", facing: toward(6, s, f, GDR, MS), sweat: 1, headBack: 0.3 }, 4]]), { idx: 3 }));
  const ctl: Ctl = { pend: 1.4, pm: 0b101000, bk: 0, rr: 1, pour: f < 1240 ? 1 : 1 - lin(f, 1240, 1280), mountain: lerp(0.55, 1, sm(f, 1100, 1175)), tally: sm(f, 1146, 1170), dayDust: 1, cart: lerp(0.3, 1, lin(f, 1196, 1262)) };
  const fx = fxs(f >= 1196 && f < 1262 && (f - 1196) % 40 < 12 ? dustCard("shov", add3(MS, -0.6, 0.5, -0.3), 0.35, 1 - ((f - 1196) % 40) / 12, 9) : null,
    f >= 1100 && f < 1180 ? dustTrail("aval", [MT[0] + 1.0, FL + 0.4, MT[2] + 0.6], [0.8, 0.6], f, 7, 1.0, 1.2) : [],
    f >= 1170 && f < 1190 ? glowBurst("pct", add3(KT, 0.6, 0.3, 0.1), 0.9, bump01(f, 1170, 1190)) : null,
    f >= 1296 && f < 1310 ? sparkle("key", add3(MS, -0.4, 1.75, 0.1), f - 1296, 0.22) : null);
  return { ctl, cast, fx, focus: follow(f, [[1100, [MT[0] + 0.3, FL + 1.4, MT[2]]], [1158, add3(KT, 0.4, 0, 0), 10], [1200, head(MS), 20], [1281, head(GDR), 7], [1295, add3(MS, -0.35, 1.6, 0), 7], [1312, [CH[0], CH[1], CH[2]], 12]]),
    subj: f < 1150 ? null : f < 1182 ? "kevin" : f < 1276 ? "marge" : f < 1291 ? "gary" : "marge" };
};
KICKS.push([1171 / 30, 0.2]);
lens3([[1100, B_WS, 4], [1196, B_FS, 16], [1262, B_CU, 8], [1300, B_INS, 12]]);
KEY_PUNCH.push(688, 738, 779, 829, 859, 926, 992, 1034, 1170, 1271, 1298);
