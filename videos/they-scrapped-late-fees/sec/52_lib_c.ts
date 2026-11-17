// =====================================================================================================================
// scenes 7-10: Dwayne's flat (the explanation), the dodge across the street + the debate at the bin, Gary at dawn, the catch.
const AF = LIB.APT_FLOOR, AD = LIB.APT_DOOR;
const DWC: V3 = [2.2, AF, 16.75], DWK: V3 = [-0.72, AF, 15.5], DWW: V3 = [2.55, AF, 14.45];
const SLOT_A: V3 = [AD[0], AF + 1.0, AD[2] - 0.06];

// ================================================= SCENE 7 (1310-1420) DWAYNE'S FLAT, NIGHT
const sMail = (f: number): Shot => { const k = sm(f, 1318, 1334), dn = 0.55 * sm(f, 1310, 1318); return { pos: lerp3([SLOT_A[0] - 0.05, SLOT_A[1] + 0.02, SLOT_A[2] - 0.75], [3.55, AF + 1.45, 14.7], k), look: lerp3([SLOT_A[0], SLOT_A[1] - dn, SLOT_A[2]], [1.8, AF + 0.95, 16.3], k), fov: lerp(54, 60, k), roll: 0 }; };   // tilts down with the envelope, then pulls back
const sCloset = F(() => ({ pos: [2.6, AF + 1.35, 14.6] as V3, look: [-0.5, AF + 1.15, 15.6] as V3, fov: 58 }), 1336, 0.0026);
const SH18w = ots(head(DWW), [2.4, AF + 1.75, 13.0], -0.45, 1.75, 0.35, 54);
const s18w = F(() => SH18w, 1392, 0.0024);
SHOT_CAMS[7] = () => [K(1300, sMail, 1, true),
  K(1328, swing(sMail, 1328, sCloset, 1336, 0.05), 1),   // whip left as he runs to the closet (it bursts on 1338)
  K(1380, glideTo(sCloset, 1380, s18w, 1396, 0.2), 1)];   // follow him to the window, over his shoulder
SHOT_ACTS[7] = (f, s) => {
  const toCloset = f >= 1328 && f < 1346, atCloset = f >= 1346 && f < 1376, toWin = f >= 1376 && f < 1392;
  const p = f < 1328 ? DWC : toCloset ? lerp3(DWC, DWK, sm(f, 1328, 1346)) : atCloset ? DWK : toWin ? lerp3(DWK, DWW, sm(f, 1376, 1392)) : DWW;
  const o: P = f < 1328 ? flow(f, [
    [1300, { expr: "neutral", mode: "sit", facing: 0, propR: "soda", armR: [[22, 10], [26, -6]] as A2, armRFront: true }],
    [1316, { expr: "worry", mode: "sit", facing: toward(7, s, f, DWC, SLOT_A), look: 0.6, propR: "soda", armR: [[22, 10], [26, -6]] as A2, armRFront: true }, 5],   // the envelope lands
    [1322, { expr: "nervous", mode: "sit", facing: toward(7, s, f, DWC, SLOT_A), feetUp: 0.6 }, 3],                                                         // kicks it under the couch
  ]) : toCloset || toWin ? pose(null, { expr: toCloset ? "shock" : "nervous", mode: "run", phase: ph(f, 9), facing: toward(7, s, f, toCloset ? DWC : DWK, toCloset ? DWK : DWW), sweat: 1 })
    : atCloset ? flow(f, [
      [1346, { expr: "shock", facing: toward(7, s, f, DWK, [3, AF, 15.5]), sweat: 1, tilt: -10, armR: [[30, 0], [44, 20]] as A2, armL: [[-30, 0], [-44, 20]] as A2, armRFront: true, armLFront: true }],
      [1361, { expr: "strain", facing: toward(7, s, f, DWK, [3, AF, 15.5]), sweat: 1, tilt: -14, mode: "brace", braceK: 0.6, armR: [[30, 0], [44, 20]] as A2, armL: [[-30, 0], [-44, 20]] as A2 }, 3],   // slams it with his back
    ]) : flow(f, [
      [1392, { expr: "nervous", back: true, facing: 0, armR: [[22, -20], [30, -50]] as A2, armRFront: true }],
      [1403, { expr: "nervous", back: true, facing: 0, armR: [[22, 6], [30, 22]] as A2, armRFront: true }, 3],                                     // yanks the blinds cord
    ]);
  const cast = [C("dwayne", p, o, { idx: 2 })];
  const ctl: Ctl = { tv: 0.8 + 0.2 * Math.sin(f * 1.7) * Math.sin(f * 0.37), aptLamp: 1, libLit: 1, lamps: 0, envelope: f >= 1312 ? Math.min(1, (f - 1312) / 8) : -1, envKick: sm(f, 1322, 1330),
    closet: lin(f, 1336, 1348), closetShut: sm(f, 1358, 1364), blinds: sm(f, 1403, 1410), truckOn: 0 };
  const fx = fxs(f >= 1346 && f < 1376 ? [steamCard("sw1", add3(head(DWK), 0.25, 0.25, 0), 0.08, 0.5, 5)] : [], f >= 1361 && f < 1371 ? dustCard("slam", add3(DWK, -0.15, 1.2, 0), 0.4, 1 - (f - 1361) / 10, 10) : null);
  return { ctl, cast, fx, focus: follow(f, [[1310, SLOT_A], [1330, head(DWC, 0.85), 10], [1346, head(DWK), 8], [1394, head(DWW), 10], [1410, [2.5, AF + 1.6, 13.7], 8]]), subj: f < 1316 || f >= 1394 ? null : "dwayne" };
};
KICKS.push([1361 / 30, 0.2]);
lens3([[1310, B_INS], [1336, B_MS, 10], [1392, B_MS, 10]]);

// ================================================= SCENE 8 (1420-1631) ACROSS THE STREET, DAY: the dodge; the bin: cookie vs Pruitt
const MW0: V3 = [-5.7, 0, 12.0], MBX: V3 = LIB.MAILBOX, CAN: V3 = LIB.CAN, DWH: V3 = [MBX[0] - 0.05, 0, MBX[2] + 0.55];
const mAt = (f: number): V3 => { const d = 0.036 * Math.max(0, Math.min(f, 1474) - 1420) + 0.036 * Math.max(0, f - 1492); return [MW0[0] + d, 0, MW0[2]]; };
const canX = (f: number) => 1.6 * sm(f, 1514, 1534);
const sDodge = (f: number): Shot => { const m = mAt(f), bx2: Box[] = [body(m, 0.55, 2.0, 0.28), body(DWH, 0.3, 1.7, 0.28)]; const c = fit(bx2, 172, 4, 56, 0.82, 0, -0.05), c2 = fit([body(m, 0.55, 2.0, 0.28), body(DWH, 0.3, 1.7, 0.28), box(add3(CAN, canX(f), 0, 0), 0.2, 1.0, 0.3)], 172, 4, 56, 0.82, 0, -0.05), k = sm(f, 1478, 1494); return { pos: lerp3(c.pos, c2.pos, k), look: lerp3(c.look, c2.look, k), fov: 56, roll: 0 }; };   // Marge and the mailbox, widening to the trash can as he climbs in   // Marge and the hiding place both in frame, the track follows her
const MBn: V3 = [BIN[0] + 0.85, 0, BIN[2] + 0.75], DBn: V3 = [BIN[0] - 0.75, 0, BIN[2] + 0.75], PR: V3 = [BIN[0] + 1.55, 0, BIN[2] + 1.15];
const SH20 = fit([body(DBn, 0.75, 2.0, 0.28), body(MBn, 0.75, 2.0, 0.28), body(PR, 0.75, 2.0, 0.28), box(BIN, 1.0, 1.75, 0.3)], 8, 5, 52, 0.93, 0.05, 0);
const s20 = F(() => SH20, 1542, 0.002);
SHOT_CAMS[8] = () => [K(1420, sDodge, 1, true), K(1530, swing(sDodge, 1530, s20, 1540, 0.3), 1)];   // whip across the street to the bin
SHOT_ACTS[8] = (f, s) => {
  const cast: CastPlace[] = [];
  if (f < 1536) {
    const m = mAt(f), walking = f < 1474 || f >= 1492;
    cast.push(C("marge", m, walking ? pose(null, { expr: "neutral", mode: "walk", phase: ph(f, 15), facing: 1 }) : flow(f, [[1474, { expr: "neutral", facing: 1, look: 0.7 }], [1482, { expr: "neutral", facing: 1, look: -0.6, headTilt: 5 }, 6]]), { idx: 1 }));
    const inCan = f >= 1496;
    if (!inCan) cast.push(C("dwayne", f < 1430 ? [MBX[0] + 0.5, 0, MBX[2] + 0.2] : f < 1490 ? DWH : lerp3(DWH, [CAN[0], 0.4, CAN[2] + 0.1], sm(f, 1490, 1496)), flow(f, [
      [1420, { expr: "neutral", facing: -1, propR: "coffeeCup", armR: [[22, 10], [26, -6]] as A2, armRFront: true }],
      [1424, { expr: "shock", facing: -1, sweat: 1, armR: [[26, -20], [40, -50]] as A2, armRFront: true }, 3],                    // sees her, coffee flies
      [1432, { expr: "shock", facing: -1, mode: "brace", braceK: 1, squash: 0.4, sweat: 1 }, 5],                                  // ducks behind the mailbox
      [1440, { expr: "nervous", facing: -1, mode: "brace", braceK: 0.6, squash: 0.15, look: -0.6 }, 5],                           // peeks out
      [1455, { expr: "gulp", facing: -1, mode: "brace", braceK: 1, squash: 0.45 }, 4],                                            // ducks
      [1490, { expr: "nervous", facing: 1, mode: "air", tilt: 20 }, 4],                                                           // climbs into the can
    ]), { idx: 2 }));
  } else {
    // the bin: Dwayne tips his crate in, Marge's cookie jar, Mr. Pruitt
    const fDM = toward(8, s, f, DBn, MBn), fMD = toward(8, s, f, MBn, DBn), fPB = toward(8, s, f, PR, BIN);
    cast.push(C("dwayne", DBn, flow(f, [
      [1536, { expr: "joy", facing: toward(8, s, f, DBn, BIN), propR: "crate", armR: [[24, -4], [40, -20]] as A2, armL: [[-2, -4], [22, -20]] as A2, armRFront: true, armLFront: true, tilt: 8 }],
      [1548, { expr: "joy", facing: fDM }, 6],
      [1566, { expr: "beam", facing: fDM, armR: [[24, 6], [44, -4]] as A2, armRFront: true }, 5],
      [1571, { expr: "beam", facing: fDM, armR: [[22, -2], [14, -22]] as A2, armRFront: true, propR: "cookie" }, 4],      // takes a cookie, beams
    ]), { idx: 2 }));
    cast.push(C("marge", MBn, flow(f, [
      [1536, { expr: "proud", facing: fMD }],
      [1556, { expr: "proud", facing: fMD, armL: [[-24, 4], [-40, -4]] as A2, armLFront: true }, 6],                          // holds out the cookie jar (the jar is on the lid)
      [1600, { expr: "calm", facing: toward(8, s, f, MBn, PR), look: 0.3 }, 8],
    ]), { idx: 1 }));
    if (f >= 1576) cast.push(C("pruitt", f < 1586 ? lerp3(add3(PR, 1.4, 0, 0.6), PR, sm(f, 1576, 1586)) : PR, flow(f, [
      [1576, { expr: "tache", mode: f < 1586 ? "walk" : "stand", phase: ph(f, 15), facing: fPB, propR: "libBook", armR: AR.carryR, armRFront: true }],
      [1589, { expr: "tache", facing: fPB, armR: [[26, 4], [44, 12]] as A2, armRFront: true, propR: "libBook" }, 5],           // lays one neat book down
      [1603, { expr: "tache", facing: toward(8, s, f, PR, MBn), armR: AB.holdOutR, armRFront: true }, 6],                       // holds out his palm
      [1617, { expr: "shock", facing: toward(8, s, f, PR, MBn), armR: [[26, -6], [36, -30]] as A2, armRFront: true, sweat: 1 }, 2],   // the lid snaps on his fingers
    ]), { idx: 10 }));
  }
  // life on the street: a dog walker and the cyclist pass in the background
  const ctl: Ctl = { lamps: 0, libLit: 0, truckOn: 0, signP: 2, signFly: 1, hatch: 0, told: 0, binFill: f >= 1540 ? 0.8 : 0.5, jar: f >= 1536 ? 1 : 0, jarLid: f < 1556 ? 1 : f < 1612 ? 1 - sm(f, 1556, 1562) : sm(f, 1612, 1617),
    can: 1, canOpen: f < 1490 ? 0 : f < 1505 ? 1 - sm(f, 1500, 1505) : 0, canX: canX(f), canHop: f >= 1514 ? 1 : 0, flap: f >= 1540 && f < 1556 ? bump01(f, 1540, 1556) : 0 };
  const fx = fxs(f >= 1424 && f < 1446 ? splash("coffee2", [MBX[0] + 0.6, 1.4 - 0.02 * (f - 1424), MBX[2] + 0.1], f - 1424, 0.6) : [],
    f >= 1505 && f < 1515 ? clang("lid", [CAN[0], 1.05, CAN[2] + 0.2], f - 1505, 0.4) : null,
    f >= 1617 && f < 1627 ? clang("jar", [BIN[0] + 0.22, 1.7, BIN[2] + 0.2], f - 1617, 0.35) : null, leaf("s1", [-6, 1.6, 10.6], f, 1440));
  return { ctl, cast, fx, focus: follow(f, [[1420, head(DWH)], [1470, (g: number) => head(mAt(g)), 16], [1494, [CAN[0], 1.0, CAN[2]], 8], [1540, head(DBn), 8], [1592, head(PR), 16]]),
    subj: f < 1536 ? "dwayne" : f < 1589 ? "dwayne" : "pruitt" };
};
KICKS.push([1506 / 30, 0.15], [1618 / 30, 0.18]);
lens3([[1420, B_FS], [1530, B_MS, 10]]);

// ================================================= SCENE 9 (1631-1784) DAWN: Gary sneaks up and posts the 1994 book
const GS0: V3 = [6.8, 0, 0.6], GS1: V3 = [BIN[0] + 0.78, 0, BIN[2] + 0.62];   // at the bin's right side, reaching left to the slot
const gSneak = (f: number): V3 => lerp3(GS0, GS1, sm(f, 1645, 1700));
const sSneak = (f: number): Shot => { const g = gSneak(f), k = sm(f, 1631, 1745); return { pos: [lerp(g[0] + 1.2, SLOT[0] - 0.85, k), lerp(1.55, 1.3, k), lerp(g[2] + 3.0, SLOT[2] + 1.45, k)], look: [lerp(g[0] - 0.6, SLOT[0] + 0.72, k), lerp(1.3, 1.15, k), lerp(g[2] - 0.2, SLOT[2], k)], fov: 52, roll: 0 }; };   // ends on Gary's head and the slot together
const sInside = (f: number): Shot => ({ pos: [BIN[0], 0.74, BIN[2] - 0.18], look: [BIN[0], 1.0, BIN[2] + 0.3], fov: 74, roll: 0.04 * Math.sin(f * 0.04) });
SHOT_CAMS[9] = () => [K(1631, sSneak, 1, true), K(1752, glideTo(sSneak, 1752, sInside, 1766, 0.0), 1)];   // ends inside the bin, looking up at the slot (Rick: cameras inside things)
SHOT_ACTS[9] = (f, s) => {
  const g = gSneak(f), sneaking = f >= 1645 && f < 1700, fB = toward(9, s, f, GS1, BIN);
  const gary = C("garySpy", g, sneaking ? pose(null, { expr: "nervous", mode: "walk", phase: ph(f, 22), facing: toward(9, s, f, GS0, GS1), tilt: 10, squash: 0.12, look: f < 1676 ? -0.8 * sm(f, 1664, 1672) : 0.8 * sm(f, 1678, 1686) }) : flow(f, [
    [1631, { expr: "nervous", facing: fB, tilt: 6, look: 0 }],
    [1700, { expr: "nervous", facing: fB, tilt: 6, look: -0.8 }, 4], [1704, { expr: "nervous", facing: fB, look: 0.8 }, 4],
    [1708, { expr: "sly", facing: fB, look: -0.7 }, 5],
    [1717, { expr: "sly", facing: fB, armR: [[22, 8], [30, -6]] as A2, armRFront: true, propR: "coffeeBook" }, 6],          // pulls the book from his coat
    [1733, { expr: "sheepish", facing: toward(9, s, f, GS1, add3(GS1, 0.4, 0, 3)), armR: [[24, -12], [36, -34]] as A2, armRFront: true, propR: "coffeeBook" }, 6],   // holds it up: ring + date card
    [1746, { expr: "sly", facing: fB, armR: [[28, -4], [54, -10]] as A2, armRFront: true }, 3],                              // slides it in
  ]), { idx: 3 });
  const ctl: Ctl = { lamps: 1 - sm(f, 1700, 1784) * 0.5, libLit: 0.5, truckOn: 0, signP: 2, signFly: 1, told: 0, hatch: 0, binFill: f < 1752 ? 0.8 : 0.35, jar: 0, flap: f >= 1746 && f < 1770 ? bump01(f, 1746, 1770) : 0,
    cbBook: f >= 1756 && f < 1784 ? 2 : -1, cbX: BIN[0], cbY: lerp(1.0, 0.55, sm(f, 1756, 1772)), cbZ: BIN[2] + 0.2 - 0.25 * sm(f, 1756, 1772), cbRx: lerp(0.2, 1.4, sm(f, 1756, 1772)), cbRy: 0 };   // the book drops in past the lens
  const fx = fxs(f >= 1735 && f < 1752 ? popCard("due", add3(g, 0.45, 1.95, 0.25), 0.42, 0.22, f, 1735, 1752, (gc) => { gc.fillStyle = "#fff8e0"; gc.fillRect(20, 150, 472, 212); gc.strokeStyle = INKC; gc.lineWidth = 12; gc.strokeRect(20, 150, 472, 212); gc.fillStyle = "#a8282a"; gc.font = "900 84px Arial Black, Arial"; gc.textAlign = "center"; gc.fillText("DUE MAY 03", 256, 248); gc.fillText("1994", 256, 340); }) : null,
    leaf("dw1", [1.8, 1.2, 0.8], f, 1650), leaf("dw2", [6.0, 1.8, 0.0], f, 1700, [-1, -0.3]));
  const cyc = C("cyclist", [lerp(-12, 12, lin(f, 1631, 1700)), -0.15, 2.4], pose(null, { expr: "joy", mode: "sit", facing: 1, armR: [[24, 4], [40, 0]] as A2, armRFront: true, propR: "newspaper" }), { idx: 40 });
  return { ctl, cast: f < 1700 ? [gary, cyc] : [gary], fx, focus: follow(f, [[1631, (q: number) => head(gSneak(q))], [1740, add3(g, 0.3, 1.5, 0.2), 10], [1752, SLOT, 10]]), subj: f < 1758 ? "garySpy" : null };
};
lens3([[1631, B_FS], [1700, B_MS, 30], [1752, B_INS, 10]]);

// ================================================= SCENE 10 (1784-1896) THE RETURN ROOM AT DAWN: the catch
const MTOP: V3 = [-6.25, FL + 1.32, -18.25];
const CATCH: V3 = [MTOP[0] + 0.32, MTOP[1] + 1.0, MTOP[2] + 0.12];
const sDrop = (f: number): Shot => { const k = sm(f, 1784, 1806); return { pos: lerp3([CH[0] + 0.95, CH[1] + 0.2, CH[2] + 0.75], [MTOP[0] + 1.6, MTOP[1] + 1.15, MTOP[2] + 1.0], k), look: lerp3([CH[0] + 0.25, CH[1] - 0.35, CH[2]], add3(head(MTOP, 0.85), 0, -0.05, 0), k), fov: lerp(54, 50, k), roll: 0 }; };   // starts on the book on the ramp, rides down with it to Marge
const SH22 = frameOn(head(MTOP, 0.85), 58, 0.3, 50, 50, 0.02, 0.42);
const s22 = F(() => SH22, 1810, 0.0018);
SHOT_CAMS[10] = () => [K(1776, sDrop, 1, true), K(1806, glideTo(sDrop, 1806, s22, 1826, 0.0), 1)];
SHOT_ACTS[10] = (f, s) => {
  const fC = toward(10, s, f, MTOP, CH), fCam = toward(10, s, f, MTOP, add3(MTOP, 3, 0, 2));
  const marge = C("marge", MTOP, flow(f, [
    [1784, { expr: "calm", mode: "sit", facing: fCam, propR: "teaMug", armR: AB.sipR, armRFront: true }],
    [1796, { expr: "calm", mode: "sit", facing: fC, armL: [[-22, -16], [-30, -44]] as A2, armLFront: true, propR: "teaMug", armR: [[22, 12], [30, 0]] as A2, armRFront: true }, 4],
    [1802, { expr: "calm", mode: "sit", facing: fCam, armL: [[-24, -6], [-34, -22]] as A2, armLFront: true, propR: "teaMug", armR: [[22, 12], [30, 0]] as A2, armRFront: true }, 3],   // catches it one-handed
    [1820, { expr: "calm", mode: "sit", facing: fCam, armL: [[-20, 6], [-10, -10]] as A2, armLFront: true, propR: "teaMug", armR: [[22, 12], [30, 0]] as A2, armRFront: true, headTilt: 6 }, 6],   // reads the card
    [1850, { expr: "calm", mode: "sit", facing: fC, look: 0.5, headTilt: -4, armL: [[-20, 6], [-10, -10]] as A2, armLFront: true, propR: "teaMug", armR: [[22, 12], [30, 0]] as A2, armRFront: true }, 8],   // looks up at the chute
    [1862, { expr: "smug", mode: "sit", facing: fCam, look: 0, armL: [[-20, 6], [-10, -10]] as A2, armLFront: true, propR: "teaMug", armR: [[22, 12], [30, 0]] as A2, armRFront: true }, 12],    // slow smirk
    [1880, { expr: "smug", mode: "sit", facing: fCam, armL: [[-20, 6], [-10, -10]] as A2, armLFront: true, propR: "teaMug", armR: AB.sipR, armRFront: true }, 8],                            // sips
  ]), { idx: 1 });
  const held = f >= 1802;
  const ctl: Ctl = { pend: 1.2, pm: 0b001000, bk: 0, rr: 1, pour: 0, mountain: 1, tally: 1, dayDust: 1.2, cart: 1, cbBook: f < 1790 ? -1 : held ? 2 : (f - 1790) / 12, cbX: held ? CATCH[0] - 0.05 * sm(f, 1802, 1820) : CATCH[0], cbY: held ? CATCH[1] - 0.25 * sm(f, 1802, 1820) : CATCH[1], cbZ: CATCH[2] + 0.1, cbRx: lerp(0.4, 1.25, sm(f, 1802, 1822)), cbRy: 0.5 };
  const fx = fxs(f >= 1824 && f < 1896 ? popCard("due2", add3(CATCH, 0.18, 0.12, 0.18), 0.26, 0.14, f, 1824, 1858, (gc) => { gc.fillStyle = "#fff8e0"; gc.fillRect(20, 150, 472, 212); gc.strokeStyle = INKC; gc.lineWidth = 12; gc.strokeRect(20, 150, 472, 212); gc.fillStyle = "#a8282a"; gc.font = "900 84px Arial Black, Arial"; gc.textAlign = "center"; gc.fillText("DUE MAY 03", 256, 248); gc.fillText("1994", 256, 340); }) : null,
    f < 1896 ? steamCard("tea", add3(head(MTOP, 0.85), 0.32, 0.05, 0.1), 0.1, 0.5, 11) : null);
  return { ctl, cast: [marge], fx, focus: follow(f, [[1784, [CH[0], CH[1] - 0.3, CH[2]]], [1806, CATCH, 12], [1830, head(MTOP, 0.85), 10]]), subj: f < 1800 ? null : "marge" };
};
lens3([[1784, B_INS], [1806, B_CU, 20]]);
KEY_PUNCH.push(1315, 1338, 1361, 1405, 1424, 1505, 1571, 1619, 1748, 1802, 1832);
