
// =====================================================================================================================
// DRUGSTORE, night blue (the explanation). Marks: pharmScale [-1.45,0,-1.85], pharmTonic [-4.05,0,-1.85],
// customer [-1.3,0,0.05], coffee [3.9,0.76,-0.12] (seated), rat [-0.84,1.02,-0.8]. ctl: scale, rattle, door, bolt.
const D_PT: V3 = [-4.05, 0, -1.85], D_PS: V3 = [-1.45, 0, -1.85], D_CU: V3 = [-1.3, 0, 0.05], D_CF: V3 = [3.9, 0.46, -0.12], D_RAT: V3 = [-0.84, 1.02, -0.8];
const D_POSTER: V3 = [-5.3, 2.6, -2.7], D_SCALE: V3 = [-1.45, 1.02, -0.95], D_CUPS: V3 = [4.6, 1.02, -0.98];
/** pharmacist walks from the tonic display to the scale between 1286 and 1312 (behind the counter) */
const pharmPos = (f: number): V3 => lerp3(D_PT, D_PS, sm(f, 1278, 1304));
// ---- S17 (1243-1372) "That's the trick. / In 1904, / a tiny dose / of rat poison / was an energy drink."
// Dissolve in on the PEP-O-LIGHTNING poster: the pharmacist (already at the tonic display) raises a tonic bottle as the
// bolt flashes on "trick" (stinger). The camera travels with him along the counter to the scale; on "tiny dose" he
// holds up a pinch, on "rat poison" it falls onto the pan (tiny dip + sparkle); on "energy drink" the customer at the
// counter gulps a tonic and his hair zaps up (wired face, speed squiggles).
SHOT_CAMS[17] = () => [
  K(1243, F(() => fit([body(D_PT, 0, 2.1, 0.4), [D_POSTER, -1.0, 0.9, 0.7]], 38, 6, 40, 0.86, 0, 0), 1243, 0.0024, [[1245, 0.006, 14]])),
  K(1276, F((f) => fit([body(pharmPos(f), 0.6, 2.1, 0.35), [D_SCALE, 0, 0.7, 0.3]], 28, 12, 40, 0.8), 1276, 0.0016), 30),
  K(1330, F(() => ({ pos: [-0.62, 1.78, -2.05], look: [-1.3, 1.42, 0.3], fov: 40 }), 1330, 0.002, [[1341, 0.006, 12]]), 22),
];
SHOT_ACTS[17] = (f, s) => {
  const raise = sm(f, 1244, 1252), pinchUp = sm(f, 1300, 1310), drop = sm(f, 1320, 1328), gulp = sm(f, 1338, 1346), zap = f >= 1346;
  const pp = pharmPos(f), walking = f >= 1278 && f < 1304;
  return {
    ctl: { bolt: Math.max(sm(f, 1244, 1250) * (1 - sm(f, 1262, 1280)), 0.6 * sm(f, 1342, 1348) * (1 - sm(f, 1360, 1372))), scale: 0.5 * drop, rattle: 0.15, door: 0 },
    cast: [
      C("pharmacist", pp, pose(null, walking
        ? { mode: "walk", phase: ph(f, 14), expr: "smug", facing: faceTo(17, s, f, D_PT, D_PS) }
        : f < 1278
          ? { expr: raise > 0.5 ? "eureka" : "smug", facing: faceTo(17, s, f, D_PT, D_CU), armR: [[24, -10], [lerp(30, 34, raise), lerp(10, -40, raise)]] as A2, armRFront: true, propR: "tonic", mouth: talk(f, 1246, 1262), headTilt: 4 * raise }
          : { expr: drop > 0.5 ? "sly" : "determined", facing: faceTo(17, s, f, D_PS, D_CU), armR: [[26, -6], [lerp(40, 46, pinchUp), lerp(10, -26, pinchUp) + 24 * drop]] as A2, armRFront: true,
              armL: [[-20, 20], [-10, 34]] as A2, mouth: talk(f, 1300, 1330) })),
      C("fan1", D_CU, pose(null, f < 1338
        ? { expr: "talk", facing: faceTo(17, s, f, D_CU, D_PS), look: 1, armR: [[24, 20], [30, 40]] as A2, armRFront: true, propR: "tonic", blink: (f % 47) < 3 ? 1 : 0 }
        : { expr: zap ? "wired" : "gulp", facing: faceTo(17, s, f, D_CU, D_PS), squash: zap ? 0.12 * Math.exp(-(f - 1346) / 6) : 0, hatLift: zap ? 0.5 * Math.exp(-(f - 1346) / 8) : 0,
            armR: [[20, -6], [lerp(30, 14, gulp), lerp(30, -30, gulp)]] as A2, armRFront: true, propR: "tonic", propRAng: -1.2 * gulp })),
      C("rat", D_RAT, pose(null, { expr: "neutral", facing: -1, phase: ph(f, 10) }), { scale: 0.36, idx: 34 }),
      C("clerk3", [3.2, 0, -1.9], pose(null, { expr: "neutral", facing: 1, armR: [[24, 10], [40, -4 + 6 * Math.sin(st(f) * 0.5)]] as A2, armRFront: true, propR: "coffeeCup" }), { idx: 30 }),
      C("coffeeGuy", D_CF, pose(null, { mode: "sit", expr: "smile", facing: -1, armR: [[22, 14], [30, 6]] as A2, armRFront: true, propR: "coffeeCup" }), { idx: 31 }),
    ],
    fx: fxs(sparkle("bolt", [D_POSTER[0] + 0.3, D_POSTER[1] + 0.2, D_POSTER[2] + 0.3], f - 1245, 0.6),
      sparkle("pinch", [D_SCALE[0] + 0.22, D_SCALE[1] + 0.25, D_SCALE[2]], f - 1326, 0.22),
      zap && f < 1366 ? squiggles("zap", [D_CU[0] - 0.05, 2.15, D_CU[2]], f, "#ffe95a", 0.42) : null),
    focus: f < 1290 ? [D_PT[0], 1.6, D_PT[2]] : f < 1332 ? [pp[0], 1.4, pp[2] + 0.6] : [D_CU[0], 1.6, D_CU[2]], subj: null,
  };
};
lens(1243, 9, 1); lens(1290, 6, 20); lens(1332, 7, 16);

// ---- S18 (1372-1436) "Ever had so much coffee / your hands started shaking?"
// The camera keeps travelling down the customer lane to the soda fountain, where the coffee customer (already there,
// on his ninth cup) lifts a cup: his hands start to shake, the cup rattles on the saucer, the cup tower rattles too.
SHOT_CAMS[18] = () => [
  K(1372, F((f) => fit([body(D_CF, -0.46, 1.7, 0.36), [D_CUPS, 0, 0.55, 0.25]], lerp(18, 8, sm(f, 1372, 1436)), 6, 40, 0.84, 0, -0.05), 1372, 0.0024, [[1420, 0.006, 14]]), 34),
];
SHOT_ACTS[18] = (f, s) => {
  const lift = sm(f, 1394, 1404), shake = sm(f, 1404, 1422), j = Math.sin(f * 2.1) * (2 + 6 * shake);
  return {
    ctl: { scale: 0.5, rattle: 0.2 + 0.8 * shake, bolt: 0, door: 0 },
    cast: [
      C("coffeeGuy", D_CF, pose(null, { mode: "sit", expr: shake > 0.6 ? "wired" : "smile", facing: -1, sweat: shake, tilt: 0.6 * j * shake,
        armR: [[22, 8], [lerp(30, 24, lift) + j, lerp(6, -14, lift) + 0.6 * j]] as A2, armRFront: true, propR: "coffeeCup",
        armL: [[-20, 10], [-28 - j, 4 + 0.5 * j]] as A2, armLFront: true, mouth: shake > 0.3 ? "teeth" : undefined })),
      C("clerk3", [3.2, 0, -1.9], pose(null, { expr: "dismay", facing: 1, armR: [[24, 10], [40, -4]] as A2, armRFront: true, propR: "coffeeCup" }), { idx: 30 }),
      C("pharmacist", D_PS, pose(null, { expr: "smug", facing: 1 }), { idx: 32 }),
      C("fan1", D_CU, pose(null, { expr: "wired", facing: 1, propR: "tonic", armR: [[24, 20], [30, 40]] as A2, armRFront: true, tilt: 4 * Math.sin(f * 0.9) }), { idx: 33 }),
    ],
    fx: fxs(shake > 0.2 ? squiggles("shake", [D_CF[0] + 0.45, 1.75, D_CF[2] + 0.2], f, "#ffffff", 0.3) : null),
    focus: [D_CF[0], 1.6, D_CF[2]], subj: null,
  };
};
lens(1372, 6, 20);

// ---- S19 (1436-1510) "It's that. / But one pinch too many, / and you're dead."
// The camera glides back along the counter to the scale: the pharmacist tips in one pinch too many, the pan crashes
// down in a powder puff; the rat sniffing the pan freezes - HARD CUT 2 on "dead": counter-top level, the rat keels over,
// legs up, dizzy stars. Then the 8 f dissolve to the stadium finish (bright gold).
SHOT_CAMS[19] = () => [
  K(1436, F(() => fit([body(D_PS, 0.7, 2.1, 0.35), [D_SCALE, 0, 0.75, 0.32], [D_RAT, 0, 0.25, 0.12]], 30, 14, 40, 0.82, 0, 0.05), 1436, 0.002, [[1472, 0.006, 12]]), 30),
  K(1496, F(() => ({ pos: [-0.36, 1.14, -0.36], look: [-1.02, 1.1, -0.84], fov: 40 }), 1496, 0.003), 1, true),
];
SHOT_ACTS[19] = (f, s) => {
  const pinch = sm(f, 1462, 1474), crash = sm(f, 1476, 1486), dead = sm(f, 1494, 1500);
  return {
    ctl: { scale: lerp(0.5, 1, crash), rattle: 0.2, bolt: 0, door: 0 },
    cast: [
      C("pharmacist", D_PS, pose(null, { expr: crash > 0.5 ? "shock" : "determined", facing: faceTo(19, s, f, D_PS, D_CU), armR: [[26, -6], [lerp(40, 50, pinch), lerp(-26, 6, pinch)]] as A2, armRFront: true, propR: pinch > 0.1 && crash < 0.5 ? "poisonTin" : undefined,
        mouth: talk(f, 1440, 1460), squash: 0.1 * crash * Math.exp(-Math.max(0, f - 1486) / 6) })),
      C("rat", D_RAT, pose(null, dead > 0
        ? { expr: "dead", mode: "lie", facing: -1, squash: 0.15 * dead * Math.exp(-Math.max(0, f - 1500) / 5) }
        : { expr: crash > 0.5 ? "shock" : "neutral", facing: -1, phase: ph(f, 8), sweat: crash }), { scale: 0.36, idx: 34 }),
      C("coffeeGuy", D_CF, pose(null, { mode: "sit", expr: "wired", facing: -1, tilt: 3 * Math.sin(f * 1.7), propR: "coffeeCup", armR: [[22, 8], [24, -14]] as A2, armRFront: true }), { idx: 31 }),
    ],
    fx: fxs(dead > 0.5 ? dizzy([D_RAT[0], D_RAT[1] + 0.12, D_RAT[2]], f, 0.07).map((d) => ({ ...d, w: 0.045, h: 0.045 })) : null,
      crash > 0.5 && f < 1496 ? dustCard("puffScale", [D_SCALE[0] + 0.25, D_SCALE[1] + 0.25 + 0.01 * (f - 1486), D_SCALE[2]], 0.5 + 0.02 * (f - 1486), 0.8 * (1 - lin(f, 1486, 1496)), 2) : null),
    focus: f < 1496 ? [D_SCALE[0], D_SCALE[1] + 0.3, D_SCALE[2]] : [D_RAT[0], D_RAT[1] + 0.1, D_RAT[2]], subj: null,
  };
};
lens(1436, 6, 16); lens(1496, 12, 1);
