// =====================================================================================================================
// "They Scrapped Late Fees and Got a Truckload of Books Back": scenes 1-2 (the hook outside, the desk, the board room).
// Faces: Marge = calm half-lid, determined in the hook, a smirk at the payoff; never shock. Gary = tache by default, smug on
// the stamp, guffaw -> angry on the shout. Dwayne = joy in the hook, worry -> dismay at the desk.
// Rick study 2026-11-16 (RICK_WATCH_3.md): secondary motion in every shot, bigger camera travel, hook head 32%.
const FL = LIB.FLOOR;
const bedAt = (zr: number, dz: number, WB = 3.1): V3 => {
  const yr = stepY(zr) + (zr > 1.0 ? -0.15 : 0), yf = stepY(zr + WB) + (zr + WB > 1.0 ? -0.15 : 0);
  return [0, yr + 0.67 - dz * (yr - yf) / WB, zr + dz];
};
/** over-the-shoulder: camera behind `fg` (a head) looking at `tgt`; side > 0 puts fg on the LEFT of the frame */
const ots = (fg: V3, tgt: V3, side: number, back: number, up: number, fov = 50, lookDy = 0): { pos: V3; look: V3; fov: number } => {
  const dx = tgt[0] - fg[0], dz = tgt[2] - fg[2], L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L, rx = -uz, rz = ux;
  return { pos: [fg[0] - ux * back + rx * side, fg[1] + up, fg[2] - uz * back + rz * side], look: [tgt[0], tgt[1] + lookDy, tgt[2]], fov };
};
const leaf = (key: string, x0: V3, f: number, a: number, dir: [number, number] = [1, 0.3]): FxSpec | null => {
  const t = f - a; if (t < 0 || t > 70) return null;
  const k = t / 70, w = Math.sin(t * 0.35);
  return { kind: "card", key: "leaf" + key + (Math.floor(t / 2) % 4), pos: [x0[0] + dir[0] * 2.4 * k, x0[1] + 0.25 * w - 0.4 * k, x0[2] + dir[1] * 2.4 * k], w: 0.09, h: 0.07, cw: 32, ch: 24,
    draw: (p) => { const g = p.g; g.translate(16, 12); g.rotate(t * 0.4); g.fillStyle = ["#d88a2a", "#c4602a", "#e0b040"][(key.length + a) % 3]; g.strokeStyle = INKC; g.lineWidth = 2.5; g.beginPath(); g.ellipse(0, 0, 13, 7, 0, 0, 6.3); g.fill(); g.stroke(); } };
};
/** a stamped BLOCKED mark that slams onto the card (age 0..) */
const blockedStamp = (pos: V3, age: number): FxSpec | null => {
  if (age < 0 || age > 60) return null;
  const k = age < 3 ? 1.6 - 0.2 * age : 1;
  return { kind: "card", key: "blocked" + Math.round(k * 10), pos, w: 0.3 * k, h: 0.12 * k, cw: 256, ch: 96, rot: -0.12,
    draw: (p) => { const g = p.g; g.strokeStyle = "#c8282a"; g.lineWidth = 9; g.strokeRect(8, 8, 240, 80); g.fillStyle = "#c8282a"; g.font = "900 54px Arial Black, Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("BLOCKED", 128, 50); } };
};

// ================================================= SCENE 1 (0-119) LIBRARY FRONT, GOLDEN MORNING
const M1: V3 = [4.78, 0, -1.2], POST: V3 = LIB.SIGNPOST;   // right of the post: the bin stays out of the hook
const TZ1 = 1.6;   // the truck's rear axle in the hook: backed up to the kerb, tailgate over the sidewalk
const TX1 = 7.6, DW1: V3 = (() => { const b = bedAt(TZ1, -0.8); return [TX1, b[1], b[2]]; })();
const SH1 = frameOn(head(M1), 14, 0.32, 56, 58, -0.3, 0.42);   // the sign on her left, the steps behind
const s1c = F(() => SH1, 24, 0.0016);
/** the hook: a fast 24-frame push from 1.7x away and below (Rick's openings move from frame 0) */
const s1 = (f: number): Shot => { const c = s1c(f); if (f >= 24) return c; const k = 1 - Math.pow(1 - f / 24, 3), far = lerp3(c.look, c.pos, 1.7); return { ...c, pos: lerp3([far[0] - 0.5, far[1] - 0.35, far[2]], c.pos, k) }; };
const SH2 = ots(head(M1), [DW1[0] + 0.9, DW1[1] + 0.7, DW1[2] - 0.7], 0.55, 1.3, 0.3, 50);   // past Marge (lower left) to the tailgate and the book wave
const s2 = F(() => SH2, 70, 0.0022);
const DOORWAY = { pos: [0.3, 3.15, -7.0] as V3, look: [0.4, 2.75, -12.6] as V3, fov: 56 };
const sDoor = (f: number): Shot => { const k = sm(f, 104, 136); return { pos: [0.0, 3.15, lerp(-6.6, -9.2, k)], look: DOORWAY.look, fov: 56, roll: 0 }; };
const sPre = (f: number): Shot => ({ pos: [0.0, 3.5, -2.2 - 0.02 * (f - 108)], look: [0.0, 2.9, -11.0], fov: 56, roll: 0 });
SHOT_CAMS[1] = () => [K(0, s1, 1, true),
  K(60, swing(s1, 60, s2, 69, 0.15), 1),                         // whip left to the truck (lands on "truckload")
  K(100, glideTo(s2, 100, sPre, 114, 1.3, [0, 0, 0], 0.65, 0.4), 1),    // crane UP first (clear of Marge's head), then over to the centre of the steps
  K(114, glideTo(sPre, 114, sDoor, 126), 1)];                          // straight in between the middle columns (starts where the crane ends)
SHOT_ACTS[1] = (f, s) => {
  const fPost = toward(1, s, f, M1, POST);
  const marge = C("marge", M1, flow(f, [
    [0, { expr: "determined", facing: fPost, mode: "brace", braceK: 0.8, tilt: 11, armR: [[-16, -8], [-50, -20]] as A2, armL: [[-30, -12], [-58, -24]] as A2, armRFront: true, armLFront: true }],
    [12, { expr: "determined", facing: fPost, tilt: -4, armR: [[6, 6], [-24, -6]] as A2, armL: [[-24, 4], [-40, -8]] as A2, armRFront: true, armLFront: true }, 4],     // snap: the sign in her hands
    [20, { expr: "smug", facing: fPost, tilt: 6, armR: [[24, -22], [44, -46]] as A2, armL: [[6, -30], [26, -58]] as A2, armRFront: true }, 6],               // toss over her right shoulder
    [44, { expr: "smug", facing: fPost, tilt: 0, armR: [[24, 16], [30, 30]] as A2, armL: [[-24, 16], [-30, 30]] as A2, armRFront: true, armLFront: true }, 8],     // dusts her hands
    [58, { expr: "calm", facing: toward(1, s, f, M1, DW1), look: -0.4 }, 8],
    [100, { expr: "smug", facing: toward(1, s, f, M1, DW1), armR: [[20, -6], [30, -30]] as A2, armRFront: true, propR: f >= 106 ? "libBook" : undefined }, 6],   // catches a book
  ]), { idx: 1 });
  const dwayne = C("dwayne", DW1, flow(f, [
    [0, { expr: "joy", facing: -1, mode: "brace", braceK: 0.6, armR: AB.heaveR, armL: AB.heaveL, armRFront: true, armLFront: true }],
    [76, { expr: "determined", facing: -1, mode: "brace", braceK: 1, tilt: 8, armR: [[26, 8], [44, 4]] as A2, armL: [[-2, 8], [30, 4]] as A2, armRFront: true, armLFront: true }, 6],
    [90, { expr: "joy", facing: -1, mode: "brace", braceK: 1, tilt: 16, armR: [[34, 2], [64, -2]] as A2, armL: [[10, 2], [52, -2]] as A2, armRFront: true, armLFront: true }, 4],   // the shove
  ]), { idx: 2 });
  const signP = f < 12 ? 1 : f < 18 ? 1 : 2;
  const ctl: Ctl = {
    lamps: 0, libLit: 0, truckOn: 1, truckZ: TZ1, truckX: TX1, tailgate: sm(f, 66, 76), truckBooks: 1 - 0.7 * sm(f, 90, 112), books: sm(f, 90, 118) * 1.0,
    signP, signX: f < 12 ? POST[0] + 0.08 * lin(f, 0, 12) : M1[0] - 0.32, signY: f < 12 ? 1.62 - 0.04 * lin(f, 0, 12) : 1.36, signZ: f < 12 ? POST[2] + 0.1 * lin(f, 0, 12) : M1[2] + 0.12,
    signRz: f < 12 ? -0.25 * lin(f, 0, 12) : -0.1, signFly: lin(f, 18, 44), signDX: 2.2, signDZ: -1.8, postK: lin(f, 12, 40), hatch: 0, binFill: 0,
  };
  const fx = fxs(f >= 12 && f < 26 ? dustCard("snap", [POST[0], 1.4, POST[2] + 0.1], 0.3, 1 - (f - 12) / 14, 3) : null,
    sparkle("screw1", [POST[0] + 0.05, 1.5, POST[2] + 0.12], f - 12, 0.14), sparkle("screw2", [POST[0] - 0.05, 1.7, POST[2] + 0.1], f - 14, 0.12),
    leaf("a", [1.8, 1.6, -0.2], f, 0), leaf("b", [5.2, 2.2, 0.6], f, 30, [-1, -0.4]), leaf("c", [0.4, 1.9, -2.6], f, 64),
    f >= 92 ? dustTrail("steps", [TX1 + 2.0, 0.1, -0.6], [0.3, 1], f, 6, 0.8, 0.9) : []);
  return { ctl, cast: [marge, dwayne], fx, focus: follow(f, [[0, head(M1)], [69, add3(DW1, 0, 1.3, 0), 9], [118, [0.5, 2.6, -12.4], 14]]), subj: f < 64 ? "marge" : "dwayne" };
};
KICKS.push([12 / 30, 0.3], [91 / 30, 0.18]);
lens3([[0, B_MS], [64, B_FS, 8], [104, B_WS, 18]]);

// ================================================= SCENE 2 (119-679) THE DESK, THEN THE BOARD ROOM
const GD: V3 = [0.7, FL, -13.95], DD: V3 = [0.35, FL, -12.15], DOOR_IN: V3 = [0.0, FL, -8.4];
const CARD_AT: V3 = [0.52, FL + 0.95, -12.62];
const SH3 = { pos: [5.1, FL + 1.5, -13.0] as V3, look: [0.5, FL + 1.22, -13.12] as V3, fov: 54 };   // side-on: Dwayne left, Gary right across the counter, both ~4 m away
const s3 = F(() => SH3, 150, 0.0018);
const SH4 = ots(head(DD), [0.62, FL + 1.12, -13.4], 0.48, 1.15, 0.18, 50);
const s4 = F(() => SH4, 206, 0.0012);
/** Dwayne leaves (back view) along the hall: 236 -> 266 */
const dwLeave = (f: number): V3 => lerp3(DD, [-2.9, FL, -11.5], sm(f, 236, 268));
const s4pan = (f: number): Shot => { const p = dwLeave(f), c = s4(236); const look = lerp3(c.look, [p[0], FL + 1.15, p[2]], sm(f, 236, 250)); return { pos: lerp3(c.pos, add3(c.pos, 0.35, 0.05, 0.6), sm(f, 236, 262)), look, fov: c.fov, roll: 0 }; };
// Marge strides across the hall right of the desk (232-300) into the board room, to the head of the table
const MH: V3 = [6.0, FL, -15.2];
const margeWalk = [[3.4, FL, -10.9], [3.75, FL, -13.2], [3.9, FL, -14.4], [5.2, FL, -15.05], MH] as V3[];
const mPos = (f: number) => along(margeWalk, 0.083, 232, f);
const sFollow = (f: number): Shot => { const m = mPos(Math.min(f, 300)).p; return { pos: [lerp(2.0, 3.0, sm(f, 262, 300)), FL + 1.55, lerp(-11.0, -12.9, sm(f, 262, 300))], look: [m[0], FL + 1.25, m[2]], fov: 56, roll: 0 }; };
// the board: Gary, Harold, Denise seated, Kevin at the whiteboard later
const BROOM: Room = { x0: 2.25, x1: 9.8, z0: -22.8, z1: -14.15, y1: 4.3 };
const SEAT = 0.3;   // seated cards sit 0.3 m up so their heads clear a 0.8 m table (sit-mode heads are 0.85 m above the feet)
const GS: V3 = [4.95, FL + SEAT, -16.4], HA: V3 = [7.05, FL + SEAT, -17.4], DE: V3 = [4.95, FL + SEAT, -18.4], KE: V3 = [7.05, FL + SEAT, -19.4], KB: V3 = [4.9, FL, -22.7];
const hs = (p: V3) => head(p, 0.85);   // seated head
const SH5 = { pos: [8.6, FL + 1.75, -17.2] as V3, look: [5.5, FL + 1.1, -15.8] as V3, fov: 60 };   // window side: Marge at the head (left), Gary seated (right), Harold just out of frame
const sMid = (f: number): Shot => ({ pos: [4.3, FL + 1.95, -15.2], look: [7.6, FL + 1.45, -19.6], fov: 58, roll: 0 });   // through the doorway, looking down the table
const s5 = F(() => SH5, 300, 0.0022);
const SH6 = frameOn(head(MH), 110, 0.27, 56, 52, 0.18, 0.37);   // medium from the window side: clear of the chairs, the wastebasket just left of her
const s6 = F(() => SH6, 334, 0.0024);
const SH7 = frameOn(hs(GS), 74, 0.3, 42, 46, 0.12, 0.42);   // across the table: Gary left, Denise laughing on the right   // from the head end of the table: Gary 3/4, the table edge on the right
const s7 = F(() => SH7, 392, 0.0018);
const COAST: V3 = [5.35, FL + 0.82, -16.45];
const s8 = (f: number): Shot => { const k = sm(f, 455, 470); return { pos: [COAST[0] + 0.12, COAST[1] + lerp(1.1, 0.66, k) + 0.02 * Math.sin(f * 0.05), COAST[2] + 0.1], look: [COAST[0] + 0.03, COAST[1], COAST[2] + 0.02], fov: 46, roll: 0.15 * (f - 455) / 90 }; };   // tilted in from the far side, clear of Gary's head
const SH9 = frameOn(hs(GS), 84, 0.38, 50, 42, 0.1, 0.42);   // close across the table
const s9 = F(() => SH9, 548, 0.0028);
const C10: V3 = [6.0, FL + 1.55, -20.7];
const s10a = F(() => ({ pos: C10, look: [6.0, FL + 1.0, -16.8] as V3, fov: 56 }), 600, 0.0025);                    // up the table: Harold and Denise laughing, Gary, Marge at the head
const s10b = F(() => ({ pos: [6.0, FL + 1.7, -18.9] as V3, look: [6.0, FL + 1.8, -23.0] as V3, fov: 60 }), 632, 0.0012);   // straight on, far enough for the whole board, Kevin at its left end   // Kevin writing on the board
const s10c = (f: number): Shot => { const k = sm(f, 648, 679); return { pos: lerp3(C10, [6.0, FL + 1.5, -17.9], k), look: lerp3([6.0, FL + 1.1, -16.6], [6.0, FL + 1.25, -15.2], k), fov: lerp(56, 52, k), roll: 0 }; };   // push up the table to Marge
SHOT_CAMS[2] = () => [K(100, sPre, 1, true), K(114, glideTo(sPre, 114, sDoor, 126), 1),
  K(124, glideTo(sDoor, 124, s3, 156, 0.0, [0, 0, 0], 0, 0.3), 1),        // glide from the doors to the desk two-shot (lands on "Gary" 169)
  K(196, glideTo(s3, 196, s4, 206), 1),                                    // quick push over Dwayne's shoulder on "blocks"
  K(236, s4pan, 14),                                                        // pan with Dwayne to the door
  K(258, glideTo(s4pan, 258, sFollow, 276, 0.1), 1),                       // turn with Marge striding past
  K(286, glideTo(sFollow, 286, sMid, 298), 1),                           // up through the doorway behind Marge
  K(296, swing(sMid, 296, s5, 312, 0.15), 1),                             // across the table end to the window side, turning (never tips down)
  K(328, glideTo(s5, 328, s6, 338), 1),                                    // quick push to Marge for the quote
  K(384, swing(s6, 384, s7, 393, 0.08), 1),                                // whip to Gary laughing
  K(452, glideTo(s7, 452, s8, 464, 0.1), 1),                               // push down to the coaster
  K(540, glideTo(s8, 540, s9, 551, 0.05), 1),                              // tilt up to Gary's shout
  K(579, glideTo(s9, 579, s10a, 600, 0.3), 1),                            // glide out to the far end of the table
  K(622, swing(s10a, 622, s10b, 632, 0.05), 1),                           // whip to Kevin at the board
  K(644, swing(s10b, 644, s10c, 654, 0.45), 1)];                           // back round and push up the table to Marge
SHOT_ACTS[2] = (f, s) => {
  const cast: CastPlace[] = [];
  // --- the hall: two readers at the tables turning pages (life in the background)
  cast.push(C("reader1", [-5.6, FL + 0.3, -10.05], pose(null, { mode: "sit", expr: "calm", facing: 1, propR: "libBook", armR: [[20, 14], [30, 2]] as A2, armRFront: true, headTilt: 3 * Math.sin(st(f) * 0.05) }), { idx: 30 }));
  cast.push(C("reader2", [-5.0, FL + 0.3, -11.15], pose(null, { mode: "sit", expr: "neutral", facing: -1, propR: "newspaper", armR: [[20, 10], [30, -2]] as A2, armRFront: true, look: f > 150 && f < 200 ? 0.6 : 0 }), { idx: 31 }));
  // --- the desk (119-270)
  if (f < 300) {
    const fG = toward(2, s, f, GD, DD), fD = toward(2, s, f, DD, GD);
    cast.push(C("gary", GD, flow(f, [
      [100, { expr: "tache", facing: fG, armR: AB.ledgerL.map(([x, y]) => [-x, y]) as A2, armRFront: true, propR: "stamp" }],
      [146, { expr: "tache", facing: fG, armL: [[-24, 4], [-46, 14]] as A2, armLFront: true, propR: "stamp" }, 6],           // taps the OWE $10 sign
      [166, { expr: "tacheUp", facing: fG, look: 0.5, headTilt: -5, propR: "stamp" }, 6],                                    // looks up over his glasses
      [184, { expr: "tache", facing: fG, armL: AB.holdOutR.map(([x, y]) => [-x, y]) as A2, armLFront: true, propR: "stamp" }, 6],   // holds out his hand for the card
      [193, { expr: "smug", facing: fG, armR: AB.stampUpR, armRFront: true, propR: "stamp" }, 5],
      [200, { expr: "smug", facing: fG, armR: AB.stampDnR, armRFront: true, propR: "stamp", tilt: 6 }, 2],                  // SLAM
      [214, { expr: "smug", facing: fG, armR: [[24, 10], [34, 22]] as A2, armRFront: true, propR: "stamp", tilt: 0 }, 6],
      [244, { expr: "tache", facing: toward(2, s, f, GD, dwLeave(f)), propR: "stamp", look: -0.3 }, 8],
    ]), { idx: 3 }));
    if (f < 270) {
      const leaving = f >= 236, p = leaving ? dwLeave(f) : DD;
      cast.push(C("dwayne", p, leaving ? pose(null, { expr: "dismay", mode: f < 266 ? "walk" : "stand", phase: ph(f, 16), facing: toward(2, s, f, DD, [-2.9, FL, -11.5]), tilt: 6, headTilt: 8 }) : flow(f, [
        [100, { expr: "worry", facing: fD, armR: [[22, -10], [34, -36]] as A2, armRFront: true, propR: "overdue" }],                // the pink $10.40 slip held up
        [146, { expr: "worry", facing: fD, armR: [[22, 4], [36, -6]] as A2, armRFront: true, propR: "overdue" }, 6],
        [180, { expr: "nervous", facing: fD, armR: AB.holdOutR, armRFront: true, propR: "card" }, 6],                              // hands over his card
        [203, { expr: "shock", facing: fD, armR: [[20, 14], [26, 30]] as A2, tilt: -6, sweat: 1 }, 3],                             // flinch
        [226, { expr: "dismay", facing: fD, tilt: 9, headTilt: 10, armR: HANG(1), armL: HANG(-1) }, 8],                            // slumps
      ]), { idx: 4 }));
    }
  }
  // --- Marge: strides across the hall (232-300), then at the head of the table
  if (f >= 226) {
    const w = mPos(f), atHead = f >= 300, fB = toward(2, s, f, MH, GS);
    cast.push(C("marge", w.p, !atHead ? pose(null, { expr: "calm", mode: w.moving ? "walk" : "stand", phase: ph(f, 14), facing: toward(2, s, f, w.p, add3(w.p, w.d[0], 0, w.d[1])), armR: AB.ledgerL.map(([x, y]) => [-x, y]) as A2, armRFront: true, propR: "ledger" }) :
      speak(f, 346, 386, flow(f, [
        [300, { expr: "calm", facing: fB, armR: AB.slamR, armRFront: true, propR: "ledger", tilt: 5 }],
        [319, { expr: "calm", facing: fB, armR: [[26, 14], [40, 30]] as A2, armRFront: true, propR: "ledger", tilt: 7 }, 3],           // SLAP on the table
        [338, { expr: "calm", facing: toward(2, s, f, MH, [7.05, FL, -15.2]), armR: [[24, -6], [48, -10]] as A2, armRFront: true, propR: "ledger" }, 6],
        [349, { expr: "calm", facing: toward(2, s, f, MH, [7.05, FL, -15.2]), armR: [[26, 10], [50, 18]] as A2, armRFront: true }, 3],  // drops it in the bin
        [362, { expr: "calm", facing: fB, armR: [[20, 14], [16, 26]] as A2, armL: [[-20, 14], [-16, 26]] as A2, armRFront: true, armLFront: true }, 6],   // brushes her hands
        [400, { expr: "calm", facing: fB, look: 0.2 }, 10],
        [650, { expr: "calm", facing: fB, armR: AB.sipR, armRFront: true, propR: "teaMug" }, 8],                                            // sips tea
        [664, { expr: "smug", facing: fB, armL: [[-22, -10], [-34, -36]] as A2, armLFront: true, propL: "loopKey", propR: "teaMug", armR: AB.sipR, armRFront: true }, 6],   // dangles the key
      ])), { idx: 1 }));
  }
  // --- the board (seated)
  if (f >= 200) {
    const toM = (p: V3) => toward(2, s, f, p, MH);
    const laughing = f >= 388 && f < 470, roar = f >= 585;
    cast.push(C("gary", GS, speak(f, 545, 581, flow(f, [
      [262, { expr: "tache", mode: "sit", facing: toM(GS), armR: [[24, 14], [40, 8]] as A2, armRFront: true, propR: "coffeeCup" }],
      [326, { expr: "tacheUp", mode: "sit", facing: toM(GS), armR: [[24, 14], [40, 8]] as A2, armRFront: true, propR: "coffeeCup" }, 6],
      [389, { ...laughP(f, 389, 0), mode: "sit", facing: toM(GS), armR: [[26, 6], [44, 0]] as A2, armRFront: true, propR: "coffeeCup" }, 4],
      [404, { ...laughP(f, 389, 0), mode: "sit", facing: toM(GS), armL: [[-24, 12], [-40, 26]] as A2, armLFront: true, armR: [[26, 6], [44, 0]] as A2, propR: "coffeeCup" }, 3],   // slaps the table
      [420, { ...laughP(f, 389, 0), mode: "sit", facing: toM(GS), armR: [[30, 0], [52, -14]] as A2, armRFront: true }, 3],    // the jerk: coffee flies
      [470, { expr: "guffaw", mode: "sit", facing: toM(GS), shake: 0.5, phase: f / 12 }, 8],
      [547, { expr: "angry", mode: "sit", facing: toM(GS), tilt: 9, armR: AB.pointR, armRFront: true }, 4],                  // leans in, jabs at "everything"
      [556, { expr: "angry", mode: "sit", facing: toM(GS), tilt: 11, armR: [[30, -10], [62, -16]] as A2, armRFront: true }, 3],
      [585, { ...laughP(f, 585, 1), expr: "mock", mode: "sit", facing: toM(GS) }, 8],
    ])), { idx: 3 }));
    cast.push(C("harold", HA, flow(f, [
      [262, { expr: "neutral", mode: "sit", facing: toM(HA), armR: [[22, 12], [34, 2]] as A2, armRFront: true, propR: "bread" }],
      [326, { expr: "neutral", mode: "sit", facing: toM(HA), headBack: 0.2, propR: "bread", armR: [[22, 12], [34, 2]] as A2, armRFront: true }, 6],   // brows up
      [395, { ...laughP(f, 395, 2), mode: "sit", facing: toM(HA), propR: "bread", armR: [[22, 4], [24, -14]] as A2, armRFront: true }, 6],
      [585, { ...laughP(f, 585, 3), expr: "guffaw", mode: "sit", facing: toM(HA), propR: "bread", armR: [[22, -2], [18, -24]] as A2, armRFront: true }, 6],   // bites the sandwich, laughs
    ]), { idx: 5 }));
    cast.push(C("denise", DE, flow(f, [
      [262, { expr: "neutral", mode: "sit", facing: toM(DE) }],
      [400, { ...laughP(f, 400, 4), expr: "mock", mode: "sit", facing: toM(DE) }, 6],
      [600, { expr: "mock", mode: "sit", facing: toM(DE), armR: AB.pointR, armRFront: true, shake: 0.6, phase: f / 12 }, 5],   // points at Marge
    ]), { idx: 6 }));
    const kAtBoard = f >= 596, KW: V3 = [7.45, FL, -22.3], KE0: V3 = [KE[0], FL, KE[2]], kp = !kAtBoard ? KE : f < 607 ? lerp3(KE0, KW, sm(f, 596, 607)) : lerp3(KW, KB, sm(f, 607, 618));   // round the end of the table, clear of the lens
    cast.push(C("kevin", kp, kAtBoard ? flow(f, [
      [596, { expr: "grin", mode: f < 618 ? "walk" : "stand", phase: ph(f, 14), facing: toward(2, s, f, KE, KB) }],
      [618, { expr: "grin", facing: toward(2, s, f, KB, [6.0, FL, -23.0]), armR: [[22, -10], [40, -30]] as A2, armRFront: true, propR: "marker" }, 4],   // uncaps the marker
      [628, { expr: "grin", facing: toward(2, s, f, KB, [6.0, FL, -23.0]), armR: [[26, -14], [50 + 8 * Math.sin(f * 0.6), -26 + 6 * Math.cos(f * 0.9)]] as A2, armRFront: true, propR: "marker" }, 3],
    ]) : pose(null, { ...(f >= 410 ? laughP(f, 410, 5) : { expr: "neutral" }), mode: "sit", facing: toM(KE) }), { idx: 7 }));
  }
  const ctl: Ctl = {
    pend: 1.6 + 0.08 * Math.sin(f * 0.05), pm: f < 290 ? 0b000111 : 0b010000, bk: f < 290 ? 1 : 0, rr: 0, coffee: sm(f, 422, 440), slosh: f >= 404 && f < 440 ? Math.sin((f - 404) * 0.7) * (1 - (f - 404) / 36) : 0, ring: sm(f, 476, 500),
    board: lin(f, 628, 652), told: 0, truckOn: 0, signP: 2, signFly: 1,
  };
  const fx = fxs(
    f < 455 ? steamCard("garyMug", f < 476 ? [COAST[0] - 0.03, COAST[1] + 0.2, COAST[2] - 0.05] : [COAST[0] + 0.15, COAST[1] + 0.45, COAST[2]], 0.12, 0.55, 2) : null,
    blockedStamp(CARD_AT, f - 201), f >= 201 && f < 213 ? dustCard("stamp", CARD_AT, 0.22, 1 - (f - 201) / 12, 5) : null,
    f >= 319 && f < 331 ? dustCard("slap", [MH[0] - 0.4, FL + 0.85, MH[2] - 0.6], 0.3, 1 - (f - 319) / 12, 6) : null,
    f >= 351 && f < 361 ? dustCard("thunk", [7.05, FL + 0.45, -15.2], 0.25, 1 - (f - 351) / 10, 7) : null,
    f >= 422 && f < 444 ? splash("coffee", [COAST[0], COAST[1] + 0.06, COAST[2]], f - 422, 0.6) : [],
    f >= 548 && f < 581 ? [steamCard("fumeL", add3(hs(GS), -0.28, 0.3, 0), 0.16, 0.7, 3), steamCard("fumeR", add3(hs(GS), 0.28, 0.32, 0), 0.16, 0.7, 4)] : [],
  );
  const focus = follow(f, [[119, [0.5, 2.6, -12.4]], [156, head(DD), 20], [172, head(GD), 6], [205, CARD_AT, 8], [240, (g: number) => head(dwLeave(g), 1.15), 10],
    [276, (g: number) => head(mPos(Math.min(g, 300)).p), 14], [336, head(MH), 8], [393, hs(GS), 8], [464, COAST, 10], [551, hs(GS), 8], [610, head(MH), 24], [640, head(KB), 24], [668, head(MH), 20]]);
  return { ctl, cast, fx, focus, subj: f < 198 ? "gary" : f < 236 ? null : f < 262 ? "dwayne" : f < 385 ? "marge" : f < 455 ? "gary" : f < 545 ? null : f < 581 ? "gary" : f >= 622 && f < 648 ? "kevin" : "marge" };
};
KICKS.push([201 / 30, 0.25], [320 / 30, 0.18], [424 / 30, 0.12]);
lens3([[124, B_FS, 20], [196, B_MS, 8], [236, B_FS, 14], [300, B_FS, 12], [330, B_MS, 8], [385, B_MS, 8], [455, 6, 12], [545, B_CU, 8], [581, B_WS, 22]]);
KEY_PUNCH.push(15, 97, 169, 201, 320, 349, 424, 512, 556, 635);
