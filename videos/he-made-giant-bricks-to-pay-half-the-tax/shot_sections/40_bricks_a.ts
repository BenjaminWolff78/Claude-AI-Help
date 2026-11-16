// =====================================================================================================================
// "He Made Giant Bricks to Pay Half the Tax": scenes 1-3 (brickyard golden morning, the village street, the first week).
// Faces: Amos = calm half-lid (neutral / bored / calm), smug on the hook, "Exactly." and the trick; never shock.
// Percival the taxman = moustache mouth (tache) by default, tacheUp gloat on the sneer, fury in the inn, shock at the end.
// Silas = grin -> mock laugh -> yell. Ned = strain -> worry, then the eureka (shock 1). Hard cuts (3): 618, 919, 1180.
type CamT = { pos: V3; look: V3; fov: number; roll: number };
type CK = { f: number; pos: V3; look: V3; fov: number };
const CKf = (f: number, pos: V3, look: V3, fov = 44): CK => ({ f, pos, look, fov });
const dirOf = (c: Shot) => { const d = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]], L = Math.hypot(d[0], d[1], d[2]) || 1; return { yaw: Math.atan2(d[0], d[2]), pitch: Math.asin(d[1] / L), L }; };
/** a whip / swing between two framings: the view direction turns through yaw, the position slides, eased over [f0, f1] */
const swing = (from: (f: number) => Shot, f0: number, to: (f: number) => Shot, f1: number, lift = 0) => (f: number): Shot => {
  const A = from(f0), B = to(f), k = sm(f, f0, f1), da = dirOf(A), db = dirOf(B);
  let dy = db.yaw - da.yaw; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI;
  const yaw = da.yaw + dy * k, pitch = lerp(da.pitch, db.pitch, k), L = lerp(da.L, db.L, k);
  const pos = lerp3(A.pos, B.pos, k); pos[1] += lift * Math.sin(Math.PI * k);
  return { pos, look: [pos[0] + Math.sin(yaw) * Math.cos(pitch) * L, pos[1] + Math.sin(pitch) * L, pos[2] + Math.cos(yaw) * Math.cos(pitch) * L], fov: lerp(A.fov ?? 40, B.fov ?? 40, k), roll: 0 };
};
/** r9: a clear 3/4 turn toward the partner (at least 0.72) whenever the partner is off to one side on screen */
const toward = (id: number, s: SetDef, f: number, a: V3, b: V3) => { const v = faceTo(id, s, f, a, b); return Math.abs(v) < 0.02 ? 0 : Math.sign(v) * Math.max(0.72, Math.min(1, Math.abs(v))); };
const EYE = 1.3;
const head = (p: V3, y = EYE): V3 => [p[0], p[1] + y, p[2]];
const box = (p: V3, y0: number, y1: number, w: number): Box => [p, y0, y1, w];
/** reference blur levels (v14: insert 14, close-up 13, full 8, wide 5, medium 8 or less) */
const B_INS = 14, B_CU = 13, B_MS = 7, B_FS = 6, B_WS = 4;
/** v14 arm set for the brick video */
const AB = {
  slamR: [[24, 10], [40, 30]] as A2, slamL: [[-24, 10], [-40, 30]] as A2, liftUpR: [[22, -24], [26, -58]] as A2, liftUpL: [[-22, -24], [-26, -58]] as A2,
  patR: [[26, 14], [44, 30]] as A2, holdOutR: [[26, 6], [46, 0]] as A2, carryR: [[22, 12], [36, 4]] as A2, carryL: [[-22, 12], [-36, 4]] as A2,
  quillR: [[24, 4], [40, -12]] as A2, ledgerL: [[-22, 12], [-34, 0]] as A2, stampUpR: [[22, -20], [30, -48]] as A2, stampDnR: [[24, 8], [34, 18]] as A2,
  pointR: [[28, -8], [58, -16]] as A2, pointL: [[-28, -8], [-58, -16]] as A2, leanR: [[24, 14], [36, 34]] as A2, handleR: [[26, 18], [42, 34]] as A2, handleL: [[-26, 18], [-42, 34]] as A2,
  heaveR: [[26, 4], [40, -14]] as A2, heaveL: [[-26, 4], [-40, -14]] as A2, backR: [[20, 14], [-6, 24]] as A2, sipR: [[20, 10], [8, -14]] as A2,
};

// ================================================= SCENE 1 (0-480) BRICKYARD, GOLDEN MORNING
const A1: V3 = [0.03, 0, -0.6], S1: V3 = YARD.SILAS, T1: V3 = [2.1, 0, 3.5], BRD: V3 = YARD.BOARD;
const SH1: V3 = [-3.25, 0, 0.5], SH2: V3 = [-3.7, 0, -2.4];
const AC: V3 = [2.5, 0, 4.0];                 // Amos at the cart handles (the cart points at the gate)
const BENCH_PAIR: Box = box([-0.06, 0, 0.07], 0.84, 1.08, 0.38);
const SH_1: CamT = { pos: [0.07, 1.3, 0.88], look: [0.07, 1.18, -0.6], fov: 56, roll: 0 };   /* r76i: in close - the bench front out of frame, its dressed top the bottom band */   /* r76i: from just above the bench - its top a thin band (the bottom quarter was bare planks) */   /* r76i: back a little - the brick and loaf pair above the caption, whole */   /* r76h: tipped down ~7 deg - his eyes at ~40 % and the held loaf above the caption band (it sat under "making") */   /* r76f: level from chest height - the roof leaves the top, the bench top is a thin band (dead roof 20 % and table 25 %) */   /* r76d: (the bench-pair restage hid him behind the blocks) back to the held pair, a touch wider so the brick clears the left edge */   /* r76c: in on the pair (roof and bench squeezed him into the middle half) */   /* r76: centred, a touch tighter and lower (roof 25 % top, empty planks 19 % bottom) */   /* r70: lens at bench height (reviewers: a static eye-level hook) */   /* r69: wider so the bricks held out to the sides stay in frame */   /* r61: a LOW hero angle on the hook (reviewer: every shot at eye level) */   /* r58: a touch left (the held brick met the left edge) */   /* r57: in and a touch lower (the roof beam took the top 15 %, the bench the bottom 25 %) */   /* r51: closer (the hook head was 34 % wide under a dark roof band) */   /* r49: Amos on the left third, the loaf raised high on the right, the brick low (dead-centre T-pose) */   /* r48: a touch wider and centred on Amos (the held loaf ran to 10 px from the right edge, under the Shorts buttons) */   // r42: lower and a touch tighter (the roof beam and the bench slab took 42 % of the frame)   // r36: a little wider (the raised pair spanned 84 %)   // r35: Amos straightens up 0.22 m with the brick and the loaf (31-44): the camera rides up with him, the bench drops to the bottom fifth   // r26g: a touch wider (the held brick and loaf reach out from the hands)   // r26: closer and level: Amos big, the bench only the bottom quarter   // r22: waist-up on Amos, the brick and the loaf in his hands at chest height   // r21: frontal (both bricks at one depth), the bricks above the caption band   // r20: Amos centred (57 %), the normal brick and the loaf side by side under him   // r5: the CP3 yard lock (head ~41%, loaf + brick on the bench, legs under it)
const SH_2 = frameOn(head(T1), -14, 0.3, 24, 52, 0.15, 0.42);   // r5: the taxman left (head 32%), the duty board right of him
const SH_3 = frameOn(head(A1), 15, 0.36, 58, 52, 0.2, 0.4);   // r5: Amos at the deep mould (head 36%)
const SH_4 = frameOn(head(S1), 60, 0.38, 50, 52, 0.15, 0.4);   // r5: Silas over his wall (head 38%)
const SH_4W = fit([body(AC, 0, 1.8, 0.3), body(S1, 0.6, 1.85, 0.3), body(SH1, 0.6, 1.85, 0.3)], 30, 7, 50, 0.84, 0, 0);
const SH_4C: CK = CKf(468, [AC[0] + 0.6, 1.0, AC[2] + 2.6], [AC[0] - 0.6, 0.7, AC[2] - 0.4], 50);
SHOT_CAMS[1] = () => {
  // r7 (kit: opening too static): the hook opens on a fast push down onto the bench (0-22, ease-out), then creeps
  // r13: after the opening push and the punch on "brick", a slow drift back (the hook holds to 4.9 s; a creep-in put the brim off the edge)
  const s1c = F(() => SH_1, 0, -0.0008, [[57, 0.012, 8]]);
  // r17 (kit: opening too static): a bigger, longer opening move - from 2.1x away and off to the side, 0-50
  const s1 = (f: number): Shot => { const c = s1c(f); if (f >= 50) return c; const k = 1 - Math.pow(1 - f / 50, 3), far = lerp3(c.look, c.pos, 2.1); return { ...c, pos: lerp3([far[0] + 0.55, far[1] + 0.35, far[2]], c.pos, k) }; };
  const s2 = F(() => SH_2, 160, 0.0016);
  const s3 = F(() => SH_3, 246, 0.0018);
  const s4 = F(() => SH_4, 326, 0.0015);
  const s4w = F(() => SH_4W, 440, -0.0012);                 // slow pull back: the yard joins in
  // r7: the shape match into the street: the camera ends looking down into the cart bed of loaves (only loaves in frame,
  // nobody), riding with the cart; the street opens on the same cart bed from the same height and pulls up into the track
  const bedY = (f: number): V3 => { const ck = 0.11 * sm(f, 462, 490); return [YARD.CART[0] + ck * 4.4, 0, YARD.CART[2] + ck * 3.7]; };
  const s4c = (f: number): Shot => { const c = bedY(f); return { pos: [c[0] + 0.05, 2.05, c[2] + 0.28], look: [c[0], 0.85, c[2]], fov: 50, roll: 0 }; };
  return [K(0, s1, 1, true),
    // r13: hold the hook to 4.9 s, then a 12-frame whip to the taxman (lands on "king" 164; the glide crossed an empty yard)
    K(146, swing(s1, 146, s2, 158, 0.3), 1),
    K(236, swing(s2, 236, s3, 246, 0.2), 1),
    K(316, swing(s3, 316, s4, 326, 0.1), 1),
    K(418, swing(s4, 418, s4w, 440, 0.25), 1),
    K(456, glideTo(s4w, 456, s4c, 470, 0.2, [0, 0, 0]), 1)];
};
SHOT_ACTS[1] = (f, s) => {
  // --- Amos: the hook at the bench (0-97), the clay (238-316), then at the cart (418-480)
  const fCam = toward(1, s, f, A1, [A1[0], 0, A1[2] + 3]), fBench = toward(1, s, f, A1, [0, 0, 0.05]), fSilas = toward(1, s, f, A1, S1);
  const amosBench = flow(f, [
    [0, { expr: "determined", facing: fBench, armR: AB.slamR, armL: AB.slamL, armRFront: true, armLFront: true, tilt: 7 }],                 // mid-slam on frame 0
    [10, { expr: "calm", facing: fBench, armR: AB.slamR, armL: AB.slamL, armRFront: true, armLFront: true, tilt: 3 }, 6],
    [16, { expr: "calm", facing: fBench, armR: [[22, -10], [34, -40]] as A2, armL: [[-22, -10], [-34, -40]] as A2, armRFront: true, propR: "mould", propRAng: -0.15, tilt: -2 }, 6], // lifts the mould off
    // r22: the gag in his hands: the mould goes down at the bench's right end (24-30), he picks up the loaf and a normal
    // brick (30-36) and holds them side by side at chest height through "every brick twice as tall" (37-90)
    [20, { expr: "calm", facing: fBench, armR: [[22, 12], [34, 26]] as A2, armRFront: true, propR: "mould", propRAng: 0.1, armL: [[-22, 14], [-30, 30]] as A2, armLFront: true, tilt: 3 }, 6],
    [25, { expr: "calm", facing: fBench, armR: [[22, 12], [28, 28]] as A2, armRFront: true, armL: [[-22, 12], [-28, 28]] as A2, armLFront: true, tilt: 4 }, 4],
    [30, { expr: "calm", facing: Math.max(fBench, 0.6), tilt: 7, headTilt: 6, armR: [[6, 18], [-23, 32]] as A2, armRFront: true, propR: "loaf", armL: [[-6, 18], [23, 32]] as A2, armLFront: true }, 6],   /* r63: carried on both palms (balanced on one corner dot it floated) */   /* r59: only the loaf in his hand; the two bricks beside a loaf on the bench make the comparison (the held brick hung off the left edge) */
    // r36: he raises the pair to shoulder height with the arms showing (at the hips they read as glued on, no arms)
    /* r69: brick and loaf held out to the sides by their near ends, both arms showing (r68b: the arms hid behind them and they floated like ears) */
    /* r76i (both reviewers): a normal brick and a loaf side by side at the chest, bases level on one dot each - the loaf exactly twice the height (apart on the bench the pair never compared) */
    [33, { expr: "pitch", facing: 0.42, headTilt: 5, armR: [[34, 30], [14, 14]] as A2, armRFront: true, propR: "loaf", armL: [[-34, 30], [-14, 14]] as A2, armLFront: true, propL: "brick", propsOver: true }, 6],
    [57, { expr: "pitch", facing: 0.42, headTilt: 5, armR: [[34, 30], [14, 14]] as A2, armRFront: true, propR: "loaf", armL: [[-34, 30], [-14, 14]] as A2, armLFront: true, propL: "brick", propsOver: true, headTilt: 3 }, 5],
    [66, { expr: "smug", facing: 0.42, headTilt: 5, armR: [[34, 30], [14, 14]] as A2, armRFront: true, propR: "loaf", armL: [[-34, 30], [-14, 14]] as A2, armLFront: true, propL: "brick", propsOver: true, headTilt: 4 }, 6],
    [90, { expr: "calm", facing: 0.42, headTilt: 5, armR: [[34, 30], [14, 14]] as A2, armRFront: true, propR: "loaf", armL: [[-34, 30], [-14, 14]] as A2, armLFront: true, propL: "brick", propsOver: true }, 8],
    [150, { expr: "calm", facing: fCam, armR: AR.hipR, armL: AR.hipL, headTilt: -3 }, 10],
    // the clay (shot 3): lifts a clot overhead, slams it into the deep mould (265), strikes it off (286), glances at Silas
    [236, { expr: "calm", facing: fBench, armR: AB.carryR, armL: AB.carryL, armRFront: true, propR: "clay" }],
    [250, { expr: "determined", facing: fBench, armR: AB.liftUpR, armL: AB.liftUpL, propR: "clay", tilt: -5, headBack: 0.3 }, 8],
    [262, { expr: "strain", facing: fBench, armR: AB.slamR, armL: AB.slamL, armRFront: true, armLFront: true, tilt: 9 }, 3],
    [272, { expr: "calm", facing: fBench, armR: [[26, 10], [36, 24]] as A2, armRFront: true, propR: "trowel", propRAng: 1.4, armL: AR.hipL, tilt: 4 }, 8],
    [284, { expr: "calm", facing: fBench, armR: [[26, 10], [52, 24]] as A2, armRFront: true, propR: "trowel", propRAng: 1.4, armL: AR.hipL, tilt: 5 }, 6],   // strike-off
    [298, { expr: "bored", facing: fSilas, armR: AR.hipR, armL: AR.hipL }, 10],
  ]) as P;
  const fGate = toward(1, s, f, AC, YARD.GATE), fSil2 = toward(1, s, f, AC, S1);
  const amosCart = flow(f, [
    [418, { expr: "calm", facing: fSil2, armR: AB.carryR, armL: AB.carryL, armRFront: true, propR: "loaf", tilt: 2 }],            // loads the last loaf
    [440, { expr: "bored", facing: fSil2, armR: AB.patR, armRFront: true, armL: AR.hipL }, 8],
    [456, { expr: "calm", facing: fGate, armR: AB.handleR, armL: AB.handleL, armRFront: true, armLFront: true, mode: "brace", braceK: 0.4 }, 8],
  ]) as P;
  const pullK = sm(f, 462, 490), cart = 0.11 * pullK;
  const acPos: V3 = [AC[0] + 0.48 * cart / 0.11 * 0.11 * 4.4, 0, AC[2] + cart * 3.7];
  const lift1 = 0.22 * (sm(f, 31, 44) - sm(f, 147, 157));   // r35: he stands up straight with the pair (the bench filled the lower third); back down inside the whip to the taxman
  const amos = f < 418 ? C("amos", [A1[0], lift1, A1[2]], amosBench, { idx: 1 }) : C("amos", f < 462 ? AC : acPos, f < 462 ? amosCart : pose(null, { ...amosCart, mode: "walk", phase: (f - 462) / 13 }), { idx: 1 });
  // --- the taxman at the duty board (shot 2): counts the drying row with his quill, taps "2s 6d PER 1000" on "crown"
  const fRow = toward(1, s, f, T1, [3.4, 0, 2.0]), fBoard = toward(1, s, f, T1, BRD);
  const tax = flow(f, [
    [98, { expr: "stern", facing: fRow, armR: AB.quillR, armRFront: true, propR: "quill", armL: AB.ledgerL, armLFront: true, propL: "ledger", propK: 1 }],
    [128, { expr: "tache", facing: fRow, armR: [[24, 0], [42, -6]] as A2, armRFront: true, propR: "quill", armL: AB.ledgerL, armLFront: true, propL: "ledger", propK: 1, headTilt: 3 }, 6],
    [146, { expr: "tache", facing: fRow, armR: AB.quillR, armRFront: true, propR: "quill", armL: AB.ledgerL, armLFront: true, propL: "ledger", propK: 1, headTilt: -2 }, 6],
    [164, { expr: "tache", facing: fBoard, armR: [[24, -8], [36, -30]] as A2, armRFront: true, propR: "quill", armL: AB.ledgerL, armLFront: true, propL: "ledger", propK: 1, look: 0.3 }, 8],   // "king": looks up at the crest
    [206, { expr: "tacheUp", facing: fBoard, armR: [[26, -14], [50, -40]] as A2, armRFront: true, propR: "quill", armL: AB.ledgerL, armLFront: true, propL: "ledger", propK: 1 }, 6],
    [214, { expr: "tacheUp", facing: fBoard, armR: [[26, -12], [54, -34]] as A2, armRFront: true, propR: "quill", armL: AB.ledgerL, armLFront: true, propL: "ledger", propK: 1, tilt: 3 }, 2],  // tap on "crown"
    [222, { expr: "tacheUp", facing: fBoard, armR: [[26, -14], [50, -40]] as A2, armRFront: true, propR: "quill", armL: AB.ledgerL, armLFront: true, propL: "ledger", propK: 1 }, 5],
  ]) as P;
  // count bobs: a small head dip per brick he counts (130-160, every 7 f)
  const bob = f > 128 && f < 162 ? 3 * Math.sin(((f - 128) / 7) * Math.PI) : 0;
  // --- Silas over the wall: watches (shot 3), leans on his shovel grinning, drops it (352), laughs, yells, points
  const fA = toward(1, s, f, S1, A1);
  const silas = flow(f, [
    [236, { expr: "grin", facing: fA, armR: AB.leanR, armRFront: true, propR: "shovel", propRAng: 0.15, tilt: 4 }],
    [326, { expr: "grin", facing: fA, armR: AB.leanR, armRFront: true, propR: "shovel", propRAng: 0.2, tilt: 6, headTilt: 5 }, 8],
    [344, { expr: "laugh", facing: fA, armR: [[30, 10], [52, 20]] as A2, armRFront: true, propR: "shovel", propRAng: 0.9, tilt: -3 }, 6],   // lets go
    [356, { expr: "mock", facing: fA, armR: [[26, 6], [40, -4]] as A2, armL: [[-26, 6], [-40, -4]] as A2, shake: 1, phase: 0, tilt: -4, headBack: 0.4 }, 4],
    [384, { expr: "guffaw", facing: fA, armR: AB.pointR, armRFront: true, armL: [[-24, 14], [-12, 26]] as A2, shake: 0.5, phase: 0, headBack: 0.2 }, 4],   // yells, pointing
    [418, { expr: "mock", facing: fA, armR: [[26, 6], [40, -4]] as A2, armL: [[-26, 6], [-40, -4]] as A2, shake: 1, phase: 0, tilt: -4, headBack: 0.5 }, 6],
  ]) as P;
  const silasO: P = f >= 356 && f < 384 ? { ...silas, phase: (f - 356) / 11 } : f >= 418 ? { ...silas, phase: (f - 418) / 11 } : silas;
  const silasQ = speak(f, 386, 416, silasO);
  // --- Silas's two hands: working (shovelling clay), then laughing together on "joins in" (463)
  const hand = (who: string, p: V3, i: number): CastPlace => {
    const fh = toward(1, s, f, p, A1);
    if (f < 440) return shoveler(who, p, f, i, fh);
    return C(who, p, pose(null, { ...laughP(f, 440 + i * 5, i), facing: fh }), { idx: 30 + i });
  };
  const cast: CastPlace[] = [];
  if (f < 418 || f >= 418) cast.push(amos);
  if (f >= 90 && f < 240) cast.push(C("tax", T1, { ...tax, headTilt: ((tax.headTilt as number) ?? 0) + bob } as FigOpts, { idx: 3 }));
  cast.push(C("silas", S1, silasQ as FigOpts, { idx: 2 }));
  if (f >= 400) { cast.push(hand("sh1", SH1, 0)); cast.push(hand("sh2", SH2, 1)); }
  // hook controls: the mould is on the loaf and slams down on frame 0, lifts away at 16 (into Amos's hands)
  const ctl: Ctl = {
    mouldOn: f < 16 ? 1 : 0, mouldY: f < 4 ? 0.05 * (1 - f / 4) : 0, mouldAside: f >= 25 && f < 236 ? 1 : 0, loaf: f < 31 ? 1 : 0, brick: f < 31 ? 1 : 0, mini: f < 146 ? 0 : 1,   /* r76i (reviewer): no bench miniatures in the hook - only the held pair compares */   /* r76i: he lifts the brick with the loaf */   /* r59: the normal brick stays on the bench (he no longer picks it up) */
    clay: f >= 236 && f < 418 ? (f < 262 ? 0.15 : lerp(0.15, 1.0, sm(f, 262, 270))) : 0, strike: f >= 284 && f < 296 ? lin(f, 284, 296) : 0,
    normMould: f < 146 ? 0 : 1, strikeOn: f < 236 ? 0 : 1, brick: f < 146 ? 0 : 1,   /* r76: the bench clear in the hook (he holds the pair) */ cart: f < 462 ? 0 : cart, lantern: 0,
  };
  const fx = fxs(f < 12 ? dustCard("hook", [0.18, 0.92, 0.12], 0.32 + 0.03 * f, 1 - f / 12, 2) : null,
    f >= 262 && f < 274 ? dustCard("slap", [0.18, 1.05, 0.1], 0.3, 1 - (f - 262) / 12, 3) : null,
    f >= 356 && f < 368 ? dustCard("shovel", [S1[0] + 0.35, 1.0, S1[2] + 0.2], 0.35, 1 - (f - 356) / 12, 4) : null,
    f >= 470 ? dustTrail("cart", [acPos[0] - 1.4, 0, acPos[2] - 1.2], [0.77, 0.64], f, 4, 0.5, 0.35) : []);
  const focus: V3 = f < 30 ? [0.05, 1.05, -0.2] : f < 150 ? [0.03, 1.15 + lift1, -0.6] : f < 236 ? head(T1) : f < 316 ? head(A1) : f < 418 ? head(S1) : f < 462 ? head(AC) : [acPos[0] - 0.8, 0.8, acPos[2] - 0.6];
  return { ctl, cast, fx, focus, subj: f < 150 ? "amos" : f < 236 ? "tax" : f < 316 ? "amos" : f < 418 ? "silas" : f < 456 ? "amos" : null };
};
KICKS.push([2 / 30, 0.35], [263 / 30, 0.2]);
KEY_PUNCH.push(110, 164, 214, 262, 312, 344, 386, 452, 537, 607, 650, 695, 749, 836, 890);
lens3([[0, 2.6], [146, B_FS, 12], [160, B_MS, 10], [240, B_MS, 8], [320, B_CU, 8], [420, B_WS, 20], [462, B_FS, 16]]);

// ================================================= SCENE 2 (480-618) VILLAGE STREET, NOON
// the cart rolls east along the street (cart: x = -10 + 20 ck, handles to +x, Amos at x + 1.7); the baker at his stall,
// a woman and a kid laugh, Ned tries a loaf at 551-618
const cartX = (ck: number) => -10 + 20 * ck;
const ckAt = (f: number) => lerp(0.33, 0.46, sm(f, 470, 548));
const V_BAKER: V3 = [-1.25, 0, -0.85],   /* r76i (both reviewers): both laughers nearer (4.2-4.8 m against Amos 3.2 m) - their heads read at 3/4 of his */   /* r76i: the baker nearer - his bread gag readable */   /* r76i: the baker in the street shot, bread held up beside a loaf (both reviewers: nothing said "loaves", one laugher was not "the village") */ V_WOMAN: V3 = [1.4, 0, -3.7], V_KID: V3 = [2.4, 0, -3.3], V_MAN: V3 = [-0.4, 0, 3.75], V_NED: V3 = [-1.0, 0, 1.95];
SHOT_CAMS[2] = () => {
  // shot 5: tracking alongside the cart from the south pavement, the bakery and the villagers behind
  // r5: the track keeps Amos's head at ~34% width, 36% across (the cart and the laughing villagers ahead of him on the right)
  const TK = (f: number) => frameOn(head([cartX(ckAt(f)) + 1.62, 0, 1.0]), 60, 0.24, 44, 52, -0.7, 0.5);   /* r76i (both reviewers): wider - the loaded cart reads on "Amos's loaves" (it was cut at the left edge) */   /* r76i: the figures lower, less bare cobble at the foot of the frame */   /* r76i: Amos a little smaller and left, room for the baker and the woman */   /* r76: Amos at 55 % from further round, so two laughing villagers stand clear on the right (reviewers: the street was empty on "the village calls them") */   /* r66: LOW tracking, lens near the cobbles (reviewers: eye level) */   /* r54: head lower in frame (a quarter of bare cobbles under him) */   /* r53: wider and lower: the whole cart left of Amos, less bare cobble under him */   /* r50: back a little: the whole cart and the laughing villager inside the frame */   /* r49: Amos left of centre (his brim was 5 px from the right edge, under the Shorts buttons) */   /* r47: tilted up (the cobbles filled the lower third) */   // r44b: (in to the knees pushed the laugher off the left edge)   // r42: a touch closer and higher: the laugher stands clear above the cart bed, less road under Amos   // r40: Amos a little right: the laughers clear of his head   // r35: tighter (the cobbles filled the lower quarter)   // r26: closer and lower (the road filled the lower third)   // ahead of Amos, looking back past him at the cart of loaves and the villagers trailing it
  const s5 = track((f) => TK(f).pos, (f) => TK(f).look, 52, 480, 0.0008);
  // the wheel match: the camera starts low on the cart wheel (472-486) and rises into the track
  const w0 = (f: number): Shot => { const x = cartX(ckAt(f)); return { pos: [x + 0.05, 2.05, 1.28], look: [x, 0.85, 1.0], fov: 50, roll: 0 }; };   // r7: the same view down into the cart bed
  // shot 6: quick push to Ned at the cart (lands on "who" 554)
  const SH6 = frameOn(head(V_NED), -50, 0.34, 38, 52, 0.2, 0.4);   /* r76i: further round, so the two nearer laughers stay out of Ned's frame */   // r7: from the left, clear of the lamp post; the cart of loaves right of Ned
  const s6 = F(() => SH6, 556, 0.0018);
  return [K(472, w0, 1, true), K(502, glideTo(w0, 502, s5, 516, 0), 1), K(546, glideTo(s5, 546, s6, 556, 0.1), 1)];
};
SUN_REF[2] = 530;   // r12: sun fixed from the street track (not the top-down cart bed)
SHOT_ACTS[2] = (f, s) => {
  const ck = ckAt(f), ax = cartX(ck) + 1.62, AV: V3 = [ax, 0, 1.0], walking = f < 548;   /* r44: right at the handle ends */
  const HR: A2 = [[-6, 14], [-24, 20]] as A2,   /* r76g: back on the shaft end (drawn in front low it floated beside the load) */ HL: A2 = [[-17, 13], [-29, 19]] as A2;   /* r48: (points are shoulder-relative) the near hand ON the near shaft end, the far hand behind him on the far shaft */   /* r47: the near hand up ON the shaft end, the far hand back behind him on the other shaft (one hand hung loose: the cart read parked) */   // r46: the cart is tipped up on its wheels so the shaft ends meet his hands   // r44: each hand on its shaft end (they hung beside the shafts)   // r44: hands down at the shafts (at chest height they gripped air)
  const fE = toward(2, s, f, AV, [AV[0] + 3, 0, AV[2]]), fNed = toward(2, s, f, AV, V_NED);
  const amos = walking ? pose(null, { expr: f >= 500 ? "determined" : "calm",   /* r76i (reviewer: the same deadpan in four shots): set-jawed as they laugh */ facing: fE >= 0 ? 1 : -1, look: 0,   /* r48: faces the way he walks, pulling (turned to the laughers he read as standing beside a parked cart) */   /* r39: he turns to the laughers, deadpan (he faced away from them) */   /* r38: a sideways glance at the laughers (he ignored them) */ armR: HR, armL: HL, armRFront: false, armLFront: true, mode: "walk", phase: (f - 459) / 13, tilt: 7 * (fE >= 0 ? 1 : -1), noAutoTilt: true })   /* r73: leaning into the pull */   /* r51: full stride on the review beat (frac ~0.7; at 0.25 the legs cross) */
    : flow(f, [[548, { expr: "calm", facing: fE, armR: AB.handleR, armL: AB.handleL, armRFront: true, armLFront: true }], [566, { expr: "bored", facing: fNed, armR: AR.hipR, armL: AR.hipL }, 10]]);
  const fA = (p: V3) => toward(2, s, f, p, AV);
  const baker = flow(f, [
    [470, { expr: "grin", facing: fA(V_BAKER), armR: [[26, -10], [36, -32]] as A2, armRFront: true, propR: "loaf", armL: [[-20, 14], [-26, 26]] as A2, armLFront: true, propL: "bread" }],   /* r76i: Amos's loaf held up high beside his head, his own bread low - the gag reads above the caption */
    [508, { expr: "laugh", facing: fA(V_BAKER), armR: [[26, -12], [36, -36]] as A2, armRFront: true, propR: "loaf", armL: [[-20, 14], [-26, 26]] as A2, armLFront: true, propL: "bread", shake: 0.6, phase: 0 }, 6],   /* the loaf out at shoulder height (raised, it covered the woman's face) */
  ]);
  const bakerO: P = f >= 508 ? { ...baker, phase: (f - 508) / 12 } : baker;
  // r5: the villagers trail the cart down the road behind it (in the track's background), laughing and pointing at the loaves
  const TR = (dx: number, dz: number): V3 => [ax + dx, 0, dz];
  const X520 = cartX(ckAt(520)) + 1.62; void TR; const wP: V3 = [-1.8, 0, -2.2],   /* r76i: behind and right of the baker - three head spans clear of each other */   /* r76h: both laughers at 5-6 m, 81 % and 93 % of the frame on "Amos's" (at 10 m their heads were specks) */   /* r76b: both laughers further back on the far pavement, clear of each other and the edge as the track drifts */   /* r68b: the two laughers stand back down the street, out of the track (behind the cart their heads peeked over the loaves) */   /* r42: further back on the far side of the street, clear above the cart bed (behind it she was half hidden) */ kP = TR(-7.2, -0.7),   /* r42: back in, left of the woman and clear of Amos (the street read empty) */   /* r40: the kid further back, clear of the woman and of Amos */   /* r35: closer behind the cart (they read small and hidden) */ mP: V3 = [-3.48, 0, -1.81]   /* r76i: the man further back and left, clear of her head (they overlapped) */, bP = TR(-2.4, -2.3);   // r6: heads clear of Amos's (no stacking)
  const woman = C("bv1", wP, pose(null, { ...laughP(f, 496, 0), facing: fA(wP), armL: [[-24, -4], [-42, -16]] as A2, armLFront: true, armR: AR.hipR }), { idx: 41 });   /* r76b: she points at the cart */
  const kid = C("bv3", kP, pose(null, { expr: f < 515 ? "grin" : "laugh", facing: fA(kP), armR: [[22, 14], [8, 22]] as A2, armRFront: true,   /* r36: hand on his belly (the pointing arm crossed his face) */ tilt: -3 + 2 * Math.sin(f * 0.3), mode: walking ? "walk" : undefined, phase: (f - 466) / 11 }), { idx: 42 });
  const man = C("bv2", mP, pose(null, { ...laughP(f, 505, 1), facing: fA(mP) }), { idx: 43 });
  // Ned (from 540): walks up, bends, heaves a loaf off the cart (572-600), strains, drops it back (600), worry, head shake (607)
  const fC = toward(2, s, f, V_NED, [V_NED[0] + 0.3, 0, 1.0]);
  const ned = flow(f, [
    [540, { expr: "neutral", facing: fC, armR: AR.hipR, armL: AR.hipL }],
    [560, { expr: "neutral", facing: fC, armR: [[26, 20], [36, 44]] as A2, armL: [[-26, 20], [-36, 44]] as A2, armRFront: true, armLFront: true, mode: "brace", braceK: 0.8, tilt: 10 }, 8],
    [572, { expr: "strain", facing: fC, armR: AB.heaveR, armL: AB.heaveL, armRFront: true, armLFront: true, propR: "loaf", mode: "brace", braceK: 1, tilt: -4, sweat: 1 }, 6],
    [588, { expr: "strain", facing: fC, armR: [[26, 10], [38, 4]] as A2, armL: [[-26, 10], [-38, 4]] as A2, armRFront: true, armLFront: true, propR: "loaf", mode: "brace", braceK: 1, tilt: 6, sweat: 1 }, 6],
    [600, { expr: "worry", facing: fC, armR: AR.hipR, armL: AR.hipL, mode: "brace", braceK: 0, sweat: 0.6 }, 5],                       // drops it back: thunk
    [604, { expr: "worry", facing: fNed * -1 || 1, armR: AR.shrugR, armL: AR.shrugL, headTilt: 6 }, 6],
    [610, { expr: "worry", facing: fNed * -1 || 1, armR: AR.shrugR, armL: AR.shrugL, headTilt: -6 }, 5],                            // shakes his head on "heavy"
  ]) as P;
  const cast: CastPlace[] = [C("amos", AV, amos, { idx: 1 })];
  // r37: a third laugher in a doorway behind Amos (the street read as two people)
  const dP = TR(-3.9, -3.5), door = C("bv4", dP, pose(null, { ...laughP(f, 492, 2), facing: fA(dP) }), { idx: 44 });
  void door; void kid; void man; void woman; cast.push(C("bkr", V_BAKER, bakerO, { idx: 45 }));   /* r76i (both reviewers: heads touching, his loaf over her face): the baker alone - Amos's loaf held high beside his own bread */   /* r76i (both reviewers): one big laugher only - the second head kept landing behind hers */   /* r76: two laughers back on, on the right of Amos at two depths (projection-placed, heads clear of his) */   /* r71: no trailing laughers in the track (wherever they stood they came out as a blurred cream figure at the cart's edge) */   /* r54: two villagers laugh (the wider track had one lone laugher) */   // r42b: the kid stood on her head   // r40: the woman alone, big and clear (the kid kept landing behind Amos's brim)   // r37b: (the doorway laugher stood behind Amos's big head: dropped)   // r10: the baker dropped from the track (his head touched Amos's brim)   // r7: the baker holds only his bread up; the far man dropped (off frame)
  if (f >= 540) cast.push(C("ned", f < 556 ? lerp3([V_NED[0] - 1.4, 0, V_NED[2] + 0.6], V_NED, sm(f, 540, 556)) : V_NED, f < 556 ? pose(null, { expr: "neutral", facing: 1, mode: "walk", phase: (f - 540) / 12 }) : ned, { idx: 5 }));
  return { ctl: { cart: ck, cartTilt: 0.14, wallH: 0, tea: 0, spring: 0, stick: 0 }, cast,
    fx: fxs(walking ? dustTrail("vcart", [cartX(ck) - 0.3, 0, 1.0], [1, 0], f, 3, 0.35, 0.3) : [], f >= 600 && f < 610 ? dustCard("ned", [V_NED[0] + 0.3, 0.75, 1.1], 0.3, 1 - (f - 600) / 10, 1) : null),
    focus: f < 548 ? head(AV) : head(V_NED), subj: f < 548 ? "amos" : "ned" };
};
lens3([[472, 8, 1], [506, 6.5, 20], [550, 7, 8]]);   /* r76i (reviewer): the street behind softer - depth separation */   /* r76: less blur so the laughing villagers read */   // r25: more depth (the street facades soft); r8: the trailing villagers' faces stay sharp

// ================================================= SCENE 3 (618-919) THE FIRST WEEK, DRIZZLE
// the unsold stack at YARD.STACK (-0.5, 0, 2.7) grows; Amos sits on an upturned barrow beside it; two builders pass with
// hods of normal bricks, one tries a loaf and rubs his back; the taxman counts every loaf, sneers, stamps; "Exactly."
const G_TAXX = 0.05; void G_TAXX;
const G_AMOS: V3 = [YARD.STACK[0] + 0.24, 0,   /* r76i (reviewer): sat ON the top of a four-course stack, its top face under him (on a front step he read pasted on the stack face) */   /* r43: further along the stack (the tricorn tip touched his arm) */ YARD.STACK[2] + 0.58],   /* r76i: on the front edge, legs down the front face */   /* r42: feet lower, his legs hang down the stack's face (sitLeg 0.4; tucked they did not read as sitting on it) */   /* r39: a hand clear of the stack face (its corner hid his legs) */   /* r38: he sits ON TOP of his unsold stack, legs over the front (on a low seat he read as standing) */ G_TAX: V3 = [0.2, 0, 4.95], G_B1: V3 = [1.6, 0, 1.4], G_B2: V3 = [1.55, 0, 3.85];   // r5: the CP3 grey lock staging
SHOT_CAMS[3] = () => {
  const SH7: CamT = { pos: [2.2, 3.2, 7.6], look: [0.4, 0.5, 2.9], fov: 52, roll: 0 };   // r7: HIGH medium-wide: the stack, Amos on his seat, the builder straining (heads above the caption band)
  const s7 = F(() => SH7, 618, 0.0016);
  // r5: the CP3 grey lock two-shot: the taxman in front (head ~36%), Amos on his loaf seat behind (3/4 to each other), the stack between
  const SH8: CamT = { pos: [1.45, 2.95, 7.5], look: [-1.66, 0.05, 2.6], fov: 55, roll: 0 };   /* r76i (reviewer: the caption sat on the taxman's chin): tilted down - his head above the caption band, less busy yard on top */   /* r76i (reviewer): aimed a little higher - less bare paving at the foot */   /* r76i (reviewer): pushed in, aimed higher - less bare paving at the foot */   /* r72: a HIGH angle down on the sneer (reviewers: every frame at eye height) */   /* r68b: wider - the taxman's shoes and Amos's hand inside the frame */   /* r62: a touch left (the ledger was cut by the left edge); (low, the loaf stack blocked the lens) */   /* r48: a touch right (the boater brim touched the right edge) */   /* r46: the ledger clear of the left edge */   /* r44: in to the knees (the wet paving took the lower 30 %) */   /* r42: panned left a touch (the ledger was cut by the left edge) */   // r40: a medium two-shot (the full figure left a quarter of wet floor)   // r26d: tilted up, less wet ground below the feet   // r25: Amos's brim clear of the right edge   // r10: a little wider: the tricorn and Amos clear of the edges   // r6: tilted down: eyes at 42% / 46%, wet ground in front
  const s8 = F(() => SH8, 716, 0.0009);
  // "and Amos just nods": a slow glide in on Amos (22 f) landing before "Exactly." (890)
  const AMQ = frameOn([G_AMOS[0], G_AMOS[1] + 1.04, G_AMOS[2]], 14, 0.4, 52, 52, 0.25, 0.42);
  const sQ = F(() => AMQ, 884, 0.0016);
  return [K(618, s7, 1, true), K(704, glideTo(s7, 704, s8, 716, 0.15), 1), K(862, glideTo(s8, 862, sQ, 884, 0), 1)];
};
SHOT_ACTS[3] = (f, s) => {
  const fT = f < 700 ? toward(3, s, f, G_AMOS, G_TAX) : -0.6,   /* r56: Amos turns to the taxman (screen-left) for the sneer and his nod */ fStack = toward(3, s, f, G_TAX, YARD.STACK), fA0 = toward(3, s, f, G_TAX, G_AMOS), fA = 1; void fA0;   /* r56: Amos sits screen-right of him in this two-shot: face right (+1 measured right in a lit preview) */   /* r53: a clear three-quarter turn to Amos for the sneer (he read as playing to the lens) */
  const amos = flow(f, [
    [618, { expr: "sly", facing: fT, armR: [[16, 12], [-10, 16]] as A2, armRFront: true, armL: [[-16, 14], [10, 18]] as A2, armLFront: true, tilt: -4 }],   /* r76i (both reviewers): he stands arms folded in front of his unsold stack (sat on it he read as a statue on a plinth) */   /* r76f: hands on his knees (spread, they touched nothing) */   // r38: hands on the loaves either side of him   // r24: the empty first week reads on his face (patient, unbothered)
    [860, { expr: "sly", facing: fT, armR: [[16, 12], [-10, 16]] as A2, armRFront: true, armL: [[-16, 14], [10, 18]] as A2, armLFront: true, tilt: -4, headTilt: 6 }, 6],   // nods (883)
    [880, { expr: "sly", facing: fT, armR: [[16, 12], [-10, 16]] as A2, armRFront: true, armL: [[-16, 14], [10, 18]] as A2, armLFront: true, tilt: -4, headTilt: -4 }, 5],
    [889, { expr: "smug", facing: fT, armR: [[26, -4], [40, -20]] as A2, armRFront: true, armL: AR.hipL, headTilt: 3 }, 5],
  ]) as P;
  const amosQ = speak(f, 889, 918, amos);
  const tax = flow(f, [
    [700, { expr: "tache", facing: fStack, armR: AB.quillR, armRFront: true, propR: "quill", armL: AB.ledgerL, armLFront: true, propL: "ledger", propK: 1 }],
    [728, { expr: "stern", facing: fStack, armR: [[24, 2], [44, -2]] as A2, armRFront: true, propR: "quill", armL: AB.ledgerL, armLFront: true, propL: "ledger", propK: 1 }, 6],
    [768, { expr: "tacheUp", facing: fA, tilt: -4, armR: [[14, 0], [-16, -6]] as A2,   /* r76: the stamp in his hand from the sneer (the line says stamping; he held a quill) */   /* r61: leans back, superior (leaning in, his tricorn touched Amos) */ armRFront: true, propR: "stamp",   /* r58: tucked in (it still crossed Amos) */   /* r54: raised, wagging (pointed out it crossed Amos's apron) */   /* r53: the quill pointed at Amos on "A brick's a brick, Amos" */   /* r38b: hand on his hip for the sneer (the quill crossed Amos on the stack) */ armL: [[-28, 16], [-36, 2]] as A2, armLFront: true, propL: "ledger", propK: 1, propsOver: true, headTilt: -5 }, 6],   /* r61: the upper arm shows beside the ledger (the book hid the whole arm) */   // sneers (r42: ledger nearer his body) (ledger held low, clear of his face)
    [826, { expr: "tacheUp", facing: fA, armR: AB.stampUpR, propR: "stamp", armRFront: true, armL: AB.ledgerL, armLFront: true, propL: "ledger", propK: 1, tilt: -3 }, 6],
    [834, { expr: "tacheUp", facing: fA, armR: AB.stampDnR, armRFront: true, propR: "stamp", armL: AB.ledgerL, armLFront: true, propL: "ledger", propK: 1, tilt: 4 }, 2],            // STAMP (836)
    [846, { expr: "tache", facing: fA, armR: AR.hipR, armL: AB.ledgerL, armLFront: true, propL: "ledger", propK: 0 }, 8],
    [892, { expr: "tache", facing: fA, armR: AR.hipR, armL: AB.ledgerL, armLFront: true, propL: "ledger", propK: 0, look: 0.2 }, 6],
  ]) as P;
  const cbob = f > 728 && f < 768 ? 3.5 * Math.sin(((f - 728) / 6.5) * Math.PI) : 0;   // a nod per loaf counted
  const taxQ0 = speak(f, 772, 810, { ...tax, headTilt: ((tax.headTilt as number) ?? 0) + cbob });
  // r35: a sneer, not a shout: the wide-open talk mouths become narrow ones on his line, chin up
  const SNEER: Record<string, string> = { tOBig: "tE", tO: "tSmall", tWide: "tE", tTongue: "tSmall" };
  const taxQ = f >= 772 && f < 810 ? { ...taxQ0, mouth: SNEER[taxQ0.mouth as string] ?? taxQ0.mouth, headBack: 0.15 } : taxQ0;
  // builders: bld1 walks past with a hod of normal bricks; bld2 tries a loaf off the stack, strains, rubs his back (695)
  const b1p = lerp3([2.8, 0, 0.6], [-0.2, 0, 1.0], lin(f, 618, 720));
  const bld1 = C("bld1", b1p, pose(null, { expr: f < 672 ? "neutral" : "stern", facing: toward(3, s, f, b1p, f < 672 ? [-1, 0, 1] : YARD.STACK), mode: "walk", phase: (f - 618) / 13, armR: AB.carryR, armRFront: true, propR: "brick", headTilt: f > 680 && f < 700 ? 6 * Math.sin((f - 680) * 0.6) : 0 }), { idx: 51 });
  const fS2 = toward(3, s, f, G_B2, YARD.STACK);
  const bld2 = C("bld2", G_B2, flow(f, [
    [618, { expr: "neutral", facing: fS2, armR: AR.hipR, armL: AR.hipL }],
    [646, { expr: "strain", facing: fS2, armR: AB.heaveR, armL: AB.heaveL, armRFront: true, armLFront: true, propR: "loaf", mode: "brace", braceK: 1, sweat: 1 }, 8],
    [672, { expr: "worry", facing: fS2, armR: AR.hipR, armL: AR.hipL, mode: "brace", braceK: 0.3 }, 6],
    [688, { expr: "tache", facing: -fS2 || 1, armR: AB.backR, armL: AR.hipL, tilt: -6 }, 8],   // rubs his back: "too heavy"
  ]), { idx: 52 });
  const cast: CastPlace[] = [C("amos", G_AMOS, amosQ as FigOpts, { idx: 1 })];
  if (f < 760) cast.push(bld1, bld2);
  if (f >= 690) cast.push(C("tax", f < 712 ? lerp3([-2.6, 0, 4.4], G_TAX, sm(f, 690, 712)) : G_TAX, f < 712 ? pose(null, { ...tax, mode: "walk", phase: (f - 690) / 12 }) : (taxQ as FigOpts), { idx: 3 }));
  return { ctl: { rain: 1, stack: 1, lantern: 0, cart: 0, cartOn: 0, loaf: 0, clay: 0, mouldOn: 0 }, cast,
    fx: fxs(f >= 836 && f < 846 ? clang("stamp", [G_TAX[0] - 0.25, 1.15, G_TAX[2] + 0.1], f - 836, 0.3) : null),
    focus: f < 712 ? [YARD.STACK[0], 0.9, YARD.STACK[2]] : f < 860 ? head(G_TAX) : head(G_AMOS, 1.14), subj: f < 712 ? null : f < 860 ? "tax" : "amos" };
};
KICKS.push([836 / 30, 0.18]);
lens3([[618, 9, 1], [704, 9, 12]]);   /* r76i (reviewer: the yard as sharp as the taxman): softer still */   /* r76i: the yard behind the pair softer */   // r9: the ground in front of the two-shot stays sharp
