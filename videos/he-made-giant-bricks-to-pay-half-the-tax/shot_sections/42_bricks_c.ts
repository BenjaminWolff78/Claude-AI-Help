// =====================================================================================================================
// scenes 7-9: the trick in the shed at night, the inn comparison and the Act, the payoff on Church Lane at sunset.

// ================================================= SCENE 7 (1181-1415) THE TRICK, NIGHT IN THE SHED
// Amos behind the bench under the lantern. 1181-1290: the scale "SAME CLAY": he sets one lump (the beam tips, 1236),
// then the other ("Same clay", 1262): level. 1290-1410: glide along the two same-size model walls; the chalk ticks 8
// under the normal wall (1300-1345) and 4 under the loaves (1350-1372); half-crowns drop 8 then 4 (1380-1400).
// 1400-1415: he lifts a loaf toward the lens (the shape match into the inn's tankard).
const AS: V3 = YARD.AMOS.slice() as V3; AS[0] = -0.03; AS[2] = -0.62;   // r20: a step left, nearer the (moved) scale
SHOT_CAMS[7] = () => {
  const SC: CamT = { pos: [-0.48, 1.42, 1.6], look: [-0.4, 1.28, -0.4], fov: 55, roll: 0 };   // r26b: the whole (bigger) scale in frame, left pan clear of the edge   // r26: lower and closer: Amos and the raised scale fill the frame, the bench only the bottom quarter   // r20: scale left (14-47 %), Amos 65 %, the model walls out right (solved with the orbit and the 1248 truck)   // r20: the whole scale, Amos and the whole slate in one frame   // r12: closer + level: the bench underside drops out (<15 %), Amos at 65 %, the lantern top-left            // r5: the CP3 shed lock (Amos, scale, slate, walls, the lantern)
  const sSC = F(() => SC, 1183, 0.0004);   // r20: f0 1183 turns the slow orbit the other way: the scale drifts away from the left edge, the model walls stay out right   // r12: a gentler creep keeps the scale and its sign whole
  const WL: CamT = { pos: [0.79, 1.0, 1.3], look: [0.68, 1.2, -0.05], fov: 51, roll: 0 };   /* r76: level, not looking up (the top quarter was empty ceiling) */   /* r59: lower and tilted up (the bench top was the bottom 27 %) */   /* r53: lower (a band of bare table filled the bottom fifth) */   /* r51: the tower bases above the bottom band */   /* r49: in (empty ceiling over the slate, a table band under the towers) */   // r44: the towers ~70 % wide (80 % at 48 deg)   // r38: only 6 deg off square (at 20 deg the loaf tower stood nearer and read taller)   // r36: turned 20 deg and pulled back (the head-on towers spanned 85 % and read as a diagram)   // r35: pushed in and tilted up: the towers stand on the bottom fifth   // r25: low, the bench top foreshortened (it filled the lower half)   // r25: the two towers 63 % wide, 29-62 % high, the chalk 8 and 4 above them   // r20: the walls 76 % wide above the caption, the slate over them            // the two model walls
  const SL: CamT = { pos: [0.64, 1.7, 1.25], look: [0.64, 1.66, -0.36], fov: 54, roll: 0 };   /* r55: follows the raised slate */   // r25: the raised slate, ~70 % wide         // the slate
  const COIN: CamT = { pos: [0.64, 1.12, 1.35], look: [0.64, 1.1, -0.05], fov: 48, roll: 0 };   // r25: low, the bench top foreshortened (it filled the lower half)            // r5: steep from above, Amos's head stays out of the top
  const LANT: CamT = { pos: [-0.23, 1.5, 1.7], look: [-0.48, 1.45, -0.8], fov: 52, roll: 0 };   // r12: follows the moved lantern (same 45 % / 25 % as the inn match)          // r5: the lantern (Amos has walked off right): matches the inn's lantern
  // r26b: the scale insert on "not clay / Same clay" (1238-1288): the whole balance ~65 % wide, the loaf against the two bricks
  const SINS: CamT = { pos: [-0.5, 1.0, 1.1], look: [-0.64, 1.2, -0.1], fov: 62, roll: 0 };   /* r76i (both reviewers): in on the pans (~70 % wide) and tilted down off the empty rafters */   /* r76i: past the bench's near edge (its blurred front took the lower quarter) */   /* r76i (both reviewers): back to ~62 % wide and lower (80 % broke the 70 % rule) */   /* r76i (both reviewers): in closer, the balance fills the bottom (blurred table and the mould box took the lower quarter) */   /* r76: back 13 % (the balance spanned 78 %) */   /* r59: low and closer (28 % bare bench under the balance) */   /* r55: the balance ~65 % wide (75 % at 49) */   /* r54: lower (30 % bare table), the lantern mostly out */   /* r53: the balance ~68 % wide (83 % at fov 45) */   /* r51: a slight angle, the lantern out of the top, the right pan clear of the Shorts buttons */   /* r48: the lantern out of the top (its bloom pulled the eye) */   /* r47: in on the pans (each was only ~20 % of the width) */   // r46b: (at table height the bench's front panel filled the lower third)   // r44: the balance ~67 % wide (at 46 deg it spanned 81 %)   // r42: pushed in on the pans (the crate and the empty table took the lower 30 %, the loaf and bricks only ~20 % wide each)   // r38: a touch wider (the pans spanned 76 %, the lantern cap clipped)   // r35: level with the pans, the crate at 80 % (the empty tabletop filled the lower third)   // r26j: the wider pans ~70 %, the spare loaf and bricks above the caption   // r26i: the lantern wholly out of the top   // r26e: the lantern off the top edge
  const sIns = F(() => SINS, 1250, 0.0012);
  return [K(1181, sSC, 1, true),
    K(1238, glideTo(sSC, 1238, sIns, 1250, 0.1), 1),
    K(1288, glideTo(sIns, 1288, F(() => WL, 1300, 0.0015), 1300, 0), 1),
    K(1312, glideTo(F(() => WL, 1300, 0.0015), 1312, F(() => SL, 1326, 0.0015), 1326, 0), 1),
    K(1374, glideTo(F(() => SL, 1326, 0.0015), 1374, F(() => COIN, 1384, 0.0015), 1384, 0), 1),
    K(1398, glideTo(F(() => COIN, 1384, 0.0015), 1398, F(() => LANT, 1408, 0.001), 1408, 0), 1)];
};
SHOT_ACTS[7] = (f, s) => {
  const fC = toward(7, s, f, AS, [AS[0], 0, AS[2] + 3]), fS = toward(7, s, f, AS, YARD.SCALE), fW = toward(7, s, f, AS, YARD.WALLS), fSl = toward(7, s, f, AS, YARD.SLATE);
  const amos = flow(f, [
    [1181, { expr: "calm", facing: fC, armR: AR.hipR, armL: AR.hipL }],
    [1204, { expr: "calm", facing: fS, armL: [[-30, 8], [-56, 16]] as A2, armLFront: true, propL: "loaf", armR: AR.hipR, tilt: 4 }, 8],
    [1214, { expr: "calm", facing: fS, armL: [[-30, 14], [-58, 28]] as A2, armLFront: true, armR: AR.hipR, tilt: 6 }, 5],            // lump 1 on (1236)
    [1226, { expr: "calm", facing: fS, armR: [[26, 8], [10, 18]] as A2, armRFront: true, propR: "brick", armL: AR.hipL, tilt: 3 }, 8],
    [1230, { expr: "calm", facing: fS, armR: [[-10, 14], [-40, 28]] as A2, armRFront: true, armL: AR.hipL, tilt: 5 }, 4],              // lump 2 on (1262): level
    [1252, { expr: "smile", facing: fS, armR: AR.hipR, armL: [[-28, -2], [-54, -6]] as A2, armLFront: true, headTilt: 4 }, 8],   // r26: turns to the level scale (he ignored it)   // r21: presents the level scale on "Same clay" (1262)
    [1296, { expr: "calm", facing: fW, armR: AB.pointR, armRFront: true, armL: AR.hipL }, 8],
    [1318, { expr: "calm", facing: fSl, armL: [[-26, -6], [-46, -16]] as A2, armLFront: true, armR: AR.hipR }, 8],                    // chalks on the slate
    [1376, { expr: "proud", facing: fC, armR: [[26, 6], [44, 16]] as A2, armRFront: true, armL: AR.hipL }, 8],                        // drops the coins
  ]) as P;
  // r5: he pockets the coins and walks off right (1396-1410) so the lantern match into the inn carries nobody
  // r12: he steps left out of the wall/slate insert (1284-1298), then walks off right behind it (1396-1410)
  const baseX = lerp(AS[0], 0.52, sm(f, 1238, 1252))   /* r39: clear of the widened scale insert (his arm poked in at the edge) */, stepX = lerp(baseX, -0.85, sm(f, 1284, 1298))   /* r36: further left (the turned tower insert caught his face at the edge) */,   /* r26b: he steps right, out of the scale insert */ exitK = sm(f, 1396, 1410), AS2: V3 = [lerp(stepX, 1.9, exitK), 0, AS[2]];
  const chalkL = Math.min(8, Math.floor(lin(f, 1300, 1346) * 8.99)), chalkR = Math.min(4, Math.floor(lin(f, 1350, 1373) * 4.99));
  const coinL = lerp(0, 8, lin(f, 1380, 1392)), coinR = lerp(0, 4, lin(f, 1392, 1400));
  const tip = f < 1218 ? 0 : f < 1233 ? -sm(f, 1218, 1226) : -1 + sm(f, 1233, 1246);   // r21: one lump on "taxed" (1218) tips it, the second on "not clay" (1240) levels it before "Same clay"
  return { ctl: { night: 1, lantern: 1, trick: 1, chalkL, chalkR, coinL, coinR, lumpL: f >= 1218 ? 1 : 0, lumpR: f >= 1233 ? 1 : 0, scaleTip: tip,
      demoLoaf: 0, lift: 0, loaf: 0, brick: 0, normMould: 0, cartOn: 0, clay: 0, mouldOn: 0 },
    cast: [C("amos", AS2, (f >= 1396 ? pose(null, { expr: "calm", facing: 1, mode: "walk", phase: (f - 1396) / 12 }) : amos) as FigOpts, { idx: 1 })],
    fx: fxs(f >= 1380 && f < 1400 && (f - 1380) % 3 === 0 ? sparkle("coin" + f, [YARD.WALLS[0] + (f < 1392 ? -0.15 : 0.15), 0.95, 0.12], 2, 0.12, "#fff2c8") : null),
    focus: f < 1238 ? [-0.38, 1.15, -0.2] : f < 1290 ? [-0.62, 1.17, -0.1] : f < 1314 ? [0.64, 1.08, -0.05] : f < 1376 ? [0.64, 1.62, -0.36] : f < 1398 ? [0.64, 1.0, 0.0] : [-0.55, 2.08, -0.8],
    subj: f < 1290 ? "amos" : null };
};
lens3([[1181, B_MS, 1], [1240, 12, 10], [1290, 10, 10], [1398, B_CU, 10]]);   // r44: depth falloff behind the scale and the towers (the shelves were as sharp as the subject)   // r26e: the moulds in front of the towers stay readable   // r24: the model walls stay crisp in their insert

// ================================================= SCENE 8 (1415-1713) THE INN, EVENING
// 1415-1524: the giant tankard (shape match), pull back to Amos at the bar, Bess, "ALE 1d A MUG"; Amos slaps a penny
// (1450); Bess pours and keeps pouring (1476-1514), smile -> worry; a drinker laughs at the back.
// 1524-1606: Bess measures the tankard with a yardstick and shrugs (1549); the taxman, furious, flips "EXCISE ACTS" and
// slams it shut (1600). 1606-1713: the crier pins the Act on the post (1636), the Act insert (1645-1690), the taxman
// gloats (1691) and walks out of the door into the sunset (1700-1713).
const I_AMOS: V3 = [-0.7, 0, -1.17],   /* r42: a step left, his brim clear of the tankard handle */ I_BESS: V3 = [0.97, 0.31, -2.63]   /* r71: her step lowered with the counter */   /* r47: in from the bar-shot edge */, I_TAX: V3 = [1.25, 0, -1.25], I_DRK: V3 = [-2.3, 0, 0.9], I_CRIER: V3 = [3.62, 0, -0.62], I_CRIER2: V3 = [3.3, 0, -1.6], I_DOOR: V3 = [3.75, 0, 1.2], I_OUT: V3 = [5.2, 0, 1.2], I_TAX2: V3 = [1.9, 0, -0.4];   // r5: the CP3 inn lock staging
SHOT_CAMS[8] = () => {
  // r5: opens on the inn's lantern (the lantern match from the shed) with the bar below it: hold; Amos walks in and slaps a
  // penny (1450); a glide back to the CP3 inn two-shot (1455-1478); the giant tankard goes on the bar (1507); Bess pours.
  const OPEN: CamT = { pos: [-0.1, 1.75, 0.6], look: [-0.35, 1.7, -1.9], fov: 52, roll: 0 };
  const BAR: CamT = { pos: [-1.45, 1.72, 0.4], look: [-0.3, 1.0, -2.2], fov: 60, roll: 0 };   /* r76i: from higher - the bar TOP with its mugs is the lower band, not the plank front */   /* r76i (reviewer): in close - Amos fills the frame to its foot (the bar front and floor took the lower 43 %) */   /* r76i (reviewer): pushed in - Amos 35 % wide, the floor out of frame (his head was 27 % under the mug and sign) */   /* r76f: from higher (the bar front was the lower third) and left (Amos was cut at the edge) */   /* r76e: in on Amos, the giant mug and Bess (empty ceiling above, bare bar front below) */   /* r76c: back a step and up (Bess was cut at the right edge, the bar front filled the lower quarter) */   /* r76b: tilted up and in (the floor and bar front were the lower 40 %) */   /* r67: up a touch (the bottom 40 % was bare planks), Bess further in from the edge */   /* r51: in a little (Amos read small) */   /* r47: back a little (the boater brim touched the left edge, the barmaid's shoulder the right) */   // r46: the boater clear of the left edge   // r44: in a little (the plank floor took the lower quarter)   // r42: a touch left (the boater touched the left edge after Amos stepped clear of the tankard)   // r35: Bess wholly inside the right edge, the boater inside the left   // r26b: lower and level (the floor filled the lower quarter)   // r25: wider: the boater clear of the tankard handle, Bess clear of the right edge   // r12: lower: less empty floor   // r6: higher, looking down: eyes at ~44%, less bar front
  const sOpen = F(() => OPEN, 1411, 0.0012), sBar = F(() => BAR, 1490, 0.0012);
  const DEB = frameTwo(head(I_TAX), [I_BESS[0], I_BESS[1] + 1.3, I_BESS[2]], -15, 64, 32);
  const sDeb = F(() => DEB, 1530, 0.0014);
  const POST = frameOn(head(I_CRIER), -70, 0.34, 40, 52, 0.15, 0.4);
  const ACT: CamT = { pos: [2.05, 1.6, 0.3], look: [3.95, 1.55, -0.3], fov: 40, roll: 0 };   // r10: the whole notice, about 60% of the width
  const GLOAT = frameOn(head(I_TAX2), -45, 0.34, 40, 52, 0.2, 0.4);   // r7: the camera path from the Act insert stays clear of him
  const DOORV: CamT = { pos: [2.5, 1.6, 1.2], look: [4.9, 1.45, 1.2], fov: 52, roll: 0 };
  return [K(1411, sOpen, 1, true),
    K(1452, glideTo(sOpen, 1452, sBar, 1490, 0.05), 1),   // a slow 38-frame travel (part of the calm comparison stretch 1411-1518)
    K(1518, glideTo(sBar, 1518, sDeb, 1530, 0.1), 1),
    K(1606, glideTo(sDeb, 1606, F(() => POST, 1618, 0.0015), 1618, 0.1), 1),
    K(1640, glideTo(F(() => POST, 1618, 0.0015), 1640, F(() => ACT, 1648, 0.0012), 1648, 0), 1),
    K(1678, glideTo(F(() => ACT, 1648, 0.0012), 1678, F(() => GLOAT, 1696, 0.0012), 1696, 0.05), 1),
    K(1698, glideTo(F(() => GLOAT, 1694, 0.0012), 1698, F(() => DOORV, 1708, 0.001), 1708, 0), 1)];
};
SHOT_ACTS[8] = (f, s) => {
  const fBess = toward(8, s, f, I_AMOS, I_BESS), fAm = toward(8, s, f, I_BESS, I_AMOS), fTx = toward(8, s, f, I_BESS, I_TAX);
  // Amos walks in after the lantern dissolve (1422-1442), slaps a penny (1450), heaves the giant tankard onto the bar (1494-1507)
  const aIn = sm(f, 1422, 1442), I_ABAR: V3 = [-0.8, 0, -1.6], aPos: V3 = f < 1508 ? lerp3([-1.9, 0, -0.85], I_AMOS, aIn) : lerp3(I_AMOS, I_ABAR, sm(f, 1508, 1515));   /* r62: after the thump he steps up to the bar and leans on his tankard (from the reaction angle he stood apart from it) */
  const amos = f < 1442 ? pose(null, { expr: "calm", facing: 1, mode: "walk", phase: (f - 1422) / 12 }) : flow(f, [
    [1442, { expr: "calm", facing: fBess, armR: [[26, 4], [44, 8]] as A2, armRFront: true, armL: AR.hipL }],
    [1446, { expr: "calm", facing: fBess, armR: [[26, -12], [40, -30]] as A2, armRFront: true, propR: "cash", armL: AR.hipL }, 3],
    [1450, { expr: "determined", facing: fBess, armR: AB.slamR, armRFront: true, armL: AR.hipL, tilt: 4 }, 2],                   // SLAP the penny
    [1470, { expr: "calm", facing: fBess, armR: [[26, 4], [44, 8]] as A2, armRFront: true, armL: AR.hipL, headTilt: 3 }, 8],
    [1490, { expr: "strain", facing: fBess, armR: [[24, 18], [34, 34]] as A2, armRFront: true, armL: [[-24, 18], [-34, 34]] as A2, armLFront: true, mode: "brace", braceK: 0.8 }, 4],   // grabs it from below
    [1500, { expr: "strain", facing: fBess, armR: [[24, -4], [38, -16]] as A2, armRFront: true, armL: [[-24, -4], [-38, -16]] as A2, armLFront: true, sweat: 0.6 }, 5],             // heaves it up
    [1507, { expr: "proud", facing: fBess, armR: [[28, -24], [52, -46]] as A2, armRFront: true, armL: AR.hipL, tilt: 9, headTilt: 5 }, 2],   /* r60: leans on his tankard */
    [1508, { expr: "proud", facing: fBess, mode: "walk", phase: (f - 1508) / 8, armR: AR.hipR, armL: AR.hipL }, 2],   /* r62: a step to the bar */
    [1512, { expr: "smug", facing: fBess, armR: [[34, -18], [58, -34]] as A2,   /* r76i (reviewers): an open hand presenting the tankard beside it, not over it */   /* r76i: the dot hand just short of the handle, in view (inside the loop the 3D handle hid it) */   /* r76c: up into the loop (it touched only the handle's bottom tip) */   /* r76: the dot inside the handle loop (it touched the outside of the handle) */   /* r72: reaching out past his brim to the handle (the hand hid behind his head) */   /* r69: the dot hand ON the handle (it sat on the tankard below it) */ armRFront: true, armL: AR.hipL, tilt: 9, headTilt: 6 }, 3],   /* r62: leaning on the bar, his hand on the tankard handle */   /* r38: hand up on the tankard (lower, it read as pointing away) */                                                           // THUNK on the bar, his hand stays on it (r20)                                                           // THUNK on the bar
    [1542, { expr: "calm", facing: toward(8, s, f, I_AMOS, I_TAX), armR: AR.hipR, armL: AR.hipL }, 10],   /* r62: later (he holds the tankard through "mug.") */
  ]) as P;
  const bess = flow(f, [
    [1411, { expr: "smile", facing: fAm, armR: AR.hipR, armL: AR.hipL }],
    [1512, { expr: "aghast", blink: 0, tilt: -8, headBack: 0.4, facing: fAm, armR: [[20, -2], [8, -22]] as A2, armRFront: true, armL: [[-22, 10], [-34, -6]] as A2, armLFront: true }, 5],   /* r76i: a shock recoil, hand to her cheek (a raised arm poked up behind the tankard like an antenna) */   /* r68: BOTH hands thrown up above her head (the near hand hid behind the tankard, the other only reached her chest) */   /* r59: a hand up to her cheek (the shock reads; her hip elbow was cut by the right edge) */   /* r56: she stops and stares at the giant tankard, jug at her side (the pour landed in a small mug, not his) */    // pours into it
    [1530, { expr: "worry", facing: fAm, armL: [[-26, -20], [-30, -52]] as A2, armLFront: true, armR: [[26, -20], [30, -52]] as A2, armRFront: true, sweat: 0.8 }, 4],   /* r59: the shock holds through "mug." (the swap blink to worry landed on 1520) */ // keeps pouring
    [1534, { expr: "neutral", facing: fAm, armR: [[-24, -10], [-36, -36]] as A2, armRFront: true, propR: "yardstick", armL: AR.hipL }, 8],            // measures it
    [1546, { expr: "calm", facing: fTx, armR: AR.shrugR, armL: AR.shrugL, headTilt: 5 }, 6],                                                            // shrugs (1549)
  ]) as P;
  const fBk = toward(8, s, f, I_TAX, INN.BOOK);
  const tax = flow(f, [
    [1520, { expr: "angry", facing: fBk, armR: [[26, 10], [40, 20]] as A2, armRFront: true, armL: AR.hipL }],
    [1556, { expr: "fury", facing: fBk, armR: [[26, 6], [44, 12]] as A2, armRFront: true, armL: [[-26, 6], [-44, 12]] as A2, armLFront: true, tilt: 5, sweat: 0.6 }, 6],   // flips the pages
    [1594, { expr: "fury", facing: fBk, armR: AB.stampUpR, armL: AB.stampUpR.map((p) => [-p[0], p[1]]) as A2, tilt: -3 }, 5],
    [1600, { expr: "fury", facing: fBk, armR: AB.slamR, armRFront: true, armL: AB.slamL, armLFront: true, tilt: 6 }, 2],                                            // SLAM
    [1612, { expr: "angry", facing: toward(8, s, f, I_TAX, I_CRIER), armR: AR.hipR, armL: AR.hipL }, 10],
    [1684, { expr: "tacheUp", facing: toward(8, s, f, I_TAX2, [0, 0, 0]), armR: [[26, -10], [36, -34]] as A2, armL: AR.hipL, headTilt: 4 }, 6],                   // gloats
  ]) as P;
  const shakeFury = f >= 1556 && f < 1606 ? 2.5 * Math.sin(f * 2.1) : 0;
  const crier = flow(f, [
    [1606, { expr: "stern", facing: toward(8, s, f, I_CRIER, INN.NOTICE), armL: [[-24, -6], [-40, -20]] as A2, armLFront: true, propL: "notice", armR: AR.hipR }],
    [1628, { expr: "strain", facing: toward(8, s, f, I_CRIER, INN.NOTICE), armR: AB.stampUpR, propR: "hammer", armL: [[-26, -8], [-44, -24]] as A2, armLFront: true }, 6],
    [1636, { expr: "proud", facing: toward(8, s, f, I_CRIER, INN.NOTICE), armR: [[26, -6], [46, -14]] as A2, armRFront: true, propR: "hammer", armL: AR.hipL }, 2],   // BANG
  ]) as P;
  // the taxman crosses to the door side while we read the Act (1644-1680, off screen), gloats (1684-1694), hurries out (1694-1708)
  const tPos: V3 = f < 1644 ? I_TAX : f < 1684 ? lerp3(I_TAX, I_TAX2, sm(f, 1644, 1680)) : f < 1692 ? I_TAX2 : f < 1704 ? lerp3(I_TAX2, I_DOOR, sm(f, 1692, 1704)) : lerp3(I_DOOR, I_OUT, sm(f, 1704, 1709));
  const tWalk = (f >= 1644 && f < 1680) || (f >= 1692 && f < 1709);
  const cPos: V3 = f < 1638 ? I_CRIER : lerp3(I_CRIER, I_CRIER2, sm(f, 1638, 1648));
  const cast: CastPlace[] = [];
  if (f >= 1422 && f < 1606) cast.push(C("amos", aPos, amos as FigOpts, { idx: 1 }));
  if (f < 1606) cast.push(C("bess", I_BESS, bess as FigOpts, { idx: 7 }));
  if (f >= 1518 && f < 1709) { const tIn = lerp3([2.7, 0, -0.4], I_TAX, sm(f, 1518, 1532)); cast.push(C("tax", f < 1532 ? tIn : tPos, f < 1532 || tWalk ? pose(null, { expr: f < 1532 ? "angry" : "tacheUp", facing: f < 1532 ? -1 : toward(8, s, f, tPos, f < 1694 ? I_TAX2 : I_OUT), mode: "walk", phase: (f - 1518) / 11 }) : { ...tax, tilt: ((tax.tilt as number) ?? 0) + shakeFury } as FigOpts, { idx: 3 })); }
  if (f >= 1600) cast.push(C("crier", cPos, (f >= 1638 ? pose(null, { expr: "proud", facing: -1, mode: "walk", phase: (f - 1638) / 12, propR: "hammer" }) : crier) as FigOpts, { idx: 8 }));
  return { ctl: { bigMug: 1, bigLift: f < 1494 ? -1 : sm(f, 1494, 1507), penny: f >= 1450 ? 1 : 0, ale: f > 1516 ? 1 : 0, act: f < 1636 ? 0 : sm(f, 1634, 1640), book: f >= 1556 && f < 1600 ? 1 : 0, door: sm(f, 1694, 1704) },
    fx: fxs(f >= 1450 && f < 1458 ? sparkle("penny", [INN.BIGMUG[0] - 0.15, 1.14, -1.72], f - 1450, 0.12, "#fff2c8") : null,
      f >= 1507 && f < 1517 ? dustCard("thunk", [INN.BIGMUG[0], 1.15, -1.8], 0.3, 1 - (f - 1507) / 10, 3) : null,
      f >= 1600 && f < 1610 ? clang("slam", [INN.BOOK[0], 1.2, INN.BOOK[2]], f - 1600, 0.35) : null, f >= 1636 && f < 1646 ? clang("bang", [INN.NOTICE[0] - 0.05, INN.NOTICE[1] + 0.2, INN.NOTICE[2]], f - 1636, 0.35) : null),
    cast, focus: f < 1455 ? [-0.25, 1.4, -1.85] : f < 1518 ? head(I_AMOS) : f < 1606 ? head(I_TAX) : f < 1640 ? head(I_CRIER) : f < 1684 ? [INN.NOTICE[0], INN.NOTICE[1], INN.NOTICE[2]] : head(I_TAX2),
    subj: f < 1455 ? null : f < 1518 ? "amos" : f < 1606 ? "tax" : f < 1640 ? "crier" : f < 1684 ? null : f < 1700 ? "tax" : null };
};
KICKS.push([1450 / 30, 0.12], [1507 / 30, 0.18], [1600 / 30, 0.3], [1636 / 30, 0.3]);
KEY_PUNCH.push(1218, 1233, 1366, 1400, 1450, 1480, 1507, 1549, 1600, 1636, 1679);
lens3([[1411, B_FS, 1], [1455, B_MS, 20], [1520, B_MS, 8], [1606, B_MS, 8], [1644, B_INS, 8], [1688, B_MS, 8], [1700, B_FS, 8]]);

// ================================================= SCENE 9 (1713-1860) CHURCH LANE, SUNSET (the payoff)
// out of the door's glare: one slow crane round to the taxman's new house of loaves beside the old cottage (house 1761);
// he walks to his door, holds his new 3-inch stick against one of his own bricks (1790-1820): the brick is twice the
// stick. SHOCK 4 on "Amos's loaves" (1825); Amos smirks on his cart by the cottage.
const L_TAX0: V3 = [-12.6, 0, -1.6], L_TAX1: V3 = [-15.2, 0, -3.06],   /* r60: a step off the wall foot (his feet were lost in the tufts and pebbles there) */ L_AMOS: V3 = [-16.1, 0, -2.96];   /* r72: a little further from the taxman (the boater brim touched his face) */   // r43: a step further from the taxman (his loaf covered the taxman's chin, the brims nearly touched)   // r38d: Amos a step nearer the lens than the taxman, so what he holds out draws in front of him   // r35: a step further from the taxman (the hat brims nearly touched)   // r26: in front of the gate (the pickets hid him), level with the taxman   // r12: Amos waits at the gate (in front of the pickets), nearer the lens   // r9: Amos waits by the taxman's door; the taxman stops in front of his garden wall   // r5: Amos waits by the tax house; the taxman arrives at his own wall
SHOT_CAMS[9] = () => {
  // r5: the CP3 lane-wide lock (the tax house of loaves + the old cottage, sunset) with a slow crane up (calm, 1717-1795),
  // then a glide in (1795-1815) to the two of them at the wall, landing 10 frames before "Amos's" (1825)
  // r7: starts on the taxman walking up (head above the caption band on "taxman's"), then rises and pulls back over the lane to the whole house by "house" (1761)
  const W0: CamT = { pos: [-11.2, 1.62, 0.3], look: [-13.4, 1.36, -2.0], fov: 52, roll: 0 }   /* r35: the taxman walks into the frame centre (he was jammed against the left edge) */   /* r20: closer, tilted up: less road */, W1: CamT = { pos: [-10.8, 1.05, -2.1], look: [-17.0, 1.72, -4.0], fov: 64, roll: 0 }   /* r76i (reviewer): the taxman at 40 % with the door and its plate at 79 % (he was squeezed to the left edge) */   /* r76d: down the lane, the new front raking away on the right, the cottage and the sunset sky beyond (it filled the frame square-on) */   /* r76b: back and narrower (the wide lens stretched the taxman's legs at the frame foot) */   /* r48: turned right: he walks toward his own door in the middle of the frame (he sat in the right-hand UI column) */   /* r47: in ~15 % (the taxman read small in the lower right over empty cobbles) */   /* r42: low behind his shoulder: he walks in big from the right (head ~18 % wide at 74 %, clear of the caption) and the whole loaf front towers over him (the far wide made him a speck under the caption) */   /* r41: a low three-quarter on the whole house with the old cottage beyond and the sunset sky behind (square-on read as a billboard) */   /* r40: tilted down: the taxman's face above the caption band, less bare sky */   /* r39: square on the whole new house - roof, 1785, sky and the lane (the angled crop cut the roof and the right side) */;   /* r53: tilted up and back a touch: the roofline and the sky over the house (the top third was bare facade) */   // r23: the crane ends on the seam where the old cottage (normal courses) meets the new house (loaf courses, two to one)
  const s0 = (f: number): Shot => { const k = sm(f, 1730, 1772); return { pos: lerp3(W0.pos, W1.pos, k), look: lerp3(W0.look, W1.look, k), fov: lerp(52, 40, k), roll: 0 }; };   // r76i: tighter on the taxman at his house   /* r76c: tighter at the end of the crane (the taxman was a fifth of the width) */   // r12: wider at the top so the low sun shows left of the house
  // r14: a medium on the taxman (head ~28 %, 64 %), Amos smaller at his door step (28 %), the EXCISE plaque between them
  const END: CamT = { pos: [-13.36, 1.0, -0.48], look: [-15.595, 1.36, -3.387], fov: 55, roll: 0 };   /* r62: LOW payoff two-shot, the house of loaves towering behind them */   /* r59: 0.4 m back and a touch left (Amos's brim at the left edge) */   /* r58: wider (both hats met the edges in turn) */   /* r54: half way back (r53 pushed Amos's brim off the left edge) */   /* r51: closer on the payoff faces */   // r38d: faces ~27 % wide, Amos nearer the lens than the taxman   // r38: pushed in and tilted down (faces ~30 % wide, less bare facade on top)   // r35: the raised loaf clear of the left edge   // r26f: tilted up (a blurred kerb filled the bottom)   // r20: closer and level: knees-up, less road   // r12: frameTwo(Amos 28 %, taxman 72 %), heads ~18 %, the EXCISE plaque between them   // r9: taxman right (front), EXCISE plaque between, Amos left by the door   // r7: the two heads 45% apart   // r6: Amos in front of the garden wall, the taxman inside it
  // r35: the crane wide holds to 1774, then glides down to the two of them (lands 1792 on "built"): Amos strolls in big, not a speck in the corner
  const sEnd = F(() => END, 1790, 0.0012, [[1825, 0.003, 6]]);   /* r53: a gentler push on "Amos's" */
  // r42: the insert on "entirely of" (1800-1824): his new 3-inch rule stood against the top loaf of his own garden wall - the
  // loaf ~57 % of the frame width, the rule reaching only three fifths of the way up it, both above the caption band
  const INS: CamT = { pos: [-14.40, 0.42, -2.72], look: [-14.79, 0.31, -3.815], fov: 47, roll: 0 };   /* r76i (both reviewers): one whole loaf beside the rule, both above the caption line (the frame split two loaves) */   /* r76i (reviewer): turned ~28 deg so the wall recedes, less ground */   /* r76i: the whole rule in frame */   /* r76i (both reviewers): pulled back - the whole loaf ~60 % wide with the loaf-tall rule (it filled 74 %, cut on every side) */   /* r76b: in a little - the loaf ~80 %, the broader rule ~40 % */   /* r76: wider - the whole loaf about 60 % with the rule, its neighbours soft (it filled 83 %) */   /* r62: closer and wider (the kerb near the lens was a grey slab in the corner) */   /* r60: further down (the strip was the house's stone sill behind the wall) */   /* r55: back out (at 33 the loaf filled 86 %) */   /* r54: tight on the loaf and the rule (they were a 28 % band) */   /* r49: a touch back up (the setts poked in at the bottom); r48: tilted down (a blank pale band ran across the top) */   // r46: the whole loaf (68 %) with the gauge block over its left half (31 %)   // r44: the whole loaf (~63 % wide) with the rule standing against its left end (cut by the edge it failed the insert rule)   // r43: in close: the rule ~27 % of the frame height and ~18 % wide, the loaf towering from 8 % to 50 % (at 57 % wide the rule was a sliver)
  const sIns = F(() => INS, 1800, 0.0009);
  /* r76i (both reviewers: "on 'built entirely of Amos's loaves' we need to see the whole house"): the whole house of loaves
   *  from the far pavement - roof ridge to garden wall, the pair small at the door - in place of the rule insert */
  const HOUSE: CamT = { pos: [-11.8, 1.1, 2.2], look: [-16.8, 4.0, -4.9], fov: 62, roll: 0 };   /* low, looking up: Amos above the caption band, less sky */   /* nearer and lower: the house fills the frame down to the caption band */
  const sHouse = F(() => HOUSE, 1800, 0.0012); void sIns;
  const WIDE: CamT = { pos: [-14.25, 1.0, -0.6], look: [-15.95, 1.3, -3.62], fov: 58, roll: 0 };   /* r76i (both reviewers): from the right - the TAX MAN plate on the door shows between the two heads (behind the taxman it read X MAN) */   /* r76d: from further down the lane - the front rakes away behind them (square-on it was a backdrop) */   /* r76b: higher and narrower, the pair nearer the frame centre (fov 74 at the cobbles stretched their legs into stilts) */   /* r76: panned left (Amos was jammed against the left edge, his arm cut) */   /* r70: a lens near the cobbles three metres off - heads about a sixth of the frame width at 40 %, the caption below their chests, the house of loaves towering behind (r69: the pair still read small over a band of road) */ /* r69: LOW 3/4 from the lane - the pair about a fifth of the frame at his wall, the house of loaves towering over them, the cottage beyond (r68b raised 3/4: the pair tiny over a blurred empty road) */ /* r68b: a raised 3/4 from the east end of the lane - the house of loaves fills the frame with the ordinary-brick cottage beyond it, the pair about 15 % tall at the wall (r68 high wide: 30 % bare road, the pair tiny) */   /* r67: HIGH and wide - the whole front, roof to pavement, the pair small below the caption band */   /* r66: the payoff pulls back low and wide - the whole house of loaves over the pair (reviewers: it was never shown whole) */
  const sWide = F(() => WIDE, 1838, -0.0008);
  return [K(1709, s0, 1, true), K(1772, glideTo(s0, 1772, sEnd, 1790, 0.12), 1), K(1800, sHouse, 1, true), K(1824, sEnd, 1, true), K(1826, glideTo(sEnd, 1826, sWide, 1838, 0.05), 1)];   // calm crane 1709-1774
};
SUN_REF[9] = 1713;   // r12: the sun is fixed from the opening camera (light ~170 deg world, raking the house front from the west)
SHOT_ACTS[9] = (f, s) => {
  const P_ST: V3 = [-14.55, 0, -3.06];   /* r76e: clear of the downpipe in the down-lane view */   /* r61: off the kerb onto the road (one foot read on the 8 cm kerb, the other lost behind it) */   /* r57: a step toward the door (his elbow met the right edge) */   /* r55: he stops beside his own door (clear of the PERCIVAL plaque) and shows the house off, 1752-1774 */
  const walking = f < 1786, standing = f >= 1752 && f < 1774;
  const tp: V3 = f < 1752 ? lerp3(L_TAX0, P_ST, lin(f, 1718, 1752)) : f < 1774 ? P_ST : f < 1786 ? lerp3(P_ST, L_TAX1, lin(f, 1774, 1786)) : L_TAX1;
  const fH = toward(9, s, f, L_TAX1, [-18.2, 0, -4.9]), fA = toward(9, s, f, L_TAX1, L_AMOS); const fAm0 = toward(9, s, f, L_AMOS, L_TAX1), fAm = Math.sign(fAm0 || 1) * Math.max(0.7, Math.abs(fAm0));   /* r76i: the pair turned 3/4 to each other */
  const tax = walking ? (standing ? pose(null, { expr: "proud", facing: 0.6, armR: [[26, 2], [48, 2]] as A2, armRFront: true, armL: [[-20, 8], [-28, 14]] as A2, armLFront: true, propL: "ledger", propK: 1, propsOver: true, tilt: -3, headBack: 0.15 })   /* r76i (reviewer): his excise ledger under the other arm - the tax man's own house */   /* r76f: turned to his house, presenting it (he pointed at empty air away from it) */   /* r76c: an open hand presenting his house (the raised arm repeated the same pose four times) */ : pose(null, { expr: "proud", facing: -1, mode: "walk", phase: (f - 1709) / 12 }))   /* r55: (the back view read as a grille face) */   /* r54: seen from behind, heading up to his own door (frontal he read as walking away from it) */   /* r47: full profile, mid-stride on the review beat (he still read as standing) */   /* r46: in profile toward his house (frontal he read as standing still) */
    : flow(f, [
      // r37: the rule goes down against his garden wall of loaves at his side (held up by his ear it never measured anything)
      // r38: the rule laid flat along the top of his garden wall of loaves (upright by his ear it measured nothing)
      // r40: the rule goes up against the loaf Amos holds out (at his belly it measured nothing): the loaf is twice the rule
      // r41: the 3-inch rule stands on the top loaf of his own garden wall, in his right hand: the loaf is twice the rule (in the
      // air by Amos's loaf it was longer than the loaf and read backwards)
      // r42: he bends and stands the rule against his own wall loaf (1790-1799); the insert shows it there (1800-1824); back on
      // the two-shot he has snatched it up again and stares at it
      [1786, { expr: "tacheUp", facing: fH, armR: [[24, 18], [32, 42]] as A2, armRFront: true, propR: "stick", armL: AR.hipL }],
      [1792, { expr: "tache", facing: fH, armR: [[24, 22], [36, 50]] as A2, armRFront: true, propR: f < 1799 ? "stick" : undefined, armL: AR.hipL, tilt: 10, headTilt: 10, mode: "brace", braceK: 0.6 }, 6],   // stands the rule on his own loaf
      [1820, { expr: "stare", facing: fH, armR: [[24, 10], [38, 22]] as A2, armRFront: true, propR: "stick", armL: AR.hipL, tilt: 4, headTilt: 6 }, 2],
      [1825, { expr: "aghast", facing: fA, armR: [[26, -20], [32, -46]] as A2, armRFront: true, propR: undefined,   /* r47: the rule flies out of his hand on the BOOM (held, it ended up a sliver by the frame edge) */ armL: [[-14, 20], [-16, 44]] as A2, sweat: 1, hatLift: 0.2, headBack: 0.2 }, 3],   // SHOCK 4
      [1829, { expr: "aghast", facing: Math.sign(fA || -1) * Math.max(0.7, Math.abs(fA)), armR: [[22, 16], [18, 36]] as A2, armRFront: true, propR: undefined, armL: [[-14, -2], [-4, -28]] as A2, armLFront: true, tilt: 8,   /* r76i (both reviewers): turned 3/4 to Amos, one hand up in shock, the other at his hip - both arms read */   /* r76h: arms hanging straight at his sides (one crossed his brass door plate) */   /* r76f: slumped, arms hanging (the raised arm read as a cheerful wave on "Too late") */   /* r76b: hand on his hip (the raised hand hid behind his head, a stub) */   /* r74: the near hand up by his own head, clear of Amos; r73: both hands thrown up (the pointing hand floated by Amos's hip) */   /* r55: the pointing hand stops short of the loaf (it ended inside it) */   /* r50: the far hand up by his face in shock (hanging it ran off the right edge) */   /* r48: he points at the loaf (his arm pointed off-frame at nothing) */ sweat: 1, hatLift: 0 }, 6],   /* r38: his near arm hangs (on the hip it crossed the loaf) */
    ]) as P;   /* r47: at 1834 the rule comes in against his coat (held out it was a sliver at the right edge) */
  // r21: Amos holds up one normal brick beside the taxman's wall of loaves (the size reads at a glance), then tips his hat
  // r26c: Amos strolls over from the cottage (1760-1806) instead of standing tiny in the corner of the crane wide
  const A_FROM: V3 = [-17.0, 0, -3.0], aPos: V3 = f < 1772 ? A_FROM : lerp3(A_FROM, L_AMOS, sm(f, 1772, 1794));   // r37: he walks in from the left edge of the two-shot (in the reveal wide he was a speck under the caption)
  // r26i: the payoff loaf is held UP beside his face on the side away from the taxman (it hid behind his coat), lit and clear
  // r36: the loaf rides in his RIGHT hand, held out toward the taxman against the brick wall (on the left it ran off the
  // frame edge, across the chest it vanished into his apron); the left hand tips the hat
  const HOLD: A2 = [[22, 2], [32, -6]] as A2, SHOW: A2 = [[22, -12], [30, -30]] as A2;   /* r50: the payoff loaf up against the sunlit wall (at chest height it sat on the dark door) */   // r38c: held up overhead, above the gap between the two hats (at the shoulder it touched the taxman's face)   // r38: shoulder height in the gap, the lit brick wall behind it (low, it sat on the dark door)   // r37: low and close, in the gap between them (raised, it went behind the taxman's head)
  const amosF = flow(f, [[1709, { expr: "calm", facing: toward(9, s, f, L_AMOS, tp), armR: AR.hipR, armL: AR.hipL }],
    [1794, { expr: "smile", facing: toward(9, s, f, L_AMOS, L_TAX1), armR: HOLD,   /* r39: from the end of his walk (at 1800 the loaf blinked out for six frames) */ armRFront: true, propR: "loaf", armL: AR.hipL }, 1],
    [1806, { expr: "smile", facing: toward(9, s, f, L_AMOS, L_TAX1), armR: AR.hipR, armL: AR.hipL }, 8],   /* r57: (during the insert) the loaf is on the wall now */
    [1826, { expr: "beam", facing: fAm, armL: AR.hipL, armR: [[18, 16], [6, 26]] as A2, armRFront: true, headTilt: 6, headBack: 0.4, tilt: -5 }, 6],   /* r76g: his near hand on his belly (it met the taxman's hand on a railing spike) */   /* r76c: both fists on his hips, leaning back smug (his raised arm mirrored the taxman's) */   /* r74: his near arm points straight up at the house (the far arm ran off the left edge) */   /* r73: pointing straight up at the house (out to the side it reached the frame edge) */   /* r70: his free hand points up at the house (the hip ring crossed the railing spikes) */   /* r57: hands on hips, the loaf put down (held, it read half the size of his wall and floated; the raised hand met the left edge) */   /* r51: the loaf comes down to his chest, clear of the taxman's face (raised it sat behind his head in the closer shot) */   // tips his hat
    [1846, { expr: "smile", facing: fAm, armL: AR.hipL, armR: [[18, 16], [6, 26]] as A2, armRFront: true, headTilt: 6, headBack: 0.4, tilt: -4 }, 8]]) as P;
  const amos = f >= 1772 && f < 1794 ? pose(null, { expr: "calm", facing: toward(9, s, f, A_FROM, L_AMOS), mode: "walk", phase: (f - 1772) / 12, armR: HOLD, armRFront: true, propR: "loaf", armL: AR.hipL }) : amosF;
  return { ctl: { stick: 0, pile: 0,   /* r70: no lane pallet (its corner was a stray brown block at the edge of f_1766) */ rule: 0,   /* r76i: no rule insert any more (the whole-house wide takes 1800-1824) */ ruleTilt: 0.14 * (1 - sm(f, 1799, 1808)), lamps: 0, cartX: -40, cartZ: -3.3, cartRot: 0.3, spring: 0, wallH: 1, tea: 0 },   /* r68b: Amos's cart of loaves parked in the lane foreground of the closing wide (the near road was a bare blurred band) */
    cast: [...(f >= 1717 && !(f >= 1800 && f < 1824) ? [C("tax", tp, tax as FigOpts, { idx: 3 })] : []),   /* r42: off the insert (his hand poked in at its top-left) */ ...(f >= 1772 ? [C("amos", aPos, amos as FigOpts, { idx: 1 })] : []),
      C("bv5", lerp3([-26.5, 0, -0.9], [-19.0, 0, -0.15], lin(f, 1709, 1860)),   /* r68: keeps strolling through the reveal wide (she stopped at 1810 and walked on the spot) */ pose(null, { expr: "smile", facing: 1, mode: "walk", phase: (f - 1709) / 14 }), { idx: 71 })],   // r10: a villager strolling far down the lane
    fx: fxs(f >= 1825 && f < 1836 ? clang("boom", [L_TAX1[0] - 0.4, 1.95, L_TAX1[2] + 0.05], f - 1825, 0.42) : null),
    // r18: focus on the walking taxman in the opening (the wall was sharper than him), the house in the crane wide, then him again
    focus: f < 1778 ? head(tp) : f >= 1800 && f < 1824 ? [-14.7, 0.5, -3.81] : f >= 1832 ? [-15.6, 1.9, -3.6] : head(L_TAX1), subj:   /* r67: the reveal focuses on the house front */ f < 1778 ? "tax" : f >= 1800 && f < 1824 ? null : "tax" };
};
KICKS.push([1825 / 30, 0.35]);
KEY_PUNCH.push(1838);
lens3([[1709, 13, 1], [1734, 5, 16], [1778, 13, 14], [1800, 3.5, 1], [1824, 13, 1], [1828, 3.5, 8]]);   /* r69: the closing wide nearly sharp (at 13 it read as a tilt-shift miniature with a blurred road band) */   // r42: the rule insert sharp on the loaf, the house behind soft   // r40: the A wall soft behind the two-shot   // r35: the wall soft behind the walking taxman (it was as sharp as his face)   // r26i: the busy A wall soft behind the actors   // r26f: the A wall behind the payoff stays readable   // r26: some depth in the crane wide (it was sharp everywhere)   // r12: the crane wide keeps the low sun crisp   // r8: the wide stays sharp to the near ground

// r42: held fired bricks and loaves a shade darker in the bright day scenes, where the card lift pushed them to orange
// (measured 234,98,56 held against 138,64,59 on the bench in the hook)
const PROP_DIM_BY_SCENE: Record<number, number> = { 1: 0.12, 4: 0.0 };   /* r53: the held loaves read near-black (the cards now lose 20% in daylight and the faces lost their mauve tint) */
for (const [k, d] of Object.entries(PROP_DIM_BY_SCENE)) { const id = +k, fn = SHOT_ACTS[id]; if (!fn) continue; SHOT_ACTS[id] = (f, s) => { const r = fn(f, s); return { ...r, cast: (r.cast ?? []).map((c) => ({ ...c, o: { ...c.o, propDim: d } })) }; }; }
