// =====================================================================================================================
// scenes 4-6: Ned's site in spring (the turn), the yard by spring (the queue), the office by summer (the ledger).

// ================================================= SCENE 4 (919-1049) NED'S SITE, SPRING
// Ned lays loaves at the east end of his wall (he stands past the end, x 19.95, and works along it); the plank with his
// mug of tea is in front of the wall's end. The wall shoots up 974-1006; the mug insert lands on "tea's" (1018) and its
// steam thickens until it fills the frame (1040-1053) for the dissolve into the yard.
const N_W: V3 = [18.85, 0, -5.88]   /* r44: right at the wall, so the loaf he lowers sits on its top course */   /* r35: Ned stands in front of his wall near its end (it read as two loose columns at the frame edge) */, WALL_TOP = (k: number) => 0.215 * 12 * k;
const MUGP: V3 = VIL.MUG;
const INS4: CamT = { pos: [MUGP[0] + 0.12, MUGP[1] + 0.28, MUGP[2] + 0.62], look: [MUGP[0], MUGP[1] + 0.16, MUGP[2]], fov: 40, roll: 0 };
/** r7: the tea steam closes over the lens (1036-1047) so the dissolve to the yard happens inside steam on both sides */
const steam4 = (f: number) => { if (f < 1024) return null; const c = INS4, d = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]], L = Math.hypot(d[0], d[1], d[2]);
  const a = sm(f, 1024, 1050), out: FxSpec[] = []; for (let i = 0; i < 3; i++) { const k = 0.28 + 0.08 * i; out.push(steamCard("st4" + i, [c.pos[0] + d[0] / L * k + (i - 1) * 0.05, c.pos[1] + d[1] / L * k + 0.02 * (f - 1034) / 10, c.pos[2] + d[2] / L * k], 0.42 + 0.1 * i, a, i + 1)); } return out; };
SHOT_CAMS[4] = () => {
  // r5: the CP3 site lock (Ned ~35%, mug + wall end left), then a crane up and back with the wall (974-1004)
  const SH9: CamT = { pos: [20.15, 1.22, -3.05], look: [18.73, 0.98, -6.31], fov: 47, roll: 0 };   /* r76i: tilted up - the sunlit dirt and a loose brick at the bottom-left corner out of frame */   /* r76: panned right onto the tea on its plank past the wall end; higher, looking down (the top half was bare sky and scaffold poles) */   /* r62: less sky (a third of the frame), Ned's feet off the bottom edge */   /* r61: LOW, up at Ned over his wall (reviewer: every shot at eye level) */   // r40: a medium on Ned and the wall top (the full figure left a quarter of bare dirt)   // r35: three-quarter along the wall: its courses run off left behind Ned   // r26i: Ned's loaf clear of the right edge   // r26c: the loaf in his hand clear of the right edge   // r26b: closer and lower (less bare ground)   // r25: face-on to the wall: its end and courses fill the left, Ned right; the trestle and mug sit off right until the insert
  const s9 = F(() => SH9, 919, 0.0016);
  const CR1: CamT = { pos: [19.9, 2.4, -1.4], look: [19.25, 0.85, -6.1], fov: 54, roll: 0 };
  const crane = (f: number): CamT => { const k = sm(f, 974, 1004); return { pos: lerp3(SH9.pos, CR1.pos, k), look: lerp3(SH9.look, CR1.look, k), fov: lerp(52, 54, k), roll: 0 }; };
  // the mug insert: mug ~45% of the frame width, its steam rising above it
  const INS = INS4;
  const sIns = F(() => INS, 1018, 0.0025);
  return [K(919, s9, 1, true), K(970, glideTo(s9, 970, crane, 980, 0), 1), K(1006, glideTo(crane, 1006, sIns, 1018, 0.1), 1)];
};
SHOT_ACTS[4] = (f, s) => {
  const fW = -0.75;   /* r43: three-quarter toward the wall end where he lays the loaf (he stared into the lens) */ void toward;
  // a lay cycle: lift a loaf from the pile (beside him), swing it onto the course, tap it down (every 10 f while it rises)
  const cyc = (g: number, per: number) => { const u = ((g % per) + per) % per / per; return u < 0.45 ? 0 : u < 0.7 ? (u - 0.45) / 0.25 : 1; };
  let ned: P;
  if (f < 974) ned = flow(f, [
    [919, { expr: "neutral", facing: fW, armR: AR.hipR, armL: AR.hipL, pocketsOut: true, tilt: 3 }],   /* r76i: pockets turned out from the start of "one broke builder" */
    // r13: carries the heavy loaf in front of his chest (overhead it crossed the back of his head)
    [932, { expr: "worry", facing: fW, armR: AR.shrugR, armL: AR.shrugL, pocketsOut: true, tilt: -3, sweat: 0.6, headTilt: 6 }, 6],   /* r76i (both reviewers: the torn purse read as a yellow octagon): empty pockets, an empty-handed shrug */
    // r39: on 945 he lowers the first loaf with his LEFT hand onto the wall top beside him (screen-left, where the wall runs);
    // the loaf course appears just after (946-952)
    // r42: the loaf level and resting ON the wall top (it hovered, tipped, in front of the wall's end), his body upright
    [939, { expr: "worry", sweat: 1, facing: fW, armR: AR.shrugR, armL: AR.shrugL, pocketsOut: true, tilt: 3, headTilt: -5 }, 5],
    [950, { expr: "smile", facing: fW, armL: [[-30, 26], [-46, 62]] as A2, armLFront: true, armR: [[22, 10], [4, 26]] as A2, armRFront: true, tilt: 0, noAutoTilt: true, mode: "brace", braceK: 0.45 }, 3],
    [958, { expr: "eureka", facing: fW, armR: [[30, -4], [52, -14]] as A2, armL: AR.hipL, headTilt: -6, tilt: -4 }, 4],                       // SHOCK 1: it's done already?
    [968, { expr: "eureka", facing: -fW || 1, armR: AB.carryR, armRFront: true, propR: "loaf", armL: AR.hipL }, 6],
  ]) as P;
  else if (f < 1006) { const c = cyc(f - 974, 10), up = Math.sin(c * Math.PI);
    ned = pose(null, { expr: "joy", facing: fW, armR: [[26, 8 - 22 * up], [44 + 10 * c, -8 - 30 * up]] as A2, armRFront: true, propR: c < 0.9 ? "loaf" : undefined, armL: [[-24, 10], [-36, 0]] as A2, tilt: 4 - 6 * up, headTilt: 3 * Math.sin(f * 0.6) }); }
  else ned = flow(f, [[1006, { expr: "joy", facing: -fW || 1, armR: AR.hipR, armL: AR.hipL, headBack: 0.3 }], [1014, { expr: "beam", facing: -fW || 1, armR: [[26, -10], [36, -34]] as A2, armL: AR.hipL }, 8]]) as P;
  const wallH = f < 974 ? lerp(0.34, 0.42, sm(f, 946, 952)) : lerp(0.42, 1, lin(f, 974, 1004));   // r24: four courses up already, so his wall reads at 945
  const tea = 1 + 1.6 * sm(f, 1030, 1049);
  return { ctl: { wallH, tea, spring: 1, cart: 0, stick: 1, cartX: 23.6, cartZ: -4.4, cartRot: 2.4 },
    cast: [C("ned", N_W, ned as FigOpts, { idx: 5 })],
    fx: fxs(steam4(f), f < 1018 ? [0, 1, 2, 3, 4].map((i) => { const ph = ((f * 0.018 + i / 5) % 1); return steamCard("mugS" + i, [MUGP[0] + 0.025 * Math.sin(f * 0.12 + i * 1.7) * ph, MUGP[1] + 0.12 + 0.3 * ph, MUGP[2]], 0.04 + 0.07 * ph, 0.5 * Math.min(1, ph * 6) * (1 - ph), i + 1); })   /* r76i (both reviewers): rising, fading wisps (one big card read as a blocky white smear) */ : null,   /* r76c: the tea steams in the medium (no steam read) */ f >= 947 && f < 957 ? dustCard("lay", [18.7, 1.0, -6.05], 0.25, 1 - (f - 947) / 10, 2) : null,
      f >= 974 && f < 1006 && (f - 974) % 10 < 6 ? dustCard("lay" + Math.floor((f - 974) / 10), [lerp(17.0, 19.0, ((f - 974) * 37 % 100) / 100), WALL_TOP(lerp(0.25, 1, lin(f, 974, 1004))) - 0.05, -6.0], 0.22, 0.8 - ((f - 974) % 10) / 8, 3) : null),
    focus: f < 1008 ? head(N_W) : [MUGP[0], MUGP[1] + 0.1, MUGP[2]], subj: f < 1008 ? "ned" : null };
};
KICKS.push([948 / 30, 0.12]);
KEY_PUNCH.push(958, 1001, 1159);
lens3([[919, 3.5, 1], [974, B_FS, 10], [1008, B_INS, 12]]);   /* r53: less blur on the site (the leaf clusters broke into a cyan pixel mosaic) */   /* r50: the site background less mushy in the medium shot */

// ================================================= SCENE 5 (1049-1109) THE YARD BY SPRING
// three builders queue at Amos's cart (coins, a barrow, pointing), Amos hands one a loaf, Silas peeks over his wall in
// shock, the taxman at the side sweats over his open ledger; push to the ledger (1088-1104) for the page dissolve.
// r13: a receding queue at four depths (screen x 18/40/56/71/89 %, no head on a head), seen from over the yard fence; Silas is not in this shot
const Q_AMOS: V3 = [1.6, 0, 3.5], Q_B1: V3 = [0.25, 0, 4.12], Q_B2: V3 = [0.66, 0, 2.0], Q_B3: V3 = [1.12, 0, 3.62],   /* r76i: the back builder between the two front heads, clear of both and of the loaf stack */   /* r76b: B3 in from the right edge, B1 off the loose brick */   /* r76: front-left / back-centre / middle-right under a higher lens, so the heads stagger up the frame (they stood in a row, two heads touching) */   /* r68b: staggered in depth, front / back-left / middle-right (the three heads overlapped in one row) */   /* r60: the two outer builders a step in, coins at the chest (raised, both coin hands were cut by the edges) */   /* r58: the third builder comes round the cart's right end (behind the first one his face was covered) */   /* r53: the builders crowd round the cart, Amos hands loaves across it (in a line the cart was off-frame and the heads overlapped) */ Q_B4: V3 = [-2.6, 0, 1.6], Q_SIL: V3 = [-2.45, 0, 3.0], Q_TAX: V3 = [-0.55, 0, 1.45];   /* r50: the line runs across the frame, stepping back (seen end-on the heads stacked like a totem, the third one behind the wall) */   /* r47: a real line in depth, one behind the other (it read as a cluster); the taxman in the gap, watching it */   // r44: THREE builders in one diagonal line back from the cart (narration: "three builders want loaves"; four in two files read as a crowd)
// r13: fit the queue + the taxman only (Silas peeks from the left edge): the builders read ~2x larger
const SH11: CamT = { pos: [0.66, 2.4, 6.9], look: [0.62, 0.86, 2.6], fov: 58, roll: 0 };   /* r76f: the queue higher in frame, the loaf clear of the caption */   /* r76e: in tighter (the lower quarter was empty paving) */   /* r76: a high angle down on the queue */   /* r69: tilted down (a third of the frame was sky) */   /* r68: inside the yard fence (its top rail was a dark blurred band across the bottom) */   /* r66: lower, a touch up at the coins and faces (fully low, the cart and beam hid their bodies) */   /* r57: lower and a touch tighter (a third of the frame was bare paving) */   /* r54: right a touch (Amos's brim met the right edge) and lower (less bare paving) */   /* r53: square on to the cart, the loaves in the middle of the frame */   /* r49: wider (Amos sat under the Shorts buttons, the corner props were cut) */   /* r48: panned left (the back of the line was cut by the left edge) */   /* r47 */   // r44: the line of three, heads stepping up and back   // r41: square on to the line, at eye height   // r36: higher, looking down the queue (two files, heads clear of each other)   // r26d: tilted up (less bare ground)   // r25: a little higher so the back heads clear the front ones
SHOT_CAMS[5] = () => {
  // opens inside the steam (the tea-steam dissolve, 8 f), holds while it clears (1.2 s), then a slow glide in on Amos handing a loaf
  const s11 = F(() => SH11, 1045, 0.0016);
  return [K(1045, s11, 1, true)];
};
/** the steam card in front of the scene-5 lens: thick through the dissolve, gone by 1066 */
const steam5 = (f: number) => { if (f > 1072) return null; const c = SH11 as Shot, d = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]], L = Math.hypot(d[0], d[1], d[2]);
  // r13: clears by 1068 so "three builders" (1067) shows the queue
  const a = 1 - sm(f, 1050, 1068), out: FxSpec[] = [];
  for (let i = 0; i < 3; i++) { const k = 0.9 + 0.25 * i, dx = (i - 1) * 0.18 + 0.02 * (f - 1045) * (i - 1); out.push(steamCard("st5" + i, [c.pos[0] + d[0] / L * k + dx, c.pos[1] + d[1] / L * k + 0.04 * (f - 1045) / 10, c.pos[2] + d[2] / L * k], 1.5 + 0.3 * i, a, i + 2)); }
  return out; };
SHOT_ACTS[5] = (f, s) => {
  const fA = (p: V3) => { const v = toward(5, s, f, p, Q_AMOS); return Math.sign(v || 1) * Math.max(0.7, Math.abs(v)); };   /* r43: a clear three-quarter turn to Amos (coins held up to the lens) */
  const amos = flow(f, [
    [1045, { expr: "smile", facing: toward(5, s, f, Q_AMOS, Q_B1), armL: [[-24, -2], [-44, -8]] as A2, armLFront: true, armR: AR.hipR, headTilt: 3 }],   /* r56: an open palm (the coin on it read as a cream bun) */   /* r55: he takes the coins, palm out over the cart (narration: "three builders want loaves"; a hand-over read as pointing at the stack) */   // hands it over (r21: pleased, not smug)
  ]) as P;
  const b1 = pose(null, { expr: "beam", facing: 0.6, armR: [[26, -12], [38, -36]] as A2, armRFront: true, propR: "loaf", armL: AR.hipL, tilt: 3, headTilt: -4 }) as P;   /* r76h: his loaf level on both hands */   /* r56: both arms round the loaf at his belly (a hug, not a loaf floating over the cart) */   /* r55: the first builder already hugs his loaf */
  const coinUp = (side: number, ph: number): A2 => [[side * 26, -4], [side * 48, -14 - 3 * Math.sin(f * 0.25 + ph)]] as A2;   // r44: coins held out toward Amos (held up by the face they were offered to the lens)
  const b2 = pose(null, { expr: "eureka", facing: -0.5, armR: [[16, 14], [12, 26 - 2 * Math.sin(f * 0.25)]] as A2,   /* r76c: coins in the hand away from the front builder (they hovered over his cap) */ armRFront: true, propR: "coin", armL: AR.hipL, tilt: 2 * Math.sin(f * 0.2) });   /* r71: coins raised on a visible arm (they floated at his side) */   /* r59: coins in his outer hand (between the heads they were wedged against the cap) */   /* r56: coins held high, clear of every head */
  const b3 = pose(null, { expr: "proud", facing: 0.5, armR: [[16, 14], [12, 26 - 2 * Math.sin(f * 0.25 + 1.3)]] as A2, armRFront: true, propR: "coin", armL: AR.hipL, headTilt: -4 });   /* r76i: coins nearer his body (the frame edge cut them) */   /* r76i: coins on his open side (on the left they touched the front builder's cap) */   /* r76h: coins held out on the open right side (on the left his hand hid behind the front builder's cap and the coins floated) */   /* r71: coins held up close by his head on his outer arm (behind the front builder the inner arm vanished) */   /* r69: coins in his inner hand (in the outer one they met the right edge) */   /* r55: an empty hand up, "me next" (his coins over the loaves read as a cream bun) */
  void Q_B4; const b4 = pose(null, { expr: "joy", facing: fA(Q_B4), armR: coinUp(1, 2.4), armRFront: true, propR: "coin", headTilt: -3, tilt: 2 * Math.sin(f * 0.17 + 1) });
  const silas = flow(f, [[1045, { expr: "neutral", facing: fA(Q_SIL), armR: [[26, 16], [40, 30]] as A2, armL: [[-26, 16], [-40, 30]] as A2 }], [1066, { expr: "shock", facing: fA(Q_SIL), armR: [[26, 16], [40, 30]] as A2, armL: [[-26, 16], [-40, 30]] as A2, hatLift: 0.6 }, 4]]) as P;   // SHOCK 2
  const tax = flow(f, [[1045, { expr: "worry", facing: fA(Q_TAX), armL: AB.ledgerL, armLFront: true, propL: "ledger", propK: 1, armR: AB.quillR, armRFront: true, propR: "quill", sweat: 1 }],
    [1084, { expr: "dismay", facing: toward(5, s, f, Q_TAX, [Q_TAX[0], 0, Q_TAX[2] + 3]), armL: [[-20, 8], [-28, -10]] as A2, armLFront: true, propL: "ledger", propK: 1, armR: AB.quillR, armRFront: true, propR: "quill", sweat: 1, headTilt: 6 }, 8]]) as P;
  void tax; void Q_TAX; void amos;
  return { ctl: { spring: 1, cart: 0, cartOn: 1, stack: 0, rain: 0, lantern: 0, loaf: 0, brick: 0, clay: 0, qfg: 0 },
    cast: [C("bld1", Q_B1, b1 as FigOpts, { idx: 51 }), C("bld2", Q_B2, b2, { idx: 52 }), C("bld3", Q_B3, b3, { idx: 53 })],   /* r58: the three builders and the cart fill the frame (with Amos four heads were packed into 60 % of the width) */   /* r53: the taxman left out (he was a tiny head behind the queue; the next shot is his ledger) */
    fx: fxs(steam5(f)),
    focus: head(Q_B1), subj: "bld1" };
};
lens3([[1045, 5, 1]]);   /* r47: the taxman behind readable (his sweat and blank ledger were soft) */   // r26b: the back of the queue soft (everything read equally sharp)

// ================================================= SCENE 6 (1109-1181) THE OFFICE BY SUMMER, NIGHT
// opens on the ledger spread (the page dissolve), the 1785 total is written on "half" (1159): £30 under £60; pull back
// to the taxman's face: worry -> dismay (shock 3) on "empty" (1166), the quill drops.
SHOT_CAMS[6] = () => {
  // hard cut 1103 (time jump "and by summer"): the taxman behind his desk (eyes ~40%), the open ledger below him; a quick
  // crane over the desk to the 1785 page lands on "ledger" (1146); the £30 total appears on "half" (1159); an 8-frame push
  // up to his face lands on "empty" (1166)
  // r15: centred on the ledger (it spans x -0.5..0.5; the 1785 page is the right half)
  const DESK: CamT = { pos: [0.1, 1.68, 0.56], look: [0.06, 1.05, -1.3], fov: 56, roll: 0 };   /* r76i (both reviewers): the ledger and its 1784 TOTAL above the caption band */   /* r76i: back a touch and tilted up - less desk, the ledger under 70 % */   /* r59: tilted up and in (the bottom fifth was bare desk) */   /* r53: in a little (a band of empty desk filled the bottom fifth) */   // r44: less empty desk front   // r26b: low, the sloped ledger faces the lens (48-70 %), the taxman behind it   // r26: pushed in (the desk front filled the lower third)   // r25: the ledger above the caption band   // r20: over the desk: the ledger fills the lower third (63-88 %), the inkwell fully out   // r12: higher, the whole ledger in frame (29-91 %)
  const PAGE: CamT = { pos: [0.15, 1.907, -0.426], look: [0.15, 1.02, -0.97], fov: 44, roll: 0 };   // r26c: the smaller ledger   // r26b: square to the sloped page   // r25: follows the ledger back on the desk   // r24: follows the smaller ledger's 1785 page
  const FACE: CamT = { pos: [0.05, 1.62, 0.25], look: [0.0, 1.3, -1.45], fov: 52, roll: 0 };
  const sD = F(() => DESK, 1103, 0.0008), sP = F(() => PAGE, 1146, 0.0012), sF = F(() => FACE, 1166, 0.002, [[1166, 0.006, 6]]);
  return [K(1103, sD, 1, true), K(1136, glideTo(sD, 1136, sP, 1146, 0.15), 1), K(1158, glideTo(sP, 1158, sF, 1166, 0), 1)];
};
SHOT_ACTS[6] = (f, s) => {
  const fC = toward(6, s, f, OFFICE.DESK, [0, 0, 2]);
  const tax = flow(f, [
    [1103, { expr: "worry", facing: fC, armR: [[24, 6], [38, 4]] as A2, armRFront: true, propR: "quill", armL: [[-22, 8], [-30, 14]] as A2, armLFront: true }],
    [1126, { expr: "worry", facing: fC, armR: [[24, 8], [36, 10]] as A2, armRFront: true, propR: "quill", armL: [[-24, 14], [-36, 30]] as A2, armLFront: true, headTilt: 4, sweat: 0.5 }, 8],   // writes
    [1152, { expr: "dismay", facing: fC, armR: [[24, 8], [36, 10]] as A2, armRFront: true, propR: "quill", armL: [[-24, 14], [-36, 30]] as A2, armLFront: true, sweat: 1, headTilt: 6 }, 6],
    [1163, { expr: "aghast", facing: fC, armR: [[26, 4], [40, 10]] as A2, armRFront: true, armL: [[-26, 4], [-40, 10]] as A2, sweat: 1, headBack: 0.3 }, 3],   // SHOCK 3: the quill drops
  ]) as P;
  return { ctl: { ledger: 1, coins: 1, candle: 1 },   /* r43: this year's £30 total shows from the start (the half-empty page read as unfinished) */   // r42: this year's stack stays at half (it grew back from 6 to 9 coins on "half")
    cast: [C("tax", [0, 0, -1.45], tax as FigOpts, { idx: 3 })],
    fx: fxs(f >= 1163 && f < 1173 ? sparkle("quill", [0.25, 0.9, -0.7], f - 1163, 0.15, "#ffffff") : null),
    focus: f >= 1140 && f < 1160 ? [0.15, 1.02, -0.97] : f < 1140 ? [0, 1.0, -0.98] : [0, 1.3, -1.45], subj: f >= 1140 && f < 1160 ? null : "tax" };
};
lens3([[1103, 9, 1], [1138, B_INS, 8], [1158, B_CU, 8]]);   // r44: the bookshelves soft behind the ledger   // r26c: the coins and the taxman both readable around the ledger
